import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
export const APP_VERSION = Constants.expoConfig?.version ?? '0.2.1';
export interface AppUpdate { version: string; url: string }
const DOWNLOAD_ROOT = 'https://raw.githubusercontent.com/therealsylva/blackbook-mobile/mobile-apk-downloads/';
function compareVersions(a: string, b: string) {
  const left = a.split('.').map(Number); const right = b.split('.').map(Number);
  for (let index = 0; index < 3; index++) { const difference = (left[index] ?? 0) - (right[index] ?? 0); if (difference) return difference; }
  return 0;
}
export async function checkForUpdate(): Promise<AppUpdate | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${DOWNLOAD_ROOT}update.json`, { signal: controller.signal, headers: { 'Cache-Control': 'no-cache' } });
    if (!response.ok) throw new Error('Update check unavailable. Please try again.');
    const update = await response.json();
    if (typeof update.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(update.version) || update.url !== `${DOWNLOAD_ROOT}BlackBook-${update.version}.apk`) throw new Error('Invalid update information');
    return compareVersions(update.version, APP_VERSION) > 0 ? { version: update.version, url: update.url } : null;
  } finally { clearTimeout(timeout); }
}
export async function downloadUpdate(update: AppUpdate) { await Linking.openURL(update.url); }
