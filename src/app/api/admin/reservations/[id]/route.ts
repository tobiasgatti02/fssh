import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthorized } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminAuthorized(request)) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": "Basic realm=admin" },
    });
  }

  const { id } = await params;
  const resv = await prisma.reservation.findUnique({ where: { id } });
  if (!resv) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  await prisma.reservation.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminAuthorized(request)) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": "Basic realm=admin" },
    });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });

  const data: Record<string, any> = {};
  if (body.machine_id !== undefined) data.machine_id = String(body.machine_id);
  if (body.day !== undefined) data.day = Number(body.day);
  if (body.hour !== undefined) data.hour = Number(body.hour);
  if (body.week_id !== undefined) data.week_id = String(body.week_id);
  if (body.user_id !== undefined) data.user_id = String(body.user_id);

  try {
    const updated = await prisma.reservation.update({ where: { id }, data });
    return NextResponse.json({ reservation: updated });
  } catch (e) {
    return NextResponse.json({ error: "CONFLICT" }, { status: 409 });
  }
}
