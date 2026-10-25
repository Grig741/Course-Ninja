import { runDigest } from "../../lib/bot.mjs";

// Ежедневная рассылка. Scheduled-функции живут 30 сек, поэтому запускаемся
// каждый час с 10:00 до 15:00 по Еревану (06–11 UTC) и обрабатываем тех, кому сегодня ещё не слали.
export default async () => {
  const sent = await runDigest(Date.now() + 24_000);
  console.log(`digest: sent to ${sent} users`);
};

export const config = { schedule: "5 6-11 * * *" };
