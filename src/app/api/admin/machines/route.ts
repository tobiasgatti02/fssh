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

  const [total, machines] = await Promise.all([
    prisma.machine.count(),
    prisma.machine.findMany({ orderBy: { created_at: "asc" }, skip, take: pageSize }),
  ]);
  return NextResponse.json({ machines, total, page, pageSize });
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

  const id = body.id ? String(body.id) : undefined;
  const nameRaw = typeof body.name === "string" ? body.name : undefined;
  const labelRaw = typeof body.label === "string" ? body.label : undefined;
  const enabledRaw = body.enabled as boolean | undefined;

  if (id) {
    // Partial update
    const data: Record<string, any> = {};
    if (nameRaw !== undefined) data.name = String(nameRaw).trim();
    if (labelRaw !== undefined) data.label = String(labelRaw).trim();
    if (enabledRaw !== undefined) data.enabled = Boolean(enabledRaw);

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "NO_FIELDS" }, { status: 400 });
    }

    try {
      const machine = await prisma.machine.update({ where: { id }, data });
      return NextResponse.json({ machine });
    } catch (e) {
      return NextResponse.json({ error: "CONFLICT" }, { status: 409 });
    }
  } else {
    // Create requires name; label defaults to name; enabled defaults to true
    const name = String((nameRaw ?? "").trim());
    if (!name) return NextResponse.json({ error: "INVALID_NAME" }, { status: 400 });
    const label = String((labelRaw ?? name).trim());
    const enabled = enabledRaw === undefined ? true : Boolean(enabledRaw);
    try {
      const machine = await prisma.machine.create({ data: { name, label, enabled } });
      return NextResponse.json({ machine }, { status: 201 });
    } catch (e) {
      return NextResponse.json({ error: "CONFLICT" }, { status: 409 });
    }
  }
}
