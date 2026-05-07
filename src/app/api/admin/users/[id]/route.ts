export const runtime = "nodejs";
export const dynamic = "force-dynamic";
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

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  await prisma.user.delete({ where: { id } });
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

  const username = body.username !== undefined ? String(body.username).trim() : undefined;
  const wing = body.wing !== undefined ? String(body.wing).trim().toUpperCase() : undefined;
  const floor = body.floor !== undefined ? Number(body.floor) : undefined;
  const door = body.door !== undefined ? Number(body.door) : undefined;

  const data: Record<string, any> = {};
  if (username !== undefined) data.username = username;
  if (wing !== undefined) data.wing = wing;
  if (floor !== undefined) data.floor = floor;
  if (door !== undefined) data.door = door;

  // recompute user_code if address changed fully
  if (wing !== undefined || floor !== undefined || door !== undefined) {
    const current = await prisma.user.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const newWing = wing ?? current.wing;
    const newFloor = floor ?? current.floor;
    const newDoor = door ?? current.door;
    data.user_code = `${newWing}${newFloor}${newDoor.toString().padStart(2, "0")}`;
  }

  try {
    const updated = await prisma.user.update({ where: { id }, data });
    return NextResponse.json({ user: updated });
  } catch (e) {
    return NextResponse.json({ error: "CONFLICT" }, { status: 409 });
  }
}
