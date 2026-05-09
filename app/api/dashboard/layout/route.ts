import { NextResponse } from "next/server";
import { DEFAULT_DASHBOARD_LAYOUT, normalizeDashboardLayout } from "@/lib/dashboard-layout";
import { getPrisma } from "@/lib/prisma";
import { getActiveWorkspaceForRequest } from "@/lib/workspace";

export async function PATCH(request: Request) {
  try {
    const context = await getActiveWorkspaceForRequest(request);

    if (!context) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = await request.json();
    const dashboardLayout = normalizeDashboardLayout(body.dashboardLayout);
    const prisma = getPrisma();
    const preference = await prisma.userPreference.upsert({
      where: { userId: context.user.id },
      update: { dashboardLayout },
      create: {
        activeWorkspaceId: context.workspace.id,
        currency: context.workspace.currency,
        dashboardLayout,
        onboardingComplete: true,
        userId: context.user.id,
      },
      select: { dashboardLayout: true },
    });

    return NextResponse.json({
      dashboardLayout: normalizeDashboardLayout(preference.dashboardLayout),
    });
  } catch (error) {
    console.error("Failed to save dashboard layout:", error);

    return NextResponse.json(
      { error: "Failed to save dashboard layout." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const context = await getActiveWorkspaceForRequest(request);

    if (!context) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const prisma = getPrisma();
    await prisma.userPreference.update({
      where: { userId: context.user.id },
      data: { dashboardLayout: DEFAULT_DASHBOARD_LAYOUT },
    });

    return NextResponse.json({ dashboardLayout: DEFAULT_DASHBOARD_LAYOUT });
  } catch (error) {
    console.error("Failed to reset dashboard layout:", error);

    return NextResponse.json(
      { error: "Failed to reset dashboard layout." },
      { status: 500 },
    );
  }
}
