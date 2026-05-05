import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getActiveWorkspaceForRequest } from "@/lib/workspace";

export async function DELETE(request: Request) {
  try {
    const prisma = getPrisma();
    const context = await getActiveWorkspaceForRequest(request);

    if (!context) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    await prisma.$transaction([
      prisma.transaction.deleteMany({ where: { workspaceId: context.workspace.id } }),
      prisma.invoice.deleteMany({ where: { workspaceId: context.workspace.id } }),
      prisma.recurringTransaction.deleteMany({
        where: { workspaceId: context.workspace.id },
      }),
      prisma.categoryBudget.deleteMany({ where: { workspaceId: context.workspace.id } }),
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
