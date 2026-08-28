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

The current build runs end-to-end on-device: prices move, funds can be deposited or withdrawn, positions can be opened and closed, limit/stop orders can be submitted and cancelled, favorites and alerts can be changed, and trading preferences update the order surface. Service integration can replace the context boundary later without redesigning the UI.

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
