# Blackbook Mobile

The mobile port of Blackbook's existing `index-frontend` product.

The web frontend is the source of truth. Its home modules, index overview, terminal, search catalogue, copy, market states, charts, assets, icons, auth surface, and availability fences are bundled unchanged. `mobile-app.css` and `mobile-app.js` only rearrange those surfaces for a phone.

Canonical source snapshot: `therealsylva/index-frontend@df65ecc5235952eef547839a569bc0c4a40ff613`.

- **Home** is the complete Blackbook homepage in its original order.
- **All Indices** opens the existing index and symbol search.
- **Trade** opens the existing Blackbook terminal.
- **Basic / Advanced** maps to the existing Index Overview / Terminal pages.
- **Portfolio** retains the same unavailable state as `index-frontend`; no fixture portfolio was invented.

The Android shell is deliberately thin: Expo SDK 57, React Native 0.86, Expo Router, and `react-native-webview`. It exists to package the canonical frontend and provide native lifecycle/back-navigation behavior—not to redesign Blackbook as a different exchange.

## Run locally

```bash
npm install
npm run check
npm start
```

## Build an APK

The `Android APK` GitHub Actions workflow validates the port, copies the complete frontend into Android assets, builds a standalone ARM64 release APK, and uploads it as a workflow artifact. The verifier rejects an APK missing the homepage, Blackbook logo, hero art, embedded JavaScript bundle, or ARM64 native libraries.

You can also build locally with:

```bash
npm install
npm run build:apk
```

The APK will be written to `android/app/build/outputs/apk/release/app-release.apk`.

## Public-repository security

This repository is public by design so APK compilation can use public GitHub Actions capacity. Never commit signing keystores, passwords, private API credentials, service-role keys, or production secrets. Test releases use the generated development signing identity; store releases will use encrypted Actions secrets when signing is introduced.

No license is granted by the presence of this public source repository.
