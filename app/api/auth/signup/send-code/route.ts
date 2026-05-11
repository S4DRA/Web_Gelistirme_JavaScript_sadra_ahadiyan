import { NextResponse } from "next/server";
import { isEmailConfigured, sendSignupVerificationCode } from "@/lib/email";
import { validateEmailCanReceiveMail } from "@/lib/email-validation";
import { getPrisma } from "@/lib/prisma";
import {
  createVerificationCode,
  hashAccessRequestToken,
  hashVerificationCode,
} from "@/lib/signup-verification";

const codeExpiryMinutes = 10;
const resendCooldownSeconds = 60;

export async function POST(request: Request) {
  try {
    const { accessToken, email, username } = await request.json();

    if (typeof email !== "string") {
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 400 },
      );
    }

    if (!isEmailConfigured()) {
      return NextResponse.json(
        { error: "Email is not configured. Add your Gmail app password first." },
        { status: 500 },
      );
    }

    const emailCheck = await validateEmailCanReceiveMail(email);

    if (!emailCheck.valid) {
      return NextResponse.json(
        { error: emailCheck.reason },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername =
      typeof username === "string" ? username.trim().toLowerCase() : "";
    const prisma = getPrisma();
    const accessTokenHash =
      typeof accessToken === "string" ? hashAccessRequestToken(accessToken) : "";
    const accessRequest = accessTokenHash
      ? await prisma.accessRequest.findUnique({
          where: { approvalToken: accessTokenHash },
          select: {
            email: true,
            id: true,
            status: true,
            usedAt: true,
          },
        })
      : null;

    if (
      !accessRequest ||
      accessRequest.email !== normalizedEmail ||
      accessRequest.status !== "approved" ||
      accessRequest.usedAt
    ) {
      return NextResponse.json(
        { error: "Use the signup link from your approved access email." },
        { status: 403 },
      );
    }

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

    if (normalizedUsername.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters." },
        { status: 400 },
      );
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username: normalizedUsername },
      select: { id: true },
    });

    if (existingUsername) {
      return NextResponse.json(
        { error: "This username is already taken." },
        { status: 409 },
      );
    }

    const recentCode = await prisma.signupVerificationCode.findFirst({
      where: {
        consumedAt: null,
        email: normalizedEmail,
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

    await prisma.signupVerificationCode.create({
      data: {
        codeHash: hashVerificationCode(normalizedEmail, code),
        email: normalizedEmail,
        expiresAt: new Date(Date.now() + codeExpiryMinutes * 60 * 1000),
      },
    });

    await sendSignupVerificationCode(normalizedEmail, code);

    return NextResponse.json({ message: "Verification code sent." });
  } catch (error) {
    console.error("Failed to send signup verification code:", error);

    return NextResponse.json(
      { error: "Failed to send verification code." },
      { status: 500 },
    );
  }
}
