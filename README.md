# Blackbook Mobile

Blackbook Mobile is the native phone experience for Blackbook index perpetuals. It follows exchange interaction patterns while retaining Blackbook's own market universe and visual identity.

## Product surfaces

- **Home** — balance, deposit and withdrawal, favorites and live movers.
- **All Indices** — searchable clubs, leagues, athletes, artists and products, plus major rivalry pairs.
- **Overview** — market identity, alert and favorite controls, frontend-matched line charts and index context.
- **Trade** — distinct Basic and compact Advanced order interfaces selected only in Preferences.
- **Portfolio** — equity, collapsed positions, contextual open orders and a proper trade journal.
- **Feed** — highlights, news, strategies, gainers, losers, volume and volatility coverage.
- **User center** — editable identity, security, notification and trading preferences, reached from the Home avatar.

The app opens on public markets. Quotes and published index history are available without an account; account balances, funding, orders and portfolio data require a signed-in Supabase session. Guest preferences stay on the device, and private data resets when the account changes. Authentication uses email and password only.

Release builds include the public connection settings in `src/lib/public-connection.json`. An alternate environment can override `EXPO_PUBLIC_BLACKBOOK_API_URL`, `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (override the auth pair together). These settings are public; never put a service-role key in a mobile bundle. `npm run check:connection` rejects incomplete or unsafe release configuration before APK compilation. GitHub Actions accepts the same names as repository variables.

Supabase Email must remain enabled. Allow `blackbook://auth/callback` in Auth redirect URLs for confirmation and password recovery links to return to the Android app. Existing website redirects can remain. The app reports provider errors inline and tells users to confirm their email when required; email delivery and redirect settings belong to the Supabase project.

## Run locally

```bash
npm install
npm run check
npm start
```

## Build an ARM64 release APK

```bash
npm install
npm run build:apk
```

The APK is written to `android/app/build/outputs/apk/release/app-release.apk`.

The public GitHub Actions workflow performs validation, Expo alignment, TypeScript checking and a stripped ARM64 release build. Never commit signing keys, passwords or production credentials.

No license is granted by the presence of this public source repository.
