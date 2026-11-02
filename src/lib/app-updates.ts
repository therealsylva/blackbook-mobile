import Constants from 'expo-constants';
import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';
import { DOWNLOAD_ROOT, parseUpdate, type AppUpdate } from './update-policy';
export type { AppUpdate } from './update-policy';

export interface UpdateProgress { message: string; percent: number }
type InstallResult = 'permission-required' | 'installer-opened';
interface Updater {
  addListener(event: 'progress', listener: (progress: UpdateProgress) => void): { remove(): void };
  version: string;
  versionCode: number;
  downloadAndInstall(version: string, versionCode: number, url: string, checksum: string | null): Promise<InstallResult>;
  openInstallSettings(): Promise<void>;
}
const updater = Platform.OS === 'android' ? requireOptionalNativeModule<Updater>('BlackBookUpdater') : null;
export const APP_VERSION = updater?.version || Constants.expoConfig?.version || '0.2.18';

export async function checkForUpdate(): Promise<AppUpdate | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${DOWNLOAD_ROOT}update.json`, { signal: controller.signal, headers: { 'Cache-Control': 'no-cache' } });
    if (!response.ok) throw new Error('Update check unavailable. Please try again.');
    return parseUpdate(await response.json(), APP_VERSION, updater?.versionCode ?? 0);
  } finally { clearTimeout(timeout); }
}

export async function downloadUpdate(update: AppUpdate, onProgress: (progress: UpdateProgress) => void): Promise<InstallResult> {
  if (!updater) throw new Error('In-app installation is available in the Android APK.');
  const subscription = updater.addListener('progress', onProgress);
  try {
    return await updater.downloadAndInstall(update.version, update.versionCode ?? 0, update.url, update.sha256 ?? null);
  } finally { subscription.remove(); }
}

export async function openUpdateInstallSettings() {
  if (!updater) throw new Error('App installation settings are available on Android.');
  await updater.openInstallSettings();
}
