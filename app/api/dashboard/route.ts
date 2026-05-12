import { connection, NextResponse } from "next/server";
import { buildAnalytics } from "@/lib/analytics";
import { normalizeDashboardLayout } from "@/lib/dashboard-layout";
import {
  normalizePredictionOptions,
  predictFutureCashFlow,
} from "@/lib/predict-future-cash-flow";
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

    const netBalance =
      Number(context.workspace.startingBalance.toString()) +
      totals.totalIncome -
      totals.totalExpenses;
    const analytics = buildAnalytics({
      budgets,
      invoices,
      monthlyFixedExpenses: Number(context.workspace.monthlyFixedExpenses.toString()),
      netBalance,
      transactions,
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
      transactions: transactions.map((transaction) => ({
        id: transaction.id,
        amount: Number(transaction.amount.toString()),
        category: transaction.category,
        date: transaction.date.toISOString(),
        type: transaction.type,
      })),
      workspace: context.workspace,
      financeType: context.financeType,
    });
  } catch (error) {
    console.error("Failed to load dashboard data:", error);

    return NextResponse.json(
      { error: "Failed to load dashboard data." },
      { status: 500 },
    );
  }
}
