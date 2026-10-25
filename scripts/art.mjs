// Оригинальные SVG-иллюстрации сайта. Цвета берутся из CSS-переменных, анимации — классы в style.css.

const svg = (body, vb = "0 0 160 110", cls = "") =>
  `<svg class="art ${cls}" viewBox="${vb}" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

export const TOPIC_ART = {
  biznes: svg(`
    <rect x="10" y="92" width="140" height="3" rx="1.5" fill="var(--line)"/>
    <rect class="bar b1" x="24" y="62" width="18" height="30" rx="4" fill="var(--accent-soft)"/>
    <rect class="bar b2" x="52" y="48" width="18" height="44" rx="4" fill="var(--accent-soft)"/>
    <rect class="bar b3" x="80" y="34" width="18" height="58" rx="4" fill="color-mix(in srgb, var(--accent) 45%, var(--accent-soft))"/>
    <rect class="bar b4" x="108" y="18" width="18" height="74" rx="4" fill="var(--accent)"/>
    <path class="draw" d="M20 70 L56 52 L84 42 L118 14" fill="none" stroke="var(--good)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M108 12 L119 13 L117 24" fill="none" stroke="var(--good)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <circle class="twinkle" cx="140" cy="20" r="3" fill="var(--accent)"/>`),

  marketing: svg(`
    <circle class="wave w1" cx="104" cy="50" r="18" fill="none" stroke="var(--accent)" stroke-width="2.5"/>
    <circle class="wave w2" cx="104" cy="50" r="18" fill="none" stroke="var(--accent)" stroke-width="2.5"/>
    <g class="bob">
      <path d="M30 42 L84 22 L84 78 L30 58 Z" fill="var(--accent)"/>
      <rect x="18" y="40" width="16" height="20" rx="4" fill="color-mix(in srgb, var(--accent) 60%, var(--fg))"/>
      <path d="M38 60 L44 84 L56 84 L52 64" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="2"/>
      <rect x="84" y="30" width="6" height="40" rx="3" fill="var(--fg)" opacity=".75"/>
    </g>
    <g class="pop p1"><rect x="118" y="14" width="30" height="18" rx="6" fill="var(--good)"/><text x="133" y="27" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">+42</text></g>
    <g class="pop p2"><circle cx="134" cy="84" r="9" fill="#ff5c7a"/><path d="M130 84 l3 3 l6 -6" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>`),

  programmirovanie: svg(`
    <rect x="14" y="12" width="132" height="86" rx="10" fill="var(--surface)" stroke="var(--line)" stroke-width="2"/>
    <rect x="14" y="12" width="132" height="18" rx="10" fill="var(--surface-2)"/>
    <circle cx="26" cy="21" r="3" fill="#ff5f57"/><circle cx="36" cy="21" r="3" fill="#febc2e"/><circle cx="46" cy="21" r="3" fill="#28c840"/>
    <rect class="code c1" x="26" y="40" width="46" height="6" rx="3" fill="var(--accent)"/>
    <rect class="code c2" x="36" y="52" width="70" height="6" rx="3" fill="var(--good)"/>
    <rect class="code c3" x="36" y="64" width="52" height="6" rx="3" fill="var(--muted)" opacity=".6"/>
    <rect class="code c4" x="26" y="76" width="30" height="6" rx="3" fill="var(--accent)"/>
    <rect class="caret" x="60" y="75" width="3" height="9" rx="1" fill="var(--fg)"/>
    <text class="float-y" x="118" y="86" font-size="22" font-weight="800" fill="var(--accent)" font-family="monospace">&lt;/&gt;</text>`),

  flutter: svg(`
    <g class="bob">
      <rect x="52" y="6" width="56" height="98" rx="12" fill="var(--fg)"/>
      <rect x="56" y="12" width="48" height="86" rx="8" fill="var(--surface)"/>
      <rect x="72" y="8" width="16" height="3" rx="1.5" fill="var(--surface-2)"/>
      <rect class="tile t1" x="61" y="20" width="38" height="18" rx="5" fill="var(--accent)"/>
      <rect class="tile t2" x="61" y="42" width="17" height="17" rx="5" fill="var(--accent-soft)"/>
      <rect class="tile t3" x="82" y="42" width="17" height="17" rx="5" fill="var(--good)" opacity=".8"/>
      <rect class="tile t4" x="61" y="63" width="38" height="8" rx="4" fill="var(--surface-2)"/>
      <rect class="tile t5" x="61" y="75" width="26" height="8" rx="4" fill="var(--surface-2)"/>
    </g>
    <path class="spin-slow" d="M24 30 l10 -10 l10 10 l-10 10 z" fill="var(--accent)" opacity=".85"/>
    <path class="spin-slow rev" d="M122 74 l8 -8 l8 8 l-8 8 z" fill="#44c7f4"/>`),

  ai: svg(`
    <g stroke="var(--line)" stroke-width="2">
      <line x1="28" y1="28" x2="80" y2="20"/><line x1="28" y1="28" x2="80" y2="55"/><line x1="28" y1="82" x2="80" y2="55"/>
      <line x1="28" y1="82" x2="80" y2="90"/><line x1="28" y1="55" x2="80" y2="20"/><line x1="28" y1="55" x2="80" y2="90"/>
      <line x1="80" y1="20" x2="132" y2="40"/><line x1="80" y1="55" x2="132" y2="40"/><line x1="80" y1="55" x2="132" y2="72"/><line x1="80" y1="90" x2="132" y2="72"/>
    </g>
    <path class="signal" d="M28 55 L80 20 L132 40" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round"/>
    <path class="signal s2" d="M28 82 L80 55 L132 72" fill="none" stroke="var(--good)" stroke-width="3" stroke-linecap="round"/>
    <circle class="node n1" cx="28" cy="28" r="8" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="2"/>
    <circle class="node n2" cx="28" cy="55" r="8" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="2"/>
    <circle class="node n3" cx="28" cy="82" r="8" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="2"/>
    <circle class="node n4" cx="80" cy="20" r="9" fill="var(--accent)"/>
    <circle class="node n5" cx="80" cy="55" r="9" fill="var(--accent)"/>
    <circle class="node n6" cx="80" cy="90" r="9" fill="var(--accent)"/>
    <circle class="node n7" cx="132" cy="40" r="10" fill="var(--good)"/>
    <circle class="node n8" cx="132" cy="72" r="10" fill="var(--good)"/>`),

  dizain: svg(`
    <path class="draw" d="M16 86 C 40 20, 80 100, 112 40" fill="none" stroke="var(--accent)" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="16" y1="86" x2="40" y2="30" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="3 3"/>
    <line x1="112" y1="40" x2="88" y2="96" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="3 3"/>
    <rect x="12" y="82" width="8" height="8" fill="var(--surface)" stroke="var(--accent)" stroke-width="2"/>
    <rect x="108" y="36" width="8" height="8" fill="var(--surface)" stroke="var(--accent)" stroke-width="2"/>
    <circle cx="40" cy="30" r="4" fill="var(--accent)"/><circle cx="88" cy="96" r="4" fill="var(--accent)"/>
    <g class="bob"><circle cx="134" cy="22" r="10" fill="#ff5c7a"/><circle cx="146" cy="40" r="8" fill="#febc2e"/><circle cx="128" cy="44" r="7" fill="#28c840"/></g>
    <path class="float-y" d="M118 70 l20 8 l-8 3 l-3 8 z" fill="var(--fg)"/>`),
};

// Большая иллюстрация в hero главной: «поисковая витрина» с летающими карточками курсов
export const HERO_ART = `
<div class="hero-art" aria-hidden="true">
  <div class="orbit o1"></div>
  <div class="orbit o2"><span class="dot"></span></div>
  <div class="orbit o3"><span class="dot d2"></span></div>
  <div class="fcard fc1" data-depth="18">
    <span class="fbadge ok">Бесплатно</span>
    <b>Python с нуля</b>
    <small>Stepik · 42 урока</small>
    <span class="fbar"><i style="width:72%"></i></span>
  </div>
  <div class="fcard fc2" data-depth="30">
    <span class="fbadge">Audit</span>
    <b>Основы бизнеса</b>
    <small>Coursera · 6 недель</small>
    <span class="fstars">★★★★★</span>
  </div>
  <div class="fcard fc3" data-depth="12">
    <span class="fbadge yt">▶ Плейлист</span>
    <b>Figma для новичков</b>
    <small>YouTube · 24 видео</small>
  </div>
  <div class="fchip ch1" data-depth="40">🎓 Сертификат</div>
  <div class="fchip ch2" data-depth="24">0 ₽</div>
  <div class="fchip ch3" data-depth="34">🔔 Новинки в Telegram</div>
  ${["s1", "s2", "s3", "s4", "s5"].map((c) => `<span class="spark ${c}"></span>`).join("")}
</div>`;

export const PLATFORMS = ["Stepik", "Coursera", "YouTube", "edX", "MIT OCW", "Khan Academy", "Udemy Free", "Microsoft Learn", "Class Central", "freeCodeCamp", "Harvard CS50", "Kaggle"];

// Пустая иллюстрация для 404
export const LOST_ART = svg(`
  <circle cx="70" cy="50" r="30" fill="none" stroke="var(--accent)" stroke-width="6"/>
  <line x1="92" y1="72" x2="118" y2="98" stroke="var(--accent)" stroke-width="8" stroke-linecap="round"/>
  <text class="float-y" x="70" y="60" text-anchor="middle" font-size="28" font-weight="800" fill="var(--muted)">?</text>
  <circle class="twinkle" cx="130" cy="24" r="4" fill="var(--good)"/>`, "0 0 160 110", "lost");
