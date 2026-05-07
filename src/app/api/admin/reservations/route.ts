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

  const [total, reservations] = await Promise.all([
    prisma.reservation.count(),
    prisma.reservation.findMany({
      orderBy: [{ week_id: "desc" }, { day: "asc" }, { hour: "asc" }],
      skip,
      take: pageSize,
      include: { machine: { select: { id: true, name: true, label: true } } },
    }),
  ]);

  return NextResponse.json({ reservations, total, page, pageSize });
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

  const machine_id = String(body.machine_id ?? "");
  const day = Number(body.day);
  const hour = Number(body.hour);
  const week_id = String(body.week_id ?? "");
  const user_id = String(body.user_id ?? "");

  if (!machine_id || !Number.isInteger(day) || !Number.isInteger(hour) || !week_id || !user_id) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  try {
    const resv = await prisma.reservation.create({
      data: { machine_id, day, hour, week_id, user_id, user_code: "" },
    });
    return NextResponse.json({ reservation: resv }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "CONFLICT" }, { status: 409 });
  }
}
