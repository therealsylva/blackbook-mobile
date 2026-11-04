# Email codes and Supabase project migration

The active project is `aubzkokxxhjdkfqgpjfn`. Web runtime configuration already uses this project. Mobile 0.2.19 (Android versionCode 21) embeds the same URL and publishable key from `src/lib/public-connection.json`. Rebuild and install the APK: changing the server environment cannot change an installed app's bundled credentials. Existing sessions from the old project cannot authenticate with the new project; sign in again.

## Required hosted settings

Code-entry UI alone does not change Supabase's emails. In the current project's Authentication settings:

1. Emails > SMTP Settings: configure a verified custom SMTP sender (host, port, username, password, verified sender address and sender name BlackBook). Supabase currently requires custom SMTP to edit email templates. Enter provider credentials in the dashboard, never in either repo or client bundle.
2. Sign In / Providers > Email: keep email confirmation enabled; set Email OTP Length to 8. Leave expiry and server rate limits unchanged.
3. URL Configuration: set Site URL to `https://tradeblackbook.org`. Allow `https://tradeblackbook.org/**` and `blackbook://auth/callback`.
4. Emails > Templates: Confirm signup, Magic link or OTP, and Reset password must each include `{{ .Token }}`. After both updated clients are available, use the code-only body below. Existing clients that depend on links must be updated first.

```html
<h2>Your BlackBook code</h2>
<p>Enter this 8-digit code in BlackBook:</p>
<p style="font-size:32px;letter-spacing:4px;font-weight:bold">{{ .Token }}</p>
<p>If you did not request this code, ignore this email.</p>
```

Suggested subjects: Your BlackBook verification code; Your BlackBook sign-in code; Your BlackBook password reset code.

For an authenticated Management API setup instead, run `python3 scripts/configure-email-codes.py --project-ref aubzkokxxhjdkfqgpjfn --dry-run`, then repeat without `--dry-run`. The script requests a Supabase personal access token at a hidden prompt. It refuses to mutate a project without custom SMTP, backs up affected settings with mode 0600, replaces the three templates with code-only bodies, sets eight-digit codes and the production URL, then rereads and verifies the result. SMTP credentials, expiry and rate limits are preserved. The web version requires an explicit project ref or configured Supabase URL; mobile can derive the project from its public connection JSON. No obsolete project reference is embedded in either setup tool.

## Web release

Merge the web PR, then on the VPS:

```sh
cd /opt/blackbook/index-frontend
git switch main
git pull --ff-only origin main
systemctl restart blackbook-frontend
systemctl is-active blackbook-frontend
```

The change adds no dependencies. The frontend BFF must still receive the current production `BLACKBOOK_PUBLIC_SUPABASE_URL` and matching `BLACKBOOK_PUBLIC_SUPABASE_PUBLISHABLE_KEY` at runtime. Do not add service-role keys. `https://tradeblackbook.org/runtime-config.js` exposes only the public connection for checking the deployed target. The auth asset version changes force clients to request the updated code.

## Android release

The Android APK workflow reads its auth pair from the checked-in public connection. It rejects production auth overrides that differ from that pair, and after compilation inspects the actual APK's JavaScript bundle for the current project/key and unexpected Supabase project URLs. PR builds upload an APK artifact for review. Merging to main builds and publishes the downloadable APK using the existing publishing workflow. Update the VPS downloads through the normal APK deployment process before advertising the new version.

## Verification

Local/CI checks use mocked Auth and do not prove real delivery. After SMTP and client deployment, verify fresh signup, a failed/expired code, resend, code sign-in, recovery, and password sign-in on web and Android. A recovery code must be verified before the new-password form appears. Only a successful server-issued session authenticates the user. Email-code login must not silently create an account. Codes and credentials must not appear in logs or events.
