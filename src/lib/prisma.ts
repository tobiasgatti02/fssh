import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool } from "@neondatabase/serverless";

function maskDbUrl(raw?: string) {
  if (!raw) return { present: false };
  try {
    const u = new URL(raw);
    const hasPassword = !!u.password;
    if (hasPassword) u.password = "***";
    const sslmode = u.searchParams.get("sslmode");
    const pgbouncer = u.searchParams.get("pgbouncer");
    const connection_limit = u.searchParams.get("connection_limit");
    const connect_timeout = u.searchParams.get("connect_timeout");
    return {
      present: true,
      host: u.host,
      database: u.pathname.replace(/^\//, ""),
      sslmode,
      pgbouncer,
      connection_limit,
      connect_timeout,
      pooler: u.host.includes("pooler"),
      masked: u.toString(),
    };
  } catch {
    return { present: true, invalidUrl: true } as const;
  }
}

const globalForPrisma = globalThis as { prisma?: PrismaClient };

function createPrismaClient() {
  const dbInfo = maskDbUrl(process.env.DATABASE_URL);
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log("[DB] Prisma init", dbInfo);
  }
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({
    log: process.env.NODE_ENV === "production" ? ["warn", "error"] : ["query", "warn", "error"],
    adapter,
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
