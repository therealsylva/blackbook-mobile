import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const publication=JSON.parse(await readFile(new URL('../../src/data/index-snapshot.json',import.meta.url),'utf8'));
const pairSource=await readFile(new URL('../../src/data/pairs.ts',import.meta.url),'utf8');
const pairs=JSON.parse(pairSource.slice(pairSource.indexOf('= [')+2).trim().replace(/;\s*$/,''));
const user={id:'00000000-0000-4000-8000-000000005001',email:'ui@blackbook.test',aud:'authenticated',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{},created_at:'2026-01-01T00:00:00Z'};
const jwt=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
const accessToken=jwt({alg:'HS256',typ:'JWT'})+'.'+jwt({sub:user.id,aud:'authenticated',role:'authenticated',exp:Math.floor(Date.now()/1000)+3600})+'.ui-fixture';
const catalog=publication.indices.map(row=>({marketId:'fixture:'+row.symbol.toLowerCase(),entityId:row.entityId,symbol:row.symbol,displayName:row.name,kind:row.snapshot.kind,referenceTicks:String(row.snapshot.referenceMicros),lowerTicks:String(row.snapshot.lowerMicros),upperTicks:String(row.snapshot.upperMicros)}));
for(const pair of pairs){const x=catalog.find(m=>m.symbol===pair.left),y=catalog.find(m=>m.symbol===pair.right),reference=Math.round(Number(x.referenceTicks)/Number(y.referenceTicks)*1e9);catalog.push({marketId:'fixture:'+pair.id,entityId:pair.id,symbol:pair.title,displayName:pair.title,kind:'PAIR',referenceTicks:String(reference),lowerTicks:String(Math.floor(reference*.94)),upperTicks:String(Math.ceil(reference*1.06)),numeratorEntityId:x.entityId,denominatorEntityId:y.entityId});}
for(const market of catalog)Object.assign(market,{marketVersion:'1',marketHash:'a'.repeat(64),terms:{priceDecimals:'6',quoteMinorPerIndexUnitPerLot:'100',minimumOrderLots:'1'},marginPolicy:{initialMarginPpm:'20000',maintenanceMarginPpm:'10000'}});
export async function installConnectedFixture(context){
 const preferences={accountMode:'real',appearance:'Dark',defaultLeverage:5},accounts={real:[],demo:[]},orders=[],requests=[],failures=[];
 const portfolio=mode=>{const used=accounts[mode].reduce((sum,p)=>sum+Number(p.heldMarginMinor),0);return {assetCode:'USD',minorUnit:2,cashBalanceMinor:'1000000',equityMinor:'1000000',unrealizedPnlMinor:'0',usedMarginMinor:String(used),reservedMarginMinor:'0',maintenanceMarginMinor:'0',availableToTradeMinor:String(1000000-used)};};
 await context.route('https://auth.blackbook.test/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  const json=path.endsWith('/token')?{access_token:accessToken,refresh_token:'ui-refresh',token_type:'bearer',expires_in:3600,user}:path.endsWith('/logout')?{}:user;
  if(path.endsWith('/token'))assert.equal(route.request().postDataJSON().email,user.email);
  await route.fulfill({status:200,contentType:'application/json',json});
 });
 await context.route('https://api.blackbook.test/**',async route=>{
  const request=route.request(),url=new URL(request.url()),path=url.pathname,body=request.postData()?request.postDataJSON():null;
  requests.push({path,body,method:request.method()});
  try{
   assert.equal(request.headers().authorization,'Bearer '+accessToken,'API request must carry the signed-in session');
   let json;
   if(path==='/v1/preferences'){if(body)Object.assign(preferences,body);json={preferences};}
   else if(path==='/v1/markets')json={items:catalog};
   else if(path.endsWith('/snapshot')){const m=catalog.find(m=>path==='/v1/markets/'+encodeURIComponent(m.marketId)+'/snapshot');assert.ok(m);json={...m,status:'RUNNING',cursor:'1',observedAtMs:String(Date.now()),lastTradePriceTicks:m.referenceTicks,bids:[{priceTicks:String(Number(m.referenceTicks)-10000),quantityLots:'1000'}],asks:[{priceTicks:String(Number(m.referenceTicks)+10000),quantityLots:'1000'}]};}
   else if(path.endsWith('/candles')){const m=catalog.find(m=>path==='/v1/markets/'+encodeURIComponent(m.marketId)+'/candles');assert.ok(m);const price=Number(m.referenceTicks)/1e6;json={candles:Array.from({length:1500},(_,i)=>({time:Date.now()-(1500-i)*60000,open:price*(.97+i/50000),high:price*(.975+i/50000),low:price*(.965+i/50000),close:price*(.973+i/50000),volume:10}))};}
   else if(path==='/v1/conditional-orders')json={items:[]};
   else if(/\/account\/(positions|portfolio|orders|fills)$/.test(path)){const mode=path.includes('/demo/')?'demo':'real',section=path.split('/').at(-1);json={section,items:section==='positions'?accounts[mode]:section==='portfolio'?[portfolio(mode)]:[],nextCursor:null};}
   else if(path==='/v1/orders'||path==='/v1/demo/orders'){
    const mode=path.includes('/demo/')?'demo':'real',m=catalog.find(m=>m.marketId===body.marketId);assert.ok(m);
    assert.ok(Number.isInteger(body.leverage)&&body.leverage>=1&&body.leverage<=50,'selected leverage must reach the API');
    const lots=Number(body.quantityLots),price=Number(m.referenceTicks)+(body.side==='BID'?10000:-10000),notional=lots*price/10000;
    accounts[mode].push({marketId:m.marketId,positionLots:String(body.side==='BID'?lots:-lots),entryPriceTicks:String(price),markPriceTicks:String(price),lastTradeSequence:'1',leverage:body.leverage,heldMarginMinor:String(Math.ceil(notional/body.leverage)),unrealizedPnlMinor:'0',openedAt:new Date().toISOString()});
    orders.push({mode,body});json={order:{orderId:body.orderId,commandId:body.commandId,status:'FILLED',filledQuantityLots:body.quantityLots}};
   }else throw Error('Unimplemented fixture endpoint: '+path);
   await route.fulfill({status:200,contentType:'application/json',json});
  }catch(e){failures.push(e.message);await route.fulfill({status:500,contentType:'application/json',json:{error:'fixture_failed'}});}
 });
 return {orders,requests,failures,preferences,accounts};
}
export async function signInFixture(page){
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
 await page.getByLabel('Email',{exact:true}).fill(user.email);
 await page.getByLabel('Password',{exact:true}).fill('fixture-password');
 await page.getByText('Sign in',{exact:true}).click();
 await page.getByLabel('Open profile',{exact:true}).waitFor();
}
