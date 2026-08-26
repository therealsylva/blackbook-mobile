(() => {
  'use strict';

  const refs = {
    chart: document.querySelector('#terminal-chart'),
    message: document.querySelector('[data-chart-message]'),
    symbolControl: document.querySelector('.terminal-symbol-control'),
    symbolInput: document.querySelector('#symbol-input'),
    symbolSubmit: document.querySelector('#symbol-submit'),
    searchDropdown: document.querySelector('[data-symbol-dropdown]'),
    marketTabs: document.querySelector('[data-market-tabs]'),
    tabStrip: document.querySelector('[data-tab-strip]'),
    tabAdd: document.querySelector('[data-tab-add]'),
    tabOverflow: document.querySelector('[data-tab-overflow]'),
    tabOverflowMenu: document.querySelector('[data-tab-overflow-menu]'),
    chartIdentity: document.querySelector('[data-chart-identity]'),
    chartSymbol: document.querySelector('[data-chart-symbol]'),
    chartVolume: document.querySelector('[data-chart-volume]'),
    chartDensity: document.querySelector('[data-chart-density]'),
    chartBandMin: document.querySelector('[data-chart-band-min]'),
    chartBandMax: document.querySelector('[data-chart-band-max]'),
    ohlc: document.querySelector('[data-ohlc]'),
    feedStatus: document.querySelector('[data-feed-status]'),
    statusMessage: document.querySelector('[data-status-message]'),
    clock: document.querySelector('[data-clock]'),
    shortQuote: document.querySelector('[data-short-quote]'),
    longQuote: document.querySelector('[data-long-quote]'),
    ticket: document.querySelector('[data-ticket]'),
    ticketBackdrop: document.querySelector('[data-ticket-backdrop]'),
    ticketClose: document.querySelector('[data-ticket-close]'),
    ticketForm: document.querySelector('[data-ticket-form]'),
    orderToast: document.querySelector('[data-order-toast]'),
    orderToastClose: document.querySelector('[data-order-toast-close]'),
    orderToastMarket: document.querySelector('[data-order-toast-market]'),
    orderToastSide: document.querySelector('[data-order-toast-side]'),
    orderToastPrice: document.querySelector('[data-order-toast-price]'),
    ticketIdentity: document.querySelector('[data-ticket-identity]'),
    ticketSymbol: document.querySelector('[data-ticket-symbol]'),
    ticketLongQuote: document.querySelector('[data-ticket-long-quote]'),
    ticketShortQuote: document.querySelector('[data-ticket-short-quote]'),
    ticketSpreadBadge: document.querySelector('[data-ticket-spread-badge]'),
    orderEntry: document.querySelector('[data-order-entry]'),
    entryPriceRow: document.querySelector('[data-entry-price-row]'),
    orderMargin: document.querySelector('[data-order-margin]'),
    orderLeverage: document.querySelector('[data-order-leverage]'),
    orderTpToggle: document.querySelector('[data-order-tp-toggle]'),
    orderSlToggle: document.querySelector('[data-order-sl-toggle]'),
    orderTp: document.querySelector('[data-order-tp]'),
    orderSl: document.querySelector('[data-order-sl]'),
    infoPositionSize: document.querySelector('[data-info-position-size]'),
    infoLiquidation: document.querySelector('[data-info-liquidation]'),
    infoFee: document.querySelector('[data-info-fee]'),
    infoTpRow: document.querySelector('[data-info-tp-row]'),
    infoSlRow: document.querySelector('[data-info-sl-row]'),
    infoTpPnl: document.querySelector('[data-info-tp-pnl]'),
    infoSlPnl: document.querySelector('[data-info-sl-pnl]'),
    orderSubmit: document.querySelector('[data-order-submit]'),
    submitLabel: document.querySelector('[data-submit-label]'),
    submitDetail: document.querySelector('[data-submit-detail]'),
    ticketNote: document.querySelector('[data-ticket-note]'),
    workspace: document.querySelector('.terminal-workspace'),
    marketDataRoot: document.querySelector('[data-market-data]'),
    marketPanelToggle: document.querySelector('[data-market-panel-toggle]'),
    marketPanelClose: document.querySelector('[data-market-panel-close]'),
    orderBookSideItem: document.querySelector('[data-side-action="orderbook"]'),
    marketsSideItem: document.querySelector('.terminal-primary-nav [data-side-item][href="./index.html"]'),
    settingsButton: document.querySelector('[data-action="settings"]'),
    settingsSideItem: document.querySelector('[data-side-action="settings"]'),
    settingsMenu: document.querySelector('[data-settings-menu]'),
    settingsClose: document.querySelector('[data-settings-close]'),
    syntheticsToggle: document.querySelector('[data-setting="synthetics"]'),
    gridToggle: document.querySelector('[data-setting="grid"]'),
    drawingCancel: document.querySelector('[data-drawing-action="cancel"]'),
    drawingDelete: document.querySelector('[data-drawing-action="delete"]'),
  };

  const library = window.LightweightCharts;
  if (!library || !refs.chart) {
    showMessage('Lightweight Charts could not be loaded.');
    return;
  }

  const {
    CandlestickSeries,
    ColorType,
    CrosshairMode,
    HistogramSeries,
    LineSeries,
    LineStyle,
    createChart,
  } = library;

  const chart = createChart(refs.chart, {
    autoSize: true,
    layout: {
      background: { type: ColorType.Solid, color: '#080808' },
      textColor: '#777777',
      fontFamily: 'Mona Sans, Helvetica Neue, Arial, sans-serif',
      fontSize: 11,
      attributionLogo: false,
      panes: {
        separatorColor: '#242424',
        separatorHoverColor: '#242424',
        enableResize: false,
      },
    },
    grid: {
      vertLines: { color: 'rgba(255, 255, 255, 0.035)', style: LineStyle.Dotted },
      horzLines: { color: 'rgba(255, 255, 255, 0.055)', style: LineStyle.Dotted },
    },
    crosshair: {
      mode: CrosshairMode.Magnet,
      vertLine: {
        color: 'rgba(180, 180, 180, .38)',
        width: 1,
        style: LineStyle.Dashed,
        labelBackgroundColor: '#3b3b3b',
      },
      horzLine: {
        color: 'rgba(180, 180, 180, .38)',
        width: 1,
        style: LineStyle.Dashed,
        labelBackgroundColor: '#3b3b3b',
      },
    },
    rightPriceScale: {
      borderVisible: false,
      minimumWidth: 74,
      scaleMargins: { top: 0.08, bottom: 0.22 },
    },
    timeScale: {
      borderVisible: false,
      rightOffset: 8,
      barSpacing: 8,
      minBarSpacing: 2,
      timeVisible: true,
      secondsVisible: false,
      fixLeftEdge: false,
      rightBarStaysOnScroll: true,
    },
    handleScroll: {
      mouseWheel: true,
      pressedMouseMove: true,
      horzTouchDrag: true,
      vertTouchDrag: false,
    },
    handleScale: {
      axisPressedMouseMove: true,
      mouseWheel: true,
      pinch: true,
    },
  });

  const candles = chart.addSeries(CandlestickSeries, {
    upColor: '#08b996',
    downColor: '#f04a59',
    borderUpColor: '#08b996',
    borderDownColor: '#f04a59',
    wickUpColor: '#08b996',
    wickDownColor: '#f04a59',
    lastValueVisible: true,
    priceLineVisible: true,
    priceLineColor: '#08b996',
    priceLineWidth: 1,
    priceLineStyle: LineStyle.Dotted,
  });

  const volumes = chart.addSeries(HistogramSeries, {
    priceScaleId: '',
    priceFormat: { type: 'volume' },
    lastValueVisible: false,
    priceLineVisible: false,
  });

  const referenceLine = chart.addSeries(LineSeries, {
    color: '#bcbcbc',
    lineWidth: 2,
    lastValueVisible: true,
    priceLineVisible: true,
    priceLineColor: '#bcbcbc',
    priceLineWidth: 1,
    priceLineStyle: LineStyle.Dotted,
    visible: false,
  });

  candles.priceScale().applyOptions({ scaleMargins: { top: 0.07, bottom: 0.22 } });
  volumes.priceScale().applyOptions({ scaleMargins: { top: 0.79, bottom: 0 } });
  referenceLine.priceScale().applyOptions({ scaleMargins: { top: 0.09, bottom: 0.14 } });

  const SYNTHETICS_STORAGE_KEY = 'blackbook-terminal-synthetics-v4';

  function readSyntheticPreference() {
    try {
      const stored = window.localStorage.getItem(SYNTHETICS_STORAGE_KEY);
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  }

  const state = {
    symbol: 'RMD',
    range: '1D',
    indexRecord: null,
    bars: [],
    requestId: 0,
    gridVisible: true,
    syntheticsEnabled: readSyntheticPreference(),
    lastBar: null,
    orderSide: 'long',
    orderType: 'market',
    orderLeverage: 10,
    activeTool: 'cursor',
    tabs: [],
    activeTabId: null,
    tabHistory: [],
    drawings: [],
    levels: [],
    ticketTrigger: null,
    orders: [],
    executionLine: null,
    executionLineConfig: null,
    toastTimer: null,
    pendingDrawing: null,
    selectedDrawingId: null,
    drawingLayer: null,
    marketDataController: null,
  };

  state.marketDataController = window.BLACKBOOK_TERMINAL_MARKET_DATA?.createController({
    root: refs.marketDataRoot,
    provider: window.BLACKBOOK_MARKET_DATA_PROVIDER,
  }) || null;

  const terminalCatalog = window.BLACKBOOK_INDEX_CATALOG;
  const terminalSearchItems = (terminalCatalog?.list || []).map((record) => ({
    symbol: record.symbol,
    name: record.name,
    category: record.category,
    kind: 'index',
    record,
  }));
  let activeSearchIndex = -1;

  function showMessage(message) {
    if (!refs.message) return;
    refs.message.textContent = message;
    refs.message.hidden = !message;
  }

  function setFeedState(kind, message) {
    if (refs.feedStatus) refs.feedStatus.textContent = message;
  }

  function setStatus(message) {
    refs.statusMessage.textContent = message;
  }

  function escapeSearchHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    }[character]));
  }

  function searchDisplaySymbol(item) {
    return item.kind === 'index' && item.record?.quote?.unit === 'POINT'
      ? `${item.symbol}/USD`
      : item.symbol;
  }

  function terminalDisplaySymbol(symbol = state.symbol, record = state.indexRecord) {
    if (record?.quote?.unit === 'POINT') return `${symbol}/USD`;
    return symbol;
  }

  function searchIconMarkup(item) {
    if (item.kind !== 'index' || !item.record?.asset) {
      return `<span class="terminal-search-result-icon fallback">${escapeSearchHtml(item.symbol.slice(0, 3))}</span>`;
    }
    const asset = item.record.asset.type === 'pair' ? item.record.asset.items[0] : item.record.asset;
    const assetClass = asset.type === 'person' ? 'person' : 'logo';
    return `<span class="terminal-search-result-icon ${assetClass}"><img src="${escapeSearchHtml(asset.src)}" alt=""></span>`;
  }

  function recordAssets(record) {
    if (!record?.asset) return [];
    return record.asset.type === 'pair' ? record.asset.items : [record.asset];
  }

  const TAB_STORAGE_KEY = 'blackbook-terminal-tabs-v1';
  const TAB_TOOLS = new Set(['cursor', 'line', 'levels', 'measure']);
  const TAB_LIMIT = 24;

  function activeTab() {
    return state.tabs.find((tab) => tab.id === state.activeTabId) || null;
  }

  function validRangeFor(record, range) {
    return record?.ranges?.[range] ? range : '1D';
  }

  function validChartView(view) {
    if (!view || !Number.isFinite(Number(view.from)) || !Number.isFinite(Number(view.to))) return null;
    if (Number(view.to) <= Number(view.from)) return null;
    return { from: Number(view.from), to: Number(view.to) };
  }

  function defaultTicketState(saved = {}) {
    const source = saved.ticket || saved;
    const leverage = Number(source.orderLeverage ?? source.leverage ?? 10);
    return {
      side: source.orderSide === 'short' || source.side === 'short' ? 'short' : 'long',
      type: source.orderType === 'limit' || source.type === 'limit' ? 'limit' : 'market',
      leverage: [1, 2, 5, 10, 20, 50, 100].includes(leverage) ? leverage : 10,
      margin: String(source.margin ?? '1000'),
      entry: String(source.entry ?? ''),
      tpEnabled: Boolean(source.tpEnabled),
      slEnabled: Boolean(source.slEnabled),
      tp: String(source.tp ?? ''),
      sl: String(source.sl ?? ''),
    };
  }

  function normalizeDrawingPoint(point) {
    if (!point || !Number.isFinite(Number(point.time)) || !Number.isFinite(Number(point.price))) return null;
    return { time: Number(point.time), price: Number(point.price) };
  }

  function normalizeDrawings(drawings) {
    if (!Array.isArray(drawings)) return [];
    return drawings.slice(0, 100).map((drawing, index) => {
      const start = normalizeDrawingPoint(drawing?.start);
      const end = normalizeDrawingPoint(drawing?.end);
      if (!start || !end || !['line', 'measure'].includes(drawing?.type)) return null;
      return {
        id: /^[A-Za-z0-9._:-]{1,80}$/.test(String(drawing.id || ''))
          ? String(drawing.id)
          : `drawing-${index + 1}`,
        type: drawing.type,
        start,
        end,
      };
    }).filter(Boolean);
  }

  function normalizeLevels(levels) {
    if (!Array.isArray(levels)) return [];
    return levels.slice(0, 100).map((level, index) => {
      const price = Number(level?.price ?? level);
      if (!Number.isFinite(price)) return null;
      return {
        id: /^[A-Za-z0-9._:-]{1,80}$/.test(String(level?.id || ''))
          ? String(level.id)
          : `level-${index + 1}`,
        price,
      };
    }).filter(Boolean);
  }

  function createTabState(symbol, record, saved = {}) {
    const ticket = defaultTicketState(saved);
    const activeTool = TAB_TOOLS.has(saved.activeTool) ? saved.activeTool : 'cursor';
    return {
      id: symbol,
      symbol,
      range: validRangeFor(record, saved.range),
      chartView: validChartView(saved.chartView || saved.view),
      activeTool,
      gridVisible: saved.gridVisible !== false,
      drawings: normalizeDrawings(saved.drawings),
      levels: normalizeLevels(saved.levels),
      ticket,
      executionLine: null,
    };
  }

  function tabRecord(tab) {
    return tab ? catalogRecordFor(tab.symbol) : null;
  }

  function tabDisplaySymbol(tab) {
    return tab ? terminalDisplaySymbol(tab.symbol, tabRecord(tab)) : '';
  }

  function tabIconMarkup(record, symbol = '') {
    const asset = recordAssets(record)[0];
    if (!asset) return `<span class="terminal-market-tab-icon fallback">${escapeSearchHtml(String(symbol).slice(0, 2))}</span>`;
    const assetClass = asset.type === 'person' ? 'person' : 'logo';
    return `<span class="terminal-market-tab-icon ${assetClass}"><img src="${escapeSearchHtml(asset.src)}" alt=""></span>`;
  }

  function serializeTab(tab) {
    return {
      id: tab.id,
      symbol: tab.symbol,
      range: tab.range,
      chartView: validChartView(tab.chartView),
      activeTool: TAB_TOOLS.has(tab.activeTool) ? tab.activeTool : 'cursor',
      gridVisible: tab.gridVisible !== false,
      drawings: normalizeDrawings(tab.drawings),
      levels: normalizeLevels(tab.levels),
      ticket: { ...defaultTicketState(tab) },
      executionLine: null,
    };
  }

  function persistTabs() {
    try {
      window.localStorage.setItem(TAB_STORAGE_KEY, JSON.stringify({
        version: 1,
        activeTabId: state.activeTabId,
        tabHistory: state.tabHistory.slice(0, TAB_LIMIT),
        tabs: state.tabs.map(serializeTab),
      }));
    } catch {
      // Private browsing contexts can deny localStorage; tabs still work in memory.
    }
  }

  function readStoredTabs() {
    try {
      const stored = JSON.parse(window.localStorage.getItem(TAB_STORAGE_KEY) || 'null');
      const rawTabs = Array.isArray(stored) ? stored : stored?.tabs;
      if (!Array.isArray(rawTabs)) return { tabs: [], activeTabId: null, tabHistory: [] };
      const tabs = [];
      const seen = new Set();
      rawTabs.forEach((saved) => {
        const record = catalogRecordFor(saved?.symbol);
        if (!record || seen.has(record.symbol) || tabs.length >= TAB_LIMIT) return;
        seen.add(record.symbol);
        tabs.push(createTabState(record.symbol, record, saved));
      });
      const validIds = new Set(tabs.map((tab) => tab.id));
      const history = Array.isArray(stored?.tabHistory)
        ? stored.tabHistory.filter((id) => validIds.has(id))
        : [];
      const activeTabId = validIds.has(stored?.activeTabId) ? stored.activeTabId : tabs[0]?.id || null;
      return { tabs, activeTabId, tabHistory: history };
    } catch {
      return { tabs: [], activeTabId: null, tabHistory: [] };
    }
  }

  function updateTabOverflow() {
    if (!refs.tabStrip || !refs.tabOverflow) return;
    const isOverflowing = refs.tabStrip.scrollWidth > (refs.tabStrip.clientWidth + 1);
    refs.tabOverflow.hidden = !isOverflowing;
    if (!isOverflowing && refs.tabOverflowMenu) {
      refs.tabOverflowMenu.hidden = true;
      refs.tabOverflow.setAttribute('aria-expanded', 'false');
    }
  }

  function scrollActiveTabIntoView() {
    if (!refs.tabStrip || !state.activeTabId) return;
    const active = [...refs.tabStrip.querySelectorAll('[data-tab-id]')]
      .find((tab) => tab.dataset.tabId === state.activeTabId);
    active?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  function renderTabs() {
    if (!refs.tabStrip) return;
    refs.tabStrip.innerHTML = state.tabs.map((tab) => {
      const active = tab.id === state.activeTabId;
      const label = tabDisplaySymbol(tab);
      const closeDisabled = state.tabs.length <= 1;
      return `<div class="terminal-market-tab${active ? ' is-active' : ''}" data-tab-id="${escapeSearchHtml(tab.id)}" role="presentation" draggable="true">
        <button type="button" class="terminal-market-tab-main" data-tab-select role="tab" aria-selected="${active}" tabindex="${active ? '0' : '-1'}" aria-label="Switch to ${escapeSearchHtml(label)}">${tabIconMarkup(tabRecord(tab), tab.symbol)}<span class="terminal-market-tab-symbol">${escapeSearchHtml(label)}</span></button>
        <button type="button" class="terminal-market-tab-close" data-tab-close aria-label="Close ${escapeSearchHtml(label)}"${closeDisabled ? ' disabled' : ''}>×</button>
      </div>`;
    }).join('');
    if (refs.tabOverflowMenu) {
      refs.tabOverflowMenu.innerHTML = state.tabs.map((tab) => {
        const active = tab.id === state.activeTabId;
        return `<button type="button" class="terminal-market-tab-overflow-item${active ? ' is-active' : ''}" data-overflow-tab="${escapeSearchHtml(tab.id)}" role="menuitem">${tabIconMarkup(tabRecord(tab), tab.symbol)}<span>${escapeSearchHtml(tabDisplaySymbol(tab))}</span></button>`;
      }).join('');
      refs.tabOverflowMenu.hidden = true;
      refs.tabOverflow?.setAttribute('aria-expanded', 'false');
    }
    window.requestAnimationFrame(() => {
      updateTabOverflow();
      scrollActiveTabIntoView();
    });
  }

  function rememberTab(tabId) {
    state.tabHistory = [tabId, ...state.tabHistory.filter((id) => id !== tabId)].slice(0, TAB_LIMIT);
  }

  function renderRecordIdentity(container, record) {
    if (!container) return;
    container.replaceChildren();
    const assets = recordAssets(record);
    if (!assets.length) {
      container.hidden = true;
      return;
    }
    container.classList.toggle('is-pair', assets.length > 1);
    assets.forEach((asset) => {
      const image = document.createElement('img');
      image.src = asset.src;
      image.alt = '';
      image.className = asset.type === 'person' ? 'is-person' : 'is-logo';
      if (asset.alt === 'ChatGPT') image.classList.add('is-openai');
      if (asset.alt === 'NBA') image.classList.add('is-nba');
      image.addEventListener('error', () => image.remove(), { once: true });
      container.append(image);
    });
    container.hidden = false;
  }

  function updateChartIdentity() {
    renderRecordIdentity(refs.chartIdentity, state.indexRecord);
  }

  function matchingSearchItems(query) {
    const normalized = String(query || '').trim().toLowerCase();
    const matches = terminalSearchItems.filter((item) => {
      if (!normalized) return true;
      return `${item.symbol} ${searchDisplaySymbol(item)} ${item.name} ${item.category}`.toLowerCase().includes(normalized);
    });
    return matches.sort((left, right) => {
      if (!normalized) return 0;
      const leftExact = left.symbol.toLowerCase() === normalized || left.name.toLowerCase() === normalized;
      const rightExact = right.symbol.toLowerCase() === normalized || right.name.toLowerCase() === normalized;
      return Number(rightExact) - Number(leftExact);
    }).slice(0, 12);
  }

  function closeTerminalSearch() {
    if (!refs.searchDropdown) return;
    refs.searchDropdown.hidden = true;
    refs.symbolInput.setAttribute('aria-expanded', 'false');
    refs.symbolInput.removeAttribute('aria-activedescendant');
    activeSearchIndex = -1;
  }

  function selectTerminalSearchItem(item) {
    refs.symbolInput.value = searchDisplaySymbol(item);
    closeTerminalSearch();
    openMarketTab(item.symbol);
  }

  function setActiveSearchResult(index) {
    const buttons = [...(refs.searchDropdown?.querySelectorAll('[data-search-symbol]') || [])];
    buttons.forEach((button) => {
      button.classList.remove('is-active');
      button.setAttribute('aria-selected', 'false');
    });
    if (!buttons.length) {
      activeSearchIndex = -1;
      return;
    }
    activeSearchIndex = (index + buttons.length) % buttons.length;
    const active = buttons[activeSearchIndex];
    active.classList.add('is-active');
    active.setAttribute('aria-selected', 'true');
    active.scrollIntoView({ block: 'nearest' });
    refs.symbolInput.setAttribute('aria-activedescendant', active.id);
  }

  function renderTerminalSearch(query = refs.symbolInput.value) {
    if (!refs.searchDropdown) return;
    const matches = matchingSearchItems(query);
    activeSearchIndex = -1;
    refs.searchDropdown.innerHTML = matches.length
      ? matches.map((item, index) => `<button class="terminal-search-result" id="terminal-search-result-${index}" type="button" role="option" aria-selected="false" data-search-symbol="${escapeSearchHtml(item.symbol)}">${searchIconMarkup(item)}<span class="terminal-search-result-copy"><strong>${escapeSearchHtml(searchDisplaySymbol(item))}</strong><small>${escapeSearchHtml(item.name)}</small></span><span class="terminal-search-result-meta"><small>${escapeSearchHtml(item.category)}</small><strong>INDEX</strong></span></button>`).join('')
      : '<div class="terminal-search-empty">No indices match that search.</div>';
    refs.searchDropdown.querySelectorAll('[data-search-symbol]').forEach((button, index) => {
      const item = matches[index];
      button.addEventListener('mousedown', (event) => event.preventDefault());
      button.addEventListener('click', () => selectTerminalSearchItem(item));
    });
    refs.searchDropdown.hidden = false;
    refs.symbolInput.setAttribute('aria-expanded', 'true');
  }

  function formatPrice(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return '—';
    const digits = state.indexRecord?.quote?.unit === 'RATIO' ? 4 : Math.abs(amount) < 1 ? 6 : 2;
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }

  function formatVolume(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return '—';
    if (amount >= 1e6) return `${(amount / 1e6).toFixed(2)}M`;
    if (amount >= 1e3) return `${(amount / 1e3).toFixed(1)}K`;
    return Math.round(amount).toLocaleString('en-US');
  }

  function chartBandFor(points) {
    if (state.syntheticEnabled) {
      const validBars = (points || []).filter((bar) => (
        Number.isFinite(Number(bar.low)) && Number.isFinite(Number(bar.high))
      ));
      if (!validBars.length) return null;
      const baseline = Number(state.indexRecord?.stats?.previousClose) || Number(validBars[0].open);
      if (!Number.isFinite(baseline) || baseline === 0) return null;
      const lows = validBars.map((bar) => Number(bar.low));
      const highs = validBars.map((bar) => Number(bar.high));
      return {
        min: ((Math.min(...lows) - baseline) / Math.abs(baseline)) * 100,
        max: ((Math.max(...highs) - baseline) / Math.abs(baseline)) * 100,
      };
    }
    const values = (points || []).map((point) => Number(point.value)).filter(Number.isFinite);
    if (!values.length) return null;
    const baseline = Number(state.indexRecord?.stats?.previousClose) || values[0];
    if (!Number.isFinite(baseline) || baseline === 0) return null;
    return {
      min: ((Math.min(...values) - baseline) / Math.abs(baseline)) * 100,
      max: ((Math.max(...values) - baseline) / Math.abs(baseline)) * 100,
    };
  }

  function chartDensityFor() {
    const base = Number(state.indexRecord?.stats?.density);
    if (!Number.isFinite(base)) return null;
    if (!state.syntheticEnabled) return Math.min(100, Math.max(1, Math.round(base)));
    const recent = state.bars.slice(-18).filter((bar) => Number.isFinite(Number(bar.volume)));
    if (!recent.length) return Math.min(100, Math.max(1, Math.round(base)));
    const averageVolume = recent.reduce((total, bar) => total + Number(bar.volume), 0) / recent.length;
    const latestVolume = Number(recent[recent.length - 1].volume);
    const volumePulse = averageVolume > 0 ? ((latestVolume / averageVolume) - 1) * 16 : 0;
    const latestClose = Number(recent[recent.length - 1].close);
    const firstClose = Number(recent[0].open);
    const movePulse = Number.isFinite(latestClose) && Number.isFinite(firstClose) && firstClose !== 0
      ? Math.min(8, Math.abs((latestClose - firstClose) / firstClose) * 100)
      : 0;
    return Math.min(100, Math.max(1, Math.round(base + volumePulse + movePulse)));
  }

  function updateChartMetrics() {
    const lastBar = state.lastBar || state.bars[state.bars.length - 1];
    const volume = Number(lastBar?.volume);
    refs.chartVolume.textContent = state.syntheticEnabled && Number.isFinite(volume)
      ? `$${formatVolume(volume)}`
      : '—';
    const density = chartDensityFor();
    refs.chartDensity.textContent = density === null ? '—' : `${density}/100`;
    const band = chartBandFor(state.bars);
    refs.chartBandMin.textContent = band ? `min ${formatSignedPercent(band.min)}` : 'min —';
    refs.chartBandMax.textContent = band ? `max ${formatSignedPercent(band.max)}` : 'max —';
  }

  function readTicketState() {
    return {
      side: state.orderSide === 'short' ? 'short' : 'long',
      type: state.orderType === 'limit' ? 'limit' : 'market',
      leverage: state.orderLeverage,
      margin: refs.orderMargin?.value || '1000',
      entry: refs.orderEntry?.value || '',
      tpEnabled: Boolean(refs.orderTpToggle?.checked),
      slEnabled: Boolean(refs.orderSlToggle?.checked),
      tp: refs.orderTp?.value || '',
      sl: refs.orderSl?.value || '',
    };
  }

  function captureChartView() {
    try {
      return validChartView(chart.timeScale().getVisibleLogicalRange());
    } catch {
      return null;
    }
  }

  function captureActiveTab() {
    const tab = activeTab();
    if (!tab) return;
    tab.range = state.range;
    const chartView = captureChartView();
    if (chartView) tab.chartView = chartView;
    tab.activeTool = TAB_TOOLS.has(state.activeTool) ? state.activeTool : 'cursor';
    tab.gridVisible = state.gridVisible !== false;
    tab.drawings = Array.isArray(state.drawings) ? state.drawings : [];
    tab.levels = Array.isArray(state.levels) ? state.levels : [];
    tab.ticket = readTicketState();
    tab.executionLine = null;
  }

  function clearExecutionLine() {
    state.executionLine = null;
    state.executionLineConfig = null;
  }

  function restoreExecutionLine() {
    // Browser-restored execution markers are intentionally retired. Only a future
    // trusted server receipt may reintroduce an authoritative execution marker.
    state.executionLine = null;
    state.executionLineConfig = null;
  }

  function applyGridVisibility() {
    chart.applyOptions({
      grid: {
        vertLines: { visible: state.gridVisible },
        horzLines: { visible: state.gridVisible },
      },
    });
    if (refs.gridToggle) refs.gridToggle.checked = state.gridVisible;
  }

  function persistSyntheticPreference() {
    try {
      window.localStorage.setItem(SYNTHETICS_STORAGE_KEY, String(state.syntheticEnabled));
    } catch {
      // Private browsing contexts can deny localStorage; the preference still works in memory.
    }
  }

  function syncSettingsControls() {
    if (refs.syntheticsToggle) refs.syntheticsToggle.checked = state.syntheticEnabled;
    if (refs.gridToggle) refs.gridToggle.checked = state.gridVisible;
  }

  function setSettingsOpen(open) {
    const isOpen = Boolean(open);
    if (refs.settingsMenu) refs.settingsMenu.hidden = !isOpen;
    refs.settingsButton?.setAttribute('aria-expanded', String(isOpen));
    refs.settingsSideItem?.setAttribute('aria-expanded', String(isOpen));
    refs.settingsSideItem?.classList.toggle('is-active', isOpen);
    if (isOpen) {
      syncSettingsControls();
      document.querySelectorAll('[data-side-item]').forEach((item) => {
        item.classList.toggle('is-active', item === refs.settingsSideItem);
      });
    } else if (!refs.marketDataRoot?.classList.contains('is-market-panel-open')) {
      document.querySelectorAll('[data-side-item]').forEach((item) => {
        item.classList.toggle('is-active', item === refs.marketsSideItem);
      });
    }
  }

  function activePriceSeries() {
    return state.syntheticEnabled ? candles : referenceLine;
  }

  function applyChartMode() {
    const synthetic = Boolean(state.syntheticEnabled);
    candles.applyOptions({ visible: synthetic });
    volumes.applyOptions({ visible: synthetic });
    referenceLine.applyOptions({ visible: !synthetic });
  }

  const SVG_NS = 'http://www.w3.org/2000/svg';
  let drawingSequence = 0;

  function drawingId(prefix) {
    const existing = new Set([
      ...state.drawings.map((drawing) => drawing.id),
      ...state.levels.map((level) => level.id),
    ]);
    let candidate = '';
    do {
      drawingSequence += 1;
      candidate = `${prefix}-${state.symbol.toLowerCase()}-${drawingSequence.toString(36)}`;
    } while (existing.has(candidate));
    return candidate;
  }

  function ensureDrawingLayer() {
    if (state.drawingLayer?.isConnected) return state.drawingLayer;
    const layer = document.createElementNS(SVG_NS, 'svg');
    layer.classList.add('terminal-drawing-layer');
    layer.setAttribute('aria-label', 'Chart drawings');
    layer.addEventListener('click', (event) => {
      const target = event.target.closest?.('[data-drawing-id]');
      if (!target) return;
      event.stopPropagation();
      state.selectedDrawingId = target.dataset.drawingId;
      renderDrawings();
      setStatus('Drawing selected · press Delete to remove');
    });
    layer.addEventListener('keydown', (event) => {
      const target = event.target.closest?.('[data-drawing-id]');
      if (!target || !['Enter', ' '].includes(event.key)) return;
      event.preventDefault();
      state.selectedDrawingId = target.dataset.drawingId;
      renderDrawings();
    });
    refs.chart.append(layer);
    state.drawingLayer = layer;
    return layer;
  }

  function setDrawingActionState() {
    document.querySelectorAll('[data-tool]').forEach((button) => {
      const active = button.dataset.tool === state.activeTool;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    if (refs.drawingCancel) {
      refs.drawingCancel.disabled = state.activeTool === 'cursor' && !state.pendingDrawing;
    }
    if (refs.drawingDelete) refs.drawingDelete.disabled = !state.selectedDrawingId;
  }

  function drawingLine(layer, drawing, start, end, label = '') {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(start.x));
    line.setAttribute('y1', String(start.y));
    line.setAttribute('x2', String(end.x));
    line.setAttribute('y2', String(end.y));
    line.dataset.drawingId = drawing.id;
    line.classList.add('terminal-drawing-line', `is-${drawing.type}`);
    line.classList.toggle('is-selected', drawing.id === state.selectedDrawingId);
    line.setAttribute('tabindex', '0');
    line.setAttribute('role', 'button');
    line.setAttribute('aria-label', label || `${drawing.type} drawing`);
    layer.append(line);
    if (!label) return;
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String((start.x + end.x) / 2));
    text.setAttribute('y', String(Math.max(16, ((start.y + end.y) / 2) - 8)));
    text.setAttribute('text-anchor', 'middle');
    text.classList.add('terminal-drawing-label');
    text.textContent = label;
    layer.append(text);
  }

  function renderDrawings() {
    const layer = ensureDrawingLayer();
    const priceSeries = activePriceSeries();
    const width = Math.max(1, refs.chart.clientWidth);
    const height = Math.max(1, refs.chart.clientHeight);
    layer.setAttribute('viewBox', `0 0 ${width} ${height}`);
    layer.replaceChildren();

    state.drawings.forEach((drawing) => {
      const start = {
        x: chart.timeScale().timeToCoordinate(drawing.start.time),
        y: priceSeries.priceToCoordinate(drawing.start.price),
      };
      const end = {
        x: chart.timeScale().timeToCoordinate(drawing.end.time),
        y: priceSeries.priceToCoordinate(drawing.end.price),
      };
      if (![start.x, start.y, end.x, end.y].every(Number.isFinite)) return;
      let label = '';
      if (drawing.type === 'measure') {
        const delta = drawing.end.price - drawing.start.price;
        const percent = drawing.start.price === 0 ? 0 : (delta / Math.abs(drawing.start.price)) * 100;
        label = `${delta >= 0 ? '+' : '−'}${formatPrice(Math.abs(delta))} (${formatSignedPercent(percent)})`;
      }
      drawingLine(layer, drawing, start, end, label);
    });

    state.levels.forEach((level) => {
      const y = priceSeries.priceToCoordinate(level.price);
      if (!Number.isFinite(y)) return;
      drawingLine(layer, { ...level, type: 'level' }, { x: 0, y }, { x: width, y }, formatPrice(level.price));
    });
    setDrawingActionState();
  }

  function drawingPoint(param) {
    if (!param?.point || param.time === undefined || param.time === null) return null;
    const price = activePriceSeries().coordinateToPrice(param.point.y);
    const time = Number(param.time);
    if (!Number.isFinite(price) || !Number.isFinite(time)) return null;
    return { time, price };
  }

  function cancelDrawing() {
    state.pendingDrawing = null;
    state.selectedDrawingId = null;
    setActiveChartTool('cursor');
    renderDrawings();
    setStatus('Drawing cancelled');
  }

  function deleteSelectedDrawing() {
    if (!state.selectedDrawingId) return false;
    const selected = state.selectedDrawingId;
    state.drawings = state.drawings.filter((drawing) => drawing.id !== selected);
    state.levels = state.levels.filter((level) => level.id !== selected);
    state.selectedDrawingId = null;
    persistActiveTab();
    renderDrawings();
    setStatus('Drawing deleted');
    return true;
  }

  function handleChartDrawingClick(param) {
    if (state.activeTool === 'cursor') {
      if (state.selectedDrawingId) {
        state.selectedDrawingId = null;
        renderDrawings();
      }
      return;
    }
    const point = drawingPoint(param);
    if (!point) return;
    if (state.activeTool === 'levels') {
      const level = { id: drawingId('level'), price: point.price };
      state.levels.push(level);
      state.selectedDrawingId = level.id;
      state.pendingDrawing = null;
      setActiveChartTool('cursor', { persist: false });
      persistActiveTab();
      renderDrawings();
      setStatus('Horizontal level added');
      return;
    }
    if (!state.pendingDrawing) {
      state.pendingDrawing = { type: state.activeTool, start: point };
      setDrawingActionState();
      setStatus('Select an ending point · Escape cancels');
      return;
    }
    const drawing = {
      id: drawingId(state.pendingDrawing.type),
      type: state.pendingDrawing.type,
      start: state.pendingDrawing.start,
      end: point,
    };
    state.drawings.push(drawing);
    state.pendingDrawing = null;
    state.selectedDrawingId = drawing.id;
    setActiveChartTool('cursor', { persist: false });
    persistActiveTab();
    renderDrawings();
    setStatus(`${drawing.type === 'measure' ? 'Measurement' : 'Trend line'} added`);
  }

  function syncTicketControls() {
    refs.orderSubmit.classList.toggle('is-short', state.orderSide === 'short');
    refs.submitLabel.textContent = 'Trading unavailable';
    refs.orderSubmit.disabled = true;
    document.querySelectorAll('[data-ticket-direction]').forEach((button) => {
      const active = button.dataset.ticketDirection === state.orderSide;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    document.querySelectorAll('[data-order-type]').forEach((button) => {
      const active = button.dataset.orderType === state.orderType;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });
    refs.orderLeverage.value = String(state.orderLeverage);
    refs.entryPriceRow.hidden = state.orderType === 'market';
    syncExitControl(refs.orderTp, refs.orderTpToggle.checked);
    syncExitControl(refs.orderSl, refs.orderSlToggle.checked);
  }

  function restoreTicketState(saved, { update = true } = {}) {
    const ticket = defaultTicketState({ ticket: saved });
    state.orderSide = ticket.side;
    state.orderType = ticket.type;
    state.orderLeverage = ticket.leverage;
    refs.orderMargin.value = ticket.margin;
    refs.orderEntry.value = ticket.entry;
    refs.orderTpToggle.checked = ticket.tpEnabled;
    refs.orderSlToggle.checked = ticket.slEnabled;
    refs.orderTp.value = ticket.tp;
    refs.orderSl.value = ticket.sl;
    syncTicketControls();
    if (update) updateTicketQuote();
  }

  function persistActiveTab() {
    captureActiveTab();
    persistTabs();
  }

  function formatMoney(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return '—';
    return `$${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function formatWholeMoney(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return '—';
    return `$${Math.round(amount).toLocaleString('en-US')}`;
  }

  function formatSignedPercent(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return '—';
    const sign = amount > 0 ? '+' : amount < 0 ? '−' : '';
    return `${sign}${Math.abs(amount).toFixed(2)}%`;
  }

  function formatPercent(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return '—';
    return `${amount.toFixed(2)}%`;
  }

  function formatSignedMoney(value) {
    if (value === null || value === undefined || value === '') return '—';
    const amount = Number(value);
    if (!Number.isFinite(amount)) return '—';
    const sign = amount > 0 ? '+' : amount < 0 ? '−' : '';
    return `${sign}$${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function ticketPrice() {
    const last = state.lastBar || state.bars[state.bars.length - 1];
    const fallback = state.indexRecord?.quote?.value;
    return Number(last?.close ?? fallback ?? 0);
  }

  function updateTicketInfo() {
    refs.infoPositionSize.textContent = '—';
    refs.infoLiquidation.textContent = '—';
    refs.infoFee.textContent = '—';
    refs.infoTpRow.hidden = !refs.orderTpToggle.checked;
    refs.infoSlRow.hidden = !refs.orderSlToggle.checked;
    refs.infoTpPnl.textContent = '—';
    refs.infoSlPnl.textContent = '—';
    refs.infoTpPnl.classList.remove('is-positive', 'is-negative');
    refs.infoSlPnl.classList.remove('is-positive', 'is-negative');
    refs.submitDetail.textContent = 'Awaiting trusted backend capability';
  }

  function updateTicketQuote(bar) {
    if (bar) state.lastBar = bar;
    refs.shortQuote.textContent = '—';
    refs.longQuote.textContent = '—';
    refs.ticketShortQuote.textContent = '—';
    refs.ticketLongQuote.textContent = '—';
    refs.ticketSpreadBadge.textContent = 'No trusted quote';
    updateTicketInfo();
  }

  function syncExitControl(input, enabled) {
    input.disabled = !enabled;
    input.closest('.terminal-input-shell')?.classList.toggle('is-enabled', enabled);
  }

  function setOrderLeverage(value) {
    const leverage = Number(value);
    if (![1, 2, 5, 10, 20, 50, 100].includes(leverage)) return;
    state.orderLeverage = leverage;
    refs.orderLeverage.value = String(leverage);
    updateTicketInfo();
    persistActiveTab();
  }

  function setOrderType(orderType) {
    if (!['market', 'limit'].includes(orderType)) return;
    state.orderType = orderType;
    document.querySelectorAll('[data-order-type]').forEach((button) => {
      const active = button.dataset.orderType === orderType;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });
    refs.entryPriceRow.hidden = orderType === 'market';
    if (orderType === 'market') {
      refs.orderEntry.value = '';
    } else if (!refs.orderEntry.value || !Number(refs.orderEntry.value)) {
      const mark = ticketPrice();
      refs.orderEntry.value = mark.toFixed(mark < 10 ? 6 : 2);
    }
    updateTicketQuote();
    persistActiveTab();
  }

  function setTicketSide(side, { resetExits = true, update = true } = {}) {
    state.orderSide = side === 'short' ? 'short' : 'long';
    refs.orderSubmit.classList.toggle('is-short', state.orderSide === 'short');
    refs.submitLabel.textContent = 'Trading unavailable';
    refs.orderSubmit.disabled = true;
    document.querySelectorAll('[data-ticket-direction]').forEach((button) => {
      const active = button.dataset.ticketDirection === state.orderSide;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    if (resetExits) {
      refs.orderTp.value = '';
      refs.orderSl.value = '';
    }
    if (update) updateTicketQuote();
    persistActiveTab();
  }

  function openTicket(side, trigger) {
    state.ticketTrigger = trigger || null;
    captureActiveTab();
    const savedTicket = activeTab()?.ticket || defaultTicketState();
    restoreTicketState(savedTicket, { update: false });
    state.orderSide = side === 'short' ? 'short' : 'long';
    syncTicketControls();
    refs.ticketSymbol.textContent = terminalDisplaySymbol();
    renderRecordIdentity(refs.ticketIdentity, state.indexRecord);
    refs.orderSubmit.disabled = true;
    refs.ticket.classList.remove('is-executed');
    refs.ticketNote.textContent = 'Trading is unavailable until an authenticated backend capability and current market fence are connected.';
    refs.ticketNote.classList.add('is-error');
    refs.ticketNote.classList.remove('is-filled');
    refs.ticket.hidden = false;
    refs.ticketBackdrop.hidden = false;
    document.body.classList.add('is-ticket-open');
    updateTicketQuote();
    persistActiveTab();
    window.setTimeout(() => refs.orderMargin.focus(), 0);
  }

  function closeTicket() {
    if (refs.ticket.hidden) return;
    captureActiveTab();
    refs.ticket.hidden = true;
    refs.ticketBackdrop.hidden = true;
    document.body.classList.remove('is-ticket-open');
    refs.ticketTrigger?.focus();
    state.ticketTrigger = null;
    persistTabs();
  }

  function hideOrderToast() {
    if (!refs.orderToast) return;
    refs.orderToast.hidden = true;
    refs.orderToast.classList.remove('is-visible');
  }

  function executeOrder() {
    refs.orderSubmit.disabled = true;
    refs.ticketNote.classList.add('is-error');
    refs.ticketNote.classList.remove('is-filled');
    refs.ticketNote.textContent = 'Trading is unavailable until an authenticated backend capability and current market fence are connected.';
    setStatus('Trading unavailable · trusted server capability required');
    return false;
  }

  function parseCompactAmount(value) {
    const match = String(value || '').replace(/[$,\s]/g, '').match(/^([\d.]+)([KMB])?$/i);
    if (!match) return 0;
    const multiplier = { K: 1e3, M: 1e6, B: 1e9 }[(match[2] || '').toUpperCase()] || 1;
    return Number(match[1]) * multiplier;
  }

  function formatClock(date = new Date()) {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Lagos',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  }

  function catalogRecordFor(value) {
    const catalog = window.BLACKBOOK_INDEX_CATALOG;
    if (!catalog) return null;
    const raw = String(value || '').trim();
    const compact = raw.toUpperCase().replace(/\s+/g, '');
    const withoutQuote = compact.replace(/\/?(?:USDT|USD)$/i, '');
    const candidates = [raw, compact, withoutQuote, withoutQuote.replace(/\//g, '')];
    return candidates.map((candidate) => catalog.get(candidate)).find(Boolean) || null;
  }

  function resolveTarget(value) {
    const record = catalogRecordFor(value);
    return record ? { symbol: record.symbol, record } : { symbol: null, record: null };
  }

  function indexStepForRange(rangeKey) {
    return {
      '1D': 300,
      '5D': 1800,
      '1M': 14400,
      '6M': 86400,
      YTD: 172800,
      '1Y': 259200,
      '5Y': 1209600,
      '10Y': 2419200,
      ALL: 2419200,
    }[rangeKey] || 300;
  }

  const REFERENCE_SERIES_END = Math.floor(Date.UTC(2026, 7, 1) / 1000);

  function makeReferenceSeries(record, rangeKey) {
    const range = record.ranges[rangeKey] || record.ranges['1D'];
    const values = Array.isArray(range?.series) ? range.series : [];
    const step = indexStepForRange(rangeKey);
    const start = REFERENCE_SERIES_END - (Math.max(0, values.length - 1) * step);
    return values.map((value, index) => ({
      time: start + (index * step),
      value: Number(value),
    })).filter((point) => Number.isFinite(point.value));
  }

  function syntheticRandom(seed) {
    let stateValue = seed >>> 0;
    return () => {
      stateValue += 0x6D2B79F5;
      let result = stateValue;
      result = Math.imul(result ^ (result >>> 15), result | 1);
      result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
      return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeSyntheticBars(record, rangeKey) {
    const range = record.ranges[rangeKey] || record.ranges['1D'];
    const values = Array.isArray(range?.series) ? range.series : [];
    const step = indexStepForRange(rangeKey);
    const start = REFERENCE_SERIES_END - (Math.max(0, values.length - 1) * step);
    const seed = [...`${record.symbol}:${rangeKey}`].reduce(
      (total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0,
      17,
    );
    const random = syntheticRandom(seed);
    const baseVolume = parseCompactAmount(record.stats?.volume) || 1e6;
    let previous = Number(values[0]);

    return values.map((value, index) => {
      const close = Number(value);
      const open = index === 0 ? close : previous;
      const body = Math.abs(close - open);
      const minimumSpread = Math.abs(close) * (record.quote?.unit === 'RATIO' ? 0.0005 : 0.0007);
      const spread = Math.max(
        minimumSpread,
        body * 0.55,
        record.quote?.unit === 'RATIO' ? 0.0001 : 0.35,
      );
      const bar = {
        time: start + (index * step),
        open,
        high: Math.max(open, close) + (spread * (0.55 + (random() * 0.65))),
        low: Math.min(open, close) - (spread * (0.55 + (random() * 0.65))),
        close,
        volume: baseVolume * (0.55 + (random() * 1.15)),
      };
      previous = close;
      return bar;
    }).filter((bar) => (
      [bar.time, bar.open, bar.high, bar.low, bar.close, bar.volume].every(Number.isFinite)
    ));
  }

  function updateLegend(point) {
    if (!point) return;
    if (state.syntheticEnabled && Number.isFinite(Number(point.open))) {
      refs.ohlc.textContent = `O ${formatPrice(point.open)}   H ${formatPrice(point.high)}   L ${formatPrice(point.low)}   C ${formatPrice(point.close)}`;
      return;
    }
    refs.ohlc.textContent = `Price ${formatPrice(point.value)}`;
  }

  function resizeSymbolControl(symbol) {
    if (!refs.symbolControl) return;
    const length = String(symbol || '').length;
    const width = Math.min(238, Math.max(150, Math.round(96 + (length * 8.2))));
    refs.symbolControl.style.setProperty('--terminal-symbol-width', `${width}px`);
  }

  function updateHeader() {
    const displaySymbol = terminalDisplaySymbol();
    refs.symbolInput.value = '';
    refs.symbolInput.placeholder = 'Search markets';
    resizeSymbolControl('Search markets');
    updateChartIdentity();
    refs.chartSymbol.textContent = displaySymbol;
    const rangeLabel = state.indexRecord ? state.range : '1D';
    refs.chartSymbol.nextElementSibling.textContent = `· ${rangeLabel}`;
    refs.chart.setAttribute('aria-label', `${displaySymbol} ${rangeLabel} chart`);
    document.body.classList.toggle('is-index-terminal', Boolean(state.indexRecord));
    document.querySelectorAll('[data-range]').forEach((button) => {
      button.hidden = Boolean(state.indexRecord && !state.indexRecord.ranges[button.dataset.range]);
    });
    document.title = `Blackbook Terminal — ${displaySymbol}`;
  }

  function setSeriesData({ view = null } = {}) {
    const referencePoints = makeReferenceSeries(state.indexRecord, state.range);
    const syntheticBars = makeSyntheticBars(state.indexRecord, state.range);
    state.bars = state.syntheticEnabled ? syntheticBars : referencePoints;
    state.lastBar = state.bars[state.bars.length - 1] || null;
    referenceLine.setData(referencePoints);
    candles.setData(syntheticBars);
    volumes.setData(syntheticBars.map((bar) => ({
      time: bar.time,
      value: bar.volume,
      color: bar.close >= bar.open ? 'rgba(8, 185, 150, .38)' : 'rgba(240, 74, 89, .38)',
    })));
    applyChartMode();
    updateLegend(state.lastBar);
    updateChartMetrics();
    updateTicketQuote(state.lastBar);
    applyRange(view);
    restoreExecutionLine();
    renderDrawings();
  }

  function setSyntheticMode(enabled) {
    const nextValue = Boolean(enabled);
    if (state.syntheticEnabled === nextValue) {
      syncSettingsControls();
      return;
    }
    const chartView = captureChartView();
    state.syntheticEnabled = nextValue;
    persistSyntheticPreference();
    if (state.indexRecord) {
      setSeriesData({ view: chartView });
      updateHeader();
      setFeedState('', '');
      setStatus(`${state.indexRecord.name} · ${state.indexRecord.ranges[state.range].label}`);
    } else {
      applyChartMode();
      updateHeader();
    }
    syncSettingsControls();
  }

  function applyRange(view = null) {
    if (!state.bars.length) return;
    const rangeButton = document.querySelector(`[data-range="${state.range}"]`);
    document.querySelectorAll('[data-range]').forEach((button) => {
      const active = button === rangeButton;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    try {
      const restoredView = validChartView(view);
      if (restoredView) chart.timeScale().setVisibleLogicalRange(restoredView);
      else chart.timeScale().fitContent();
    } catch {
      chart.timeScale().fitContent();
    }
  }

  function activateTab(tabId, { remember = true } = {}) {
    const tab = state.tabs.find((candidate) => candidate.id === tabId);
    const record = tabRecord(tab);
    if (!tab || !record) return false;
    const ticketWasOpen = !refs.ticket.hidden;
    captureActiveTab();
    clearExecutionLine();
    state.requestId += 1;
    state.activeTabId = tab.id;
    state.symbol = tab.symbol;
    state.indexRecord = record;
    state.range = validRangeFor(record, tab.range);
    state.activeTool = TAB_TOOLS.has(tab.activeTool) ? tab.activeTool : 'cursor';
    state.gridVisible = tab.gridVisible !== false;
    state.drawings = normalizeDrawings(tab.drawings);
    state.levels = normalizeLevels(tab.levels);
    state.pendingDrawing = null;
    state.selectedDrawingId = null;
    state.executionLineConfig = null;
    restoreTicketState(tab.ticket, { update: false });
    if (remember) rememberTab(tab.id);
    renderTabs();
    updateHeader();
    setActiveChartTool(state.activeTool, { persist: false });
    applyGridVisibility();
    syncSettingsControls();
    setFeedState('', 'Loading…');
    setStatus(`Loading ${state.indexRecord.name}`);
    showMessage('');
    setSeriesData({ view: tab.chartView });
    setFeedState('', '');
    setStatus(`${state.indexRecord.name} · ${state.indexRecord.ranges[state.range].label}`);
    state.marketDataController?.load(state.symbol);
    if (ticketWasOpen) {
      refs.ticket.hidden = false;
      refs.ticketBackdrop.hidden = false;
      document.body.classList.add('is-ticket-open');
      refs.ticket.classList.remove('is-executed');
      refs.orderSubmit.disabled = true;
      refs.ticketNote.textContent = 'Trading is unavailable until an authenticated backend capability and current market fence are connected.';
      refs.ticketNote.classList.add('is-error');
      refs.ticketNote.classList.remove('is-filled');
      refs.ticketSymbol.textContent = terminalDisplaySymbol();
      renderRecordIdentity(refs.ticketIdentity, state.indexRecord);
      updateTicketQuote();
    }
    persistTabs();
    return true;
  }

  function openMarketTab(symbol) {
    const target = resolveTarget(symbol);
    if (!target.record) {
      setFeedState('error', 'Index unavailable');
      setStatus('Search for a Blackbook index');
      showMessage('Only Blackbook indices are available in this terminal.');
      return false;
    }
    const existing = state.tabs.find((tab) => tab.symbol === target.symbol);
    if (existing) return activateTab(existing.id);
    captureActiveTab();
    const tab = createTabState(target.symbol, target.record);
    state.tabs.push(tab);
    return activateTab(tab.id);
  }

  function closeMarketTab(tabId) {
    if (state.tabs.length <= 1) return false;
    const index = state.tabs.findIndex((tab) => tab.id === tabId);
    if (index < 0) return false;
    const wasActive = state.activeTabId === tabId;
    captureActiveTab();
    state.tabs.splice(index, 1);
    state.tabHistory = state.tabHistory.filter((id) => id !== tabId);
    if (!wasActive) {
      renderTabs();
      persistTabs();
      return true;
    }
    const previousTab = state.tabHistory.find((id) => state.tabs.some((tab) => tab.id === id));
    const fallbackTab = state.tabs[Math.max(0, index - 1)] || state.tabs[0];
    state.activeTabId = null;
    state.tabHistory = state.tabHistory.filter((id) => id !== tabId);
    activateTab(previousTab || fallbackTab.id);
    return true;
  }

  function loadMarket(symbol = state.symbol) {
    return openMarketTab(symbol);
  }

  function initializeTabs(requestedSymbol) {
    const stored = readStoredTabs();
    state.tabs = stored.tabs;
    state.tabHistory = stored.tabHistory;
    const requested = resolveTarget(requestedSymbol);
    if (!state.tabs.length) {
      const initial = requested.record || catalogRecordFor('RMD');
      if (initial) state.tabs = [createTabState(initial.symbol, initial)];
    }
    if (!state.tabs.length) {
      showMessage('No Blackbook indices are available.');
      return;
    }
    if (requested.record) {
      const existing = state.tabs.find((tab) => tab.symbol === requested.record.symbol);
      if (existing) {
        activateTab(existing.id);
      } else {
        openMarketTab(requested.record.symbol);
      }
      return;
    }
    activateTab(stored.activeTabId && state.tabs.some((tab) => tab.id === stored.activeTabId)
      ? stored.activeTabId
      : state.tabs[0].id);
  }

  function setActiveChartTool(tool, { persist = true } = {}) {
    const nextTool = TAB_TOOLS.has(tool) ? tool : 'cursor';
    if (state.pendingDrawing && state.pendingDrawing.type !== nextTool) state.pendingDrawing = null;
    state.activeTool = nextTool;
    setDrawingActionState();
    if (nextTool !== 'cursor') {
      setStatus(nextTool === 'levels'
        ? 'Select a price for the horizontal level · Escape cancels'
        : 'Select a starting point · Escape cancels');
    }
    if (persist) persistActiveTab();
  }

  function takeScreenshot() {
    try {
      const canvas = chart.takeScreenshot();
      const link = document.createElement('a');
      link.download = `${state.symbol.toLowerCase()}-${state.range}-chart.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setStatus('Chart image downloaded');
    } catch (error) {
      setStatus('Chart image could not be downloaded');
    }
  }

  document.querySelectorAll('[data-range]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!state.indexRecord?.ranges[button.dataset.range]) return;
      state.range = button.dataset.range;
      const tab = activeTab();
      if (tab) {
        tab.range = state.range;
        tab.chartView = null;
      }
      updateHeader();
      setSeriesData();
      setFeedState('', '');
      setStatus(`${state.indexRecord.name} · ${state.indexRecord.ranges[state.range].label}`);
      persistActiveTab();
    });
  });

  document.querySelectorAll('[data-tool]').forEach((button) => {
    button.addEventListener('click', () => setActiveChartTool(button.dataset.tool));
  });

  const setMarketPanelOpen = (open, { restoreMarkets = false } = {}) => {
    const isOpen = Boolean(open);
    refs.workspace?.classList.toggle('is-market-panel-open', isOpen);
    refs.marketDataRoot?.classList.toggle('is-mobile-open', isOpen);
    refs.marketDataRoot?.classList.toggle('is-market-panel-open', isOpen);
    refs.marketPanelToggle?.setAttribute('aria-expanded', String(isOpen));
    refs.orderBookSideItem?.setAttribute('aria-expanded', String(isOpen));
    refs.orderBookSideItem?.setAttribute('title', isOpen ? 'Close order book' : 'Open order book');
    refs.orderBookSideItem?.setAttribute('aria-label', isOpen ? 'Close order book' : 'Open order book');
    refs.orderBookSideItem?.classList.toggle('is-active', isOpen);
    if (isOpen) {
      document.querySelectorAll('[data-side-item]').forEach((item) => {
        item.classList.toggle('is-active', item === refs.orderBookSideItem);
      });
    }
    if (!isOpen && restoreMarkets) {
      document.querySelectorAll('[data-side-item]').forEach((item) => {
        item.classList.toggle('is-active', item === refs.marketsSideItem);
      });
    }
  };

  document.querySelectorAll('[data-side-action]').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-side-item]').forEach((item) => item.classList.toggle('is-active', item === button));
      if (button.dataset.sideAction === 'orderbook') {
        const isOpen = refs.marketDataRoot?.classList.contains('is-market-panel-open');
        setMarketPanelOpen(!isOpen, { restoreMarkets: isOpen });
        return;
      }
      if (button.dataset.sideAction === 'settings') {
        setMarketPanelOpen(false);
        setSettingsOpen(refs.settingsMenu?.hidden !== false);
      }
    });
  });

  function openMarketPicker() {
    closeTerminalSearch();
    if (refs.tabOverflowMenu) refs.tabOverflowMenu.hidden = true;
    refs.tabOverflow?.setAttribute('aria-expanded', 'false');
    refs.symbolInput.value = '';
    refs.symbolInput.focus();
    renderTerminalSearch('');
  }

  refs.tabAdd?.addEventListener('click', openMarketPicker);

  refs.tabStrip?.addEventListener('click', (event) => {
    const closeButton = event.target.closest('[data-tab-close]');
    if (closeButton) {
      event.preventDefault();
      event.stopPropagation();
      closeMarketTab(closeButton.closest('[data-tab-id]')?.dataset.tabId);
      return;
    }
    const tab = event.target.closest('[data-tab-id]');
    if (tab) activateTab(tab.dataset.tabId);
  });

  refs.tabStrip?.addEventListener('keydown', (event) => {
    const tabButton = event.target.closest('[data-tab-select]');
    if (!tabButton) return;
    const wrapper = tabButton.closest('[data-tab-id]');
    const index = state.tabs.findIndex((tab) => tab.id === wrapper?.dataset.tabId);
    if (index < 0) return;
    if (event.key === 'Delete') {
      event.preventDefault();
      const closed = closeMarketTab(state.tabs[index].id);
      if (closed) window.requestAnimationFrame(() => {
        refs.tabStrip.querySelector('[data-tab-select][tabindex="0"]')?.focus();
      });
      return;
    }
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === 'ArrowLeft' ? -1 : 1;
    if (event.altKey && event.shiftKey && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
      const target = Math.max(0, Math.min(state.tabs.length - 1, index + direction));
      if (target !== index) {
        const [moved] = state.tabs.splice(index, 1);
        state.tabs.splice(target, 0, moved);
        renderTabs();
        persistTabs();
      }
      window.requestAnimationFrame(() => {
        refs.tabStrip.querySelector('[data-tab-select][tabindex="0"]')?.focus();
      });
      return;
    }
    let target = event.key === 'Home' ? 0 : event.key === 'End' ? state.tabs.length - 1 : index + direction;
    target = (target + state.tabs.length) % state.tabs.length;
    activateTab(state.tabs[target].id);
    window.requestAnimationFrame(() => {
      refs.tabStrip.querySelector('[data-tab-select][tabindex="0"]')?.focus();
    });
  });

  refs.tabOverflow?.addEventListener('click', (event) => {
    event.stopPropagation();
    const nextOpen = refs.tabOverflowMenu.hidden;
    refs.tabOverflowMenu.hidden = !nextOpen;
    refs.tabOverflow.setAttribute('aria-expanded', String(nextOpen));
  });

  refs.tabOverflowMenu?.addEventListener('click', (event) => {
    const item = event.target.closest('[data-overflow-tab]');
    if (!item) return;
    refs.tabOverflowMenu.hidden = true;
    refs.tabOverflow.setAttribute('aria-expanded', 'false');
    activateTab(item.dataset.overflowTab);
  });

  let draggedTabId = null;
  refs.tabStrip?.addEventListener('dragstart', (event) => {
    const tab = event.target.closest('[data-tab-id]');
    if (!tab) return;
    draggedTabId = tab.dataset.tabId;
    tab.classList.add('is-dragging');
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', draggedTabId);
  });
  refs.tabStrip?.addEventListener('dragover', (event) => {
    const tab = event.target.closest('[data-tab-id]');
    if (!draggedTabId || !tab || tab.dataset.tabId === draggedTabId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    refs.tabStrip.querySelectorAll('[data-tab-id]').forEach((item) => item.classList.toggle('is-drag-target', item === tab));
  });
  refs.tabStrip?.addEventListener('drop', (event) => {
    const target = event.target.closest('[data-tab-id]');
    if (!draggedTabId || !target || target.dataset.tabId === draggedTabId) return;
    event.preventDefault();
    const from = state.tabs.findIndex((tab) => tab.id === draggedTabId);
    const to = state.tabs.findIndex((tab) => tab.id === target.dataset.tabId);
    if (from < 0 || to < 0) return;
    const [moved] = state.tabs.splice(from, 1);
    state.tabs.splice(to, 0, moved);
    renderTabs();
    persistTabs();
  });
  refs.tabStrip?.addEventListener('dragend', () => {
    draggedTabId = null;
    refs.tabStrip.querySelectorAll('[data-tab-id]').forEach((item) => item.classList.remove('is-dragging', 'is-drag-target'));
  });
  window.addEventListener('resize', () => { updateTabOverflow(); renderDrawings(); });
  window.addEventListener('beforeunload', persistActiveTab);

  document.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      if (button.dataset.action === 'fit') {
        chart.timeScale().fitContent();
        persistActiveTab();
      }
      if (button.dataset.action === 'screenshot') takeScreenshot();
      if (button.dataset.action === 'settings') {
        setMarketPanelOpen(false);
        setSettingsOpen(refs.settingsMenu?.hidden !== false);
      }
    });
  });

  refs.settingsClose?.addEventListener('click', () => {
    setSettingsOpen(false);
    refs.settingsButton?.focus();
  });
  refs.syntheticsToggle?.addEventListener('change', () => {
    setSyntheticMode(refs.syntheticsToggle.checked);
  });
  refs.gridToggle?.addEventListener('change', () => {
    state.gridVisible = refs.gridToggle.checked;
    applyGridVisibility();
    persistActiveTab();
  });

  document.querySelectorAll('[data-order-side]').forEach((button) => {
    button.addEventListener('click', () => {
      if (button.disabled) {
        setStatus('Trading unavailable · trusted server capability required');
        return;
      }
      openTicket(button.dataset.orderSide, button);
    });
  });

  refs.drawingCancel?.addEventListener('click', cancelDrawing);
  refs.drawingDelete?.addEventListener('click', deleteSelectedDrawing);

  refs.marketPanelToggle?.addEventListener('click', () => {
    const isOpen = refs.marketDataRoot?.classList.contains('is-mobile-open');
    setMarketPanelOpen(!isOpen, { restoreMarkets: isOpen });
  });
  refs.marketPanelClose?.addEventListener('click', () => {
    setMarketPanelOpen(false, { restoreMarkets: true });
    (refs.orderBookSideItem || refs.marketPanelToggle)?.focus();
  });

  document.querySelectorAll('[data-ticket-direction]').forEach((button) => {
    button.addEventListener('click', () => setTicketSide(button.dataset.ticketDirection));
  });

  document.querySelectorAll('[data-order-type]').forEach((button) => {
    button.addEventListener('click', () => setOrderType(button.dataset.orderType));
  });

  refs.orderLeverage.addEventListener('change', () => setOrderLeverage(refs.orderLeverage.value));

  refs.orderMargin.addEventListener('input', () => { updateTicketInfo(); persistActiveTab(); });
  refs.orderEntry.addEventListener('input', () => { updateTicketInfo(); persistActiveTab(); });
  refs.orderTp.addEventListener('input', () => { updateTicketInfo(); persistActiveTab(); });
  refs.orderSl.addEventListener('input', () => { updateTicketInfo(); persistActiveTab(); });
  refs.orderTpToggle.addEventListener('change', () => {
    syncExitControl(refs.orderTp, refs.orderTpToggle.checked);
    updateTicketInfo();
    persistActiveTab();
  });
  refs.orderSlToggle.addEventListener('change', () => {
    syncExitControl(refs.orderSl, refs.orderSlToggle.checked);
    updateTicketInfo();
    persistActiveTab();
  });
  refs.ticketClose.addEventListener('click', closeTicket);
  refs.ticketBackdrop.addEventListener('click', closeTicket);
  refs.orderToastClose.addEventListener('click', hideOrderToast);
  refs.ticketForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!refs.orderSubmit.disabled) executeOrder();
  });
  document.addEventListener('keydown', (event) => {
    const editing = event.target instanceof HTMLInputElement
      || event.target instanceof HTMLTextAreaElement
      || event.target instanceof HTMLSelectElement;
    if ((event.key === 'Delete' || event.key === 'Backspace') && state.selectedDrawingId && !editing) {
      event.preventDefault();
      deleteSelectedDrawing();
      return;
    }
    if (event.key !== 'Escape') return;
    if (state.pendingDrawing || state.activeTool !== 'cursor' || state.selectedDrawingId) {
      event.preventDefault();
      cancelDrawing();
      return;
    }
    if (refs.settingsMenu && !refs.settingsMenu.hidden) {
      event.preventDefault();
      setSettingsOpen(false);
      refs.settingsButton?.focus();
      return;
    }
    if (refs.marketDataRoot?.classList.contains('is-market-panel-open')) {
      setMarketPanelOpen(false, { restoreMarkets: true });
      (refs.orderBookSideItem || refs.marketPanelToggle)?.focus();
      return;
    }
    closeTicket();
  });

  function submitSymbol() {
    const symbol = refs.symbolInput.value.trim();
    if (symbol) {
      closeTerminalSearch();
      openMarketTab(symbol);
    }
  }

  refs.symbolSubmit.addEventListener('click', submitSymbol);
  refs.symbolInput.addEventListener('focus', () => {
    refs.symbolInput.select();
    renderTerminalSearch('');
  });
  refs.symbolInput.addEventListener('input', () => renderTerminalSearch(refs.symbolInput.value));
  refs.symbolInput.addEventListener('keydown', (event) => {
    const buttons = [...(refs.searchDropdown?.querySelectorAll('[data-search-symbol]') || [])];
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (refs.searchDropdown.hidden) renderTerminalSearch(refs.symbolInput.value);
      setActiveSearchResult(activeSearchIndex + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (refs.searchDropdown.hidden) renderTerminalSearch(refs.symbolInput.value);
      setActiveSearchResult(activeSearchIndex < 0 ? buttons.length - 1 : activeSearchIndex - 1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (!refs.searchDropdown.hidden && activeSearchIndex >= 0 && buttons[activeSearchIndex]) buttons[activeSearchIndex].click();
      else submitSymbol();
    } else if (event.key === 'Escape') {
      closeTerminalSearch();
      refs.symbolInput.blur();
    }
  });
  document.addEventListener('pointerdown', (event) => {
    if (!event.target.closest('.terminal-symbol-control')) closeTerminalSearch();
    if (!event.target.closest('[data-settings-menu]')
      && !event.target.closest('[data-action="settings"]')
      && !event.target.closest('[data-side-action="settings"]')) {
      setSettingsOpen(false);
    }
    if (!event.target.closest('.terminal-market-tabs')) {
      refs.tabOverflowMenu.hidden = true;
      refs.tabOverflow?.setAttribute('aria-expanded', 'false');
    }
  });

  chart.subscribeClick(handleChartDrawingClick);
  chart.subscribeCrosshairMove((param) => {
    if (!param || !param.seriesData) return;
    const point = param.seriesData.get(activePriceSeries());
    if (point && (state.syntheticEnabled ? 'close' in point : 'value' in point)) updateLegend(point);
  });
  chart.timeScale().subscribeVisibleLogicalRangeChange(() => renderDrawings());

  window.setInterval(() => {
    refs.clock.textContent = `${formatClock()} WAT`;
  }, 1000);
  refs.clock.textContent = `${formatClock()} WAT`;

  const routeParams = new URLSearchParams(window.location.search);
  const requestedSymbol = routeParams.get('symbol');
  initializeTabs(requestedSymbol);
  const requestedSide = routeParams.get('side');
  if (requestedSide === 'long' || requestedSide === 'short') {
    const requestedAmount = Math.max(1, Number(routeParams.get('amount')) || 1000);
    refs.orderMargin.value = String(Math.round(requestedAmount));
    openTicket(requestedSide);
  }
})();
