export const DOWNLOAD_ROOT = 'https://tradeblackbook.org/downloads/';
export interface AppUpdate { version: string; versionCode?: number; url: string; sha256?: string }

export function compareVersions(a: string, b: string) {
  const left = a.split('.').map(Number), right = b.split('.').map(Number);
  for (let index = 0; index < Math.max(left.length, right.length); index++) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0);
    if (difference) return difference;
  }
  return 0;
}

export function parseUpdate(value: unknown, currentVersion: string, currentCode = 0): AppUpdate | null {
  const update = value as AppUpdate | null;
  if (!update || typeof update.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(update.version)
    || update.url !== `${DOWNLOAD_ROOT}BlackBook-${update.version}.apk`
    || (update.versionCode !== undefined && (!Number.isSafeInteger(update.versionCode) || update.versionCode <= 0))
    || (update.sha256 !== undefined && !/^[a-fA-F0-9]{64}$/.test(update.sha256))) throw new Error('Invalid update information');
  const newer = currentCode > 0 && update.versionCode !== undefined
    ? update.versionCode > currentCode : compareVersions(update.version, currentVersion) > 0;
  return newer ? { version: update.version, versionCode: update.versionCode, url: update.url, sha256: update.sha256 } : null;
}
