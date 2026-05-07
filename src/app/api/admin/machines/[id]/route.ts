export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthorized } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminAuthorized(request)) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": "Basic realm=admin" },
    });
  }

  const { id } = await params;
  try {
    await prisma.machine.delete({ where: { id } });
  } catch (e) {
    return NextResponse.json({ error: "CONFLICT" }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
