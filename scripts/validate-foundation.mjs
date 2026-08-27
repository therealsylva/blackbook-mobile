import { readFile, readdir } from 'node:fs/promises';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

const requiredFiles = [
  'app.json',
  'package.json',
  'assets/icon.png',
  'assets/adaptive-icon.png',
  'assets/splash-icon.png',
  'src/app/_layout.tsx',
  'src/app/(tabs)/index.tsx',
  'src/app/(tabs)/indices.tsx',
  'src/app/(tabs)/trade.tsx',
  'src/app/(tabs)/portfolio.tsx',
  'src/app/(tabs)/profile.tsx',
  'src/app/market/[symbol].tsx',
  'src/app/settings/index.tsx',
  'src/app/settings/trading.tsx',
  'src/app/settings/notifications.tsx',
  'src/app/settings/security.tsx',
  'src/context/exchange-context.tsx',
  'src/data/markets.ts',
];

for (const path of requiredFiles) {
  try {
    await readFile(join(root, path));
  } catch {
    failures.push('Missing required file: ' + path);
  }
}

const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const appJson = JSON.parse(await readFile(join(root, 'app.json'), 'utf8'));

if (packageJson.main !== 'expo-router/entry') failures.push('package.json must use expo-router/entry.');
if (appJson.expo?.android?.package !== 'com.modnight.blackbook') failures.push('Unexpected Android application ID.');
if (!appJson.expo?.newArchEnabled) failures.push('React Native New Architecture must stay enabled.');
if (packageJson.dependencies?.['react-native-webview']) failures.push('WebView is forbidden in the native exchange app.');
if (packageJson.scripts?.['bundle:web']) failures.push('Website bundling is forbidden in the native exchange app.');
if (appJson.expo?.icon !== './assets/icon.png') failures.push('The Blackbook app icon is not configured.');
if (appJson.expo?.android?.adaptiveIcon?.foregroundImage !== './assets/adaptive-icon.png') failures.push('The adaptive icon is not configured.');

const splashPlugin = appJson.expo?.plugins?.find((plugin) => Array.isArray(plugin) && plugin[0] === 'expo-splash-screen');
if (!splashPlugin || splashPlugin[1]?.image !== './assets/splash-icon.png') failures.push('The Blackbook splash mark is not configured.');

const marketSource = await readFile(join(root, 'src/data/markets.ts'), 'utf8');
const marketCount = (marketSource.match(/"symbol":/g) ?? []).length;
const priceCount = (marketSource.match(/"price":/g) ?? []).length;
if (marketCount < 39 || priceCount < 39) failures.push('All Indices must include at least 39 priced markets.');

const marketAssets = await readdir(join(root, 'src/assets/indices'));
if (marketAssets.filter((name) => ['.jpg', '.jpeg', '.png'].includes(extname(name).toLowerCase())).length < 35) {
  failures.push('The mobile market artwork set is incomplete.');
}

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await sourceFiles(path));
    else if (/\.(?:ts|tsx|js|mjs|json|ya?ml)$/.test(entry.name)) files.push(path);
  }
  return files;
}

const forbiddenProductPatterns = [
  { pattern: /\bWebView\b|react-native-webview/i, label: 'WebView code' },
  { pattern: /\b(?:simulat(?:ed|ion)?|fixture|preview|demo|disconnected)\b/i, label: 'scaffolding language' },
  { pattern: /index methodology|Trade what you know|mobile-app\.css|bundle:web/i, label: 'website-port language' },
];
const sensitivePatterns = [
  /AKIA[0-9A-Z]{16}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /(?:secret|password)\s*[:=]\s*["'][^"']{12,}["']/i,
];

for (const path of await sourceFiles(join(root, 'src'))) {
  const content = await readFile(path, 'utf8');
  for (const item of forbiddenProductPatterns) {
    if (item.pattern.test(content)) failures.push(item.label + ' found in ' + relative(root, path) + '.');
  }
  for (const pattern of sensitivePatterns) {
    if (pattern.test(content)) failures.push('Possible secret in ' + relative(root, path) + '.');
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Blackbook native exchange validation passed: 39 markets, local trading flow, app icon and splash.');
}
