import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const requiredFiles = [
  'app.json',
  'package.json',
  'src/app/_layout.tsx',
  'src/app/index.tsx',
  'web/blackbook/index.html',
  'web/blackbook/index-overview.html',
  'web/blackbook/terminal.html',
  'web/blackbook/src/styles/home.css',
  'web/blackbook/src/styles/overview.css',
  'web/blackbook/src/styles/terminal.css',
  'web/blackbook/src/styles/mobile-app.css',
  'web/blackbook/src/pages/home.js',
  'web/blackbook/src/pages/overview.js',
  'web/blackbook/src/pages/terminal.js',
  'web/blackbook/src/pages/mobile-app.js',
];

const failures = [];

for (const path of requiredFiles) {
  try {
    await readFile(join(root, path), 'utf8');
  } catch {
    failures.push(`Missing required file: ${path}`);
  }
}

const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const appJson = JSON.parse(await readFile(join(root, 'app.json'), 'utf8'));

if (packageJson.main !== 'expo-router/entry') {
  failures.push('package.json must use expo-router/entry.');
}

if (appJson.expo?.android?.package !== 'com.modnight.blackbook') {
  failures.push('Unexpected Android application ID.');
}

if (!appJson.expo?.newArchEnabled) failures.push('React Native New Architecture must stay enabled.');

if (packageJson.dependencies?.['react-native-webview'] !== '13.16.1') {
  failures.push('The supported react-native-webview version must stay pinned.');
}

const webEntrypoints = ['index.html', 'index-overview.html', 'terminal.html'];
for (const entrypoint of webEntrypoints) {
  const html = await readFile(join(root, 'web/blackbook', entrypoint), 'utf8');
  if (!html.includes('mobile-app.css') || !html.includes('mobile-app.js')) {
    failures.push(`${entrypoint} must load the mobile arrangement layer.`);
  }
}

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await sourceFiles(path)));
    } else if (/\.(?:ts|tsx|js|mjs|json|ya?ml)$/.test(entry.name)) {
      files.push(path);
    }
  }

  return files;
}

const sensitivePatterns = [
  /AKIA[0-9A-Z]{16}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /(?:secret|password)\s*[:=]\s*["'][^"']{12,}["']/i,
];

for (const path of await sourceFiles(join(root, 'src'))) {
  const content = await readFile(path, 'utf8');
  for (const pattern of sensitivePatterns) {
    if (pattern.test(content)) {
      failures.push(`Possible secret in ${relative(root, path)}.`);
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Blackbook index-frontend mobile port validation passed.');
}
