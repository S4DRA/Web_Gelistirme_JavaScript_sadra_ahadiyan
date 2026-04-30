import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export async function DELETE() {
  try {
    const prisma = getPrisma();
    await prisma.transaction.deleteMany();
    await prisma.invoice.deleteMany();

    return NextResponse.json({ message: "Data reset successful" });
  } catch (error) {
    console.error("Failed to reset data:", error);

    return NextResponse.json(
      { error: "Failed to reset data." },
      { status: 500 },
    );
  }
}
