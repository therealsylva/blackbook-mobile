# Blackbook Mobile

The mobile exchange for Blackbook's continuous real-world performance indices.

Blackbook Mobile is intentionally split into two interfaces over one account and one market state:

- **Basic** — discovery, clear index movement, simple Long/Short execution, and portfolio essentials.
- **Advanced** — candlesticks, market depth, complete order controls, positions, orders, and risk detail.

The navigation remains stable in both modes: **Home · All Indices · Trade · Portfolio · Menu**.

## Foundation

- Expo SDK 57
- React Native 0.86
- React 19.2
- TypeScript 6 in strict mode
- Expo Router
- React Native New Architecture
- Android and iOS from one codebase

The first checkpoint is deliberately frontend-only. All displayed markets, positions, balances, and events come from clearly isolated fixture data. Order review is non-executing until the production API contract is connected.

## Run locally

```bash
npm install
npm run check
npm start
```

## Build an APK

The `Android APK` GitHub Actions workflow validates the app, generates the native Android project, builds an installable debug APK, and uploads it as a workflow artifact.

You can also build locally with:

```bash
npm install
npm run build:apk
```

The APK will be written to `android/app/build/outputs/apk/debug/app-debug.apk`.

## Public-repository security

This repository is public by design so APK compilation can use public GitHub Actions capacity. Never commit signing keystores, passwords, private API credentials, service-role keys, or production secrets. Release signing will use encrypted Actions secrets when it is introduced.

No license is granted by the presence of this public source repository.
