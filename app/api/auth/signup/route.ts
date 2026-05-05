import { NextResponse } from "next/server";
import { createSessionCookie, hashPassword, verifyPassword } from "@/lib/auth";
import { validateEmailCanReceiveMail } from "@/lib/email-validation";
import { getPrisma } from "@/lib/prisma";
import { createVerificationCode } from "@/lib/verification-codes";

export async function POST(request: Request) {
  try {
    const { email, password, username, phoneNumber } = await request.json();

    if (typeof email !== "string") {
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 400 },
      );
    }

    const emailCheck = await validateEmailCanReceiveMail(email);

    if (!emailCheck.valid) {
      return NextResponse.json(
        { error: emailCheck.reason },
        { status: 400 },
      );
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }

    if (typeof username !== "string" || username.trim().length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters." },
        { status: 400 },
      );
    }

    if (typeof phoneNumber !== "string" || phoneNumber.trim().length < 7) {
      return NextResponse.json(
        { error: "Enter a valid phone number." },
        { status: 400 },
      );
    }

    const prisma = getPrisma();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        password: true,
        emailVerifiedAt: true,
        username: true,
        phoneNumber: true,
      },
    });

    if (existingUser) {
      if (
        !existingUser.emailVerifiedAt &&
        (await verifyPassword(password, existingUser.password))
      ) {
        const verification = await createVerificationCode({
          userId: existingUser.id,
          email: existingUser.email,
          purpose: "email_verification",
        });
        const response = NextResponse.json({
          user: {
            id: existingUser.id,
            email: existingUser.email,
            username: existingUser.username,
            phoneNumber: existingUser.phoneNumber,
          },
          requiresEmailVerification: true,
          devCode: verification.devCode,
        });
        response.headers.append("Set-Cookie", createSessionCookie(existingUser.id));

        return response;
      }

      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
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

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        username: normalizedUsername,
        phoneNumber: phoneNumber.trim(),
        password: await hashPassword(password),
      },
      select: {
        id: true,
        email: true,
        username: true,
        phoneNumber: true,
      },
    });

    const verification = await createVerificationCode({
      userId: user.id,
      email: user.email,
      purpose: "email_verification",
    });

    const response = NextResponse.json(
      {
        user,
        requiresEmailVerification: true,
        devCode: verification.devCode,
      },
      { status: 201 },
    );
    response.headers.append("Set-Cookie", createSessionCookie(user.id));

    return response;
  } catch (error) {
    console.error("Failed to sign up:", error);

    return NextResponse.json({ error: "Failed to sign up." }, { status: 500 });
  }
}
