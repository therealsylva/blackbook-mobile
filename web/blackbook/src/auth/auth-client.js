/* global supabase */

(() => {
  const config = window.BLACKBOOK_AUTH_CONFIG || {};
  const sdk = window.supabase;
  const placeholder = /YOUR_PROJECT_REF|YOUR_APP_ORIGIN|REPLACE_ME/i;
  const callbackKeys = [
    'code',
    'state',
    'error',
    'error_code',
    'error_description',
    'auth',
  ];
  const callbackHashKeys = [
    'access_token',
    'refresh_token',
    'expires_at',
    'expires_in',
    'token_type',
    'provider_token',
    'provider_refresh_token',
    'error',
    'error_code',
    'error_description',
  ];

  const callbackHash = (url) => {
    const params = new URLSearchParams(url.hash.replace(/^#/, ''));
    return callbackHashKeys.some((key) => params.has(key)) ? params : null;
  };

  const isHttpUrl = (value) => {
    try {
      return /^https?:$/.test(new URL(value).protocol);
    } catch {
      return false;
    }
  };

  const isSecretKey = (value) => {
    if (/^sb_secret_/i.test(value || '')) return true;
    const payload = String(value || '').split('.')[1];
    if (!payload || !window.atob) return false;
    try {
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '=');
      return JSON.parse(window.atob(base64)).role === 'service_role';
    } catch {
      return false;
    }
  };

  let configurationError = null;
  if (!sdk?.createClient) configurationError = 'sdk_missing';
  else if (!isHttpUrl(config.supabaseUrl) || placeholder.test(config.supabaseUrl || '')) {
    configurationError = 'url_missing';
  } else if (!config.publishableKey || placeholder.test(config.publishableKey)) {
    configurationError = 'key_missing';
  } else if (isSecretKey(config.publishableKey)) {
    configurationError = 'secret_key_forbidden';
  } else if (!isHttpUrl(config.appBaseUrl) || placeholder.test(config.appBaseUrl || '')) {
    configurationError = 'app_url_missing';
  } else if (config.captcha?.enabled && config.captcha?.required && !config.captcha?.siteKey) {
    configurationError = 'captcha_site_key_missing';
  } else if (config.captcha?.enabled && config.captcha?.provider !== 'turnstile') {
    configurationError = 'captcha_provider_invalid';
  }

  const clientOptions = {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      persistSession: true,
      storageKey: config.storageKey || 'blackbook-auth',
    },
  };

  let client = null;
  if (!configurationError) {
    try {
      client = sdk.createClient(config.supabaseUrl, config.publishableKey, clientOptions);
    } catch {
      configurationError = 'init_failed';
    }
  }

  const sanitizedReturnUrl = () => {
    const current = new URL(window.location.href);
    const base = new URL(config.appBaseUrl);
    const basePath = base.pathname.endsWith('/') ? base.pathname : `${base.pathname}/`;
    const withinBase = current.origin === base.origin && (
      basePath === '/'
      || current.pathname === base.pathname
      || current.pathname.startsWith(basePath)
    );
    const url = withinBase ? current : base;
    callbackKeys.forEach((key) => url.searchParams.delete(key));
    if (callbackHash(url)) url.hash = '';
    return url.toString();
  };

  const consumeCallbackParams = () => {
    const url = new URL(window.location.href);
    const hash = callbackHash(url);
    const result = {
      error: url.searchParams.get('error_description') || url.searchParams.get('error')
        || hash?.get('error_description') || hash?.get('error') || '',
      hadCallback: callbackKeys.some((key) => url.searchParams.has(key)) || Boolean(hash),
    };
    if (result.hadCallback) {
      callbackKeys.forEach((key) => url.searchParams.delete(key));
      if (hash) url.hash = '';
      window.history.replaceState(window.history.state, '', url.toString());
    }
    return result;
  };

  window.BLACKBOOK_AUTH = Object.freeze({
    client,
    config,
    configurationError,
    isConfigured: Boolean(client),
    sanitizedReturnUrl,
    consumeCallbackParams,
  });
})();
