import { NextResponse } from "next/server";
import { convertCurrencyAmount } from "@/lib/currency";
import {
  buildImportPreview,
  createTransactionFingerprint,
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
      return previewImport(request, context.workspace.id, context.workspace.currency);
    }

    return confirmImport(request, context.user.id, context.workspace.id, context.workspace.currency);
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
  const duplicateFingerprints = await getDuplicateFingerprints(workspaceId);
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
) {
  const body = await request.json();
  const rows = Array.isArray(body.rows) ? (body.rows as ImportPreviewRow[]) : [];
  const readyRows = rows.filter((row) => row.status === "ready" && row.errors.length === 0);

  if (readyRows.length === 0 || readyRows.length > 500) {
    return NextResponse.json(
      { error: "Confirm between 1 and 500 valid transactions." },
      { status: 400 },
    );
  }

  const duplicateFingerprints = await getDuplicateFingerprints(workspaceId);
  const data = readyRows
    .map((row) => {
      const fingerprint =
        row.fingerprint ||
        createTransactionFingerprint({
          amount: row.convertedAmount,
          category: row.category,
          date: row.date,
          note: row.note,
          type: row.type,
        });

      if (duplicateFingerprints.has(fingerprint)) {
        return null;
      }

      duplicateFingerprints.add(fingerprint);

      return {
        amount: row.convertedAmount,
        category: row.category.trim(),
        currency: baseCurrency,
        date: new Date(row.date),
        exchangeRate: row.amount > 0 ? row.convertedAmount / row.amount : 1,
        importFingerprint: fingerprint,
        note: row.note?.trim() || null,
        originalAmount: row.amount,
        originalCurrency: row.currency,
        type: row.type,
        userId,
        workspaceId,
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

async function getDuplicateFingerprints(workspaceId: string) {
  const prisma = getPrisma();
  const transactions = await prisma.transaction.findMany({
    where: { workspaceId, importFingerprint: { not: null } },
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
