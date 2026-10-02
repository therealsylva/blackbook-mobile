import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
export const APP_VERSION = Constants.expoConfig?.version ?? '0.2.0';
interface Release { draft: boolean; tag_name: string; assets: { name: string; browser_download_url: string }[] }
export interface AppUpdate { version: string; url: string }
function compareVersions(a: string, b: string) {
  const left = a.split('.').map(Number); const right = b.split('.').map(Number);
  for (let index = 0; index < 3; index++) { const difference = (left[index] ?? 0) - (right[index] ?? 0); if (difference) return difference; }
  return 0;
}
export async function checkForUpdate(): Promise<AppUpdate | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch('https://api.github.com/repos/therealsylva/blackbook-mobile/releases?per_page=20', { signal: controller.signal, headers: { Accept: 'application/vnd.github+json' } });
    if (!response.ok) throw new Error('Update check unavailable. Please try again.');
    const releases: Release[] = await response.json();
    const updates = releases.filter((release) => !release.draft).flatMap((release) => {
      const version = /^mobile-v(\d+\.\d+\.\d+)$/.exec(release.tag_name)?.[1];
      const apk = release.assets.find((asset) => asset.name === `BlackBook-${version}.apk`);
      return version && apk && compareVersions(version, APP_VERSION) > 0 && apk.browser_download_url.startsWith('https://github.com/therealsylva/blackbook-mobile/releases/download/') ? [{ version, url: apk.browser_download_url }] : [];
    });
    return updates.sort((a, b) => compareVersions(b.version, a.version))[0] ?? null;
  } finally { clearTimeout(timeout); }
}
export async function downloadUpdate(update: AppUpdate) { await Linking.openURL(update.url); }
