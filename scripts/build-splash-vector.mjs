import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = await readFile(join(root, 'assets/blackbook-wordmark.svg'), 'utf8');
const viewBox = source.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
const primaryPath = source.match(/<path[^>]*id="path0"[^>]*d="([^"]+)"/);

if (!viewBox || !primaryPath) {
  throw new Error('The canonical BlackBook wordmark is missing its viewBox or primary path.');
}

const widthDp = 210;
const canvasSize = 640;
const translateX = 120;
const translateY = 225.5;
const pathData = primaryPath[1].replaceAll('&', '&amp;').replaceAll('"', '&quot;');
const vector = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
  android:width="${widthDp}dp"
  android:height="${widthDp}dp"
  android:viewportWidth="${canvasSize}"
  android:viewportHeight="${canvasSize}">
  <group
    android:translateX="${translateX}"
    android:translateY="${translateY}">
    <path
      android:fillColor="#FFFFFF"
      android:pathData="${pathData}" />
  </group>
</vector>
`;

await writeFile(join(root, 'assets/splashscreen-logo.xml'), vector);
console.log('Generated a padded Android splash vector from assets/blackbook-wordmark.svg.');
