import { createHmac, randomInt, timingSafeEqual } from "crypto";
import type { VerificationPurpose } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";

const codeLifetimeMinutes = 10;
const maxAttempts = 5;

function getCodeSecret() {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "dampener-dev-secret";
}

function hashCode(code: string) {
  return createHmac("sha256", getCodeSecret()).update(code).digest("base64url");
}

function verifyCodeHash(code: string, codeHash: string) {
  const expected = Buffer.from(hashCode(code));
  const actual = Buffer.from(codeHash);

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function generateCode() {
  return String(randomInt(100000, 1000000));
}

export async function createVerificationCode({
  userId,
  email,
  purpose,
}: {
  userId: string;
  email: string;
  purpose: VerificationPurpose;
}) {
  const prisma = getPrisma();
  const code = generateCode();
  const expiresAt = new Date(Date.now() + codeLifetimeMinutes * 60 * 1000);

  await prisma.$transaction([
    prisma.emailVerificationCode.updateMany({
      where: {
        userId,
        purpose,
        consumedAt: null,
      },
      data: {
        consumedAt: new Date(),
      },
    }),
    prisma.emailVerificationCode.create({
      data: {
        userId,
        purpose,
        codeHash: hashCode(code),
        expiresAt,
      },
    }),
  ]);

  const sent = await sendVerificationCode({ email, code, purpose });

  return {
    expiresAt,
    devCode:
      process.env.NODE_ENV === "production" || sent
        ? undefined
        : code,
  };
}

export async function consumeVerificationCode({
  userId,
  code,
  purpose,
}: {
  userId: string;
  code: string;
  purpose: VerificationPurpose;
}) {
  const prisma = getPrisma();
  const record = await prisma.emailVerificationCode.findFirst({
    where: {
      userId,
      purpose,
      consumedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record || record.expiresAt < new Date() || record.attempts >= maxAttempts) {
    return false;
  }

  const matches = verifyCodeHash(code, record.codeHash);

  await prisma.emailVerificationCode.update({
    where: { id: record.id },
    data: {
      attempts: { increment: 1 },
      consumedAt: matches ? new Date() : undefined,
    },
  });

  return matches;
}

async function sendVerificationCode({
  email,
  code,
  purpose,
}: {
  email: string;
  code: string;
  purpose: VerificationPurpose;
}) {
  const label = purpose === "login" ? "login" : "email verification";
  const emailSendingDisabled =
    process.env.DISABLE_EMAIL_SENDING === "true" ||
    process.env.NODE_ENV !== "production";
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Dampener <onboarding@resend.dev>";
  const subject =
    purpose === "login"
      ? "Your Dampener login code"
      : "Verify your Dampener email";
  const text = [
    `Your Dampener ${label} code is ${code}.`,
    "",
    `This code expires in ${codeLifetimeMinutes} minutes.`,
    "If you did not request this, you can ignore this email.",
  ].join("\n");
  const html = `
    <div style="font-family: Arial, sans-serif; color: #0c1424; line-height: 1.6;">
      <h1 style="font-size: 22px; margin: 0 0 12px;">Dampener</h1>
      <p>Your ${label} code is:</p>
      <div style="font-size: 32px; font-weight: 700; letter-spacing: 6px; margin: 18px 0; color: #172554;">
        ${code}
      </div>
      <p>This code expires in ${codeLifetimeMinutes} minutes.</p>
      <p style="color: #69778c; font-size: 13px;">If you did not request this, you can ignore this email.</p>
    </div>
  `;

  if (emailSendingDisabled || !resendApiKey) {
    console.log(`[Dampener] ${label} code for ${email}: ${code}`);
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: email,
      subject,
      text,
      html,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();

    console.error(`[Dampener] Failed to send ${label} email: ${errorBody}`);

    if (process.env.NODE_ENV !== "production") {
      console.log(`[Dampener] ${label} code for ${email}: ${code}`);
      return false;
    }

    throw new Error("Failed to send verification email.");
  }

  return true;
}
