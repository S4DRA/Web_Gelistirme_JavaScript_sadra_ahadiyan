import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

function formatFolder(folder: { id: string; name: string; createdAt: Date }) {
  return {
    id: folder.id,
    name: folder.name,
    createdAt: folder.createdAt.toISOString(),
  };
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const prisma = getPrisma();
    const folders = await prisma.financialTrackingFolder.findMany({
      where: { userId: user.id },
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
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const { name } = await request.json();

    if (typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Folder name is required." }, { status: 400 });
    }

    const prisma = getPrisma();
    const folder = await prisma.financialTrackingFolder.create({
      data: {
        userId: user.id,
        name: name.trim(),
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
