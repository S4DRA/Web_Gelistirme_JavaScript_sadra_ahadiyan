import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export type FinanceType = "personal" | "business";

export type ActiveWorkspace = {
  id: string;
  name: string;
  currency: string;
  startingBalance: number;
  monthlyFixedExpenses: number;
};

export function normalizeFinanceType(value: unknown): FinanceType | null {
  return value === "personal" || value === "business" ? value : null;
}

function getCookieValue(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = cookieHeader.split(";").map((item) => item.trim());
  const prefix = `${name}=`;
  const cookie = cookies.find((item) => item.startsWith(prefix));

  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
}

export async function getActiveWorkspaceForRequest(request: Request) {
  const user = await getCurrentUser(request);

  if (!user) {
    return null;
  }

  const prisma = getPrisma();
  const preference = await prisma.userPreference.findUnique({
    where: { userId: user.id },
    select: {
      activeFinanceType: true,
      activeWorkspaceId: true,
      currency: true,
      monthlyFixedExpenses: true,
      startingBalance: true,
    },
  });
  const requestedFinanceType = normalizeFinanceType(
    request.headers.get("x-dampener-finance-type") ??
      getCookieValue(request, "dampener-finance-type"),
  );
  const financeType = requestedFinanceType ?? preference?.activeFinanceType ?? "business";

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
    update: {
      activeFinanceType: financeType,
      activeWorkspaceId: membership.workspaceId,
    },
    create: {
      userId: user.id,
      activeWorkspaceId: membership.workspaceId,
      activeFinanceType: financeType,
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
    financeType,
    role: membership.role,
  };
}
