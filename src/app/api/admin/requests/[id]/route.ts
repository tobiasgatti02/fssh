export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, isAdminAuthorized } from "@/lib/auth";
import { WING_REGEX, isValidDoor, isValidFloor } from "@/lib/validation";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminAuthorized(request)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });

  const action = String(body.action ?? "").toLowerCase();

  if (action === "decline") {
    const existing = await prisma.accountRequest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    const updated = await prisma.accountRequest.update({
      where: { id },
      data: { status: "DECLINED", decided_at: new Date(), decided_by: "admin" },
    });
    return NextResponse.json({ request: updated });
  }

  if (action !== "approve") {
    return NextResponse.json({ error: "INVALID_ACTION" }, { status: 400 });
  }

  const wing = String(body.wing ?? "").trim().toUpperCase();
  const floor = Number(body.floor);
  const door = Number(body.door);

  if (!WING_REGEX.test(wing) || !isValidFloor(floor) || !isValidDoor(door)) {
    return NextResponse.json({ error: "INVALID_ADDRESS" }, { status: 400 });
  }

  const accountRequest = await prisma.accountRequest.findUnique({ where: { id } });
  if (!accountRequest || accountRequest.status !== "PENDING") {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const existingUser = await prisma.user.findUnique({ where: { email: accountRequest.email } });
  if (existingUser) {
    return NextResponse.json({ error: "USER_EXISTS" }, { status: 409 });
  }

  const existingAddress = await prisma.user.findFirst({ where: { wing, floor, door } });
  if (existingAddress) {
    return NextResponse.json({ error: "ADDRESS_CONFLICT" }, { status: 409 });
  }

  const userCode = `${wing}${floor}${door.toString().padStart(2, "0")}`;
  const username = accountRequest.email;
  const password = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  const passwordHash = hashPassword(password);

  const [user, updated] = await prisma.$transaction([
    prisma.user.create({
      data: {
        email: accountRequest.email,
        password_hash: passwordHash,
        username,
        wing,
        floor,
        door,
        user_code: userCode,
      },
    }),
    prisma.accountRequest.update({
      where: { id },
      data: { status: "APPROVED", decided_at: new Date(), decided_by: "admin" },
    }),
  ]);

  return NextResponse.json({ user, request: updated, password });
}
