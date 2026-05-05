import { NextResponse } from "next/server";
import { createExpiredSessionCookie } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out." });
  const sessionCookie = createExpiredSessionCookie();
  response.cookies.set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.options,
  );

  return response;
}
