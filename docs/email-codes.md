# Activate in-app email codes

The mobile auth UI uses Supabase-issued 8-digit codes for signup confirmation,
optional passwordless sign-in, and password recovery. Password login remains
available. No Google provider or app cooldown/attempt limit is added. Buttons
only lock while the current request is in flight.

## Required hosted Auth configuration

Before releasing this APK, update the project's Authentication settings:

- Email OTP length: **8**.
- Keep email confirmation enabled; signup verification now happens in the app.
- Replace **Confirm signup**, **Magic Link**, and **Reset Password** email bodies
  with a code template using `{{ .Token }}` instead of a link. Example:

```html
<h2>Your BlackBook code</h2>
<p>Enter this 8-digit code in BlackBook:</p>
<p style="font-size:32px;letter-spacing:4px;font-weight:bold">{{ .Token }}</p>
<p>If you did not request this code, ignore this email.</p>
```

Use subjects “Confirm your BlackBook account”, “Your BlackBook sign-in code”,
and “Reset your BlackBook password” respectively. Do not put tokens in subjects.

Set the Site URL to `https://tradeblackbook.org` and allow the existing mobile
callback `blackbook://auth/callback` for previously issued links. New code-based
emails require no browser redirect.

Do not lower the project's sending or verification limits. Supabase and the SMTP
provider still enforce their own limits; this change does not bypass them or
purchase additional capacity. Check the existing sender/SMTP configuration before
promising a throughput increase. Shared email templates affect web clients too:
coordinate their OTP UI before enabling code-only templates for a shared project.

## Release checks

Use a fresh test address: sign up, copy/paste all eight digits (including a leading
zero), verify, and confirm the signed-in session survives restart. Verify an
invalid/expired code stays on the code screen, resend errors remain visible, and
“Use a different email” returns to the form. Test code login with an existing
account and password recovery through saving a new password. Confirm each email
contains a code and no localhost link. Replay an already-used code and ensure it
fails. The Playwright auth fixture covers these UI branches with mocked Auth;
it does not prove live email delivery or hosted settings.
