import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import {installConnectedFixture,signInFixture} from './connected-fixture.mjs';
const browser = await chromium.launch({ executablePath: process.env.BROWSER_BIN, args: ['--no-sandbox'] });
await mkdir('ui-renders', { recursive: true });
const failures = [];
for (const width of [360,390,430]) {
 const context = await browser.newContext({viewport:{width,height:844}});
 const fixture=await installConnectedFixture(context);
 const login=await context.newPage();await signInFixture(login);await login.close();
 for(const [name,route] of [['home',''],['indices','indices'],['overview','market/RMD'],['pair','pair/fcb-rmd'],['artwork','pair/vjr-raph'],['milan','pair/int-acm'],['trade','trade'],['portfolio','portfolio'],['updates','settings/about']]) {
  const page=await context.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  try {
   await page.goto(`http://127.0.0.1:4173/${route}`,{waitUntil:'networkidle'});
   await page.waitForFunction(()=>document.body.innerText.trim().length>20);
   if(['indices','overview','pair'].includes(name)&&/Density|Published reference|vs reference|vs R|Coming Soon/.test(await page.locator('body').innerText()))throw Error('Methodology clutter remains');
   if(name==='home') { await page.getByText('Kylian Mbappé',{exact:true}).waitFor();await page.getByText('Lamine Yamal',{exact:true}).waitFor(); }
   if(name==='pair') {
    await page.getByText('Trade FCB/RMD',{exact:true}).click();
    await page.getByText('Order ticket',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Select 20x leverage',exact:true}).click();
    await page.screenshot({path:`ui-renders/pair-trade-${width}.png`,fullPage:true});
    await page.getByText(/^Review long order$/i).click();
    await page.getByText('Confirm Long',{exact:true}).click();
    await page.waitForFunction(()=>!document.body.innerText.includes('Confirm order'));
    assert.equal(fixture.orders.at(-1)?.body.leverage,20);
    assert.equal(fixture.orders.at(-1)?.mode,'real');
    await page.getByText('Portfolio',{exact:true}).click();
    await page.getByText('FCB/RMD',{exact:true}).filter({visible:true}).first().waitFor();
    await page.screenshot({path:`ui-renders/pair-position-${width}.png`,fullPage:true});
    await page.goto('http://127.0.0.1:4173/pair/fcb-rmd',{waitUntil:'networkidle'});
   }
   if(name==='updates') await page.getByText('Check for updates',{exact:true}).waitFor();
   if(errors.length)throw Error(errors.join('\n'));
   console.log(`${name} ${width}: visible content, no errors`);
  }catch(e){failures.push(`${name} ${width}: ${e.message}`);await writeFile(`ui-renders/${name}-${width}-error.txt`,errors.join('\n')+'\n'+await page.content());}
  await page.screenshot({path:`ui-renders/${name}-${width}.png`,fullPage:true});await page.close();
 }
 const page=await context.newPage();
 try {
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
  await page.getByLabel('Open profile',{exact:true}).click();
  await page.getByText('Preferences',{exact:true}).click();
  const themeSwitch=page.getByRole('switch').first();
  await themeSwitch.setChecked(false);
  await page.getByLabel('Go back',{exact:true}).click();
  await page.getByText('All indices',{exact:true}).click();
  await page.screenshot({path:`ui-renders/indices-light-${width}.png`,fullPage:true});
  await page.getByRole('button',{name:/Real Madrid/}).click();
  await page.getByText('Trade RMD',{exact:true}).waitFor();
  await page.screenshot({path:`ui-renders/overview-light-${width}.png`,fullPage:true});
 }catch(e){failures.push(`light ${width}: ${e.message}`);await page.screenshot({path:`ui-renders/light-error-${width}.png`,fullPage:true});}
 if(width===390){
  const demo=await context.newPage();
  try{
   await demo.goto('http://127.0.0.1:4173/profile',{waitUntil:'networkidle'});
   await demo.getByText('Preferences',{exact:true}).click();await demo.getByText('Account mode',{exact:true}).click();
   const saved=demo.waitForResponse(r=>r.url().endsWith('/v1/preferences')&&r.request().method()==='PUT');
   await demo.getByText('Demo (practice funds)',{exact:true}).click();await saved;
   await demo.reload({waitUntil:'networkidle'});await demo.getByText('Preferences',{exact:true}).click();await demo.getByText('Demo',{exact:true}).waitFor();
   assert.equal(fixture.preferences.accountMode,'demo');assert.equal(fixture.accounts.demo.length,0);assert.equal(fixture.accounts.real.length,1);
   await demo.goto('http://127.0.0.1:4173/pair/fcb-rmd',{waitUntil:'networkidle'});await demo.getByText('Trade FCB/RMD',{exact:true}).click();
   await demo.getByText('Demo · practice funds',{exact:true}).waitFor();await demo.getByRole('button',{name:'Select 20x leverage',exact:true}).click();
   await demo.getByText(/^Review long order$/i).click();await demo.getByText('Confirm Long',{exact:true}).click();await demo.waitForFunction(()=>!document.body.innerText.includes('Confirm order'));
   assert.equal(fixture.orders.at(-1).mode,'demo');assert.equal(fixture.orders.at(-1).body.leverage,20);assert.equal(fixture.accounts.demo.length,1);assert.equal(fixture.accounts.real.length,1);
   console.log('real/demo isolation and persisted preference: passed');
  }catch(e){failures.push('account modes: '+e.message);await demo.screenshot({path:'ui-renders/account-mode-error.png',fullPage:true});}
  await demo.close();
 }
 failures.push(...fixture.failures.splice(0));
 await context.close();
}
await browser.close();
if(failures.length)throw Error(failures.join('\n'));

