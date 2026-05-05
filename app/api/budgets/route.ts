import { BudgetPeriod } from "@prisma/client";
import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getActiveWorkspaceForRequest } from "@/lib/workspace";

function formatBudget(item: {
  id: string;
  category: string;
  amount: { toString(): string };
  period: string;
}) {
  return {
    id: item.id,
    category: item.category,
    amount: Number(item.amount.toString()),
    period: item.period,
  };
}

export async function GET(request: Request) {
  try {
    const context = await getActiveWorkspaceForRequest(request);

    if (!context) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const prisma = getPrisma();
    const budgets = await prisma.categoryBudget.findMany({
      where: { workspaceId: context.workspace.id },
      orderBy: { category: "asc" },
    });

    return NextResponse.json(budgets.map(formatBudget));
  } catch (error) {
    console.error("Failed to load budgets:", error);

    return NextResponse.json({ error: "Failed to load budgets." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const context = await getActiveWorkspaceForRequest(request);

    if (!context) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = await request.json();
    const category = typeof body.category === "string" ? body.category.trim() : "";
    const amount = Number(body.amount);
    const period = body.period || "monthly";

    if (!category) {
      return NextResponse.json({ error: "Category is required." }, { status: 400 });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Budget amount must be greater than 0." },
        { status: 400 },
      );
    }

    if (!Object.values(BudgetPeriod).includes(period)) {
      return NextResponse.json({ error: "Period is invalid." }, { status: 400 });
    }

    const prisma = getPrisma();
    const budget = await prisma.categoryBudget.upsert({
      where: {
        workspaceId_category_period: {
          workspaceId: context.workspace.id,
          category,
          period,
        },
      },
      update: { amount },
      create: {
        workspaceId: context.workspace.id,
        category,
        amount,
        period,
      },
    });

    return NextResponse.json(formatBudget(budget), { status: 201 });
  } catch (error) {
    console.error("Failed to save budget:", error);

    return NextResponse.json({ error: "Failed to save budget." }, { status: 500 });
  }
}
