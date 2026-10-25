import { cfg } from "../../lib/config.mjs";
import { tg } from "../../lib/tg.mjs";

// Разовая настройка после деплоя: открой https://<сайт>/api/setup?key=<SETUP_KEY>
export default async (req) => {
  const url = new URL(req.url);
  if (!cfg.SETUP_KEY || url.searchParams.get("key") !== cfg.SETUP_KEY) {
    return new Response("forbidden", { status: 403 });
  }
  const origin = url.origin;
  const webhook = await tg("setWebhook", {
    url: `${origin}/api/telegram`,
    secret_token: cfg.WEBHOOK_SECRET || undefined,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: true,
  });
  const commands = await tg("setMyCommands", {
    commands: [
      { command: "start", description: "Начало" },
      { command: "topics", description: "Подборки по темам" },
      { command: "lang", description: "Язык курсов" },
      { command: "saved", description: "Избранное" },
      { command: "mysubs", description: "Мои подписки" },
      { command: "pro", description: "💎 Pro-доступ" },
    ],
  });
  const info = await tg("getWebhookInfo");
  return Response.json({
    telegram_webhook: webhook,
    commands,
    webhook_info: info.result,
    cryptopay_webhook_url: `${origin}/api/cryptopay/${cfg.WEBHOOK_SECRET || "<WEBHOOK_SECRET>"}`,
    next: "Вставь cryptopay_webhook_url в @CryptoBot → Crypto Pay → My Apps → Webhooks",
  });
};

export const config = { path: "/api/setup" };
