// Ручная подборка проверенных бесплатных ресурсов: [название, ссылка, описание]
export const CATALOG = {
  "бизнес": [
    ["Y Combinator Startup School", "https://www.startupschool.org/", "Бесплатный курс YC по запуску стартапа"],
    ["YC Startup Library", "https://www.ycombinator.com/library", "Статьи и видео от YC: идеи, рост, фандрайзинг"],
    ["MIT OpenCourseWare", "https://ocw.mit.edu/", "Лекции MIT, в т.ч. Sloan School of Management"],
    ["Khan Academy — финграмотность", "https://www.khanacademy.org/college-careers-more/financial-literacy", "Деньги, кредиты, инвестиции с нуля"],
  ],
  "маркетинг": [
    ["HubSpot Academy", "https://academy.hubspot.com/", "Контент-маркетинг, SEO, email, продажи + сертификаты"],
    ["Grow with Google", "https://grow.google/", "Бесплатные курсы Google по digital-навыкам"],
  ],
  "программирование": [
    ["CS50x (Harvard)", "https://cs50.harvard.edu/x/", "Лучший вводный курс по CS"],
    ["CS50 Python", "https://cs50.harvard.edu/python/", "Python от Гарварда"],
    ["freeCodeCamp", "https://www.freecodecamp.org/", "Веб, JS, Python, сертификаты"],
    ["Stepik", "https://stepik.org/catalog", "Много бесплатных курсов на русском"],
  ],
  "flutter": [
    ["Flutter Learn", "https://flutter.dev/learn", "Официальные материалы и codelabs"],
  ],
  "ai": [
    ["fast.ai", "https://course.fast.ai/", "Практический deep learning"],
    ["Google ML Crash Course", "https://developers.google.com/machine-learning/crash-course", "Основы ML от Google"],
    ["Elements of AI", "https://www.elementsofai.com/", "ИИ для всех, без кода"],
    ["Kaggle Learn", "https://www.kaggle.com/learn", "Короткие практические курсы по Python, ML, SQL"],
  ],
  "дизайн": [
    ["Laws of UX", "https://lawsofux.com/", "Принципы UX с примерами"],
    ["Figma Help Center", "https://help.figma.com/", "Официальное обучение Figma"],
  ],
};

// латинские слаги для URL сайта и deep-link'ов бота (t.me/bot?start=t_<slug>)
export const SLUGS = {
  biznes: "бизнес",
  marketing: "маркетинг",
  programmirovanie: "программирование",
  flutter: "flutter",
  ai: "ai",
  dizain: "дизайн",
};

const ALIASES = {
  "стартап": "бизнес", "предпринимательство": "бизнес", "финансы": "бизнес",
  "smm": "маркетинг", "seo": "маркетинг", "продажи": "маркетинг",
  "python": "программирование", "код": "программирование", "веб": "программирование",
  "javascript": "программирование", "js": "программирование",
  "ии": "ai", "нейросети": "ai", "ml": "ai", "ux": "дизайн", "ui": "дизайн", "figma": "дизайн",
};

export function findTopic(query) {
  const q = query.toLowerCase().trim();
  if (CATALOG[q]) return q;
  for (const w of q.split(/\s+/)) {
    if (CATALOG[w]) return w;
    if (ALIASES[w]) return ALIASES[w];
  }
  return null;
}
