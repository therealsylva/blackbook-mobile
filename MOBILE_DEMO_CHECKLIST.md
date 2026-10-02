# Football mobile demo

This work is separate from the paused production implementation. Trading/account behaviour remains the local mobile demo; this release does not establish real funding, settlement or production readiness.

- [x] 15 named football clubs and 15 named players.
- [x] Import exact canonical identities, references, asymmetric bands and available movement history from the public index-price publication; verify manifest and shard hashes.
- [x] Display snapshot date (1 September 2026); preserve publication metadata (RC3.1). This mobile change does not change the frozen engine methodology.
- [x] Barcelona FCB, Manchester United MUN; eight agreed ticker pairs.
- [x] Pair overview contains both indices, reference ratio, both R/bands/charts, and distinct overview/trade actions.
- [x] Products removed; artists and other sports appear only as Coming Soon.
- [x] Football sample positions/orders/history/alerts and index-guide feed.
- [x] Published reference history in overviews; ROD, OSI and MUS show snapshot-only history. Trade charts and quotes remain bounded demo activity.
- [x] About BlackBook: check public GitHub releases, compare versions, download newer Android APK through the browser. Android handles installation; no custom signer/wallet/security system.
- [x] Version 0.2.0 / Android versionCode 2; CI creates a downloadable prerelease APK on this branch and future main pushes.
- [ ] CI APK and phone-render checks pass.

Refresh data: clone therealsylva/index-price and run `node scripts/import-index-snapshot.mjs /path/to/index-price`. Snapshot bands persist until superseded; bandHorizonEnd is not an expiry. The import never invents values or history.

Updates: bump Expo/package versions and Android versionCode for each release. CI uploads `BlackBook-VERSION.apk` to tag `mobile-vVERSION`. Settings > About BlackBook detects newer matching tags, including demo prereleases. Keep the existing Android application ID and build signing configuration so Android can update installed builds.
