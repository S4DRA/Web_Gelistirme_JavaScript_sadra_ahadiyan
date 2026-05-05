import { NextResponse } from "next/server";
import { createExpiredSessionCookie } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out." });
  response.headers.append("Set-Cookie", createExpiredSessionCookie());

  return response;
}
