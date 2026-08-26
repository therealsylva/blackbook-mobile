(function () {
  'use strict';

  var isMobile = window.matchMedia('(max-width: 820px)').matches || Boolean(window.ReactNativeWebView);
  if (!isMobile) return;

  document.documentElement.classList.add('blackbook-mobile-shell');
  document.body.classList.add('blackbook-mobile-native');

  /* The web product uses same-origin /api routes. Point only those routes at
     the deployed Blackbook origin when the canonical pages run from APK assets. */
  if (location.protocol === 'file:' && typeof window.fetch === 'function') {
    var platformFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      var request = typeof input === 'string' && input.indexOf('/api/') === 0
        ? 'https://blackbook.modnight.com' + input
        : input;
      return platformFetch(request, init);
    };
  }

  var pathname = window.location.pathname;
  var page = pathname.endsWith('terminal.html')
    ? 'trade'
    : pathname.endsWith('index-overview.html')
      ? 'overview'
      : 'home';
  var query = new URLSearchParams(location.search);

  var icons = {
    home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5M4 19h16M7 15l3-4 3 2 5-6"></path></svg>',
    indices: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4V3Z"></path></svg>',
    trade: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h8M3 8h6M3 12h8M3 16h6M3 20h8"></path><path d="M13 4h8M15 8h6M13 12h8M15 16h6M13 20h8"></path><path d="M12 2v20"></path></svg>',
    portfolio: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2"></rect><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"></path></svg>',
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.09a2 2 0 0 1 1 1.74v.5a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z"></path><circle cx="12" cy="12" r="3"></circle></svg>'
  };

  function navItem(id, label, icon, active, disabled) {
    return '<button type="button" class="bb-mobile-nav-item' + (active ? ' is-active' : '') + (disabled ? ' is-disabled' : '') + '" data-mobile-destination="' + id + '"' + (disabled ? ' aria-disabled="true"' : '') + '>' +
      '<span class="bb-mobile-nav-icon">' + icon + '</span><span>' + label + '</span></button>';
  }

  var nav = document.createElement('nav');
  nav.className = 'bb-mobile-nav';
  nav.setAttribute('aria-label', 'Blackbook mobile navigation');
  nav.innerHTML =
    navItem('home', 'Home', icons.home, page === 'home' && !query.has('mobile'), false) +
    navItem('indices', 'All Indices', icons.indices, query.get('mobile') === 'indices', false) +
    navItem('trade', 'Trade', icons.trade, page === 'trade' || page === 'overview', false) +
    navItem('portfolio', 'Portfolio', icons.portfolio, false, true) +
    navItem('menu', 'Menu', icons.menu, false, false);
  document.body.appendChild(nav);

  var backdrop = document.createElement('button');
  backdrop.type = 'button';
  backdrop.className = 'bb-mobile-menu-backdrop';
  backdrop.setAttribute('aria-label', 'Close menu');
  backdrop.hidden = true;

  var menu = document.createElement('aside');
  menu.className = 'bb-mobile-menu';
  menu.setAttribute('aria-label', 'Blackbook menu');
  menu.setAttribute('aria-modal', 'true');
  menu.setAttribute('role', 'dialog');
  menu.hidden = true;
  menu.innerHTML =
    '<div class="bb-mobile-menu-grabber" aria-hidden="true"></div>' +
    '<div class="bb-mobile-menu-header"><img src="./public/assets/brand/blackbook-logo.svg" alt="Blackbook"><button type="button" data-mobile-menu-close aria-label="Close menu">×</button></div>' +
    '<section class="bb-mobile-mode" aria-label="Trading interface"><span>Trading interface</span>' +
      '<div><button type="button" data-mobile-mode="basic">Basic</button><button type="button" data-mobile-mode="advanced">Advanced</button></div>' +
      '<small>Basic is the existing index overview. Advanced is the existing terminal.</small></section>' +
    '<div class="bb-mobile-menu-links">' +
      '<a href="./terminal.html">Terminal <span>›</span></a>' +
      '<a href="./index.html#market-overview">Markets <span>›</span></a>' +
      '<a href="./index-overview.html?symbol=RMD#methodology">Methodology <span>›</span></a>' +
      '<a href="./index.html#stocks">Paper Trading <span>›</span></a>' +
      '<button type="button" data-mobile-account>Account <span>›</span></button></div>' +
    '<p class="bb-mobile-menu-note">Portfolio, positions, orders, signals, journal, and alerts retain the same availability state as index-frontend.</p>';

  document.body.appendChild(backdrop);
  document.body.appendChild(menu);

  var notice = document.createElement('div');
  notice.className = 'bb-mobile-notice';
  notice.setAttribute('role', 'status');
  notice.setAttribute('aria-live', 'polite');
  notice.hidden = true;
  document.body.appendChild(notice);

  var noticeTimer;
  function showNotice(message) {
    window.clearTimeout(noticeTimer);
    notice.textContent = message;
    notice.hidden = false;
    requestAnimationFrame(function () { notice.classList.add('is-visible'); });
    noticeTimer = window.setTimeout(function () {
      notice.classList.remove('is-visible');
      window.setTimeout(function () { notice.hidden = true; }, 180);
    }, 2200);
  }

  function currentSymbol() {
    var symbol = new URLSearchParams(location.search).get('symbol');
    if (symbol) return symbol;
    var terminalSymbol = document.querySelector('[data-chart-symbol]');
    if (terminalSymbol && terminalSymbol.textContent) return terminalSymbol.textContent.replace('/USD', '').trim();
    return 'RMD';
  }

  function openMenu() {
    menu.hidden = false;
    backdrop.hidden = false;
    document.body.classList.add('bb-mobile-menu-open');
    requestAnimationFrame(function () {
      menu.classList.add('is-open');
      backdrop.classList.add('is-open');
    });
  }

  function closeMenu() {
    menu.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    document.body.classList.remove('bb-mobile-menu-open');
    window.setTimeout(function () {
      menu.hidden = true;
      backdrop.hidden = true;
    }, 180);
  }

  function openIndices() {
    if (page !== 'home') {
      location.href = './index.html?mobile=indices';
      return;
    }
    var input = document.querySelector('.search-input');
    if (input) input.click();
  }

  nav.addEventListener('click', function (event) {
    var button = event.target.closest('[data-mobile-destination]');
    if (!button) return;
    var destination = button.getAttribute('data-mobile-destination');
    if (destination === 'home') location.href = './index.html';
    if (destination === 'indices') openIndices();
    if (destination === 'trade') location.href = './terminal.html?symbol=' + encodeURIComponent(currentSymbol());
    if (destination === 'portfolio') showNotice('Portfolio unavailable');
    if (destination === 'menu') openMenu();
  });

  menu.addEventListener('click', function (event) {
    if (event.target.closest('[data-mobile-menu-close]')) closeMenu();

    var mode = event.target.closest('[data-mobile-mode]');
    if (mode) {
      var symbol = encodeURIComponent(currentSymbol());
      location.href = mode.getAttribute('data-mobile-mode') === 'advanced'
        ? './terminal.html?symbol=' + symbol
        : './index-overview.html?symbol=' + symbol;
    }

    if (event.target.closest('[data-mobile-account]')) {
      closeMenu();
      var accountTrigger = document.querySelector('[data-auth-account]:not([hidden]), [data-auth-entry], [data-auth-adaptive-trigger]');
      if (accountTrigger) accountTrigger.click();
    }
  });

  backdrop.addEventListener('click', closeMenu);

  if (query.get('mobile') === 'indices') window.setTimeout(openIndices, 180);

  var basicButton = menu.querySelector('[data-mobile-mode="basic"]');
  var advancedButton = menu.querySelector('[data-mobile-mode="advanced"]');
  if (page === 'trade') advancedButton.classList.add('is-active');
  else basicButton.classList.add('is-active');
})();
