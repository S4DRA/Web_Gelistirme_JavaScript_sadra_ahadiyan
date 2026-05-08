import { NextResponse } from "next/server";
import { WorkspaceRole } from "@prisma/client";
import { sendWorkspaceAccessEmail } from "@/lib/email";
import { getPrisma } from "@/lib/prisma";
import { getActiveWorkspaceForRequest } from "@/lib/workspace";

function formatMember(member: {
  id: string;
  role: string;
  createdAt: Date;
  user: { email: string };
}) {
  return {
    id: member.id,
    email: member.user.email,
    role: member.role,
    createdAt: member.createdAt.toISOString(),
  };
}

export async function GET(request: Request) {
  try {
    const context = await getActiveWorkspaceForRequest(request);

    if (!context) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const prisma = getPrisma();
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: context.workspace.id },
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(members.map(formatMember));
  } catch (error) {
    console.error("Failed to load team:", error);

    return NextResponse.json({ error: "Failed to load team." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const context = await getActiveWorkspaceForRequest(request);

    if (!context) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    if (context.role !== "owner" && context.role !== "admin") {
      return NextResponse.json({ error: "Only admins can add team members." }, { status: 403 });
    }

    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const role = body.role || "viewer";

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    if (!Object.values(WorkspaceRole).includes(role) || role === "owner") {
      return NextResponse.json({ error: "Role is invalid." }, { status: 400 });
    }

    const prisma = getPrisma();
    const invitedUser = await prisma.user.findUnique({ where: { email } });

    if (!invitedUser) {
      return NextResponse.json(
        { error: "That user needs to sign up before you can add them." },
        { status: 404 },
      );
    }

    const member = await prisma.workspaceMember.upsert({
      where: {
        workspaceId_userId: {
          workspaceId: context.workspace.id,
          userId: invitedUser.id,
        },
      },
      update: { role },
      create: {
        workspaceId: context.workspace.id,
        userId: invitedUser.id,
        role,
      },
      include: { user: { select: { email: true } } },
    });

    await sendWorkspaceAccessEmail({
      role,
      to: member.user.email,
      workspaceName: context.workspace.name,
    }).catch((emailError) => {
      console.error("Failed to send workspace access email:", emailError);
    });

    return NextResponse.json(formatMember(member), { status: 201 });
  } catch (error) {
    console.error("Failed to add team member:", error);

    return NextResponse.json({ error: "Failed to add team member." }, { status: 500 });
  }
}
