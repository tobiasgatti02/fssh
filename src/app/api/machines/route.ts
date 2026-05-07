import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest) {
  try {
    // If no machines exist, seed defaults
    const count = await prisma.machine.count();
    if (count === 0) {
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
    return NextResponse.json({ machines });
  } catch {
    return NextResponse.json({ machines: [] });
  }
}
