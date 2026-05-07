import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { WEEK_ID_REGEX } from "@/lib/validation";
import { Prisma } from "@/generated/prisma/client";
import { getSessionUserFromRequest, recordUserAction, withRateLimit } from "@/lib/auth";

// Machines are dynamic now; validate against DB

export async function GET(request: NextRequest) {
  const weekId = request.nextUrl.searchParams.get("week_id");
  if (!weekId || !WEEK_ID_REGEX.test(weekId)) {
    return NextResponse.json({ error: "INVALID_WEEK" }, { status: 400 });
  }

  try {
    const reservations = await prisma.reservation.findMany({
      where: { week_id: weekId },
      orderBy: [{ day: "asc" }, { hour: "asc" }],
    });
    return NextResponse.json({ reservations });
  } catch {
    // Fail-safe: never break the UI if DB read fails
    return NextResponse.json({ reservations: [] });
  }
}

export async function POST(request: NextRequest) {
  const sessionUser = await getSessionUserFromRequest(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const machineId = String(body.machine_id ?? "");
  const day = Number(body.day);
  const hour = Number(body.hour);
  const weekId = String(body.week_id ?? "");

  if (!machineId) {
    return NextResponse.json({ error: "INVALID_MACHINE" }, { status: 400 });
  }

  if (!Number.isInteger(day) || day < 0 || day > 6) {
    return NextResponse.json({ error: "INVALID_DAY" }, { status: 400 });
  }

  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    return NextResponse.json({ error: "INVALID_HOUR" }, { status: 400 });
  }

  if (!WEEK_ID_REGEX.test(weekId)) {
    return NextResponse.json({ error: "INVALID_WEEK" }, { status: 400 });
  }

  // Check machine exists and is enabled
  const machine = await prisma.machine.findUnique({ where: { id: machineId } });
  if (!machine) {
    return NextResponse.json({ error: "INVALID_MACHINE" }, { status: 400 });
  }
  if (!machine.enabled) {
    return NextResponse.json({ error: "MACHINE_DISABLED" }, { status: 409 });
  }

  const rate = await withRateLimit(sessionUser.id, "reserve", 6, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const count = await tx.reservation.count({
        where: { user_id: sessionUser.id, week_id: weekId },
      });

      if (count >= 3) {
        return { error: "MAX_RESERVATIONS" as const };
      }

      const reservation = await tx.reservation.create({
        data: {
          machine_id: machineId,
          day,
          hour,
          user_code: sessionUser.user_code,
          user_id: sessionUser.id,
          week_id: weekId,
        },
      });

      return { reservation };
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    if (result.reservation) {
      await recordUserAction(sessionUser.id, "reserve");
    }

    return NextResponse.json({ reservation: result.reservation }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "SLOT_UNAVAILABLE" }, { status: 409 });
    }

    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
