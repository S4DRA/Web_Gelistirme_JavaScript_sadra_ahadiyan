import { NextResponse } from "next/server";
import { isEmailConfigured, sendAccessRequestToAdmin } from "@/lib/email";
import { validateEmailCanReceiveMail } from "@/lib/email-validation";
import { getPrisma } from "@/lib/prisma";
import {
  createAccessRequestToken,
  hashAccessRequestToken,
} from "@/lib/signup-verification";

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function appBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://dampener.vercel.app").replace(/\/$/, "");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const fullName = clean(body.fullName);
    const email = clean(body.email).toLowerCase();
    const companyName = clean(body.companyName);
    const role = clean(body.role);
    const useCase = clean(body.useCase);
    const message = clean(body.message);

    if (!fullName || !email || !companyName || !role || !useCase) {
      return NextResponse.json(
        { error: "Full name, email, company, role, and use case are required." },
        { status: 400 },
      );
    }

    if (fullName.length > 120 || companyName.length > 160 || role.length > 120) {
      return NextResponse.json(
        { error: "One or more fields are too long." },
        { status: 400 },
      );
    }

    if (useCase.length > 1200 || message.length > 1200) {
      return NextResponse.json(
        { error: "Use case and message must be 1200 characters or fewer." },
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

    if (!isEmailConfigured()) {
      return NextResponse.json(
        { error: "Email is not configured. Add SMTP_USER and SMTP_PASS to .env." },
        { status: 500 },
      );
    }

    const prisma = getPrisma();
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please log in." },
        { status: 409 },
      );
    }

    const existingPendingRequest = await prisma.accessRequest.findFirst({
      where: {
        email,
        status: "pending",
      },
      select: { id: true },
    });

    if (existingPendingRequest) {
      return NextResponse.json(
        { error: "A pending request already exists for this email." },
        { status: 409 },
      );
    }

    const approvalToken = createAccessRequestToken();
    const approvalUrl = `${appBaseUrl()}/api/access-request/approve?token=${encodeURIComponent(
      approvalToken,
    )}`;

    await prisma.accessRequest.create({
      data: {
        approvalToken: hashAccessRequestToken(approvalToken),
        companyName,
        email,
        fullName,
        message: message || null,
        role,
        status: "pending",
        useCase,
      },
    });

    await sendAccessRequestToAdmin({
      approvalUrl,
      companyName,
      email,
      fullName,
      message: message || null,
      role,
      useCase,
    });

    return NextResponse.json({
      message: "Your request has been sent. If approved, you will receive an email with signup access.",
    });
  } catch (error) {
    console.error("Failed to create access request:", error);

    return NextResponse.json(
      { error: "Failed to send request. Please try again." },
      { status: 500 },
    );
  }
}
