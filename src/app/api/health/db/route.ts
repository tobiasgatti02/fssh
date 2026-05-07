import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const info = (() => {
    try {
      const u = new URL(process.env.DATABASE_URL || "");
      return {
        present: !!process.env.DATABASE_URL,
        host: u.host || undefined,
        database: u.pathname?.replace(/^\//, "") || undefined,
        sslmode: u.searchParams.get("sslmode") || undefined,
        pgbouncer: u.searchParams.get("pgbouncer") || undefined,
        connection_limit: u.searchParams.get("connection_limit") || undefined,
        connect_timeout: u.searchParams.get("connect_timeout") || undefined,
        pooler: (u.host || "").includes("pooler"),
      };
    } catch {
      return { present: !!process.env.DATABASE_URL, invalidUrl: true } as const;
    }
  })();

  try {
    const ping = await prisma.$queryRaw`select 1 as ok` as Array<{ ok: number }>;
    const ok = Array.isArray(ping) && ping[0]?.ok === 1;
    console.log("[HEALTH] DB ping ok=", ok, info);
    return NextResponse.json({ ok, info });
  } catch (e) {
    console.error("[HEALTH] DB ping error", (e as any)?.code, (e as any)?.message);
    return NextResponse.json({ ok: false, error: (e as any)?.code || "ERROR", info }, { status: 500 });
  }
}
