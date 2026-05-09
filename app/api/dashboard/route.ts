import { connection, NextResponse } from "next/server";
import { buildAnalytics } from "@/lib/analytics";
import { normalizeDashboardLayout } from "@/lib/dashboard-layout";
import { normalizePredictionOptions } from "@/lib/predict-future-cash-flow";
import { getPrisma } from "@/lib/prisma";
import { getActiveWorkspaceForRequest } from "@/lib/workspace";

type TransactionTotals = {
  totalIncome: number;
  totalExpenses: number;
};

type TransactionSummary = {
  type: "income" | "expense";
  amount: { toString(): string };
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
        where: { workspaceId: context.workspace.id },
        select: {
          amount: true,
          category: true,
          date: true,
          type: true,
        },
      }),
      prisma.invoice.findMany({
        where: { workspaceId: context.workspace.id },
        select: {
          amount: true,
          dueDate: true,
          status: true,
        },
      }),
      prisma.categoryBudget.findMany({
        where: { workspaceId: context.workspace.id, period: "monthly" },
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
      predictionSettings: normalizePredictionOptions(preference?.predictionSettings),
      workspace: context.workspace,
    });
  } catch (error) {
    console.error("Failed to load dashboard data:", error);

    return NextResponse.json(
      { error: "Failed to load dashboard data." },
      { status: 500 },
    );
  }
}
