document.addEventListener('DOMContentLoaded', () => {
  const markUnavailableViews = (selector) => {
    document.querySelectorAll(selector).forEach((button) => {
      const active = button.classList.contains('active');
      button.setAttribute('aria-pressed', String(active));
      if (active) return;
      button.classList.add('is-unavailable');
      button.setAttribute('aria-disabled', 'true');
      button.title = 'This data view is not available yet';
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
      });
    });
  };

  markUnavailableViews('.tab-button');
  markUnavailableViews('.strategies-tab-button');
  markUnavailableViews('.part2-module .tab-btn');
  markUnavailableViews('.part2-module .stock-tab');
  markUnavailableViews('.part3-module .tab-btn');
  markUnavailableViews('.part3-module .filter-btn');

  document.querySelectorAll('a[href="#"]').forEach((link) => {
    link.dataset.unavailable = 'true';
    link.setAttribute('aria-disabled', 'true');
    link.title = 'This destination is not available yet';
  });

  const indexCatalog = window.BLACKBOOK_INDEX_CATALOG;
  const indexOverviewUrl = (record) => `./index-overview.html?symbol=${encodeURIComponent(record.symbol)}`;
  const indexChartUrl = (record) => `./terminal.html?symbol=${encodeURIComponent(record.symbol)}`;
  const escapeSearchHtml = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
  const formatIndexQuote = (value, unit = 'POINT') => {
    if (unit === 'RATIO') return Number(value).toFixed(4);
    return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  const formatIndexReturn = (value) => `${Number(value) < 0 ? '−' : '+'}${Math.abs(Number(value)).toFixed(2)}%`;
  const assetMarkClass = (asset) => `${asset.type === 'person' ? 'person-mark' : 'logo-mark'}${asset.alt === 'iPhone' ? ' dark-mark' : ''}`;
  const indexAssetMarkup = (record) => {
    const { asset } = record;
    if (asset.type === 'pair') {
      return `<span class="symbol-result-pair-icons" aria-label="${asset.items.map((item) => item.alt).join(' and ')}">${asset.items.map((item) => `<span class="symbol-result-icon entity-mark ${assetMarkClass(item)}"><img src="${item.src}" alt="${item.alt}"></span>`).join('')}</span>`;
    }
    return `<span class="symbol-result-icon entity-mark ${assetMarkClass(asset)}"><img src="${asset.src}" alt="${asset.alt}"></span>`;
  };
  const searchActionMarkup = (record) => {
    const label = escapeSearchHtml(record.name);
    return `<span class="symbol-result-actions" aria-label="${label} actions"><a class="symbol-result-action" data-search-action="overview" href="${indexOverviewUrl(record)}" aria-label="Open ${label} overview">Overview</a><a class="symbol-result-action" data-search-action="chart" href="${indexChartUrl(record)}" aria-label="Launch ${label} chart">Launch chart<span aria-hidden="true">↗</span></a></span>`;
  };
  const makeCatalogSearchResult = (record) => {
    const pairedClass = record.asset.type === 'pair' ? ' symbol-result-paired' : '';
    const displaySymbol = `${record.symbol}${record.quote.unit === 'POINT' ? '/USD' : ''}`;
    return `<div class="symbol-result${pairedClass}" role="group" data-index-symbol="${escapeSearchHtml(record.symbol)}" data-category="${escapeSearchHtml(record.category)}" data-search="${escapeSearchHtml(`${displaySymbol} ${record.name} ${record.category}`)}"><button class="symbol-result-main" data-search-overview type="button" aria-label="Open ${escapeSearchHtml(record.name)} overview">${indexAssetMarkup(record)}<span class="symbol-result-copy"><strong>${escapeSearchHtml(displaySymbol)}</strong><small>${escapeSearchHtml(record.name)}</small></span><span class="symbol-result-meta"><small>${escapeSearchHtml(record.category)}</small></span></button>${searchActionMarkup(record)}</div>`;
  };
  const catalogRecordForElement = (element) => {
    if (!indexCatalog || !element) return null;
    const symbol = element.dataset.indexSymbol
      || element.querySelector([
        '.index-symbol-label',
        '.stock-company',
        '.sp500-symbol',
        '.symbol-result-copy strong',
        '.data-card-badge',
        '.commodity-symbol-badge',
        '.ipo-company-name',
        '.trend-symbol',
        '.crypto-symbol',
      ].join(', '))?.textContent;
    return indexCatalog.get(symbol);
  };
  const hydrateCatalogSearch = () => {
    if (!indexCatalog) return;
    const container = document.getElementById('symbolSearchResults');
    if (!container) return;

    const present = new Set();
    container.querySelectorAll('.symbol-result').forEach((result) => {
      const record = catalogRecordForElement(result);
      if (!record) return;
      result.dataset.indexSymbol = record.symbol;
      present.add(record.symbol);
    });

    indexCatalog.list.forEach((record) => {
      if (!present.has(record.symbol)) container.insertAdjacentHTML('beforeend', makeCatalogSearchResult(record));
    });
  };
  const enhanceCatalogSearchResult = (result) => {
    if (!result || result.dataset.searchActionsReady === 'true') return;
    const record = catalogRecordForElement(result);
    if (!record) return;

    if (result.matches('button')) {
      const replacement = document.createElement('div');
      replacement.className = result.className;
      [...result.attributes].forEach((attribute) => {
        if (attribute.name !== 'class') replacement.setAttribute(attribute.name, attribute.value);
      });
      replacement.setAttribute('role', 'group');

      const overviewButton = document.createElement('button');
      overviewButton.className = 'symbol-result-main';
      overviewButton.type = 'button';
      overviewButton.dataset.searchOverview = '';
      overviewButton.setAttribute('aria-label', `Open ${record.name} overview`);
      overviewButton.innerHTML = result.innerHTML;
      replacement.append(overviewButton);
      replacement.insertAdjacentHTML('beforeend', searchActionMarkup(record));
      result.replaceWith(replacement);
      result = replacement;
    }

    result.dataset.searchActionsReady = 'true';
  };
  const enhanceCatalogSearchResults = () => {
    document.querySelectorAll('#symbolSearchResults .symbol-result').forEach(enhanceCatalogSearchResult);
  };
  const hydrateCatalogControls = () => {
    if (!indexCatalog) return;

    const controls = [
      ...document.querySelectorAll([
        '.part1-module .index-item',
        '.part1-module .chart-card',
        '.part1-module .data-card',
        '.part1-module .commodity-item',
        '.part1-module .ipo-card',
        '.part1-module .crypto-item',
        '.part2-module .stock-row',
        '.part2-module .trend-card',
        '.part3-module .crypto-item',
      ].join(', ')),
    ];

    controls.forEach((control) => {
      const record = catalogRecordForElement(control);
      if (!record) return;

      control.dataset.indexSymbol = record.symbol;
      control.classList.add('index-route-control');
      control.setAttribute('role', 'link');
      control.setAttribute('tabindex', '0');
      control.setAttribute('aria-label', `Open ${record.name} overview`);

      const symbolLabel = control.querySelector([
        '.index-symbol-label',
        '.stock-company',
        '.sp500-symbol',
        '.data-card-badge',
        '.commodity-symbol-badge',
        '.ipo-company-name',
        '.trend-symbol',
        '.crypto-symbol',
      ].join(', '));
      if (symbolLabel) {
        if (symbolLabel.matches('.sp500-symbol')) symbolLabel.textContent = record.name;
        else {
          symbolLabel.textContent = symbolLabel.matches('.crypto-symbol') && record.quote.unit === 'POINT'
            ? `${record.symbol}/USD`
            : record.symbol;
        }
      }
      const title = control.querySelector('.sp500-title');
      if (title) title.textContent = `${record.symbol}${record.quote.unit === 'POINT' ? '/USD' : ''}`;

      const updateValue = (selector, unitClass) => {
        const valueElement = control.querySelector(selector);
        if (!valueElement) return;
        valueElement.innerHTML = `${formatIndexQuote(record.quote.value, record.quote.unit)} <span class="${unitClass}">${record.quote.unit}</span>`;
      };
      updateValue('.index-value', 'index-unit');
      updateValue('.stock-price', 'point-unit');
      updateValue('.data-card-value', 'point-unit');
      updateValue('.commodity-value', 'commodity-unit');
      updateValue('.trend-price', 'point-unit');
      updateValue('.crypto-price', 'point-unit');

      const ipoValue = [...control.querySelectorAll('.ipo-detail-item')]
        .find((item) => item.querySelector('.ipo-detail-label')?.textContent.trim() === 'Index')
        ?.querySelector('.ipo-detail-value');
      if (ipoValue) ipoValue.textContent = formatIndexQuote(record.quote.value, record.quote.unit);

      const chartPrice = control.querySelector('.sp500-price');
      if (chartPrice) chartPrice.textContent = formatIndexQuote(record.quote.value, record.quote.unit);
      const chartUnit = control.querySelector('.sp500-label');
      if (chartUnit) chartUnit.textContent = record.quote.unit;

      const updateReturn = (selector) => {
        const returnElement = control.querySelector(selector);
        if (!returnElement) return;
        returnElement.textContent = formatIndexReturn(record.quote.changePct);
        returnElement.classList.toggle('positive', record.quote.changePct >= 0);
        returnElement.classList.toggle('negative', record.quote.changePct < 0);
      };
      updateReturn('.index-change');
      updateReturn('.stock-change');
      updateReturn('.sp500-change');
      updateReturn('.data-card-change');
      updateReturn('.commodity-change');
      updateReturn('.trend-change');
      updateReturn('.crypto-change');

      const openOverview = (event) => {
        if (event?.target?.closest?.('a, button, input, select, textarea')) return;
        const activeRecord = indexCatalog.get(control.dataset.indexSymbol) || record;
        window.location.assign(indexOverviewUrl(activeRecord));
      };
      control.addEventListener('click', openOverview);
      control.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openOverview(event);
        }
      });
    });
  };

  hydrateCatalogSearch();
  enhanceCatalogSearchResults();
  hydrateCatalogControls();

  const initFeaturedIndexRotation = () => {
    if (!indexCatalog) return;
    const card = document.querySelector('.part1-module .chart-card');
    if (!card) return;

    const featuredSymbols = ['CGPT', 'LMY', 'RMD', 'DRK', 'LIV', 'TSWT', 'LBJ', 'SPOT', 'TYLA'];
    const records = featuredSymbols.map((symbol) => indexCatalog.get(symbol)).filter(Boolean);
    if (records.length < 2) return;

    const icon = card.querySelector('.sp500-icon');
    const iconImage = icon?.querySelector('img');
    const title = card.querySelector('.sp500-title');
    const name = card.querySelector('.sp500-symbol');
    const price = card.querySelector('.sp500-price');
    const unit = card.querySelector('.sp500-label');
    const change = card.querySelector('.sp500-change');
    const line = card.querySelector('.chart-line');
    const area = card.querySelector('.chart-area');
    const gradientStops = [...card.querySelectorAll('linearGradient stop')];
    const timeAxis = card.querySelector('.time-axis');
    let activeIndex = Math.max(0, records.findIndex((record) => record.symbol === card.dataset.indexSymbol));
    let rotationTimer = null;
    let transitionTimer = null;

    const chartPaths = (series) => {
      const width = 800;
      const height = 300;
      const inset = 14;
      const minimum = Math.min(...series);
      const maximum = Math.max(...series);
      const spread = Math.max(maximum - minimum, Math.abs(maximum) * 0.002, 1);
      const points = series.map((value, index) => {
        const x = (index / Math.max(series.length - 1, 1)) * width;
        const y = inset + ((maximum - value) / spread) * (height - inset * 2);
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      });
      const linePath = points.map((point, index) => `${index ? 'L' : 'M'}${point}`).join(' ');
      return { linePath, areaPath: `${linePath} L${width},${height} L0,${height} Z` };
    };

    const renderRecord = (record) => {
      const range = record.ranges['1D'];
      const paths = chartPaths(range.series);
      const isDown = record.quote.changePct < 0;
      const chartColor = isDown ? '#f23645' : '#089981';

      card.dataset.indexSymbol = record.symbol;
      card.setAttribute('aria-label', `Open ${record.name} overview`);
      card.style.setProperty('--featured-chart-color', chartColor);
      icon?.classList.toggle('is-person', record.asset.type === 'person');
      icon?.classList.toggle('is-logo', record.asset.type !== 'person');
      if (iconImage && record.asset.type !== 'pair') {
        iconImage.src = record.asset.src;
        iconImage.alt = record.asset.alt;
      }
      if (title) title.textContent = `${record.symbol}${record.quote.unit === 'POINT' ? '/USD' : ''}`;
      if (name) name.textContent = record.name;
      if (price) price.textContent = formatIndexQuote(record.quote.value, record.quote.unit);
      if (unit) unit.textContent = record.quote.unit;
      if (change) {
        change.textContent = formatIndexReturn(record.quote.changePct);
        change.classList.toggle('positive', !isDown);
        change.classList.toggle('negative', isDown);
      }
      line?.setAttribute('d', paths.linePath);
      area?.setAttribute('d', paths.areaPath);
      gradientStops.forEach((stop) => {
        stop.setAttribute('stop-color', chartColor);
        stop.style.stopColor = chartColor;
      });
      if (timeAxis) {
        timeAxis.innerHTML = range.xLabels.map((label) => `<span class="time-label">${escapeSearchHtml(label)}</span>`).join('');
      }
    };

    const showRecord = (record, animate = true) => {
      window.clearTimeout(transitionTimer);
      if (!animate) {
        renderRecord(record);
        return;
      }
      card.classList.add('is-switching');
      transitionTimer = window.setTimeout(() => {
        renderRecord(record);
        window.requestAnimationFrame(() => card.classList.remove('is-switching'));
      }, 180);
    };

    const scheduleRotation = () => {
      window.clearTimeout(rotationTimer);
      if (document.hidden) return;
      rotationTimer = window.setTimeout(() => {
        activeIndex = (activeIndex + 1) % records.length;
        showRecord(records[activeIndex]);
        scheduleRotation();
      }, 7200);
    };

    const pauseRotation = () => window.clearTimeout(rotationTimer);
    card.addEventListener('mouseenter', pauseRotation);
    card.addEventListener('mouseleave', scheduleRotation);
    card.addEventListener('focusin', pauseRotation);
    card.addEventListener('focusout', (event) => {
      if (!card.contains(event.relatedTarget)) scheduleRotation();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) pauseRotation();
      else scheduleRotation();
    });

    showRecord(records[activeIndex], false);
    scheduleRotation();
  };

  initFeaturedIndexRotation();

  const searchOverlay = document.getElementById('symbolSearchOverlay');
  const searchTrigger = document.querySelector('.part1-module .search-input');
  const searchInput = document.getElementById('symbolSearchInput');
  const searchClear = document.getElementById('symbolSearchClear');
  const searchCount = document.getElementById('symbolSearchCount');
  const searchEmpty = document.getElementById('symbolSearchEmpty');
  const searchEmptyTitle = document.getElementById('symbolSearchEmptyTitle');
  const searchEmptyCopy = document.getElementById('symbolSearchEmptyCopy');
  const searchFilterBar = document.getElementById('symbolSearchFilters');
  const searchResults = [...document.querySelectorAll('.symbol-result')];
  const searchTabs = [...document.querySelectorAll('[data-search-tab]')];
  const searchFilters = [...document.querySelectorAll('[data-search-filter]')];
  let activeSearchTab = 'Indices';
  let activeSearchFilter = 'All';
  let activeResultIndex = -1;
  const instrumentOnlyCategories = new Set(['Relative Value', 'Options']);
  const searchCountLabels = {
    Indices: ['index', 'indices'],
    Entities: ['entity', 'entities'],
    News: ['news item', 'news items'],
    Signals: ['signal', 'signals'],
  };

  const visibleSearchResults = () => searchResults.filter((result) => !result.hidden);

  const setActiveResult = (index) => {
    const visible = visibleSearchResults();
    searchResults.forEach((result) => result.classList.remove('keyboard-active'));
    activeResultIndex = visible.length && index >= 0
      ? (index + visible.length) % visible.length
      : -1;

    if (activeResultIndex >= 0) {
      visible[activeResultIndex].classList.add('keyboard-active');
      visible[activeResultIndex].scrollIntoView({ block: 'nearest' });
    }
  };

  const updateSearchResults = () => {
    const query = searchInput?.value.trim().toLowerCase() ?? '';
    const showMarketResults = activeSearchTab === 'Indices' || activeSearchTab === 'Entities';

    searchResults.forEach((result) => {
      const matchesQuery = result.dataset.search.toLowerCase().includes(query);
      const matchesFilter = activeSearchFilter === 'All'
        || result.dataset.category === activeSearchFilter;
      const matchesView = activeSearchTab === 'Indices'
        || (activeSearchTab === 'Entities' && !instrumentOnlyCategories.has(result.dataset.category));
      result.hidden = !(showMarketResults && matchesView && matchesQuery && matchesFilter);
    });

    const visible = visibleSearchResults();
    if (searchCount) {
      const [singular, plural] = searchCountLabels[activeSearchTab] ?? ['result', 'results'];
      searchCount.textContent = `${visible.length} ${visible.length === 1 ? singular : plural}`;
    }
    if (searchFilterBar) searchFilterBar.hidden = !showMarketResults;
    searchFilters.forEach((filter) => {
      filter.hidden = activeSearchTab === 'Entities'
        && instrumentOnlyCategories.has(filter.dataset.searchFilter);
    });
    if (searchEmpty) searchEmpty.hidden = visible.length > 0;
    if (!visible.length && searchEmptyTitle && searchEmptyCopy) {
      if (showMarketResults) {
        searchEmptyTitle.textContent = 'No results found';
        searchEmptyCopy.textContent = 'Try another entity, index, or category.';
      } else {
        searchEmptyTitle.textContent = `No ${activeSearchTab.toLowerCase()} results yet`;
        searchEmptyCopy.textContent = `Search across Blackbook ${activeSearchTab.toLowerCase()} will appear here.`;
      }
    }
    if (searchClear) searchClear.hidden = query.length === 0;
    setActiveResult(-1);
  };

  const openSearch = () => {
    if (!searchOverlay || !searchInput) return;
    if (document.getElementById('authDialog')?.open) return;
    searchOverlay.hidden = false;
    document.body.classList.add('search-dialog-open');
    searchTrigger?.setAttribute('aria-expanded', 'true');
    updateSearchResults();
    window.requestAnimationFrame(() => searchInput.focus());
  };

  const closeSearch = ({ restoreFocus = true } = {}) => {
    if (!searchOverlay || searchOverlay.hidden) return;
    searchOverlay.hidden = true;
    document.body.classList.remove('search-dialog-open');
    searchTrigger?.setAttribute('aria-expanded', 'false');
    searchResults.forEach((result) => result.classList.remove('keyboard-active'));
    activeResultIndex = -1;
    if (restoreFocus) searchTrigger?.focus();
  };

  document.addEventListener('blackbook:AUTH_DIALOG_OPENING', () => {
    closeSearch({ restoreFocus: false });
  });

  const activateSearchResult = (result) => {
    const overviewButton = result?.querySelector('[data-search-overview]');
    if (overviewButton) overviewButton.click();
    else result?.click();
  };

  searchTrigger?.addEventListener('click', openSearch);
  searchTrigger?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openSearch();
    }
  });

  document.querySelectorAll('[data-search-close]').forEach((button) => {
    button.addEventListener('click', () => closeSearch());
  });

  searchInput?.addEventListener('input', updateSearchResults);
  searchInput?.addEventListener('keydown', (event) => {
    const visible = visibleSearchResults();

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveResult(activeResultIndex + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveResult(activeResultIndex < 0 ? visible.length - 1 : activeResultIndex - 1);
    } else if (event.key === 'Enter' && visible.length) {
      event.preventDefault();
      activateSearchResult(visible[activeResultIndex >= 0 ? activeResultIndex : 0]);
    }
  });

  searchClear?.addEventListener('click', () => {
    if (!searchInput) return;
    searchInput.value = '';
    updateSearchResults();
    searchInput.focus();
  });

  searchTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      activeSearchTab = tab.dataset.searchTab;
      if (activeSearchTab === 'Entities' && instrumentOnlyCategories.has(activeSearchFilter)) {
        activeSearchFilter = 'All';
        searchFilters.forEach((item) => item.classList.toggle('active', item.dataset.searchFilter === 'All'));
      }
      searchTabs.forEach((item) => {
        const selected = item === tab;
        item.classList.toggle('active', selected);
        item.setAttribute('aria-selected', String(selected));
      });
      updateSearchResults();
      searchInput?.focus();
    });
  });

  searchFilters.forEach((filter) => {
    filter.addEventListener('click', () => {
      activeSearchFilter = filter.dataset.searchFilter;
      searchFilters.forEach((item) => item.classList.toggle('active', item === filter));
      updateSearchResults();
      searchInput?.focus();
    });
  });

  searchResults.forEach((result) => {
    const overviewButton = result.querySelector('[data-search-overview]') || result;
    overviewButton.addEventListener('click', () => {
      const symbol = result.querySelector('.symbol-result-copy strong')?.textContent ?? '';
      const record = indexCatalog?.get(result.dataset.indexSymbol || symbol);
      if (record) {
        window.location.assign(indexOverviewUrl(record));
        return;
      }
      if (searchTrigger) searchTrigger.value = symbol;
      closeSearch();
    });
  });

  // Shared Supabase authentication is initialized by auth-session.js and auth-ui.js.

  const hero = document.getElementById('heroSection');
  const closeHero = document.querySelector('.close-hero-btn');

  const dismissHero = () => {
    if (!hero || hero.classList.contains('hidden')) return;
    hero.style.opacity = '0';
    hero.style.transform = 'translateY(-20px)';
    window.setTimeout(() => hero.classList.add('hidden'), 400);
  };

  closeHero?.removeAttribute('onclick');
  closeHero?.addEventListener('click', dismissHero);

  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (!document.getElementById('authDialog')?.open) openSearch();
    }

    if (event.key === 'Escape') {
      if (document.getElementById('authDialog')?.open) return;
      if (searchOverlay && !searchOverlay.hidden) closeSearch();
      else dismissHero();
    }
  });

  const requestedSearch = new URLSearchParams(window.location.search).get('search');
  if (requestedSearch && searchInput) {
    searchInput.value = requestedSearch;
    window.setTimeout(openSearch, 0);
  }

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const targetId = anchor.getAttribute('href');
      if (!targetId || targetId === '#') {
        event.preventDefault();
        return;
      }

      const target = document.querySelector(targetId);
      if (target) {
        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  document.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', (event) => {
      if (button.matches('.symbol-search-backdrop')) return;
      const bounds = button.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'button-ripple';
      ripple.style.left = `${event.clientX - bounds.left - 50}px`;
      ripple.style.top = `${event.clientY - bounds.top - 50}px`;
      button.appendChild(ripple);
      window.setTimeout(() => ripple.remove(), 600);
    });
  });
});
