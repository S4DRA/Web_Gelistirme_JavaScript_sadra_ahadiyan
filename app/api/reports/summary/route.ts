import { NextResponse } from "next/server";
import { buildAnalytics } from "@/lib/analytics";
import { getPrisma } from "@/lib/prisma";
import { getActiveWorkspaceForRequest } from "@/lib/workspace";

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
    const totalIncome = transactions
      .filter((item) => item.type === "income")
      .reduce((total, item) => total + Number(item.amount.toString()), 0);
    const totalExpenses = transactions
      .filter((item) => item.type === "expense")
      .reduce((total, item) => total + Number(item.amount.toString()), 0);
    const netBalance =
      Number(context.workspace.startingBalance.toString()) +
      totalIncome -
      totalExpenses;
    const analytics = buildAnalytics({
      budgets,
      invoices,
      monthlyFixedExpenses: Number(context.workspace.monthlyFixedExpenses.toString()),
      netBalance,
      transactions,
    });

    return NextResponse.json({
      analytics,
      totals: {
        netBalance,
        totalExpenses,
        totalIncome,
      },
      workspace: {
        currency: context.workspace.currency,
        financeType: context.financeType,
        name: context.workspace.name,
      },
    });
  } catch (error) {
    console.error("Failed to load report summary:", error);

    return NextResponse.json(
      { error: "Failed to load report summary." },
      { status: 500 },
    );
  }
}
