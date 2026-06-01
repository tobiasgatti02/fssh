export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EMAIL_REGEX, PASSWORD_MIN_LENGTH } from "@/lib/validation";
import { createSessionResponse, verifyPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return NextResponse.json({ error: "INVALID_PASSWORD" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(password, user.password_hash)) {
    return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
  }

  return createSessionResponse(user.id, {
    user: {
      id: user.id,
      email: user.email,
      wing: user.wing,
      floor: user.floor,
      door: user.door,
      user_code: user.user_code,
    },
  });
}
