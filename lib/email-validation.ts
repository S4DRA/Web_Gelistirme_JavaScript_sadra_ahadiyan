import { resolve4, resolveMx } from "dns/promises";

const blockedDomains = new Set([
  "example.com",
  "example.org",
  "example.net",
  "test.com",
  "invalid.com",
]);

export function isValidEmailFormat(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function validateEmailCanReceiveMail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!isValidEmailFormat(normalizedEmail)) {
    return {
      valid: false,
      reason: "Enter a valid email address.",
    };
  }

  const domain = normalizedEmail.split("@")[1];

  if (!domain || blockedDomains.has(domain)) {
    return {
      valid: false,
      reason: "Use a real email address.",
    };
  }

  try {
    const records = await resolveMx(domain);

    if (records.length > 0) {
      return { valid: true };
    }
  } catch {
    // Some valid domains accept mail on A records without explicit MX records.
  }

  try {
    const records = await resolve4(domain);

    if (records.length > 0) {
      return { valid: true };
    }
  } catch {
    return {
      valid: false,
      reason: "That email domain cannot receive mail.",
    };
  }

  return {
    valid: false,
    reason: "That email domain cannot receive mail.",
  };
}
