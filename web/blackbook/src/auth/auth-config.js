/*
 * Public Supabase Auth configuration.
 *
 * Production defaults may be overridden through window.BLACKBOOK_PUBLIC_ENV.
 * The publishable key is designed for browser use. Never place an sb_secret/service-role key, OAuth
 * client secret, access token, or refresh token here.
 */
(() => {
  const runtime = window.BLACKBOOK_PUBLIC_ENV || {};

  window.BLACKBOOK_AUTH_CONFIG = Object.freeze({
    supabaseUrl: runtime.supabaseUrl || 'https://xiyqraipqxwaqjuwbvdb.supabase.co',
    publishableKey: runtime.publishableKey || 'sb_publishable_FW7ZwycNg_dFA-2MT1P3dg_3-18wTbw',
    appBaseUrl: runtime.appBaseUrl || 'https://blackbook.modnight.com',
    storageKey: 'blackbook-auth',
    providers: Object.freeze({
      email: true,
    }),
    legal: Object.freeze({
      termsUrl: runtime.termsUrl || '',
      privacyUrl: runtime.privacyUrl || '',
    }),
    captcha: Object.freeze({
      enabled: true,
      required: true,
      provider: 'turnstile',
      siteKey: runtime.captchaSiteKey || '0x4AAAAAAEWgR0HOruPfbwEx',
    }),
  });
})();
