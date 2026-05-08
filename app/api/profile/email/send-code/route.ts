import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isEmailConfigured, sendEmailChangeVerificationCode } from "@/lib/email";
import { validateEmailCanReceiveMail } from "@/lib/email-validation";
import { getPrisma } from "@/lib/prisma";
import {
  createVerificationCode,
  hashEmailChangeVerificationCode,
} from "@/lib/signup-verification";

const codeExpiryMinutes = 10;
const resendCooldownSeconds = 60;

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    if (!isEmailConfigured()) {
      return NextResponse.json(
        { error: "Email is not configured. Add your Gmail app password first." },
        { status: 500 },
      );
    }

    const { email } = await request.json();

    if (typeof email !== "string") {
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 400 },
      );
    }

    const emailCheck = await validateEmailCanReceiveMail(email);

    if (!emailCheck.valid) {
      return NextResponse.json({ error: emailCheck.reason }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail === user.email) {
      return NextResponse.json(
        { error: "Enter a different email address." },
        { status: 400 },
      );
    }

    const prisma = getPrisma();
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    const recentCode = await prisma.emailChangeVerificationCode.findFirst({
      where: {
        consumedAt: null,
        email: normalizedEmail,
        userId: user.id,
        createdAt: {
          gt: new Date(Date.now() - resendCooldownSeconds * 1000),
        },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    if (recentCode) {
      return NextResponse.json(
        { error: "Wait a minute before sending another code." },
        { status: 429 },
      );
    }

    const code = createVerificationCode();

    await prisma.emailChangeVerificationCode.create({
      data: {
        codeHash: hashEmailChangeVerificationCode(user.id, normalizedEmail, code),
        email: normalizedEmail,
        expiresAt: new Date(Date.now() + codeExpiryMinutes * 60 * 1000),
        userId: user.id,
      },
    });

    await sendEmailChangeVerificationCode(normalizedEmail, code);

    return NextResponse.json({ message: "Verification code sent." });
  } catch (error) {
    console.error("Failed to send email change code:", error);

    return NextResponse.json(
      { error: "Failed to send verification code." },
      { status: 500 },
    );
  }
}
