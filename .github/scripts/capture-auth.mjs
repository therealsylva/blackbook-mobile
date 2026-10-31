import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {installConnectedFixture} from './connected-fixture.mjs';
const browser=await chromium.launch({executablePath:process.env.BROWSER_BIN,args:['--no-sandbox','--disable-dev-shm-usage']});
await mkdir('ui-renders',{recursive:true});
for(const width of [360,390,430]){
 const context=await browser.newContext({viewport:{width,height:width===360?800:width===390?844:932}});
 const fixture=await installConnectedFixture(context),page=await context.newPage(),errors=[],authRequests=[];
 page.setDefaultTimeout(15000);
 page.on('pageerror',error=>errors.push(error.message));
 let rejectLogin=false,failSignup=false;
 await context.route('https://auth.blackbook.test/**',async route=>{
  const request=route.request(),path=new URL(request.url()).pathname,body=request.postDataJSON();
  authRequests.push({path,body});
  if(path.endsWith('/signup'))return route.fulfill({status:failSignup?429:200,contentType:'application/json',json:failSignup?{msg:'Please wait before requesting another email.'}:{id:'00000000-0000-4000-8000-000000005001',email:body.email,identities:[]}});
  if(path.endsWith('/verify')&&body.token!=='12345678')return route.fulfill({status:403,contentType:'application/json',json:{msg:'Code is invalid or has expired.'}});
  if(path.endsWith('/otp')||path.endsWith('/resend'))return route.fulfill({status:failSignup?429:200,contentType:'application/json',json:failSignup?{msg:'Please wait before requesting another email.'}:{}});
  if(path.endsWith('/recover'))return route.fulfill({status:200,contentType:'application/json',json:{}});
  if(path.endsWith('/token')&&rejectLogin)return route.fulfill({status:400,contentType:'application/json',json:{error:'invalid_grant',error_description:'Invalid login credentials'}});
  return route.fallback();
 });
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
 await page.getByText('Real Madrid C.F.',{exact:true}).last().waitFor();
 assert.equal(authRequests.length,0,'Browsing must not call Auth');
 assert.equal(fixture.requests.filter(r=>!r.path.startsWith('/v1/markets')&&!r.path.startsWith('/v1/indices')).length,0,'Guest browsing must not fetch private endpoints');
 await page.getByRole('button',{name:/Real Madrid/}).click();await page.getByText('Trade RMD',{exact:true}).click();
 await page.getByRole('button',{name:'Sign in to trade',exact:true}).click();await page.getByLabel('Email',{exact:true}).waitFor();assert.equal(fixture.orders.length,0);
 await page.getByRole('button',{name:'Browse markets first',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});
 await page.getByText('Explore BlackBook',{exact:true}).last().waitFor();
 await page.getByRole('button',{name:'Create account',exact:true}).last().click();
 await page.getByRole('heading',{name:'Create your account',exact:true}).waitFor();
 assert.doesNotMatch(await page.locator('body').innerText(),/Google|connection configuration/i);
 // Wait for the modal slide to settle before comparing two screen-space boxes.
 // Trial clicks run Playwright's visibility/stability checks without navigating.
 await page.getByRole('button',{name:'Browse markets first',exact:true}).last().click({trial:true});
 const browse=await page.getByRole('button',{name:'Browse markets first',exact:true}).last().boundingBox(),email=await page.getByLabel('Email',{exact:true}).last().boundingBox();
 assert.ok(browse.width>=email.width-4&&browse.height>=48&&browse.y<email.y,`Browse button (${browse.width}×${browse.height}) must match the email field (${email.width}px) and appear above it`);
 await page.screenshot({path:`ui-renders/signup-${width}.png`,fullPage:true,animations:'disabled'});
 await page.getByRole('button',{name:'Create account',exact:true}).last().click();
 await page.getByText('Enter a valid email address.',{exact:true}).waitFor();assert.equal(authRequests.length,0);
 await page.getByLabel('Email',{exact:true}).fill('new@blackbook.test');await page.getByLabel('Password',{exact:true}).fill('new-password');
 await page.getByRole('button',{name:'Show password',exact:true}).click();assert.equal(await page.getByLabel('Password',{exact:true}).evaluate(element=>element.type),'text');
 await page.getByRole('button',{name:'Create account',exact:true}).last().click();
 await page.getByLabel('8-digit code',{exact:true}).waitFor();assert.equal(authRequests.at(-1).path,'/auth/v1/signup');assert.equal(authRequests.at(-1).body.email,'new@blackbook.test');
 await page.getByLabel('8-digit code',{exact:true}).fill('1234');await page.getByRole('button',{name:'Verify code',exact:true}).click();
 await page.getByText('Enter the 8-digit code from your email.',{exact:true}).waitFor();assert.equal(authRequests.at(-1).path,'/auth/v1/signup');
 await page.getByLabel('8-digit code',{exact:true}).fill('00000000');await page.getByRole('button',{name:'Verify code',exact:true}).click();await page.getByText('Code is invalid or has expired.',{exact:true}).waitFor();
 failSignup=true;await page.getByRole('button',{name:'Resend code',exact:true}).click();
 await page.getByText('Please wait before requesting another email.',{exact:true}).waitFor();
 failSignup=false;await page.getByRole('button',{name:'Resend code',exact:true}).click();assert.equal(authRequests.at(-1).path,'/auth/v1/resend');assert.equal(authRequests.at(-1).body.type,'signup');
 await page.getByLabel('8-digit code',{exact:true}).fill('12345678');await page.getByRole('button',{name:'Verify code',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});assert.equal(authRequests.findLast(r=>r.path.endsWith('/verify')).body.type,'signup');
 // Clear the fixture session, then verify recovery and email login independently.
 await page.evaluate(()=>localStorage.clear());await page.reload({waitUntil:'networkidle'});
 await page.getByRole('button',{name:'Sign in',exact:true}).last().click();await page.getByLabel('Email',{exact:true}).fill('ui@blackbook.test');
 await page.getByRole('button',{name:'Forgot password?',exact:true}).click();await page.getByRole('button',{name:'Send code',exact:true}).click();
 await page.getByLabel('8-digit code',{exact:true}).fill('12345678');await page.getByRole('button',{name:'Verify code',exact:true}).click();await page.getByRole('heading',{name:'Choose a new password',exact:true}).waitFor();assert.equal(authRequests.findLast(r=>r.path.endsWith('/verify')).body.type,'recovery');
 await page.getByLabel('Password',{exact:true}).fill('updated-password');await page.getByRole('button',{name:'Save password',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});
 await page.evaluate(()=>localStorage.clear());await page.reload({waitUntil:'networkidle'});
 await page.getByRole('button',{name:'Sign in',exact:true}).last().click();await page.getByLabel('Email',{exact:true}).fill('ui@blackbook.test');await page.getByRole('button',{name:'Email me a sign-in code',exact:true}).click();await page.getByRole('button',{name:'Send code',exact:true}).click();assert.equal(authRequests.at(-1).path,'/auth/v1/otp');assert.equal(authRequests.at(-1).body.create_user,false);
 await page.getByLabel('8-digit code',{exact:true}).fill('12345678');await page.getByRole('button',{name:'Verify code',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});assert.equal(authRequests.findLast(r=>r.path.endsWith('/verify')).body.type,'email');
 await page.evaluate(()=>localStorage.clear());await page.reload({waitUntil:'networkidle'});
 await page.getByRole('button',{name:'Sign in',exact:true}).last().click();
 await page.getByRole('button',{name:'Browse markets first',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});
 await page.getByText('Real Madrid C.F.',{exact:true}).last().waitFor();
 await page.getByRole('button',{name:'Sign in',exact:true}).last().click();await page.getByLabel('Email',{exact:true}).fill('ui@blackbook.test');await page.getByLabel('Password',{exact:true}).fill('wrong-password');rejectLogin=true;
 await page.getByRole('button',{name:'Sign in',exact:true}).last().click();await page.getByText('Invalid login credentials',{exact:true}).waitFor();
 rejectLogin=false;await page.getByLabel('Password',{exact:true}).fill('fixture-password');await page.getByRole('button',{name:'Sign in',exact:true}).last().click();await page.getByLabel('Email',{exact:true}).waitFor({state:'hidden'});
 await page.getByLabel('Open profile',{exact:true}).last().click();await page.getByText('UID 00000000-0000-4000-8000-000000005001',{exact:true}).waitFor();
 await page.reload({waitUntil:'networkidle'});await page.getByText('UID 00000000-0000-4000-8000-000000005001',{exact:true}).waitFor();
 await page.getByText('General',{exact:true}).click();await page.getByText('Log out',{exact:true}).click();
 await page.getByText('Your account',{exact:true}).waitFor();assert.equal(await page.getByText('UID 00000000-0000-4000-8000-000000005001',{exact:true}).count(),0);
 await page.getByRole('button',{name:'Browse markets',exact:true}).click();await page.getByText('Real Madrid C.F.',{exact:true}).last().waitFor();
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(fixture.failures.length,0,fixture.failures.join('\n'));
 console.log(`auth ${width}: guest prices, visible browse, validation, signup, failure feedback, recovery, login and persisted session passed`);
 await context.close();
}
await browser.close();

