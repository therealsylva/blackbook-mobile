#!/usr/bin/env python3
"""Configure hosted Auth from a VPS. Requires a Supabase personal access token."""
import argparse
import getpass
import json
import os
from pathlib import Path
import urllib.error
import urllib.request
from datetime import datetime, timezone

PROJECT_REF = 'ijlpqmfxiybpqvvxrnxf'
ENDPOINT = f'https://api.supabase.com/v1/projects/{PROJECT_REF}/config/auth'
TEMPLATES = [f'mailer_templates_{kind}_content' for kind in ('confirmation', 'magic_link', 'recovery')]
CODE_BLOCK = '<h2>Your BlackBook code</h2><p>Enter this 8-digit code in BlackBook:</p><p style="font-size:32px;letter-spacing:4px;font-weight:bold">{{ .Token }}</p><p>If you did not request this code, ignore this email.</p>'

def desired_config(current):
    # Keep existing web/email links during the mobile rollout. New mobile code
    # entry never follows them. Do not replace existing templates or SMTP settings.
    patch = {'mailer_otp_length': 8, 'site_url': 'https://tradeblackbook.org'}
    for key in TEMPLATES:
        original = current.get(key)
        if not isinstance(original, str) or not original.strip():
            original = '<p><a href="{{ .ConfirmationURL }}">Continue on BlackBook web</a></p>'
        patch[key] = original if '{{ .Token }}' in original else CODE_BLOCK + original
    redirects = [value.strip() for value in (current.get('uri_allow_list') or '').split(',') if value.strip()]
    for value in ('blackbook://auth/callback', 'https://tradeblackbook.org', 'https://tradeblackbook.org/**'):
        if value not in redirects:
            redirects.append(value)
    patch['uri_allow_list'] = ','.join(redirects)
    return patch

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()
    token = os.environ.get('SUPABASE_ACCESS_TOKEN') or getpass.getpass('Supabase personal access token (hidden): ')
    if not token:
        raise SystemExit('A management access token is required, not an anon/service-role key.')
    def request(method, body=None):
        req = urllib.request.Request(ENDPOINT, data=json.dumps(body).encode() if body is not None else None,
            headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}, method=method)
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                return json.load(response)
        except urllib.error.HTTPError as error:
            raise SystemExit(f'Supabase management request failed: HTTP {error.code}. No token or response body printed.') from None
    current = request('GET')
    patch = desired_config(current)
    if args.dry_run:
        print('Dry run: set 8-digit email codes, add code to three templates, fix Site URL and allow mobile callback. Sending/verification limits unchanged.')
        return
    backup = Path(f'blackbook-auth-email-backup-{datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")}.json')
    with open(backup, 'x', encoding='utf-8') as file:
        os.chmod(backup, 0o600)
        json.dump({key: current.get(key) for key in patch}, file, indent=2)
    request('PATCH', patch)
    actual = request('GET')
    if any(actual.get(key) != value for key, value in patch.items()):
        raise SystemExit(f'Auth configuration verification failed. Previous values saved to {backup}.')
    limits = [key for key in current if key.startswith('rate_limit_') or key == 'smtp_max_frequency']
    if any(actual.get(key) != current.get(key) for key in limits):
        raise SystemExit('Auth values saved, but rate-limit values changed concurrently; inspect project settings.')
    print(f'Verified: 8-digit email codes; signup/login/recovery emails contain codes; production Site URL and callback saved. Backup: {backup}')
    print('Sending/verification limits unchanged. Existing web links retained during app rollout.')
    print('Custom SMTP configured: ' + ('yes' if actual.get('smtp_host') else 'no (Supabase shared sender limits still apply)'))

if __name__ == '__main__':
    main()
