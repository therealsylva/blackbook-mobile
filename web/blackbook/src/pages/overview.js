(function initialiseIndexOverview() {
  'use strict';

  const escapeHtml = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const isNegative = (value) => Number(value) < 0;
  const signed = (value, suffix = '') => `${isNegative(value) ? '−' : '+'}${Math.abs(Number(value)).toFixed(2)}${suffix}`;
  const chartColorFor = (value) => (isNegative(value) ? '#f23645' : '#089981');
  const chartInkFor = () => '#ffffff';
  const indexTypeLabel = (category) => ({
    Artists: 'Artist index',
    Athletes: 'Athlete index',
    Clubs: 'Club index',
    Products: 'Product index',
    'Public Figures': 'Public figure index',
    Leagues: 'League index',
    'Relative Value': 'Relative value index',
  }[category] || `${category} index`);

  function entityName(record) {
    return String(record.name || '').replace(/\s+Index$/i, '');
  }

  function relatedDescription(record) {
    const name = entityName(record);
    if (record.category === 'Relative Value') return `Compare the two indices behind ${name}.`;
    return `Compare the indices closest to ${name}.`;
  }

  function newsDescription(record) {
    return `${entityName(record)} performance and the stories behind the move.`;
  }

  function methodologyDescription(record) {
    return `The performance, attention, and activity signals followed around ${entityName(record)}.`;
  }

  function indexCoverage(record) {
    const name = entityName(record);
    const [primaryComponent, secondaryComponent] = record.components;
    const direction = isNegative(record.quote.changePct) ? 'pullback' : 'advance';
    return [
      {
        time: '2 days ago',
        source: 'Blackbook Markets',
        title: `What is driving ${name}’s latest index ${direction}`,
        summary: `${primaryComponent.label} and ${secondaryComponent.label.toLowerCase()} are among the signals shaping the current ${record.symbol} reading.`,
      },
      {
        time: '3 days ago',
        source: 'Blackbook Index Desk',
        title: `${primaryComponent.label} moves into focus for ${name}`,
        summary: `${primaryComponent.detail} The signal currently carries a ${primaryComponent.weight} weight in the index framework.`,
      },
      {
        time: '4 days ago',
        source: 'Blackbook Research',
        title: `How the signal mix behind ${name} is being read`,
        summary: `${record.methodology[0]} The combined reading helps explain movement that a single headline cannot capture.`,
      },
      {
        time: '5 days ago',
        source: 'Blackbook Markets',
        title: `${name} index range puts the recent move in context`,
        summary: `${record.symbol} is trading between ${formatQuote(record.stats.dayRange[0], record.quote.unit)} and ${formatQuote(record.stats.dayRange[1], record.quote.unit)} in the current session range.`,
      },
    ];
  }

  function formatQuote(value, unit) {
    if (unit === 'RATIO') return Number(value).toFixed(4);
    return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function parseCompactAmount(value) {
    const match = String(value).replace(/[$,\s]/g, '').match(/^([\d.]+)([KMB])?$/i);
    if (!match) return 0;
    const multiplier = { K: 1e3, M: 1e6, B: 1e9 }[(match[2] || '').toUpperCase()] || 1;
    return Number(match[1]) * multiplier;
  }

  function formatVolume(value) {
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return Math.round(value).toLocaleString('en-US');
  }

  function assetClasses(asset) {
    if (asset.type === 'pair') return 'is-pair';
    if (asset.type === 'person') return 'is-person';
    const modifiers = [
      asset.alt === 'ChatGPT' ? 'is-chatgpt' : '',
      asset.alt === 'Real Madrid' ? 'is-tall-logo' : '',
      asset.alt === 'Liverpool' ? 'is-liverpool' : '',
      asset.alt === 'Claude' ? 'is-claude' : '',
      asset.alt === 'Spotify' ? 'is-spotify' : '',
      asset.alt === 'NBA' ? 'is-nba' : '',
    ].filter(Boolean).join(' ');
    return `is-logo${modifiers ? ` ${modifiers}` : ''}`;
  }

  function renderAsset(record, className) {
    const currentAsset = record.asset;
    if (currentAsset.type === 'pair') {
      return `<span class="${className} ${assetClasses(currentAsset)}" aria-label="${escapeHtml(currentAsset.items.map((item) => item.alt).join(' and '))}">${currentAsset.items.map((item) => `<span><img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt)}"></span>`).join('')}</span>`;
    }

    return `<span class="${className} ${assetClasses(currentAsset)}"><img src="${escapeHtml(currentAsset.src)}" alt="${escapeHtml(currentAsset.alt)}"></span>`;
  }

  function renderSearchAsset(record) {
    const currentAsset = record.asset;
    const searchAssetClass = (asset) => `${asset.type === 'person' ? 'person-mark' : 'logo-mark'}${asset.alt === 'iPhone' ? ' dark-mark' : ''}`;
    if (currentAsset.type === 'pair') {
      return `<span class="symbol-result-pair-icons" aria-label="${escapeHtml(currentAsset.items.map((item) => item.alt).join(' and '))}">${currentAsset.items.map((item) => `<span class="symbol-result-icon entity-mark ${searchAssetClass(item)}"><img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt)}"></span>`).join('')}</span>`;
    }
    return `<span class="symbol-result-icon entity-mark ${searchAssetClass(currentAsset)}"><img src="${escapeHtml(currentAsset.src)}" alt="${escapeHtml(currentAsset.alt)}"></span>`;
  }

  function routeFor(record) {
    return `./index-overview.html?symbol=${encodeURIComponent(record.symbol)}`;
  }

  function chartRouteFor(record) {
    return `./terminal.html?symbol=${encodeURIComponent(record.symbol)}`;
  }

  function renderSearchResults(catalog) {
    const container = document.getElementById('symbolSearchResults');
    const count = document.getElementById('symbolSearchCount');
    if (!container) return;

    container.innerHTML = catalog.list.map((record) => {
      const label = entityName(record);
      const pairedClass = record.asset.type === 'pair' ? ' symbol-result-paired' : '';
      const searchSymbol = `${record.symbol}${record.quote.unit === 'POINT' ? '/USD' : ''}`;
      return `<button class="symbol-result${pairedClass}" type="button" data-index-symbol="${escapeHtml(record.symbol)}" data-category="${escapeHtml(record.category)}" data-search="${escapeHtml(`${record.symbol} ${searchSymbol} ${entityName(record)} ${record.category}`)}">${renderSearchAsset(record)}<span class="symbol-result-copy"><strong>${escapeHtml(searchSymbol)}</strong><small>${escapeHtml(label)}</small></span><span class="symbol-result-meta"><small>${escapeHtml(record.category)}</small></span></button>`;
    }).join('');

    if (count) count.textContent = `${catalog.list.length} indices`;
  }

  function chartGeometry(values, referenceValue) {
    const scaleValues = Number.isFinite(referenceValue) ? [...values, referenceValue] : values;
    const minValue = Math.min(...scaleValues);
    const maxValue = Math.max(...scaleValues);
    const padding = Math.max((maxValue - minValue) * 0.12, Math.abs(maxValue) * 0.003, 0.0005);
    const lower = minValue - padding;
    const upper = maxValue + padding;
    const span = upper - lower || 1;
    const yFor = (value) => 274 - ((value - lower) / span) * 248;
    const coordinates = values.map((value, index) => {
      const x = (index / (values.length - 1)) * 1000;
      const y = yFor(value);
      return [x.toFixed(2), y.toFixed(2)];
    });
    const line = coordinates.map(([x, y], index) => `${index ? 'L' : 'M'}${x},${y}`).join(' ');
    return {
      linePath: line,
      fillPath: `${line} L1000,292 L0,292 Z`,
      lower,
      upper,
      lastY: yFor(values[values.length - 1]),
      referenceY: Number.isFinite(referenceValue) ? yFor(referenceValue) : null,
    };
  }

  function axisValue(value, unit) {
    if (unit === 'RATIO') return Number(value).toFixed(3);
    const roundedValue = Math.abs(value) >= 1000 ? Math.round(value) : Number(value.toFixed(1));
    return Number(roundedValue).toLocaleString('en-US');
  }

  function makeRelatedCard(record) {
    const changeClass = isNegative(record.quote.changePct) ? 'is-negative' : '';
    return `<a class="overview-related-card" href="${routeFor(record)}" data-index-symbol="${escapeHtml(record.symbol)}"><span class="overview-related-top">${renderAsset(record, 'overview-related-asset')}<span><strong>${escapeHtml(record.symbol)}</strong><small>${escapeHtml(entityName(record))}</small></span></span><span class="overview-related-quote"><span data-related-price>${formatQuote(record.quote.value, record.quote.unit)}</span><b class="${changeClass}" data-related-change>${signed(record.quote.changePct, '%')}</b></span></a>`;
  }

  function renderOverview(record, catalog) {
    const root = document.getElementById('overviewRoot');
    if (!root) return;

    const related = record.related.map((symbol) => catalog.get(symbol)).filter(Boolean);
    const quoteClass = isNegative(record.quote.changePct) ? 'is-negative' : '';
    const initialVolume = parseCompactAmount(record.stats.volume);
    const snapshotWindow = record.ranges['1D'].series.slice(-36);
    const initialLow = Math.min(...snapshotWindow);
    const initialHigh = Math.max(...snapshotWindow);
    const initialVolatility = ((initialHigh - initialLow) / record.quote.value) * 100;
    const newsFeed = [...record.news, ...indexCoverage(record)]
      .map((item) => ({ ...item, subject: record }));
    const leadNews = newsFeed[0];
    const topNews = newsFeed.slice(1, 4);
    const latestNews = newsFeed.slice(4);
    const stats = [
      { key: 'last', label: 'Last price', value: formatQuote(record.quote.value, record.quote.unit) },
      { key: 'change', label: '1D change', value: signed(record.quote.changePct, '%'), tone: quoteClass || 'is-positive' },
      { key: 'open', label: 'Open', value: formatQuote(record.stats.open, record.quote.unit) },
      { key: 'previous-close', label: 'Previous close', value: formatQuote(record.stats.previousClose, record.quote.unit) },
      { key: 'day-range', label: 'Day range', value: `${formatQuote(record.stats.dayRange[0], record.quote.unit)} – ${formatQuote(record.stats.dayRange[1], record.quote.unit)}` },
      { key: 'volume', label: 'Volume', value: formatVolume(initialVolume) },
      { key: 'density', label: 'Signal density', value: `${record.stats.density}/100` },
      { key: 'volatility', label: 'Snapshot volatility', value: `${initialVolatility.toFixed(2)}%` },
    ];

    root.innerHTML = `
      <div class="overview-breadcrumbs" aria-label="Breadcrumb"><a href="./index.html#market-overview">Markets</a><span>/</span><a href="./index.html#stocks">${escapeHtml(record.category)}</a><span>/</span><span>${escapeHtml(record.symbol)}</span></div>
      <section class="overview-hero" aria-labelledby="assetTitle">
        ${renderAsset(record, 'overview-identity')}
        <div class="overview-hero-copy">
          <div class="overview-instrument-line"><strong>${escapeHtml(record.symbol)}${record.quote.unit === 'POINT' ? '/USD' : ''}</strong><span>${escapeHtml(indexTypeLabel(record.category))}</span></div>
          <h1 id="assetTitle">${escapeHtml(record.name)}</h1>
          <div class="overview-symbol-row"><span class="overview-market-label">Blackbook reference index</span><a class="overview-view-chart" href="${chartRouteFor(record)}" aria-label="Open ${escapeHtml(record.symbol)} in terminal">Open in terminal<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"></path></svg></a></div>
        </div>
        <div class="overview-quote-block">
          <div class="overview-headline-price"><div class="overview-price-line"><span class="overview-price" data-current-price>${formatQuote(record.quote.value, record.quote.unit)}</span><span class="overview-price-unit">${escapeHtml(record.quote.unit)}</span></div><div class="overview-change-line"><strong class="overview-change ${quoteClass}" data-current-change>${signed(record.quote.changePct, '%')}</strong><span data-active-period>1D</span></div></div>
          <div class="overview-order-actions" aria-label="Trade ${escapeHtml(record.symbol)}"><button type="button" data-overview-ticket-open="buy" aria-haspopup="dialog" aria-controls="overviewTradeTicket">Buy</button><button type="button" data-overview-ticket-open="sell" aria-haspopup="dialog" aria-controls="overviewTradeTicket">Sell</button></div>
        </div>
      </section>

      <nav class="overview-tabs" role="tablist" aria-label="${escapeHtml(entityName(record))} sections">
        <button class="overview-tab active" type="button" role="tab" data-target="overview" aria-selected="true">Overview</button>
        <button class="overview-tab" type="button" role="tab" data-target="news" aria-selected="false" tabindex="-1">News</button>
        <button class="overview-tab" type="button" role="tab" data-target="methodology" aria-selected="false" tabindex="-1">Methodology</button>
      </nav>

      <section class="overview-tab-panel is-active" id="overview" role="tabpanel" aria-label="${escapeHtml(entityName(record))} overview">
        <div class="overview-market-workspace">
          <div class="overview-chart-panel" data-chart-panel>
            <div class="overview-chart-topline"><div class="overview-chart-heading"><strong>Price history</strong><span data-range-caption>1 day performance</span></div><div class="overview-chart-controls"><div class="overview-range-grid" aria-label="Price chart range">${catalog.rangeOrder.map((key) => { const range = record.ranges[key]; return `<button class="overview-range${key === '1D' ? ' active' : ''}" type="button" data-range="${key}" aria-pressed="${key === '1D'}">${escapeHtml(range.label)}</button>`; }).join('')}</div><div class="overview-chart-actions" aria-label="Chart utilities"><button type="button" title="Download chart" aria-label="Download chart" data-chart-download><svg viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5M4 20h16"></path></svg></button><button type="button" title="Expand chart" aria-label="Expand chart" data-chart-expand><svg viewBox="0 0 24 24"><path d="M9 3H3v6M15 3h6v6M9 21H3v-6M21 15v6h-6"></path></svg></button></div></div></div>
            <div class="overview-chart-frame"><svg class="overview-line-chart" viewBox="0 0 1000 300" preserveAspectRatio="none" role="img" aria-label="${escapeHtml(record.name)} price chart"><defs><linearGradient id="overviewChartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#089981" stop-opacity=".16"></stop><stop offset=".6" stop-color="#089981" stop-opacity=".045"></stop><stop offset="1" stop-color="#089981" stop-opacity="0"></stop></linearGradient></defs><path class="chart-reference-line" data-prev-close-line></path><path class="chart-fill" data-chart-fill></path><path class="chart-line" data-chart-line></path></svg><span class="overview-prev-close-marker" data-prev-close-marker>Prev close&nbsp; ${formatQuote(record.stats.previousClose, record.quote.unit)}</span><span class="overview-current-marker" data-current-marker></span><div class="overview-y-axis" data-y-axis></div><div class="overview-x-axis" data-x-axis></div></div>
          </div>

        </div>

          <button class="overview-trade-backdrop" type="button" data-overview-ticket-backdrop hidden aria-label="Close order ticket"></button>
          <aside class="overview-trade-ticket" id="overviewTradeTicket" data-overview-ticket hidden role="dialog" aria-modal="true" aria-labelledby="overviewTradeTitle">
            <div class="overview-trade-heading"><div><span id="overviewTradeTitle">Trade</span><strong>${escapeHtml(record.symbol)}${record.quote.unit === 'POINT' ? '/USD' : ''}</strong></div><div><small>Market</small><button class="overview-trade-close" type="button" data-overview-ticket-close aria-label="Close order ticket">×</button></div></div>
            <div class="overview-trade-sides" role="group" aria-label="Order side"><button class="is-active" type="button" data-trade-side="buy" aria-pressed="true">Buy</button><button type="button" data-trade-side="sell" aria-pressed="false">Sell</button></div>
            <form class="overview-trade-form" data-trade-form>
              <label for="overviewOrderValue">Order value</label>
              <div class="overview-trade-input"><span>$</span><input id="overviewOrderValue" data-trade-amount type="number" min="1" step="1" inputmode="decimal" value="1000" aria-label="Order value in USD"><b>USD</b></div>
              <div class="overview-trade-presets" aria-label="Preset order values"><button type="button" data-trade-preset="250">$250</button><button type="button" data-trade-preset="1000">$1K</button><button type="button" data-trade-preset="5000">$5K</button></div>
              <div class="overview-trade-summary"><div><span>Market price</span><strong data-trade-price>${formatQuote(record.quote.value, record.quote.unit)}</strong></div><div><span>Estimated quantity</span><strong data-trade-estimate>—</strong></div></div>
              <button class="overview-trade-submit" type="submit" data-trade-submit disabled aria-describedby="overview-trading-unavailable">Trading unavailable</button><p class="overview-trade-unavailable" id="overview-trading-unavailable" data-overview-trade-unavailable hidden role="status">Trading is unavailable until an authenticated backend capability and current market fence are connected.</p>
              <a class="overview-trade-advanced" href="${chartRouteFor(record)}">Open advanced terminal</a>
            </form>
          </aside>
          <aside class="overview-order-toast" data-overview-order-toast hidden role="status" aria-live="polite">
            <span class="overview-order-toast-check" aria-hidden="true">✓</span>
            <div class="overview-order-toast-copy"><strong>Trading unavailable</strong><span data-overview-order-market>${escapeHtml(record.symbol)} market order</span><p><b data-overview-order-side>Buy</b> <span data-overview-order-details></span></p></div>
            <button type="button" class="overview-order-toast-close" data-overview-order-toast-close aria-label="Dismiss order notification">×</button>
          </aside>

        <section class="overview-snapshot" aria-labelledby="snapshotTitle"><div class="overview-content-heading"><div><span>Market data</span><h2 id="snapshotTitle">Key data</h2></div><p>Current session and index-level statistics.</p></div><div class="overview-stats">${stats.map(({ key, label, value, tone = '' }) => `<div class="overview-stat"><span>${escapeHtml(label)}</span><strong class="${tone}" data-stat="${key}">${escapeHtml(value)}</strong></div>`).join('')}</div></section>

        <section class="overview-profile-grid" aria-label="About and composition"><article class="overview-profile-copy"><span>Index profile</span><h2>About ${escapeHtml(entityName(record))}</h2><p>${escapeHtml(record.about)}</p></article><article class="overview-composition"><div class="overview-content-heading"><div><span>Current framework</span><h2>Index composition</h2></div></div><div class="overview-component-list">${record.components.map((component) => `<div class="overview-component"><div><strong>${escapeHtml(component.label)}</strong><span>${escapeHtml(component.detail)}</span></div><b>${escapeHtml(component.weight)}</b></div>`).join('')}</div></article></section>

        <section class="overview-related-section" aria-label="Related indices for ${escapeHtml(entityName(record))}"><div class="overview-content-heading"><div><span>Market network</span><h2>Related indices</h2></div><p>${escapeHtml(relatedDescription(record))}</p></div><div class="overview-related-grid">${related.map(makeRelatedCard).join('')}</div></section>
      </section>

      <section class="overview-tab-panel overview-news-view" id="news" role="tabpanel" hidden aria-label="${escapeHtml(entityName(record))} news">
        <header class="overview-news-header"><div><span>News</span><h2>${escapeHtml(entityName(record))} news</h2><p>${escapeHtml(newsDescription(record))}</p></div><div class="overview-news-market"><span>${escapeHtml(record.symbol)}${record.quote.unit === 'POINT' ? '/USD' : ''}</span><strong class="${quoteClass}">${signed(record.quote.changePct, '%')}</strong><small>Today</small></div></header>
        <div class="overview-news-desk">
          ${leadNews ? `<article class="overview-news-lead"><div class="overview-news-lead-copy"><div class="overview-news-kicker"><span>Latest</span><time>${escapeHtml(leadNews.time)}</time><b>${escapeHtml(leadNews.source)}</b></div><h3>${escapeHtml(leadNews.title)}</h3><p>${escapeHtml(leadNews.summary)}</p><div class="overview-news-subject"><strong>${escapeHtml(leadNews.subject.symbol)}</strong><span>${escapeHtml(entityName(leadNews.subject))}</span></div></div><div class="overview-news-lead-visual">${renderAsset(leadNews.subject, 'overview-news-asset')}</div></article>` : ''}
          <section class="overview-news-briefs" aria-labelledby="topStoriesTitle"><div class="overview-news-section-title"><h3 id="topStoriesTitle">More coverage</h3><span>${topNews.length} ${topNews.length === 1 ? 'story' : 'stories'}</span></div>${topNews.map((item) => `<article class="overview-news-brief"><div class="overview-news-meta"><time>${escapeHtml(item.time)}</time><span>${escapeHtml(item.source)}</span></div><h4>${escapeHtml(item.title)}</h4><div class="overview-news-subject"><strong>${escapeHtml(item.subject.symbol)}</strong><span>${escapeHtml(entityName(item.subject))}</span></div></article>`).join('')}</section>
        </div>
        ${latestNews.length ? `<section class="overview-news-stream" aria-labelledby="latestCoverageTitle"><div class="overview-news-section-title"><h3 id="latestCoverageTitle">Latest coverage</h3><span>${latestNews.length} ${latestNews.length === 1 ? 'story' : 'stories'}</span></div><div class="overview-news-list">${latestNews.map((item) => `<article class="overview-news-item"><div class="overview-news-item-visual">${renderAsset(item.subject, 'overview-news-asset')}</div><div class="overview-news-item-copy"><div class="overview-news-meta"><time>${escapeHtml(item.time)}</time><span>${escapeHtml(item.source)}</span><b>${escapeHtml(item.subject.symbol)}</b></div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.summary)}</p></div></article>`).join('')}</div></section>` : ''}
      </section>

      <section class="overview-tab-panel overview-methodology-view" id="methodology" role="tabpanel" hidden aria-label="${escapeHtml(entityName(record))} methodology">
        <header class="overview-view-header overview-methodology-header"><span>Index methodology</span><h2>How ${escapeHtml(record.symbol)} is constructed</h2><p>${escapeHtml(methodologyDescription(record))}</p><div class="overview-methodology-meta"><div><span>Symbol</span><strong>${escapeHtml(record.symbol)}</strong></div><div><span>Category</span><strong>${escapeHtml(record.category)}</strong></div><div><span>Quote unit</span><strong>${escapeHtml(record.quote.unit)}</strong></div><div><span>Framework inputs</span><strong>${record.components.length}</strong></div></div></header>
        <div class="overview-methodology-layout"><div class="overview-methodology-main"><section><span class="overview-methodology-index">01</span><h3>Index objective</h3><p>${escapeHtml(record.about)}</p></section><section><span class="overview-methodology-index">02</span><h3>Signal framework</h3><p>${escapeHtml(record.methodology[0])}</p><div class="overview-methodology-components">${record.components.map((component) => `<article><div><strong>${escapeHtml(component.label)}</strong><b>${escapeHtml(component.weight)}</b></div><p>${escapeHtml(component.detail)}</p><i style="--component-weight:${escapeHtml(component.weight)}"></i></article>`).join('')}</div></section><section><span class="overview-methodology-index">03</span><h3>Construction and interpretation</h3><div class="overview-methodology-steps">${record.methodology.map((item, index) => `<article><strong>${String(index + 1).padStart(2, '0')}</strong><p>${escapeHtml(item)}</p></article>`).join('')}</div></section></div><aside class="overview-methodology-aside"><span>Reference</span><h3>Reading the index</h3><dl><div><dt>Price level</dt><dd>${formatQuote(record.quote.value, record.quote.unit)}</dd></div><div><dt>Previous close</dt><dd>${formatQuote(record.stats.previousClose, record.quote.unit)}</dd></div><div><dt>Current range</dt><dd>${formatQuote(record.stats.dayRange[0], record.quote.unit)} – ${formatQuote(record.stats.dayRange[1], record.quote.unit)}</dd></div><div><dt>Signal density</dt><dd>${record.stats.density}/100</dd></div></dl></aside></div>
      </section>

    `;
  }

  function bindOverview(record, catalog) {
    const root = document.getElementById('overviewRoot');
    if (!root) return;
    const tradeTicket = root.querySelector('[data-overview-ticket]');
    const tradeBackdrop = root.querySelector('[data-overview-ticket-backdrop]');
    const orderToast = root.querySelector('[data-overview-order-toast]');
    const orderToastSide = root.querySelector('[data-overview-order-side]');
    const orderToastDetails = root.querySelector('[data-overview-order-details]');
    let tradeTrigger = null;
    let orderToastTimer = null;
    let activeRangeKey = '1D';
    const liveRanges = Object.fromEntries(Object.entries(record.ranges).map(([key, range]) => [key, {
      ...range,
      current: range.current,
      return: range.return,
      startValue: range.series[0],
      series: [...range.series],
    }]));
    const updateTab = (target) => {
      root.querySelectorAll('.overview-tab').forEach((tab) => {
        const active = tab.dataset.target === target;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
      });
      root.querySelectorAll('.overview-tab-panel').forEach((panel) => {
        const active = panel.id === target;
        panel.hidden = !active;
        panel.classList.toggle('is-active', active);
      });
      if (target !== 'overview' && tradeTicket && !tradeTicket.hidden) {
        tradeTicket.hidden = true;
        if (tradeBackdrop) tradeBackdrop.hidden = true;
        document.body.classList.remove('is-overview-ticket-open');
      }
    };

    const overviewTabs = [...root.querySelectorAll('.overview-tab')];
    const activateOverviewTab = (tab, { syncHash = true } = {}) => {
      const target = tab.dataset.target;
      updateTab(target);
      if (syncHash) window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${target}`);
      if (target === 'overview') window.requestAnimationFrame(() => updateChart(activeRangeKey));
    };
    overviewTabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activateOverviewTab(tab));
      tab.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        let nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? overviewTabs.length - 1
          : index + (event.key === 'ArrowLeft' ? -1 : 1);
        nextIndex = (nextIndex + overviewTabs.length) % overviewTabs.length;
        activateOverviewTab(overviewTabs[nextIndex]);
        overviewTabs[nextIndex].focus();
      });
    });

    const updateChart = (key) => {
      const range = liveRanges[key];
      if (!range) return;
      const chartPanel = root.querySelector('[data-chart-panel]');
      const chartFrame = root.querySelector('.overview-chart-frame');
      const fillPath = root.querySelector('[data-chart-fill]');
      const line = root.querySelector('[data-chart-line]');
      const previousCloseLine = root.querySelector('[data-prev-close-line]');
      const previousCloseMarker = root.querySelector('[data-prev-close-marker]');
      const yAxis = root.querySelector('[data-y-axis]');
      const xAxis = root.querySelector('[data-x-axis]');
      const marker = root.querySelector('[data-current-marker]');
      const caption = root.querySelector('[data-range-caption]');
      const activePeriod = root.querySelector('[data-active-period]');
      const currentPrice = root.querySelector('[data-current-price]');
      const currentChange = root.querySelector('[data-current-change]');
      const tradePrice = root.querySelector('[data-trade-price]');
      const geometry = chartGeometry(range.series, record.stats.previousClose);
      const sessionChange = range.current - record.stats.previousClose;
      const sessionChangePct = (sessionChange / record.stats.previousClose) * 100;
      const chartFrameStyle = chartFrame ? window.getComputedStyle(chartFrame) : null;
      const plotTop = Number.parseFloat(chartFrameStyle?.paddingTop) || 16;
      const plotBottom = Number.parseFloat(chartFrameStyle?.paddingBottom) || 38;
      const plotHeight = Math.max((chartFrame?.clientHeight || 520) - plotTop - plotBottom, 1);
      activeRangeKey = key;

      const chartColor = chartColorFor(sessionChangePct);
      if (chartPanel) {
        chartPanel.style.setProperty('--chart-color', chartColor);
        chartPanel.style.setProperty('--chart-ink', chartInkFor(sessionChangePct));
      }
      if (fillPath) fillPath.setAttribute('d', geometry.fillPath);
      if (line) line.setAttribute('d', geometry.linePath);
      if (previousCloseLine && geometry.referenceY !== null) {
        previousCloseLine.setAttribute('d', `M0,${geometry.referenceY.toFixed(2)} H1000`);
      }
      if (caption) caption.textContent = `${range.label} performance`;
      if (activePeriod) activePeriod.textContent = range.label;
      let currentMarkerTop = null;
      if (marker) {
        marker.textContent = formatQuote(range.current, record.quote.unit);
        currentMarkerTop = plotTop + ((geometry.lastY / 300) * plotHeight);
        marker.style.top = `${currentMarkerTop}px`;
      }
      if (previousCloseMarker && geometry.referenceY !== null) {
        const previousMarkerTop = plotTop + ((geometry.referenceY / 300) * plotHeight);
        previousCloseMarker.style.top = `${previousMarkerTop}px`;
        previousCloseMarker.hidden = currentMarkerTop !== null && Math.abs(previousMarkerTop - currentMarkerTop) < 24;
      }
      if (currentPrice) currentPrice.textContent = formatQuote(range.current, record.quote.unit);
      if (tradePrice) tradePrice.textContent = formatQuote(range.current, record.quote.unit);
      if (currentChange) {
        currentChange.textContent = signed(sessionChangePct, '%');
        currentChange.classList.toggle('is-negative', isNegative(sessionChangePct));
      }
      if (yAxis) {
        const labels = Array.from({ length: 6 }, (_, index) => axisValue(geometry.upper - ((geometry.upper - geometry.lower) * index / 5), record.quote.unit));
        yAxis.innerHTML = labels.map((label) => `<span>${escapeHtml(label)}</span>`).join('');
      }
      if (xAxis) {
        const xLabels = window.innerWidth <= 680
          ? [range.xLabels[0], range.xLabels[Math.floor(range.xLabels.length / 2)], range.xLabels[range.xLabels.length - 1]]
          : range.xLabels;
        xAxis.innerHTML = xLabels.map((label) => `<span>${escapeHtml(label)}</span>`).join('');
      }

      root.querySelectorAll('.overview-range').forEach((button) => {
        const active = button.dataset.range === key;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
      });
      updateTradeEstimate();
    };

    root.querySelectorAll('.overview-range').forEach((button) => {
      button.addEventListener('click', () => updateChart(button.dataset.range));
    });

    const tradeAmount = root.querySelector('[data-trade-amount]');
    const tradeEstimate = root.querySelector('[data-trade-estimate]');
    const tradeSubmit = root.querySelector('[data-trade-submit]');
    let tradeSide = 'buy';

    const activeTradePrice = () => Number(liveRanges[activeRangeKey]?.current || record.quote.value);
    const updateTradeEstimate = () => {
      const amount = Number(tradeAmount?.value);
      const estimate = amount > 0 && activeTradePrice() > 0 ? amount / activeTradePrice() : 0;
      if (tradeEstimate) tradeEstimate.textContent = estimate > 0
        ? `${estimate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${record.symbol}`
        : '—';
      if (tradeSubmit) {
        tradeSubmit.textContent = tradeSide === 'sell' ? 'Sell' : 'Buy';
        tradeSubmit.classList.toggle('is-sell', tradeSide === 'sell');
      }
    };

    const setTradeSide = (side) => {
      tradeSide = side === 'sell' ? 'sell' : 'buy';
      root.querySelectorAll('[data-trade-side]').forEach((option) => {
        const active = option.dataset.tradeSide === tradeSide;
        option.classList.toggle('is-active', active);
        option.setAttribute('aria-pressed', String(active));
      });
      updateTradeEstimate();
    };
    const closeTradeTicket = () => {
      if (!tradeTicket || tradeTicket.hidden) return;
      tradeTicket.hidden = true;
      if (tradeBackdrop) tradeBackdrop.hidden = true;
      document.body.classList.remove('is-overview-ticket-open');
      tradeTrigger?.focus();
      tradeTrigger = null;
    };
    root.querySelectorAll('[data-overview-ticket-open]').forEach((button) => {
      button.addEventListener('click', () => {
        if (!tradeTicket) return;
        tradeTrigger = button;
        setTradeSide(button.dataset.overviewTicketOpen);
        tradeTicket.hidden = false;
        if (tradeBackdrop) tradeBackdrop.hidden = false;
        document.body.classList.add('is-overview-ticket-open');
        window.setTimeout(() => tradeAmount?.focus(), 0);
      });
    });
    root.querySelectorAll('[data-trade-side]').forEach((button) => {
      button.addEventListener('click', () => setTradeSide(button.dataset.tradeSide));
    });
    root.querySelector('[data-overview-ticket-close]')?.addEventListener('click', closeTradeTicket);
    tradeBackdrop?.addEventListener('click', closeTradeTicket);
    const hideOrderToast = () => {
      if (!orderToast) return;
      orderToast.classList.remove('is-visible', 'is-sell');
      orderToast.hidden = true;
      if (orderToastTimer) window.clearTimeout(orderToastTimer);
      orderToastTimer = null;
    };
    root.querySelector('[data-overview-order-toast-close]')?.addEventListener('click', hideOrderToast);
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && tradeTicket && !tradeTicket.hidden) closeTradeTicket();
    });
    root.querySelectorAll('[data-trade-preset]').forEach((button) => {
      button.addEventListener('click', () => {
        if (tradeAmount) tradeAmount.value = button.dataset.tradePreset;
        updateTradeEstimate();
      });
    });
    tradeAmount?.addEventListener('input', updateTradeEstimate);
    root.querySelector('[data-trade-form]')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const unavailableMessage = root.querySelector('[data-overview-trade-unavailable]');
      if (unavailableMessage) {
        unavailableMessage.hidden = false;
        unavailableMessage.textContent = 'Trading is unavailable until an authenticated backend capability and current market fence are connected.';
      }
    });

    root.querySelector('[data-chart-download]')?.addEventListener('click', () => {
      const source = root.querySelector('.overview-line-chart');
      if (!source) return;
      const chartPanel = root.querySelector('[data-chart-panel]');
      const chartColor = chartPanel?.style.getPropertyValue('--chart-color').trim() || chartColorFor(record.quote.changePct);
      const clone = source.cloneNode(true);
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clone.querySelectorAll('stop').forEach((stop) => stop.setAttribute('stop-color', chartColor));
      clone.querySelector('.chart-line')?.setAttribute('style', `stroke:${chartColor};fill:none`);
      const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${record.symbol.replace(/\W+/g, '-')}-${activeRangeKey}-chart.svg`;
      link.click();
      URL.revokeObjectURL(url);
    });

    root.querySelector('[data-chart-expand]')?.addEventListener('click', () => {
      const panel = root.querySelector('[data-chart-panel]');
      if (!panel) return;
      if (document.fullscreenElement) document.exitFullscreen?.();
      else panel.requestFullscreen?.();
    });

    window.addEventListener('resize', () => updateChart(activeRangeKey), { passive: true });
    const initialTab = ['overview', 'news', 'methodology'].includes(window.location.hash.slice(1))
      ? window.location.hash.slice(1)
      : 'overview';
    const initialTabButton = overviewTabs.find((tab) => tab.dataset.target === initialTab) || overviewTabs[0];
    if (initialTabButton) activateOverviewTab(initialTabButton, { syncHash: false });
    updateTradeEstimate();
    updateChart('1D');
  }

  document.addEventListener('DOMContentLoaded', () => {
    const catalog = window.BLACKBOOK_INDEX_CATALOG;
    if (!catalog) return;

    renderSearchResults(catalog);

    const suppliedSymbol = new URLSearchParams(window.location.search).get('symbol');
    const record = catalog.get(suppliedSymbol);
    if (!record) {
      const query = suppliedSymbol ? `?search=${encodeURIComponent(suppliedSymbol)}` : '';
      window.location.replace(`./index.html${query}#market-overview`);
      return;
    }

    document.title = `${record.name} (${record.symbol}) — Blackbook`;
    renderOverview(record, catalog);
    bindOverview(record, catalog);
  });
}());

