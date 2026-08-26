(() => {
  const config = window.BLACKBOOK_AUTH_CONFIG || {};
  const siteKey = config.captcha?.siteKey;
  if (!siteKey || config.captcha?.provider !== 'turnstile') return;

  let loader;
  let widgetId = null;

  const loadTurnstile = () => {
    if (window.turnstile?.render) return Promise.resolve(window.turnstile);
    if (loader) return loader;
    loader = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-blackbook-turnstile]');
      const script = existing || document.createElement('script');
      const timeout = window.setTimeout(() => reject(new Error('captcha_load_timeout')), 15000);
      const finish = () => {
        window.clearTimeout(timeout);
        if (window.turnstile?.render) resolve(window.turnstile);
        else reject(new Error('captcha_load_failed'));
      };
      script.addEventListener('load', finish, { once: true });
      script.addEventListener('error', () => {
        window.clearTimeout(timeout);
        reject(new Error('captcha_load_failed'));
      }, { once: true });
      if (!existing) {
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.dataset.blackbookTurnstile = 'true';
        document.head.append(script);
      }
    });
    return loader;
  };

  const container = () => {
    let element = document.querySelector('[data-auth-captcha]');
    if (element) return element;
    element = document.createElement('div');
    element.className = 'auth-captcha';
    element.dataset.authCaptcha = 'true';
    element.setAttribute('aria-label', 'Bot protection challenge');
    const status = document.querySelector('[data-auth-status]');
    status?.before(element);
    return element;
  };

  const getToken = async (action = 'authenticate') => {
    const turnstile = await loadTurnstile();
    const target = container();
    if (!target.isConnected) throw new Error('captcha_container_missing');
    if (widgetId !== null) {
      turnstile.remove(widgetId);
      widgetId = null;
    }

    return new Promise((resolve, reject) => {
      let settled = false;
      const timeout = window.setTimeout(() => finish(null, new Error('captcha_timeout')), 60000);
      const finish = (token, error = null) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        if (error) reject(error);
        else resolve(token);
      };
      widgetId = turnstile.render(target, {
        sitekey: siteKey,
        action: String(action).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32) || 'authenticate',
        appearance: 'interaction-only',
        execution: 'execute',
        size: window.matchMedia?.('(max-width: 360px)')?.matches ? 'compact' : 'normal',
        theme: 'auto',
        callback: (token) => finish(token),
        'error-callback': () => {
          finish(null, new Error('captcha_failed'));
          return true;
        },
        'expired-callback': () => finish(null, new Error('captcha_expired')),
        'timeout-callback': () => finish(null, new Error('captcha_timeout')),
      });
      turnstile.execute(widgetId);
    });
  };

  window.BLACKBOOK_CAPTCHA = Object.freeze({ getToken });
})();
