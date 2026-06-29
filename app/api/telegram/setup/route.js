import { NextResponse } from "next/server";
import { getTelegramConfig, getWebhookUrl } from "@/lib/telegram/config";
import { setWebhook, deleteWebhook, getWebhookInfo } from "@/lib/telegram/client";

export const runtime = "nodejs";

function checkSetupAuth(request) {
  const secret = process.env.TELEGRAM_SETUP_SECRET || process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) return true;
  const header = request.headers.get("x-telegram-setup-secret");
  const urlSecret = new URL(request.url).searchParams.get("secret");
  return header === secret || urlSecret === secret;
}

export async function GET(request) {
  if (!checkSetupAuth(request)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const config = getTelegramConfig();
  if (!config.isConfigured) {
    return NextResponse.json({
      configured: false,
      error: "TELEGRAM_BOT_TOKEN ve TELEGRAM_ALLOWED_USER_ID gerekli",
    });
  }

  try {
    const info = await getWebhookInfo();
    return NextResponse.json({
      configured: true,
      webhookUrl: getWebhookUrl(),
      telegram: info,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  if (!checkSetupAuth(request)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const config = getTelegramConfig();
  if (!config.isConfigured) {
    return NextResponse.json({ error: "Bot yapılandırılmamış" }, { status: 503 });
  }

  const webhookUrl = getWebhookUrl();
  if (!webhookUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_APP_URL veya VERCEL_URL tanımlı değil" },
      { status: 400 }
    );
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const action = body.action || "set";

  try {
    if (action === "delete") {
      const result = await deleteWebhook();
      return NextResponse.json({ ok: true, action: "delete", result });
    }

    const result = await setWebhook(webhookUrl, config.webhookSecret || undefined);
    return NextResponse.json({ ok: true, action: "set", webhookUrl, result });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
