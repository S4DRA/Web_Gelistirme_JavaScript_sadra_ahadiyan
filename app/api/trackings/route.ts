import { NextResponse } from "next/server";
import { cleanShortText, isValidShortText } from "@/lib/financial-validation";
import { getPrisma } from "@/lib/prisma";
import { getActiveWorkspaceForRequest } from "@/lib/workspace";

function formatFolder(folder: { id: string; name: string; createdAt: Date; financeType?: string }) {
  return {
    id: folder.id,
    name: folder.name,
    createdAt: folder.createdAt.toISOString(),
    financeType: folder.financeType,
  };
}

export async function GET(request: Request) {
  try {
    const context = await getActiveWorkspaceForRequest(request);

    if (!context) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const prisma = getPrisma();
    const folders = await prisma.financialTrackingFolder.findMany({
      where: { financeType: context.financeType, workspaceId: context.workspace.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(folders.map(formatFolder));
  } catch (error) {
    console.error("Failed to fetch tracking folders:", error);

    return NextResponse.json(
      { error: "Failed to fetch tracking folders." },
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

    const { name } = await request.json();
    const cleanName = cleanShortText(name);

    if (!isValidShortText(cleanName)) {
      return NextResponse.json(
        { error: "Folder name is required and must be 80 characters or fewer." },
        { status: 400 },
      );
    }

    const prisma = getPrisma();
    const existingFolder = await prisma.financialTrackingFolder.findFirst({
      where: {
        financeType: context.financeType,
        name: cleanName,
        workspaceId: context.workspace.id,
      },
      select: { id: true },
    });

    if (existingFolder) {
      return NextResponse.json(
        { error: "A folder with this name already exists." },
        { status: 409 },
      );
    }

    const folder = await prisma.financialTrackingFolder.create({
      data: {
        userId: context.user.id,
        workspaceId: context.workspace.id,
        financeType: context.financeType,
        name: cleanName,
      },
    });

    return NextResponse.json(formatFolder(folder), { status: 201 });
  } catch (error) {
    console.error("Failed to create tracking folder:", error);

    return NextResponse.json(
      { error: "Failed to create tracking folder." },
      { status: 500 },
    );
  }
}
