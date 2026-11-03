(() => {
  const MENU_ROOT_ID = 'filt-common-menu-v2';
  const DESKTOP_BUTTON_ID = 'filt-home-button-desktop';
  const MOBILE_BUTTON_ID = 'filt-home-button-mobile';
  // The FILT mark, as in the old mobile header widget (viewBox 91.67 × 76.67).
  const MOBILE_LOGO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 91.67 76.67'%3E%3Cg fill='none' stroke='%23000' stroke-width='8.33'%3E%3Cpath d='M14.17 0v76.67M10 4.17h27.5M0 34.17h8.33M20 34.17h13.33M33.33 34.17h13.33M58.33 34.17h13.33M71.67 34.17h20M52.5 0v76.67M75 40v36.67M75 0v28.33M33.33 40v36.67M69.17 72.5H48.34'/%3E%3C/g%3E%3C/svg%3E";

  if (window.__FILT_HOME_BUTTON_LOADED) return;
  window.__FILT_HOME_BUTTON_LOADED = true;

  const css = [
    '#' + MENU_ROOT_ID + ' .filt-home-button { display:block; width:15px; height:15px; padding:0; border:0; border-radius:50%; background:#000; cursor:pointer; transition:opacity .3s ease, transform .2s ease; }',
    '#' + MENU_ROOT_ID + ' .filt-home-button:hover { opacity:.5; }',
    '#' + MENU_ROOT_ID + ' .filt-home-button:active { transform:scale(.9); background:#fff; }',
    '#' + MENU_ROOT_ID + ' .filt-home-button:focus-visible { outline:2px solid var(--filt-key, #BD005E); outline-offset:4px; }',
    '#' + MENU_ROOT_ID + ' .filt-home-button--desktop { position:absolute; top:20px; left:20px; z-index:15; }',
    '#' + MENU_ROOT_ID + ' .filt-home-button--mobile { display:none; position:fixed; top:20px; left:20px; z-index:999993; }',
        document.querySelector('[data-filt-works]')
      ? '@media (max-width:768px), (orientation:landscape) and (hover:none) and (pointer:coarse) {'
      : (document.querySelector('[data-filt-project], .filt-project-mount, .filt-page[data-page="office"], .filt-page[data-page="news"]') ? '@media (max-width: 1024px), (any-pointer: coarse) {' : '@media (max-width:768px) {'),
    '  #' + MENU_ROOT_ID + ' .filt-home-button--desktop { display:none; }',
    // Mobile header on every page, as on the project page: the FILT mark at the left of the 40px bar
    // (the menu dot sits at the right, from common-menu-v2.js).
    '  #' + MENU_ROOT_ID + ' .filt-home-button--mobile { display:block !important; position:fixed !important; top:8px !important; left:14px !important; width:29px !important; height:24px !important; padding:0 !important; border:0 !important; border-radius:0 !important; box-shadow:none !important; z-index:999993 !important;'
      + ' background:url("' + MOBILE_LOGO + '") center / contain no-repeat !important; }',
    // Old Imweb code widgets (e.g. #filt-mobile-dock on WORKS and HOME, the OFFICE/NEWS headers) still draw
    // their own logo and menu dot in the same bar; keep their bar but hide those two so only ours show.
    '  .mobile-header > .header-logo, .mobile-header > .header-menu-btn { display:none !important; }',
    '}'
  ].join('\n');

  function makeButton(id, className) {
    const link = document.createElement('a');
    link.id = id;
    link.className = className;
    link.href = '/home';
    link.setAttribute('aria-label', '홈으로 이동');
    link.setAttribute('title', '홈으로 이동');
    return link;
  }

  function mount() {
    const root = document.getElementById(MENU_ROOT_ID);
    const panel = root && root.querySelector('.side-panel');
    if (!root || !panel) return false;
    if (document.getElementById(DESKTOP_BUTTON_ID)) return true;

    const style = document.createElement('style');
    style.id = 'filt-home-button-styles';
    style.textContent = css;
    document.head.appendChild(style);

    panel.appendChild(makeButton(DESKTOP_BUTTON_ID, 'filt-home-button filt-home-button--desktop'));
    root.appendChild(makeButton(MOBILE_BUTTON_ID, 'filt-home-button filt-home-button--mobile'));
    return true;
  }

  if (document.readyState === 'loading' && !document.body) {
    document.addEventListener('DOMContentLoaded', () => {
      if (mount()) return;
      observeForMenu();
    }, { once:true });
  } else if (!mount()) {
    observeForMenu();
  }

  function observeForMenu() {
    const observer = new MutationObserver(() => {
      if (mount()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList:true, subtree:true });
    window.setTimeout(() => observer.disconnect(), 10000);
  }
})();
