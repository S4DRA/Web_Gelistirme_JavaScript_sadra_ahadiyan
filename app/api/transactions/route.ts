import { connection, NextResponse } from "next/server";
import { TransactionType } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { getActiveWorkspaceForRequest } from "@/lib/workspace";

function formatTransaction(transaction: {
  id: string;
  type: string;
  amount: { toString(): string };
  category: string;
  date: Date;
  userId: string;
  workspaceId: string | null;
}) {
  return {
    id: transaction.id,
    userId: transaction.userId,
    type: transaction.type,
    amount: Number(transaction.amount.toString()),
    category: transaction.category,
    date: transaction.date.toISOString(),
    workspaceId: transaction.workspaceId,
  };
}

export async function GET(request: Request) {
  try {
    await connection();

    const prisma = getPrisma();
    const context = await getActiveWorkspaceForRequest(request);

    if (!context) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const transactions = await prisma.transaction.findMany({
      where: { workspaceId: context.workspace.id },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(transactions.map(formatTransaction));
  } catch (error) {
    console.error("Failed to fetch transactions:", error);

    return NextResponse.json(
      { error: "Failed to fetch transactions." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const prisma = getPrisma();
    const context = await getActiveWorkspaceForRequest(request);

    if (!context) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = await request.json();
    const { type, amount, category, date } = body;

    if (type !== TransactionType.income && type !== TransactionType.expense) {
      return NextResponse.json(
        { error: "Type must be 'income' or 'expense'." },
        { status: 400 },
      );
    }

    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a number greater than 0." },
        { status: 400 },
      );
    }

    if (typeof category !== "string" || category.trim().length === 0) {
      return NextResponse.json(
        { error: "Category is required." },
        { status: 400 },
      );
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: "Date must be a valid date." },
        { status: 400 },
      );
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: context.user.id,
        workspaceId: context.workspace.id,
        type,
        amount: parsedAmount,
        category: category.trim(),
        date: parsedDate,
      },
    });

    return NextResponse.json(formatTransaction(transaction), { status: 201 });
  } catch (error) {
    console.error("Failed to create transaction:", error);

    return NextResponse.json(
      { error: "Failed to create transaction." },
      { status: 500 },
    );
  }
}
