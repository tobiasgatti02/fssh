import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest) {
  try {
    console.log("[API] /api/machines GET start");
    // If no machines exist, seed defaults
    const count = await prisma.machine.count();
    console.log("[API] /api/machines count=", count);
    if (count === 0) {
      console.log("[API] /api/machines seeding defaults");
      await prisma.machine.createMany({
        data: [
          { name: "washer1", label: "Washing Machine 1", enabled: true },
          { name: "washer2", label: "Washing Machine 2", enabled: true },
          { name: "dryer", label: "Dryer", enabled: true },
        ],
        skipDuplicates: true,
      });
    }

    const machines = await prisma.machine.findMany({ orderBy: { created_at: "asc" } });
    console.log("[API] /api/machines returning=", machines.length);
    return NextResponse.json({ machines });
  } catch (e) {
    console.error("[API] /api/machines error", (e as any)?.code, (e as any)?.message);
    return NextResponse.json({ machines: [] }, { status: 500 });
  }
}
