import { connection, NextResponse } from "next/server";
import { buildAnalytics } from "@/lib/analytics";
import { normalizeDashboardLayout } from "@/lib/dashboard-layout";
import {
  normalizePredictionOptions,
  predictFutureCashFlow,
} from "@/lib/predict-future-cash-flow";
import { buildPersonalFinanceSummary } from "@/lib/personal-finance";
import { getPrisma } from "@/lib/prisma";
import { getActiveWorkspaceForRequest } from "@/lib/workspace";

type TransactionTotals = {
  totalIncome: number;
  totalExpenses: number;
};

type TransactionSummary = {
  id: string;
  type: "income" | "expense";
  amount: { toString(): string };
  category: string;
  date: Date;
};

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
    await connection();

    const prisma = getPrisma();
    const context = await getActiveWorkspaceForRequest(request);

    if (!context) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const [transactions, invoices, budgets] = await Promise.all([
      prisma.transaction.findMany({
        where: { financeType: context.financeType, workspaceId: context.workspace.id },
        select: {
          id: true,
          amount: true,
          category: true,
          date: true,
          type: true,
        },
      }),
      prisma.invoice.findMany({
        where: { financeType: context.financeType, workspaceId: context.workspace.id },
        select: {
          id: true,
          amount: true,
          dueDate: true,
          status: true,
        },
      }),
      prisma.categoryBudget.findMany({
        where: {
          financeType: context.financeType,
          period: "monthly",
          workspaceId: context.workspace.id,
        },
        select: {
          amount: true,
          category: true,
        },
      }),
    ]);
    const preference = await prisma.userPreference.findUnique({
      where: { userId: context.user.id },
      select: { dashboardLayout: true, currency: true, predictionSettings: true },
    });

    const predictionSettings = normalizePredictionOptions(preference?.predictionSettings);
    const prediction = await predictFutureCashFlow(
      context.workspace.id,
      predictionSettings,
      context.financeType,
    );
    const safeTransactions = transactions.filter(
      (transaction) =>
        isValidDate(transaction.date) &&
        (transaction.type === "income" || transaction.type === "expense") &&
        safeDecimalNumber(transaction.amount) >= 0,
    );
    const totals = safeTransactions.reduce<TransactionTotals>(
      (result: TransactionTotals, transaction: TransactionSummary) => {
        const amount = safeDecimalNumber(transaction.amount);

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

    const transactionBalance = totals.totalIncome - totals.totalExpenses;
    const netBalance =
      context.financeType === "personal"
        ? transactionBalance
        : safeDecimalNumber(context.workspace.startingBalance) + transactionBalance;
    const analytics = buildAnalytics({
      budgets,
      invoices,
      monthlyFixedExpenses: safeDecimalNumber(context.workspace.monthlyFixedExpenses),
      netBalance,
      transactions: safeTransactions,
    });
    const responseTransactions = safeTransactions.map((transaction) => ({
      id: transaction.id,
      amount: safeDecimalNumber(transaction.amount),
      category: transaction.category || "Uncategorized",
      date: transaction.date.toISOString(),
      type: transaction.type,
    }));
    const personalSummary = buildPersonalFinanceSummary({
      netBalance,
      transactions: responseTransactions,
    });

    return NextResponse.json({
      analytics,
      totalIncome: totals.totalIncome,
      totalExpenses: totals.totalExpenses,
      netBalance,
      currency: context.workspace.currency,
      dashboardLayout: normalizeDashboardLayout(preference?.dashboardLayout),
      invoices: invoices.map((invoice) => ({
        id: invoice.id,
        status: invoice.status,
      })),
      prediction,
      predictionSettings,
      personalSummary,
      transactions: responseTransactions,
      workspace: context.workspace,
      financeType: context.financeType,
    });
  } catch (error) {
    console.error("Failed to load dashboard data:", error);

    return apiError("Failed to load dashboard data.", error);
  }
}
