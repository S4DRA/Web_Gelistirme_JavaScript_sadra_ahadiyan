import { NextResponse } from "next/server";
import { createSessionCookie, hashPassword } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";
import { validateEmailCanReceiveMail } from "@/lib/email-validation";
import { getPrisma } from "@/lib/prisma";
import { hashAccessRequestToken } from "@/lib/signup-verification";

export async function POST(request: Request) {
  try {
    const { accessToken, email, password, username, phoneNumber } = await request.json();

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
      select: {
        id: true,
      },
    });

    if (existingUser) {
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

    const hashedPassword = await hashPassword(password);
    const user = await prisma.$transaction(async (tx) => {
      const currentAccessRequest = await tx.accessRequest.findUnique({
        where: { id: accessRequest.id },
        select: {
          email: true,
          status: true,
          usedAt: true,
        },
      });

      if (
        !currentAccessRequest ||
        currentAccessRequest.email !== normalizedEmail ||
        currentAccessRequest.status !== "approved" ||
        currentAccessRequest.usedAt
      ) {
        throw new Error("ACCESS_TOKEN_INVALID");
      }

      const createdUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          username: normalizedUsername,
          phoneNumber: phoneNumber.trim(),
          password: hashedPassword,
        },
        select: {
          id: true,
          email: true,
          username: true,
          phoneNumber: true,
        },
      });

      await tx.accessRequest.update({
        data: {
          usedAt: new Date(),
        },
        where: { id: accessRequest.id },
      });

      return createdUser;
    });

    await sendWelcomeEmail(user.email).catch((emailError) => {
      console.error("Failed to send welcome email:", emailError);
    });

    const response = NextResponse.json(
      {
        user,
      },
      { status: 201 },
    );
    const sessionCookie = createSessionCookie(user.id);
    response.cookies.set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.options,
    );

    return response;
  } catch (error) {
    if (error instanceof Error && error.message === "ACCESS_TOKEN_INVALID") {
      return NextResponse.json(
        { error: "Use the signup link from your approved access email." },
        { status: 403 },
      );
    }

    console.error("Failed to sign up:", error);

    return NextResponse.json({ error: "Failed to sign up." }, { status: 500 });
  }
}
