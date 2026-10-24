import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {installConnectedFixture,signInFixture} from './connected-fixture.mjs';
const width=Number(process.env.REVIEW_WIDTH||390);
const browser=await chromium.launch({executablePath:process.env.BROWSER_BIN,args:['--no-sandbox',...(process.env.REVIEW_SINGLE_PROCESS?['--no-zygote','--single-process']:[])]});
try{
 const context=await browser.newContext({viewport:{width,height:844}});
 if(process.env.REVIEW_LOCAL_ROUTE){
  const {readFile}=await import('node:fs/promises');const path=await import('node:path');
  await context.route('http://127.0.0.1:4173/**',async route=>{let p=new URL(route.request().url()).pathname;if(p==='/')p='/index.html';else if(!path.extname(p))p+='.html';try{await route.fulfill({body:await readFile(path.resolve('dist','.'+p)),contentType:({'.html':'text/html','.js':'application/javascript','.css':'text/css','.woff2':'font/woff2','.png':'image/png','.ttf':'font/ttf'})[path.extname(p)]||'application/octet-stream'});}catch{await route.fulfill({status:404,body:''});}});
 }
 const fixture=await installConnectedFixture(context);const page=await context.newPage();page.setDefaultTimeout(20000);
 await signInFixture(page);await page.goto('http://127.0.0.1:4173/trade',{waitUntil:'networkidle'});
 const amount=page.getByLabel('Amount',{exact:true});await amount.fill('1000');
 await page.getByRole('button',{name:'Select 20x leverage',exact:true}).click();
 const fee=page.getByText('Fee',{exact:true}).locator('..');
 await assert.doesNotReject(async()=>{await page.waitForFunction(()=>{const t=document.body.innerText;return /Estimated fee \$12\.00/.test(t);});});
 assert.match(await fee.innerText(),/\$12\.00/);
 const liq=page.getByText('Est. liquidation',{exact:true}).locator('..');assert.doesNotMatch(await liq.innerText(),/—|Below zero/);
 const longText=await liq.innerText();
 await page.getByText('Short',{exact:true}).click();await page.waitForTimeout(100);
 assert.notEqual(await liq.innerText(),longText);assert.doesNotMatch(await liq.innerText(),/—/);
 await page.getByRole('button',{name:'Select 1x leverage',exact:true}).click();await page.getByText('Long',{exact:true}).click();await page.getByText('Below zero',{exact:true}).waitFor();
 assert.doesNotMatch(await page.locator('body').innerText(),/History uses hourly source candles|larger intervals aggregate/);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await mkdir('ui-renders',{recursive:true});await page.screenshot({path:`ui-renders/fee-liquidation-${width}.png`,fullPage:true});
 fixture.accounts.real.push({marketId:'fixture:rmd',positionLots:'100000',entryPriceTicks:'6234625700',markPriceTicks:'6234625700',leverage:4.999999999999991,heldMarginMinor:'10000',unrealizedPnlMinor:'0',openedAt:new Date().toISOString()});
 await page.goto('http://127.0.0.1:4173/portfolio',{waitUntil:'networkidle'});await page.getByText('Long · 5x',{exact:true}).waitFor();assert.doesNotMatch(await page.locator('body').innerText(),/4\.999999/);
 await page.goto('http://127.0.0.1:4173/indices',{waitUntil:'networkidle'});assert.doesNotMatch(await page.locator('body').innerText(),/Osimhen|\bOSI\b/);
 assert.deepEqual(fixture.failures,[]);console.log(`Passed ${width}px: nonzero fee summary, finite long/short liquidation, fully collateralized long label and OSI absent from discovery.`);
}finally{await browser.close();}
