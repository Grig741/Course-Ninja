import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cfg } from "./config.mjs";

/** Вызов Crypto Pay API (@CryptoBot). */
export async function cryptoPay(method, params = {}) {
  try {
    const r = await fetch(`${cfg.CRYPTOPAY_API}/${method}`, {
      method: "POST",
      headers: { "Crypto-Pay-API-Token": cfg.CRYPTOPAY_TOKEN, "content-type": "application/json" },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(10000),
    });
    const j = await r.json();
    if (!j.ok) console.warn(`cryptopay.${method}:`, JSON.stringify(j.error));
    return j;
  } catch (e) {
    console.warn(`cryptopay.${method} failed:`, e.message);
    return { ok: false };
  }
}

/** Инвойс в USD, оплачивается любой из разрешённых криптовалют. */
export async function createInvoice({ paymentId, chatId }) {
  const j = await cryptoPay("createInvoice", {
    currency_type: "fiat",
    fiat: "USD",
    amount: String(cfg.PRO_PRICE_USD),
    accepted_assets: cfg.CRYPTOPAY_ASSETS,
    description: `FreeCourses Pro на ${cfg.PRO_DAYS} дней`,
    payload: JSON.stringify({ p: paymentId, c: chatId }),
    expires_in: 3600,
    allow_comments: false,
  });
  return j.ok ? j.result : null;
}

/** Проверка подписи вебхука: HMAC-SHA256(rawBody, key = SHA256(token)), hex. */
export function verifySignature(rawBody, signature) {
  if (!signature || !cfg.CRYPTOPAY_TOKEN) return false;
  const secret = createHash("sha256").update(cfg.CRYPTOPAY_TOKEN).digest();
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  return a.length === b.length && timingSafeEqual(a, b);
}
