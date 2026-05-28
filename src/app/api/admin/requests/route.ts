export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthorized } from "@/lib/auth";

const VALID_STATUSES = new Set(["PENDING", "APPROVED", "DECLINED"]);

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": "Basic realm=admin" },
    });
  }

  const url = new URL(request.url);
  const statusRaw = String(url.searchParams.get("status") ?? "PENDING").toUpperCase();
  const status = VALID_STATUSES.has(statusRaw) ? statusRaw : "PENDING";

  const [total, requests] = await Promise.all([
    prisma.accountRequest.count({ where: { status } }),
    prisma.accountRequest.findMany({
      where: { status },
      orderBy: { created_at: "desc" },
    }),
  ]);

  return NextResponse.json({ requests, total, status });
}
