(function attachBlackbookBff(global) {
  "use strict";

  function requireFetch() {
    if (typeof global.fetch !== "function") {
      throw new Error("Fetch is unavailable");
    }
    return global.fetch.bind(global);
  }

  async function accessToken() {
    const auth = global.BLACKBOOK_AUTH;
    const result = await auth?.client?.auth?.getSession?.();
    return result?.data?.session?.access_token || null;
  }

  async function request(pathname, options = {}) {
    if (!pathname.startsWith("/api/")) {
      throw new Error("BFF requests must use same-origin /api routes");
    }

    const headers = new Headers(options.headers || {});
    if (options.body !== undefined) {
      headers.set("content-type", "application/json");
    }
    if (options.requireAuth) {
      const token = await accessToken();
      if (!token) {
        const error = new Error("Authentication required");
        error.code = "unauthorized";
        error.status = 401;
        throw error;
      }
      headers.set("authorization", "Bearer " + token);
    }

    const response = await requireFetch()(pathname, {
      method: options.method || "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: "no-store",
      signal: options.signal,
    });
    const text = await response.text();
    let payload = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = { raw: text };
    }
    if (!response.ok) {
      const error = new Error(payload?.error?.code || "bff_request_failed");
      error.code = payload?.error?.code || "bff_request_failed";
      error.status = response.status;
      error.requestId = payload?.error?.requestId || response.headers.get("x-request-id");
      throw error;
    }
    return payload;
  }

  const client = {
    request,
    loadCatalog: () => request("/api/catalog"),
    loadNews: () => request("/api/content/news"),
    loadMajorIndices: () => request("/api/content/major-indices"),
    loadMarketData: ({ symbol, signal }) =>
      request("/api/markets/" + encodeURIComponent(symbol) + "/snapshot", {
        requireAuth: true,
        signal,
      }),
    loadBalances: () => request("/api/account/balances", { requireAuth: true }),
    createDepositIntent: (body) =>
      request("/api/funding/deposit-intents", {
        method: "POST",
        requireAuth: true,
        body,
      }),
    submitOrder: (body) =>
      request("/api/trading/orders", {
        method: "POST",
        requireAuth: true,
        body,
      }),
    cancelOrder: (body) =>
      request("/api/trading/orders/cancel", {
        method: "POST",
        requireAuth: true,
        body,
      }),
  };

  global.BLACKBOOK_BFF = Object.freeze(client);
  global.BLACKBOOK_MARKET_DATA_PROVIDER = global.BLACKBOOK_BFF;
})(window);
