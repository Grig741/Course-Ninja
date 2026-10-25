# FreeCourses — бот + сайт на Netlify

Telegram-бот бесплатных курсов на **Netlify Functions** (вебхук) + **Supabase**. С оплатой Pro криптой (@CryptoBot) и переводом по реквизитам.

## Что умеет
- Поиск: Stepik, YouTube-плейлисты, Coursera (Audit) + кнопки поиска на edX, MIT OCW, Khan Academy, Udemy Free, Microsoft Learn, Class Central
- Подборки по темам, язык RU/EN/все, пагинация, избранное, подписки с рассылкой новинок
- 💎 Pro: больше подписок и избранного. Оплата:
  - **Крипта** — счёт в @CryptoBot (USDT/TON/BTC), Pro включается автоматически по вебхуку
  - **Реквизиты** — юзер шлёт скрин чека → тебе приходит фото с кнопками ✅/❌ → Pro включается одним нажатием
- Админ: `/stats`, `/grant <chat_id> [дней]`

## Сайт
- `/` — поиск курсов (тот же движок, что в боте), язык RU/EN/все, ссылка вида `/?q=python` открывается сразу с результатами
- `/kursy/<тема>/` — SEO-страницы тем (бизнес, маркетинг, программирование, flutter, ai, дизайн): проверенные ресурсы + свежие курсы
- `/pro/` — тарифы, кнопка ведёт в бота на оплату
- `sitemap.xml`, `robots.txt`, schema.org-разметка — для Google
- Кнопки «в Telegram» открывают бота сразу на нужной теме (`?start=t_biznes`) или на оплате (`?start=pro`)
- Страницы генерируются при сборке из `lib/catalog.mjs` (`scripts/build-site.mjs`). Добавил тему в каталог и в `META` скрипта — появилась новая страница.
- Запросы с сайта видны в `/stats` бота.

## Структура
```
netlify/functions/
  telegram.mjs   — вебхук Telegram        POST /api/telegram
  cryptopay.mjs  — вебхук CryptoBot       POST /api/cryptopay/<WEBHOOK_SECRET>
  digest.mjs     — рассылка новинок (по расписанию, 10:00–15:00 Ереван)
  setup.mjs      — разовая настройка       GET  /api/setup?key=<SETUP_KEY>
  search.mjs     — поиск для сайта         GET  /api/search?q=&lang=
lib/             — логика бота, поиск, база, CryptoBot
supabase/schema.sql
site/assets/     — стили и JS сайта
scripts/build-site.mjs — генерирует public/ при сборке
```

## Деплой (≈10 минут)
1. **Supabase**: создай проект → SQL Editor → выполни `supabase/schema.sql`.
2. **CryptoBot**: в @CryptoBot → Crypto Pay → Create App → скопируй API Token.
   Для теста без денег — @CryptoTestnetBot и `CRYPTOPAY_TESTNET=1`.
3. **GitHub**: залей эту папку в репозиторий.
4. **Netlify**: Add new site → Import from GitHub → выбери репо (build-настройки подтянутся из `netlify.toml`).
5. Netlify → Site configuration → **Environment variables**: всё из `.env.example`.
6. **Deploy** (после добавления переменных — Trigger deploy).
7. Открой `https://<твой-сайт>.netlify.app/api/setup?key=<SETUP_KEY>` — поставит вебхук и меню команд.
8. Скопируй из ответа `cryptopay_webhook_url` → @CryptoBot → Crypto Pay → My Apps → твоё приложение → Webhooks → вставь и включи.
9. Свой домен (необязательно): Netlify → Domain management. Потом поставь `SITE_URL=https://твой-домен` и сделай redeploy.
10. Google Search Console → добавь сайт → отправь `https://<сайт>/sitemap.xml`.

Готово. Напиши боту `/start`.

## Локальная проверка
```bash
npm i
npm i -g netlify-cli
netlify dev    # функции на localhost:8888
```

## Важно
- Telegram в правилах требует оплачивать цифровые товары в ботах через Telegram Stars. Крипта и переводы — на твой риск: бота могут ограничить.
- Платёж не активируется дважды: статус меняется только из `pending`.
- Вебхуки защищены: Telegram — секретным заголовком, CryptoBot — секретом в пути + HMAC-подписью.
