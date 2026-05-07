import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthorized } from "@/lib/auth";

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": "Basic realm=admin" },
    });
  }

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") ?? 20)));
  const skip = (page - 1) * pageSize;

  const [total, users] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({
      orderBy: { created_at: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        matriculation: true,
        username: true,
        wing: true,
        floor: true,
        door: true,
        user_code: true,
        created_at: true,
        _count: { select: { reservations: true } },
      },
    }),
  ]);

  return NextResponse.json({ users, total, page, pageSize });
}

export async function POST(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": "Basic realm=admin" },
    });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });

  const matriculation = String(body.matriculation ?? "").trim();
  const username = String(body.username ?? "").trim();
  const wing = String(body.wing ?? "").trim().toUpperCase();
  const floor = Number(body.floor);
  const door = Number(body.door);

  if (!matriculation || !username || !wing || !Number.isInteger(floor) || !Number.isInteger(door)) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  // ensure uniqueness on matriculation and address
  const existing = await prisma.user.findFirst({
    where: { OR: [{ matriculation }, { wing, floor, door }] },
  });
  if (existing) return NextResponse.json({ error: "CONFLICT" }, { status: 409 });

  const userCode = `${wing}${floor}${door.toString().padStart(2, "0")}`;

  try {
    const user = await prisma.user.create({
      data: { matriculation, username, wing, floor, door, user_code: userCode },
    });
    return NextResponse.json({ user }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
