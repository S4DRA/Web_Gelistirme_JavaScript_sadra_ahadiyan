import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { getPrisma } from "@/lib/prisma";

const scrypt = promisify(scryptCallback);
const sessionCookieName = "dampener_session";
const sessionDurationSeconds = 60 * 60 * 24 * 7;
const publicAccessEnabled = true;
const publicAccessEmail = "public@dampener.app";

type SessionPayload = {
  userId: string;
  expiresAt: number;
};

export type AuthUser = {
  id: string;
  email: string;
  username: string | null;
  phoneNumber: string | null;
  profileImage: string | null;
};

function getSessionSecret() {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "dampener-dev-secret";
}

function encodeBase64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function parseCookies(cookieHeader: string | null) {
  const cookies = new Map<string, string>();

  if (!cookieHeader) {
    return cookies;
  }

  for (const cookie of cookieHeader.split(";")) {
    const [name, ...valueParts] = cookie.trim().split("=");

    if (!name || valueParts.length === 0) {
      continue;
    }

    cookies.set(name, decodeURIComponent(valueParts.join("=")));
  }

  return cookies;
}

function getSessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    maxAge,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const key = (await scrypt(password, salt, 64)) as Buffer;

  return `scrypt:${salt}:${key.toString("base64url")}`;
}

export async function verifyPassword(password: string, storedPassword: string) {
  const [algorithm, salt, storedKey] = storedPassword.split(":");

  if (algorithm !== "scrypt" || !salt || !storedKey) {
    return password === storedPassword;
  }

  const key = (await scrypt(password, salt, 64)) as Buffer;
  const storedKeyBuffer = Buffer.from(storedKey, "base64url");

  if (key.length !== storedKeyBuffer.length) {
    return false;
  }

  return timingSafeEqual(key, storedKeyBuffer);
}

export function createSessionCookie(userId: string) {
  const payload: SessionPayload = {
    userId,
    expiresAt: Date.now() + sessionDurationSeconds * 1000,
  };
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = sign(encodedPayload);

  return {
    name: sessionCookieName,
    options: getSessionCookieOptions(sessionDurationSeconds),
    value: `${encodedPayload}.${signature}`,
  };
}

export function createExpiredSessionCookie() {
  return {
    name: sessionCookieName,
    options: getSessionCookieOptions(0),
    value: "",
  };
}

export async function getCurrentUser(request: Request): Promise<AuthUser | null> {
  const sessionCookie = parseCookies(request.headers.get("cookie")).get(sessionCookieName);

  if (!sessionCookie) {
    if (publicAccessEnabled) {
      return getPublicAccessUser();
    }

    return null;
  }

  const [encodedPayload, signature] = sessionCookie.split(".");

  if (!encodedPayload || !signature || sign(encodedPayload) !== signature) {
    if (publicAccessEnabled) {
      return getPublicAccessUser();
    }

    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload)) as SessionPayload;

    if (!payload.userId || payload.expiresAt < Date.now()) {
      if (publicAccessEnabled) {
        return getPublicAccessUser();
      }

      return null;
    }

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        username: true,
        phoneNumber: true,
        profileImage: true,
      },
    });

    if (!user && publicAccessEnabled) {
      return getPublicAccessUser();
    }

    return user;
  } catch {
    if (publicAccessEnabled) {
      return getPublicAccessUser();
    }

    return null;
  }
}

async function getPublicAccessUser(): Promise<AuthUser> {
  const prisma = getPrisma();

  return prisma.user.upsert({
    where: { email: publicAccessEmail },
    update: {},
    create: {
      email: publicAccessEmail,
      password: "public-access-disabled-login",
      preference: {
        create: {
          currency: "USD",
          onboardingComplete: true,
        },
      },
    },
    select: {
      id: true,
      email: true,
      username: true,
      phoneNumber: true,
      profileImage: true,
    },
  });
}
