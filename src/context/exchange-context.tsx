import {groupOrderFills} from '@/lib/group-order-fills';
import {unavailablePositions as findUnavailablePositions} from '@/lib/unavailable-positions';
import {orderExecutionPlan,marketExecutionOptions,type MarketExecution} from '@/lib/market-execution';
import {executionNotice} from '@/lib/execution-notice';
import {useNotification} from '@/context/notification-context';
import {resolveTradingCommand,closePositionCommand,isDefinitiveCommandError,type PendingCommand} from '@/lib/trading-command';
import {createContext,useCallback,useContext,useEffect,useMemo,useRef,useState,type PropsWithChildren} from 'react';
import {AppState} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ALL_MARKETS} from '@/data/pair-markets';
import type {MarketDefinition} from '@/data/markets';
import {selectCandles,selectMobileCandles,isMobileChartRange,MOBILE_HISTORY_INTERVAL,MOBILE_HISTORY_LIMIT,type CandlePoint} from '@/lib/market-series';
import {formatCompact,configureDisplay} from '@/lib/format';
import {useTradingNotifications} from '@/hooks/use-trading-notifications';
import {api,publicApi,uuid} from '@/lib/backend';
import {sizeDollarOrder} from '@/lib/dollar-order';
import {estimateLiquidation,orderEntryPrice} from '@/lib/trade-risk';
import {estimateTradingFees,type FeePolicy} from '@/lib/trading-fees';
import {normalizeMarketCatalog,selectedMarketChange,type RemoteMarket} from '@/lib/market-catalog';
import {useAuth} from '@/context/auth-context';
import {useTheme,type ThemeMode} from '@/theme/theme-context';
import type {ChartRange,ExchangeSettings,OpenOrder,OrderType,Position,Side,TradeRecord,UserProfile} from '@/types/exchange';

type Row=Record<string,unknown>;
export type BookSnapshot={marketId:string;status:string;marketVersion:string;marketHash:string;referenceTicks:string;lowerTicks:string;upperTicks:string;lastTradePriceTicks?:string;bids:{priceTicks:string;quantityLots:string}[];asks:{priceTicks:string;quantityLots:string}[]};
type AccountMode='real'|'demo';
interface PlaceOrderInput {symbol:string;side:Side;type:OrderType;amount:number;leverage:number;targetPrice?:number;takeProfit?:number;stopLoss?:number;marketExecution?:MarketExecution}
interface ExchangeContextValue {
 markets:MarketDefinition[];pairMarkets:MarketDefinition[];activeSymbol:string;setActiveSymbol:(symbol:string)=>void;favorites:Set<string>;toggleFavorite:(symbol:string)=>void;
 historyLoadingFor:(symbol:string)=>boolean;
 priceFor:(symbol:string)=>number;changeFor:(symbol:string)=>number;seriesFor:(symbol:string,range?:ChartRange)=>number[];candlesFor:(symbol:string,range?:ChartRange)=>CandlePoint[];marketFor:(symbol:string)=>MarketDefinition|undefined;
 cashBalance:number;usedMargin:number;totalEquity:number;unrealizedPnl:number;realizedPnl:number;positions:Position[];unavailablePositions:{positionId:string;marketId:string;positionLots:string}[];orders:OpenOrder[];history:TradeRecord[];liquidationEstimate:(input:PlaceOrderInput)=>number;
 orderEstimate:(input:PlaceOrderInput)=>{fee:number;reservedFee:number;exposure:number;requiredBalance:number};
 placeOrder:(input:PlaceOrderInput)=>Promise<{kind:'position'|'order'|'pending';id:string}>;closePosition:(id:string)=>Promise<void>;cancelOrder:(id:string)=>Promise<void>;positionPnl:(position:Position)=>number;
 profile:UserProfile;updateProfile:(changes:Partial<UserProfile>)=>Promise<void>;settings:ExchangeSettings;updateSetting:<K extends keyof ExchangeSettings>(key:K,value:ExchangeSettings[K])=>void;
 accountMode:AccountMode;setAccountMode:(mode:AccountMode)=>Promise<void>;loading:boolean;error:string|null;refresh:()=>Promise<void>;bookFor:(symbol:string)=>BookSnapshot|undefined;maxLeverageFor:(symbol:string)=>number;isTradableFor:(symbol:string)=>boolean;busy:boolean;ready:boolean;
}
const defaults:ExchangeSettings={changeDisplay:'Index update',bandDisplay:'Index',locale:'en-GB',timeZone:'UTC',chartType:'candles',candleInterval:'1h',defaultMargin:1000,defaultTimeInForce:'GTC',defaultMarketExecution:'IOC',oneClickTrading:false,marginWarnings:false,balanceWarningPercent:80,stopLossPercent:0,takeProfitPercent:0,maxPositionUsd:0,dailyLossUsd:0,orderNotifications:true,priceAlerts:true,priceAlertRules:[],interfaceMode:'basic',appearance:'Dark',language:'English',currency:'USD',colorPreference:'Green up / Red down',defaultOrderType:'market',defaultLeverage:5,confirmOrders:true,attachRiskControls:true,refreshRate:'Live'};
const Context=createContext<ExchangeContextValue|null>(null);
const metadata=new Map(ALL_MARKETS.map(m=>[m.symbol,m]));
const message=(e:unknown)=>e instanceof Error?e.message:'BlackBook is unavailable. Please try again.';
const time=(v:unknown)=>typeof v==='string'?Date.parse(v):0;
const money=(v:unknown)=>v===null||v===undefined?NaN:Number(v)/100;
const str=(v:unknown)=>String(v??'');
const rangeMs:Record<ChartRange,number>={'1m':60000,'5m':300000,'15m':900000,'1H':3600000,'4H':14400000,'1D':86400000,'7D':604800000,'1W':604800000,'1M':2592000000,'6M':15552000000};
async function pages(path:string):Promise<Row[]>{const items:Row[]=[];let cursor:string|null=null;do{const response: {items:Row[];nextCursor:string|null}=await api(path+(cursor?'?cursor='+encodeURIComponent(cursor):''));items.push(...response.items);cursor=response.nextCursor;}while(cursor);return items;}
export function ExchangeProvider({children,selectedSymbol,onSelectSymbol}:PropsWithChildren<{selectedSymbol:string;onSelectSymbol:(symbol:string)=>void}>){
 const notify=useNotification();
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
 const generation=useRef(0),inFlight=useRef(false),commandLock=useRef(false),pending=useRef<PendingCommand|null>(null),persistChain=useRef(Promise.resolve());
 const refreshRef=useRef<()=>Promise<void>>(async()=>{});
 const observedAt=useRef(0),ownerRef=useRef(userId),bandRevision=useRef(0),changeRevision=useRef(0);ownerRef.current=userId;
 const applyPreferences=useCallback((p:Row)=>{
  const next={...defaults,...Object.fromEntries(Object.keys(defaults).filter(k=>k!=='appearance'&&k!=='language'&&k!=='currency'&&p[k]!==undefined).map(k=>[k,p[k]]))} as ExchangeSettings;
  if(!marketExecutionOptions.includes(next.defaultMarketExecution))next.defaultMarketExecution='IOC';
  next.candleInterval=MOBILE_HISTORY_INTERVAL;
  next.marginWarnings=typeof p.balanceWarningPercent==='number'&&p.marginWarnings===true;
  configureDisplay(next.locale,next.timeZone);setSettings(current=>({...next,appearance:current.appearance,bandDisplay:current.bandDisplay,changeDisplay:current.changeDisplay}));setFavorites(new Set(Array.isArray(p.favorites)?p.favorites.filter((v):v is string=>typeof v==='string'):[]));
  setProfile(current=>({...current,...(typeof p.displayName==='string'?{displayName:p.displayName}:{}),...(typeof p.avatar==='string'?{avatarUri:p.avatar}:{})}));
  setModeState(p.accountMode==='demo'?'demo':'real');
 },[]);
 useEffect(()=>{let alive=true;const revision=++bandRevision.current;setSettings(current=>({...current,bandDisplay:'Index'}));void AsyncStorage.getItem('blackbook.band-display.'+userId).then(value=>{if(alive&&revision===bandRevision.current)setSettings(current=>({...current,bandDisplay:value==='Percentage'?'Percentage':'Index'}));}).catch(()=>{});return()=>{alive=false;};},[userId]);
 useEffect(()=>{let alive=true;const revision=++changeRevision.current;setSettings(current=>({...current,changeDisplay:'Index update'}));void AsyncStorage.getItem('blackbook.change-display.'+userId).then(value=>{if(alive&&revision===changeRevision.current)setSettings(current=>({...current,changeDisplay:value==='24h market'?'24h market':'Index update'}));}).catch(()=>{});return()=>{alive=false;};},[userId]);
 useEffect(()=>{setSettings(current=>({...current,appearance:deviceAppearance}));},[deviceAppearance]);
 useEffect(()=>{let alive=true;generation.current++;pending.current=null;setHydrated(false);
  if(!session){void AsyncStorage.getItem(key).then(saved=>{if(alive&&saved)applyPreferences(JSON.parse(saved));}).catch(()=>{}).finally(()=>{if(alive)setHydrated(true);});return()=>{alive=false;generation.current++;};}
  void (async()=>{try{const stored=await AsyncStorage.getItem(pendingKey);if(alive&&stored)pending.current=JSON.parse(stored);const saved=await api<{preferences:Row}>('/v1/preferences');if(alive){applyPreferences(saved.preferences);await AsyncStorage.setItem(key,JSON.stringify(saved.preferences));}}catch(e){if(alive){setError(message(e));const local=await AsyncStorage.getItem(key);if(local)try{applyPreferences(JSON.parse(local));}catch{}}}finally{if(alive)setHydrated(true);}})();
  return()=>{alive=false;generation.current++;};
 },[applyPreferences,key,pendingKey,session?.user.id]);
 const persist=useCallback((patch:Row)=>{
  if(!session)return AsyncStorage.getItem(key).then(saved=>AsyncStorage.setItem(key,JSON.stringify({...JSON.parse(saved??'{}'),...patch})));
  const owner=userId;const next=persistChain.current.then(async()=>{if(owner!==ownerRef.current)throw new Error('Account changed.');const saved=await api<{preferences:Row}>('/v1/preferences',patch,'PUT');if(owner===ownerRef.current)await AsyncStorage.setItem(key,JSON.stringify(saved.preferences));});
  persistChain.current=next.catch(e=>{setError(message(e));notify({title:'Preference not saved',message:message(e),tone:'error'});});return next;
 },[key,userId,session?.user.id,notify]);
 const recoverPending=useCallback(async()=>{
  if(!hydrated||!session||!pending.current||commandLock.current)return;
  commandLock.current=true;setBusy(true);const request=pending.current;
  try{
   const outcome=await resolveTradingCommand(request,(path,body)=>api<Row>(path,body));
   if(outcome.state==='complete'){
    await AsyncStorage.removeItem(pendingKey);pending.current=null;
    notify(executionNotice(request.body,outcome.receipt,remote.find(m=>m.marketId===request.body.marketId)?.terms));
    await refreshRef.current();
   }
  }catch(e){if(isDefinitiveCommandError(e)){await AsyncStorage.removeItem(pendingKey);pending.current=null;notify({title:'Request rejected',message:message(e),tone:'error'});}}
  finally{commandLock.current=false;setBusy(Boolean(pending.current));}
 },[hydrated,session?.user.id,pendingKey,notify,remote]);
 useEffect(()=>{void recoverPending();const timer=setInterval(()=>{if(AppState.currentState==='active')void recoverPending();},3000);const event=AppState.addEventListener('change',state=>{if(state==='active')void recoverPending();});return()=>{clearInterval(timer);event.remove();};},[recoverPending]);
 const refresh=useCallback(async()=>{
  if(!hydrated||inFlight.current)return;inFlight.current=true;const version=generation.current;
  const refreshMarkets=async()=>{
   const results=await Promise.allSettled([publicApi<{items:Row[]}>('/v1/markets'),publicApi<{items:Row[]}>('/v1/indices/catalog?limit=500')]);
   if(results.every(result=>result.status==='rejected'))throw new Error('Market prices are unavailable. Please retry.');
   const catalog=normalizeMarketCatalog(results[0]?.status==='fulfilled'?results[0].value.items:[],results[1]?.status==='fulfilled'?results[1].value.items:[],ALL_MARKETS);
   if(generation.current!==version)return;
   if(!catalog.length)throw new Error('No indices are available yet. Please retry.');
   setRemote(catalog);setLoading(false);
   const snapshots=await Promise.allSettled(catalog.filter(m=>m.marketId&&m.symbol===activeSymbol).map(async m=>[m.marketId,await publicApi<BookSnapshot>('/v1/markets/'+encodeURIComponent(m.marketId)+'/snapshot')] as const));
   if(generation.current!==version)return;
   setBooks(current=>({...current,...Object.fromEntries(snapshots.flatMap(result=>result.status==='fulfilled'?[result.value]:[]))}));
   if(!catalog.some(m=>m.symbol===activeSymbol))setActiveSymbol(catalog[0]!.symbol);
  };
  const refreshAccount=async()=>{
   if(!session)return;
   const modePrefix=accountMode==='demo'?'/v1/demo/account':'/v1/account';
   const [portfolio,positions,orders,fills,conditional]=await Promise.all([pages(modePrefix+'/portfolio'),pages(modePrefix+'/positions'),pages(modePrefix+'/orders'),pages(modePrefix+'/fills'),accountMode==='real'?api<{items:Row[]}>('/v1/conditional-orders'):Promise.resolve({items:[]})]);
   if(generation.current!==version)return;
   const allOrders=[...new Map([...orders,...conditional.items].map(o=>[o.orderId,o])).values()];
   setAccount({portfolio:portfolio.find(p=>p.assetCode==='USD')??{},positions,orders:allOrders,fills});observedAt.current=Date.now();setReady(true);
  };
  try{
   const results=await Promise.allSettled([refreshMarkets(),refreshAccount()]);
   if(generation.current!==version)return;
   const failure=results.find(result=>result.status==='rejected');
   setError(failure?.status==='rejected'?message(failure.reason):null);
   if(results[1]?.status==='rejected')setReady(false);
  }finally{inFlight.current=false;if(generation.current===version)setLoading(false);}
 },[accountMode,activeSymbol,hydrated,session?.user.id,setActiveSymbol]);

 useEffect(()=>{generation.current++;setAccount({portfolio:{},positions:[],orders:[],fills:[]});setReady(false);setLoading(true);},[accountMode]);
 useEffect(()=>{void refresh();const tick=setInterval(()=>{if(AppState.currentState==='active')void refresh();},settings.refreshRate==='Every 15 seconds'?15000:settings.refreshRate==='Every 5 seconds'?5000:2500);const event=AppState.addEventListener('change',s=>{if(s==='active')void refresh();});return()=>{clearInterval(tick);event.remove();};},[refresh,settings.refreshRate]);
 refreshRef.current=refresh;
 const historyKey=remote.map(m=>m.symbol+':'+m.marketId).join('|');
 useEffect(()=>{
  let alive=true;
  const queue=[...remote].sort((a,b)=>Number(b.symbol===activeSymbol)-Number(a.symbol===activeSymbol));
  const load=async(m:RemoteMarket)=>{
   setHistoryState(current=>current[m.symbol]==='ready'?current:{...current,[m.symbol]:'loading'});
   try{
    let rows:CandlePoint[]=[];
    if(m.marketId){const result=await publicApi<{candles:CandlePoint[];intervalMs?:number}>('/v1/markets/'+encodeURIComponent(m.marketId)+'/candles?interval='+MOBILE_HISTORY_INTERVAL+'&limit='+MOBILE_HISTORY_LIMIT);rows=result.candles.map(row=>({...row,volume:row.volume??null,intervalMs:result.intervalMs}));}
    if(!rows.length){const result=await publicApi<{points:{asOf:string;referenceMicros:number|string}[]}>('/v1/indices/'+encodeURIComponent(m.entityId)+'/history?limit=1000');rows=result.points.map(point=>{const price=Number(point.referenceMicros)/1e6;return {time:Date.parse(point.asOf),open:price,high:price,low:price,close:price,volume:null};}).filter(point=>Number.isFinite(point.time)&&point.close>0).sort((a,b)=>a.time-b.time);}
    if(alive){setCandles(current=>({...current,[m.symbol]:rows}));setHistoryState(current=>({...current,[m.symbol]:'ready'}));}
   }catch{if(alive)setHistoryState(current=>({...current,[m.symbol]:'error'}));}
  };
  const worker=async()=>{while(alive&&queue.length){const m=queue.shift();if(m)await load(m);}};
  let cycleRunning=true;
  void Promise.all(Array.from({length:4},worker)).finally(()=>{cycleRunning=false;});
  const timer=setInterval(()=>{if(cycleRunning)return;cycleRunning=true;queue.push(...remote);void Promise.all(Array.from({length:4},worker)).finally(()=>{cycleRunning=false;});},60000);
  return()=>{alive=false;clearInterval(timer);};
 },[historyKey,activeSymbol]);
 const historyLoadingFor=useCallback((symbol:string)=>!historyState[symbol]||historyState[symbol]==='loading',[historyState]);
 const lookup=useMemo(()=>new Map(remote.map(r=>[r.symbol,r])),[remote]);
 const markets=useMemo(()=>remote.map((r,index)=>{const old=metadata.get(r.symbol),scale=10**Number(r.terms.priceDecimals),book=books[r.marketId],reference=Number(r.referenceTicks)/scale;return {...old,rank:index+1,symbol:r.symbol,name:r.displayName??old?.name??r.symbol,category:r.kind==='PAIR'?'Pairs':r.kind==='CLUB'?'Clubs':'Athletes',entityId:r.entityId,price:book?.lastTradePriceTicks?Number(book.lastTradePriceTicks)/scale:marketCandles[r.symbol]?.at(-1)?.close??reference,reference,lowerBand:Number(r.lowerTicks)/scale,upperBand:Number(r.upperTicks)/scale,change24h:r.indexChangePct??NaN,volume:r.statistics?.volumeMinor24h==null?'—':formatCompact(Number(r.statistics.volumeMinor24h)/100),volumeUsd24h:r.statistics?.volumeMinor24h==null?NaN:Number(r.statistics.volumeMinor24h)/100,volatility24h:r.statistics?.rangePct24h??NaN,density:0,high24h:r.statistics?.highPriceTicks24h==null?NaN:Number(r.statistics.highPriceTicks24h)/scale,low24h:r.statistics?.lowPriceTicks24h==null?NaN:Number(r.statistics.lowPriceTicks24h)/scale,assetKey:old?.assetKey??'',series:[],history:[],snapshotAsOf:r.asOf??''} as MarketDefinition;}),[books,remote,marketCandles]);
 const marketFor=useCallback((symbol:string)=>markets.find(m=>m.symbol===symbol),[markets]);
 const priceFor=useCallback((symbol:string)=>marketFor(symbol)?.price??NaN,[marketFor]);
 const changeFor=useCallback((symbol:string)=>selectedMarketChange(lookup.get(symbol),settings.changeDisplay),[lookup,settings.changeDisplay]);
 const candlesFor=useCallback((symbol:string,range:ChartRange='7D')=>isMobileChartRange(range)?selectMobileCandles(marketCandles[symbol]??[],range):selectCandles(marketCandles[symbol]??[],rangeMs[range],3600000),[marketCandles]);
 const seriesFor=useCallback((symbol:string,range:ChartRange='7D')=>candlesFor(symbol,range).map(x=>x.close),[candlesFor]);
 const bookFor=useCallback((symbol:string)=>{const m=lookup.get(symbol);return m?books[m.marketId]:undefined;},[books,lookup]);
 const isTradableFor=useCallback((symbol:string)=>Boolean(lookup.get(symbol)?.tradable),[lookup]);
 const maxLeverageFor=useCallback((symbol:string)=>{const m=lookup.get(symbol);return m?Math.min(30,Math.floor(1000000/Number(m.marginPolicy.initialMarginPpm))):1;},[lookup]);
 const positions=useMemo(()=>account.positions.flatMap(p=>{const m=remote.find(m=>m.marketId===p.marketId);if(!m)return [];const lots=Number(p.positionLots),entry=Number(p.entryPriceTicks)/10**Number(m.terms.priceDecimals),size=Math.abs(lots)*entry*Number(m.terms.quoteMinorPerIndexUnitPerLot)/100,margin=p.heldMarginMinor===undefined?size*Number(m.marginPolicy.initialMarginPpm)/1000000:money(p.heldMarginMinor);return [{id:str(p.positionId),symbol:m.symbol,side:lots>0?'long':'short',size,entryPrice:entry,leverage:Number(p.leverage??size/Math.max(margin,0.01)),margin,openedAt:time(p.openedAt??p.updatedAt)} as Position];}),[account.positions,remote]);
 const unavailablePositions=useMemo(()=>findUnavailablePositions(account.positions,remote),[account.positions,remote]);
 const orders=useMemo(()=>account.orders.flatMap(o=>{const m=remote.find(m=>m.marketId===o.marketId);if(!m)return [];const target=Number(o.triggerTicks??o.priceTicks??m.referenceTicks)/10**Number(m.terms.priceDecimals);return [{id:str(o.orderId),symbol:m.symbol,side:o.side==='BID'?'long':'short',type:o.type==='STOP'?'stop':o.type==='MARKET'?'market':'limit',size:Number(o.remainingQuantityLots??o.quantityLots)*target*Number(m.terms.quoteMinorPerIndexUnitPerLot)/100,targetPrice:target,leverage:Number(o.leverage??maxLeverageFor(m.symbol)),createdAt:time(o.createdAt)} as OpenOrder];}),[account.orders,maxLeverageFor,remote]);
 const history=useMemo(()=>groupOrderFills(account.fills).flatMap(f=>{const m=remote.find(m=>m.marketId===f.marketId);if(!m||!f.priceTicks)return [];const price=Number(f.priceTicks)/10**Number(m.terms.priceDecimals);return [{id:str(f.orderId??f.fillId??f.id??f.tradeId),symbol:m.symbol,side:f.side==='BID'?'long':'short',event:'filled',orderType:'market',size:Number(f.quantityLots)*price*Number(m.terms.quoteMinorPerIndexUnitPerLot)/100,leverage:Number(f.leverage??1),entryPrice:price,fee:money(f.feeMinor??'0'),pnl:money(f.realizedPnlMinor??'0'),openedAt:time(f.createdAt),createdAt:time(f.createdAt)} as TradeRecord];}),[account.fills,remote]);
 const positionPnl=useCallback((p:Position)=>money(account.positions.find(x=>x.positionId===p.id)?.unrealizedPnlMinor),[account.positions]);
 const cashBalance=money(account.portfolio.availableToTradeMinor),totalEquity=money(account.portfolio.equityMinor),unrealizedPnl=money(account.portfolio.unrealizedPnlMinor),realizedPnl=money(account.portfolio.realizedPnlMinor),usedMargin=account.portfolio.usedMarginMinor===undefined?positions.reduce((sum,p)=>sum+p.margin,0)+money(account.portfolio.reservedMarginMinor??'0'):money(account.portfolio.usedMarginMinor)+money(account.portfolio.reservedMarginMinor??'0');
 const submit=useCallback(async(path:string,body:Row,fingerprint:string)=>{
  if(!session){requestAuth();throw new Error('Sign in to continue.');}
  if(commandLock.current)throw new Error('Another account action is being submitted.');if(!ready)throw new Error('Wait for the account and market connection.');
  if(pending.current&&pending.current.fingerprint!==fingerprint)throw new Error('Your previous action is processing. BlackBook is checking it automatically.');
  commandLock.current=true;setBusy(true);const request=pending.current??{path,body,fingerprint};pending.current=request;
  try{
   await AsyncStorage.setItem(pendingKey,JSON.stringify(request));
   const outcome=await resolveTradingCommand(request,(path,body)=>api<Row>(path,body));
   if(outcome.state==='pending'){
    notify({title:request.body.reduceOnly?'Closing position':'Order processing',message:'Waiting for execution confirmation. Trading actions are paused while BlackBook checks this request automatically.'});
    return {status:'PENDING',orderId:request.body.orderId} as Row;
   }
   await AsyncStorage.removeItem(pendingKey);pending.current=null;
   await refresh();return outcome.receipt;
  }catch(e){if(isDefinitiveCommandError(e)){await AsyncStorage.removeItem(pendingKey);pending.current=null;}throw e;}
  finally{commandLock.current=false;setBusy(Boolean(pending.current));}

 },[ready,refresh,pendingKey,session?.user.id,requestAuth,notify]);
 const orderEstimate=useCallback((input:PlaceOrderInput)=>{
  const m=lookup.get(input.symbol),book=bookFor(input.symbol);
  const unavailable={fee:NaN,reservedFee:NaN,exposure:NaN,requiredBalance:NaN};
  if(!m?.tradable||!book||book.marketVersion!==m.marketVersion||book.marketHash!==m.marketHash||m.feePolicy?.policyVersion!==m.terms.feePolicyVersion)return unavailable;
  let plan:ReturnType<typeof orderExecutionPlan>;try{plan=orderExecutionPlan(input.type,input.marketExecution??settings.defaultMarketExecution,input.targetPrice,settings.defaultTimeInForce);}catch{return unavailable;}
  const scale=10**Number(m.terms.priceDecimals),price=orderEntryPrice({...input,type:plan.type,targetPrice:plan.targetPrice,priceDecimals:m.terms.priceDecimals,referenceTicks:m.referenceTicks,book});
  const factor=Number(m.terms.quoteMinorPerIndexUnitPerLot)/100,lots=sizeDollarOrder({amount:input.amount,leverage:input.leverage,priceTicks:String(Math.round(price*scale)),priceDecimals:m.terms.priceDecimals,quoteMinorPerIndexUnitPerLot:m.terms.quoteMinorPerIndexUnitPerLot});
  if(!(price>0)||!Number.isSafeInteger(lots)||lots<Number(m.terms.minimumOrderLots))return unavailable;
  const priceTicks=String(Math.round(price*scale));
  const fees=estimateTradingFees({policy:m.feePolicy,quantityLots:lots,priceTicks,upperTicks:m.upperTicks,quoteMinorPerIndexUnitPerLot:m.terms.quoteMinorPerIndexUnitPerLot,priceDecimals:m.terms.priceDecimals});
  return {...fees,exposure:lots*price*factor,requiredBalance:lots*price*factor/input.leverage+fees.reservedFee};
 },[bookFor,lookup,settings.defaultMarketExecution,settings.defaultTimeInForce]);
 const placeOrder=useCallback(async(input:PlaceOrderInput)=>{
  const m=lookup.get(input.symbol),book=bookFor(input.symbol);if(!m?.tradable||!book||book.status!=='RUNNING')throw new Error('Market is unavailable.');
  if(!Number.isFinite(input.amount)||input.amount<=0||input.amount>cashBalance||!Number.isInteger(input.leverage)||input.leverage<1||input.leverage>maxLeverageFor(input.symbol))throw new Error('Check your dollar amount and leverage.');
  const plan=orderExecutionPlan(input.type,input.marketExecution??settings.defaultMarketExecution,input.targetPrice,settings.defaultTimeInForce);
  const scale=10**Number(m.terms.priceDecimals),price=orderEntryPrice({...input,type:plan.type,targetPrice:plan.targetPrice,priceDecimals:m.terms.priceDecimals,referenceTicks:m.referenceTicks,book});
  if(!price||!Number.isFinite(price))throw new Error('Enter a valid price.');
  const lots=sizeDollarOrder({amount:input.amount,leverage:input.leverage,priceTicks:String(Math.round(price*scale)),priceDecimals:m.terms.priceDecimals,quoteMinorPerIndexUnitPerLot:m.terms.quoteMinorPerIndexUnitPerLot});if(!Number.isSafeInteger(lots)||lots<Number(m.terms.minimumOrderLots))throw new Error('Enter an amount of at least $1.');
  const estimate=orderEstimate(input);
  if(!Number.isFinite(estimate.requiredBalance))throw new Error('Wait for the current fee policy and market quote.');
  if(estimate.requiredBalance>cashBalance)throw new Error('Available balance must cover margin and trading fees.');
  const ticks=(v:number)=>{const value=Math.round(v*scale);if(!Number.isSafeInteger(value)||value<=0)throw new Error('Invalid price.');return String(value);};
  for(const [value,profit] of [[input.takeProfit,true],[input.stopLoss,false]] as const){if(value!==undefined&&(!(value>0)||((input.side==='long')===profit?value<=price:value>=price)))throw new Error('Check take-profit and stop-loss prices for the selected side.');}
  const body:Row={commandId:uuid(),orderId:uuid(),marketId:m.marketId,amountMinor:String(Math.round(input.amount*100)),side:input.side==='long'?'BID':'ASK',type:plan.type.toUpperCase(),quantityLots:String(lots),leverage:input.leverage,expectedMarketVersion:book.marketVersion,expectedMarketHash:book.marketHash,timeInForce:plan.timeInForce,...(plan.type==='limit'?{priceTicks:ticks(price)}:{}),...(input.type==='stop'?{triggerTicks:ticks(price)}:{}),...(input.takeProfit===undefined?{}:{takeProfitTicks:ticks(input.takeProfit)}),...(input.stopLoss===undefined?{}:{stopLossTicks:ticks(input.stopLoss)})};
  const result=await submit(accountMode==='demo'?'/v1/demo/orders':'/v1/orders',body,accountMode+JSON.stringify(input));
  if(result.status==='PENDING')return {kind:'pending',id:str(result.orderId)} as const;
  if(Number(result.filledQuantityLots??0)===0&&['CANCELLED','REJECTED'].includes(String(result.status)))throw new Error('Order cancelled without a fill. Check available liquidity.');
  if(Number(result.filledQuantityLots??0)>0){if(settings.orderNotifications)notify(executionNotice(body,result,m.terms));return {kind:'position',id:str(result.orderId)} as const;}
  if(!['FILLED','PARTIALLY_FILLED','RESTING'].includes(String(result.status)))throw new Error('Order submitted. Check Orders for its execution status.');
  return {kind:result.status==='RESTING'?'order':'position',id:str(result.orderId)} as const;
 },[accountMode,bookFor,cashBalance,lookup,maxLeverageFor,orderEstimate,submit,settings.defaultTimeInForce,settings.defaultMarketExecution,settings.orderNotifications,notify]);
 const closePosition=useCallback(async(id:string)=>{
  if(commandLock.current||pending.current)throw new Error('An account action is processing. BlackBook will confirm it automatically.');
  const prefix=accountMode==='demo'?'/v1/demo/account':'/v1/account';
  const latest=await pages(prefix+'/positions');
  const position=latest.find(p=>p.positionId===id&&BigInt(String(p.positionLots))!==0n);
  if(!position){await refresh();notify({title:'Position already closed',message:'Your portfolio has been refreshed.'});return;}
  const book=await publicApi<BookSnapshot>('/v1/markets/'+encodeURIComponent(String(position.marketId))+'/snapshot',{fresh:true});
  const body=closePositionCommand(position,book,uuid(),uuid());
  const result=await submit(accountMode==='demo'?'/v1/demo/orders':'/v1/orders',body,accountMode+'close'+id);
  if(result.status==='PENDING')return;
  if(BigInt(String(result.filledQuantityLots??'0'))===0n)throw new Error('Position remains open. No execution was confirmed; check available liquidity.');
  if(settings.orderNotifications)notify({title:BigInt(String(result.filledQuantityLots))<BigInt(String(body.quantityLots))?'Position partly closed':'Position closed',message:'Check Portfolio for your updated balance.',tone:'success'});
 },[accountMode,submit,refresh,notify,settings.orderNotifications]);

 const cancelOrder=useCallback(async(id:string)=>{if(pending.current){await recoverPending();if(pending.current)throw new Error('The previous request is still being confirmed. Its execution must be resolved before cancellation.');}const result=await submit(accountMode==='demo'?'/v1/demo/orders/'+id+'/cancel':'/v1/orders/cancel',{commandId:uuid(),orderId:id},accountMode+'cancel'+id);if(settings.orderNotifications&&result.status!=='PENDING')notify({title:'Order cancelled',message:'Your orders have been updated.',tone:'success'});},[accountMode,submit,settings.orderNotifications,notify,recoverPending]);
 const setAccountMode=useCallback(async(next:AccountMode)=>{if(commandLock.current||pending.current)throw new Error('Your account action is still processing. BlackBook is checking it automatically before switching modes.');if(next===accountMode)return;for(const kind of ['deposit','withdraw'])if(await AsyncStorage.getItem(`blackbook.funding.${userId}.${kind}`))throw new Error('Resolve the pending funding request before switching modes.');await persist({accountMode:next});generation.current++;setModeState(next);},[accountMode,persist,userId]);
 const toggleFavorite=useCallback((symbol:string)=>{const next=new Set(favorites);if(next.has(symbol))next.delete(symbol);else next.add(symbol);setFavorites(next);void persist({favorites:[...next]}).catch(()=>{});},[favorites,persist]);
 const updateProfile=useCallback(async(changes:Partial<UserProfile>)=>{await persist({...('displayName'in changes?{displayName:changes.displayName}:{}),...('avatarUri'in changes?{avatar:changes.avatarUri}:{})});setProfile(current=>({...current,...changes}));},[persist]);
 const updateSetting=useCallback(<K extends keyof ExchangeSettings,>(k:K,v:ExchangeSettings[K])=>{if(k==='appearance'){setMode(v as ThemeMode);return;}if(k==='changeDisplay'){changeRevision.current++;setSettings(current=>({...current,changeDisplay:v as ExchangeSettings['changeDisplay']}));void AsyncStorage.setItem('blackbook.change-display.'+userId,String(v)).catch(()=>notify({title:'Preference not saved',message:'Your change display preference could not be saved on this device.',tone:'error'}));return;}if(k==='bandDisplay'){bandRevision.current++;setSettings(current=>({...current,bandDisplay:v as ExchangeSettings['bandDisplay']}));void AsyncStorage.setItem('blackbook.band-display.'+userId,String(v)).catch(()=>notify({title:'Preference not saved',message:'Your band display preference could not be saved on this device.',tone:'error'}));return;}const patch={ [k]:v,...(k==='marginWarnings'?{balanceWarningPercent:settings.balanceWarningPercent}:{}),...(k==='oneClickTrading'&&v?{confirmOrders:false}:{}),...(k==='confirmOrders'&&v?{oneClickTrading:false}:{}) };setSettings(current=>({...current,...patch}));if(k==='locale'||k==='timeZone')configureDisplay(k==='locale'?String(v):settings.locale,k==='timeZone'?String(v):settings.timeZone);void persist(patch).catch(async()=>{try{const saved=await api<{preferences:Row}>('/v1/preferences');applyPreferences(saved.preferences);}catch{}});},[persist,setMode,settings.locale,settings.timeZone,settings.balanceWarningPercent,applyPreferences,userId,notify]);
 const liquidationEstimate=useCallback((input:PlaceOrderInput)=>{
  if(!ready||Date.now()-observedAt.current>15000)return NaN;
  const m=remote.find(m=>m.symbol===input.symbol),book=bookFor(input.symbol);if(!m||!book)return NaN;
  let plan:ReturnType<typeof orderExecutionPlan>;try{plan=orderExecutionPlan(input.type,input.marketExecution??settings.defaultMarketExecution,input.targetPrice,settings.defaultTimeInForce);}catch{return NaN;}
  const scale=10**Number(m.terms.priceDecimals),price=orderEntryPrice({...input,type:plan.type,targetPrice:plan.targetPrice,priceDecimals:m.terms.priceDecimals,referenceTicks:m.referenceTicks,book});
  const factor=Number(m.terms.quoteMinorPerIndexUnitPerLot)/100;
  const lots=sizeDollarOrder({amount:input.amount,leverage:input.leverage,priceTicks:String(Math.round(price*scale)),priceDecimals:m.terms.priceDecimals,quoteMinorPerIndexUnitPerLot:m.terms.quoteMinorPerIndexUnitPerLot});if(!(lots>=Number(m.terms.minimumOrderLots)))return NaN;
  return estimateLiquidation({margin:input.amount,existingUnits:0,existingEntry:0,existingMargin:0,entry:price,addedUnits:(input.side==='long'?1:-1)*lots*factor,maintenanceRate:Number(m.marginPolicy.maintenanceMarginPpm)/1e6});
 },[account.positions,bookFor,ready,remote,settings.defaultMarketExecution,settings.defaultTimeInForce]);
 useTradingNotifications({scope:userId+':'+accountMode,settings,history,markets:markets.filter(m=>bookFor(m.symbol)?.lastTradePriceTicks),enabled:ready,updateSetting});
 const value:ExchangeContextValue={historyLoadingFor,markets:markets.filter(m=>m.category!=='Pairs'&&m.symbol!=='OSI'),pairMarkets:markets.filter(m=>m.category==='Pairs'),activeSymbol,setActiveSymbol,favorites,toggleFavorite,priceFor,changeFor,seriesFor,candlesFor,marketFor,cashBalance,totalEquity,unrealizedPnl,realizedPnl,usedMargin,positions,unavailablePositions,orders,history,placeOrder,closePosition,cancelOrder,positionPnl,liquidationEstimate,orderEstimate,profile,updateProfile,settings,updateSetting,accountMode,setAccountMode,loading,error,refresh,bookFor,maxLeverageFor,isTradableFor,busy,ready};
 return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useExchange(){const value=useContext(Context);if(!value)throw new Error('Exchange provider required');return value;}

