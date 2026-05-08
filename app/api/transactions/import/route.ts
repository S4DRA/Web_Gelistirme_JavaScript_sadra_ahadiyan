import { parse } from "csv-parse/sync";
import { TransactionType } from "@prisma/client";
import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getActiveWorkspaceForRequest } from "@/lib/workspace";

type TransactionImportRow = {
  amount?: string;
  category?: string;
  date?: string;
  type?: string;
};

function normalizeRow(row: TransactionImportRow) {
  const type = row.type?.trim().toLowerCase();
  const amount = Number(row.amount);
  const category = row.category?.trim();
  const date = new Date(row.date ?? "");

  if (type !== TransactionType.income && type !== TransactionType.expense) {
    return { error: "Type must be income or expense." };
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Amount must be greater than 0." };
  }

  if (!category) {
    return { error: "Category is required." };
  }

  if (Number.isNaN(date.getTime())) {
    return { error: "Date must be valid." };
  }

  return {
    data: {
      amount,
      category,
      date,
      type,
    },
  };
}

export async function POST(request: Request) {
  try {
    const context = await getActiveWorkspaceForRequest(request);

    if (!context) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = await request.json();
    const csv = typeof body.csv === "string" ? body.csv : "";

    if (!csv.trim()) {
      return NextResponse.json({ error: "Paste CSV data first." }, { status: 400 });
    }

    const rows = parse(csv, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as TransactionImportRow[];

    if (rows.length === 0 || rows.length > 500) {
      return NextResponse.json(
        { error: "Import between 1 and 500 transactions." },
        { status: 400 },
      );
    }

    const normalizedRows = rows.map(normalizeRow);
    const invalidRowIndex = normalizedRows.findIndex((row) => "error" in row);

    if (invalidRowIndex >= 0) {
      const invalidRow = normalizedRows[invalidRowIndex] as { error: string };

      return NextResponse.json(
        { error: `Row ${invalidRowIndex + 2}: ${invalidRow.error}` },
        { status: 400 },
      );
    }

    const prisma = getPrisma();
    const created = await prisma.transaction.createMany({
      data: normalizedRows.map((row) => {
        const data = "data" in row ? row.data : null;

        if (!data) {
          throw new Error("Invalid import row.");
        }

        return {
          amount: data.amount,
          category: data.category,
          date: data.date,
          type: data.type,
          userId: context.user.id,
          workspaceId: context.workspace.id,
        };
      }),
    });

    return NextResponse.json({ imported: created.count });
  } catch (error) {
    console.error("Failed to import transactions:", error);

    return NextResponse.json(
      { error: "Failed to import transactions." },
      { status: 500 },
    );
  }
}
