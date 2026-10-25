import { cfg } from "./config.mjs";

/** Вызов Telegram Bot API. Никогда не бросает — возвращает {ok, result|description}. */
export async function tg(method, params = {}) {
  try {
    const r = await fetch(`https://api.telegram.org/bot${cfg.BOT_TOKEN}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(15000),
    });
    const j = await r.json();
    if (!j.ok) console.warn(`tg.${method}:`, j.description);
    return j;
  } catch (e) {
    console.warn(`tg.${method} failed:`, e.message);
    return { ok: false, description: e.message };
  }
}

export const HTML = { parse_mode: "HTML", link_preview_options: { is_disabled: true } };
export const kb = (rows) => ({ inline_keyboard: rows.filter((r) => r.length) });
export const btn = (text, callback_data) => ({ text, callback_data });
export const urlBtn = (text, url) => ({ text, url });
export const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));
export const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const send = (chat_id, text, extra = {}) => tg("sendMessage", { chat_id, text, ...extra });
