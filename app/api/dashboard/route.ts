import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type TransactionTotals = {
  totalIncome: number;
  totalExpenses: number;
};

type TransactionSummary = {
  type: "income" | "expense";
  amount: { toString(): string };
};

export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      select: {
        type: true,
        amount: true,
      },
    });

    const totals = transactions.reduce<TransactionTotals>(
      (result: TransactionTotals, transaction: TransactionSummary) => {
        const amount = Number(transaction.amount.toString());

        if (transaction.type === "income") {
          result.totalIncome += amount;
        }

        if (transaction.type === "expense") {
          result.totalExpenses += amount;
        }

        return result;
      },
      {
        totalIncome: 0,
        totalExpenses: 0,
      },
    );

    return NextResponse.json({
      totalIncome: totals.totalIncome,
      totalExpenses: totals.totalExpenses,
      netBalance: totals.totalIncome - totals.totalExpenses,
    });
  } catch (error) {
    console.error("Failed to load dashboard data:", error);

    return NextResponse.json(
      { error: "Failed to load dashboard data." },
      { status: 500 },
    );
  }
}
