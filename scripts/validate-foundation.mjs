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
  'assets/splashscreen-logo.xml',
  'src/app/_layout.tsx',
  'src/app/(tabs)/index.tsx',
  'src/app/(tabs)/indices.tsx',
  'src/app/(tabs)/trade.tsx',
  'src/app/(tabs)/portfolio.tsx',
  'src/app/(tabs)/feed.tsx',
  'src/app/profile.tsx',
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
if (packageJson.dependencies?.['expo-symbols']) failures.push('expo-symbols must not replace the Lucide icon system.');
if (!packageJson.dependencies?.['lucide-react-native']) failures.push('Lucide must be the shared mobile icon system.');
if (packageJson.scripts?.['bundle:web']) failures.push('Website bundling is forbidden in the native exchange app.');
if (appJson.expo?.icon !== './assets/icon.png') failures.push('The Blackbook app icon is not configured.');
if (appJson.expo?.android?.adaptiveIcon?.foregroundImage !== './assets/adaptive-icon.png') failures.push('The adaptive icon is not configured.');

const splashPlugin = appJson.expo?.plugins?.find((plugin) => Array.isArray(plugin) && plugin[0] === 'expo-splash-screen');
if (!splashPlugin || splashPlugin[1]?.image !== './assets/splash-icon.png') failures.push('The Blackbook splash mark is not configured.');
if (splashPlugin?.[1]?.android?.drawable?.icon !== './assets/splashscreen-logo.xml') failures.push('Android must render the canonical wordmark as a native vector drawable.');
const splashVector = await readFile(join(root, 'assets/splashscreen-logo.xml'), 'utf8');
if (!/android:width="210dp"[\s\S]+android:height="210dp"/.test(splashVector) || !/android:viewportWidth="640"[\s\S]+android:viewportHeight="640"/.test(splashVector) || !/<group[\s\S]+android:translateX="120"[\s\S]+android:translateY="225\.5"/.test(splashVector)) {
  failures.push('Android splash wordmark must retain its square, padded system-splash safe area.');
}

const marketSource = await readFile(join(root, 'src/data/markets.ts'), 'utf8');
const marketCount = (marketSource.match(/"symbol":/g) ?? []).length;
const priceCount = (marketSource.match(/"price":/g) ?? []).length;
if (marketCount < 37 || priceCount < 37) failures.push('All Indices must include the approved 37 priced markets.');
if (/"symbol":\s*"(?:MUSK|RMD\/LMY)"/.test(marketSource)) failures.push('Removed indices remain in the market catalog.');

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
  { pattern: /Trade what you know|mobile-app\.css|bundle:web/i, label: 'website-port language' },
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

const tabsSource = await readFile(join(root, 'src/app/(tabs)/_layout.tsx'), 'utf8');
if (/name=["']profile["']/.test(tabsSource)) failures.push('Profile must not appear in the bottom navigation.');
if (!/name=["']feed["']/.test(tabsSource)) failures.push('Feed must appear in the bottom navigation.');
if (!/backBehavior=["']history["']/.test(tabsSource) || !/initialRouteName=["']index["']/.test(tabsSource)) failures.push('Android back navigation must preserve tab history and the Home root.');
if (/tabBarIcon:[^\n]+filled=/.test(tabsSource)) failures.push('Active bottom navigation icons must remain outline-only.');
if (!/freezeOnBlur:\s*true/.test(tabsSource) || !/lazy:\s*true/.test(tabsSource)) failures.push('Inactive tabs must stay frozen and screens must remain lazy-mounted.');

const portfolioSource = await readFile(join(root, 'src/app/(tabs)/portfolio.tsx'), 'utf8');
if (!/function JournalList[\s\S]+MarketAvatar[\s\S]+journalTicker/.test(portfolioSource)) failures.push('Portfolio Journal entries must include the market icon and ticker.');

const avatarSource = await readFile(join(root, 'src/components/market/market-avatar.tsx'), 'utf8');
if (!/assetKey === 'nba-icon'[\s\S]+NbaMark/.test(avatarSource)) failures.push('NBA must use the dedicated full-color vector mark.');
if (!/assetKey === 'apple' \? '#000000'/.test(avatarSource)) failures.push('Apple must retain its permanent black tile in both themes.');
if (!/apple:\s*0\.94/.test(avatarSource)) failures.push('Apple must retain its corrected optical scale.');
if (!/premier-league[\s\S]+#FFFFFF[\s\S]+#3D195B/.test(avatarSource)) failures.push('Premier League must retain its high-contrast lion treatment.');
const nbaSource = await readFile(join(root, 'src/components/market/nba-mark.tsx'), 'utf8');
if (!/viewBox="0 0 271 615"/.test(nbaSource) || /viewBox="0 0 1054 615"/.test(nbaSource)) failures.push('NBA must use the centered vertical identity instead of the squeezed horizontal lockup.');

const appSource = (await Promise.all((await sourceFiles(join(root, 'src'))).map((path) => readFile(path, 'utf8')))).join('\n');
if (/fundingBalance|transferFunds|Trading account|Funding account/.test(appSource)) failures.push('Crypto account splits or transfer flows remain in the app.');
if (/\/POINT/.test(appSource)) failures.push('Hardcoded /POINT labels remain in the UI.');

const indicesSource = await readFile(join(root, 'src/app/(tabs)/indices.tsx'), 'utf8');
if (!/<FlatList/.test(indicesSource) || !/initialNumToRender=\{8\}/.test(indicesSource) || /<ScrollView contentContainerStyle=\{styles\.content\}/.test(indicesSource)) failures.push('All Indices must remain virtualized for fast tab switching.');
for (const legacy of ["'Sports'", "'Music'", "'People'", "'Relative'"]) {
  if (indicesSource.includes(legacy)) failures.push(`Legacy directory category remains: ${legacy}.`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Blackbook mobile validation passed: locked navigation, Lucide icons, market universe, account model, app icon and splash.');
}
