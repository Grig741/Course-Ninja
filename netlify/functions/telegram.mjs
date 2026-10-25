import { cfg } from "../../lib/config.mjs";
import { handleUpdate } from "../../lib/bot.mjs";

// Вебхук Telegram: POST /api/telegram
export default async (req) => {
  if (req.method !== "POST") return new Response("ok");
  if (cfg.WEBHOOK_SECRET && req.headers.get("x-telegram-bot-api-secret-token") !== cfg.WEBHOOK_SECRET) {
    return new Response("forbidden", { status: 403 });
  }
  let update;
  try {
    update = await req.json();
  } catch {
    return new Response("bad request", { status: 400 });
  }
  await handleUpdate(update);
  return new Response("ok");
};

export const config = { path: "/api/telegram" };
