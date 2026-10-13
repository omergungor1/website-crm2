import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Günlük proje analizi / proaktif Telegram önerileri KAPALI.
 * Eski Vercel cron bu path'i çağırırsa artık mesaj göndermez.
 */
export async function GET() {
  return NextResponse.json({
    skipped: true,
    disabled: true,
    reason: "Günlük Telegram proje analizi kapatıldı",
  });
}

export async function POST() {
  return GET();
}
