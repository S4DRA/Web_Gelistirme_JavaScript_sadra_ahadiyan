import { NextResponse } from "next/server";
import { sendAccessApprovedToUser } from "@/lib/email";
import { getPrisma } from "@/lib/prisma";
import { hashAccessRequestToken } from "@/lib/signup-verification";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function appBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://dampener.vercel.app").replace(/\/$/, "");
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
    const accessRequest = await prisma.accessRequest.findUnique({
      where: { approvalToken: hashAccessRequestToken(token) },
    });

    if (!accessRequest) {
      return htmlMessage("Invalid approval link", "This access request was not found.", 404);
    }

    if (accessRequest.status === "approved") {
      return htmlMessage(
        "Already approved",
        `This access request has already been approved for ${accessRequest.email}.`,
      );
    }

    if (accessRequest.status === "rejected") {
      return htmlMessage("Request rejected", "This access request has already been rejected.", 409);
    }

    const signupUrl = `${appBaseUrl()}/signup?accessToken=${encodeURIComponent(token)}`;

    await prisma.accessRequest.update({
      data: { status: "approved" },
      where: { id: accessRequest.id },
    });

    await sendAccessApprovedToUser({
      signupUrl,
      to: accessRequest.email,
    });

    return htmlMessage(
      "Access approved",
      `An approval email with a signup link was sent to ${accessRequest.email}.`,
    );
  } catch (error) {
    console.error("Failed to approve access request:", error);

    return htmlMessage(
      "Could not approve access",
      "Something went wrong while approving this access request. Please try again.",
      500,
    );
  }
}
