import { searchAll, searchLinks } from "../../lib/sources.mjs";
import { CATALOG, findTopic } from "../../lib/catalog.mjs";
import { db } from "../../lib/db.mjs";

// Поиск для сайта: GET /api/search?q=python&lang=ru
export default async (req) => {
  const u = new URL(req.url);
  const q = (u.searchParams.get("q") || "").trim().replace(/\s+/g, " ").slice(0, 100);
  const langParam = u.searchParams.get("lang");
  const lang = ["ru", "en", "all"].includes(langParam) ? langParam : "ru";
  if (q.length < 2) return Response.json({ error: "Слишком короткий запрос" }, { status: 400 });

  const topic = findTopic(q);
  const [results] = await Promise.all([
    searchAll(q, lang, 8),
    u.searchParams.get("src") === "page" ? null : db.logQuery(null, q), // авто-загрузку на страницах тем не считаем
  ]);

  return Response.json(
    {
      q,
      lang,
      catalog: topic ? CATALOG[topic].map(([title, url, desc]) => ({ title, url, desc })) : [],
      results,
      links: searchLinks(q).map(([name, url]) => ({ name, url })),
    },
    { headers: { "cache-control": "public, max-age=600" } },
  );
};

export const config = { path: "/api/search" };
