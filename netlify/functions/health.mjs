import { cfg } from "../../lib/config.mjs";
import { tg } from "../../lib/tg.mjs";
import { searchStepik, searchCoursera, searchYoutube } from "../../lib/sources.mjs";
import { createClient } from "@supabase/supabase-js";

// Диагностика: https://<сайт>/api/health?key=<SETUP_KEY>
// Показывает, что настроено, а что нет. Секреты не выводятся.
export default async (req) => {
  const url = new URL(req.url);
  if (!cfg.SETUP_KEY || url.searchParams.get("key") !== cfg.SETUP_KEY) {
    return Response.json({ error: "Нужен ?key=<SETUP_KEY>. Если SETUP_KEY не задан в Netlify — задай и пересобери." }, { status: 403 });
  }
  const problems = [];
  const env = Object.fromEntries(
    ["BOT_TOKEN", "BOT_USERNAME", "WEBHOOK_SECRET", "SETUP_KEY", "ADMIN_IDS", "SUPABASE_URL", "SUPABASE_SERVICE_KEY",
      "YOUTUBE_API_KEY", "CRYPTOPAY_TOKEN", "BANK_DETAILS"].map((k) => [k, !!process.env[k]]),
  );
  for (const k of ["BOT_TOKEN", "WEBHOOK_SECRET", "ADMIN_IDS", "SUPABASE_URL", "SUPABASE_SERVICE_KEY"]) {
    if (!env[k]) problems.push(`Не задана переменная ${k}`);
  }

  // Telegram
  const telegram = {};
  if (cfg.BOT_TOKEN) {
    const me = await tg("getMe");
    telegram.token_ok = !!me.ok;
    telegram.bot = me.ok ? `@${me.result.username}` : me.description;
    if (!me.ok) problems.push(`BOT_TOKEN неверный: ${me.description}`);
    const wh = await tg("getWebhookInfo");
    const w = wh.result || {};
    telegram.webhook_url = w.url || "(не установлен)";
    telegram.pending_updates = w.pending_update_count;
    telegram.last_error = w.last_error_message || null;
    const expected = `${url.origin}/api/telegram`;
    if (me.ok && w.url !== expected) problems.push(`Вебхук не на этот сайт (сейчас: ${w.url || "пусто"}). Открой ${url.origin}/api/setup?key=<SETUP_KEY>`);
    if (w.last_error_message) problems.push(`Telegram не может достучаться до бота: ${w.last_error_message}`);
    if (process.env.BOT_USERNAME && me.ok && process.env.BOT_USERNAME.replace(/^@|https?:\/\/t\.me\//g, "").toLowerCase() !== me.result.username.toLowerCase()) {
      problems.push(`BOT_USERNAME (${process.env.BOT_USERNAME}) не совпадает с ботом по токену (@${me.result.username})`);
    }
  }

  // Supabase
  const supabase = {};
  if (cfg.SUPABASE_URL && cfg.SUPABASE_SERVICE_KEY) {
    try {
      const sb = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
      for (const t of ["users", "sessions", "search_cache", "payments", "queries"]) {
        const { error } = await sb.from(t).select("*", { count: "exact", head: true });
        supabase[t] = error ? `ошибка: ${error.message}` : "ok";
        if (error) problems.push(`Supabase, таблица ${t}: ${error.message}${/does not exist|schema cache/i.test(error.message) ? " → выполни supabase/schema.sql в SQL Editor" : ""}`);
      }
    } catch (e) {
      supabase.error = e.message;
      problems.push(`Supabase недоступен: ${e.message}`);
    }
  }

  // Источники поиска
  const q = url.searchParams.get("q") || "python";
  const [st, cs, yt] = await Promise.allSettled([searchStepik(q, 3, "all"), searchCoursera(q, 3, "all"), searchYoutube(q, 3, "all")]);
  const count = (r) => (r.status === "fulfilled" ? r.value.length : `ошибка: ${r.reason?.message}`);
  const sources = { stepik: count(st), coursera: count(cs), youtube: cfg.YOUTUBE_API_KEY ? count(yt) : "нет YOUTUBE_API_KEY" };
  if (!sources.stepik && !sources.coursera && !(typeof sources.youtube === "number" && sources.youtube)) {
    problems.push("Ни один источник не вернул курсы — сервер Netlify не достучался до Stepik/Coursera");
  }

  return Response.json({ ok: problems.length === 0, problems, env, telegram, supabase, sources }, {
    headers: { "cache-control": "no-store" },
  });
};

export const config = { path: "/api/health" };
