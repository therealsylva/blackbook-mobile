import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
import {installConnectedFixture,signInFixture} from './connected-fixture.mjs';
const browser=await chromium.launch({executablePath:process.env.BROWSER_BIN,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-zygote']});
await mkdir('ui-renders',{recursive:true});
try{
 for(const width of [320,360,390]){
  const context=await browser.newContext({viewport:{width,height:844}});
  await context.route('http://127.0.0.1:4173/**',async route=>{let pathname=new URL(route.request().url()).pathname;if(pathname==='/')pathname='/index.html';else if(!path.extname(pathname))pathname+='.html';try{await route.fulfill({body:await readFile(path.resolve('dist','.'+pathname)),contentType:({'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.ttf':'font/ttf'})[path.extname(pathname)]||'application/octet-stream'});}catch{await route.fulfill({status:404,body:''});}});
  const fixture=await installConnectedFixture(context);
  const page=await context.newPage();page.setDefaultTimeout(20000);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await signInFixture(page);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:`ui-renders/responsive-home-${width}.png`,fullPage:true});
  await page.goto('http://127.0.0.1:4173/trade',{waitUntil:'networkidle'});
  await page.getByLabel('Leverage',{exact:true}).fill('13');await page.getByLabel('Leverage',{exact:true}).blur();
  assert.equal(await page.getByLabel('Leverage',{exact:true}).inputValue(),'13');
  await page.getByRole('button',{name:'Increase leverage',exact:true}).click();
  assert.equal(await page.getByLabel('Leverage',{exact:true}).inputValue(),'14');
  await page.getByLabel('Leverage',{exact:true}).fill('99');await page.getByLabel('Leverage',{exact:true}).blur();
  assert.equal(await page.getByLabel('Leverage',{exact:true}).inputValue(),'30');
  assert.equal(await page.getByText(/This order uses over/).count(),0);
  await page.getByRole('switch',{name:'Advanced trading',exact:true}).click();
  await page.getByText('Limit',{exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.ok(await page.getByLabel('Leverage',{exact:true}).evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;}));
  await page.waitForTimeout(350);
  await page.screenshot({path:`ui-renders/responsive-trade-${width}.png`,fullPage:true});
  await page.goto('http://127.0.0.1:4173/profile',{waitUntil:'networkidle'});
  await page.getByLabel('Edit profile picture',{exact:true}).click();
  await page.getByRole('button',{name:'Choose profile photo from gallery',exact:true}).waitFor();
  await page.waitForTimeout(400);
  await page.screenshot({path:`ui-renders/responsive-profile-${width}.png`,fullPage:true});
  if(width===320){
   const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=','base64');
   let uploads=0;
   await context.route('https://auth.blackbook.test/storage/v1/**',async route=>{
    if(route.request().method()==='POST'){uploads++;assert.ok(route.request().postDataBuffer().length<=5*1024*1024);await route.fulfill({json:{Key:'profile-avatars/fixture'}});}
    else await route.fulfill({body:png,contentType:'image/png'});
   });
   const large=page.waitForEvent('filechooser');await page.getByRole('button',{name:'Choose profile photo from gallery',exact:true}).click();
   await(await large).setFiles({name:'large.png',mimeType:'image/png',buffer:Buffer.concat([png,Buffer.alloc(5*1024*1024)])});
   await page.getByText('Choose a photo no larger than 5 MB.',{exact:true}).waitFor();assert.equal(uploads,0);
   const small=page.waitForEvent('filechooser');await page.getByRole('button',{name:'Choose profile photo from gallery',exact:true}).click();
   await(await small).setFiles({name:'avatar.png',mimeType:'image/png',buffer:png});
   await page.getByText('Choose a photo no larger than 5 MB.',{exact:true}).waitFor({state:'hidden'});
   await page.getByText('Save changes',{exact:true}).click();
   await page.getByText('Profile updated',{exact:true}).waitFor();assert.equal(uploads,1);
   assert.match(fixture.preferences.avatar,/https:\/\/auth\.blackbook\.test\/storage\/v1\/object\/public\/profile-avatars\//);
   await page.reload({waitUntil:'networkidle'});
   await page.getByLabel('Edit profile picture',{exact:true}).waitFor();
   console.log('Gallery: >5 MB rejected before upload; valid PNG uploaded and remote profile preference saved');
   await page.goto('http://127.0.0.1:4173/trade',{waitUntil:'networkidle'});await page.setViewportSize({width:320,height:390});
   await page.getByLabel('Margin',{exact:true}).fill('123');await page.waitForTimeout(350);
   const field=await page.getByLabel('Margin',{exact:true}).boundingBox();assert.ok(field.y>=0&&field.y+field.height<=390,JSON.stringify(field));
   console.log('Order amount remains visible in a reduced keyboard viewport');
  }
  assert.deepEqual(fixture.failures,[]);assert.deepEqual(errors,[]);
  await context.close();console.log(`${width}px: no horizontal overflow, integer leverage input and limits, advanced switch, gallery action passed`);
 }
}finally{await browser.close();}
