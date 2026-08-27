# Blackbook Mobile

Blackbook Mobile is the native phone experience for Blackbook index perpetuals. It follows exchange interaction patterns while retaining Blackbook's own market universe and visual identity.

## Product surfaces

- **Home** — balance, quick actions and live movers.
- **All Indices** — the complete searchable market list with prices, 24-hour changes and favorites.
- **Trade** — Basic and Advanced order interfaces over the same local account state.
- **Portfolio** — equity, positions, open orders and trade history.
- **Profile** — account, security, notification and trading preferences.

The current build runs end-to-end on-device: prices move, funds can be added, market positions can be opened and closed, limit/stop orders can be submitted and cancelled, favorites and alerts can be changed, and trading preferences update the order surface. Service integration can replace the context boundary later without redesigning the UI.

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
