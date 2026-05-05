import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeUserCode, RESERVATION_CODE_REGEX } from "@/lib/validation";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const userCode = normalizeUserCode(String(body.user_code ?? ""));
  if (!RESERVATION_CODE_REGEX.test(userCode)) {
    return NextResponse.json({ error: "INVALID_CODE" }, { status: 400 });
  }

  const reservation = await prisma.reservation.findUnique({ where: { id } });
  if (!reservation) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  if (reservation.user_code !== userCode) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  await prisma.reservation.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
