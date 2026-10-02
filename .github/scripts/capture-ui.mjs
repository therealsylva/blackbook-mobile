import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const browser = await chromium.launch({ executablePath: process.env.BROWSER_BIN, args: ['--no-sandbox'] });
await mkdir('ui-renders', { recursive: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const failures = [];
for (const [name, route] of [['home', ''], ['indices', 'indices'], ['trade', 'trade'], ['portfolio', 'portfolio'], ['pair', 'pair/fcb-rmd'], ['updates', 'settings/about']]) {
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  try {
    await page.goto(`http://127.0.0.1:4173/${route}`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.body.innerText.trim().length > 20, { timeout: 15000 });
    if (name === 'pair') {
      await page.getByRole('button', { name: 'Trade FCB', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Trade RMD', exact: true }).waitFor();
    }
    if (name === 'updates') await page.getByText('Check for updates', { exact: true }).waitFor();
    if (errors.length) throw new Error(errors.join('\n'));
    console.log(`${name}: visible app content, no browser errors`);
  } catch (error) {
    failures.push(`${name}: ${error.message}`);
    await writeFile(`ui-renders/${name}-errors.txt`, errors.join('\n') + '\n' + await page.content());
  }
  await page.screenshot({ path: `ui-renders/${name}-390.png`, fullPage: true });
  await page.close();
}
await browser.close();
if (failures.length) throw new Error(failures.join('\n'));
