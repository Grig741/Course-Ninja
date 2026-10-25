// Генерирует статический сайт в public/ при сборке на Netlify.
// Netlify сам подставляет URL сайта (env URL). BOT_USERNAME — юзернейм бота без @.
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { CATALOG, SLUGS } from "../lib/catalog.mjs";

const SITE = (process.env.SITE_URL || process.env.URL || "https://example.netlify.app").replace(/\/$/, "");
// принимает "MyBot", "@MyBot" и "https://t.me/MyBot"
const BOT = (process.env.BOT_USERNAME || "YOUR_BOT_USERNAME").trim().replace(/^(https?:\/\/)?(t\.me\/)?@?/i, "").replace(/[/?].*$/, "");
if (BOT === "YOUR_BOT_USERNAME") console.warn("⚠️  BOT_USERNAME не задан — кнопки ведут на заглушку. Добавь переменную и пересобери сайт.");
const PRICE_USD = process.env.PRO_PRICE_USD || "2";
const PRICE_BANK = process.env.BANK_PRICE || "800 AMD";
const PRO_DAYS = process.env.PRO_DAYS || "30";
const OUT = "public";
const YEAR = new Date().getFullYear();

const bot = (start) => `https://t.me/${BOT}${start ? `?start=${start}` : ""}`;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// SEO-описание каждой темы
const META = {
  biznes: { name: "Бизнес", e: "💼", q: "бизнес", short: "Стартапы, финансы, менеджмент",
    title: "Бесплатные курсы по бизнесу и стартапам",
    desc: "Бесплатные онлайн-курсы по бизнесу, стартапам и финансам: Y Combinator, MIT, Coursera, Stepik и YouTube. Подборка обновляется каждый день.",
    intro: "Как запустить свой проект, найти первых клиентов, посчитать экономику и не прогореть. Собрали бесплатные курсы от Y Combinator, MIT и ведущих университетов, плюс свежие курсы со Stepik, Coursera и YouTube." },
  marketing: { name: "Маркетинг", e: "📈", q: "маркетинг", short: "SMM, SEO, продажи, реклама",
    title: "Бесплатные курсы по маркетингу, SMM и SEO",
    desc: "Бесплатные курсы по интернет-маркетингу, SMM, SEO и продажам от HubSpot, Google, Coursera и Stepik — с сертификатами и без.",
    intro: "Контент, реклама, SEO, email-рассылки и продажи. Многие курсы ниже дают бесплатный сертификат — например, HubSpot Academy и Google." },
  programmirovanie: { name: "Программирование", e: "💻", q: "программирование", short: "Python, веб, JavaScript, CS",
    title: "Бесплатные курсы по программированию и Python",
    desc: "Бесплатные курсы программирования: Python, JavaScript, веб-разработка, CS50 от Гарварда, freeCodeCamp, Stepik и YouTube-плейлисты.",
    intro: "С нуля до первой работы: CS50 от Гарварда, freeCodeCamp, сотни бесплатных курсов на Stepik на русском и лучшие плейлисты YouTube." },
  flutter: { name: "Flutter", e: "📱", q: "flutter", short: "Мобильные приложения",
    title: "Бесплатные курсы по Flutter и мобильной разработке",
    desc: "Бесплатные курсы по Flutter и Dart: официальные codelabs Google, курсы на Stepik, Coursera и YouTube.",
    intro: "Одно приложение сразу для Android и iOS. Начни с официальных материалов Flutter, дальше — практические курсы и плейлисты." },
  ai: { name: "AI и нейросети", e: "🤖", q: "нейросети", short: "ML, deep learning, промпты",
    title: "Бесплатные курсы по AI, нейросетям и машинному обучению",
    desc: "Бесплатные курсы по искусственному интеллекту и машинному обучению: fast.ai, Google ML Crash Course, Kaggle Learn, Elements of AI.",
    intro: "От «что такое нейросеть» до обучения своих моделей. fast.ai, курс Google по ML, практика на Kaggle и курс Elements of AI для тех, кто без кода." },
  dizain: { name: "Дизайн", e: "🎨", q: "дизайн", short: "UX/UI, Figma",
    title: "Бесплатные курсы по UX/UI-дизайну и Figma",
    desc: "Бесплатные курсы по UX/UI-дизайну и Figma: официальное обучение Figma, Laws of UX, курсы на Stepik, Coursera и YouTube.",
    intro: "Интерфейсы, которые понятны с первого взгляда. Принципы UX, работа в Figma и практические курсы по веб- и мобильному дизайну." },
};

function layout({ title, description, path, body, jsonld }) {
  const url = SITE + path;
  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📚</text></svg>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/style.css">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, "\\u003c")}</script>` : ""}
</head>
<body>
<header class="top"><div class="wrap">
  <a class="logo" href="/"><i>F</i>FreeCourses</a>
  <nav class="nav">
    <a class="hide-sm" href="/#topics">Темы</a>
    <a href="/pro/">Pro</a>
    <a class="btn btn-primary" href="${bot()}" rel="noopener">Открыть бота</a>
  </nav>
</div></header>
<main>
${body}
</main>
<footer><div class="wrap">
  <span>© ${YEAR} FreeCourses — только бесплатные и легальные курсы</span>
  <span><a href="/#topics">Темы</a> · <a href="/pro/">Pro</a> · <a href="${bot()}">Telegram-бот</a></span>
</div></footer>
<script src="/assets/app.js" defer></script>
</body>
</html>`;
}

const topicCards = (exclude) =>
  Object.entries(META)
    .filter(([slug]) => slug !== exclude)
    .map(([slug, m]) => `<a class="topic" href="/kursy/${slug}/"><div class="e">${m.e}</div><h3>${esc(m.name)}</h3><p>${esc(m.short)}</p></a>`)
    .join("\n");

const ctaBlock = (start, title, text) => `
<section><div class="wrap"><div class="cta">
  <div><h2>${esc(title)}</h2><p>${esc(text)}</p></div>
  <a class="btn btn-primary" href="${bot(start)}" rel="noopener">Открыть в Telegram</a>
</div></div></section>`;

// ---------- главная ----------
function homePage() {
  const chips = ["python", "бизнес", "маркетинг", "excel", "английский", "нейросети", "figma", "sql"]
    .map((q) => `<button type="button" class="chip" data-q="${esc(q)}">${esc(q)}</button>`).join("");
  const body = `
<div class="wrap hero">
  <span class="eyebrow">Stepik · Coursera · YouTube · edX · MIT · Khan Academy</span>
  <h1>Все бесплатные курсы — в одном поиске</h1>
  <p class="lead">Напиши, чему хочешь научиться. Найдём бесплатные курсы на крупных платформах и покажем только то, за что не надо платить.</p>
  <form class="search" id="search" role="search">
    <input type="search" name="q" placeholder="Например: python, маркетинг, excel" aria-label="Что хочешь изучить" autocomplete="off" maxlength="100">
    <select name="lang" aria-label="Язык курсов">
      <option value="ru">Русский</option>
      <option value="en">English</option>
      <option value="all">Все языки</option>
    </select>
    <button class="btn btn-primary" type="submit">Найти</button>
  </form>
  <div class="chips">${chips}</div>
  <div class="results" id="results" aria-live="polite"></div>
</div>

<section id="topics"><div class="wrap">
  <h2>Подборки по темам</h2>
  <div class="grid">${topicCards()}</div>
</div></section>

<section><div class="wrap">
  <h2>Как это работает</h2>
  <div class="steps">
    <div class="step"><h3>Пишешь тему</h3><p>Любую: от «python с нуля» до «финансовая грамотность».</p></div>
    <div class="step"><h3>Ищем по платформам</h3><p>Stepik, Coursera, YouTube и другие. Платные курсы отсекаем.</p></div>
    <div class="step"><h3>Получаешь новинки</h3><p>Подпишись на тему в Telegram-боте — пришлём новые курсы, как только они появятся.</p></div>
  </div>
</div></section>
${ctaBlock("", "Курсы прямо в Telegram", "Тот же поиск в боте: избранное, подписки на темы и ежедневные новинки.")}`;
  return layout({
    title: "FreeCourses — поиск бесплатных онлайн-курсов",
    description: "Ищи бесплатные онлайн-курсы на Stepik, Coursera, YouTube, edX и других платформах в одном месте. Программирование, бизнес, маркетинг, дизайн, AI.",
    path: "/",
    body,
    jsonld: {
      "@context": "https://schema.org", "@type": "WebSite", name: "FreeCourses", url: SITE + "/",
      potentialAction: { "@type": "SearchAction", target: `${SITE}/?q={search_term_string}`, "query-input": "required name=search_term_string" },
    },
  });
}

// ---------- страница темы ----------
function topicPage(slug) {
  const m = META[slug];
  const items = CATALOG[SLUGS[slug]] || [];
  const cards = items.map(([t, u, d]) =>
    `<a class="card" href="${esc(u)}" target="_blank" rel="noopener"><div class="t">${esc(t)}</div><div class="s"><span class="badge ok">Проверено</span>${esc(d)}</div></a>`).join("\n");
  const body = `
<div class="wrap">
  <div class="crumbs"><a href="/">Главная</a> / ${esc(m.name)}</div>
  <div class="hero" style="padding:20px 0 28px">
    <span class="eyebrow">${m.e} ${esc(m.name)}</span>
    <h1>${esc(m.title)}</h1>
    <p class="lead">${esc(m.intro)}</p>
    <a class="btn btn-primary" href="${bot("t_" + slug)}" rel="noopener">Получать новые курсы в Telegram</a>
  </div>
  <div class="group-title">Проверенные ресурсы</div>
  <div class="list">${cards}</div>
  <div class="results" data-live-q="${esc(m.q)}" aria-live="polite"></div>
</div>
${ctaBlock("t_" + slug, `Новые курсы по теме «${m.name}»`, "Подпишись в боте — каждый день присылаем только новые бесплатные курсы по этой теме.")}
<section><div class="wrap">
  <h2>Другие темы</h2>
  <div class="grid">${topicCards(slug)}</div>
</div></section>`;
  return layout({
    title: `${m.title} — FreeCourses`,
    description: m.desc,
    path: `/kursy/${slug}/`,
    body,
    jsonld: {
      "@context": "https://schema.org", "@type": "ItemList", name: m.title,
      itemListElement: items.map(([t, u, d], i) => ({
        "@type": "ListItem", position: i + 1,
        item: { "@type": "Course", name: t, description: d, url: u, offers: { "@type": "Offer", price: 0, priceCurrency: "USD", category: "Free" } },
      })),
    },
  });
}

// ---------- Pro ----------
function proPage() {
  const body = `
<div class="wrap hero">
  <span class="eyebrow">💎 FreeCourses Pro</span>
  <h1>Больше подписок и избранного</h1>
  <p class="lead">Поиск остаётся бесплатным для всех. Pro — для тех, кто следит за несколькими темами и хочет поддержать проект.</p>
  <div class="plans">
    <div class="plan">
      <h3>Бесплатно</h3>
      <div class="price">0 <small>навсегда</small></div>
      <ul><li>Поиск по всем платформам</li><li>Подборки по темам</li><li>1 подписка на новинки</li><li>До 10 курсов в избранном</li></ul>
      <a class="btn btn-ghost" href="${bot()}" rel="noopener">Открыть бота</a>
    </div>
    <div class="plan pro">
      <h3>Pro</h3>
      <div class="price">$${esc(PRICE_USD)} <small>/ ${esc(PRO_DAYS)} дней</small></div>
      <ul><li>Всё из бесплатного</li><li>До 10 подписок на темы</li><li>До 200 курсов в избранном</li><li>Поддержка развития проекта</li></ul>
      <a class="btn btn-primary" href="${bot("pro")}" rel="noopener">Оформить в Telegram</a>
    </div>
  </div>
  <p class="note">Оплата проходит в боте: криптой через @CryptoBot (USDT, TON, BTC) — Pro включается сразу, или переводом по реквизитам (${esc(PRICE_BANK)}) — включаем после проверки чека. Автопродления нет.</p>
</div>`;
  return layout({
    title: "FreeCourses Pro — подписки на темы и избранное",
    description: `FreeCourses Pro: до 10 подписок на новые бесплатные курсы и 200 курсов в избранном. $${PRICE_USD} за ${PRO_DAYS} дней, оплата криптой или переводом.`,
    path: "/pro/",
    body,
  });
}

function notFound() {
  return layout({
    title: "Страница не найдена — FreeCourses",
    description: "Страница не найдена.",
    path: "/404.html",
    body: `<div class="wrap hero"><h1>Такой страницы нет</h1><p class="lead">Зато есть поиск по бесплатным курсам.</p><a class="btn btn-primary" href="/">На главную</a></div>`,
  });
}

// ---------- сборка ----------
const write = (path, html) => {
  const full = `${OUT}${path}`;
  mkdirSync(full.replace(/\/[^/]*$/, ""), { recursive: true });
  writeFileSync(full, html);
};

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
cpSync("site/assets", `${OUT}/assets`, { recursive: true });

write("/index.html", homePage());
write("/pro/index.html", proPage());
write("/404.html", notFound());
for (const slug of Object.keys(META)) write(`/kursy/${slug}/index.html`, topicPage(slug));

const urls = ["/", "/pro/", ...Object.keys(META).map((s) => `/kursy/${s}/`)];
const today = new Date().toISOString().slice(0, 10);
write("/sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod></url>`).join("\n")}
</urlset>
`);
write("/robots.txt", `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${SITE}/sitemap.xml\n`);

console.log(`Site built: ${urls.length} pages → ${OUT}/ (SITE=${SITE}, BOT=@${BOT})`);
