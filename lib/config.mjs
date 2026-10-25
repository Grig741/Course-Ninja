const env = process.env;

export const cfg = {
  BOT_TOKEN: env.BOT_TOKEN || "",
  WEBHOOK_SECRET: env.WEBHOOK_SECRET || "",          // секрет для вебхука Telegram
  SETUP_KEY: env.SETUP_KEY || "",                    // ключ для /api/setup
  ADMIN_IDS: (env.ADMIN_IDS || "").split(",").map((s) => Number(s.trim())).filter(Boolean),
  YOUTUBE_API_KEY: env.YOUTUBE_API_KEY || "",
  SEARCH_CACHE_TTL: Number(env.SEARCH_CACHE_TTL || 3 * 3600),

  SUPABASE_URL: env.SUPABASE_URL || "",
  SUPABASE_SERVICE_KEY: env.SUPABASE_SERVICE_KEY || "",

  // Pro
  PRO_PRICE_USD: env.PRO_PRICE_USD || "2",           // цена в USD для крипты
  PRO_DAYS: Number(env.PRO_DAYS || 30),
  CRYPTOPAY_TOKEN: env.CRYPTOPAY_TOKEN || "",        // @CryptoBot → Crypto Pay → Create App
  CRYPTOPAY_ASSETS: env.CRYPTOPAY_ASSETS || "USDT,TON,BTC",
  CRYPTOPAY_API: env.CRYPTOPAY_TESTNET === "1" ? "https://testnet-pay.crypt.bot/api" : "https://pay.crypt.bot/api",
  BANK_PRICE: env.BANK_PRICE || "800 AMD",           // цена при оплате переводом
  BANK_DETAILS: (env.BANK_DETAILS || "").replace(/\\n/g, "\n"), // реквизиты, \n = перенос строки

  // лимиты
  FREE_SUBS: 1, PRO_SUBS: 10,
  FREE_FAVS: 10, PRO_FAVS: 200,
};
