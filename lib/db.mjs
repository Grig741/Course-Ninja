import { createClient } from "@supabase/supabase-js";
import { cfg } from "./config.mjs";

let _sb;
const sb = () =>
  (_sb ||= createClient(cfg.SUPABASE_URL, cfg.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } }));

const now = () => new Date().toISOString();

function check({ data, error }, what) {
  if (error) console.warn(`db.${what}:`, error.message);
  return data;
}

/** Все операции с базой. Объект (а не отдельные экспорты), чтобы в тестах его можно было подменить. */
export const db = {
  // ---------- юзеры ----------
  async touchUser(chat_id, username = null) {
    check(await sb().from("users").upsert({ chat_id, username }, { onConflict: "chat_id", ignoreDuplicates: true }), "touchUser");
  },
  async getUser(chat_id) {
    return check(await sb().from("users").select("*").eq("chat_id", chat_id).maybeSingle(), "getUser") || { chat_id, lang: "ru", pro_until: null };
  },
  async setLang(chat_id, lang) {
    check(await sb().from("users").update({ lang }).eq("chat_id", chat_id), "setLang");
  },
  async activatePro(chat_id, days) {
    const u = await db.getUser(chat_id);
    const base = Math.max(Date.now(), u.pro_until ? Date.parse(u.pro_until) : 0);
    const until = new Date(base + days * 86400_000).toISOString();
    check(await sb().from("users").upsert({ chat_id, pro_until: until }, { onConflict: "chat_id" }), "activatePro");
    return until;
  },

  // ---------- избранное ----------
  async countFavs(chat_id) {
    const { count } = await sb().from("favs").select("id", { count: "exact", head: true }).eq("chat_id", chat_id);
    return count || 0;
  },
  /** true — добавлено, false — уже было */
  async addFav(chat_id, it) {
    const data = check(
      await sb().from("favs")
        .upsert({ chat_id, item_id: it.id, title: it.title, url: it.url, source: it.source },
          { onConflict: "chat_id,item_id", ignoreDuplicates: true })
        .select("id"),
      "addFav");
    return !!data?.length;
  },
  async listFavs(chat_id, limit = 30) {
    return check(await sb().from("favs").select("*").eq("chat_id", chat_id).order("created", { ascending: false }).limit(limit), "listFavs") || [];
  },
  async delFav(chat_id, id) {
    check(await sb().from("favs").delete().eq("chat_id", chat_id).eq("id", id), "delFav");
  },

  // ---------- подписки ----------
  async userSubs(chat_id) {
    return (check(await sb().from("subs").select("topic").eq("chat_id", chat_id), "userSubs") || []).map((r) => r.topic);
  },
  async addSub(chat_id, topic) {
    check(await sb().from("subs").upsert({ chat_id, topic }, { ignoreDuplicates: true }), "addSub");
  },
  async delSub(chat_id, topic) {
    const data = check(await sb().from("subs").delete().eq("chat_id", chat_id).eq("topic", topic).select("topic"), "delSub");
    return !!data?.length;
  },
  /** { chat_id: [topics] } */
  async allSubs() {
    const rows = check(await sb().from("subs").select("chat_id,topic").limit(10000), "allSubs") || [];
    const out = {};
    for (const r of rows) (out[r.chat_id] ||= []).push(r.topic);
    return out;
  },
  /** Возвращает только новые элементы и помечает их просмотренными */
  async filterUnseen(chat_id, items) {
    if (!items.length) return [];
    const data = check(
      await sb().from("seen")
        .upsert(items.map((it) => ({ chat_id, item_id: it.id })), { onConflict: "chat_id,item_id", ignoreDuplicates: true })
        .select("item_id"),
      "filterUnseen") || [];
    const fresh = new Set(data.map((r) => r.item_id));
    return items.filter((it) => fresh.has(it.id));
  },
  async getDigestRun(chat_id) {
    const r = check(await sb().from("digest_runs").select("last_run").eq("chat_id", chat_id).maybeSingle(), "getDigestRun");
    return r ? Date.parse(r.last_run) : 0;
  },
  async setDigestRun(chat_id) {
    check(await sb().from("digest_runs").upsert({ chat_id, last_run: now() }), "setDigestRun");
  },

  // ---------- сессия поиска ----------
  async getSession(chat_id) {
    return check(await sb().from("sessions").select("*").eq("chat_id", chat_id).maybeSingle(), "getSession") || null;
  },
  async setSession(chat_id, patch) {
    check(await sb().from("sessions").upsert({ chat_id, ...patch, updated: now() }), "setSession");
  },

  // ---------- кэш поиска ----------
  async getCache(key, ttlSec) {
    const r = check(await sb().from("search_cache").select("results,ts").eq("key", key).maybeSingle(), "getCache");
    if (!r || Date.now() - Date.parse(r.ts) > ttlSec * 1000) return null;
    return r.results;
  },
  async setCache(key, results) {
    check(await sb().from("search_cache").upsert({ key, results, ts: now() }), "setCache");
  },

  // ---------- платежи ----------
  async createPayment({ chat_id, method, amount, days }) {
    return check(await sb().from("payments").insert({ chat_id, method, amount, days }).select().single(), "createPayment");
  },
  async setPaymentInvoice(id, invoice_id) {
    check(await sb().from("payments").update({ invoice_id }).eq("id", id), "setPaymentInvoice");
  },
  async getPayment(id) {
    return check(await sb().from("payments").select("*").eq("id", id).maybeSingle(), "getPayment");
  },
  /** pending → paid. Возвращает строку, если статус реально сменился (защита от двойной активации). */
  async markPaid(id) {
    const d = check(await sb().from("payments").update({ status: "paid", paid_at: now() }).eq("id", id).eq("status", "pending").select(), "markPaid");
    return d?.[0] || null;
  },
  async markPaidByInvoice(invoice_id) {
    const d = check(await sb().from("payments").update({ status: "paid", paid_at: now() }).eq("invoice_id", invoice_id).eq("status", "pending").select(), "markPaidByInvoice");
    return d?.[0] || null;
  },
  async markRejected(id) {
    const d = check(await sb().from("payments").update({ status: "rejected" }).eq("id", id).eq("status", "pending").select(), "markRejected");
    return d?.[0] || null;
  },

  // ---------- статистика ----------
  async logQuery(chat_id, query) {
    check(await sb().from("queries").insert({ chat_id, query: query.toLowerCase() }), "logQuery");
  },
  async stats() {
    const day = new Date(Date.now() - 86400_000).toISOString();
    const week = new Date(Date.now() - 7 * 86400_000).toISOString();
    const cnt = async (q) => (await q).count || 0;
    const head = { count: "exact", head: true };
    const [users, newUsers, q24, qAll, subs, favs, pro, paid] = await Promise.all([
      cnt(sb().from("users").select("chat_id", head)),
      cnt(sb().from("users").select("chat_id", head).gt("created", day)),
      cnt(sb().from("queries").select("id", head).gt("ts", day)),
      cnt(sb().from("queries").select("id", head)),
      cnt(sb().from("subs").select("chat_id", head)),
      cnt(sb().from("favs").select("id", head)),
      cnt(sb().from("users").select("chat_id", head).gt("pro_until", now())),
      cnt(sb().from("payments").select("id", head).eq("status", "paid")),
    ]);
    const recent = check(await sb().from("queries").select("chat_id,query,ts").gt("ts", week).limit(10000), "stats") || [];
    const active = new Set(recent.filter((r) => r.ts > day && r.chat_id).map((r) => r.chat_id)).size;
    const web24 = recent.filter((r) => r.ts > day && !r.chat_id).length;
    const freq = {};
    for (const r of recent) freq[r.query] = (freq[r.query] || 0) + 1;
    const top = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10);
    return { users, newUsers, active, web24, q24, qAll, subs, favs, pro, paid, top };
  },
};

export const isPro = (u) => !!u?.pro_until && Date.parse(u.pro_until) > Date.now();
