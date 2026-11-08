import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = await readFile(join(root, 'assets/blackbook-wordmark.svg'), 'utf8');
const viewBox = source.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
const paths = [...source.matchAll(/<path[^>]*d="([^"]+)"/g)].map((match) => match[1]);

if (!viewBox || paths.length === 0) {
  throw new Error('The canonical BlackBook wordmark is missing its viewBox or paths.');
}

const [, viewportWidth, viewportHeight] = viewBox;
const pathElements = paths
  .map((pathData) => `    <path android:fillColor="#FFFFFF" android:pathData="${pathData.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}" />`)
  .join('\n');

const scale = 400 / Number(viewportWidth);
const vector = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
  android:width="210dp"
  android:height="210dp"
  android:viewportWidth="640"
  android:viewportHeight="640">
  <group
    android:translateX="120"
    android:translateY="225.5"
    android:scaleX="${scale}"
    android:scaleY="${scale}">
${pathElements}
  </group>
</vector>
`;

await writeFile(join(root, 'assets/splashscreen-logo.xml'), vector);
console.log(`Generated Android splash vector from all ${paths.length} wordmark paths.`);
