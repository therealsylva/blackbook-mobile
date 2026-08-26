import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const requiredFiles = [
  'app.json',
  'package.json',
  'src/app/_layout.tsx',
  'src/app/(tabs)/_layout.tsx',
  'src/app/(tabs)/index.tsx',
  'src/app/(tabs)/indices.tsx',
  'src/app/(tabs)/trade.tsx',
  'src/app/(tabs)/portfolio.tsx',
  'src/app/(tabs)/menu.tsx',
  'src/app/market/[symbol].tsx',
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

if (!appJson.expo?.newArchEnabled) {
  failures.push('React Native New Architecture must stay enabled.');
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
  console.log('Blackbook mobile foundation validation passed.');
}
