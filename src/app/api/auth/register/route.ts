export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EMAIL_REGEX } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();

  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ error: "USER_EXISTS" }, { status: 409 });
  }

  const existingRequest = await prisma.accountRequest.findUnique({ where: { email } });
  if (existingRequest) {
    if (existingRequest.status === "PENDING") {
      return NextResponse.json({ ok: true, status: "PENDING" });
    }

    await prisma.accountRequest.update({
      where: { email },
      data: { status: "PENDING", decided_at: null, decided_by: null },
    });
    return NextResponse.json({ ok: true, status: "PENDING" });
  }

  await prisma.accountRequest.create({
    data: { email, status: "PENDING" },
  });

  return NextResponse.json({ ok: true, status: "PENDING" }, { status: 201 });
}
