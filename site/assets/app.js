(() => {
  const LS_KEY = "fc_lang";
  const store = {
    get: () => { try { return localStorage.getItem(LS_KEY); } catch { return null; } },
    set: (v) => { try { localStorage.setItem(LS_KEY, v); } catch {} },
  };

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const safeUrl = (u) => {
    try { const x = new URL(u); return x.protocol === "https:" ? x.href : "#"; } catch { return "#"; }
  };
  const card = (title, sub, url, badge, ok) => {
    const a = el("a", "card");
    a.href = safeUrl(url); a.target = "_blank"; a.rel = "noopener";
    a.append(el("div", "t", title));
    const s = el("div", "s");
    if (badge) s.append(el("span", "badge" + (ok ? " ok" : ""), badge));
    s.append(document.createTextNode(sub || ""));
    a.append(s);
    return a;
  };

  async function run(q, lang, box, { withLinks = true, src = "", skipCatalog = false } = {}) {
    const sk = el("div", "skeleton");
    for (let i = 0; i < 6; i++) sk.append(el("div", "sk"));
    box.replaceChildren(el("div", "status", "Ищу бесплатные курсы…"), sk);
    let data;
    try {
      const r = await fetch(`/api/search?q=${encodeURIComponent(q)}&lang=${lang}${src ? "&src=" + src : ""}`);
      data = await r.json();
      if (!r.ok) throw new Error(data.error || "Ошибка");
    } catch (e) {
      box.replaceChildren(el("div", "status", "Не получилось загрузить. Попробуй ещё раз через минуту."));
      return;
    }
    const out = [];
    if (!skipCatalog && data.catalog?.length) {
      out.push(el("div", "group-title", "Проверенные ресурсы"));
      const l = el("div", "list");
      data.catalog.forEach((c) => l.append(card(c.title, c.desc, c.url, "Проверено", true)));
      out.push(l);
    }
    if (data.results?.length) {
      out.push(el("div", "group-title", `Найдено: ${data.results.length}`));
      const l = el("div", "list");
      data.results.forEach((it) => {
        const [platform, ...rest] = String(it.source).split(" · ");
        l.append(card(it.title, rest.join(" · "), it.url, platform));
      });
      out.push(l);
    }
    if ((skipCatalog || !data.catalog?.length) && !data.results?.length) {
      out.push(el("div", "status", `По «${q}» в базах ничего. Попробуй язык «Все» или поищи на платформах ниже.`));
    }
    if (withLinks && data.links?.length) {
      out.push(el("div", "group-title", "Искать ещё на платформах"));
      const l = el("div", "more-links");
      data.links.forEach((x) => {
        const a = el("a", "chip", x.name + " ↗");
        a.href = safeUrl(x.url); a.target = "_blank"; a.rel = "noopener";
        l.append(a);
      });
      out.push(l);
    }
    box.replaceChildren(...out);
    box.querySelectorAll(".card").forEach((c, i) => c.style.setProperty("--i", i));
  }

  // форма поиска на главной
  const form = document.querySelector("#search");
  if (form) {
    const input = form.querySelector("input");
    const select = form.querySelector("select");
    const box = document.querySelector("#results");
    const params = new URLSearchParams(location.search);
    select.value = params.get("lang") || store.get() || "ru";

    const go = (q) => {
      q = q.trim();
      if (q.length < 2) { input.focus(); return; }
      input.value = q;
      store.set(select.value);
      const p = new URLSearchParams({ q, lang: select.value });
      history.replaceState(null, "", `?${p}`);
      run(q, select.value, box);
    };
    form.addEventListener("submit", (e) => { e.preventDefault(); go(input.value); });
    select.addEventListener("change", () => input.value.trim().length >= 2 && go(input.value));
    document.querySelectorAll("[data-q]").forEach((b) => b.addEventListener("click", () => go(b.dataset.q)));
    if (params.get("q")) go(params.get("q"));
  }

  // живые результаты на страницах тем
  document.querySelectorAll("[data-live-q]").forEach((box) => {
    run(box.dataset.liveQ, store.get() || "ru", box, { withLinks: true, src: "page", skipCatalog: true });
  });

  // ---------- анимации ----------
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // появление блоков при скролле
  const reveal = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        io.unobserve(e.target);
        const n = e.target.querySelector("[data-count]");
        if (n) countUp(n);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveal.forEach((n) => io.observe(n));
  } else {
    reveal.forEach((n) => n.classList.add("in"));
  }

  function countUp(n) {
    const to = Number(n.dataset.count) || 0;
    const t0 = performance.now(), dur = 1100;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      n.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // печатающийся placeholder в поиске
  const input = document.querySelector("#search input");
  if (input && !reduce) {
    const words = ["python с нуля", "маркетинг", "excel", "английский язык", "нейросети", "figma", "финансовая грамотность", "sql"];
    let w = 0, c = 0, del = false;
    const tick = () => {
      if (document.activeElement !== input && !input.value) {
        const word = words[w];
        c += del ? -1 : 1;
        input.placeholder = "Например: " + word.slice(0, c) + (c % 2 ? "|" : "");
        if (!del && c === word.length) { del = true; return setTimeout(tick, 1400); }
        if (del && c === 0) { del = false; w = (w + 1) % words.length; }
      }
      setTimeout(tick, del ? 45 : 90);
    };
    setTimeout(tick, 800);
  }

  // параллакс карточек в hero за курсором
  const art = document.querySelector(".hero-art");
  if (art && !reduce && matchMedia("(pointer: fine)").matches) {
    const items = art.querySelectorAll("[data-depth]");
    let raf = 0;
    addEventListener("mousemove", (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
        items.forEach((it) => {
          const d = Number(it.dataset.depth);
          it.style.transform = `translate(${-x * d}px, ${-y * d}px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
        });
      });
    }, { passive: true });
  }

  // подсветка под курсором на карточках тем
  document.querySelectorAll(".topic").forEach((t) => {
    t.addEventListener("pointermove", (e) => {
      const r = t.getBoundingClientRect();
      t.style.setProperty("--mx", `${e.clientX - r.left}px`);
      t.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });
})();
