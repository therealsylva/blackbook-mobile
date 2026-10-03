#!/usr/bin/env bash
set -euo pipefail
BB_VERSION=$(node -p "require('./app.json').expo.version")
BB_VERSION_CODE=$(node -p "require('./app.json').expo.android.versionCode")
BB_APK_SOURCE="$RUNNER_TEMP/BlackBook-$BB_VERSION.apk"
BB_DOWNLOAD_TREE="$RUNNER_TEMP/blackbook-apk-downloads"
cp android/app/build/outputs/apk/release/app-release.apk "$BB_APK_SOURCE"
if git ls-remote --exit-code --heads origin refs/heads/mobile-apk-downloads >/dev/null; then
  git fetch origin mobile-apk-downloads --depth=1
  git worktree add --detach "$BB_DOWNLOAD_TREE" FETCH_HEAD
  git -C "$BB_DOWNLOAD_TREE" switch -c mobile-apk-downloads
else
  git worktree add --detach "$BB_DOWNLOAD_TREE" HEAD
  git -C "$BB_DOWNLOAD_TREE" switch --orphan mobile-apk-downloads
fi
cp "$BB_APK_SOURCE" "$BB_DOWNLOAD_TREE/BlackBook-$BB_VERSION.apk"
node - "$BB_DOWNLOAD_TREE/update.json" "$BB_VERSION" "$BB_VERSION_CODE" <<'JS'
const fs = require('node:fs');
const [, , path, version, versionCode] = process.argv;
fs.writeFileSync(path, JSON.stringify({ version, versionCode: Number(versionCode), url: `https://raw.githubusercontent.com/therealsylva/blackbook-mobile/mobile-apk-downloads/BlackBook-${version}.apk` }, null, 2) + '\n');
JS
git -C "$BB_DOWNLOAD_TREE" config user.name 'BlackBook Builds'
git -C "$BB_DOWNLOAD_TREE" config user.email 'github-actions[bot]@users.noreply.github.com'
git -C "$BB_DOWNLOAD_TREE" add "BlackBook-$BB_VERSION.apk" update.json
git -C "$BB_DOWNLOAD_TREE" commit -m "Publish BlackBook $BB_VERSION Android download"
git -C "$BB_DOWNLOAD_TREE" push origin HEAD:refs/heads/mobile-apk-downloads
