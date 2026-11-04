import assert from 'node:assert/strict';
import {mkdir,readFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {installConnectedFixture,signInFixture} from './connected-fixture.mjs';

const app=JSON.parse(await readFile(new URL('../../app.json',import.meta.url),'utf8')).expo;
const versionParts=app.version.split('.').map(Number);
versionParts[2]+=1;
const nextVersion=versionParts.join('.'),nextCode=app.android.versionCode+1;
const browser=await chromium.launch({executablePath:process.env.BROWSER_BIN,args:['--no-sandbox']});
await mkdir('ui-renders',{recursive:true});
try {
  for (const width of [360,390,430]) {
    const context=await browser.newContext({viewport:{width,height:844}});
    const fixture=await installConnectedFixture(context);
    const pair=fixture.catalog.find(m=>m.kind==='PAIR');
    for (const market of fixture.catalog) market.statistics={lastPriceTicks:market.referenceTicks,changePct24h:0,volumeMinor24h:'100',rangePct24h:0.1};
    pair.statistics.volumeMinor24h='9000000';pair.statistics.rangePct24h=9;
    const market=fixture.catalog.find(m=>m.symbol==='RMD');
    const fill={marketId:market.marketId,quantityLots:'100',priceTicks:market.referenceTicks,leverage:5,createdAt:'2026-11-02T10:00:00Z'};
    fixture.fills.real.push({...fill,fillId:'entry',orderId:'entry',side:'BID',realizedPnlMinor:'0',feeMinor:'6'}, {...fill,fillId:'exit',orderId:'exit',side:'ASK',realizedPnlMinor:'1000',feeMinor:'6'});
    const page=await context.newPage();await signInFixture(page);
    await page.goto('http://127.0.0.1:4173/portfolio',{waitUntil:'networkidle'});
    await page.getByText(/\$9\.88 realized/).waitFor();
    await page.getByText('P&L',{exact:true}).click();
    await page.getByText('+$9.94',{exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
    await page.screenshot({path:`ui-renders/pnl-history-${width}.png`,fullPage:true});
    await page.goto('http://127.0.0.1:4173/feed',{waitUntil:'networkidle'});
    await page.getByText('Movers',{exact:true}).click();
    await page.getByText(pair.displayName,{exact:true}).first().waitFor();
    assert.ok((await page.getByText(pair.displayName,{exact:true}).count())>=2,'pair appears in volume and volatility rankings');
    await page.screenshot({path:`ui-renders/pair-rankings-${width}.png`,fullPage:true});
    for(const theme of ['Dark','Light']) {
      await page.goto('http://127.0.0.1:4173/profile',{waitUntil:'networkidle'});
      await page.getByText('Preferences',{exact:true}).click();
      await page.getByText('Theme',{exact:true}).click();
      await page.getByText(theme,{exact:true}).last().click();
      await page.goto('http://127.0.0.1:4173/market/JUV',{waitUntil:'networkidle'});
      await page.screenshot({path:`ui-renders/juventus-${theme.toLowerCase()}-${width}.png`,fullPage:true});
      await page.goto('http://127.0.0.1:4173/pair/int-acm',{waitUntil:'networkidle'});
      await page.screenshot({path:`ui-renders/milan-${theme.toLowerCase()}-${width}.png`,fullPage:true});
    }
    await context.route('https://tradeblackbook.org/downloads/update.json',route=>route.fulfill({json:{version:nextVersion,versionCode:nextCode,url:`https://tradeblackbook.org/downloads/BlackBook-${nextVersion}.apk`}}));
    await page.goto('http://127.0.0.1:4173/settings/about',{waitUntil:'networkidle'});
    await page.getByText('Check for updates',{exact:true}).click();
    await page.getByText(`Version ${nextVersion} available`,{exact:true}).waitFor();
    await page.screenshot({path:`ui-renders/update-check-${width}.png`,fullPage:true});
    await context.close();console.log(`UI changes ${width}: net P&L, pairs, themed Juventus/Milan and update checking passed`);
  }
} finally {await browser.close();}
