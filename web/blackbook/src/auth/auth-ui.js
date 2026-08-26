(() => {
  const session = window.BLACKBOOK_AUTH_SESSION;
  const runtime = window.BLACKBOOK_AUTH || {};
  const config = runtime.config || window.BLACKBOOK_AUTH_CONFIG || {};

  if (!session || document.getElementById('authDialog')) {
    document.documentElement.classList.remove('auth-pending');
    return;
  }

  const html = [
    '<dialog class="auth-dialog" id="authDialog" aria-labelledby="authTitle" aria-describedby="authSubtitle">',
    '  <div class="auth-dialog-shell">',
    '    <button class="auth-close" type="button" data-auth-close aria-label="Close account dialog">×</button>',
    '    <section class="auth-account-panel" data-auth-account-panel hidden>',
    '      <div class="auth-account-heading">',
    '        <span class="auth-account-avatar" data-auth-account-avatar aria-hidden="true"></span>',
    '        <div class="auth-account-copy">',
    '          <h2 id="authAccountTitle" data-auth-display-name>Your account</h2>',
    '          <p><span data-auth-account-email></span><span data-auth-account-provider></span></p>',
    '        </div>',
    '      </div>',
    '      <button class="auth-signout" type="button" data-auth-signout>Sign out</button>',
    '    </section>',
    '    <section class="auth-methods" data-auth-methods>',
    '      <h2 id="authTitle">Create your Blackbook account</h2>',
    '      <p class="auth-subtitle" id="authSubtitle">Use a secure email link to create or access your Blackbook account.</p>',
    '      <div class="auth-mode-tabs" role="group" aria-label="Email account mode">',
    '        <button class="active" type="button" data-auth-mode="create" aria-pressed="true">Create account</button>',
    '        <button type="button" data-auth-mode="signin" aria-pressed="false">Sign in</button>',
    '      </div>',
    '      <form class="auth-email-form" data-auth-email-form novalidate>',
    '        <label class="visually-hidden" for="authEmail">Email address</label>',
    '        <input class="auth-email-input" id="authEmail" name="email" type="email" inputmode="email" autocomplete="email" placeholder="Email address" required>',
    '        <button class="auth-email-continue" type="submit" data-auth-email-continue disabled>Continue</button>',
    '      </form>',
    '    </section>',
    '    <div class="auth-status" data-auth-status role="status" aria-live="polite" hidden>',
    '      <span class="auth-status-dot" aria-hidden="true"></span>',
    '      <span data-auth-status-text></span>',
    '      <button type="button" data-auth-retry hidden>Retry</button>',
    '    </div>',
    '    <p class="auth-legal" data-auth-legal hidden>',
    '      By continuing, you agree to Blackbook&rsquo;s <a data-auth-terms>Terms</a> and <a data-auth-privacy>Privacy Policy</a>.',
    '    </p>',
    '  </div>',
    '</dialog>',
  ].join('');

  document.body.insertAdjacentHTML('beforeend', html);

  const dialog = document.getElementById('authDialog');
  const methodsPanel = dialog.querySelector('[data-auth-methods]');
  const accountPanel = dialog.querySelector('[data-auth-account-panel]');
  const title = dialog.querySelector('#authTitle');
  const subtitle = dialog.querySelector('#authSubtitle');
  const modeButtons = [...dialog.querySelectorAll('[data-auth-mode]')];
  const emailForm = dialog.querySelector('[data-auth-email-form]');
  const emailInput = dialog.querySelector('#authEmail');
  const emailContinue = dialog.querySelector('[data-auth-email-continue]');
  const signOutButton = dialog.querySelector('[data-auth-signout]');
  const retryButton = dialog.querySelector('[data-auth-retry]');
  const statusBox = dialog.querySelector('[data-auth-status]');
  const statusText = dialog.querySelector('[data-auth-status-text]');
  const entryOpeners = [...document.querySelectorAll('[data-auth-entry]')];
  const accountOpeners = [...document.querySelectorAll('[data-auth-account]')];
  const adaptiveOpeners = [...document.querySelectorAll('[data-auth-adaptive-trigger]')];
  const allOpeners = [...new Set([...entryOpeners, ...accountOpeners, ...adaptiveOpeners])];

  let mode = 'create';
  let busy = false;
  let lastFocus = null;
  let currentSnapshot = session.getSnapshot();
  let callbackErrorOpened = false;
  let sessionExpiredOpened = false;

  const copy = {
    create: {
      title: 'Create your Blackbook account',
      subtitle: 'Use a secure email link to create your Blackbook account.',
      pending: 'Creating your secure email link…',
      success: 'Check your email to finish creating your account.',
    },
    signin: {
      title: 'Sign in to Blackbook',
      subtitle: 'Use a secure email link to access your Blackbook account.',
      pending: 'Sending your secure sign-in link…',
      success: 'Check your email for your secure sign-in link.',
    },
  };

  const legalUrl = (value) => {
    if (!value) return '';
    try {
      const url = new URL(value, window.location.href);
      return /^https?:$/.test(url.protocol) ? url.toString() : '';
    } catch {
      return '';
    }
  };

  const termsUrl = legalUrl(config.termsUrl || config.legal?.termsUrl);
  const privacyUrl = legalUrl(config.privacyUrl || config.legal?.privacyUrl);
  const legal = dialog.querySelector('[data-auth-legal]');
  const terms = dialog.querySelector('[data-auth-terms]');
  const privacy = dialog.querySelector('[data-auth-privacy]');

  if (termsUrl && privacyUrl) {
    terms.href = termsUrl;
    privacy.href = privacyUrl;
    legal.hidden = false;
  }

  document.querySelectorAll('[data-legal-link="terms"]').forEach((link) => {
    if (!termsUrl) return;
    link.href = termsUrl;
    link.hidden = false;
  });
  document.querySelectorAll('[data-legal-link="privacy"]').forEach((link) => {
    if (!privacyUrl) return;
    link.href = privacyUrl;
    link.hidden = false;
  });

  const displayName = (snapshot) => snapshot.profile?.display_name
    || snapshot.user?.user_metadata?.full_name
    || snapshot.user?.user_metadata?.name
    || snapshot.user?.email?.split('@')[0]
    || 'Account';

  const initials = (value) => String(value || 'A')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase() || 'A';

  const avatarUrl = (snapshot) => {
    const raw = snapshot.profile?.avatar_url || snapshot.user?.user_metadata?.avatar_url || '';
    if (!raw) return '';
    try {
      const url = new URL(raw, window.location.href);
      return /^https?:$/.test(url.protocol) ? url.toString() : '';
    } catch {
      return '';
    }
  };

  const renderAvatar = (element, snapshot, name) => {
    if (!element) return;
    element.replaceChildren();
    const url = avatarUrl(snapshot);
    if (url) {
      const image = document.createElement('img');
      image.src = url;
      image.alt = '';
      image.referrerPolicy = 'no-referrer';
      element.appendChild(image);
      return;
    }
    element.textContent = initials(name);
  };

  const setStatus = (message = '', state = 'neutral', retry = false) => {
    statusBox.hidden = !message;
    statusText.textContent = message;
    statusBox.dataset.state = state;
    statusBox.setAttribute('role', state === 'error' ? 'alert' : 'status');
    statusBox.setAttribute('aria-live', state === 'error' ? 'assertive' : 'polite');
    retryButton.hidden = !retry;
  };

  const updateEmailState = () => {
    emailContinue.disabled = busy
      || currentSnapshot.status === 'configuration_error'
      || !emailInput.value
      || !emailInput.validity.valid;
  };

  const setBusy = (value) => {
    busy = Boolean(value);
    dialog.setAttribute('aria-busy', String(busy));
    [
      ...modeButtons,
      emailInput,
      emailContinue,
      signOutButton,
      retryButton,
    ].filter(Boolean).forEach((control) => {
      control.disabled = busy;
    });
    updateEmailState();
  };

  const renderHeader = () => {
    const signedIn = currentSnapshot.status === 'signed_in';
    const name = displayName(currentSnapshot);

    entryOpeners.forEach((opener) => { opener.hidden = signedIn; });
    accountOpeners.forEach((opener) => { opener.hidden = !signedIn; });

    document.querySelectorAll('[data-auth-header-name]').forEach((node) => {
      node.textContent = name;
    });
    document.querySelectorAll('[data-auth-header-avatar]').forEach((node) => {
      renderAvatar(node, currentSnapshot, name);
    });
    adaptiveOpeners.forEach((opener) => {
      const label = opener.querySelector('[data-auth-terminal-label]');
      if (label) label.textContent = signedIn ? name : 'Sign in';
      opener.dataset.authOpenMode = signedIn ? 'account' : 'signin';
      opener.setAttribute('aria-label', signedIn ? 'Open your Blackbook account' : 'Sign in to Blackbook');
    });

    if (currentSnapshot.ready) document.documentElement.classList.remove('auth-pending');
  };

  const renderAccount = () => {
    const name = displayName(currentSnapshot);
    dialog.querySelector('[data-auth-display-name]').textContent = name;
    const email = currentSnapshot.user?.email || '';
    const emailNode = dialog.querySelector('[data-auth-account-email]');
    const providerNode = dialog.querySelector('[data-auth-account-provider]');
    emailNode.textContent = email;
    providerNode.textContent = (email ? ' · ' : '') + session.displayProvider(currentSnapshot.provider);
    renderAvatar(dialog.querySelector('[data-auth-account-avatar]'), currentSnapshot, name);
  };

  const renderDialog = () => {
    const signedIn = currentSnapshot.status === 'signed_in';
    methodsPanel.hidden = signedIn;
    accountPanel.hidden = !signedIn;
    dialog.setAttribute('aria-labelledby', signedIn ? 'authAccountTitle' : 'authTitle');
    if (signedIn) dialog.removeAttribute('aria-describedby');
    else dialog.setAttribute('aria-describedby', 'authSubtitle');

    if (signedIn) renderAccount();
    else {
      const selected = copy[mode];
      title.textContent = selected.title;
      subtitle.textContent = selected.subtitle;
      modeButtons.forEach((button) => {
        const active = button.dataset.authMode === mode;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
      });
    }

    if (currentSnapshot.error) {
      const canRetry = currentSnapshot.errorKind === 'metadata' && signedIn;
      setStatus(currentSnapshot.error, 'error', canRetry);
    } else if (!busy) {
      setStatus('');
    }
    updateEmailState();
  };

  const setMode = (nextMode) => {
    if (busy || !copy[nextMode]) return;
    mode = nextMode;
    renderDialog();
    window.setTimeout(() => emailInput.focus(), 0);
  };

  const closeDialog = ({ restoreFocus = true } = {}) => {
    if (!dialog.open) return;
    dialog.close();
    allOpeners.forEach((opener) => opener.setAttribute('aria-expanded', 'false'));
    document.body.classList.remove('auth-dialog-open');
    if (restoreFocus && lastFocus?.isConnected) lastFocus.focus();
    lastFocus = null;
  };

  const openDialog = (requestedMode = 'signin', opener = null) => {
    if (dialog.open) return;
    const signedIn = currentSnapshot.status === 'signed_in';
    mode = requestedMode === 'create' ? 'create' : 'signin';
    lastFocus = opener || (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    document.dispatchEvent(new CustomEvent('blackbook:AUTH_DIALOG_OPENING'));
    renderDialog();
    dialog.showModal();
    document.body.classList.add('auth-dialog-open');
    allOpeners.forEach((item) => item.setAttribute('aria-expanded', String(item === opener)));
    window.requestAnimationFrame(() => {
      const target = signedIn
        ? dialog.querySelector('[data-auth-signout]')
        : dialog.querySelector('[data-auth-mode="' + mode + '"]');
      target?.focus();
    });
  };

  allOpeners.forEach((opener) => {
    opener.addEventListener('click', () => {
      const requested = currentSnapshot.status === 'signed_in'
        ? 'account'
        : opener.dataset.authOpenMode || 'signin';
      openDialog(requested, opener);
    });
  });

  dialog.querySelector('[data-auth-close]').addEventListener('click', () => closeDialog());
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeDialog();
  });
  dialog.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    event.stopPropagation();
    closeDialog();
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) closeDialog();
  });

  modeButtons.forEach((button) => {
    button.addEventListener('click', () => setMode(button.dataset.authMode));
  });

  emailInput.addEventListener('input', () => {
    updateEmailState();
    if (!busy && !currentSnapshot.error) setStatus('');
  });

  emailForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy || !emailInput.validity.valid) return;
    setBusy(true);
    setStatus(copy[mode].pending, 'pending');
    try {
      await session.signInWithEmail(emailInput.value.trim(), mode);
      setStatus(copy[mode].success, 'success');
    } catch (error) {
      setStatus(session.describeError(error), 'error');
    } finally {
      setBusy(false);
    }
  });

  signOutButton.addEventListener('click', async () => {
    if (busy) return;
    setBusy(true);
    setStatus('Signing out…', 'pending');
    try {
      await session.signOut();
      closeDialog({ restoreFocus: false });
    } catch (error) {
      setStatus(session.describeError(error), 'error');
    } finally {
      setBusy(false);
    }
  });

  retryButton.addEventListener('click', async () => {
    if (busy) return;
    setBusy(true);
    setStatus('Refreshing account details…', 'pending');
    try {
      await session.retryMetadata();
    } catch (error) {
      setStatus(session.describeError(error), 'error');
    } finally {
      setBusy(false);
    }
  });

  session.subscribe((next) => {
    currentSnapshot = next;
    renderHeader();
    renderDialog();
    const shouldOpenCallback = next.errorKind === 'callback' && !callbackErrorOpened;
    const shouldOpenExpiry = next.errorKind === 'session_expired' && !sessionExpiredOpened;
    if ((shouldOpenCallback || shouldOpenExpiry) && next.ready && !dialog.open) {
      if (shouldOpenCallback) callbackErrorOpened = true;
      if (shouldOpenExpiry) sessionExpiredOpened = true;
      const signedIn = next.status === 'signed_in';
      const opener = signedIn
        ? accountOpeners.find((item) => !item.hidden)
        : [...entryOpeners, ...adaptiveOpeners].find((item) => !item.hidden);
      window.setTimeout(() => openDialog(signedIn ? 'account' : 'signin', opener), 0);
    }
  });
})();
