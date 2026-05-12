import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getActiveWorkspaceForRequest } from "@/lib/workspace";

const RESET_CONFIRMATION_PHRASE = "I WOULD LIKE TO RESET THE DATA";

export async function DELETE(request: Request) {
  try {
    const prisma = getPrisma();
    const context = await getActiveWorkspaceForRequest(request);

    if (!context) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = await request.json().catch(() => null);

    if (body?.confirmationPhrase !== RESET_CONFIRMATION_PHRASE) {
      return NextResponse.json(
        { error: "Reset confirmation phrase is required." },
        { status: 400 },
      );
    }

    await prisma.$transaction([
      prisma.transaction.deleteMany({
        where: { financeType: context.financeType, workspaceId: context.workspace.id },
      }),
      prisma.invoice.deleteMany({
        where: { financeType: context.financeType, workspaceId: context.workspace.id },
      }),
      prisma.recurringTransaction.deleteMany({
        where: { financeType: context.financeType, workspaceId: context.workspace.id },
      }),
      prisma.categoryBudget.deleteMany({
        where: { financeType: context.financeType, workspaceId: context.workspace.id },
      }),
      prisma.financialTrackingFolder.deleteMany({
        where: { financeType: context.financeType, workspaceId: context.workspace.id },
      }),
      prisma.workspace.update({
        where: { id: context.workspace.id },
        data: {
          startingBalance: 0,
          monthlyFixedExpenses: 0,
        },
      }),
      prisma.userPreference.update({
        where: { userId: context.user.id },
        data: {
          startingBalance: 0,
          monthlyFixedExpenses: 0,
        },
      }),
    ]);

    return NextResponse.json({ message: "Data reset successful" });
  } catch (error) {
    console.error("Failed to reset data:", error);

    return NextResponse.json(
      { error: "Failed to reset data." },
      { status: 500 },
    );
  }
}
