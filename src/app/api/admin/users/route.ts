export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, isAdminAuthorized } from "@/lib/auth";
import { EMAIL_REGEX, USERNAME_REGEX, WING_REGEX, isValidDoor, isValidFloor } from "@/lib/validation";

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
        email: true,
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

  const email = String(body.email ?? "").trim().toLowerCase();
  const username = String(body.username ?? "").trim();
  const wing = String(body.wing ?? "").trim().toUpperCase();
  const floor = Number(body.floor);
  const door = Number(body.door);

  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
  }

  if (!USERNAME_REGEX.test(username)) {
    return NextResponse.json({ error: "INVALID_USERNAME" }, { status: 400 });
  }

  if (!WING_REGEX.test(wing) || !isValidFloor(floor) || !isValidDoor(door)) {
    return NextResponse.json({ error: "INVALID_ADDRESS" }, { status: 400 });
  }

  if (!email || !username || !wing || !Number.isInteger(floor) || !Number.isInteger(door)) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  // ensure uniqueness on email and address
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { wing, floor, door }] },
  });
  if (existing) return NextResponse.json({ error: "CONFLICT" }, { status: 409 });

  const userCode = `${wing}${floor}${door.toString().padStart(2, "0")}`;
  const password = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  const passwordHash = hashPassword(password);

  try {
    const user = await prisma.user.create({
      data: { email, password_hash: passwordHash, username, wing, floor, door, user_code: userCode },
    });
    return NextResponse.json({ user, password }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
