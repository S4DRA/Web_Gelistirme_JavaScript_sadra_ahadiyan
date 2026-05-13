import { NextResponse } from "next/server";
import { TransactionType } from "@prisma/client";
import { convertCurrencyAmount, normalizeCurrency } from "@/lib/currency";
import {
  cleanOptionalNote,
  cleanShortText,
  isValidShortText,
  parsePositiveMoney,
} from "@/lib/financial-validation";
import {
  buildImportPreview,
  createTransactionFingerprint,
  normalizeImportDateValue,
  type ImportPreviewRow,
  parseImportFile,
} from "@/lib/transaction-import";
import { getPrisma } from "@/lib/prisma";
import { getActiveWorkspaceForRequest } from "@/lib/workspace";

export async function POST(request: Request) {
  try {
    const context = await getActiveWorkspaceForRequest(request);

    if (!context) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      return previewImport(
        request,
        context.workspace.id,
        context.workspace.currency,
        context.financeType,
      );
    }

    return confirmImport(
      request,
      context.user.id,
      context.workspace.id,
      context.workspace.currency,
      context.financeType,
    );
  } catch (error) {
    console.error("Failed to import transactions:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to import transactions.",
      },
      { status: 500 },
    );
  }
}

async function previewImport(
  request: Request,
  workspaceId: string,
  baseCurrency: string,
  financeType: "personal" | "business",
) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Upload a CSV or Excel file first." }, { status: 400 });
  }

  const rows = parseImportFile(
    Buffer.from(await file.arrayBuffer()),
    file.name,
    file.type,
  );
  const duplicateFingerprints = await getDuplicateFingerprints(workspaceId, financeType);
  const previewRows = await buildImportPreview({
    baseCurrency,
    convertAmount: (amount, currency) =>
      convertCurrencyAmount(amount, currency, baseCurrency),
    duplicateFingerprints,
    rows,
  });

  return NextResponse.json({
    baseCurrency,
    rows: previewRows,
    summary: summarizeRows(previewRows),
  });
}

async function confirmImport(
  request: Request,
  userId: string,
  workspaceId: string,
  baseCurrency: string,
  financeType: "personal" | "business",
) {
  const body = await request.json();
  const rows = Array.isArray(body.rows) ? (body.rows as ImportPreviewRow[]) : [];
  const readyRows = rows.filter(
    (row) =>
      row &&
      row.status === "ready" &&
      (!Array.isArray(row.errors) || row.errors.length === 0),
  );

  if (readyRows.length === 0 || readyRows.length > 500) {
    return NextResponse.json(
      { error: "Confirm between 1 and 500 valid transactions." },
      { status: 400 },
    );
  }

  const duplicateFingerprints = await getDuplicateFingerprints(workspaceId, financeType);
  const normalizedRows = readyRows.map((row) =>
    normalizeConfirmedImportRow(row, baseCurrency),
  );
  const invalidRows = normalizedRows.filter((row) => row.errors.length > 0);

  if (invalidRows.length > 0) {
    return NextResponse.json(
      {
        error: "Some confirmed transactions are no longer valid.",
        invalidRows: invalidRows.map((row) => ({
          errors: row.errors,
          rowNumber: row.rowNumber,
        })),
      },
      { status: 400 },
    );
  }

  const data = normalizedRows
    .map((row) => {
      if (!row.data) {
        return null;
      }

      const fingerprint = createTransactionFingerprint({
        amount: row.data.convertedAmount,
        category: row.data.category,
        date: row.data.date,
        note: row.data.note,
        type: row.data.type,
      });

      if (duplicateFingerprints.has(fingerprint)) {
        return null;
      }

      duplicateFingerprints.add(fingerprint);

      return {
        amount: row.data.convertedAmount,
        category: row.data.category,
        currency: baseCurrency,
        date: new Date(`${row.data.date}T00:00:00.000Z`),
        exchangeRate:
          row.data.originalAmount > 0
            ? row.data.convertedAmount / row.data.originalAmount
            : 1,
        importFingerprint: fingerprint,
        note: row.data.note,
        originalAmount: row.data.originalAmount,
        originalCurrency: row.data.originalCurrency,
        type: row.data.type,
        userId,
        workspaceId,
        financeType,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  if (data.length === 0) {
    return NextResponse.json({ imported: 0, skipped: readyRows.length });
  }

  const prisma = getPrisma();
  const created = await prisma.transaction.createMany({ data });

  return NextResponse.json({
    imported: created.count,
    skipped: readyRows.length - created.count,
  });
}

function normalizeConfirmedImportRow(row: ImportPreviewRow, baseCurrency: string) {
  const errors: string[] = [];
  const rowNumber = Number.isFinite(Number(row.rowNumber)) ? Number(row.rowNumber) : null;
  const originalAmount = parsePositiveMoney(row.amount);
  const convertedAmount = parsePositiveMoney(row.convertedAmount);
  const category = cleanShortText(row.category);
  const date = normalizeImportDateValue(row.date);
  const note = cleanOptionalNote(row.note);
  const originalCurrency = normalizeCurrency(row.currency, baseCurrency);
  const type =
    row.type === TransactionType.income || row.type === TransactionType.expense
      ? row.type
      : null;

  if (originalAmount === null) {
    errors.push("Amount must be between 0.01 and 999,999,999.99.");
  }

  if (convertedAmount === null) {
    errors.push("Converted amount must be between 0.01 and 999,999,999.99.");
  }

  if (!isValidShortText(category)) {
    errors.push("Category is required and must be 80 characters or fewer.");
  }

  if (!date) {
    errors.push("Date must be valid.");
  }

  if (!type) {
    errors.push("Type must be income or expense.");
  }

  return {
    data:
      errors.length === 0 && originalAmount !== null && convertedAmount !== null && date && type
        ? {
            category,
            convertedAmount,
            date,
            note,
            originalAmount,
            originalCurrency,
            type,
          }
        : null,
    errors,
    rowNumber,
  };
}

async function getDuplicateFingerprints(
  workspaceId: string,
  financeType: "personal" | "business",
) {
  const prisma = getPrisma();
  const transactions = await prisma.transaction.findMany({
    where: { financeType, importFingerprint: { not: null }, workspaceId },
    select: { importFingerprint: true },
  });

  return new Set(
    transactions
      .map((transaction) => transaction.importFingerprint)
      .filter((fingerprint): fingerprint is string => Boolean(fingerprint)),
  );
}

function summarizeRows(rows: ImportPreviewRow[]) {
  return rows.reduce(
    (summary, row) => {
      summary[row.status] += 1;
      return summary;
    },
    { duplicate: 0, invalid: 0, ready: 0 },
  );
}
