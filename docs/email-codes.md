# Activate in-app email codes

Run `python3 scripts/configure-email-codes.py` on the VPS. Enter a Supabase personal access token at the hidden prompt, or use SUPABASE_ACCESS_TOKEN. This requires a Management API token, not a database key. `--dry-run` makes no changes.

The script backs up affected values, sets mailer_otp_length to 8, adds {{ .Token }} to signup/login/recovery templates, fixes Site URL, preserves existing redirect URLs and allows the mobile callback. It rereads and verifies configuration. Existing email links remain during rollout to support the current web and older app clients. The new app enters the code without following those links.

Sending and verification limits, SMTP, expiry and Google settings are unchanged. Provider limits still apply. The script reports whether custom SMTP is configured. It does not purchase capacity.

The mobile flow includes signup verification, optional code login, password recovery, resend and email correction. Password login and guest browsing remain. There are no app cooldowns or attempt caps; buttons lock only during an in-flight request.

Validation: type checking, foundation validation, web export and setup payload checks passed. The auth screen tests passed at 360/390/430 px with mocked Auth, covering short/invalid codes, signup, resend failures/retry, recovery, code login, password login and persistence. Live configuration and email delivery have not been verified.

Release the updated APK before describing the in-app code flow as live. Test a fresh signup with an actual eight-digit email code, restart persistence, code replay rejection, code login and password recovery.

References:
https://supabase.com/docs/reference/api/v1-update-auth-service-config
https://supabase.com/docs/guides/auth/auth-email-templates
