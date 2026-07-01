export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getErrorDetails(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return { code: "ERROR", message: String(error) };
  }

  const candidate = error as { code?: unknown; message?: unknown };
  return {
    code: typeof candidate.code === "string" ? candidate.code : "ERROR",
    message: typeof candidate.message === "string" ? candidate.message : "Unknown database error",
  };
}

export async function GET() {
  const info = (() => {
    const databaseUrl =
      process.env.DATABASE_URL ??
      process.env.POSTGRES_PRISMA_URL ??
      process.env.POSTGRES_URL;
    try {
      const u = new URL(databaseUrl || "");
      return {
        present: !!databaseUrl,
        host: u.host || undefined,
        database: u.pathname?.replace(/^\//, "") || undefined,
        sslmode: u.searchParams.get("sslmode") || undefined,
        pgbouncer: u.searchParams.get("pgbouncer") || undefined,
        connection_limit: u.searchParams.get("connection_limit") || undefined,
        connect_timeout: u.searchParams.get("connect_timeout") || undefined,
        pooler: (u.host || "").includes("pooler"),
      };
    } catch {
      return { present: !!databaseUrl, invalidUrl: true } as const;
    }
  })();

  try {
    const ping = await prisma.$queryRaw`select 1 as ok` as Array<{ ok: number }>;
    const ok = Array.isArray(ping) && ping[0]?.ok === 1;
    console.log("[HEALTH] DB ping ok=", ok, info);
    return NextResponse.json({ ok, info });
  } catch (e) {
    const error = getErrorDetails(e);
    console.error("[HEALTH] DB ping error", error.code, error.message);
    return NextResponse.json({ ok: false, error: error.code, info }, { status: 500 });
  }
}
