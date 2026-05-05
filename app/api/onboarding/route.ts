import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { getActiveWorkspaceForRequest } from "@/lib/workspace";

const supportedCurrencies = new Set(["USD", "EUR", "GBP", "TRY"]);

function parseMoney(value: unknown) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount < 0) {
    return null;
  }

  return amount;
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = await request.json();
    const currency = typeof body.currency === "string" ? body.currency : "USD";
    const startingBalance = parseMoney(body.startingBalance);
    const monthlyFixedExpenses = parseMoney(body.monthlyFixedExpenses);
    const folderName =
      typeof body.folderName === "string" ? body.folderName.trim() : "";

    if (!supportedCurrencies.has(currency)) {
      return NextResponse.json({ error: "Choose a supported currency." }, { status: 400 });
    }

    if (startingBalance === null || monthlyFixedExpenses === null) {
      return NextResponse.json(
        { error: "Amounts must be zero or greater." },
        { status: 400 },
      );
    }

    const prisma = getPrisma();
    const context = await getActiveWorkspaceForRequest(request);

    if (!context) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const [workspace, preference, folder] = await prisma.$transaction([
      prisma.workspace.update({
        where: { id: context.workspace.id },
        data: {
          currency,
          startingBalance,
          monthlyFixedExpenses,
        },
      }),
      prisma.userPreference.upsert({
        where: { userId: user.id },
        update: {
          activeWorkspaceId: context.workspace.id,
          currency,
          startingBalance,
          monthlyFixedExpenses,
          onboardingComplete: true,
        },
        create: {
          userId: user.id,
          activeWorkspaceId: context.workspace.id,
          currency,
          startingBalance,
          monthlyFixedExpenses,
          onboardingComplete: true,
        },
      }),
      folderName
        ? prisma.financialTrackingFolder.create({
            data: {
              userId: user.id,
              workspaceId: context.workspace.id,
              name: folderName,
            },
          })
        : prisma.financialTrackingFolder.findFirst({
            where: {
              userId: user.id,
              id: "__skip_folder_creation__",
            },
          }),
    ]);

    return NextResponse.json({
      preference: {
        id: preference.id,
        workspaceId: workspace.id,
        currency: preference.currency,
        startingBalance: Number(preference.startingBalance.toString()),
        monthlyFixedExpenses: Number(preference.monthlyFixedExpenses.toString()),
        onboardingComplete: preference.onboardingComplete,
      },
      folder: folder
        ? {
            id: folder.id,
            name: folder.name,
            createdAt: folder.createdAt.toISOString(),
          }
        : null,
    });
  } catch (error) {
    console.error("Failed to save onboarding:", error);

    return NextResponse.json(
      { error: "Failed to save onboarding." },
      { status: 500 },
    );
  }
}
