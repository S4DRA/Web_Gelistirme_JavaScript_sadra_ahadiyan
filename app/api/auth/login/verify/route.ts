import { NextResponse } from "next/server";
import { createSessionCookie } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { consumeVerificationCode } from "@/lib/verification-codes";

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (typeof email !== "string" || typeof code !== "string") {
      return NextResponse.json(
        { error: "Email and code are required." },
        { status: 400 },
      );
    }

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: {
        id: true,
        email: true,
        username: true,
        phoneNumber: true,
        emailVerifiedAt: true,
      },
    });

    if (!user || !user.emailVerifiedAt) {
      return NextResponse.json(
        { error: "Email must be verified first." },
        { status: 403 },
      );
    }

    const valid = await consumeVerificationCode({
      userId: user.id,
      code: code.trim(),
      purpose: "login",
    });

    if (!valid) {
      return NextResponse.json(
        { error: "Code is incorrect or expired." },
        { status: 400 },
      );
    }

    const response = NextResponse.json({ user });
    response.headers.append("Set-Cookie", createSessionCookie(user.id));

    return response;
  } catch (error) {
    console.error("Failed to verify login code:", error);

    return NextResponse.json(
      { error: "Failed to verify login code." },
      { status: 500 },
    );
  }
}
