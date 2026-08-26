(function attachTerminalMarketData(global) {
  'use strict';

  const DECIMAL = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;
  const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
  const DEFAULT_STALE_AFTER_MS = 30_000;
  const MAX_ROWS = 100;

  const requireObject = (value, label) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new TypeError(label + ' must be an object');
    }
    return value;
  };

  const requireString = (value, label, pattern = null) => {
    if (typeof value !== 'string' || !value || value.trim() !== value) {
      throw new TypeError(label + ' must be a non-empty canonical string');
    }
    if (pattern && !pattern.test(value)) throw new TypeError(label + ' is malformed');
    return value;
  };

  const requirePositiveDecimal = (value, label) => {
    const decimal = requireString(value, label, DECIMAL);
    if (!/[1-9]/.test(decimal)) throw new TypeError(label + ' must be positive');
    return decimal;
  };

  const requireTimestamp = (value, label, nowMs) => {
    const timestamp = requireString(value, label);
    const parsed = Date.parse(timestamp);
    if (!Number.isFinite(parsed) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(timestamp)) {
      throw new TypeError(label + ' must be an ISO timestamp');
    }
    if (parsed > nowMs + 5_000) throw new TypeError(label + ' cannot be in the future');
    return { timestamp, parsed };
  };

  const compareDecimal = (left, right) => {
    const [leftWhole, leftFraction = ''] = left.split('.');
    const [rightWhole, rightFraction = ''] = right.split('.');
    if (leftWhole.length !== rightWhole.length) return leftWhole.length > rightWhole.length ? 1 : -1;
    if (leftWhole !== rightWhole) return leftWhole > rightWhole ? 1 : -1;
    const width = Math.max(leftFraction.length, rightFraction.length);
    const leftPadded = leftFraction.padEnd(width, '0');
    const rightPadded = rightFraction.padEnd(width, '0');
    return leftPadded === rightPadded ? 0 : leftPadded > rightPadded ? 1 : -1;
  };

  const normalizeBookRows = (rows, side) => {
    if (!Array.isArray(rows) || rows.length > MAX_ROWS) {
      throw new TypeError('orderBook.' + side + ' must be a bounded array');
    }
    const normalized = rows.map((raw, index) => {
      const row = requireObject(raw, 'orderBook.' + side + '[' + index + ']');
      return Object.freeze({
        price: requirePositiveDecimal(row.price, 'orderBook.' + side + '[' + index + '].price'),
        quantity: requirePositiveDecimal(row.quantity, 'orderBook.' + side + '[' + index + '].quantity'),
      });
    });
    normalized.slice(1).forEach((row, index) => {
      const comparison = compareDecimal(normalized[index].price, row.price);
      if ((side === 'bids' && comparison < 0) || (side === 'asks' && comparison > 0)) {
        throw new TypeError('orderBook.' + side + ' is not price ordered');
      }
    });
    return normalized;
  };

  const normalizeTrades = (rows, nowMs, asOfMs) => {
    if (!Array.isArray(rows) || rows.length > MAX_ROWS) {
      throw new TypeError('recentTrades must be a bounded array');
    }
    const ids = new Set();
    return rows.map((raw, index) => {
      const row = requireObject(raw, 'recentTrades[' + index + ']');
      const tradeId = requireString(row.tradeId, 'recentTrades[' + index + '].tradeId', ID);
      if (ids.has(tradeId)) throw new TypeError('recentTrades contains a duplicate tradeId');
      ids.add(tradeId);
      if (row.side !== 'buy' && row.side !== 'sell') {
        throw new TypeError('recentTrades[' + index + '].side is malformed');
      }
      const occurredAt = requireTimestamp(
        row.occurredAt,
        'recentTrades[' + index + '].occurredAt',
        nowMs,
      );
      if (occurredAt.parsed > asOfMs) {
        throw new TypeError('recentTrades[' + index + '].occurredAt exceeds asOf');
      }
      return Object.freeze({
        tradeId,
        price: requirePositiveDecimal(row.price, 'recentTrades[' + index + '].price'),
        quantity: requirePositiveDecimal(row.quantity, 'recentTrades[' + index + '].quantity'),
        side: row.side,
        occurredAt: occurredAt.timestamp,
      });
    });
  };

  function normalizeMarketPayload(raw, options = {}) {
    const nowMs = Number(options.nowMs ?? Date.now());
    const staleAfterMs = Number(options.staleAfterMs ?? DEFAULT_STALE_AFTER_MS);
    if (!Number.isFinite(nowMs) || !Number.isFinite(staleAfterMs) || staleAfterMs <= 0) {
      throw new TypeError('normalization clock is malformed');
    }
    const payload = requireObject(raw, 'market payload');
    const expectedSymbol = requireString(options.symbol, 'expected symbol', ID).toUpperCase();
    const symbol = requireString(payload.symbol, 'symbol', ID).toUpperCase();
    if (symbol !== expectedSymbol) throw new TypeError('market payload symbol mismatch');
    const sequence = requireString(payload.sequence, 'sequence', /^\d+$/);
    const asOf = requireTimestamp(payload.asOf, 'asOf', nowMs);
    const orderBook = requireObject(payload.orderBook, 'orderBook');
    const bids = normalizeBookRows(orderBook.bids, 'bids');
    const asks = normalizeBookRows(orderBook.asks, 'asks');
    if (bids.length && asks.length && compareDecimal(bids[0].price, asks[0].price) >= 0) {
      throw new TypeError('orderBook is crossed');
    }
    const recentTrades = normalizeTrades(payload.recentTrades, nowMs, asOf.parsed);
    return Object.freeze({
      symbol,
      sequence,
      asOf: asOf.timestamp,
      stale: nowMs - asOf.parsed > staleAfterMs,
      orderBook: Object.freeze({ bids: Object.freeze(bids), asks: Object.freeze(asks) }),
      recentTrades: Object.freeze(recentTrades),
    });
  }

  const appendCell = (document, row, value, className = '') => {
    const cell = document.createElement('td');
    cell.textContent = value;
    if (className) cell.className = className;
    row.append(cell);
  };

  function createController(options = {}) {
    const root = options.root;
    if (!root) return null;
    const provider = options.provider;
    const now = typeof options.now === 'function' ? options.now : Date.now;
    const staleAfterMs = options.staleAfterMs || DEFAULT_STALE_AFTER_MS;
    const status = root.querySelector('[data-market-data-status]');
    const bookState = root.querySelector('[data-book-state]');
    const tradeState = root.querySelector('[data-trade-state]');
    const bidBody = root.querySelector('[data-book-bids]');
    const askBody = root.querySelector('[data-book-asks]');
    const tradeBody = root.querySelector('[data-recent-trades]');
    const refresh = root.querySelector('[data-market-refresh]');
    const tabs = [...root.querySelectorAll('[data-market-view]')];
    const panels = [...root.querySelectorAll('[data-market-panel]')];
    let symbol = '';
    let request = 0;
    let controller = null;
    let staleTimer = null;
    let snapshot = Object.freeze({ state: 'idle', symbol: '', data: null, error: '' });

    const showView = (view) => {
      tabs.forEach((tab) => {
        const selected = tab.dataset.marketView === view;
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
      });
      panels.forEach((panel) => {
        panel.hidden = panel.dataset.marketPanel !== view;
      });
    };

    const setStateMessage = (element, message) => {
      if (!element) return;
      element.textContent = message;
      element.hidden = !message;
    };

    const clearRows = () => {
      bidBody?.replaceChildren();
      askBody?.replaceChildren();
      tradeBody?.replaceChildren();
    };

    const clearStaleTimer = () => {
      if (staleTimer === null) return;
      (root.ownerDocument.defaultView || global).clearTimeout(staleTimer);
      staleTimer = null;
    };

    const scheduleStaleTransition = (data) => {
      clearStaleTimer();
      if (data.stale) return;
      const expiresAt = Date.parse(data.asOf) + staleAfterMs;
      const delay = Math.max(1, expiresAt - now());
      staleTimer = (root.ownerDocument.defaultView || global).setTimeout(() => {
        staleTimer = null;
        if (snapshot.data !== data || !['ready', 'empty'].includes(snapshot.state)) return;
        publish('stale', data);
      }, delay);
    };

    const publish = (state, data = null, error = '') => {
      snapshot = Object.freeze({ state, symbol, data, error });
      root.dataset.state = state;
      if (status) {
        status.textContent = {
          loading: 'Loading',
          ready: 'Current',
          empty: 'Empty',
          stale: 'Stale',
          error: 'Unavailable',
        }[state] || 'Unavailable';
      }
      if (refresh) refresh.disabled = state === 'loading';
    };

    const renderBookRows = (body, rows, side) => {
      if (!body) return;
      rows.forEach((entry) => {
        const row = root.ownerDocument.createElement('tr');
        appendCell(root.ownerDocument, row, entry.price, 'market-price ' + side);
        appendCell(root.ownerDocument, row, entry.quantity);
        body.append(row);
      });
    };

    const render = (data) => {
      clearRows();
      renderBookRows(bidBody, data.orderBook.bids, 'bid');
      renderBookRows(askBody, data.orderBook.asks, 'ask');
      data.recentTrades.forEach((entry) => {
        const row = root.ownerDocument.createElement('tr');
        appendCell(root.ownerDocument, row, entry.price, 'market-price ' + entry.side);
        appendCell(root.ownerDocument, row, entry.quantity);
        appendCell(root.ownerDocument, row, new Date(entry.occurredAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }));
        tradeBody?.append(row);
      });
      const bookEmpty = !data.orderBook.bids.length && !data.orderBook.asks.length;
      const tradesEmpty = !data.recentTrades.length;
      setStateMessage(bookState, bookEmpty ? 'No trusted order-book rows are available.' : '');
      setStateMessage(tradeState, tradesEmpty ? 'No trusted trades are available.' : '');
      publish(data.stale ? 'stale' : (bookEmpty && tradesEmpty ? 'empty' : 'ready'), data);
      scheduleStaleTransition(data);
    };

    const fail = (message) => {
      clearStaleTimer();
      clearRows();
      setStateMessage(bookState, message);
      setStateMessage(tradeState, message);
      publish('error', null, message);
    };

    const load = async (nextSymbol = symbol) => {
      symbol = String(nextSymbol || '').trim().toUpperCase();
      const requestId = ++request;
      controller?.abort();
      controller = typeof AbortController === 'function' ? new AbortController() : null;
      clearStaleTimer();
      clearRows();
      setStateMessage(bookState, 'Loading trusted order book…');
      setStateMessage(tradeState, 'Loading trusted trades…');
      publish('loading');
      if (!provider || typeof provider.loadMarketData !== 'function') {
        fail('');
        return snapshot;
      }
      try {
        const raw = await provider.loadMarketData({ symbol, signal: controller?.signal });
        if (requestId !== request) return snapshot;
        const data = normalizeMarketPayload(raw, { symbol, nowMs: now(), staleAfterMs });
        render(data);
      } catch (error) {
        if (requestId !== request || error?.name === 'AbortError') return snapshot;
        fail('Trusted market data could not be loaded.');
      }
      return snapshot;
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => showView(tab.dataset.marketView));
      tab.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        let next = index;
        if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        showView(tabs[next].dataset.marketView);
        tabs[next].focus();
      });
    });
    refresh?.addEventListener('click', () => load(symbol));
    showView(tabs.find((tab) => tab.getAttribute('aria-selected') === 'true')?.dataset.marketView
      || tabs[0]?.dataset.marketView);

    return Object.freeze({
      getState: () => snapshot,
      load,
      showView,
    });
  }

  global.BLACKBOOK_TERMINAL_MARKET_DATA = Object.freeze({
    createController,
    normalizeMarketPayload,
  });
}(window));
