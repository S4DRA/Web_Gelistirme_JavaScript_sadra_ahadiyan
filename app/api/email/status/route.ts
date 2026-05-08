import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isEmailConfigured } from "@/lib/email";

export async function GET(request: Request) {
  const user = await getCurrentUser(request);

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  return NextResponse.json({
    configured: isEmailConfigured(),
    from: process.env.EMAIL_FROM ?? process.env.SMTP_USER ?? null,
  });
}
