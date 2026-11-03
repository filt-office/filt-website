(() => {
  const script = document.currentScript;
  if (!script) throw new Error("Works script element is unavailable.");

  let view = script.dataset.view === "gallery" ? "gallery" : "list";
  const mount = document.querySelector("[data-filt-works]");
  if (!mount) {
    console.error("Works template requires a data-filt-works mount.");
    return;
  }

  const templateBase = new URL(".", script.src);
  // Relative thumbnails are uploaded assets (assets/works/PC/...) served from the images repo;
  // mobile uses the MOB copy.
  const imagesBase = "https://filt-office.github.io/filt-website-images/";
  const resolveAsset = (src, device = "PC") => {
    if (!src) return "";
    const path = device === "MOB" ? src.replace(/^assets\/([^/]+)\/PC\//, "assets/$1/MOB/") : src;
    return new URL(path, /^assets\//.test(path) ? imagesBase : templateBase).href;
  };
  const listUrl = script.dataset.listUrl || "/works_list";
  const galleryUrl = script.dataset.galleryUrl || "/works_gallery";
  // With data-project-page="/project", rows with a projectId open the shared detail page (/project?id=<projectId>).
  const projectPage = script.dataset.projectPage || "";

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
  const stylesReady = addLink("works", new URL(`works.css${new URL(script.src).search}`, templateBase).href);
  addLink("suit-font", "https://cdn.jsdelivr.net/npm/suit-font@1.0.0/dist/suit.min.css").catch(() => {});
  addLink("pretendard-font", "https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable.css").catch(() => {});

  const loadScript = (src) => {
    if (document.querySelector(`script[src="${src}"]`)) return;
    const element = document.createElement("script");
    element.src = src;
    element.async = false;
    document.body.append(element);
  };

  // Site colours (--filt-key, --filt-<id>) from pages/design.json.
  loadScript(new URL("design.js", templateBase).href);

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  // With a shared detail page, only rows whose project is published (release.sh keeps their projectId) open it;
  // their old Imweb links are gone or redirect home, so the other rows are listed but not clickable.
  // Without one (older widgets), rows still follow their own link.
  const linkTo = (node, work) => {
    const href = projectPage ? (work.projectId ? `${projectPage}?id=${encodeURIComponent(work.projectId)}` : "") : work.link;
    if (!href) return;
    node.classList.add("is-linked");
    node.addEventListener("click", () => { location.href = href; });
  };

  const byGalleryOrder = (works) => works
    .map((work, index) => ({ work, index }))
    .sort((a, b) => (a.work.galleryOrder ?? Infinity) - (b.work.galleryOrder ?? Infinity) || a.index - b.index)
    .map(({ work }) => work);

  const icon = {
    gallery: '<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" width="18" height="18"><rect x="0.5" y="0.5" width="17" height="17" fill="#fff" stroke="#000" stroke-width="2.5"/><path d="M17,13 L13,8 L9,13 L7,10 L1,17" fill="none" stroke="#000" stroke-width="2" stroke-linejoin="round"/></svg>',
    list: '<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" width="18" height="18"><line y1="0.5" x2="18" y2="0.5" stroke="#000" stroke-width="2"/><line y1="6.17" x2="18" y2="6.17" stroke="#000" stroke-width="4"/><line y1="11.83" x2="18" y2="11.83" stroke="#000" stroke-width="2"/><line y1="17.5" x2="18" y2="17.5" stroke="#000" stroke-width="2"/></svg>',
  };

  const viewToolbar = () => {
    const toolbar = el("header", "view-toolbar");
    const buttons = el("div", "view-btns");
    [["gallery", galleryUrl, "Gallery view"], ["list", listUrl, "List view"]].forEach(([name, href, label]) => {
      const anchor = el("a", `${name}-btn`);
      anchor.href = href;
      anchor.setAttribute("aria-label", label);
      // "#" (the builder preview) switches the view in place instead of opening the other page.
      if (href === "#") {
        anchor.addEventListener("click", (event) => {
          event.preventDefault();
          if (view === name) return;
          view = name;
          render(currentData);
        });
      }
      anchor.innerHTML = icon[name];
      buttons.append(anchor);
    });
    toolbar.append(buttons);
    return toolbar;
  };

  // ---------- PC list: category sections + hover preview ----------
  const renderDesktopList = (data) => {
    const main = el("main", "works-desktop");
    const left = el("div", "left-container");
    const preview = el("div", "preview");
    const thumbnail = el("div", "thumbnail");
    const thumb = el("img");
    thumb.alt = "preview";
    thumbnail.append(thumb);
    preview.append(viewToolbar(), thumbnail);

    let hideTimeout = null;
    const showThumb = (src) => {
      clearTimeout(hideTimeout);
      if (!src) return;
      thumb.onerror = () => { thumb.classList.remove("show"); thumb.removeAttribute("src"); };
      thumb.classList.remove("show");
      thumb.src = src;
      if (thumb.complete && thumb.naturalWidth > 0) thumb.classList.add("show");
      else thumb.onload = () => thumb.classList.add("show");
    };
    const hideThumb = () => { hideTimeout = setTimeout(() => thumb.classList.remove("show"), 120); };

    data.categories.forEach((category) => {
      const works = data.works.filter((work) => work.category === category.id && work.show?.list);
      if (!works.length) return;
      const section = el("section", "sec");
      const header = el("div", "sec__header");
      header.append(el("p", "title", category.label));
      const list = el("div", "sec__list");
      works.forEach((work) => {
        const item = el("div", "item");
        [work.nameKo, work.nameEn, work.year, work.program, work.location, work.status]
          .forEach((value) => item.append(el("span", "", value || "")));
        const src = resolveAsset(work.thumb);
        item.addEventListener("mouseenter", () => showThumb(src));
        item.addEventListener("mouseleave", hideThumb);
        linkTo(item, work);
        list.append(item);
      });
      section.append(header, list);
      left.append(section);
    });

    main.append(left, preview);
    return main;
  };

  // ---------- PC gallery: 3-column cards ----------
  const renderDesktopGallery = (data) => {
    const main = el("main", "works-desktop");
    const left = el("div", "left");
    const section = el("section", "sec__gallery");
    const grid = el("div", "gallery-grid");
    byGalleryOrder(data.works.filter((work) => work.show?.gallery)).forEach((work) => {
      const item = el("div", "gallery-item");
      const img = el("img");
      img.src = resolveAsset(work.cardThumb || work.thumb);
      img.alt = work.nameEn || work.nameKo || "";
      img.loading = "lazy";
      item.append(img, el("p", "caption", `${work.nameKo || ""}|${work.nameEn || ""}`));
      linkTo(item, work);
      grid.append(item);
    });
    section.append(grid);
    left.append(section);
    const right = el("div", "right");
    right.append(viewToolbar());
    main.append(left, right);
    return main;
  };

  // ---------- Mobile: category filter + full-width cards (both views) ----------
  const renderMobile = (data) => {
    const wrapper = el("div", "works-mobile");
    const header = el("header", "mobile-header");
    header.setAttribute("aria-hidden", "true");

    const filter = el("nav", "category-filter");
    const grid = el("div", "works-grid");
    const items = byGalleryOrder(data.works.filter((work) => work.show?.mobile)).map((work) => {
      const item = el("article", "works-item");
      item.dataset.cat = work.category;
      const thumbBox = el("div", `works-thumb ${work.mobileShape || "square"}`);
      const img = el("img");
      img.src = resolveAsset(work.cardThumb || work.thumb, "MOB");
      img.alt = work.nameEn || work.nameKo || "";
      img.loading = "lazy";
      thumbBox.append(img);
      item.append(thumbBox, el("h6", "works-title", `${work.nameKo || ""}|${work.nameEn || ""}`));
      linkTo(item, work);
      grid.append(item);
      return item;
    });

    const categories = [{ id: "all", label: "All" }, ...data.categories];
    categories.forEach((category, index) => {
      const button = el("button", `filter-btn${index === 0 ? " active" : ""}`, category.label);
      button.type = "button";
      button.dataset.filter = category.id;
      button.addEventListener("click", () => {
        filter.querySelectorAll(".filter-btn").forEach((other) => other.classList.toggle("active", other === button));
        items.forEach((item) => { item.hidden = !(category.id === "all" || item.dataset.cat === category.id); });
      });
      filter.append(button);
    });

    const page = el("main", "mobile-page");
    page.append(grid);
    wrapper.append(header, filter, page);
    return wrapper;
  };

  // Mirrors the common menu's open state onto <body> so the left column can slide.
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

  let currentData = null;
  const render = (data) => {
    if (!data || !Array.isArray(data.works) || !Array.isArray(data.categories)) {
      throw new Error("Works JSON is missing works or categories.");
    }
    currentData = data;
    mount.classList.add("filt-works");
    mount.dataset.view = view;
    mount.replaceChildren(
      view === "gallery" ? renderDesktopGallery(data) : renderDesktopList(data),
      renderMobile(data),
    );
    syncCommonMenuState();
    loadScript(new URL("common-menu-v2.js", templateBase).href);
    loadScript(new URL("home-button.js", templateBase).href);
  };

  Promise.all([
    stylesReady,
    // data-works-src lets the builder preview unsaved data; production uses works.json.
    fetch(script.dataset.worksSrc || new URL("works.json", templateBase)).then((response) => {
      if (!response.ok) throw new Error(`Works data request failed (${response.status}).`);
      return response.json();
    }),
  ])
    .then(([, data]) => render(data))
    .catch((error) => {
      console.error("Works template could not render.", error);
      const message = document.createElement("p");
      message.textContent = `작업 목록을 불러오지 못했습니다: ${error.message}`;
      mount.replaceChildren(message);
    });
})();

/* FILT mobile WORKS list intro. Append once after the original works.js. */
;(() => {
  const mount = document.querySelector("[data-filt-works]");
  const script = document.currentScript;
  if (!mount || !script || script.dataset.view === "gallery" || mount.dataset.introBound) return;
  mount.dataset.introBound = "true";
  const mobile = matchMedia("(max-width: 768px), (orientation: landscape) and (hover: none) and (pointer: coarse)");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const url = new URL(location.href);
  const entry = url.searchParams.get("filt_intro");
  const navigation = performance.getEntriesByType("navigation")[0];
  const skip = entry === "skip" || ["reload", "back_forward"].includes(navigation?.type)
    || (!navigation && [1, 2].includes(performance.navigation?.type));
  if (entry === "play" || entry === "skip") {
    url.searchParams.delete("filt_intro");
    history.replaceState(history.state, "", url);
  }

    const start = [
      [237,0,237,1613.63], [419.5,1568.63,614.5,1568.63],
      [-180,1706.13,347,1706.13], [214.5,1768.63,484.5,1768.63],
      [457,1898.63,594.5,1898.63], [814.5,1756.13,1300,1756.13],
      [564.5,2038.63,843,2038.63], [457,1831.13,457,2208.63],
      [1039.5,1756.13,1039.5,1953.63], [843,2038.63,1600,2038.63],
      [334.5,1553.63,334.5,1706.13], [739.51,2556,739.51,2173.62]
    ];
    const gathered = [
      [494.5,1163,494.5,1393], [482,1175.5,564.5,1175.5],
      [452,1265.5,477,1265.5], [512,1265.5,552,1265.5],
      [552,1265.5,592,1265.5], [627,1265.5,667,1265.5],
      [677,1163,677,1248], [609.5,1163,609.5,1393],
      [677,1283,677,1393], [667,1265.5,727,1265.5],
      [552,1283,552,1393], [659.5,1380.5,597,1380.5]
    ];

  const clamp = value => Math.min(1, Math.max(0, value));
  const ease = t => t < .5 ? 4*t*t*t : 1 - (-2*t+2)**3/2;
  const mix = (a,b,t) => a+(b-a)*t;
  const ns = "http://www.w3.org/2000/svg";
  const buttonId = "filt-home-button-mobile";
  let overlay, frame, watchdog, hiddenButton, visibility, accelerate;
  function finish() {
    cancelAnimationFrame(frame);
    clearTimeout(watchdog);
    if (hiddenButton) hiddenButton.style.visibility = visibility;
    overlay?.remove();
    overlay = hiddenButton = accelerate = null;
  }

  function play() {
    if (overlay || !mobile.matches || reduced.matches || mount.dataset.view === "gallery") return;
    overlay = document.createElement("div");
    overlay.style.cssText = "position:fixed;inset:0;z-index:2147483646;background:white;overflow:hidden;touch-action:none;overscroll-behavior:contain";
    overlay.addEventListener("wheel", e => e.preventDefault(), {passive:false});
    const svg = document.createElementNS(ns,"svg");
    svg.style.cssText = "display:block;width:100%;height:100%;fill:none;stroke:#000;stroke-linecap:butt";
    overlay.append(svg);
    document.body.append(overlay);
    const lines = start.map(() => svg.appendChild(document.createElementNS(ns,"line")));
    let started, docking, from, fromStroke, current, stroke;
    function requestDock(now) {
      if (docking !== undefined || !current || !hiddenButton) return;
      docking = now;
      from = current;
      fromStroke = stroke;
    }
    accelerate = () => requestDock(performance.now());
    overlay.addEventListener("click", accelerate);
    function tick(now) {
      const list = mount.querySelector(".works-mobile");
      if (!mobile.matches || reduced.matches || (list && !list.getClientRects().length)
          || (!list && mount.querySelector("p") && !mount.querySelector(".works-desktop"))) return finish();
      const button = document.getElementById(buttonId);
      const box = button?.getBoundingClientRect();
      if (button && box.width && !hiddenButton) {
        hiddenButton = button;
        visibility = button.style.visibility;
        button.style.visibility = "hidden";
      }
      started ??= now;
      const elapsed = now-started;
      const {width:w,height:h,left,top} = overlay.getBoundingClientRect();
      svg.setAttribute("viewBox", "0 0 "+w+" "+h);
      const scale = h/2600*1.1;
      if (docking === undefined) {
        const t = ease(clamp((elapsed-180)/1200));
        current = start.map((row,i) => row.map((v,j) =>
          (mix(v,gathered[i][j],t)-(j%2 ? 1300 : 600))*scale+(j%2 ? h : w)/2));
        stroke = 25*scale;
        svg.style.opacity = clamp(elapsed/200);
        const photo = list?.querySelector(".works-thumb img");
        if (elapsed >= 1400 && list && (!photo || photo.complete || elapsed >= 5000)) requestDock(now);
        if (elapsed >= 5000 && !hiddenButton) return finish();
      }
      if (docking !== undefined) {
        if (!box?.width || !box.height) return finish();
        const t = ease(clamp((now-docking)/1000));
        // The button's actual background is a centered, contained 91.67 x 76.67 SVG.
        const k = Math.min(box.width/91.67,box.height/76.67);
        const x = box.left-left+(box.width-91.67*k)/2;
        const y = box.top-top+(box.height-76.67*k)/2;
        current = from.map((row,i) => row.map((v,j) => {
          const dest = j%2 ? y+(gathered[i][j]-1163)*k/3 : x+(gathered[i][j]-452)*k/3;
          return mix(v,dest,t);
        }));
        stroke = mix(fromStroke,8.33*k,t);
        svg.style.opacity = 1;
        overlay.style.backgroundColor = "rgba(255,255,255,"+(1-t)+")";
        if (t === 1) return finish();
      }
      svg.setAttribute("stroke-width",stroke);
      lines.forEach((line,i) => ["x1","y1","x2","y2"].forEach((key,j) =>
        line.setAttribute(key,current[i][j])));
      frame = requestAnimationFrame(tick);
    }
    watchdog = setTimeout(finish,10000);
    frame = requestAnimationFrame(tick);
  }

  document.addEventListener("click", event => {
    if (!mobile.matches || mount.dataset.view === "gallery" || event.button !== 0 ||
        event.ctrlKey || event.metaKey || event.shiftKey || event.altKey ||
        !event.target.closest?.("#"+buttonId)) return;
    event.preventDefault();
    window.scrollTo({top:0,behavior:"instant"});
    play();
  });
  window.addEventListener("keydown", event => {
    if (overlay && ["Escape","Enter"].includes(event.key)) accelerate?.();
  });
  window.addEventListener("pagehide", finish);
  if (!skip) play();
})();
