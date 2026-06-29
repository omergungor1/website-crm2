export function getTelegramConfig() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
  const allowedUserId = process.env.TELEGRAM_ALLOWED_USER_ID || "";
  const ownerUserId = process.env.TELEGRAM_OWNER_USER_ID || "";
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET || "";
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  return {
    botToken,
    allowedUserId: allowedUserId ? Number(allowedUserId) : null,
    ownerUserId: ownerUserId || null,
    webhookSecret,
    appUrl,
    isConfigured: Boolean(botToken && allowedUserId),
  };
}

export function getWebhookUrl() {
  const { appUrl } = getTelegramConfig();
  if (!appUrl) return null;
  return `${appUrl.replace(/\/$/, "")}/api/telegram/webhook`;
}
