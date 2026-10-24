import {createContext,useCallback,useContext,useEffect,useMemo,useRef,useState,type PropsWithChildren} from 'react';
import {Alert,AppState} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ALL_MARKETS} from '@/data/pair-markets';
import type {MarketDefinition} from '@/data/markets';
import {aggregateCandles,type CandlePoint} from '@/lib/market-series';
import {formatCompact,configureDisplay} from '@/lib/format';
import {useTradingNotifications} from '@/hooks/use-trading-notifications';
import {api,publicApi,uuid} from '@/lib/backend';
import {sizeDollarOrder} from '@/lib/dollar-order';
import {estimateLiquidation} from '@/lib/trade-risk';
import {estimateTradingFees,type FeePolicy} from '@/lib/trading-fees';
import {normalizeMarketCatalog,type RemoteMarket} from '@/lib/market-catalog';
import {useAuth} from '@/context/auth-context';
import {useTheme,type ThemeMode} from '@/theme/theme-context';
import type {ChartRange,ExchangeSettings,OpenOrder,OrderType,Position,Side,TradeRecord,UserProfile} from '@/types/exchange';

type Row=Record<string,unknown>;
export type BookSnapshot={marketId:string;status:string;marketVersion:string;marketHash:string;referenceTicks:string;lowerTicks:string;upperTicks:string;lastTradePriceTicks?:string;bids:{priceTicks:string;quantityLots:string}[];asks:{priceTicks:string;quantityLots:string}[]};
type AccountMode='real'|'demo';
interface PlaceOrderInput {symbol:string;side:Side;type:OrderType;amount:number;leverage:number;targetPrice?:number;takeProfit?:number;stopLoss?:number}
interface ExchangeContextValue {
 markets:MarketDefinition[];pairMarkets:MarketDefinition[];activeSymbol:string;setActiveSymbol:(symbol:string)=>void;favorites:Set<string>;toggleFavorite:(symbol:string)=>void;
 historyLoadingFor:(symbol:string)=>boolean;
 priceFor:(symbol:string)=>number;changeFor:(symbol:string)=>number;seriesFor:(symbol:string,range?:ChartRange)=>number[];candlesFor:(symbol:string,range?:ChartRange)=>CandlePoint[];marketFor:(symbol:string)=>MarketDefinition|undefined;
 cashBalance:number;usedMargin:number;totalEquity:number;unrealizedPnl:number;realizedPnl:number;positions:Position[];orders:OpenOrder[];history:TradeRecord[];liquidationEstimate:(input:PlaceOrderInput)=>number;
 orderEstimate:(input:PlaceOrderInput)=>{fee:number;reservedFee:number;exposure:number;requiredBalance:number};
 placeOrder:(input:PlaceOrderInput)=>Promise<{kind:'position'|'order';id:string}>;closePosition:(id:string)=>Promise<void>;cancelOrder:(id:string)=>Promise<void>;positionPnl:(position:Position)=>number;
 profile:UserProfile;updateProfile:(changes:Partial<UserProfile>)=>void;settings:ExchangeSettings;updateSetting:<K extends keyof ExchangeSettings>(key:K,value:ExchangeSettings[K])=>void;
 accountMode:AccountMode;setAccountMode:(mode:AccountMode)=>Promise<void>;loading:boolean;error:string|null;refresh:()=>Promise<void>;bookFor:(symbol:string)=>BookSnapshot|undefined;maxLeverageFor:(symbol:string)=>number;isTradableFor:(symbol:string)=>boolean;busy:boolean;ready:boolean;
}
const defaults:ExchangeSettings={locale:'en-GB',timeZone:'UTC',chartType:'candles',candleInterval:'1h',defaultMargin:1000,defaultTimeInForce:'GTC',oneClickTrading:false,marginWarnings:true,stopLossPercent:0,takeProfitPercent:0,maxPositionUsd:0,dailyLossUsd:0,orderNotifications:true,priceAlerts:true,priceAlertRules:[],interfaceMode:'basic',appearance:'Dark',language:'English',currency:'USD',colorPreference:'Green up / Red down',defaultOrderType:'market',defaultLeverage:5,confirmOrders:true,attachRiskControls:true,refreshRate:'Live'};
const Context=createContext<ExchangeContextValue|null>(null);
const metadata=new Map(ALL_MARKETS.map(m=>[m.symbol,m]));
const message=(e:unknown)=>e instanceof Error?e.message:'BlackBook is unavailable. Please try again.';
const time=(v:unknown)=>typeof v==='string'?Date.parse(v):0;
const money=(v:unknown)=>v===null||v===undefined?NaN:Number(v)/100;
const str=(v:unknown)=>String(v??'');
const rangeMs:Record<ChartRange,number>={'1m':60000,'5m':300000,'15m':900000,'1H':3600000,'4H':14400000,'1D':86400000,'1W':604800000,'1M':2592000000,'6M':15552000000};
async function pages(path:string):Promise<Row[]>{const items:Row[]=[];let cursor:string|null=null;do{const response: {items:Row[];nextCursor:string|null}=await api(path+(cursor?'?cursor='+encodeURIComponent(cursor):''));items.push(...response.items);cursor=response.nextCursor;}while(cursor);return items;}
export function ExchangeProvider({children,selectedSymbol,onSelectSymbol}:PropsWithChildren<{selectedSymbol:string;onSelectSymbol:(symbol:string)=>void}>){
 const {session,requestAuth}=useAuth(),{setMode,mode:deviceAppearance}=useTheme();
 const userId=session?.user.id??'guest',key='blackbook.preferences.'+userId,pendingKey='blackbook.pending-command.'+userId;
 const [accountMode,setModeState]=useState<AccountMode>('real'),[hydrated,setHydrated]=useState(false);
 const [settings,setSettings]=useState(defaults),[profile,setProfile]=useState<UserProfile>({displayName:session?.user.user_metadata?.display_name??session?.user.email?.split('@')[0]??'Trader',uid:userId,email:session?.user.email??'',avatarUri:'void'});
 const [favorites,setFavorites]=useState(new Set<string>());
 const activeSymbol=selectedSymbol,setActiveSymbol=onSelectSymbol;
 const [remote,setRemote]=useState<RemoteMarket[]>([]),[books,setBooks]=useState<Record<string,BookSnapshot>>({}),[marketCandles,setCandles]=useState<Record<string,CandlePoint[]>>({});
 const [historyState,setHistoryState]=useState<Record<string,'loading'|'ready'|'error'>>({});
 const [account,setAccount]=useState<{portfolio:Row;positions:Row[];orders:Row[];fills:Row[]}>({portfolio:{},positions:[],orders:[],fills:[]});
 const [loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null),[busy,setBusy]=useState(false),[ready,setReady]=useState(false);
 const generation=useRef(0),inFlight=useRef(false),commandLock=useRef(false),pending=useRef<{fingerprint:string;path:string;body:Row}|null>(null),persistChain=useRef(Promise.resolve());
 const observedAt=useRef(0),ownerRef=useRef(userId);ownerRef.current=userId;
 const applyPreferences=useCallback((p:Row)=>{
  const next={...defaults,...Object.fromEntries(Object.keys(defaults).filter(k=>k!=='appearance'&&k!=='language'&&k!=='currency'&&p[k]!==undefined).map(k=>[k,p[k]]))} as ExchangeSettings;
  configureDisplay(next.locale,next.timeZone);setSettings(current=>({...next,appearance:current.appearance}));setFavorites(new Set(Array.isArray(p.favorites)?p.favorites.filter((v):v is string=>typeof v==='string'):[]));
  setProfile(current=>({...current,...(typeof p.displayName==='string'?{displayName:p.displayName}:{}),...(typeof p.avatar==='string'?{avatarUri:p.avatar}:{})}));
  setModeState(p.accountMode==='demo'?'demo':'real');
 },[]);
 useEffect(()=>{setSettings(current=>({...current,appearance:deviceAppearance}));},[deviceAppearance]);
 useEffect(()=>{let alive=true;generation.current++;pending.current=null;setHydrated(false);
  if(!session){void AsyncStorage.getItem(key).then(saved=>{if(alive&&saved)applyPreferences(JSON.parse(saved));}).catch(()=>{}).finally(()=>{if(alive)setHydrated(true);});return()=>{alive=false;generation.current++;};}
  void (async()=>{try{const stored=await AsyncStorage.getItem(pendingKey);if(alive&&stored)pending.current=JSON.parse(stored);const saved=await api<{preferences:Row}>('/v1/preferences');if(alive){applyPreferences(saved.preferences);await AsyncStorage.setItem(key,JSON.stringify(saved.preferences));}}catch(e){if(alive){setError(message(e));const local=await AsyncStorage.getItem(key);if(local)try{applyPreferences(JSON.parse(local));}catch{}}}finally{if(alive)setHydrated(true);}})();
  return()=>{alive=false;generation.current++;};
 },[applyPreferences,key,pendingKey,session?.user.id]);
 const persist=useCallback((patch:Row)=>{
  if(!session)return AsyncStorage.getItem(key).then(saved=>AsyncStorage.setItem(key,JSON.stringify({...JSON.parse(saved??'{}'),...patch})));
  const owner=userId;const next=persistChain.current.then(async()=>{if(owner!==ownerRef.current)throw new Error('Account changed.');const saved=await api<{preferences:Row}>('/v1/preferences',patch,'PUT');if(owner===ownerRef.current)await AsyncStorage.setItem(key,JSON.stringify(saved.preferences));});
  persistChain.current=next.catch(e=>{setError(message(e));Alert.alert('Preference not saved',message(e));});return next;
 },[key,userId,session?.user.id]);
 const refresh=useCallback(async()=>{
  if(!hydrated||inFlight.current)return;inFlight.current=true;const version=generation.current;
  try{
   const results=await Promise.allSettled([
    publicApi<{items:Row[]}>('/v1/markets'),
    publicApi<{items:Row[]}>('/v1/indices/catalog?limit=500'),
   ]);
   if(results.every(result=>result.status==='rejected'))throw new Error('Market prices are unavailable. Please retry.');
   const catalog=normalizeMarketCatalog(results[0]?.status==='fulfilled'?results[0].value.items:[],results[1]?.status==='fulfilled'?results[1].value.items:[],ALL_MARKETS);
   if(generation.current!==version)return;
   if(!catalog.length)throw new Error('No indices are available yet. Please retry.');
   setRemote(catalog);setError(null);setLoading(false);
   const snapshots=await Promise.allSettled(catalog.filter(m=>m.marketId&&m.symbol===activeSymbol).map(async m=>[m.marketId,await publicApi<BookSnapshot>('/v1/markets/'+encodeURIComponent(m.marketId)+'/snapshot')] as const));
   if(generation.current!==version)return;
   setRemote(catalog);
   setBooks(current=>({...current,...Object.fromEntries(snapshots.flatMap(result=>result.status==='fulfilled'?[result.value]:[]))}));
   if(catalog.length&&!catalog.some(m=>m.symbol===activeSymbol))setActiveSymbol(catalog[0]!.symbol);
   setError(null);setLoading(false);
   if(!session){setReady(false);return;}
   if(pending.current&&!commandLock.current){
    commandLock.current=true;setBusy(true);
    try{await api(pending.current.path,pending.current.body);await AsyncStorage.removeItem(pendingKey);pending.current=null;}
    catch(e){if(e instanceof Error&&'status'in e&&[400,403,409,422].includes(Number(e.status))){await AsyncStorage.removeItem(pendingKey);pending.current=null;Alert.alert('Saved request rejected',e.message);}else throw e;}
    finally{commandLock.current=false;setBusy(false);}
   }
   const modePrefix=accountMode==='demo'?'/v1/demo/account':'/v1/account';
   const [portfolio,positions,orders,fills,conditional]=await Promise.all([pages(modePrefix+'/portfolio'),pages(modePrefix+'/positions'),pages(modePrefix+'/orders'),pages(modePrefix+'/fills'),accountMode==='real'?api<{items:Row[]}>('/v1/conditional-orders'):Promise.resolve({items:[]})]);
   if(generation.current!==version)return;
   const allOrders=[...new Map([...orders,...conditional.items].map(o=>[o.orderId,o])).values()];
   setAccount({portfolio:portfolio.find(p=>p.assetCode==='USD')??{},positions,orders:allOrders,fills});observedAt.current=Date.now();setReady(true);

  }catch(e){if(generation.current===version){setError(message(e));setReady(false);}}finally{inFlight.current=false;if(generation.current===version)setLoading(false);}
 },[accountMode,activeSymbol,hydrated,pendingKey,settings.candleInterval,session?.user.id,setActiveSymbol]);
 useEffect(()=>{generation.current++;setAccount({portfolio:{},positions:[],orders:[],fills:[]});setReady(false);setLoading(true);},[accountMode]);
 useEffect(()=>{void refresh();const tick=setInterval(()=>{if(AppState.currentState==='active')void refresh();},settings.refreshRate==='Every 15 seconds'?15000:settings.refreshRate==='Every 5 seconds'?5000:2500);const event=AppState.addEventListener('change',s=>{if(s==='active')void refresh();});return()=>{clearInterval(tick);event.remove();};},[refresh,settings.refreshRate]);
 useEffect(()=>{generation.current++;setCandles({});setHistoryState({});},[settings.candleInterval]);
 const historyKey=remote.map(m=>m.symbol+':'+m.marketId).join('|');
 useEffect(()=>{
  let alive=true;
  const queue=[...remote].sort((a,b)=>Number(b.symbol===activeSymbol)-Number(a.symbol===activeSymbol));
  const load=async(m:RemoteMarket)=>{
   setHistoryState(current=>current[m.symbol]==='ready'?current:{...current,[m.symbol]:'loading'});
   try{
    let rows:CandlePoint[]=[];
    if(m.marketId){const result=await publicApi<{candles:CandlePoint[];intervalMs?:number}>('/v1/markets/'+encodeURIComponent(m.marketId)+'/candles?interval='+settings.candleInterval+'&limit='+(m.symbol===activeSymbol?'2000':'168'));rows=result.candles.map(row=>({...row,volume:row.volume??null,intervalMs:result.intervalMs}));}
    if(!rows.length){const result=await publicApi<{points:{asOf:string;referenceMicros:number|string}[]}>('/v1/indices/'+encodeURIComponent(m.entityId)+'/history?limit=1000');rows=result.points.map(point=>{const price=Number(point.referenceMicros)/1e6;return {time:Date.parse(point.asOf),open:price,high:price,low:price,close:price,volume:null};}).filter(point=>Number.isFinite(point.time)&&point.close>0).sort((a,b)=>a.time-b.time);}
    if(alive){setCandles(current=>({...current,[m.symbol]:rows}));setHistoryState(current=>({...current,[m.symbol]:'ready'}));}
   }catch{if(alive)setHistoryState(current=>({...current,[m.symbol]:'error'}));}
  };
  const worker=async()=>{while(alive&&queue.length){const m=queue.shift();if(m)await load(m);}};
  let cycleRunning=true;
  void Promise.all(Array.from({length:4},worker)).finally(()=>{cycleRunning=false;});
  const timer=setInterval(()=>{if(cycleRunning)return;cycleRunning=true;queue.push(...remote);void Promise.all(Array.from({length:4},worker)).finally(()=>{cycleRunning=false;});},60000);
  return()=>{alive=false;clearInterval(timer);};
 },[historyKey,activeSymbol,settings.candleInterval]);
 const historyLoadingFor=useCallback((symbol:string)=>!historyState[symbol]||historyState[symbol]==='loading',[historyState]);
 const lookup=useMemo(()=>new Map(remote.map(r=>[r.symbol,r])),[remote]);
 const markets=useMemo(()=>remote.map((r,index)=>{const old=metadata.get(r.symbol),scale=10**Number(r.terms.priceDecimals),book=books[r.marketId],reference=Number(r.referenceTicks)/scale;return {...old,rank:index+1,symbol:r.symbol,name:r.displayName??old?.name??r.symbol,category:r.kind==='PAIR'?'Pairs':r.kind==='CLUB'?'Clubs':'Athletes',entityId:r.entityId,price:book?.lastTradePriceTicks?Number(book.lastTradePriceTicks)/scale:marketCandles[r.symbol]?.at(-1)?.close??reference,reference,lowerBand:Number(r.lowerTicks)/scale,upperBand:Number(r.upperTicks)/scale,change24h:r.indexChangePct??NaN,volume:r.statistics?.volumeMinor24h==null?'—':formatCompact(Number(r.statistics.volumeMinor24h)/100),volumeUsd24h:r.statistics?.volumeMinor24h==null?NaN:Number(r.statistics.volumeMinor24h)/100,volatility24h:r.statistics?.rangePct24h??NaN,density:0,high24h:r.statistics?.highPriceTicks24h==null?NaN:Number(r.statistics.highPriceTicks24h)/scale,low24h:r.statistics?.lowPriceTicks24h==null?NaN:Number(r.statistics.lowPriceTicks24h)/scale,assetKey:old?.assetKey??'',series:[],history:[],snapshotAsOf:r.asOf??''} as MarketDefinition;}),[books,remote,marketCandles]);
 const marketFor=useCallback((symbol:string)=>markets.find(m=>m.symbol===symbol),[markets]);
 const priceFor=useCallback((symbol:string)=>marketFor(symbol)?.price??NaN,[marketFor]);
 const changeFor=useCallback((symbol:string)=>{const c=marketCandles[symbol]??[],cut=Date.now()-86400000,first=c.find(x=>x.time>=cut);return first&&c[0]!.time<=cut?(priceFor(symbol)/first.open-1)*100:lookup.get(symbol)?.indexChangePct??NaN;},[marketCandles,priceFor,lookup]);
 const candlesFor=useCallback((symbol:string,range:ChartRange='15m')=>aggregateCandles(marketCandles[symbol]??[],rangeMs[range]),[marketCandles]);
 const seriesFor=useCallback((symbol:string,range:ChartRange='1D')=>candlesFor(symbol,range).map(x=>x.close),[candlesFor]);
 const bookFor=useCallback((symbol:string)=>{const m=lookup.get(symbol);return m?books[m.marketId]:undefined;},[books,lookup]);
 const isTradableFor=useCallback((symbol:string)=>Boolean(lookup.get(symbol)?.tradable),[lookup]);
 const maxLeverageFor=useCallback((symbol:string)=>{const m=lookup.get(symbol);return m?Math.min(50,Math.floor(1000000/Number(m.marginPolicy.initialMarginPpm))):1;},[lookup]);
 const positions=useMemo(()=>account.positions.flatMap(p=>{const m=remote.find(m=>m.marketId===p.marketId);if(!m)return [];const lots=Number(p.positionLots),entry=Number(p.entryPriceTicks)/10**Number(m.terms.priceDecimals),size=Math.abs(lots)*entry*Number(m.terms.quoteMinorPerIndexUnitPerLot)/100,margin=p.heldMarginMinor===undefined?size*Number(m.marginPolicy.initialMarginPpm)/1000000:money(p.heldMarginMinor);return [{id:m.marketId,symbol:m.symbol,side:lots>0?'long':'short',size,entryPrice:entry,leverage:Number(p.leverage??size/Math.max(margin,0.01)),margin,openedAt:time(p.openedAt??p.updatedAt)} as Position];}),[account.positions,remote]);
 const orders=useMemo(()=>account.orders.flatMap(o=>{const m=remote.find(m=>m.marketId===o.marketId);if(!m)return [];const target=Number(o.triggerTicks??o.priceTicks??m.referenceTicks)/10**Number(m.terms.priceDecimals);return [{id:str(o.orderId),symbol:m.symbol,side:o.side==='BID'?'long':'short',type:o.type==='STOP'?'stop':'limit',size:Number(o.remainingQuantityLots??o.quantityLots)*target*Number(m.terms.quoteMinorPerIndexUnitPerLot)/100,targetPrice:target,leverage:Number(o.leverage??maxLeverageFor(m.symbol)),createdAt:time(o.createdAt)} as OpenOrder];}),[account.orders,maxLeverageFor,remote]);
 const history=useMemo(()=>account.fills.flatMap(f=>{const m=remote.find(m=>m.marketId===f.marketId);if(!m||!f.priceTicks)return [];const price=Number(f.priceTicks)/10**Number(m.terms.priceDecimals);return [{id:str(f.fillId??f.id??f.tradeId),symbol:m.symbol,side:f.side==='BID'?'long':'short',event:'filled',orderType:'market',size:Number(f.quantityLots)*price*Number(m.terms.quoteMinorPerIndexUnitPerLot)/100,leverage:Number(f.leverage??1),entryPrice:price,fee:money(f.feeMinor??'0'),pnl:money(f.realizedPnlMinor??'0'),openedAt:time(f.createdAt),createdAt:time(f.createdAt)} as TradeRecord];}),[account.fills,remote]);
 const positionPnl=useCallback((p:Position)=>money(account.positions.find(x=>x.marketId===p.id)?.unrealizedPnlMinor),[account.positions]);
 const cashBalance=money(account.portfolio.availableToTradeMinor),totalEquity=money(account.portfolio.equityMinor),unrealizedPnl=money(account.portfolio.unrealizedPnlMinor),realizedPnl=money(account.portfolio.realizedPnlMinor),usedMargin=account.portfolio.usedMarginMinor===undefined?positions.reduce((sum,p)=>sum+p.margin,0)+money(account.portfolio.reservedMarginMinor??'0'):money(account.portfolio.usedMarginMinor)+money(account.portfolio.reservedMarginMinor??'0');
 const submit=useCallback(async(path:string,body:Row,fingerprint:string)=>{
  if(!session){requestAuth();throw new Error('Sign in to continue.');}
  if(commandLock.current)throw new Error('Another account action is being submitted.');if(!ready)throw new Error('Wait for the account and market connection.');
  if(pending.current&&pending.current.fingerprint!==fingerprint)throw new Error('Retry the previous action to resolve its outcome before placing another.');
  commandLock.current=true;setBusy(true);const request=pending.current??{path,body,fingerprint};pending.current=request;
  try{await AsyncStorage.setItem(pendingKey,JSON.stringify(request));const result=await api<Row>(request.path,request.body);await AsyncStorage.removeItem(pendingKey);pending.current=null;await refresh();return (result.order??result) as Row;}
  catch(e){if(e instanceof Error&&'status' in e&&[400,403,409,422].includes(Number(e.status))){await AsyncStorage.removeItem(pendingKey);pending.current=null;}throw e;}finally{commandLock.current=false;setBusy(false);}
 },[ready,refresh,pendingKey,session?.user.id,requestAuth]);
 const orderEstimate=useCallback((input:PlaceOrderInput)=>{
  const m=lookup.get(input.symbol),book=bookFor(input.symbol);
  const unavailable={fee:NaN,reservedFee:NaN,exposure:NaN,requiredBalance:NaN};
  if(!m?.tradable||!book||book.marketVersion!==m.marketVersion||book.marketHash!==m.marketHash||m.feePolicy?.policyVersion!==m.terms.feePolicyVersion)return unavailable;
  const scale=10**Number(m.terms.priceDecimals),price=input.type==='market'?Number((input.side==='long'?book.asks:book.bids)[0]?.priceTicks??book.lastTradePriceTicks??m.referenceTicks)/scale:input.targetPrice??NaN;
  const factor=Number(m.terms.quoteMinorPerIndexUnitPerLot)/100,lots=sizeDollarOrder({amount:input.amount,leverage:input.leverage,priceTicks:String(Math.round(price*scale)),priceDecimals:m.terms.priceDecimals,quoteMinorPerIndexUnitPerLot:m.terms.quoteMinorPerIndexUnitPerLot});
  if(!(price>0)||!Number.isSafeInteger(lots)||lots<Number(m.terms.minimumOrderLots))return unavailable;
  const priceTicks=String(Math.round(price*scale));
  const fees=estimateTradingFees({policy:m.feePolicy,quantityLots:lots,priceTicks,upperTicks:m.upperTicks,quoteMinorPerIndexUnitPerLot:m.terms.quoteMinorPerIndexUnitPerLot,priceDecimals:m.terms.priceDecimals});
  return {...fees,exposure:lots*price*factor,requiredBalance:lots*price*factor/input.leverage+fees.reservedFee};
 },[bookFor,lookup]);
 const placeOrder=useCallback(async(input:PlaceOrderInput)=>{
  const m=lookup.get(input.symbol),book=bookFor(input.symbol);if(!m?.tradable||!book||book.status!=='RUNNING')throw new Error('Market is unavailable.');
  if(!Number.isFinite(input.amount)||input.amount<=0||input.amount>cashBalance||!Number.isInteger(input.leverage)||input.leverage<1||input.leverage>maxLeverageFor(input.symbol))throw new Error('Check your dollar amount and leverage.');
  const scale=10**Number(m.terms.priceDecimals),price=input.type==='market'?Number((input.side==='long'?book.asks:book.bids)[0]?.priceTicks??book.lastTradePriceTicks??m.referenceTicks)/scale:input.targetPrice;
  if(!price||!Number.isFinite(price))throw new Error('Enter a valid price.');
  const lots=sizeDollarOrder({amount:input.amount,leverage:input.leverage,priceTicks:String(Math.round(price*scale)),priceDecimals:m.terms.priceDecimals,quoteMinorPerIndexUnitPerLot:m.terms.quoteMinorPerIndexUnitPerLot});if(!Number.isSafeInteger(lots)||lots<Number(m.terms.minimumOrderLots))throw new Error('Enter an amount of at least $1.');
  const estimate=orderEstimate(input);
  if(!Number.isFinite(estimate.requiredBalance))throw new Error('Wait for the current fee policy and market quote.');
  if(estimate.requiredBalance>cashBalance)throw new Error('Available balance must cover margin and trading fees.');
  const ticks=(v:number)=>{const value=Math.round(v*scale);if(!Number.isSafeInteger(value)||value<=0)throw new Error('Invalid price.');return String(value);};
  for(const [value,profit] of [[input.takeProfit,true],[input.stopLoss,false]] as const){if(value!==undefined&&(!(value>0)||((input.side==='long')===profit?value<=price:value>=price)))throw new Error('Check take-profit and stop-loss prices for the selected side.');}
  const body:Row={commandId:uuid(),orderId:uuid(),marketId:m.marketId,amountMinor:String(Math.round(input.amount*100)),side:input.side==='long'?'BID':'ASK',type:input.type.toUpperCase(),quantityLots:String(lots),leverage:input.leverage,expectedMarketVersion:book.marketVersion,expectedMarketHash:book.marketHash,timeInForce:input.type==='market'?'IOC':input.type==='stop'?'GTC':settings.defaultTimeInForce,...(input.type==='limit'?{priceTicks:ticks(price)}:{}),...(input.type==='stop'?{triggerTicks:ticks(price)}:{}),...(input.takeProfit===undefined?{}:{takeProfitTicks:ticks(input.takeProfit)}),...(input.stopLoss===undefined?{}:{stopLossTicks:ticks(input.stopLoss)})};
  const result=await submit(accountMode==='demo'?'/v1/demo/orders':'/v1/orders',body,accountMode+JSON.stringify(input));
  if(Number(result.filledQuantityLots??0)===0&&['CANCELLED','REJECTED'].includes(String(result.status)))throw new Error('Order cancelled without a fill. Check available liquidity.');
  if(!['FILLED','PARTIALLY_FILLED','RESTING'].includes(String(result.status)))throw new Error('Order submitted. Check Orders for its execution status.');
  return {kind:result.status==='RESTING'?'order':'position',id:str(result.orderId)} as const;
 },[accountMode,bookFor,cashBalance,lookup,maxLeverageFor,orderEstimate,submit,settings.defaultTimeInForce]);
 const closePosition=useCallback(async(id:string)=>{
  const p=account.positions.find(p=>p.marketId===id),m=remote.find(m=>m.marketId===id);if(!p||!m)throw new Error('Position unavailable.');
  const book=await publicApi<BookSnapshot>('/v1/markets/'+encodeURIComponent(id)+'/snapshot',{fresh:true});
  const quantity=BigInt(String(p.positionLots));
  const result=await submit(accountMode==='demo'?'/v1/demo/orders':'/v1/orders',{commandId:uuid(),orderId:uuid(),marketId:id,side:quantity>0n?'ASK':'BID',type:'MARKET',quantityLots:(quantity<0n?-quantity:quantity).toString(),expectedMarketVersion:book.marketVersion,expectedMarketHash:book.marketHash,reduceOnly:true,expectedPositionSequence:str(p.lastTradeSequence)},accountMode+'close'+id);
  if(BigInt(String(result.filledQuantityLots??'0'))===0n)throw new Error('Position remains open. No execution was confirmed; check available liquidity.');
 },[account.positions,accountMode,remote,submit]);

 const cancelOrder=useCallback(async(id:string)=>{await submit(accountMode==='demo'?'/v1/demo/orders/'+id+'/cancel':'/v1/orders/cancel',{commandId:uuid(),orderId:id},accountMode+'cancel'+id);if(settings.orderNotifications)Alert.alert('Cancellation submitted','Refresh Orders to check its status.');},[accountMode,submit,settings.orderNotifications]);
 const setAccountMode=useCallback(async(next:AccountMode)=>{if(commandLock.current||pending.current)throw new Error('Resolve the pending account action before switching modes.');if(next===accountMode)return;for(const kind of ['deposit','withdraw'])if(await AsyncStorage.getItem(`blackbook.funding.${userId}.${kind}`))throw new Error('Resolve the pending funding request before switching modes.');await persist({accountMode:next});generation.current++;setModeState(next);},[accountMode,persist,userId]);
 const toggleFavorite=useCallback((symbol:string)=>{const next=new Set(favorites);if(next.has(symbol))next.delete(symbol);else next.add(symbol);setFavorites(next);void persist({favorites:[...next]}).catch(()=>{});},[favorites,persist]);
 const updateProfile=useCallback((changes:Partial<UserProfile>)=>{setProfile(current=>({...current,...changes}));void persist({...('displayName'in changes?{displayName:changes.displayName}:{}),...('avatarUri'in changes?{avatar:changes.avatarUri}:{})}).catch(()=>{});},[persist]);
 const updateSetting=useCallback(<K extends keyof ExchangeSettings,>(k:K,v:ExchangeSettings[K])=>{if(k==='appearance'){setMode(v as ThemeMode);return;}const patch={ [k]:v,...(k==='oneClickTrading'&&v?{confirmOrders:false}:{}),...(k==='confirmOrders'&&v?{oneClickTrading:false}:{}) };if(k==='appearance')setMode(v as ThemeMode);setSettings(current=>({...current,...patch}));if(k==='locale'||k==='timeZone')configureDisplay(k==='locale'?String(v):settings.locale,k==='timeZone'?String(v):settings.timeZone);void persist(patch).catch(async()=>{try{const saved=await api<{preferences:Row}>('/v1/preferences');applyPreferences(saved.preferences);}catch{}});},[persist,setMode,settings.locale,settings.timeZone,applyPreferences]);
 const liquidationEstimate=useCallback((input:PlaceOrderInput)=>{
  if(!ready||error||Date.now()-observedAt.current>15000)return NaN;
  const m=remote.find(m=>m.symbol===input.symbol),book=bookFor(input.symbol);if(!m||!book)return NaN;
  const scale=10**Number(m.terms.priceDecimals),price=input.type==='market'?Number((input.side==='long'?book.asks[0]:book.bids[0])?.priceTicks)/scale:input.targetPrice??NaN;
  const factor=Number(m.terms.quoteMinorPerIndexUnitPerLot)/100;
  const lots=sizeDollarOrder({amount:input.amount,leverage:input.leverage,priceTicks:String(Math.round(price*scale)),priceDecimals:m.terms.priceDecimals,quoteMinorPerIndexUnitPerLot:m.terms.quoteMinorPerIndexUnitPerLot});if(!(lots>=Number(m.terms.minimumOrderLots)))return NaN;
  const p=account.positions.find(p=>p.marketId===m.marketId);
  return estimateLiquidation({equity:totalEquity-orderEstimate(input).fee,maintenance:money(account.portfolio.maintenanceMarginMinor),existingUnits:p?Number(p.positionLots)*factor:0,existingMark:p?Number(p.markPriceTicks)/scale:0,entry:price,addedUnits:(input.side==='long'?1:-1)*lots*factor,maintenanceRate:Number(m.marginPolicy.maintenanceMarginPpm)/1e6});
 },[account,bookFor,error,orderEstimate,ready,remote,totalEquity]);
 useTradingNotifications({scope:userId+':'+accountMode,settings,history,markets:markets.filter(m=>bookFor(m.symbol)?.lastTradePriceTicks),enabled:ready,updateSetting});
 const value:ExchangeContextValue={historyLoadingFor,markets:markets.filter(m=>m.category!=='Pairs'&&m.symbol!=='OSI'),pairMarkets:markets.filter(m=>m.category==='Pairs'),activeSymbol,setActiveSymbol,favorites,toggleFavorite,priceFor,changeFor,seriesFor,candlesFor,marketFor,cashBalance,totalEquity,unrealizedPnl,realizedPnl,usedMargin,positions,orders,history,placeOrder,closePosition,cancelOrder,positionPnl,liquidationEstimate,orderEstimate,profile,updateProfile,settings,updateSetting,accountMode,setAccountMode,loading,error,refresh,bookFor,maxLeverageFor,isTradableFor,busy,ready};
 return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useExchange(){const value=useContext(Context);if(!value)throw new Error('Exchange provider required');return value;}



