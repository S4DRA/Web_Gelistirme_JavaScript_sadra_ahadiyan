import { NextResponse } from "next/server";
import { createSessionCookie, hashPassword } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";
import { validateEmailCanReceiveMail } from "@/lib/email-validation";
import { getPrisma } from "@/lib/prisma";

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
    console.error("Failed to sign up:", error);

    return NextResponse.json({ error: "Failed to sign up." }, { status: 500 });
  }
}
