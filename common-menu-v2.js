(() => {
  const ROOT_ID = 'filt-common-menu-v2';
  if (window.__FILT_COMMON_MENU_V2_LOADED) return;
  window.__FILT_COMMON_MENU_V2_LOADED = true;
  document.getElementById('filt-common-menu')?.remove();
  document.getElementById('filt-common-menu-styles')?.remove();

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function mount() {
    if (!document.body || document.getElementById(ROOT_ID)) return;

    const root = document.createElement('div');
    root.id = ROOT_ID;

    const sidebarMarkup = [
      '  <!-- ✅ 사이드메뉴 -->',
      '<aside class="side-panel" id="panel">',
      '  <div class="logo-btn" id="logoBtn">',
      '    <svg viewBox="0 0 240 410" xmlns="http://www.w3.org/2000/svg">',
      '      <path id="f-2" class="cls-1" d="M28.2,265.02v54.66"/>',
      '      <path id="f-1" class="cls-1" d="M25.78,267.47h19.22"/>',
      '      <path id="f-3" class="cls-1" d="M18,289.07h6"/>',
      '      <path id="f-4" class="cls-1" d="M32.4,289.07h9.6"/>',
      '      <path id="i-1" class="cls-1" d="M42,289.07h9.6"/>',
      '      <path id="t-2" class="cls-1" d="M60,289.07h24"/>',
      '      <path id="l-2" class="cls-1" d="M55.8,289.07v30.6"/>',
      '      <path id="l-1" class="cls-1" d="M55.8,264.47v24.6"/>',
      '      <path id="t-3" class="cls-1" d="M72,293.27v26.4"/>',
      '      <path id="t-1" class="cls-1" d="M72,264.47v20.4"/>',
      '      <path id="i-2" class="cls-1" d="M42,293.27v26.4"/>',
      '      <path id="l-3" class="cls-1" d="M67.81,317.17h-14.46"/>',
      '    </svg>',
      '  </div>',
      '  <div class="office-name" id="officeName"><p>필트아키텍츠<br>건축사사무소</p></div>',
      '  <div class="vert"></div>',
      '  <div class="divider-top"></div>',
      '  <nav class="panel-menu"><ul>',
      '    <li><a href="/office">OFFICE</a></li>',
      '    <li><a href="/news">NEWS</a></li>',
      '    <li><a href="/works_list">WORKS</a></li>',
      '  </ul></nav>',
      '  <footer class="panel-footer">',
      '    <svg width="100%" height="100%" role="img" aria-label="ESSAYS AND DRAWINGS" xmlns="http://www.w3.org/2000/svg">',
      '      <defs><mask id="footer-text-cutout" x="0" y="0" width="100%" height="100%" style="mask-type:luminance;">',
      '        <rect width="100%" height="100%" fill="white"/>',
      '        <text x="20" y="50%" dominant-baseline="central" fill="black" style="font-size:12px;font-weight:200;letter-spacing:.6px;">ESSAYS AND DRAWINGS</text>',
      '      </mask></defs>',
      '      <rect width="100%" height="100%" fill="black" mask="url(#footer-text-cutout)"/>',
      '    </svg>',
      '  </footer>',
      '</aside>'
    ].join('\n');

    const mobileMarkup = [
      '<button type="button" class="header-menu-btn" id="openMenuBtn" aria-label="메뉴 열기" aria-expanded="false">',
      '  <div class="btn-dot"></div>',
      '</button>',
      '<div class="menu-overlay" id="menuOverlay"></div>',
      '<aside class="mobile-menu-panel" id="mobileMenuPanel" aria-label="FILT 사이트 메뉴">',
      '  <nav class="menu-middle" aria-label="주요 메뉴">',
      '    <a href="/works_list?filt_intro=skip">WORKS</a>',
      '    <a href="/office">OFFICE</a>',
      '    <a href="/news">NEWS</a>',
      '  </nav>',
      '  <div class="menu-bottom"><a href="/000">ESSAY &amp; DRAWING</a></div>',
      '</aside>'
    ].join('\n');

    root.innerHTML = sidebarMarkup + '\n' + mobileMarkup;

    const css = [
      '#filt-common-menu-v2, #filt-common-menu-v2 * { box-sizing:border-box; }',
      '#filt-common-menu-v2 { font-family:var(--filt-font-family, "Suit","Pretendard Variable","Pretendard","Noto Sans KR",sans-serif); color:#000; letter-spacing:.4px; }',
      '#filt-common-menu-v2 .side-panel, #filt-common-menu-v2 .side-panel * { font-family:var(--filt-font-family, "Suit","Pretendard Variable","Pretendard","Noto Sans KR",sans-serif) !important; letter-spacing:.4px; }',
      '#filt-common-menu-v2 .side-panel { position:fixed; top:0; left:calc(var(--filt-menu-hide, 210px) * -1); width:240px; height:100vh; height:100dvh; margin:0; padding:0; border-right:1px solid #000; background:rgba(255,255,255,0); z-index:999991; transition:left var(--filt-motion-panel, .35s) ease; }',
      '#filt-common-menu-v2 .side-panel.open { left:0; }',
      '#filt-common-menu-v2 .vert { position:absolute; top:0; left:230px; z-index:10000; width:10px; height:410px; background:#000; cursor:pointer; }',
      '#filt-common-menu-v2 .divider-top { position:absolute; top:410px; left:0; z-index:20; width:240px; height:.5px; background:#000; }',
      '#filt-common-menu-v2 .logo-btn { position:absolute; top:0; left:0; z-index:11; width:240px; height:410px; cursor:pointer; background:none; }',
      '#filt-common-menu-v2 .logo-btn svg { width:100%; height:100%; fill:none; stroke:var(--filt-logo-color, #000); stroke-width:var(--filt-logo-stroke, 5); transition:transform .3s ease, opacity .3s ease; }',
      '#filt-common-menu-v2 .logo-btn:hover svg { opacity:.7; }',
      '#filt-common-menu-v2 .office-name { position:absolute; top:330px; left:20px; width:180px; color:#000; font-size:12px; font-weight:600; line-height:1; letter-spacing:0; }',
      '#filt-common-menu-v2 .office-name p { margin:0; }',
      '#filt-common-menu-v2 .panel-menu { position:absolute; top:420px; left:20px; z-index:20; }',
      '#filt-common-menu-v2 .panel-menu ul { margin:0; padding:0; list-style:none; }',
      '#filt-common-menu-v2 .panel-menu a { display:block; color:#000; font-size:var(--filt-size-menu, 12px); font-weight:var(--filt-weight-menu, 400); line-height:var(--filt-line-menu, 1.6); text-decoration:none !important; transition:all var(--filt-motion-hover, .2s) ease; }',
      '#filt-common-menu-v2 .panel-menu a:hover { color:var(--filt-key, #BD005E); font-weight:700; transform:translateX(3px); }',
      '#filt-common-menu-v2 .panel-footer { position:absolute; bottom:0; left:0; width:100%; height:35px; padding:0; border-top:1px solid #000; background:transparent; }',
      '#filt-common-menu-v2 .panel-footer svg { display:block; width:100%; height:100%; }',
      '#filt-common-menu-v2 .header-menu-btn, #filt-common-menu-v2 .mobile-menu-panel, #filt-common-menu-v2 .menu-overlay { display:none; }',
      (document.querySelector("[data-filt-works]") ? '@media (max-width: 768px), (orientation: landscape) and (hover: none) and (pointer: coarse) {' : (document.querySelector('[data-filt-project], .filt-project-mount') ? '@media (max-width: 768px), (hover: none) and (pointer: coarse) {' : '@media (max-width:768px) {')),
      '  #filt-common-menu-v2 .side-panel { display:none; }',
      '  #filt-common-menu-v2 .header-menu-btn { position:fixed; top:0; right:0; z-index:999992; display:flex; width:40px; height:40px; margin:0; padding:0; align-items:center; justify-content:center; border:0; background:transparent; cursor:pointer; appearance:none; -webkit-appearance:none; }',
      '  #filt-common-menu-v2 .btn-dot { display:block; width:12px; height:12px; flex:0 0 12px; border-radius:50%; background:#000; }',
      '  #filt-common-menu-v2 .mobile-menu-panel { position:fixed; top:0; right:-100%; z-index:999991; display:flex; width:45%; max-width:82vw; min-width:180px; height:100vh; height:100dvh; flex-direction:column; border-left:.5px solid #000; background:#fff; transition:right var(--filt-motion-panel, .35s) ease; }',
      '  #filt-common-menu-v2 .mobile-menu-panel.open { right:0; }',
      '  #filt-common-menu-v2 .menu-overlay { position:fixed; inset:0; z-index:999990; display:none; background:rgba(0,0,0,.3); }',
      '  #filt-common-menu-v2 .menu-overlay.active { display:block; }',
      '  #filt-common-menu-v2 .menu-middle { flex:1 1 auto; display:flex; flex-direction:column; justify-content:flex-start; align-items:flex-start; margin-top:150px; padding:5px; border-top:.5px solid #000; border-bottom:.5px solid #000; text-align:left; }',
      '  #filt-common-menu-v2 .menu-middle a { display:block; color:#000; font-size:var(--filt-size-menu-mobile, 1.2rem); font-weight:var(--filt-weight-menu, 400); line-height:calc(var(--filt-line-menu, 1.6) * 0.96875); text-decoration:none; transition:color var(--filt-motion-panel, .35s) ease; }',
      '  #filt-common-menu-v2 .menu-middle a:hover { color:var(--filt-key, #BD005E); }',
      '  #filt-common-menu-v2 .menu-bottom { flex:0 0 50px; display:flex; flex-direction:column; justify-content:flex-start; align-items:flex-end; padding:5px; background:#000; text-align:right; }',
      '  #filt-common-menu-v2 .menu-bottom a { color:#fff; font-size:1.2rem; font-weight:400; text-decoration:none; }',
      '}',
      // HOME (window.FILT_MENU_MODE = 'home'): the panel stays open over the photos; no mobile menu.
      '#filt-common-menu-v2.is-home .side-panel { transition:none; cursor:default; }',
      '#filt-common-menu-v2.is-home .vert { pointer-events:none; }', /* as on the original HOME, the bar sits under the logo: a click morphs the logo */
      '#filt-common-menu-v2.is-home .header-menu-btn, #filt-common-menu-v2.is-home .mobile-menu-panel, #filt-common-menu-v2.is-home .menu-overlay { display:none !important; }',
      '@media (prefers-reduced-motion:reduce) { #filt-common-menu-v2 *, #filt-common-menu-v2 *::before, #filt-common-menu-v2 *::after { transition-duration:.01ms !important; } }'
    ].join('\n');

    const style = document.createElement('style');
    style.id = ROOT_ID + '-styles';
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
    document.body.appendChild(root);

    const panel = root.querySelector('#panel');
    const logoBtn = root.querySelector('#logoBtn');
    const logo = logoBtn.querySelector('svg');
    const paths = logo.querySelectorAll('path');
    const vert = root.querySelector('.vert');
    const mobilePanel = root.querySelector('#mobileMenuPanel');
    const mobileButton = root.querySelector('#openMenuBtn');
    const overlay = root.querySelector('#menuOverlay');

    const shapes = {
      panel: [
        'M28.2,265.02v54.66', 'M25.78,267.47h19.22', 'M18,289.07h6',
        'M32.4,289.07h9.6', 'M42,289.07h9.6', 'M60,289.07h24',
        'M55.8,289.07v30.6', 'M55.8,264.47v24.6', 'M72,293.27v26.4',
        'M72,264.47v20.4', 'M42,293.27v26.4', 'M67.81,317.17h-14.46'
      ],
      logo: [
        'M49.37-.25v270.82', 'M85.87,261.57h39', 'M-.13,289.07h69',
        'M45,301.57h53.87', 'M93.37,327.57h27.5', 'M164.87,299.07h75.13',
        'M93.37,314.57v75', 'M114.87,270.35v45.23', 'M149.87,382.37v27.63',
        'M209.87,296.57v42', 'M68.87,258.57v33', 'M239.87,355.57h-125'
      ]
    };

    let currentStage = 'panel';
    const homeMode = window.FILT_MENU_MODE === 'home';
    let panelOpen = homeMode;
    if (homeMode) {
      root.classList.add('is-home');
      panel.classList.add('open');
    }
    let morphPromise;

    function ensureMorphPlugin() {
      if (window.gsap && window.MorphSVGPlugin) {
        window.gsap.registerPlugin(window.MorphSVGPlugin);
        return Promise.resolve(true);
      }
      if (!morphPromise) {
        morphPromise = (async () => {
          try {
            if (!window.gsap) await loadScript('https://unpkg.com/gsap@3/dist/gsap.min.js');
            if (!window.MorphSVGPlugin) await loadScript('https://assets.codepen.io/16327/MorphSVGPlugin3.min.js');
            if (!window.gsap || !window.MorphSVGPlugin) return false;
            window.gsap.registerPlugin(window.MorphSVGPlugin);
            return true;
          } catch (error) {
            return false;
          }
        })();
      }
      return morphPromise;
    }

    async function morphTo(targetStage) {
      if (!await ensureMorphPlugin()) return;
      // Morph timing from the design system (design.js sets --filt-logo-morph and --filt-logo-ease).
      const designVars = getComputedStyle(document.documentElement);
      const morphDuration = parseFloat(designVars.getPropertyValue('--filt-logo-morph')) || .8;
      const morphEase = designVars.getPropertyValue('--filt-logo-ease').trim() || 'power2.inOut';
      const timeline = window.gsap.timeline({ defaults: { duration:morphDuration, ease:morphEase } });
      const newPaths = shapes[targetStage];
      paths.forEach((path, index) => {
        timeline.to(path, { morphSVG:{ shape:newPaths[index], map:'position' } }, 0);
      });
      currentStage = targetStage;
    }

    function toggleDesktopPanel() {
      if (homeMode) return;
      panelOpen = !panelOpen;
      panel.classList.toggle('open', panelOpen);
      morphTo('panel');
    }

    vert.addEventListener('click', event => {
      event.stopPropagation();
      toggleDesktopPanel();
    });
    panel.addEventListener('click', event => {
      if (event.target.closest('a') || event.target.closest('#logoBtn') || event.target.closest('.vert')) return;
      toggleDesktopPanel();
    });
    logoBtn.addEventListener('click', event => {
      event.stopPropagation();
      if (!panelOpen) return;
      morphTo(currentStage === 'panel' ? 'logo' : 'panel');
    });

    mobileButton.addEventListener('click', () => {
      const open = !mobilePanel.classList.contains('open');
      mobilePanel.classList.toggle('open', open);
      overlay.classList.toggle('active', open);
      mobileButton.setAttribute('aria-expanded', String(open));
      mobileButton.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    const closeMobileMenu = () => {
      mobilePanel.classList.remove('open');
      overlay.classList.remove('active');
      mobileButton.setAttribute('aria-expanded', 'false');
      mobileButton.setAttribute('aria-label', '메뉴 열기');
      document.body.style.overflow = '';
    };
    overlay.addEventListener('click', closeMobileMenu);
    mobilePanel.addEventListener('click', event => {
      if (event.target.closest('a')) closeMobileMenu();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        if (mobilePanel.classList.contains('open')) closeMobileMenu();
        else if (panelOpen) toggleDesktopPanel();
      }
    });

    ensureMorphPlugin();
  }

  if (document.readyState === 'loading' && !document.body) {
    document.addEventListener('DOMContentLoaded', mount, { once:true });
  } else {
    mount();
  }
})();
