import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getActiveWorkspaceForRequest, normalizeFinanceType } from "@/lib/workspace";

const cookieName = "dampener-finance-type";

export async function GET(request: Request) {
  try {
    const context = await getActiveWorkspaceForRequest(request);

    if (!context) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    return NextResponse.json({ financeType: context.financeType });
  } catch (error) {
    console.error("Failed to load finance mode:", error);

    return NextResponse.json({ error: "Failed to load finance mode." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const context = await getActiveWorkspaceForRequest(request);

    if (!context) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = await request.json();
    const financeType = normalizeFinanceType(body.financeType);

    if (!financeType) {
      return NextResponse.json({ error: "Finance mode is invalid." }, { status: 400 });
    }

    const prisma = getPrisma();
    await prisma.userPreference.update({
      where: { userId: context.user.id },
      data: { activeFinanceType: financeType },
    });

    const response = NextResponse.json({ financeType });
    response.cookies.set(cookieName, financeType, {
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Failed to save finance mode:", error);

    return NextResponse.json({ error: "Failed to save finance mode." }, { status: 500 });
  }
}
