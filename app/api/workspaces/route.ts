import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getActiveWorkspaceForRequest } from "@/lib/workspace";

function formatWorkspace(item: {
  workspace: {
    id: string;
    name: string;
    currency: string;
    startingBalance: { toString(): string };
    monthlyFixedExpenses: { toString(): string };
    createdAt: Date;
  };
  role: string;
}) {
  return {
    id: item.workspace.id,
    name: item.workspace.name,
    currency: item.workspace.currency,
    startingBalance: Number(item.workspace.startingBalance.toString()),
    monthlyFixedExpenses: Number(item.workspace.monthlyFixedExpenses.toString()),
    createdAt: item.workspace.createdAt.toISOString(),
    role: item.role,
  };
}

export async function GET(request: Request) {
  try {
    const context = await getActiveWorkspaceForRequest(request);

    if (!context) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const prisma = getPrisma();
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: context.user.id },
      include: { workspace: true },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      activeWorkspaceId: context.workspace.id,
      workspaces: memberships.map(formatWorkspace),
    });
  } catch (error) {
    console.error("Failed to load workspaces:", error);

    return NextResponse.json(
      { error: "Failed to load workspaces." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const context = await getActiveWorkspaceForRequest(request);

    if (!context) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const currency = typeof body.currency === "string" ? body.currency : "USD";

    if (!name) {
      return NextResponse.json({ error: "Workspace name is required." }, { status: 400 });
    }

    const prisma = getPrisma();
    const workspace = await prisma.workspace.create({
      data: {
        ownerId: context.user.id,
        name,
        currency,
        members: {
          create: {
            userId: context.user.id,
            role: "owner",
          },
        },
      },
    });

    await prisma.userPreference.upsert({
      where: { userId: context.user.id },
      update: { activeWorkspaceId: workspace.id },
      create: {
        userId: context.user.id,
        activeWorkspaceId: workspace.id,
        currency,
        onboardingComplete: true,
      },
    });

    return NextResponse.json(
      {
        id: workspace.id,
        name: workspace.name,
        currency: workspace.currency,
        startingBalance: Number(workspace.startingBalance.toString()),
        monthlyFixedExpenses: Number(workspace.monthlyFixedExpenses.toString()),
        createdAt: workspace.createdAt.toISOString(),
        role: "owner",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create workspace:", error);

    return NextResponse.json(
      { error: "Failed to create workspace." },
      { status: 500 },
    );
  }
}
