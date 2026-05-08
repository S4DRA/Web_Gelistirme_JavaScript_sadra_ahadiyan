import { createHmac } from "crypto";

function getVerificationSecret() {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "dampener-dev-secret";
}

export function createVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function hashVerificationCode(email: string, code: string) {
  return createHmac("sha256", getVerificationSecret())
    .update(`${email.trim().toLowerCase()}:${code.trim()}`)
    .digest("base64url");
}

export function hashEmailChangeVerificationCode(
  userId: string,
  email: string,
  code: string,
) {
  return createHmac("sha256", getVerificationSecret())
    .update(`${userId}:${email.trim().toLowerCase()}:${code.trim()}`)
    .digest("base64url");
}
