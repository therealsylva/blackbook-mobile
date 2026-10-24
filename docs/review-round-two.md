# Second deployment review

Scope: the 14 reported items, with the two mobile announcement requests handled by one top-of-page download panel. No icon, image, thumbnail, font or other artwork file is changed.

- Opening a desktop ticket cannot execute an order, even with old one-click settings. New orders require explicit review and confirmation.
- The Android announcement is a top-of-page panel with text and a download CTA, not a floating bottom toast or an icon-only control. The terminal workspace remains unobstructed.
- USD formatting uses a literal dollar sign on Android across locales.
- BAR/RMD resolves legacy FCB/RMD app metadata while preserving the server entity ID used by history.
- Live MUN/MCI reads the reciprocal of archived MCI/MUN history. Open/close/reference are inverted at a 1000 pair base; high/low and upper/lower swap. Actual live executions are never inverted. Pagination, gaps and null archive volume are preserved.
- Funding routes no longer disappear with the paper/production trading-mode switch. An unconfigured service returns funding_not_configured (503), not not_found (404). Private funding data is never cached.
- Deposit defaults to Polygon and automatically requests its address. Existing server wallet identity is reused. Returned addresses must be valid Polygon addresses, and there is an explicit copy action.
- Shared modal sheets resize around the keyboard and scroll the focused input into view. This covers deposit/withdrawal as well as other modal forms.
- Back handling is shared across screens. Back returns through navigation or Home, and is consumed at Home. The Android 13 legacy callback is enabled by disabling predictive-back opt-in in this APK.
- Appearance is stored per device. Account preference reads cannot override the local theme and appearance updates are never sent to the account API.
- Public data requests use bounded caches and coalesce concurrent identical reads. Quotes have short lifetimes; candles/history have longer lifetimes. Errors, balances, orders, sessions and funding responses are not cached. Position exits bypass the mobile public snapshot cache.

## Release and deployment

Install the new 0.2.4 Android APK (versionCode 6); the old installed APK cannot pick up bundled UI/native changes.

The VPS uses docker-compose.mainnet.yml in addition to docker-compose.dev.yml for the production funding configuration. Keep that override on every build/up/exec command. Re-running up with only the base compose file can recreate the API without its mainnet configuration. Do not replace or print the funding secrets. deploy/redeploy-review.sh preserves the override when present and checks API readiness.

No SQL migration or history re-import is required for this round. Deploy the backend and frontend together, install the matching APK with deploy/install-downloads.sh, and hard-refresh the website.

## Verification limits

Automated fixtures exercise order intent, Polygon address presentation, identity mapping, inverse archived candles, device-local theme and cache boundaries. Native Android keyboard/Back must also be checked on the physical phone after installing the APK. Live address generation depends on the running funding service and its configured credentials; a mocked integration is not evidence of a live provider transfer. No deposit or withdrawal transfer is sent during tests.
