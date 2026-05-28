import { type NextRequest, NextResponse } from "next/server";
import { pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "laundry_session";
export const SESSION_TTL_DAYS = 14;

export type SessionUser = {
  id: string;
  email: string;
  username: string;
  wing: string;
  floor: number;
  door: number;
  user_code: string;
};

const PASSWORD_ITERATIONS = 150_000;
const PASSWORD_KEYLEN = 32;
const PASSWORD_DIGEST = "sha256" as const;

function getSessionExpiry(): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + SESSION_TTL_DAYS);
  return expiry;
}

export async function getSessionUserFromRequest(
  request: NextRequest
): Promise<SessionUser | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expires_at <= new Date()) {
    return null;
  }

  const { user } = session;
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    wing: user.wing,
    floor: user.floor,
    door: user.door,
    user_code: user.user_code,
  };
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, PASSWORD_KEYLEN, PASSWORD_DIGEST);
  return ["pbkdf2", PASSWORD_ITERATIONS.toString(), salt.toString("base64"), hash.toString("base64")].join(
    "$"
  );
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = Number(parts[1]);
  if (!Number.isFinite(iterations) || iterations <= 0) return false;
  const salt = Buffer.from(parts[2], "base64");
  const expected = Buffer.from(parts[3], "base64");
  const actual = pbkdf2Sync(password, salt, iterations, expected.length, PASSWORD_DIGEST);
  return timingSafeEqual(expected, actual);
}

export async function createSessionResponse<T>(userId: string, payload: T) {
  const token = crypto.randomUUID();
  const expiresAt = getSessionExpiry();

  // Enforce single active session per user: remove previous sessions
  await prisma.session.deleteMany({ where: { user_id: userId } });

  await prisma.session.create({
    data: {
      token,
      user_id: userId,
      expires_at: expiresAt,
    },
  });

  const response = NextResponse.json(payload);
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return response;
}

export function clearSessionResponse() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });

  return response;
}

export function isAdminAuthorized(request: NextRequest): boolean {
  const header = request.headers.get("authorization");
  if (!header || !header.startsWith("Basic ")) return false;
  try {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const [username, password] = decoded.split(":");
    const expectedUser = process.env.ADMIN_USER || "fssh";
    const expectedPass = process.env.ADMIN_PASS || ">y26}Zvzo8eJ";
    return username === expectedUser && password === expectedPass;
  } catch {
    return false;
  }
}

export async function withRateLimit(
  userId: string,
  action: "reserve" | "cancel",
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const since = new Date(Date.now() - windowMs);
  const count = await prisma.userAction.count({
    where: {
      user_id: userId,
      action,
      created_at: { gte: since },
    },
  });

  if (count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil(windowMs / 1000) };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export async function recordUserAction(userId: string, action: "reserve" | "cancel") {
  await prisma.userAction.create({
    data: {
      user_id: userId,
      action,
    },
  });
}
