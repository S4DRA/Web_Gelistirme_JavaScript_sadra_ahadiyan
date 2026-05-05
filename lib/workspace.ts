import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export type ActiveWorkspace = {
  id: string;
  name: string;
  currency: string;
  startingBalance: number;
  monthlyFixedExpenses: number;
};

export async function getActiveWorkspaceForRequest(request: Request) {
  const user = await getCurrentUser(request);

  if (!user) {
    return null;
  }

  const prisma = getPrisma();
  const preference = await prisma.userPreference.findUnique({
    where: { userId: user.id },
    select: { activeWorkspaceId: true, currency: true, startingBalance: true, monthlyFixedExpenses: true },
  });

  const membershipWhere = {
    userId: user.id,
    ...(preference?.activeWorkspaceId
      ? { workspaceId: preference.activeWorkspaceId }
      : {}),
  };

  let membership = await prisma.workspaceMember.findFirst({
    where: membershipWhere,
    include: { workspace: true },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) {
    const workspace = await prisma.workspace.create({
      data: {
        ownerId: user.id,
        name: "Main workspace",
        currency: preference?.currency ?? "USD",
        startingBalance: preference?.startingBalance ?? 0,
        monthlyFixedExpenses: preference?.monthlyFixedExpenses ?? 0,
        members: {
          create: {
            userId: user.id,
            role: "owner",
          },
        },
      },
    });

    membership = {
      id: "",
      workspaceId: workspace.id,
      userId: user.id,
      role: "owner",
      createdAt: workspace.createdAt,
      workspace,
    };
  }

  await prisma.userPreference.upsert({
    where: { userId: user.id },
    update: { activeWorkspaceId: membership.workspaceId },
    create: {
      userId: user.id,
      activeWorkspaceId: membership.workspaceId,
      currency: membership.workspace.currency,
      startingBalance: membership.workspace.startingBalance,
      monthlyFixedExpenses: membership.workspace.monthlyFixedExpenses,
      onboardingComplete: true,
    },
  });

  return {
    user,
    workspace: {
      id: membership.workspace.id,
      name: membership.workspace.name,
      currency: membership.workspace.currency,
      startingBalance: Number(membership.workspace.startingBalance.toString()),
      monthlyFixedExpenses: Number(membership.workspace.monthlyFixedExpenses.toString()),
    } satisfies ActiveWorkspace,
    role: membership.role,
  };
}
