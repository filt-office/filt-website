// HOME, OFFICE and NEWS pages, ported from the hand-written Imweb widgets (filtehwa/filt_website).
// Content lives in pages/<page>.json; this file only draws it.
//   <script src=".../loader.js" data-template="office"></script>
// The mount is optional: <div data-filt-page></div> marks where to draw, otherwise it goes after the script.
(() => {
  const script = document.currentScript;
  if (!script) throw new Error("Pages script element is unavailable.");

  const PAGES = ["home", "office", "news"];
  const page = PAGES.includes(script.dataset.page) ? script.dataset.page : null;
  if (!page) {
    console.error(`FILT pages: unknown data-page "${script.dataset.page}".`);
    return;
  }

  let mount = document.querySelector("[data-filt-page]");
  if (!mount) {
    mount = document.createElement("div");
    mount.dataset.filtPage = "";
    script.after(mount);
  }

  const templateBase = new URL(".", script.src);
  // Uploaded images are stored as relative paths (assets/pages/PC/x.jpg) and served from the images repo.
  const imagesBase = "https://filt-office.github.io/filt-website-images/";
  const resolveAsset = (src) => (src ? new URL(src, /^assets\//.test(src) ? imagesBase : templateBase).href : "");
  const worksUrl = script.dataset.worksUrl || "/works_list";

  const addLink = (key, href) => {
    if (document.querySelector(`link[data-filt-template="${key}"]`)) return Promise.resolve();
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.filtTemplate = key;
    const loaded = new Promise((resolve, reject) => {
      link.addEventListener("load", resolve, { once: true });
      link.addEventListener("error", reject, { once: true });
    });
    document.head.append(link);
    return loaded;
  };
  // The builder adds ?v=… to bust caches; pass it on to the stylesheet too.
  const stylesReady = addLink("pages", new URL(`pages.css${new URL(script.src).search}`, templateBase).href);
  addLink("suit-font", "https://cdn.jsdelivr.net/npm/suit-font@1.0.0/dist/suit.min.css").catch(() => {});
  addLink("pretendard-font", "https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable.css").catch(() => {});

  const loadScript = (src) => new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded) resolve();
      else existing.addEventListener("load", resolve, { once: true });
      return;
    }
    const element = document.createElement("script");
    element.src = src;
    element.async = false;
    element.addEventListener("load", () => { element.dataset.loaded = "1"; resolve(); }, { once: true });
    element.addEventListener("error", reject, { once: true });
    document.body.append(element);
  });

  // Site colours (--filt-key, --filt-<id>) from pages/design.json.
  loadScript(new URL("design.js", templateBase).href).catch(() => {});
  // Same URLs as common-menu-v2.js, so the libraries load once.

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const go = (href) => { if (href) location.href = href; };
  const isMobile = () => window.matchMedia("(max-width: 768px)").matches;

  // Mirrors the common menu's open state onto <body> so the left column can slide (as on Works).
  const syncCommonMenuState = () => {
    const check = () => {
      const panel = document.getElementById("panel") || document.querySelector(".side-panel");
      document.body.classList.toggle("menu-open", Boolean(panel && panel.classList.contains("open")));
    };
    const observer = new MutationObserver(check);
    const attach = () => {
      check();
      observer.observe(document.getElementById("filt-common-menu-v2") || document.body, {
        attributes: true,
        subtree: true,
        attributeFilter: ["class"],
      });
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", attach);
    else attach();
  };

  const loadMenu = ({ homeButton = true } = {}) => {
    loadScript(new URL("common-menu-v2.js", templateBase).href).catch(() => {});
    if (homeButton) loadScript(new URL("home-button.js", templateBase).href).catch(() => {});
  };

  // ---------- shared PC frame for OFFICE / NEWS: section column (75%) + right panel (25%) ----------
  const section = (title) => {
    const sec = el("section", "sec");
    const inner = el("div", "sec__inner");
    const header = el("header", "sec__header");
    header.append(el("h3", "sec__title", title), el("div", "sec__divider"));
    inner.append(header);
    sec.append(inner);
    return { sec, inner };
  };

  const desktopFrame = (sections, right) => {
    const app = el("div", "info-desktop");
    const left = el("div", "left");
    left.append(el("section", "sec empty"), ...sections);
    app.append(left, right || el("div", "right"));
    return app;
  };

  // ---------- shared mobile frame: header bar + category filter + page ----------
  const mobileFrame = (categories, onFilter, content) => {
    const wrapper = el("div", "info-mobile");
    const header = el("header", "mobile-header");
    header.setAttribute("aria-hidden", "true");
    const filter = el("nav", "category-filter");
    categories.forEach(({ id, label }, index) => {
      const button = el("button", `filter-btn${index === 0 ? " active" : ""}`, label);
      button.type = "button";
      button.addEventListener("click", () => {
        filter.querySelectorAll(".filter-btn").forEach((other) => other.classList.toggle("active", other === button));
        onFilter(id);
      });
      filter.append(button);
    });
    const main = el("main", "mobile-page");
    main.append(...content);
    wrapper.append(header, filter, main);
    return wrapper;
  };

  // ---------- HOME (PC) ----------
  // Ported from the #filt-pc-home-v2 code widget: an intro where scattered lines gather into a large
  // FILT mark and dock on the menu logo, its own menu panel, and a vertical slideshow with captions.
  // Timing, colours and stroke come from the design system (design.js) with the widget's values as fallbacks.
  const SVG_NS = "http://www.w3.org/2000/svg";
  const svgEl = (tag, attrs = {}) => {
    const node = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  };
  // Menu logo: 12 straight segments in the panel's 240 x 410 box.
  const HOME_LOGO = [
    "M28.2,265.02v54.66", "M25.78,267.47h19.22", "M18,289.07h6", "M32.4,289.07h9.6",
    "M42,289.07h9.6", "M60,289.07h24", "M55.8,289.07v30.6", "M55.8,264.47v24.6",
    "M72,293.27v26.4", "M72,264.47v20.4", "M42,293.27v26.4", "M67.81,317.17h-14.46",
  ];
  // The same segments when the logo is opened (clicked).
  const HOME_LOGO_OPEN = [
    [49.37, -0.25, 49.37, 270.57], [85.87, 261.57, 124.87, 261.57],
    [-0.13, 289.07, 68.87, 289.07], [45, 301.57, 98.87, 301.57],
    [93.37, 327.57, 120.87, 327.57], [164.87, 299.07, 240, 299.07],
    [93.37, 314.57, 93.37, 389.57], [114.87, 270.35, 114.87, 315.58],
    [149.87, 382.37, 149.87, 410], [209.87, 296.57, 209.87, 338.57],
    [68.87, 258.57, 68.87, 291.57], [239.87, 355.57, 114.87, 355.57],
  ];
  // Intro start lines: the mobile 1200 x 2600 artwork (lower-right line split 1:2).
  const INTRO_STARTS = [
    [237, 0, 237, 1613.63], [419.5, 1568.63, 614.5, 1568.63], [-240, 1706.13, 345, 1706.13],
    [214.5, 1768.63, 484.5, 1768.63], [457, 1898.63, 594.5, 1898.63], [814.5, 1756.13, 1300, 1756.13],
    [564.5, 2038.63, 843, 2038.63], [457, 1831.13, 457, 2208.63], [1039.5, 1756.13, 1039.5, 1953.63],
    [843, 2038.63, 3000, 2038.63], [334.5, 1553.63, 334.5, 1706.13], [739.51, 2556, 739.51, 2173.62],
  ];
  // The large FILT mark the lines gather into (same artwork coordinates).
  const INTRO_GLYPH = [
    [494.5, 1163, 494.5, 1393], [482, 1175.5, 564.5, 1175.5], [452, 1265.5, 477, 1265.5],
    [512, 1265.5, 552, 1265.5], [552, 1265.5, 592, 1265.5], [627, 1265.5, 667, 1265.5],
    [677, 1163, 677, 1248], [609.5, 1163, 609.5, 1393], [677, 1283, 677, 1393],
    [667, 1265.5, 727, 1265.5], [552, 1283, 552, 1393], [659.5, 1380.5, 597, 1380.5],
  ];
  // Which menu path each intro line docks on.
  const INTRO_DOCK_ORDER = [0, 1, 2, 3, 4, 5, 9, 7, 8, 6, 10, 11];
  const NAV_MARKER = "filt-home-same-tab-navigation-v1"; // set by the site's common header code

  const cubicInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  // GSAP ease names (logo.ease) without GSAP: powerN / quad.. / sine / expo / circ, .in .out .inOut.
  const gsapEase = (name) => {
    const [kind, mode = "out"] = String(name || "").trim().split(".");
    const powers = { power0: 1, linear: 1, none: 1, power1: 2, quad: 2, power2: 3, cubic: 3, power3: 4, quart: 4, power4: 5, quint: 5, strong: 5 };
    let easeIn;
    if (powers[kind]) easeIn = (t) => Math.pow(t, powers[kind]);
    else if (kind === "sine") easeIn = (t) => 1 - Math.cos((t * Math.PI) / 2);
    else if (kind === "expo") easeIn = (t) => (t === 0 ? 0 : Math.pow(2, 10 * (t - 1)));
    else if (kind === "circ") easeIn = (t) => 1 - Math.sqrt(1 - t * t);
    else return cubicInOut;
    if (mode === "in") return easeIn;
    if (mode === "inOut") return (t) => (t < 0.5 ? easeIn(t * 2) / 2 : 1 - easeIn((1 - t) * 2) / 2);
    return (t) => 1 - easeIn(1 - t);
  };
  const designValue = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  // A CSS time ("0.8s" / "800ms") in milliseconds.
  const designMs = (name, fallback) => {
    const value = designValue(name);
    const number = parseFloat(value);
    if (!value || !Number.isFinite(number)) return fallback;
    return /ms$/.test(value) ? number : number * 1000;
  };
  const designNumber = (name, fallback) => {
    const number = parseFloat(designValue(name));
    return Number.isFinite(number) ? number : fallback;
  };
  // Waits briefly for design.js, so the intro starts with the saved timing.
  const designReady = () => new Promise((resolve) => {
    const root = document.documentElement;
    const done = () => ["ready", "default", "builder"].includes(root.dataset.filtDesign);
    if (done()) return resolve();
    const observer = new MutationObserver(() => { if (done()) { observer.disconnect(); resolve(); } });
    observer.observe(root, { attributes: true, attributeFilter: ["data-filt-design"] });
    setTimeout(() => { observer.disconnect(); resolve(); }, 1500);
  });
  const parseSegment = (d) => {
    const values = d.match(/-?\d*\.?\d+/g).map(Number);
    const command = d.match(/[hHvVlL]/)[0];
    const [x, y, a, b] = values;
    if (command === "h") return [x, y, x + a, y];
    if (command === "v") return [x, y, x, y + a];
    if (command === "H") return [x, y, a, y];
    if (command === "V") return [x, y, x, a];
    return [x, y, a, b];
  };

  const buildHomePC = (data, target) => {
    const root = el("div");
    root.id = "filt-pc-home-v2";

    const overlay = el("div");
    overlay.dataset.intro = "";
    overlay.setAttribute("role", "button");
    overlay.tabIndex = 0;
    overlay.setAttribute("aria-label", "시작 애니메이션 건너뛰기");
    const svg = svgEl("svg", { "aria-hidden": "true" });
    overlay.append(svg);

    const panel = el("aside", "side-panel");
    const logoButton = el("div", "logo-btn");
    const menuLogoSvg = svgEl("svg", { viewBox: "0 0 240 410" });
    const logoPaths = HOME_LOGO.map((d) => menuLogoSvg.appendChild(svgEl("path", { d })));
    logoButton.append(menuLogoSvg);
    const officeName = el("div", "office-name");
    const officeText = el("p");
    officeText.append("필트아키텍츠", el("br"), "건축사사무소");
    officeName.append(officeText);
    const nav = el("nav", "panel-menu");
    const list = el("ul");
    [["/office", "OFFICE"], ["/news", "NEWS"], [target, "WORKS"]].forEach(([href, label]) => {
      const link = el("a", "", label);
      link.href = href;
      const item = el("li");
      item.append(link);
      list.append(item);
    });
    nav.append(list);
    const footer = el("footer", "panel-footer");
    const footerSvg = svgEl("svg", { width: "100%", height: "100%", role: "img", "aria-label": "ESSAYS AND DRAWINGS" });
    const mask = svgEl("mask", { id: "filt-home-v2-footer-text-cutout", x: "0", y: "0", width: "100%", height: "100%", style: "mask-type: luminance;" });
    const footerText = svgEl("text", { x: "20", y: "50%", "dominant-baseline": "central", fill: "black", style: "font-size:12px; font-weight:200; letter-spacing:0.6px;" });
    footerText.textContent = "ESSAYS AND DRAWINGS";
    mask.append(svgEl("rect", { width: "100%", height: "100%", fill: "white" }), footerText);
    const defs = svgEl("defs");
    defs.append(mask);
    footerSvg.append(defs, svgEl("rect", { width: "100%", height: "100%", fill: "black", mask: "url(#filt-home-v2-footer-text-cutout)" }));
    footer.append(footerSvg);
    panel.append(logoButton, officeName, el("div", "vert"), el("div", "divider-top"), nav, footer);

    const gallery = el("main", "slide-gallery");
    const stack = el("section", "slides");
    const slides = (data.slides || []).map((slide, index) => {
      const img = el("img");
      img.src = resolveAsset(slide.src);
      img.alt = slide.alt || slide.title || "";
      img.style.objectPosition = slide.position || "center center";
      img.style.visibility = index ? "hidden" : "visible";
      img.style.transform = "translateY(0)";
      stack.append(img);
      return img;
    });
    const zonePrev = el("div", "click-zone left");
    const zoneNext = el("div", "click-zone right");
    const caption = el("div", "project-caption");
    const titleTexts = (data.slides || []).map((slide) => slide.title || slide.alt || "");
    const titleSlides = (data.slides || []).map((slide, index) => {
      const row = el("div", "project-caption-title");
      const english = el("span", "", titleTexts[index]);
      english.lang = "en";
      const korean = el("span", "", slide.titleKo || "");
      korean.lang = "ko";
      row.append(english, korean);
      row.style.visibility = index === 0 ? "visible" : "hidden";
      row.style.transform = "translateY(0)";
      row.setAttribute("aria-hidden", index === 0 ? "false" : "true");
      caption.append(row);
      return row;
    });
    caption.setAttribute("aria-label", titleTexts[0] || "현재 프로젝트");
    gallery.append(stack, zonePrev, zoneNext, caption);
    root.append(overlay, panel, gallery);

    // Back/forward and returning through the menu skip the intro; a reload plays it.
    const navigation = performance.getEntriesByType ? performance.getEntriesByType("navigation")[0] : null;
    const navigationType = navigation ? navigation.type : "navigate";
    let menuReturn = false;
    try {
      const marker = JSON.parse(sessionStorage.getItem(NAV_MARKER) || "null");
      sessionStorage.removeItem(NAV_MARKER);
      const normalize = (value) => value.replace(/\/+$/, "") || "/";
      menuReturn = Boolean(marker && Date.now() - marker.at >= 0 && Date.now() - marker.at < 15000
        && normalize(marker.to) === normalize(location.pathname));
    } catch (error) { /* storage unavailable */ }
    const skipOnEntry = navigationType !== "reload" && (navigationType === "back_forward" || menuReturn);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ----- slideshow
    let current = 0;
    let sliding = false;
    let autoTimer;
    let introDone = false;
    const startAuto = () => {
      clearInterval(autoTimer);
      if (slides.length > 1 && introDone && !document.hidden) {
        autoTimer = setInterval(() => goTo((current + 1) % slides.length, 1), designMs("--filt-slide-interval", 10000));
      }
    };
    const goTo = (next, direction) => {
      if (!introDone || sliding || next === current || !slides[next]) return;
      sliding = true;
      const old = slides[current];
      const incoming = slides[next];
      const oldTitle = titleSlides[current];
      const incomingTitle = titleSlides[next];
      oldTitle.style.transition = incomingTitle.style.transition = "none";
      oldTitle.style.zIndex = "1";
      incomingTitle.style.zIndex = "2";
      incomingTitle.style.visibility = "visible";
      incomingTitle.style.transform = `translateY(${direction * 100}%)`;
      old.style.transition = "none";
      old.style.zIndex = "1";
      incoming.style.transition = "none";
      incoming.style.visibility = "visible";
      incoming.style.zIndex = "2";
      incoming.style.transform = `translateY(${direction * 100}%)`;
      void incoming.offsetWidth;
      void incomingTitle.offsetWidth;
      const duration = reduced ? 0 : designMs("--filt-motion-slide", 1000);
      const easing = designValue("--filt-motion-slide-ease") || "cubic-bezier(.45,0,.55,1)";
      old.style.transition = incoming.style.transition = `transform ${duration}ms ${easing}`;
      old.style.transform = `translateY(${-direction * 100}%)`;
      incoming.style.transform = "translateY(0)";
      oldTitle.style.transition = incomingTitle.style.transition = incoming.style.transition;
      oldTitle.style.transform = `translateY(${-direction * 100}%)`;
      incomingTitle.style.transform = "translateY(0)";
      let ended = false;
      const settle = () => {
        if (ended) return;
        ended = true;
        old.style.visibility = "hidden";
        old.style.transition = "none";
        old.style.transform = "translateY(0)";
        old.style.zIndex = "0";
        incoming.style.zIndex = "1";
        oldTitle.style.visibility = "hidden";
        oldTitle.style.transition = incomingTitle.style.transition = "none";
        oldTitle.style.transform = "translateY(0)";
        oldTitle.style.zIndex = "0";
        incomingTitle.style.zIndex = "1";
        oldTitle.setAttribute("aria-hidden", "true");
        incomingTitle.setAttribute("aria-hidden", "false");
        caption.setAttribute("aria-label", titleTexts[next]);
        incoming.removeEventListener("transitionend", onEnd);
        current = next;
        sliding = false;
      };
      const onEnd = (event) => { if (event.target === incoming && event.propertyName === "transform") settle(); };
      incoming.addEventListener("transitionend", onEnd);
      setTimeout(settle, duration + 100);
    };
    [[zonePrev, -1], [zoneNext, 1]].forEach(([zone, direction]) => {
      zone.addEventListener("click", (event) => {
        event.stopPropagation();
        if (!introDone || sliding || !slides.length) return;
        goTo((current + direction + slides.length) % slides.length, direction);
        startAuto();
      });
    });
    // Between the panel and the right 20%, the photo opens WORKS.
    const isWorks = (event) => !event.target.closest(".click-zone")
      && event.clientX >= panel.getBoundingClientRect().right
      && event.clientX < document.documentElement.clientWidth * 0.8;
    gallery.addEventListener("mousemove", (event) => { gallery.style.cursor = isWorks(event) ? "pointer" : "default"; });
    gallery.addEventListener("click", (event) => { if (introDone && isWorks(event)) go(target); });
    document.addEventListener("visibilitychange", startAuto);
    window.addEventListener("pagehide", () => clearInterval(autoTimer));

    // ----- menu logo: opens and closes by moving the segment endpoints (no library)
    const small = logoPaths.map((path) => parseSegment(path.getAttribute("d")));
    let big = false;
    let logoFrame;
    logoButton.addEventListener("click", () => {
      cancelAnimationFrame(logoFrame);
      const from = logoPaths.map((path) => parseSegment(path.getAttribute("d")));
      big = !big;
      const to = big ? HOME_LOGO_OPEN : small;
      const duration = designMs("--filt-logo-morph", 800);
      const ease = gsapEase(designValue("--filt-logo-ease") || "power2.inOut");
      let start;
      const tick = (now) => {
        if (start === undefined) start = now;
        const t = reduced || !duration ? 1 : Math.min(1, (now - start) / duration);
        logoPaths.forEach((path, i) => {
          const v = from[i].map((value, j) => value + (to[i][j] - value) * ease(t));
          path.setAttribute("d", `M${v[0]},${v[1]}L${v[2]},${v[3]}`);
        });
        if (t < 1) logoFrame = requestAnimationFrame(tick);
      };
      logoFrame = requestAnimationFrame(tick);
    });

    // ----- intro
    const timing = { scale: 0.6, appear: 100, gather: 1800, hold: 100, dock: 1000 };
    let introFrame;
    let firstTime;
    let geometry;
    let fadeTime;
    let watchdog;
    let requestedSkip = false;
    let transferFrom;
    let transferStroke;
    let dockGeometry;
    const lines = INTRO_STARTS.map(() => svg.appendChild(svgEl("line")));
    const measure = () => {
      const w = document.documentElement.clientWidth || window.innerWidth;
      const h = window.innerHeight || document.documentElement.clientHeight;
      // One scale for both axes (mobile artwork at 1.1 x the window height), centred.
      const mobileScale = (h / 2600) * 1.1;
      const starts = INTRO_STARTS.map((line) => line.map((value, axis) => (axis % 2
        ? (value - 1300) * mobileScale + h / 2
        : (value - 600) * mobileScale + w / 2)));
      const scale = (Math.min(150, Math.max(110, w * 0.09), h * 0.24) / 275) * timing.scale;
      const ends = INTRO_GLYPH.map((line) => line.map((v, i) => (i % 2 ? (v - 1278) * scale + h / 2 : (v - 589.5) * scale + w / 2)));
      geometry = { starts, ends };
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      svg.style.strokeWidth = 25 * scale;
    };
    const draw = (t) => {
      lines.forEach((line, i) => ["x1", "y1", "x2", "y2"].forEach((attr, j) => {
        line.setAttribute(attr, geometry.starts[i][j] + (geometry.ends[i][j] - geometry.starts[i][j]) * cubicInOut(t));
      }));
    };
    // The real menu icon's position and stroke, in the intro's coordinates.
    const measureDock = () => {
      const introMatrix = svg.getScreenCTM();
      const menuMatrix = menuLogoSvg.getScreenCTM();
      if (!introMatrix || !menuMatrix) return null;
      const matrix = introMatrix.inverse().multiply(menuMatrix);
      const transform = (x, y) => [matrix.a * x + matrix.c * y + matrix.e, matrix.b * x + matrix.d * y + matrix.f];
      const ends = INTRO_DOCK_ORDER.map((index) => {
        const p = parseSegment(logoPaths[index].getAttribute("d"));
        return [...transform(p[0], p[1]), ...transform(p[2], p[3])];
      });
      const scale = Math.hypot(matrix.a, matrix.b);
      const stroke = (parseFloat(getComputedStyle(logoPaths[0]).strokeWidth) || 5) * scale;
      return { ends, stroke };
    };
    const drawDock = (t) => {
      const amount = cubicInOut(t);
      lines.forEach((line, i) => ["x1", "y1", "x2", "y2"].forEach((attr, j) => {
        line.setAttribute(attr, transferFrom[i][j] + (dockGeometry.ends[i][j] - transferFrom[i][j]) * amount);
      }));
      svg.style.strokeWidth = transferStroke + (dockGeometry.stroke - transferStroke) * amount;
    };
    const finishIntro = () => {
      if (introDone) return;
      introDone = true;
      cancelAnimationFrame(introFrame);
      clearTimeout(watchdog);
      window.removeEventListener("resize", measure);
      // Show the real icon in the frame its aligned copy disappears.
      menuLogoSvg.style.visibility = "";
      overlay.hidden = true;
      panel.inert = false;
      gallery.inert = false;
      startAuto();
    };
    // Let the first photo load behind the white layer (but never wait more than 5 s).
    let imageReady = !slides.length || (slides[0].complete && slides[0].naturalWidth > 0);
    if (slides.length) {
      const ready = () => { imageReady = true; };
      slides[0].addEventListener("load", ready, { once: true });
      slides[0].addEventListener("error", ready, { once: true });
    }
    const introTick = (now) => {
      if (introDone) return;
      const box = overlay.getBoundingClientRect();
      if (box.width <= 0 || box.height <= 0) {
        introFrame = requestAnimationFrame(introTick);
        return;
      }
      if (firstTime === undefined) {
        measure();
        firstTime = now;
      }
      const elapsed = now - firstTime;
      const progress = timing.gather ? Math.min(1, Math.max(0, (elapsed - timing.appear) / timing.gather)) : 1;
      if (fadeTime === undefined) {
        draw(progress);
        svg.style.opacity = timing.appear ? Math.min(1, elapsed / timing.appear) : 1;
      }
      const animationReady = elapsed >= timing.appear + timing.gather + timing.hold;
      if (fadeTime === undefined && (requestedSkip || animationReady) && (imageReady || elapsed >= 5000)) {
        dockGeometry = measureDock();
        if (dockGeometry) {
          transferFrom = lines.map((line) => ["x1", "y1", "x2", "y2"].map((attr) => Number(line.getAttribute(attr))));
          transferStroke = parseFloat(svg.style.strokeWidth);
          svg.style.opacity = "1";
          fadeTime = now;
        }
      }
      if (fadeTime !== undefined) {
        const fade = timing.dock ? Math.min(1, (now - fadeTime) / timing.dock) : 1;
        dockGeometry = measureDock() || dockGeometry;
        drawDock(fade);
        // Only the white background fades; the travelling mark stays visible.
        overlay.style.backgroundColor = `rgba(255,255,255,${1 - cubicInOut(fade)})`;
        if (fade === 1) { finishIntro(); return; }
      }
      introFrame = requestAnimationFrame(introTick);
    };
    overlay.addEventListener("click", () => { requestedSkip = true; });
    overlay.addEventListener("keydown", (event) => {
      if (["Escape", "Enter", " "].includes(event.key)) { event.preventDefault(); requestedSkip = true; }
    });
    const playIntro = async () => {
      if (reduced || isMobile()) { finishIntro(); return; }
      menuLogoSvg.style.visibility = "hidden";
      panel.inert = gallery.inert = true;
      watchdog = setTimeout(finishIntro, 10000);
      await designReady();
      timing.scale = designNumber("--filt-intro-scale", 0.6);
      timing.appear = designMs("--filt-intro-appear", 100);
      timing.gather = designMs("--filt-intro-gather", 1800);
      timing.hold = designMs("--filt-intro-hold", 100);
      timing.dock = designMs("--filt-intro-dock", 1000);
      try {
        measure();
        draw(0);
        overlay.focus({ preventScroll: true });
        window.addEventListener("resize", measure);
        introFrame = requestAnimationFrame(introTick);
      } catch (error) {
        finishIntro();
        console.warn("FILT 시작 화면을 건너뜁니다.", error);
      }
    };
    window.addEventListener("pagehide", () => {
      cancelAnimationFrame(introFrame);
      clearTimeout(watchdog);
    });
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) { finishIntro(); startAuto(); }
    });
    // Runs once the root is in the page.
    root.start = () => (skipOnEntry ? finishIntro() : playIntro());
    return root;
  };

  // ---------- HOME ----------
  const renderHome = (data) => {
    const target = data.worksLink || worksUrl;
    const mobileHome = window.matchMedia("(max-width: 768px), (orientation: landscape) and (hover: none) and (pointer: coarse)").matches;
    if (mobileHome) {
      const next = new URL(target, location.href);
      const path = (url) => url.pathname.replace(/\/+$/, "");
      if (next.origin !== location.origin || path(next) !== path(location)) {
        location.replace(next.href);
      }
      return;
    }

    const home = buildHomePC(data, target);
    mount.replaceChildren(home);
    home.start();
  };

  // ---------- OFFICE ----------
  const spacedName = (name) => [...(name || "").replace(/\s+/g, "")].join(" ");

  const renderOffice = (data) => {
    const contact = data.contact || [];
    const people = data.people || [];

    // PC
    const office = section("OFFICE");
    contact.forEach((entry) => {
      const item = el("div", "item");
      if (entry.link && entry.link.startsWith("mailto:")) {
        const anchor = el("a", "", entry.text);
        anchor.href = entry.link;
        item.append(anchor);
      } else {
        item.append(el("p", "", entry.text));
        if (entry.link) item.addEventListener("click", () => go(entry.link));
      }
      office.inner.append(item);
    });
    office.sec.append(el("div", "sec__divider"));

    const personItem = (person) => {
      const item = el("div", `item person${person.principal ? " principal" : ""}`);
      const row = (name, role, email) => {
        const main = el("div", "main");
        main.append(el("span", "name", name), el("span", "role", role), el("span", "email", email));
        return main;
      };
      const info = el("div", `info${person.principal ? " open" : ""}`);
      (person.career || []).forEach((step) => {
        if (step.gap) { info.append(el("div", "spacer")); return; }
        const line = el("div", step.current ? "is-bold" : "");
        line.append(el("span", "", step.years), el("span", "", step.org), el("span", "", step.title || ""));
        info.append(line);
      });
      item.append(row(spacedName(person.nameKo), person.roleKo, ""), row(person.nameEn, person.roleEn, person.email), info);
      if (!person.principal) {
        item.addEventListener("mouseenter", () => info.classList.add("open"));
        item.addEventListener("mouseleave", () => info.classList.remove("open"));
        item.addEventListener("click", () => info.classList.toggle("open"));
      }
      return item;
    };
    const principals = people.filter((person) => person.principal);
    const others = people.filter((person) => !person.principal);

    // PC: hovering a person shows their photo on the right (nothing when they have none).
    const right = el("div", "right");
    const portrait = el("div", "thumbnail portrait");
    const photo = el("img", "thumb");
    photo.alt = "";
    portrait.append(photo);
    right.append(portrait);
    let photoTimeout = null;
    const withPhoto = (person, item) => {
      item.addEventListener("mouseenter", () => {
        clearTimeout(photoTimeout);
        if (!person.image) { photo.classList.remove("show"); return; }
        photo.src = resolveAsset(person.image);
        if (photo.complete) photo.classList.add("show");
        else photo.onload = () => photo.classList.add("show");
      });
      item.addEventListener("mouseleave", () => {
        photoTimeout = setTimeout(() => photo.classList.remove("show"), 200);
      });
      return item;
    };

    const peopleSec = section("PEOPLE");
    peopleSec.sec.classList.add("people");
    peopleSec.inner.append(...principals.map((person) => withPhoto(person, personItem(person))));
    const teamSec = el("section", "sec people");
    const teamInner = el("div", "sec__inner");
    teamInner.append(...others.map((person) => withPhoto(person, personItem(person))));
    teamSec.append(el("div", "sec__divider"), teamInner, el("div", "sec__divider"));
    const desktop = desktopFrame([office.sec, peopleSec.sec, teamSec], right);
    desktop.dataset.page = "office";

    // Mobile
    const officeContent = el("div", "office-content");
    const officeSection = el("div", "office-section");
    contact.forEach((entry) => {
      const line = el("p", "", entry.mobileText || entry.text);
      if (entry.link) line.addEventListener("click", () => go(entry.link));
      officeSection.append(line);
    });
    officeContent.append(officeSection);

    const peopleContent = el("div", "people-content");
    peopleContent.hidden = true;
    const mobileRow = (cells, bold) => {
      const row = el("div", "people-row");
      cells.forEach((cell) => row.append(el("div", `col${bold ? " bold" : ""}`, cell || "")));
      return row;
    };
    const mobileBlock = (person) => {
      const block = el("div", `people-block${person.principal ? " always-open" : " designer-block"}`);
      const timeline = el("div", `timeline${person.principal ? " open" : ""}`);
      timeline.append(el("div", "gap-5"));
      (person.career || []).filter((step) => !step.gap).forEach((step) => {
        timeline.append(mobileRow([step.years, step.mobileOrg ?? step.org, step.mobileTitle ?? step.title]));
      });
      block.append(
        mobileRow([person.nameKo, person.roleKo], true),
        mobileRow([person.nameEn, person.roleEn, person.email], true),
        timeline,
      );
      if (!person.principal) {
        block.addEventListener("click", () => {
          const open = block.classList.toggle("open");
          timeline.style.maxHeight = open ? `${timeline.scrollHeight}px` : "0";
        });
      }
      return block;
    };
    principals.forEach((person) => peopleContent.append(mobileBlock(person), el("div", "divider-hr"), el("div", "gap-15")));
    others.forEach((person, index) => {
      if (index) peopleContent.append(el("div", "gap-10"));
      peopleContent.append(mobileBlock(person));
    });

    const mobile = mobileFrame(
      [{ id: "office", label: "Office" }, { id: "people", label: "People" }],
      (id) => { officeContent.hidden = id !== "office"; peopleContent.hidden = id !== "people"; },
      [officeContent, peopleContent],
    );
    mobile.dataset.page = "office";

    mount.replaceChildren(desktop, mobile);
    syncCommonMenuState();
    loadMenu();
  };

  // ---------- NEWS ----------
  const renderNews = (data) => {
    const news = data.news || [];
    const recruit = (data.recruit || []).map((entry) => {
      const details = [["모집 분야", entry.field], ["모집 요건", entry.requirements], ["제출물", entry.submissions], ["마감일", entry.deadline]]
        .filter(([, value]) => typeof value === "string" && value.trim())
        .map(([label, value]) => `${label}\n${value}`);
      if (entry.text) details.push(entry.text); // Preserve legacy notices without migrating their saved data.
      return { ...entry, date: entry.deadline ?? entry.date, type: entry.field ?? entry.type, text: details.join("\n\n") };
    });
    const empty = data.recruitEmpty ?? "진행중인 채용 공고가 없습니다.";

    // PC: rows with a hover preview on the right.
    const right = el("div", "right");
    const thumbnail = el("div", "thumbnail");
    const thumb = el("img", "thumb");
    thumb.alt = "preview";
    thumbnail.append(thumb);
    right.append(thumbnail);
    let hideTimeout = null;
    const desktopRow = (entry) => {
      const item = el("div", "item");
      item.append(el("span", "", entry.title), el("span", "", entry.date), el("span", "", entry.type), el("span", "", entry.author));
      item.addEventListener("mouseenter", () => {
        if (!entry.image) return;
        clearTimeout(hideTimeout);
        thumb.src = resolveAsset(entry.image);
        if (thumb.complete) thumb.classList.add("show");
        else thumb.onload = () => thumb.classList.add("show");
      });
      item.addEventListener("mouseleave", () => {
        hideTimeout = setTimeout(() => thumb.classList.remove("show"), 200);
      });
      if (entry.link) item.addEventListener("click", () => go(entry.link));
      return item;
    };
    const newsSec = section("NEWS");
    newsSec.inner.append(...news.map(desktopRow));
    const recruitSec = section("RECRUIT");
    recruitSec.inner.append(...(recruit.length ? recruit.map(desktopRow) : empty ? [el("div", "item", empty)] : []));
    const desktop = desktopFrame([newsSec.sec, recruitSec.sec], right);
    desktop.dataset.page = "news";

    // Mobile: accordion rows (one open at a time) with the picture and text.
    const pairs = [];
    const mobileRow = (entry, category) => {
      const row = el("div", "news-row");
      row.append(
        el("div", "list-title", entry.mobileTitle || entry.title),
        el("div", "list-date", entry.date || "-"),
        el("div", "list-extra", (category === "Recruit" ? entry.type : entry.author) || "-"),
      );
      const timeline = el("div", "timeline");
      const body = el("div", "news-body");
      if (entry.image) {
        const img = el("img");
        img.src = resolveAsset(entry.image);
        img.alt = "";
        img.loading = "lazy";
        body.append(img);
      }
      if (category === "Recruit") body.style.whiteSpace = "pre-line";
      body.append(document.createTextNode(entry.text ? `- ${entry.text}` : "-"));
      timeline.append(el("div", "gap-6"), body, el("div", "gap-10"));
      const pair = { row, timeline, category };
      row.addEventListener("click", () => {
        const open = row.classList.contains("open");
        pairs.forEach((other) => { other.row.classList.remove("open"); other.timeline.style.maxHeight = "0px"; });
        if (!open) {
          row.classList.add("open");
          timeline.style.maxHeight = `${timeline.scrollHeight}px`;
        }
      });
      pairs.push(pair);
      return [row, timeline];
    };
    const grid = el("div", "news-grid");
    news.forEach((entry) => grid.append(...mobileRow(entry, "News")));
    (recruit.length ? recruit : empty ? [{ title: empty }] : []).forEach((entry) => grid.append(...mobileRow(entry, "Recruit")));

    const mobile = mobileFrame(
      [{ id: "all", label: "All" }, { id: "News", label: "News" }, { id: "Recruit", label: "Recruit" }],
      (id) => pairs.forEach((pair) => {
        const show = id === "all" || pair.category === id;
        pair.row.hidden = !show;
        pair.timeline.hidden = !show;
        if (!show) { pair.row.classList.remove("open"); pair.timeline.style.maxHeight = "0px"; }
      }),
      [grid],
    );
    mobile.dataset.page = "news";

    mount.replaceChildren(desktop, mobile);
    syncCommonMenuState();
    loadMenu();
  };

  const RENDER = { home: renderHome, office: renderOffice, news: renderNews };

  Promise.all([
    stylesReady,
    // data-page-src lets the builder preview unsaved data; production uses pages/<page>.json.
    fetch(script.dataset.pageSrc || new URL(`pages/${page}.json`, templateBase)).then((response) => {
      if (!response.ok) throw new Error(`Page data request failed (${response.status}).`);
      return response.json();
    }),
  ])
    .then(([, data]) => {
      mount.classList.add("filt-page");
      mount.dataset.page = page;
      RENDER[page](data);
    })
    .catch((error) => {
      console.error("Page template could not render.", error);
      const message = document.createElement("p");
      message.textContent = `페이지를 불러오지 못했습니다: ${error.message}`;
      mount.replaceChildren(message);
    });
})();
