export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EMAIL_REGEX } from "@/lib/validation";
import nodemailer from "nodemailer";

function getSmtpConfig() {
  const host = process.env.SMTP_HOST ?? "";
  const port = Number(process.env.SMTP_PORT ?? 0);
  const user = process.env.SMTP_USER ?? "";
  const pass = process.env.SMTP_PASS ?? "";
  const from = process.env.SMTP_FROM ?? "";

  if (!host || !port || !user || !pass || !from) {
    return null;
  }

  return { host, port, user, pass, from };
}

async function notifyRequest(email: string) {
  const config = getSmtpConfig();
  if (!config) return;

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: false,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    requireTLS: true,
  });

  const subject = "New access request";
  const message = `A user with email ${email} submitted an access request.`;

  await transporter.sendMail({
    from: config.from,
    to: "bookingsystem@fssh.at",
    subject,
    text: message,
    html: `<p>${message}</p>`,
    replyTo: config.from,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();

  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ error: "USER_EXISTS" }, { status: 409 });
  }

  const existingRequest = await prisma.accountRequest.findUnique({ where: { email } });
  if (existingRequest) {
    if (existingRequest.status === "PENDING") {
      try {
        await notifyRequest(email);
      } catch (error) {
        console.error("[API] /api/auth/register notify error", (error as any)?.message);
      }
      return NextResponse.json({ ok: true, status: "PENDING" });
    }

    await prisma.accountRequest.update({
      where: { email },
      data: { status: "PENDING", decided_at: null, decided_by: null },
    });
    try {
      await notifyRequest(email);
    } catch (error) {
      console.error("[API] /api/auth/register notify error", (error as any)?.message);
    }
    return NextResponse.json({ ok: true, status: "PENDING" });
  }

  await prisma.accountRequest.create({
    data: { email, status: "PENDING" },
  });

  try {
    await notifyRequest(email);
  } catch (error) {
    console.error("[API] /api/auth/register notify error", (error as any)?.message);
  }

  return NextResponse.json({ ok: true, status: "PENDING" }, { status: 201 });
}
