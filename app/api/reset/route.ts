import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function DELETE(request: Request) {
  try {
    const prisma = getPrisma();
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    await prisma.transaction.deleteMany({ where: { userId: user.id } });
    await prisma.invoice.deleteMany({ where: { userId: user.id } });

    return NextResponse.json({ message: "Data reset successful" });
  } catch (error) {
    console.error("Failed to reset data:", error);

    return NextResponse.json(
      { error: "Failed to reset data." },
      { status: 500 },
    );
  }
}
