import { NextResponse } from "next/server";
import { buildAnalytics } from "@/lib/analytics";
import { getPrisma } from "@/lib/prisma";
import { predictFutureCashFlow } from "@/lib/predict-future-cash-flow";
import { getActiveWorkspaceForRequest } from "@/lib/workspace";

export async function GET(request: Request) {
  try {
    const context = await getActiveWorkspaceForRequest(request);

    if (!context) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const prisma = getPrisma();
    const [transactions, invoices, budgets, prediction] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          financeType: context.financeType,
          workspaceId: context.workspace.id,
        },
        select: { type: true, amount: true, category: true, date: true },
      }),
      prisma.invoice.findMany({
        where: { financeType: context.financeType, workspaceId: context.workspace.id },
        select: { status: true, amount: true, dueDate: true },
      }),
      prisma.categoryBudget.findMany({
        where: {
          financeType: context.financeType,
          period: "monthly",
          workspaceId: context.workspace.id,
        },
      }),
      predictFutureCashFlow(context.workspace.id, undefined, context.financeType),
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
      workspace: context.workspace,
      financeType: context.financeType,
      ...analytics,
      prediction,
    });
  } catch (error) {
    console.error("Failed to load insights:", error);

    return NextResponse.json({ error: "Failed to load insights." }, { status: 500 });
  }
}
