import { NextResponse } from "next/server";
import { sendAccessApprovedToUser } from "@/lib/email";
import { getPrisma } from "@/lib/prisma";
import {
  createAccessRequestToken,
  createSignupRequestToken,
  hashAccessRequestToken,
  hashSignupRequestToken,
} from "@/lib/signup-verification";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function htmlMessage(title: string, message: string, status = 200) {
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);

  return new NextResponse(
    `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${safeTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f8fafc; color: #0f172a; }
          main { width: min(92vw, 32rem); border: 1px solid #e2e8f0; border-radius: 16px; background: white; padding: 28px; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06); }
          h1 { margin: 0 0 12px; font-size: 24px; }
          p { margin: 0; color: #475569; line-height: 1.6; }
        </style>
      </head>
      <body>
        <main>
          <h1>${safeTitle}</h1>
          <p>${safeMessage}</p>
        </main>
      </body>
    </html>`,
    {
      headers: { "Content-Type": "text/html; charset=utf-8" },
      status,
    },
  );
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token") ?? "";

    if (!token) {
      return htmlMessage("Invalid approval link", "This approval link is missing its token.", 400);
    }

    const prisma = getPrisma();
    const signupRequest = await prisma.signupRequest.findUnique({
      where: { approvalTokenHash: hashSignupRequestToken(token) },
    });

    if (!signupRequest) {
      return htmlMessage("Invalid approval link", "This approval link was not found.", 404);
    }

    if (signupRequest.expiresAt <= new Date()) {
      return htmlMessage("Approval link expired", "Ask the person to send a new signup request.", 410);
    }

    if (signupRequest.usedAt) {
      return htmlMessage("Already used", "This signup invitation has already been used.", 409);
    }

    const inviteToken = createSignupRequestToken();
    const accessToken = createAccessRequestToken();
    const inviteUrl = new URL("/signup", url.origin);
    inviteUrl.searchParams.set("accessToken", accessToken);

    await prisma.$transaction([
      prisma.signupRequest.update({
        data: {
          approvedAt: signupRequest.approvedAt ?? new Date(),
          inviteSentAt: new Date(),
          inviteTokenHash: hashSignupRequestToken(inviteToken),
        },
        where: { id: signupRequest.id },
      }),
      prisma.accessRequest.create({
        data: {
          approvalToken: hashAccessRequestToken(accessToken),
          companyName: signupRequest.companyName || "Demo request",
          email: signupRequest.email,
          fullName: signupRequest.fullName,
          message: signupRequest.note,
          role: "Requester",
          status: "approved",
          useCase: signupRequest.source,
        },
      }),
    ]);

    await sendAccessApprovedToUser({
      signupUrl: inviteUrl.toString(),
      to: signupRequest.email,
    });

    return htmlMessage(
      "Access approved",
      `An email with the signup link was sent to ${signupRequest.email}.`,
    );
  } catch (error) {
    console.error("Failed to approve signup request:", error);

    return htmlMessage(
      "Could not send invite",
      "Something went wrong while approving this request. Please try again.",
      500,
    );
  }
}
