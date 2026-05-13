import { NextResponse } from "next/server";
import { buildAnalytics } from "@/lib/analytics";
import { getPrisma } from "@/lib/prisma";
import { buildPersonalFinanceSummary } from "@/lib/personal-finance";
import { getActiveWorkspaceForRequest } from "@/lib/workspace";

function safeDecimalNumber(value: { toString(): string } | null | undefined) {
  const amount = value ? Number(value.toString()) : 0;
  return Number.isFinite(amount) ? amount : 0;
}

function isValidDate(value: Date) {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

function apiError(message: string, error: unknown) {
  return NextResponse.json(
    {
      error: message,
      details: error instanceof Error ? error.message : "Unknown server error.",
    },
    { status: 500 },
  );
}

export async function GET(request: Request) {
  try {
    const context = await getActiveWorkspaceForRequest(request);

    if (!context) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const prisma = getPrisma();
    const [transactions, invoices, budgets] = await Promise.all([
      prisma.transaction.findMany({
        where: { financeType: context.financeType, workspaceId: context.workspace.id },
        select: { amount: true, category: true, date: true, type: true },
      }),
      prisma.invoice.findMany({
        where: { financeType: context.financeType, workspaceId: context.workspace.id },
        select: { amount: true, dueDate: true, status: true },
      }),
      prisma.categoryBudget.findMany({
        where: {
          financeType: context.financeType,
          period: "monthly",
          workspaceId: context.workspace.id,
        },
        select: { amount: true, category: true },
      }),
    ]);
    const safeTransactions = transactions.filter(
      (transaction) =>
        isValidDate(transaction.date) &&
        (transaction.type === "income" || transaction.type === "expense") &&
        safeDecimalNumber(transaction.amount) >= 0,
    );
    const totalIncome = safeTransactions
      .filter((item) => item.type === "income")
      .reduce((total, item) => total + safeDecimalNumber(item.amount), 0);
    const totalExpenses = safeTransactions
      .filter((item) => item.type === "expense")
      .reduce((total, item) => total + safeDecimalNumber(item.amount), 0);
    const netBalance =
      safeDecimalNumber(context.workspace.startingBalance) +
      totalIncome -
      totalExpenses;
    const analytics = buildAnalytics({
      budgets,
      invoices,
      monthlyFixedExpenses: safeDecimalNumber(context.workspace.monthlyFixedExpenses),
      netBalance,
      transactions: safeTransactions,
    });
    const personalSummary = buildPersonalFinanceSummary({
      netBalance,
      transactions: safeTransactions.map((transaction) => ({
        amount: safeDecimalNumber(transaction.amount),
        category: transaction.category || "Uncategorized",
        date: transaction.date,
        type: transaction.type,
      })),
    });

    return NextResponse.json({
      analytics,
      totals: {
        netBalance,
        totalExpenses,
        totalIncome,
      },
      personalSummary,
      workspace: {
        currency: context.workspace.currency,
        financeType: context.financeType,
        name: context.workspace.name,
      },
    });
  } catch (error) {
    console.error("Failed to load report summary:", error);

    return apiError("Failed to load report summary.", error);
  }
}
