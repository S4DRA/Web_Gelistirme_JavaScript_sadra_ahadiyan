import { createHmac, randomBytes } from "crypto";

function getVerificationSecret() {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "dampener-dev-secret";
}

export function createVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function createSignupRequestToken() {
  return randomBytes(32).toString("base64url");
}

export function createAccessRequestToken() {
  return randomBytes(32).toString("base64url");
}

export function hashSignupRequestToken(token: string) {
  return createHmac("sha256", getVerificationSecret())
    .update(`signup-request:${token.trim()}`)
    .digest("base64url");
}

export function hashAccessRequestToken(token: string) {
  return createHmac("sha256", getVerificationSecret())
    .update(`access-request:${token.trim()}`)
    .digest("base64url");
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
