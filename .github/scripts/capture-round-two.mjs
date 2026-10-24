import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';import assert from 'node:assert/strict';
import {installConnectedFixture,signInFixture} from './connected-fixture.mjs';
const browser=await chromium.launch({executablePath:process.env.BROWSER_BIN,args:['--no-sandbox']});
try{
 const context=await browser.newContext({viewport:{width:390,height:844}}),fixture=await installConnectedFixture(context),page=await context.newPage();
 console.log('fixture installed');page.setDefaultTimeout(15000);await mkdir('ui-renders',{recursive:true});await signInFixture(page);console.log('signed in');await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
 assert.doesNotMatch(await page.locator('body').innerText(),/US\$/);
 console.log('home ready');await page.getByText('Deposit',{exact:true}).click();await page.getByText('0x'+'1'.repeat(40),{exact:true}).waitFor();
 assert.equal(fixture.requests.filter(r=>r.path==='/v1/wallets').length,1);assert.ok(fixture.requests.find(r=>r.path==='/v1/wallets').body.blockchain==='POLYGON');
 await page.getByRole('button',{name:'Copy deposit address'}).waitFor();await page.waitForTimeout(500);await page.screenshot({path:'ui-renders/review-polygon-deposit.png'});console.log('deposit ready');
 await page.getByLabel('Close',{exact:true}).click();await page.getByText('Withdraw',{exact:true}).click();
 await page.waitForTimeout(400);await page.setViewportSize({width:390,height:390});await page.waitForTimeout(500);const amount=page.getByLabel('Withdrawal amount');await amount.fill('1.25');const address=page.getByLabel('Destination address');await address.fill('0x'+'2'.repeat(40));
 await page.waitForTimeout(300);const box=await address.boundingBox();assert.ok(box.y>=0&&box.y+box.height<=390,JSON.stringify(box));assert.equal(fixture.requests.filter(r=>r.path==='/v1/withdrawals').length,0);
 await page.screenshot({path:'ui-renders/review-withdraw-keyboard-viewport.png'});
 await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Review withdrawal'}).click();assert.equal(fixture.requests.filter(r=>r.path==='/v1/withdrawals').length,0);
 await page.getByRole('button',{name:'Confirm withdrawal request'}).click();await page.getByText('Status: pending_review',{exact:true}).waitFor();assert.equal(fixture.requests.filter(r=>r.path==='/v1/withdrawals').length,1);
 await page.getByLabel('Close',{exact:true}).click();await page.goto('http://127.0.0.1:4173/settings/trading',{waitUntil:'networkidle'});await page.getByText('Theme',{exact:true}).click();await page.getByText('Light',{exact:true}).click();await page.goto('http://127.0.0.1:4173/settings/trading',{waitUntil:'networkidle'});assert.equal(fixture.preferences.appearance,'Dark');await page.getByText('Light',{exact:true}).waitFor();
 assert.deepEqual(fixture.failures,[]);assert.ok(fixture.requests.filter(r=>r.path==='/v1/preferences'&&r.body).every(r=>!('appearance' in r.body)));
 console.log('Round two: literal USD sign, automatic Polygon address, copy control, withdrawal viewport and explicit confirmation passed. Native keyboard and hardware Back still require the APK device check.');
 await context.close();
}finally{await browser.close();}
