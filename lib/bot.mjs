import { cfg } from "./config.mjs";
import { db, isPro } from "./db.mjs";
import { tg, send, HTML, kb, btn, urlBtn, chunk, esc } from "./tg.mjs";
import { CATALOG, SLUGS, findTopic } from "./catalog.mjs";
import { searchAll, searchLinks } from "./sources.mjs";
import { createInvoice } from "./cryptopay.mjs";

const PAGE = 5;
const LANGS = { ru: "🇷🇺 Русский", en: "🇬🇧 English", all: "🌍 Все языки" };
const isAdmin = (id) => cfg.ADMIN_IDS.includes(Number(id));
const fmtDate = (iso) => new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });

// ---------- форматирование ----------
export function fmtCatalog(topic) {
  const lines = [`📚 <b>Проверенные ресурсы: ${esc(topic)}</b>`];
  for (const [t, u, d] of CATALOG[topic]) lines.push(`• <a href="${esc(u)}">${esc(t)}</a> — ${esc(d)}`);
  return lines.join("\n");
}

export function fmtItems(items, start, header) {
  let text = header;
  items.forEach((it, i) => {
    const line = `\n${start + i}. <a href="${esc(it.url)}">${esc(it.title)}</a>\n    <i>${esc(it.source)}</i>`;
    if (text.length + line.length < 3900) text += line;
  });
  return text;
}

const topicsKb = () => kb(chunk(Object.keys(CATALOG).map((t) => btn(t[0].toUpperCase() + t.slice(1), `topic:${t}`)), 2));
const linksKb = (q) => kb(chunk(searchLinks(q).map(([n, u]) => urlBtn(`🔗 ${n}`, u)), 2));
const langKb = (cur) => kb(Object.entries(LANGS).map(([k, v]) => [btn((k === cur ? "✅ " : "") + v, `lang:${k}`)]));

export function pageView(s) {
  const res = s.results || [];
  const pages = Math.max(1, Math.ceil(res.length / PAGE));
  const page = Math.min(Math.max(0, s.page || 0), pages - 1);
  const start = page * PAGE;
  const items = res.slice(start, start + PAGE);
  const text = fmtItems(items, start + 1, `🔎 <b>${esc(s.query)}</b> · ${LANGS[s.lang] || ""} · стр. ${page + 1}/${pages}`) +
    "\n\n⭐ — сохранить в избранное";
  const nav = [];
  if (page > 0) nav.push(btn("◀ Назад", "pg:prev"));
  if (page < pages - 1) nav.push(btn("Ещё ▶", "pg:next"));
  return {
    text,
    reply_markup: kb([
      items.map((_, i) => btn(`⭐${start + i + 1}`, `fav:${start + i}`)),
      nav,
      [btn("🌐 Язык", "langmenu"), btn("🔗 Другие сайты", "links")],
    ]),
  };
}

// ---------- точка входа ----------
export async function handleUpdate(u) {
  try {
    if (u.callback_query) return await onCallback(u.callback_query);
    const m = u.message;
    if (!m || m.chat?.type !== "private") return;
    await db.touchUser(m.chat.id, m.from?.username || null);
    if (m.photo || m.document) return await onReceipt(m);
    if (typeof m.text !== "string") return;
    const text = m.text.trim();
    if (text.startsWith("/")) return await onCommand(m, text);
    return await onSearch(m.chat.id, text.slice(0, 100));
  } catch (e) {
    console.error("handleUpdate error:", e);
  }
}

// ---------- команды ----------
async function onCommand(m, text) {
  const chatId = m.chat.id;
  const [rawCmd, ...rest] = text.split(/\s+/);
  const cmd = rawCmd.split("@")[0].toLowerCase();
  const arg = rest.join(" ").trim();

  switch (cmd) {
    case "/start":
      // deep-link'и с сайта: ?start=pro и ?start=t_<slug>
      if (arg === "pro") return sendPro(chatId);
      if (arg.startsWith("t_") && SLUGS[arg.slice(2)]) {
        const topic = SLUGS[arg.slice(2)];
        await send(chatId, `👋 Привет! Вот бесплатные курсы по теме «${topic}». Подпишись на новинки: /sub ${topic}`);
        return onSearch(chatId, topic);
      }
      return send(chatId,
        "👋 Я ищу <b>бесплатные</b> курсы: Stepik, YouTube, Coursera, edX, MIT, Khan Academy и другие.\n\n" +
        "Просто напиши тему — например <code>бизнес</code>, <code>python</code>, <code>маркетинг</code>.\n\n" +
        "/topics — подборки по темам\n/lang — язык курсов\n/saved — избранное\n" +
        "/sub &lt;тема&gt; — каждый день присылать новые курсы\n/unsub &lt;тема&gt; · /mysubs — подписки\n" +
        "/pro — 💎 Pro-доступ", HTML);
    case "/topics":
      return send(chatId, "Выбери тему:", { reply_markup: topicsKb() });
    case "/lang": {
      const u = await db.getUser(chatId);
      return send(chatId, "Язык курсов:", { reply_markup: langKb(u.lang) });
    }
    case "/saved":
      return sendSaved(chatId);
    case "/sub":
      return onSub(chatId, arg.toLowerCase().slice(0, 50));
    case "/unsub":
      return send(chatId, (await db.delSub(chatId, arg.toLowerCase())) ? `Отписал от «${arg}».` : "Такой подписки нет. /mysubs");
    case "/mysubs": {
      const s = await db.userSubs(chatId);
      return send(chatId, s.length ? `Твои подписки: ${s.join(", ")}` : "Подписок нет. /sub бизнес");
    }
    case "/pro":
      return sendPro(chatId);
    case "/cancel":
      await db.setSession(chatId, { await_receipt: null });
      return send(chatId, "Ок, отменил.");
    case "/stats":
      return isAdmin(m.from.id) && sendStats(chatId);
    case "/grant": {
      if (!isAdmin(m.from.id)) return;
      const [uid, days] = rest.map(Number);
      if (!uid) return send(chatId, "Использование: /grant <chat_id> [дней]");
      const until = await db.activatePro(uid, days || cfg.PRO_DAYS);
      await send(uid, `💎 Тебе выдан Pro до ${fmtDate(until)}!`);
      return send(chatId, `✅ Pro для ${uid} до ${fmtDate(until)}`);
    }
    default:
      return send(chatId, "Не знаю такую команду. /start");
  }
}

// ---------- поиск ----------
async function onSearch(chatId, query) {
  if (!query) return;
  await db.logQuery(chatId, query);
  tg("sendChatAction", { chat_id: chatId, action: "typing" });

  const topic = findTopic(query);
  if (topic) await send(chatId, fmtCatalog(topic), HTML);

  const u = await db.getUser(chatId);
  const lang = u.lang || "ru";
  const results = await searchAll(query, lang);
  if (!results.length) {
    return send(chatId, `В базах ничего по «${query}» (${LANGS[lang]}) 😕\nПопробуй /lang → «Все языки» или глянь тут:`,
      { reply_markup: linksKb(query) });
  }
  const s = { query, lang, results, page: 0 };
  await db.setSession(chatId, s);
  const v = pageView(s);
  return send(chatId, v.text, { ...HTML, reply_markup: v.reply_markup });
}

// ---------- избранное ----------
async function sendSaved(chatId, editMsgId = null) {
  const favs = await db.listFavs(chatId);
  if (!favs.length) {
    const t = "Избранное пусто. Жми ⭐ под результатами поиска.";
    return editMsgId ? tg("editMessageText", { chat_id: chatId, message_id: editMsgId, text: t }) : send(chatId, t);
  }
  const text = fmtItems(favs, 1, `⭐ <b>Избранное</b> (${favs.length})`) + "\n\n🗑 — удалить";
  const reply_markup = kb(chunk(favs.map((f, i) => btn(`🗑${i + 1}`, `del:${f.id}`)), 5));
  return editMsgId
    ? tg("editMessageText", { chat_id: chatId, message_id: editMsgId, text, ...HTML, reply_markup })
    : send(chatId, text, { ...HTML, reply_markup });
}

// ---------- подписки ----------
async function onSub(chatId, topic) {
  if (!topic) return send(chatId, "Напиши тему: /sub бизнес");
  const [u, subs] = await Promise.all([db.getUser(chatId), db.userSubs(chatId)]);
  const limit = isPro(u) ? cfg.PRO_SUBS : cfg.FREE_SUBS;
  if (!subs.includes(topic) && subs.length >= limit) {
    return send(chatId,
      isPro(u) ? `Максимум ${limit} подписок. Убери лишнее через /unsub`
        : `Бесплатно — ${limit} подписка. С 💎 Pro — до ${cfg.PRO_SUBS}. /pro`);
  }
  await db.addSub(chatId, topic);
  await db.filterUnseen(chatId, await searchAll(topic, u.lang || "ru", 10)); // дальше шлём только новое
  return send(chatId, `✅ Подписал на «${topic}». Новые курсы — каждый день в 10:00.`);
}

// ---------- Pro и оплата ----------
async function sendPro(chatId) {
  const u = await db.getUser(chatId);
  const status = isPro(u) ? `✅ У тебя Pro до <b>${fmtDate(u.pro_until)}</b>. Можно продлить:` : "Сейчас у тебя бесплатный тариф.";
  const methods = [];
  if (cfg.CRYPTOPAY_TOKEN) methods.push([btn(`💎 Криптой — $${cfg.PRO_PRICE_USD}`, "pay:crypto")]);
  if (cfg.BANK_DETAILS) methods.push([btn(`🏦 Переводом — ${cfg.BANK_PRICE}`, "pay:bank")]);
  return send(chatId,
    `💎 <b>FreeCourses Pro</b> на ${cfg.PRO_DAYS} дней\n\n` +
    `• до ${cfg.PRO_SUBS} подписок на темы (бесплатно — ${cfg.FREE_SUBS})\n` +
    `• до ${cfg.PRO_FAVS} курсов в избранном (бесплатно — ${cfg.FREE_FAVS})\n` +
    `• поддержка развития бота ❤️\n\n${status}` +
    (methods.length ? "" : "\n\nОплата пока не настроена."),
    { ...HTML, reply_markup: kb(methods) });
}

async function payCrypto(chatId) {
  const p = await db.createPayment({ chat_id: chatId, method: "crypto", amount: `${cfg.PRO_PRICE_USD} USD`, days: cfg.PRO_DAYS });
  if (!p) return send(chatId, "Не получилось создать платёж, попробуй позже.");
  const inv = await createInvoice({ paymentId: p.id, chatId });
  if (!inv) return send(chatId, "CryptoBot не ответил, попробуй через минуту.");
  await db.setPaymentInvoice(p.id, inv.invoice_id);
  return send(chatId,
    `💎 Счёт на <b>$${esc(cfg.PRO_PRICE_USD)}</b> (${esc(cfg.CRYPTOPAY_ASSETS.replace(/,/g, ", "))}).\n` +
    "Оплати в @CryptoBot — Pro включится автоматически. Счёт действует 1 час.",
    { ...HTML, reply_markup: kb([[urlBtn("Оплатить", inv.bot_invoice_url)]]) });
}

async function payBank(chatId) {
  const p = await db.createPayment({ chat_id: chatId, method: "bank", amount: cfg.BANK_PRICE, days: cfg.PRO_DAYS });
  if (!p) return send(chatId, "Не получилось создать платёж, попробуй позже.");
  await db.setSession(chatId, { await_receipt: p.id });
  return send(chatId,
    `🏦 <b>Оплата переводом — ${esc(cfg.BANK_PRICE)}</b>\n\n${esc(cfg.BANK_DETAILS)}\n\n` +
    `В комментарии к переводу укажи: <code>FC-${p.id}</code>\n\n` +
    "После оплаты <b>пришли сюда скриншот чека</b> — проверю и включу Pro. /cancel — отмена.", HTML);
}

async function onReceipt(m) {
  const chatId = m.chat.id;
  const s = await db.getSession(chatId);
  if (!s?.await_receipt) return send(chatId, "Это чек об оплате? Сначала выбери оплату переводом в /pro.");
  const p = await db.getPayment(s.await_receipt);
  if (!p || p.status !== "pending") {
    await db.setSession(chatId, { await_receipt: null });
    return send(chatId, "Этот платёж уже обработан. /pro");
  }
  const who = m.from?.username ? `@${esc(m.from.username)}` : esc(m.from?.first_name || "");
  const caption = `🧾 <b>Чек FC-${p.id}</b>\nОт: ${who} (<code>${chatId}</code>)\nСумма: ${esc(p.amount)} · ${p.days} дн.`;
  const reply_markup = kb([[btn("✅ Подтвердить", `adm:ok:${p.id}`), btn("❌ Отклонить", `adm:no:${p.id}`)]]);
  const file = m.photo ? { method: "sendPhoto", key: "photo", id: m.photo.at(-1).file_id } : { method: "sendDocument", key: "document", id: m.document.file_id };
  for (const admin of cfg.ADMIN_IDS) {
    await tg(file.method, { chat_id: admin, [file.key]: file.id, caption, parse_mode: "HTML", reply_markup });
  }
  await db.setSession(chatId, { await_receipt: null });
  return send(chatId, "✅ Чек получен! Обычно проверяю в течение пары часов — пришлю уведомление.");
}

async function onAdminDecision(q, ok, paymentId) {
  if (!isAdmin(q.from.id)) return tg("answerCallbackQuery", { callback_query_id: q.id, text: "Нет доступа" });
  const p = ok ? await db.markPaid(paymentId) : await db.markRejected(paymentId);
  if (!p) return tg("answerCallbackQuery", { callback_query_id: q.id, text: "Уже обработан", show_alert: true });
  let note;
  if (ok) {
    const until = await db.activatePro(p.chat_id, p.days);
    await send(p.chat_id, `💎 Оплата подтверждена! Pro активен до <b>${fmtDate(until)}</b>. Спасибо!`, HTML);
    note = `✅ Подтверждён, Pro до ${fmtDate(until)}`;
  } else {
    await send(p.chat_id, `❌ Оплата FC-${p.id} не подтверждена. Если это ошибка — напиши ещё раз через /pro и приложи чек.`);
    note = "❌ Отклонён";
  }
  await tg("editMessageCaption", {
    chat_id: q.message.chat.id, message_id: q.message.message_id,
    caption: `${q.message.caption || ""}\n\n${note}`, reply_markup: kb([]),
  });
  return tg("answerCallbackQuery", { callback_query_id: q.id, text: note });
}

// ---------- статистика ----------
async function sendStats(chatId) {
  const s = await db.stats();
  const top = s.top.map(([q, c], i) => `  ${i + 1}. ${esc(q)} — ${c}`).join("\n") || "  пока пусто";
  return send(chatId,
    `📊 <b>Статистика</b>\nЮзеров: ${s.users} (+${s.newUsers} за сутки)\nАктивных за сутки: ${s.active}\n` +
    `Запросов: ${s.q24} за сутки (с сайта: ${s.web24 ?? 0}) / ${s.qAll} всего\nПодписок: ${s.subs} · В избранном: ${s.favs}\n` +
    `💎 Pro сейчас: ${s.pro} · Оплат всего: ${s.paid}\n\n🔥 <b>Топ запросов за неделю:</b>\n${top}`, HTML);
}

// ---------- кнопки ----------
async function onCallback(q) {
  const chatId = q.message?.chat?.id;
  const msgId = q.message?.message_id;
  const data = q.data || "";
  const answer = (text, show_alert = false) => tg("answerCallbackQuery", { callback_query_id: q.id, text, show_alert });
  if (!chatId) return answer();

  if (data.startsWith("adm:")) {
    const [, act, id] = data.split(":");
    return onAdminDecision(q, act === "ok", Number(id));
  }
  if (data.startsWith("topic:")) {
    await answer();
    const t = data.slice(6);
    return CATALOG[t] && send(chatId, fmtCatalog(t), HTML);
  }
  if (data === "langmenu") {
    await answer();
    const u = await db.getUser(chatId);
    return send(chatId, "Язык курсов:", { reply_markup: langKb(u.lang) });
  }
  if (data.startsWith("lang:")) {
    const lang = data.slice(5);
    if (!LANGS[lang]) return answer();
    await db.setLang(chatId, lang);
    await answer(`Язык: ${LANGS[lang]}`);
    await tg("editMessageReplyMarkup", { chat_id: chatId, message_id: msgId, reply_markup: langKb(lang) });
    const s = await db.getSession(chatId);
    if (s?.query && s.lang !== lang) {
      const results = await searchAll(s.query, lang);
      if (!results.length) return send(chatId, `По «${s.query}» на этом языке ничего 😕`);
      const ns = { query: s.query, lang, results, page: 0 };
      await db.setSession(chatId, ns);
      const v = pageView(ns);
      return send(chatId, v.text, { ...HTML, reply_markup: v.reply_markup });
    }
    return;
  }
  if (data.startsWith("pg:")) {
    const s = await db.getSession(chatId);
    if (!s?.results?.length) return answer("Результаты устарели — повтори поиск", true);
    const pages = Math.ceil(s.results.length / PAGE);
    s.page = Math.max(0, Math.min(pages - 1, (s.page || 0) + (data === "pg:next" ? 1 : -1)));
    await db.setSession(chatId, { page: s.page });
    await answer();
    const v = pageView(s);
    return tg("editMessageText", { chat_id: chatId, message_id: msgId, text: v.text, ...HTML, reply_markup: v.reply_markup });
  }
  if (data.startsWith("fav:")) {
    const idx = Number(data.slice(4));
    const s = await db.getSession(chatId);
    const item = s?.results?.[idx];
    if (!item) return answer("Результаты устарели — повтори поиск", true);
    const [u, count] = await Promise.all([db.getUser(chatId), db.countFavs(chatId)]);
    const limit = isPro(u) ? cfg.PRO_FAVS : cfg.FREE_FAVS;
    if (count >= limit) {
      return answer(isPro(u) ? `Лимит избранного: ${limit}` : `Бесплатно — до ${limit} в избранном. Больше с 💎 Pro: /pro`, true);
    }
    return answer((await db.addFav(chatId, item)) ? "⭐ Сохранено! /saved" : "Уже в избранном");
  }
  if (data.startsWith("del:")) {
    await db.delFav(chatId, Number(data.slice(4)));
    await answer("Удалено");
    return sendSaved(chatId, msgId);
  }
  if (data === "links") {
    await answer();
    const s = await db.getSession(chatId);
    return s?.query && send(chatId, "Поиск на других платформах:", { reply_markup: linksKb(s.query) });
  }
  if (data === "pay:crypto") { await answer(); return payCrypto(chatId); }
  if (data === "pay:bank") { await answer(); return payBank(chatId); }
  return answer();
}

// ---------- рассылка (вызывается из scheduled-функции) ----------
export async function runDigest(deadlineMs) {
  const all = await db.allSubs();
  let sent = 0;
  for (const [chatId, topics] of Object.entries(all)) {
    if (Date.now() > deadlineMs) break; // не успели — догоним в следующий запуск
    if (Date.now() - (await db.getDigestRun(chatId)) < 20 * 3600_000) continue;
    const u = await db.getUser(Number(chatId));
    let fresh = [];
    for (const t of topics) fresh = fresh.concat(await db.filterUnseen(Number(chatId), await searchAll(t, u.lang || "ru", 10)));
    await db.setDigestRun(Number(chatId));
    if (fresh.length) {
      await send(Number(chatId), fmtItems(fresh.slice(0, 10), 1, "🆕 <b>Новые бесплатные курсы</b>"), HTML);
      sent++;
    }
  }
  return sent;
}
