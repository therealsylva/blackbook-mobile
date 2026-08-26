import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'web', 'blackbook');
const destination = join(root, 'android', 'app', 'src', 'main', 'assets', 'blackbook');

await rm(destination, { force: true, recursive: true });
await mkdir(dirname(destination), { recursive: true });
await cp(source, destination, { recursive: true });

console.log('Bundled canonical index-frontend files into Android assets.');
