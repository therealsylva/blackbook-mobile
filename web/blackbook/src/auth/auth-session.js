(() => {
  const runtime = window.BLACKBOOK_AUTH || {};
  const client = runtime.client;
  const listeners = new Set();
  let activeSession = null;
  let hydrationGeneration = 0;
  let explicitSignOut = false;
  let completeExplicitSignOut = null;
  let initialized = false;

  let snapshot = Object.freeze({
    status: client ? 'loading' : 'configuration_error',
    user: null,
    profile: null,
    provider: null,
    error: runtime.configurationError || null,
    errorKind: runtime.configurationError ? 'configuration' : null,
    ready: false,
  });

  const titleCase = (value) => String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());

  const userProvider = (user) => user?.app_metadata?.provider
    || user?.identities?.find((identity) => identity.provider)?.provider
    || 'email';

  const displayProvider = (provider) => (
    provider === 'email' ? 'Email magic link' : 'Legacy account'
  );

  const safeEventDetail = () => ({
    userId: snapshot.user?.id || null,
    email: snapshot.user?.email || null,
    displayName: snapshot.profile?.display_name || snapshot.user?.user_metadata?.full_name
      || snapshot.user?.user_metadata?.name || snapshot.user?.email || null,
    provider: snapshot.provider,
  });

  const emit = (next, eventName = null, eventDetail = null) => {
    snapshot = Object.freeze({ ...snapshot, ...next });
    listeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch {
        // One UI subscriber must never prevent auth state propagation.
      }
    });
    if (eventName) {
      window.dispatchEvent(new CustomEvent(eventName, {
        detail: eventDetail || safeEventDetail(),
      }));
    }
  };

  const configurationMessage = () => {
    switch (runtime.configurationError) {
      case 'sdk_missing':
        return 'The Supabase browser SDK could not be loaded.';
      case 'url_missing':
        return 'The Supabase project URL has not been configured.';
      case 'key_missing':
        return 'The Supabase publishable key has not been configured.';
      case 'secret_key_forbidden':
        return 'A Supabase secret key was supplied to the browser. Replace it with the public publishable key.';
      case 'app_url_missing':
        return 'The approved Blackbook application URL has not been configured.';
      case 'captcha_site_key_missing':
        return 'The public Turnstile site key has not been configured.';
      case 'captcha_provider_invalid':
        return 'The configured bot-protection provider is not supported.';
      case 'init_failed':
        return 'The Supabase client could not be initialized.';
      default:
        return 'Supabase Auth is not configured.';
    }
  };

  const describeError = (error, fallback = 'Authentication failed. Please try again.') => {
    const raw = String(error?.message || error?.error_description || error || '');
    const message = raw.toLowerCase();
    if (/reject|denied|cancel/.test(message)) return 'Sign-in was cancelled. Try again when you are ready.';
    if (/too many requests|rate.?limit/.test(message)) {
      return 'Too many sign-in attempts. Wait a few minutes and try again.';
    }
    if (/redirect|domain|uri|origin|not allowed|invalid.*url/.test(message)) {
      return 'This page is not an approved Supabase redirect URL.';
    }
    if (/provider|unsupported|not enabled|disabled/.test(message)) {
      return 'That sign-in provider is not enabled yet.';
    }
    if (/failed to fetch|network|offline/.test(message)) {
      return 'Blackbook could not reach the authentication service. Check your connection and retry.';
    }
    return fallback;
  };

  const getCaptchaToken = async (action) => {
    const provider = window.BLACKBOOK_CAPTCHA;
    if (!provider?.getToken) return undefined;
    const token = await provider.getToken(action);
    return token || undefined;
  };

  const loadMetadata = async (user) => {
    const profileResult = await client
      .from('profiles')
      .select('id,display_name,avatar_url,email,provider,created_at,updated_at')
      .eq('id', user.id)
      .maybeSingle();

    return {
      profile: profileResult.data || null,
      error: profileResult.error
        ? describeError(profileResult.error, 'Your account loaded, but its profile details could not be retrieved.')
        : null,
    };
  };

  const hydrate = async (session, event = 'INITIAL_SESSION', signedOutExplicitly = false) => {
    const generation = ++hydrationGeneration;
    const previousUserId = snapshot.user?.id || null;
    activeSession = session || null;

    if (!session?.user) {
      const wasSignedIn = Boolean(previousUserId);
      const reason = signedOutExplicitly || explicitSignOut ? 'explicit' : 'expired';
      const sessionExpired = wasSignedIn && reason === 'expired';
      emit({
        status: 'signed_out',
        user: null,
        profile: null,
        provider: null,
        error: sessionExpired ? 'Your session expired. Sign in again to continue.' : null,
        errorKind: sessionExpired ? 'session_expired' : null,
        ready: true,
      }, wasSignedIn ? 'blackbook:SIGNED_OUT' : null, { reason });
      if (wasSignedIn && reason === 'expired') {
        window.dispatchEvent(new CustomEvent('blackbook:SESSION_EXPIRED', { detail: { reason } }));
      }
      if (!initialized) {
        initialized = true;
        window.dispatchEvent(new CustomEvent('blackbook:AUTH_READY', { detail: safeEventDetail() }));
      }
      return;
    }

    emit({
      status: 'loading',
      user: session.user,
      provider: userProvider(session.user),
      error: null,
      errorKind: null,
    });

    let metadata;
    try {
      metadata = await loadMetadata(session.user);
    } catch (error) {
      metadata = {
        profile: null,
        error: describeError(error, 'Your account loaded, but its profile details could not be retrieved.'),
      };
    }
    if (generation !== hydrationGeneration) return;

    emit({
      status: 'signed_in',
      user: session.user,
      profile: metadata.profile,
      provider: userProvider(session.user),
      error: metadata.error,
      errorKind: metadata.error ? 'metadata' : null,
      ready: true,
    });

    const shouldAnnounce = previousUserId !== session.user.id
      && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION');
    if (shouldAnnounce) {
      window.dispatchEvent(new CustomEvent('blackbook:SIGNED_IN', { detail: safeEventDetail() }));
    }
    if (!initialized) {
      initialized = true;
      window.dispatchEvent(new CustomEvent('blackbook:AUTH_READY', { detail: safeEventDetail() }));
    }
  };

  const requireClient = () => {
    if (!client) throw new Error(configurationMessage());
    return client;
  };

  const signInWithEmail = async (email, mode = 'signin') => {
    requireClient();
    const captchaToken = await getCaptchaToken('email');
    const { error } = await client.auth.signInWithOtp({
      email,
      options: {
        captchaToken,
        emailRedirectTo: runtime.sanitizedReturnUrl(),
        shouldCreateUser: mode === 'create',
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    requireClient();
    explicitSignOut = true;
    let fallbackTimer;
    const completed = new Promise((resolve) => {
      completeExplicitSignOut = resolve;
      fallbackTimer = window.setTimeout(() => {
        hydrate(null, 'SIGNED_OUT', true).finally(resolve);
      }, 1500);
    });
    try {
      const { error } = await client.auth.signOut({ scope: 'local' });
      if (error) throw error;
      await completed;
    } finally {
      window.clearTimeout(fallbackTimer);
      completeExplicitSignOut = null;
      explicitSignOut = false;
    }
  };

  const retryMetadata = async () => {
    if (activeSession?.user) await hydrate(activeSession, 'USER_UPDATED');
  };

  const subscribe = (listener) => {
    listeners.add(listener);
    listener(snapshot);
    return () => listeners.delete(listener);
  };

  const initialize = async () => {
    if (!client) {
      const callback = runtime.consumeCallbackParams?.() || { error: '', hadCallback: false };
      emit({
        ready: true,
        error: callback.error ? describeError({ message: callback.error }) : configurationMessage(),
        errorKind: callback.error ? 'callback' : 'configuration',
      });
      initialized = true;
      window.dispatchEvent(new CustomEvent('blackbook:AUTH_READY', { detail: safeEventDetail() }));
      return;
    }

    client.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return;
      const signedOutExplicitly = event === 'SIGNED_OUT' && explicitSignOut;
      window.setTimeout(() => {
        if (event === 'SIGNED_OUT') {
          hydrate(null, event, signedOutExplicitly).finally(() => completeExplicitSignOut?.());
        }
        else if (session) hydrate(session, event);
      }, 0);
    });

    try {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      const callback = runtime.consumeCallbackParams();
      await hydrate(data?.session || null, 'INITIAL_SESSION');
      if (callback.error) {
        emit({ error: describeError({ message: callback.error }), errorKind: 'callback' });
      }
    } catch (error) {
      runtime.consumeCallbackParams?.();
      emit({
        status: 'error',
        ready: true,
        error: describeError(error, 'Blackbook could not restore your session.'),
        errorKind: 'session_restore',
      });
      if (!initialized) {
        initialized = true;
        window.dispatchEvent(new CustomEvent('blackbook:AUTH_READY', { detail: safeEventDetail() }));
      }
    }
  };

  window.BLACKBOOK_AUTH_SESSION = Object.freeze({
    describeError,
    displayProvider,
    getSnapshot: () => snapshot,
    initialize,
    retryMetadata,
    signInWithEmail,
    signOut,
    subscribe,
  });

  initialize();
})();
