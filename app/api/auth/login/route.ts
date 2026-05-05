import { NextResponse } from "next/server";
import { createSessionCookie, verifyPassword } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { createVerificationCode } from "@/lib/verification-codes";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 },
      );
    }

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user || !(await verifyPassword(password, user.password))) {
      return NextResponse.json(
        { error: "Email or password is incorrect." },
        { status: 401 },
      );
    }

    if (!user.emailVerifiedAt) {
      const verification = await createVerificationCode({
        userId: user.id,
        email: user.email,
        purpose: "email_verification",
      });

      const response = NextResponse.json({
        requiresEmailVerification: true,
        email: user.email,
        devCode: verification.devCode,
      });
      response.headers.append("Set-Cookie", createSessionCookie(user.id));

      return response;
    }

    const verification = await createVerificationCode({
      userId: user.id,
      email: user.email,
      purpose: "login",
    });

    return NextResponse.json({
      requiresLoginCode: true,
      email: user.email,
      devCode: verification.devCode,
    });
  } catch (error) {
    console.error("Failed to log in:", error);

    return NextResponse.json({ error: "Failed to log in." }, { status: 500 });
  }
}
