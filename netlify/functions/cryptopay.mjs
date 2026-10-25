import { cfg } from "../../lib/config.mjs";
import { db } from "../../lib/db.mjs";
import { send, HTML } from "../../lib/tg.mjs";
import { verifySignature } from "../../lib/cryptopay.mjs";

// Вебхук Crypto Pay: POST /api/cryptopay/<WEBHOOK_SECRET>
export default async (req, context) => {
  if (req.method !== "POST") return new Response("ok");
  if (cfg.WEBHOOK_SECRET && context.params?.secret !== cfg.WEBHOOK_SECRET) {
    return new Response("forbidden", { status: 403 });
  }
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get("crypto-pay-api-signature"))) {
    return new Response("bad signature", { status: 401 });
  }
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response("bad json", { status: 400 });
  }
  // отбрасываем старые запросы (защита от повтора)
  if (body.request_date && Date.now() - Date.parse(body.request_date) > 3 * 86400_000) return new Response("old");

  if (body.update_type === "invoice_paid") {
    const inv = body.payload || {};
    const p = await db.markPaidByInvoice(inv.invoice_id); // null, если уже обработан
    if (p) {
      const until = await db.activatePro(p.chat_id, p.days);
      const date = new Date(until).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
      await send(p.chat_id, `💎 Оплата получена! Pro активен до <b>${date}</b>. Спасибо!`, HTML);
      for (const a of cfg.ADMIN_IDS) {
        await send(a, `💰 Крипто-оплата FC-${p.id}: ${inv.paid_amount || ""} ${inv.paid_asset || ""} от <code>${p.chat_id}</code>`, HTML);
      }
    }
  }
  return new Response("ok");
};

export const config = { path: "/api/cryptopay/:secret" };
