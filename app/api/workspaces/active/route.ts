import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getActiveWorkspaceForRequest } from "@/lib/workspace";

export async function PATCH(request: Request) {
  try {
    const context = await getActiveWorkspaceForRequest(request);

    if (!context) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = await request.json();
    const workspaceId = typeof body.workspaceId === "string" ? body.workspaceId : "";

    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace is required." }, { status: 400 });
    }

    const prisma = getPrisma();
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: context.user.id,
        },
      },
      include: { workspace: true },
    });

    if (!membership) {
      return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
    }

    await prisma.userPreference.upsert({
      where: { userId: context.user.id },
      update: { activeWorkspaceId: workspaceId },
      create: {
        userId: context.user.id,
        activeWorkspaceId: workspaceId,
        currency: membership.workspace.currency,
        onboardingComplete: true,
      },
    });

    return NextResponse.json({
      id: membership.workspace.id,
      name: membership.workspace.name,
      currency: membership.workspace.currency,
    });
  } catch (error) {
    console.error("Failed to switch workspace:", error);

    return NextResponse.json(
      { error: "Failed to switch workspace." },
      { status: 500 },
    );
  }
}
