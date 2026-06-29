/**
 * Vercel build sonrası Telegram webhook'unu otomatik kurar.
 * TELEGRAM_AUTO_SETUP=true ve gerekli env'ler tanımlı olmalı.
 */
async function main() {
  if (process.env.TELEGRAM_AUTO_SETUP !== "true") {
    console.log("[telegram-setup] TELEGRAM_AUTO_SETUP aktif değil, atlanıyor.");
    return;
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const allowedUserId = process.env.TELEGRAM_ALLOWED_USER_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  if (!token || !allowedUserId || !appUrl) {
    console.warn("[telegram-setup] Eksik env, webhook kurulmadı.");
    return;
  }

  const webhookUrl = `${appUrl.replace(/\/$/, "")}/api/telegram/webhook`;
  const body = { url: webhookUrl, allowed_updates: ["message"] };
  if (process.env.TELEGRAM_WEBHOOK_SECRET) {
    body.secret_token = process.env.TELEGRAM_WEBHOOK_SECRET;
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (data.ok) {
    console.log("[telegram-setup] Webhook kuruldu:", webhookUrl);
  } else {
    console.error("[telegram-setup] Hata:", data.description);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[telegram-setup]", err);
  process.exit(1);
});
