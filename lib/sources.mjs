import { cfg } from "./config.mjs";
import { db } from "./db.mjs";

const UA = { "user-agent": "FreeCoursesBot/1.0" };

async function getJson(url, timeout = 8000) {
  try {
    const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(timeout) });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

const qs = (o) => new URLSearchParams(o).toString();

// ---------- YouTube: плейлисты-курсы ----------
export async function searchYoutube(query, limit, lang) {
  if (!cfg.YOUTUBE_API_KEY) return [];
  const suffix = { ru: " курс", en: " course" }[lang] || "";
  const p = { part: "snippet", type: "playlist", maxResults: limit, q: query + suffix, key: cfg.YOUTUBE_API_KEY };
  if (lang !== "all") p.relevanceLanguage = lang;
  const data = await getJson(`https://www.googleapis.com/youtube/v3/search?${qs(p)}`);
  return (data?.items || [])
    .filter((it) => it.id?.playlistId)
    .map((it) => ({
      id: `yt:${it.id.playlistId}`,
      title: it.snippet?.title || "Без названия",
      url: `https://www.youtube.com/playlist?list=${it.id.playlistId}`,
      source: `YouTube · ${it.snippet?.channelTitle || ""}`,
    }));
}

// ---------- Coursera: бесплатно в режиме Audit ----------
export async function searchCoursera(query, limit, lang) {
  const data = await getJson(
    `https://api.coursera.org/api/courses.v1?${qs({ q: "search", query, limit: limit * 2, fields: "slug,name,primaryLanguages" })}`,
  );
  const out = [];
  for (const c of data?.elements || []) {
    if (!c.slug) continue;
    const langs = c.primaryLanguages || [];
    if (lang !== "all" && langs.length && !langs.some((l) => l.startsWith(lang))) continue;
    out.push({ id: `cs:${c.slug}`, title: c.name || c.slug, url: `https://www.coursera.org/learn/${c.slug}`, source: "Coursera · бесплатно в режиме Audit" });
    if (out.length >= limit) break;
  }
  return out;
}

// ---------- Stepik: только бесплатные ----------
export async function searchStepik(query, limit, lang) {
  const data = await getJson(
    `https://stepik.org/api/search-results?${qs({ query, type: "course", is_paid: "false", is_public: "true", page: 1 })}`,
  );
  const ids = [...new Set((data?.["search-results"] || []).map((r) => r.target_id || r.course).filter(Boolean))].slice(0, 20);
  if (!ids.length) return [];
  const courses = await getJson(`https://stepik.org/api/courses?${ids.map((i) => `ids[]=${i}`).join("&")}`);
  const out = [];
  for (const c of courses?.courses || []) {
    if (c.is_paid) continue;
    const cl = (c.language || "").toLowerCase();
    if (lang !== "all" && cl && !cl.startsWith(lang)) continue;
    out.push({ id: `st:${c.id}`, title: c.title || "Курс Stepik", url: `https://stepik.org/course/${c.id}`, source: "Stepik · бесплатно" });
    if (out.length >= limit) break;
  }
  return out;
}

// ---------- всё вместе + кэш в Supabase ----------
export async function searchAll(query, lang = "ru", limit = 6) {
  const key = `${lang}:${query.toLowerCase().trim()}`;
  const cached = await db.getCache(key, cfg.SEARCH_CACHE_TTL).catch(() => null); // без базы ищем без кэша
  if (cached) return cached;

  const parts = await Promise.allSettled([
    searchStepik(query, limit, lang),
    searchYoutube(query, limit, lang),
    searchCoursera(query, limit, lang),
  ]);
  const seen = new Set();
  const out = [];
  for (const p of parts) {
    if (p.status !== "fulfilled") continue;
    for (const it of p.value) {
      if (!seen.has(it.id)) { seen.add(it.id); out.push(it); }
    }
  }
  if (out.length) await db.setCache(key, out).catch(() => {}); // пустые не кэшируем
  return out;
}

// ---------- сайты без открытого API: ссылки на их поиск ----------
export function searchLinks(query) {
  const q = encodeURIComponent(query);
  return [
    ["edX", `https://www.edx.org/search?q=${q}`],
    ["MIT OCW", `https://ocw.mit.edu/search/?q=${q}`],
    ["Khan Academy", `https://www.khanacademy.org/search?page_search_query=${q}`],
    ["Udemy Free", `https://www.udemy.com/courses/search/?q=${q}&price=price-free`],
    ["Microsoft Learn", `https://learn.microsoft.com/ru-ru/training/browse/?terms=${q}`],
    ["Class Central", `https://www.classcentral.com/search?q=${q}&free=true`],
  ];
}
