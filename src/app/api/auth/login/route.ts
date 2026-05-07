export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MATRICULATION_REGEX } from "@/lib/validation";
import { createSessionResponse } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const matriculation = String(body.matriculation ?? "").trim();
  if (!MATRICULATION_REGEX.test(matriculation)) {
    return NextResponse.json({ error: "INVALID_MATRICULATION" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { matriculation } });
  if (!user) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return createSessionResponse(user.id, {
    user: {
      id: user.id,
      matriculation: user.matriculation,
      username: user.username,
      wing: user.wing,
      floor: user.floor,
      door: user.door,
      user_code: user.user_code,
    },
  });
}
