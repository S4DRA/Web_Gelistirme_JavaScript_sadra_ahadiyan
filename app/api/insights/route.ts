import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { predictFutureCashFlow } from "@/lib/predict-future-cash-flow";
import { getActiveWorkspaceForRequest } from "@/lib/workspace";

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export async function GET(request: Request) {
  try {
    const context = await getActiveWorkspaceForRequest(request);

    if (!context) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const prisma = getPrisma();
    const now = new Date();
    const currentMonth = startOfMonth(now);
    const previousMonth = new Date(currentMonth);
    previousMonth.setMonth(previousMonth.getMonth() - 1);

    const [transactions, invoices, budgets, prediction] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          workspaceId: context.workspace.id,
          date: { gte: previousMonth },
        },
        select: { type: true, amount: true, category: true, date: true },
      }),
      prisma.invoice.findMany({
        where: { workspaceId: context.workspace.id },
        select: { status: true, amount: true, dueDate: true },
      }),
      prisma.categoryBudget.findMany({
        where: { workspaceId: context.workspace.id, period: "monthly" },
      }),
      predictFutureCashFlow(context.workspace.id),
    ]);

    const currentExpenses = transactions
      .filter((item) => item.type === "expense" && item.date >= currentMonth)
      .reduce((total, item) => total + Number(item.amount.toString()), 0);
    const previousExpenses = transactions
      .filter((item) => item.type === "expense" && item.date < currentMonth)
      .reduce((total, item) => total + Number(item.amount.toString()), 0);
    const currentIncome = transactions
      .filter((item) => item.type === "income" && item.date >= currentMonth)
      .reduce((total, item) => total + Number(item.amount.toString()), 0);
    const categorySpend = transactions
      .filter((item) => item.type === "expense" && item.date >= currentMonth)
      .reduce<Record<string, number>>((totals, item) => {
        totals[item.category] =
          (totals[item.category] ?? 0) + Number(item.amount.toString());
        return totals;
      }, {});
    const topCategory = Object.entries(categorySpend).sort(
      (left, right) => right[1] - left[1],
    )[0];
    const overdueInvoices = invoices.filter((invoice) => {
      const dueDate = new Date(invoice.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      return invoice.status !== "paid" && invoice.status !== "cancelled" && dueDate < now;
    });
    const budgetWarnings = budgets
      .map((budget) => {
        const spent = categorySpend[budget.category] ?? 0;
        const limit = Number(budget.amount.toString());

        return {
          category: budget.category,
          spent,
          limit,
          percent: limit > 0 ? Math.round((spent / limit) * 100) : 0,
        };
      })
      .filter((budget) => budget.percent >= 80);
    const expenseChangePercent =
      previousExpenses > 0
        ? Math.round(((currentExpenses - previousExpenses) / previousExpenses) * 100)
        : null;

    return NextResponse.json({
      workspace: context.workspace,
      currentIncome,
      currentExpenses,
      previousExpenses,
      expenseChangePercent,
      topCategory: topCategory
        ? { category: topCategory[0], amount: topCategory[1] }
        : null,
      overdueInvoices: overdueInvoices.length,
      overdueAmount: overdueInvoices.reduce(
        (total, invoice) => total + Number(invoice.amount.toString()),
        0,
      ),
      budgetWarnings,
      prediction,
    });
  } catch (error) {
    console.error("Failed to load insights:", error);

    return NextResponse.json({ error: "Failed to load insights." }, { status: 500 });
  }
}
