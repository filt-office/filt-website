(() => {
  const script = document.currentScript;
  if (!script) throw new Error("Project template script element is unavailable.");

  // A project page names its project in the snippet (data-project-id); the shared page
  // (e.g. /project?id=tempin) leaves it out and reads ?id= from the address instead.
  const requestedId = script.dataset.projectId || new URLSearchParams(location.search).get("id") || "";
  const projectId = /^[a-z0-9-]+$/.test(requestedId) ? requestedId : "";
  let mount = (projectId && document.querySelector(`[data-filt-project="${CSS.escape(projectId)}"]`))
    || document.querySelector('[data-filt-project=""]');
  if (!mount) {
    mount = document.createElement("div");
    mount.dataset.filtProject = projectId;
    script.after(mount);
  }
  // Keep viewport-level positioning outside Imweb's width-constrained section wrappers.
  if (mount.parentElement !== document.body) document.body.append(mount);

  const TAP_SLIDE_MS = 220;
  const templateBase = new URL(".", script.src);
  // Uploaded assets are stored as relative paths (assets/<id>/PC/x.jpg) and served from the images repo.
  const imagesBase = "https://filt-office.github.io/filt-website-images/";
  const resolveAsset = (src) => (src ? new URL(src, /^assets\//.test(src) ? imagesBase : templateBase).href : "");
  const addLink = (key, href) => {
    const existing = document.querySelector(`link[data-filt-template="${key}"]`);
    if (existing) return existing.sheet ? Promise.resolve() : new Promise((resolve, reject) => {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
    });
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
  const templateStylesReady = addLink("layout", new URL(`project-template.css${new URL(script.src).search}`, templateBase).href);
  addLink("suit-font", "https://cdn.jsdelivr.net/npm/suit-font@1.0.0/dist/suit.min.css")
    .catch((error) => console.warn("SUIT font stylesheet could not be loaded.", error));
  addLink("pretendard-font", "https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable.css")
    .catch((error) => console.warn("Pretendard font stylesheet could not be loaded.", error));

  const loadScript = (src) => {
    if (document.querySelector(`script[src="${src}"]`)) return;
    const externalScript = document.createElement("script");
    externalScript.src = src;
    externalScript.async = false;
    document.body.append(externalScript);
  };

  // Site colours (--filt-key, --filt-<id>) from pages/design.json.
  loadScript(new URL("design.js", templateBase).href);

  // Text with the editor's Enter breaks kept as <br>.
  const createLines = (tagName, value, className) => {
    const node = document.createElement(tagName);
    if (className) node.className = className;
    String(value ?? "").split("\n").forEach((line, index) => {
      if (index) node.append(document.createElement("br"));
      node.append(document.createTextNode(line));
    });
    return node;
  };

  const createOverview = (overview) => {
    const wrapper = document.createElement("div");
    wrapper.className = "fixed-table";
    const table = document.createElement("table");
    const colgroup = document.createElement("colgroup");
    for (let index = 0; index < 4; index += 1) {
      const col = document.createElement("col");
      col.style.width = "25%";
      colgroup.append(col);
    }
    table.append(colgroup);

    const fields = Array.isArray(overview.fields) ? overview.fields : [];
    const titleRow = document.createElement("tr");
    const titleCell = document.createElement("td");
    titleCell.rowSpan = 2;
    titleCell.colSpan = 2;
    titleCell.className = "project-title-cell";
    titleCell.append(createLines("div", overview.titleEn, "project-title-en"), createLines("div", overview.subtitle, "project-subtitle"));
    titleRow.append(titleCell);

    // One cell per field across two columns: the label sits top left and the value bottom right, each free
    // to use the whole cell width, so editors balance long labels and values with their own line breaks.
    const appendField = (row, field) => {
      if (!field) return;
      const cell = document.createElement("td");
      cell.colSpan = 2;
      cell.className = "field";
      const box = document.createElement("div");
      box.className = "field-box";
      const value = createLines("div", field.value, "field-value");
      if (field.areaM2 !== undefined && Number.isFinite(Number(field.areaM2))) {
        const area = Number(field.areaM2);
        value.dataset.areaM2 = String(area);
        // The builder lets editors pick which unit shows first; a click still swaps ㎡ ↔ 평.
        value.dataset.areaUnit = field.areaUnit === "py" ? "py" : "m2";
        if (field.areaUnit === "py") value.textContent = `${Math.round(area / 3.305785)}py`;
        value.addEventListener("click", toggleAreaUnits);
      }
      box.append(createLines("div", field.label, "field-label"), value);
      cell.append(box);
      row.append(cell);
    };

    appendField(titleRow, fields[0]);
    table.append(titleRow);
    const secondTitleRow = document.createElement("tr");
    appendField(secondTitleRow, fields[1]);
    table.append(secondTitleRow);

    for (let index = 2; index < fields.length; index += 2) {
      const row = document.createElement("tr");
      appendField(row, fields[index]);
      appendField(row, fields[index + 1]);
      table.append(row);
    }

    wrapper.append(table);
    return wrapper;
  };

  function toggleAreaUnits() {
    const cells = Array.from(mount.querySelectorAll("[data-area-m2]"));
    const showSquareMeters = cells.some((cell) => cell.dataset.areaUnit === "py");
    cells.forEach((cell) => {
      const area = Number(cell.dataset.areaM2);
      cell.textContent = showSquareMeters
        ? `${area.toFixed(2)}㎡`
        : `${Math.round(area / 3.305785)}py`;
      cell.dataset.areaUnit = showSquareMeters ? "m2" : "py";
    });
  }

  const createImageSection = (images) => {
    const section = document.createElement("div");
    section.className = "img-section";
    section.setAttribute("aria-label", "Project images");
    (Array.isArray(images) ? images : []).forEach((image) => {
      const img = document.createElement("img");
      img.src = resolveAsset(image.src);
      img.alt = image.alt || "";
      img.className = ["portrait", "landscape", "drawing"].includes(image.class) ? image.class : "landscape";
      img.dataset.fit = ["auto", "contain", "cover", "pad-s", "pad-l"].includes(image.fit) ? image.fit : "auto";
      img.dataset.rotation = [0, 90, 180, 270].includes(Number(image.rotation)) ? String(Number(image.rotation)) : "0";
      img.loading = "lazy";
      img.addEventListener("load", () => updateRotatedImageSize(section, img));
      section.append(img, document.createElement("hr"));
    });
    return section;
  };

  // Generated overlays are drawn in screen pixels at 60% of the info strip's height. The scale bar's
  // length still follows the drawing: drawings are exported from Illustrator artboards in pt, so at
  // 1:N one metre is 72 / 0.0254 / N viewBox units (1:50 → 56.7), times the drawing's display scale.
  const UNITS_PER_METER = 72 / 0.0254;
  const svgElement = (viewBox, width, height, body) => {
    const template = document.createElement("template");
    template.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}" aria-hidden="true" fill="none" stroke="#000" stroke-width=".6">${body}</svg>`;
    return template.content.firstElementChild;
  };
  const formatNumber = (value) => String(Number(value.toFixed(2)));

  // N and the scale bar's numbers share one size: half the drawing title (10px bold → 5px, weight 500).
  const LABEL_SIZE = 5;
  const LABEL_WEIGHT = 500;

  // Drawn in a 32-unit box: circle, a square-ended needle to the rim, and N beyond it, turned together.
  const northArrow = (size, degrees) => {
    const font = (LABEL_SIZE * 32) / size;
    const radius = 15.5 - font;
    return svgElement("-16 -16 32 32", size, size,
      `<g transform="rotate(${degrees})"><circle r="${radius}"/><rect x="-.6" y="${-radius}" width="1.2" height="${radius}" fill="#000" stroke="none"/>`
      + `<text y="${-radius - 1}" fill="#000" stroke="none" font-size="${font}" font-weight="${LABEL_WEIGHT}" text-anchor="middle">N</text></g>`);
  };

  // Same shape as the hand-made bars: an outline stepping between 0, 1/5, 2/5 and the full length,
  // which is the longest round length that stays within 15% of the drawing's width (viewBox units,
  // or pixels for JPG/PNG), so large raster drawings get a bar as long as SVG ones.
  // The bar is 0.8 of the overlay height above its numbers; the SVG shrinks with it.
  const scaleBar = (scale, pixelsPerUnit, overlayHeight, drawingWidth) => {
    const unitsPerMeter = UNITS_PER_METER / scale;
    const length = [200, 100, 50, 20, 10, 5, 2, 1].find((meters) => meters * unitsPerMeter <= drawingWidth * 0.15) || 1;
    const pixelsPerMeter = unitsPerMeter * pixelsPerUnit;
    const fontSize = LABEL_SIZE;
    const start = fontSize * 0.4;
    const ticks = [0, length / 5, (length * 2) / 5, length];
    const [a, b, c, d] = ticks.map((meters) => start + meters * pixelsPerMeter);
    const top = 0.5;
    const bottom = top + (overlayHeight - fontSize - 2.5) * 0.8;
    const height = bottom + fontSize + 2;
    const width = d + fontSize * 1.3;
    const labels = ticks.map((meters, index) => `<text x="${start + meters * pixelsPerMeter}" y="${height - 0.5}" fill="#000" stroke="none" font-size="${fontSize}" font-weight="${LABEL_WEIGHT}" text-anchor="middle">${formatNumber(meters)}${index === 3 ? "m" : ""}</text>`);
    return svgElement(`0 0 ${width} ${height}`, width, height,
      `<polyline points="${d} ${bottom} ${d} ${top} ${c} ${top} ${c} ${bottom} ${b} ${bottom} ${b} ${top} ${a} ${top} ${a} ${bottom}"/>${labels.join("")}`);
  };

  // An <img>'s natural size for a viewBox-only SVG is not the viewBox, so read it from the file.
  const drawingSizes = new Map();
  const drawingSize = (image) => {
    const src = image.currentSrc || image.src;
    if (!drawingSizes.has(src)) {
      const isSvg = /\.svg([?#]|$)/i.test(src) || /^(blob:|data:image\/svg)/.test(src);
      drawingSizes.set(src, (isSvg ? fetch(src).then((response) => (response.ok ? response.text() : "")) : Promise.resolve(""))
        .then((text) => {
          const box = text.match(/<svg\b[^>]*?\sviewBox\s*=\s*["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
          return box ? { width: Number(box[1]), height: Number(box[2]) } : null;
        })
        .catch(() => null));
    }
    return drawingSizes.get(src).then((size) => size || { width: image.naturalWidth, height: image.naturalHeight });
  };

  const createMobileDrawingSection = (drawingData) => {
    const drawings = Array.isArray(drawingData?.images)
      ? drawingData.images.filter((drawing) => drawing?.src)
      : [];
    if (!drawings.length) return null;

    const section = document.createElement("section");
    section.className = "mobile-drawing-section";
    section.setAttribute("aria-label", "Project drawings");

    const slider = document.createElement("div");
    slider.className = "mobile-drawing-slider";
    const slides = document.createElement("div");
    slides.className = "mobile-drawing-slides";
    drawings.forEach((drawing) => {
      const image = document.createElement("img");
      image.src = resolveAsset(drawing.src);
      image.alt = drawing.alt || drawing.title || "";
      image.dataset.title = drawing.title || "";
      image.dataset.coordinate = drawing.coordinate === false ? "off" : "on";
      if (drawing.hideScale) image.dataset.scaleOff = "true";
      const scale = Number(drawing.scale ?? drawingData.scale);
      if (scale > 0) image.dataset.scale = String(scale);
      // Each drawing has its own angle; older data had one project-wide angle.
      const north = drawing.north ?? drawingData.north;
      if (north !== "" && north != null && Number.isFinite(Number(north))) image.dataset.north = String(Number(north));
      image.loading = "lazy";
      image.draggable = false;
      slides.append(image);
    });
    slider.append(slides);

    const addNavigationButton = (direction, label, handler) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `mobile-drawing-click-zone ${direction}`;
      button.setAttribute("aria-label", label);
      button.addEventListener("click", handler);
      slider.append(button);
    };

    const coordinateInfo = document.createElement("div");
    coordinateInfo.className = "mobile-drawing-info-coordinate";
    const coordinateImage = drawingData.coordinateSrc
      ? document.createElement("img")
      : null;
    if (coordinateImage) {
      coordinateImage.src = resolveAsset(drawingData.coordinateSrc);
      coordinateImage.alt = "";
      coordinateImage.setAttribute("aria-hidden", "true");
      coordinateInfo.append(coordinateImage);
    }

    const scaleInfo = document.createElement("div");
    scaleInfo.className = "mobile-drawing-info-scale";
    const scaleImage = drawingData.scaleSrc
      ? document.createElement("img")
      : null;
    if (scaleImage) {
      scaleImage.src = resolveAsset(drawingData.scaleSrc);
      scaleImage.alt = "";
      scaleImage.setAttribute("aria-hidden", "true");
      scaleInfo.append(scaleImage);
    }

    const titleInfo = document.createElement("div");
    titleInfo.className = "mobile-drawing-info-title";
    const title = document.createElement("span");
    titleInfo.append(title);

    const info = document.createElement("div");
    info.className = "mobile-drawing-info";
    info.append(coordinateInfo, scaleInfo, titleInfo);
    section.append(slider, info);

    const originalSlides = Array.from(slides.children);
    if (originalSlides.length > 1) {
      const firstClone = originalSlides[0].cloneNode(true);
      const lastClone = originalSlides[originalSlides.length - 1].cloneNode(true);
      firstClone.dataset.clone = "true";
      lastClone.dataset.clone = "true";
      slides.append(firstClone);
      slides.prepend(lastClone);
    }

    let currentSlide = originalSlides.length > 1 ? 1 : 0;
    let transitioning = false;
    let touchStartX = null;
    const originalSlideCount = originalSlides.length;

    // A drawing with its own angle / scale gets generated overlays; otherwise the uploaded
    // coordinateSrc / scaleSrc images are used as before.
    let overlayToken = 0;
    const updateDrawingOverlays = async () => {
      const token = ++overlayToken;
      const index = currentSlide - (originalSlideCount > 1 ? 1 : 0);
      const normalizedIndex = (index + originalSlideCount) % originalSlideCount;
      const currentImage = originalSlides[normalizedIndex];
      title.textContent = currentImage.dataset.title;
      const showCoordinate = currentImage.dataset.coordinate !== "off";
      if (coordinateImage) coordinateImage.style.display = showCoordinate ? "block" : "none";

      const sliderRect = slider.getBoundingClientRect();
      const naturalWidth = currentImage.naturalWidth;
      const naturalHeight = currentImage.naturalHeight;
      if (!naturalWidth || !naturalHeight || !sliderRect.width || !sliderRect.height) return;
      const scale = Math.min(sliderRect.width / naturalWidth, sliderRect.height / naturalHeight);

      // Legacy overlay images are drawing-sized canvases with the mark in a corner, so they get the
      // drawing's on-screen size; generated ones are compact and sit inside their cell.
      const scaleOff = currentImage.dataset.scaleOff === "true";
      const drawingScale = scaleOff ? 0 : Number(currentImage.dataset.scale);
      const north = currentImage.dataset.north === undefined ? NaN : Number(currentImage.dataset.north);
      const generatedNorth = Number.isFinite(north);
      const generatedScale = drawingScale > 0;
      const overlayHeight = Math.round(info.clientHeight * 0.6);
      // The columns stay fixed (10% / 50% / 40%), so the arrow also shrinks to fit a narrow cell.
      const northSize = Math.min(overlayHeight, Math.floor(coordinateInfo.clientWidth) - 10); // minus the cell's 5px padding
      let coordinateOverlay = generatedNorth ? northArrow(northSize, north) : coordinateImage;
      let scaleOverlay = scaleOff ? null : scaleImage;
      if (generatedScale) {
        const size = await drawingSize(currentImage);
        if (token !== overlayToken) return;
        scaleOverlay = scaleBar(drawingScale, (naturalWidth * scale) / size.width, overlayHeight, size.width);
      }
      coordinateInfo.replaceChildren(...(coordinateOverlay && showCoordinate ? [coordinateOverlay] : []));
      scaleInfo.replaceChildren(...(scaleOverlay ? [scaleOverlay] : []));
      coordinateInfo.classList.toggle("is-generated", generatedNorth);
      scaleInfo.classList.toggle("is-generated", generatedScale);
      [coordinateImage, scaleImage].filter((overlay) => overlay && overlay.isConnected).forEach((overlay) => {
        overlay.style.display = "block";
        overlay.style.width = `${naturalWidth * scale}px`;
        overlay.style.height = `${naturalHeight * scale}px`;
      });
    };

    originalSlides.forEach((image) => image.addEventListener("load", updateDrawingOverlays));

    const updateSlide = (animate = true, duration = TAP_SLIDE_MS) => {
      slides.style.transition = animate ? `transform ${duration}ms ease-out` : "none";
      slides.style.transform = `translateX(-${currentSlide * 100}%)`;
      updateDrawingOverlays();
    };
    const moveSlide = (direction, duration = TAP_SLIDE_MS) => {
      if (transitioning || originalSlideCount < 2) return;
      transitioning = true;
      currentSlide += direction;
      updateSlide(true, duration);
    };

    addNavigationButton("left", "Previous drawing", () => moveSlide(-1));
    addNavigationButton("right", "Next drawing", () => moveSlide(1));
    slides.addEventListener("transitionend", () => {
      transitioning = false;
      if (currentSlide === originalSlideCount + 1) {
        currentSlide = 1;
        updateSlide(false);
      } else if (currentSlide === 0) {
        currentSlide = originalSlideCount;
        updateSlide(false);
      }
    });
    slider.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      touchStartX = event.clientX;
    });
    slider.addEventListener("pointerup", (event) => {
      if (touchStartX === null) return;
      const deltaX = touchStartX - event.clientX;
      touchStartX = null;
      if (Math.abs(deltaX) > 50) {
        event.preventDefault();
        moveSlide(deltaX > 0 ? 1 : -1, 400);
      }
    });
    slider.addEventListener("pointercancel", () => { touchStartX = null; });
    window.addEventListener("resize", updateDrawingOverlays);
    updateSlide(false);
    return section;
  };

  const updateRotatedImageSize = (section, image) => {
    if (![90, 270].includes(Number(image.dataset.rotation))) return;
    image.style.setProperty("--rotate-width", `${section.clientHeight}px`);
    image.style.setProperty("--rotate-height", `${section.clientWidth}px`);
  };

  const initializeGallery = (section) => {
    const updateImageMode = () => {
      section.classList.toggle("portrait-mode", section.clientWidth / Math.max(section.clientHeight, 1) <= 1);
      section.querySelectorAll("img").forEach((image) => updateRotatedImageSize(section, image));
    };
    updateImageMode();
    if (window.ResizeObserver) new ResizeObserver(updateImageMode).observe(section);
    window.addEventListener("resize", updateImageMode);

    const originalImages = Array.from(section.querySelectorAll("img"));
    if (originalImages.length < 2) return;
    const firstClone = originalImages[0].cloneNode(true);
    const lastClone = originalImages[originalImages.length - 1].cloneNode(true);
    firstClone.dataset.clone = "1";
    lastClone.dataset.clone = "1";
    section.prepend(document.createElement("hr"), lastClone);
    section.append(document.createElement("hr"), firstClone);

    const images = Array.from(section.querySelectorAll("img"));
    let currentIndex = 1;
    let isJumping = false;
    let endTimer;
    const isMobileLayout = () => window.matchMedia("(max-width: 1024px), (any-pointer: coarse)").matches;
    let tapFrame = 0;
    let previousSnap;
    const stopTap = () => {
      if (!tapFrame) return;
      cancelAnimationFrame(tapFrame);
      tapFrame = 0;
      section.style.scrollSnapType = previousSnap;
    };
    const scrollToIndex = (index, animate = true) => {
      stopTap();
      const image = images[index];
      if (!image) return;
      const mobile = isMobileLayout();
      const axis = mobile ? "left" : "top";
      const target = mobile ? image.offsetLeft : image.offsetTop;
      const write = position => section.scrollTo({ [axis]: position, behavior: "instant" });
      if (!animate || matchMedia("(prefers-reduced-motion: reduce)").matches) {
        write(target);
        return;
      }
      clearTimeout(endTimer);
      const start = mobile ? section.scrollLeft : section.scrollTop;
      const startTime = performance.now();
      previousSnap = section.style.scrollSnapType;
      section.style.scrollSnapType = "none";
      const step = now => {
        const t = Math.min(1, Math.max(0, (now - startTime) / TAP_SLIDE_MS));
        write(start + (target - start) * (1 - (1 - t) ** 3));
        if (t < 1) tapFrame = requestAnimationFrame(step);
        else {
          stopTap();
          if (index === 0 || index === images.length - 1) {
            currentIndex = index === 0 ? images.length - 2 : 1;
            scrollToIndex(currentIndex, false);
          }
        }
      };
      tapFrame = requestAnimationFrame(step);
    };
    section.addEventListener("wheel", stopTap, { passive: true });
    section.addEventListener("pointercancel", stopTap);
    requestAnimationFrame(() => scrollToIndex(currentIndex, false));
    section.addEventListener("scroll", () => {
      clearTimeout(endTimer);
      endTimer = setTimeout(() => {
        if (isJumping || tapFrame) return;
        let nearestIndex = 0;
        let nearestDistance = Infinity;
        images.forEach((image, index) => {
          const offset = isMobileLayout() ? image.offsetLeft : image.offsetTop;
          const scrollPosition = isMobileLayout() ? section.scrollLeft : section.scrollTop;
          const distance = Math.abs(offset - scrollPosition);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = index;
          }
        });
        currentIndex = nearestIndex;
        if (currentIndex === 0 || currentIndex === images.length - 1) {
          isJumping = true;
          currentIndex = currentIndex === 0 ? images.length - 2 : 1;
          scrollToIndex(currentIndex, false);
          requestAnimationFrame(() => { isJumping = false; });
        }
      }, 90);
    }, { passive: true });
    section.addEventListener("click", (event) => {
      if (isJumping || tapFrame) return;
      const previousImage = isMobileLayout()
        ? (event.clientX - section.getBoundingClientRect().left) / section.clientWidth <= 0.4
        : (event.clientY - section.getBoundingClientRect().top) / section.clientHeight <= 0.4;
      if (currentIndex === 0) currentIndex = images.length - 2;
      if (currentIndex === images.length - 1) currentIndex = 1;
      currentIndex += previousImage ? -1 : 1;
      scrollToIndex(currentIndex, true);
    });
    section.addEventListener("contextmenu", (event) => event.preventDefault());
    let previousWidth = section.clientWidth;
    let wasMobile = isMobileLayout();
    window.addEventListener("resize", () => {
      const mobile = isMobileLayout();
      const width = section.clientWidth;
      if (mobile && wasMobile && width === previousWidth) return;
      previousWidth = width;
      wasMobile = mobile;
      requestAnimationFrame(() => scrollToIndex(currentIndex, false));
    });
  };

  const createToolbar = () => {
    const toolbar = document.createElement("header");
    toolbar.className = "view-toolbar";
    toolbar.innerHTML = '<div class="view-btns"><a class="integrated-view-btn" href="/works_list" aria-label="Back to works list"><svg class="icon-back" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><polyline points="15 18 9 12 15 6"></polyline></svg><svg class="icon-list" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><line y1="0.5" x2="18" y2="0.5" stroke="#000" stroke-width="2"/><line y1="6.17" x2="18" y2="6.17" stroke="#000" stroke-width="4"/><line y1="11.83" x2="18" y2="11.83" stroke="#000" stroke-width="2"/><line y1="17.5" x2="18" y2="17.5" stroke="#000" stroke-width="2"/></svg></a></div>';
    return toolbar;
  };

  const createSideSection = (project, includeToolbar) => {
    const sideSection = document.createElement("section");
    sideSection.className = "side-section";
    const text = document.createElement("div");
    text.className = "text-content";
    // Parse inertly so relative image paths never load against the host page's URL.
    const description = document.createElement("template");
    description.innerHTML = project.descriptionHtml || "";
    // Preserve authored line breaks without rendering the HTML indentation around figures and paragraphs.
    const walker = document.createTreeWalker(description.content, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    const boundary = "br, p, div, figure, figcaption, img, ul, ol, li, blockquote, h1, h2, h3, h4, h5, h6";
    for (const node of textNodes) {
      if (!node.data.includes("\n") || node.parentElement?.closest("figure, pre, code, style, script")) continue;
      const before = node.previousSibling;
      const after = node.nextSibling;
      const startsAtBlock = before ? before.matches?.(boundary) : !node.parentElement || node.parentElement.matches(boundary);
      const endsAtBlock = after ? after.matches?.(boundary) : !node.parentElement || node.parentElement.matches(boundary);
      let value = node.data;
      if (startsAtBlock) value = value.replace(/^[ \t]*\n[ \t]*/, "");
      if (endsAtBlock) value = value.replace(/[ \t]*\n[ \t]*$/, "");
      const parts = value.split("\n");
      const content = document.createDocumentFragment();
      parts.forEach((part, index) => {
        if (index) content.append(document.createElement("br"));
        content.append(document.createTextNode(part));
      });
      node.replaceWith(content);
    }
    description.content.querySelectorAll("img[src]").forEach((image) => {
      image.setAttribute("src", resolveAsset(image.getAttribute("src")));
    });
    text.append(description.content);
    const overview = createOverview(project.overview);
    if (includeToolbar) sideSection.append(createToolbar());
    sideSection.append(overview, text);
    return { sideSection, overview };
  };

  const renderDesktop = (project, images) => {
    const main = document.createElement("main");
    main.className = "page-container desktop-project-layout";
    const imageSection = createImageSection(images);
    const { sideSection, overview } = createSideSection(project, true);
    main.append(imageSection, sideSection);
    return { main, imageSection, sideSection, overview };
  };

  const renderMobile = (project, images) => {
    const main = document.createElement("main");
    main.className = "page-container mobile-project-layout";
    const imageSection = createImageSection(images);
    const { sideSection, overview } = createSideSection(project, false);
    main.append(imageSection, sideSection);
    const drawings = createMobileDrawingSection(project.mobile?.drawings);
    if (drawings) main.append(drawings);
    return { main, imageSection, sideSection, overview };
  };

  // Lets the mobile layout span the full viewport whatever padding the host page puts around the mount.
  const updateBleed = () => {
    // Remove the margin currently applied (only set inside the mobile media query) to get the host offset.
    const appliedMargin = parseFloat(getComputedStyle(mount).marginLeft) || 0;
    const naturalLeft = mount.getBoundingClientRect().left - appliedMargin;
    mount.style.setProperty("--bleed-left", `${Math.max(0, naturalLeft)}px`);
    mount.style.setProperty("--bleed-width", `${document.documentElement.clientWidth}px`);
  };

  const render = (project) => {
    if (!project || !Array.isArray(project.images) || !project.overview) {
      throw new Error("Project JSON is missing images or overview data.");
    }
    // The tab title is one line even when the page title has line breaks.
    document.title = (project.title || `${project.overview.titleEn || project.id} | PROJECT INFO`).replace(/\s*\n\s*/g, " ");
    mount.classList.add("filt-project-mount");
    mount.replaceChildren();

    const desktopImages = Array.isArray(project.desktop?.images)
      ? project.desktop.images
      : project.images;
    const mobileImages = Array.isArray(project.mobile?.images)
      ? project.mobile.images
      : project.images.filter((image) => image.class !== "drawing");
    const desktop = renderDesktop(project, desktopImages);
    const mobile = renderMobile(project, mobileImages);
    mount.append(desktop.main, mobile.main);
    updateBleed();
    window.addEventListener("resize", updateBleed);

    [desktop, mobile].forEach(({ sideSection, overview }) => {
      const updateOverviewHeight = () => {
        sideSection.style.setProperty("--overview-height", `${overview.offsetHeight}px`);
      };
      updateOverviewHeight();
      if (window.ResizeObserver) new ResizeObserver(updateOverviewHeight).observe(overview);
    });
    initializeGallery(desktop.imageSection);
    initializeGallery(mobile.imageSection);

    loadScript(new URL("common-menu-v2.js", templateBase).href);
    loadScript(new URL("home-button.js", templateBase).href);
  };

  const notFound = new Error("not found");

  Promise.all([
    templateStylesReady,
    // data-project-src lets the builder preview unsaved data; production uses projects/<id>.json.
    script.dataset.projectSrc || projectId
      ? fetch(script.dataset.projectSrc || new URL(`projects/${encodeURIComponent(projectId)}.json`, templateBase)).then((response) => {
        if (response.status === 404) throw notFound;
        if (!response.ok) throw new Error(`Project data request failed (${response.status}).`);
        return response.json();
      })
      : Promise.reject(notFound)
  ])
    .then(([, project]) => render(project))
    .catch((error) => {
      console.error("Project template could not render.", requestedId, error);
      const message = document.createElement("p");
      message.className = "filt-template-error";
      if (error === notFound) {
        message.append("프로젝트를 찾을 수 없습니다. ");
        const back = document.createElement("a");
        back.href = "/works_list";
        back.textContent = "WORKS 목록으로";
        message.append(back);
        document.title = "WORKS | FILT";
      } else {
        message.textContent = `프로젝트를 불러오지 못했습니다: ${error.message}`;
      }
      mount.replaceChildren(message);
      loadScript(new URL("common-menu-v2.js", templateBase).href);
    });
})();
