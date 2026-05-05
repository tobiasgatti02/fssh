import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  buildUserCode,
  isValidDoor,
  isValidFloor,
  MATRICULATION_REGEX,
  USERNAME_REGEX,
  WING_REGEX,
} from "@/lib/validation";
import { createSessionResponse } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const matriculation = String(body.matriculation ?? "").trim();
  const username = String(body.username ?? "").trim();
  const wing = String(body.wing ?? "").trim().toUpperCase();
  const floor = Number(body.floor);
  const door = Number(body.door);

  if (!MATRICULATION_REGEX.test(matriculation)) {
    return NextResponse.json({ error: "INVALID_MATRICULATION" }, { status: 400 });
  }

  if (!USERNAME_REGEX.test(username)) {
    return NextResponse.json({ error: "INVALID_USERNAME" }, { status: 400 });
  }

  if (!WING_REGEX.test(wing) || !isValidFloor(floor) || !isValidDoor(door)) {
    return NextResponse.json({ error: "INVALID_ADDRESS" }, { status: 400 });
  }

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ matriculation }, { wing, floor, door }],
    },
  });

  if (existing) {
    return NextResponse.json({ error: "USER_EXISTS" }, { status: 409 });
  }

  const userCode = buildUserCode(wing, floor, door);

  const user = await prisma.user.create({
    data: {
      matriculation,
      username,
      wing,
      floor,
      door,
      user_code: userCode,
    },
  });

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
