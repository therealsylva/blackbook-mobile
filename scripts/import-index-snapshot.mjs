import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const source = resolve(process.argv[2] ?? '../index-price-source');
const selection = JSON.parse(await readFile(join(root, 'scripts/market-selection.json'), 'utf8'));
const pointer = JSON.parse(await readFile(join(source, 'football/current.json'), 'utf8'));
const manifestBytes = await readFile(join(source, pointer.manifest));
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
if (hash(manifestBytes) !== pointer.manifestSha256) throw new Error('Manifest hash mismatch');
const manifest = JSON.parse(manifestBytes);
const rows = []; const movements = [];
for (const file of manifest.files) {
  const bytes = await readFile(join(source, dirname(pointer.manifest), file.name));
  if (hash(bytes) !== file.sha256) throw new Error(`Shard hash mismatch: ${file.name}`);
  const shard = JSON.parse(bytes);
  (file.kind === 'SNAPSHOT' ? rows : movements).push(...shard.rows);
}
const indices = selection.map((entry) => {
  const matches = rows.filter((row) => row.entityId === entry.entityId);
  if (matches.length !== 1 || matches[0].status !== 'AVAILABLE') throw new Error(`Missing canonical index: ${entry.symbol}`);
  const snapshot = matches[0];
  if (!(snapshot.lowerMicros < snapshot.referenceMicros && snapshot.referenceMicros < snapshot.upperMicros)) throw new Error(`Invalid band: ${entry.symbol}`);
  return { ...entry, snapshot, movements: movements.filter((row) => row.entityId === entry.entityId)
    .sort((a, b) => Date.parse(a.asOf) - Date.parse(b.asOf) || a.version - b.version) };
});
await writeFile(join(root, 'src/data/index-snapshot.json'), JSON.stringify({
  sourceRepository: 'therealsylva/index-price', pointer, methodologyVersion: manifest.methodologyVersion,
  bandPolicyVersion: manifest.bandPolicyVersion, indices }, null, 2) + '\n');
console.log(`Imported ${indices.length} hash-verified indices as of ${pointer.asOf}`);
