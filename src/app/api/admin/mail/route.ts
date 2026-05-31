export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { isAdminAuthorized } from "@/lib/auth";

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

export async function POST(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });

  const to = String(body.to ?? "").trim().toLowerCase();
  const subject = String(body.subject ?? "").trim();
  const message = String(body.message ?? "").trim();

  if (!to || !subject || !message) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const config = getSmtpConfig();
  if (!config) {
    return NextResponse.json({ error: "SMTP_NOT_CONFIGURED" }, { status: 500 });
  }

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

  const htmlMessage = message
    .split("\n")
    .map((line) => line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"))
    .join("<br />");

  try {
    await transporter.sendMail({
      from: config.from,
      to,
      subject,
      text: message,
      html: `<p>${htmlMessage}</p>`,
      replyTo: config.from,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API] /api/admin/mail error", (error as any)?.message);
    return NextResponse.json({ error: "SEND_FAILED" }, { status: 500 });
  }
}
