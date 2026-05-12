import { NextResponse } from "next/server";
import { RecurrenceFrequency, TransactionType } from "@prisma/client";
import { normalizeCurrency } from "@/lib/currency";
import { getPrisma } from "@/lib/prisma";
import { getActiveWorkspaceForRequest } from "@/lib/workspace";

function formatRecurring(item: {
  id: string;
  name: string;
  type: string;
  amount: { toString(): string };
  category: string;
  currency: string;
  frequency: string;
  nextDate: Date;
  active: boolean;
  financeType?: string;
}) {
  return {
    id: item.id,
    name: item.name,
    type: item.type,
    amount: Number(item.amount.toString()),
    category: item.category,
    currency: item.currency,
    frequency: item.frequency,
    nextDate: item.nextDate.toISOString(),
    active: item.active,
    financeType: item.financeType,
  };
}

export async function GET(request: Request) {
  try {
    const context = await getActiveWorkspaceForRequest(request);

    if (!context) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const prisma = getPrisma();
    const items = await prisma.recurringTransaction.findMany({
      where: { financeType: context.financeType, workspaceId: context.workspace.id },
      orderBy: { nextDate: "asc" },
    });

    return NextResponse.json(items.map(formatRecurring));
  } catch (error) {
    console.error("Failed to load recurring transactions:", error);

    return NextResponse.json(
      { error: "Failed to load recurring transactions." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const context = await getActiveWorkspaceForRequest(request);

    if (!context) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const category = typeof body.category === "string" ? body.category.trim() : "";
    const amount = Number(body.amount);
    const nextDate = new Date(body.nextDate);
    const currency = normalizeCurrency(body.currency, context.workspace.currency);

    if (!name || !category) {
      return NextResponse.json(
        { error: "Name and category are required." },
        { status: 400 },
      );
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0." },
        { status: 400 },
      );
    }

    if (Number.isNaN(nextDate.getTime())) {
      return NextResponse.json({ error: "Next date is invalid." }, { status: 400 });
    }

    if (
      body.type !== TransactionType.income &&
      body.type !== TransactionType.expense
    ) {
      return NextResponse.json({ error: "Type is invalid." }, { status: 400 });
    }

    if (!Object.values(RecurrenceFrequency).includes(body.frequency)) {
      return NextResponse.json({ error: "Frequency is invalid." }, { status: 400 });
    }

    const prisma = getPrisma();
    const item = await prisma.recurringTransaction.create({
      data: {
        workspaceId: context.workspace.id,
        financeType: context.financeType,
        name,
        type: body.type,
        amount,
        category,
        currency,
        frequency: body.frequency,
        nextDate,
      },
    });

    return NextResponse.json(formatRecurring(item), { status: 201 });
  } catch (error) {
    console.error("Failed to create recurring transaction:", error);

    return NextResponse.json(
      { error: "Failed to create recurring transaction." },
      { status: 500 },
    );
  }
}
