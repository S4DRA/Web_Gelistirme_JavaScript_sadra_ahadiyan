import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { hashEmailChangeVerificationCode } from "@/lib/signup-verification";

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const { email, verificationCode } = await request.json();

    if (typeof email !== "string" || typeof verificationCode !== "string") {
      return NextResponse.json(
        { error: "Email and verification code are required." },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^\d{6}$/.test(verificationCode.trim())) {
      return NextResponse.json(
        { error: "Enter the 6-digit verification code." },
        { status: 400 },
      );
    }

    const prisma = getPrisma();
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser && existingUser.id !== user.id) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    const codeRecord = await prisma.emailChangeVerificationCode.findFirst({
      where: {
        consumedAt: null,
        email: normalizedEmail,
        expiresAt: { gt: new Date() },
        userId: user.id,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!codeRecord) {
      return NextResponse.json(
        { error: "Verification code is expired. Send a new code." },
        { status: 400 },
      );
    }

    if (codeRecord.attempts >= 5) {
      return NextResponse.json(
        { error: "Too many attempts. Send a new code." },
        { status: 429 },
      );
    }

    const codeHash = hashEmailChangeVerificationCode(
      user.id,
      normalizedEmail,
      verificationCode.trim(),
    );

    if (codeHash !== codeRecord.codeHash) {
      await prisma.emailChangeVerificationCode.update({
        data: { attempts: { increment: 1 } },
        where: { id: codeRecord.id },
      });

      return NextResponse.json(
        { error: "Verification code is incorrect." },
        { status: 400 },
      );
    }

    const updatedUser = await prisma.$transaction(async (transaction) => {
      const updated = await transaction.user.update({
        where: { id: user.id },
        data: { email: normalizedEmail },
        select: {
          email: true,
          id: true,
          phoneNumber: true,
          profileImage: true,
          username: true,
        },
      });

      await transaction.emailChangeVerificationCode.update({
        data: { consumedAt: new Date() },
        where: { id: codeRecord.id },
      });

      return updated;
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Failed to change email:", error);

    return NextResponse.json({ error: "Failed to change email." }, { status: 500 });
  }
}
