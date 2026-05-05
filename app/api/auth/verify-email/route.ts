import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import {
  consumeVerificationCode,
  createVerificationCode,
} from "@/lib/verification-codes";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const { code } = await request.json();

    if (typeof code !== "string" || !/^\d{6}$/.test(code.trim())) {
      return NextResponse.json({ error: "Enter the 6 digit code." }, { status: 400 });
    }

    const valid = await consumeVerificationCode({
      userId: user.id,
      code: code.trim(),
      purpose: "email_verification",
    });

    if (!valid) {
      return NextResponse.json(
        { error: "Code is incorrect or expired." },
        { status: 400 },
      );
    }

    const prisma = getPrisma();
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
      select: {
        id: true,
        email: true,
        username: true,
        phoneNumber: true,
        emailVerifiedAt: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Failed to verify email:", error);

    return NextResponse.json(
      { error: "Failed to verify email." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    if (user.emailVerifiedAt) {
      return NextResponse.json({ message: "Email is already verified." });
    }

    const verification = await createVerificationCode({
      userId: user.id,
      email: user.email,
      purpose: "email_verification",
    });

    return NextResponse.json({
      message: "Verification code sent.",
      devCode: verification.devCode,
    });
  } catch (error) {
    console.error("Failed to resend email verification:", error);

    return NextResponse.json(
      { error: "Failed to resend verification code." },
      { status: 500 },
    );
  }
}
