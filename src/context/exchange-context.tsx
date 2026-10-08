import {createContext,useCallback,useContext,useEffect,useMemo,useRef,useState,type PropsWithChildren} from 'react';
import {Alert,AppState} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ALL_MARKETS} from '@/data/pair-markets';
import type {MarketDefinition} from '@/data/markets';
import type {CandlePoint} from '@/lib/market-series';
import {api,uuid} from '@/lib/backend';
import {estimateLiquidation} from '@/lib/trade-risk';
import {useAuth} from '@/context/auth-context';
import {useTheme,type ThemeMode} from '@/theme/theme-context';
import type {ChartRange,ExchangeSettings,OpenOrder,OrderType,Position,Side,TradeRecord,UserProfile} from '@/types/exchange';

type Row=Record<string,unknown>;
type RemoteMarket={marketId:string;entityId:string;symbol:string;displayName?:string;kind:string;marketVersion:string;marketHash:string;referenceTicks:string;lowerTicks:string;upperTicks:string;terms:{priceDecimals:string;quoteMinorPerIndexUnitPerLot:string;minimumOrderLots:string};marginPolicy:{initialMarginPpm:string;maintenanceMarginPpm:string};phase?:string};
export type BookSnapshot={marketId:string;status:string;marketVersion:string;marketHash:string;referenceTicks:string;lowerTicks:string;upperTicks:string;lastTradePriceTicks?:string;bids:{priceTicks:string;quantityLots:string}[];asks:{priceTicks:string;quantityLots:string}[]};
type AccountMode='real'|'demo';
interface PlaceOrderInput {symbol:string;side:Side;type:OrderType;amount:number;leverage:number;targetPrice?:number;takeProfit?:number;stopLoss?:number}
interface ExchangeContextValue {
 markets:MarketDefinition[];pairMarkets:MarketDefinition[];activeSymbol:string;setActiveSymbol:(symbol:string)=>void;favorites:Set<string>;toggleFavorite:(symbol:string)=>void;
 priceFor:(symbol:string)=>number;changeFor:(symbol:string)=>number;seriesFor:(symbol:string,range?:ChartRange)=>number[];candlesFor:(symbol:string,range?:ChartRange)=>CandlePoint[];marketFor:(symbol:string)=>MarketDefinition|undefined;
 cashBalance:number;usedMargin:number;totalEquity:number;unrealizedPnl:number;positions:Position[];orders:OpenOrder[];history:TradeRecord[];liquidationEstimate:(input:PlaceOrderInput)=>number;
 placeOrder:(input:PlaceOrderInput)=>Promise<{kind:'position'|'order';id:string}>;closePosition:(id:string)=>Promise<void>;cancelOrder:(id:string)=>Promise<void>;positionPnl:(position:Position)=>number;
 profile:UserProfile;updateProfile:(changes:Partial<UserProfile>)=>void;settings:ExchangeSettings;updateSetting:<K extends keyof ExchangeSettings>(key:K,value:ExchangeSettings[K])=>void;
 accountMode:AccountMode;setAccountMode:(mode:AccountMode)=>Promise<void>;loading:boolean;error:string|null;refresh:()=>Promise<void>;bookFor:(symbol:string)=>BookSnapshot|undefined;maxLeverageFor:(symbol:string)=>number;busy:boolean;ready:boolean;
}
const defaults:ExchangeSettings={interfaceMode:'basic',appearance:'Dark',language:'English',currency:'USD',colorPreference:'Green up / Red down',defaultOrderType:'market',defaultLeverage:5,confirmOrders:true,attachRiskControls:true,refreshRate:'Live'};
const Context=createContext<ExchangeContextValue|null>(null);
const metadata=new Map(ALL_MARKETS.map(m=>[m.symbol,m]));
const message=(e:unknown)=>e instanceof Error?e.message:'BlackBook is unavailable. Please try again.';
const time=(v:unknown)=>typeof v==='string'?Date.parse(v):0;
const money=(v:unknown)=>v===null||v===undefined?NaN:Number(v)/100;
const str=(v:unknown)=>String(v??'');
const rangeMs:Record<ChartRange,number>={'1m':60000,'5m':300000,'15m':900000,'1H':3600000,'4H':14400000,'1D':86400000,'1W':604800000,'1M':2592000000,'6M':15552000000};
async function pages(path:string):Promise<Row[]>{const items:Row[]=[];let cursor:string|null=null;do{const response: {items:Row[];nextCursor:string|null}=await api(path+(cursor?'?cursor='+encodeURIComponent(cursor):''));items.push(...response.items);cursor=response.nextCursor;}while(cursor);return items;}
export function ExchangeProvider({children}:PropsWithChildren){
 const {session}=useAuth(),{setMode}=useTheme();
 const userId=session?.user.id??'',key='blackbook.preferences.'+userId,pendingKey='blackbook.pending-command.'+userId;
 const [accountMode,setModeState]=useState<AccountMode>('real'),[hydrated,setHydrated]=useState(false);
 const [settings,setSettings]=useState(defaults),[profile,setProfile]=useState<UserProfile>({displayName:session?.user.user_metadata?.display_name??session?.user.email?.split('@')[0]??'Trader',uid:userId,email:session?.user.email??'',avatarUri:'void'});
 const [favorites,setFavorites]=useState(new Set<string>()),[activeSymbol,setActiveSymbol]=useState('RMD');
 const [remote,setRemote]=useState<RemoteMarket[]>([]),[books,setBooks]=useState<Record<string,BookSnapshot>>({}),[marketCandles,setCandles]=useState<Record<string,CandlePoint[]>>({});
 const [account,setAccount]=useState<{portfolio:Row;positions:Row[];orders:Row[];fills:Row[]}>({portfolio:{},positions:[],orders:[],fills:[]});
 const [loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null),[busy,setBusy]=useState(false),[ready,setReady]=useState(false);
 const generation=useRef(0),inFlight=useRef(false),commandLock=useRef(false),pending=useRef<{fingerprint:string;path:string;body:Row}|null>(null),persistChain=useRef(Promise.resolve());
 const observedAt=useRef(0);
 const applyPreferences=useCallback((p:Row)=>{
  const next={...defaults,...Object.fromEntries(Object.keys(defaults).filter(k=>k!=='language'&&k!=='currency'&&p[k]!==undefined).map(k=>[k,p[k]]))} as ExchangeSettings;
  setSettings(next);setMode(next.appearance);setFavorites(new Set(Array.isArray(p.favorites)?p.favorites.filter((v):v is string=>typeof v==='string'):[]));
  setProfile(current=>({...current,...(typeof p.displayName==='string'?{displayName:p.displayName}:{}),...(typeof p.avatar==='string'?{avatarUri:p.avatar}:{})}));
  setModeState(p.accountMode==='demo'?'demo':'real');
 },[setMode]);
 useEffect(()=>{let alive=true;generation.current++;pending.current=null;setHydrated(false);
  void (async()=>{try{const stored=await AsyncStorage.getItem(pendingKey);if(alive&&stored)pending.current=JSON.parse(stored);const saved=await api<{preferences:Row}>('/v1/preferences');if(alive){applyPreferences(saved.preferences);await AsyncStorage.setItem(key,JSON.stringify(saved.preferences));}}catch(e){if(alive){setError(message(e));const local=await AsyncStorage.getItem(key);if(local)try{applyPreferences(JSON.parse(local));}catch{}}}finally{if(alive)setHydrated(true);}})();
  return()=>{alive=false;generation.current++;};
 },[applyPreferences,key,pendingKey]);
 const persist=useCallback((patch:Row)=>{
  const next=persistChain.current.then(async()=>{const saved=await api<{preferences:Row}>('/v1/preferences',patch,'PUT');await AsyncStorage.setItem(key,JSON.stringify(saved.preferences));});
  persistChain.current=next.catch(e=>{setError(message(e));Alert.alert('Preference not saved',message(e));});return next;
 },[key]);
 const refresh=useCallback(async()=>{
  if(!hydrated||inFlight.current)return;inFlight.current=true;const version=generation.current;
  try{
   if(pending.current&&!commandLock.current){
    commandLock.current=true;setBusy(true);
    try{await api(pending.current.path,pending.current.body);await AsyncStorage.removeItem(pendingKey);pending.current=null;}
    catch(e){if(e instanceof Error&&'status'in e&&[400,403,409,422].includes(Number(e.status))){await AsyncStorage.removeItem(pendingKey);pending.current=null;Alert.alert('Saved request rejected',e.message);}else throw e;}
    finally{commandLock.current=false;setBusy(false);}
   }
   const catalog=await api<{items:RemoteMarket[]}>('/v1/markets');
   const modePrefix=accountMode==='demo'?'/v1/demo/account':'/v1/account';
   const [portfolio,positions,orders,fills,snapshots]=await Promise.all([pages(modePrefix+'/portfolio'),pages(modePrefix+'/positions'),pages(modePrefix+'/orders'),pages(modePrefix+'/fills'),Promise.all(catalog.items.map(async m=>[m.marketId,await api<BookSnapshot>('/v1/markets/'+encodeURIComponent(m.marketId)+'/snapshot')] as const))]);
   const conditional=accountMode==='real'?await api<{items:Row[]}>('/v1/conditional-orders'):{items:[]};
   const allOrders=[...new Map([...orders,...conditional.items].map(o=>[o.orderId,o])).values()];
   if(generation.current!==version)return;
   setRemote(catalog.items);setBooks(Object.fromEntries(snapshots));setAccount({portfolio:portfolio.find(p=>p.assetCode==='USD')??{},positions,orders:allOrders,fills});observedAt.current=Date.now();setReady(true);setError(null);
   if(catalog.items.length&&!catalog.items.some(m=>m.symbol===activeSymbol))setActiveSymbol(catalog.items[0]!.symbol);
   const active=catalog.items.find(m=>m.symbol===activeSymbol)??catalog.items[0];
   if(active){try{const candles=await api<{candles:CandlePoint[]}>('/v1/markets/'+encodeURIComponent(active.marketId)+'/candles?interval=1m&limit=2000');if(generation.current===version)setCandles(current=>({...current,[active.symbol]:candles.candles}));}catch{/* The account and book remain usable while history is unavailable. */}}
  }catch(e){if(generation.current===version){setError(message(e));setReady(false);}}finally{inFlight.current=false;if(generation.current===version)setLoading(false);}
 },[accountMode,activeSymbol,hydrated,pendingKey]);
 useEffect(()=>{generation.current++;setAccount({portfolio:{},positions:[],orders:[],fills:[]});setReady(false);setLoading(true);},[accountMode]);
 useEffect(()=>{void refresh();const tick=setInterval(()=>{if(AppState.currentState==='active')void refresh();},settings.refreshRate==='Every 15 seconds'?15000:settings.refreshRate==='Every 5 seconds'?5000:2500);const event=AppState.addEventListener('change',s=>{if(s==='active')void refresh();});return()=>{clearInterval(tick);event.remove();};},[refresh,settings.refreshRate]);
 const lookup=useMemo(()=>new Map(remote.map(r=>[r.symbol,r])),[remote]);
 const markets=useMemo(()=>remote.map((r,index)=>{const old=metadata.get(r.symbol),scale=10**Number(r.terms.priceDecimals),book=books[r.marketId],reference=Number(r.referenceTicks)/scale;return {...old,rank:index+1,symbol:r.symbol,name:r.displayName??old?.name??r.symbol,category:r.kind==='PAIR'?'Pairs':r.kind==='CLUB'?'Clubs':'Athletes',entityId:r.entityId,price:Number(book?.lastTradePriceTicks??r.referenceTicks)/scale,reference,lowerBand:Number(r.lowerTicks)/scale,upperBand:Number(r.upperTicks)/scale,change24h:NaN,volume:'—',density:old?.density??0,high24h:NaN,low24h:NaN,assetKey:old?.assetKey??'',series:[],history:[],snapshotAsOf:''} as MarketDefinition;}),[books,remote]);
 const marketFor=useCallback((symbol:string)=>markets.find(m=>m.symbol===symbol),[markets]);
 const priceFor=useCallback((symbol:string)=>marketFor(symbol)?.price??NaN,[marketFor]);
 const changeFor=useCallback((symbol:string)=>{const c=marketCandles[symbol]??[],cut=Date.now()-86400000,first=c.find(x=>x.time>=cut);return first&&c[0]!.time<=cut?(priceFor(symbol)/first.open-1)*100:NaN;},[marketCandles,priceFor]);
 const candlesFor=useCallback((symbol:string,range:ChartRange='15m')=>{const rows=marketCandles[symbol]??[],step=rangeMs[range],buckets=new Map<number,CandlePoint>();for(const row of rows){const t=Math.floor(row.time/step)*step,old=buckets.get(t);buckets.set(t,old?{...old,high:Math.max(old.high,row.high),low:Math.min(old.low,row.low),close:row.close,volume:old.volume+row.volume}:{...row,time:t});}return [...buckets.values()].slice(-200);},[marketCandles]);
 const seriesFor=useCallback((symbol:string,range:ChartRange='1D')=>candlesFor(symbol,range).map(x=>x.close),[candlesFor]);
 const bookFor=useCallback((symbol:string)=>{const m=lookup.get(symbol);return m?books[m.marketId]:undefined;},[books,lookup]);
 const maxLeverageFor=useCallback((symbol:string)=>{const m=lookup.get(symbol);return m?Math.min(50,Math.floor(1000000/Number(m.marginPolicy.initialMarginPpm))):1;},[lookup]);
 const positions=useMemo(()=>account.positions.flatMap(p=>{const m=remote.find(m=>m.marketId===p.marketId);if(!m)return [];const lots=Number(p.positionLots),entry=Number(p.entryPriceTicks)/10**Number(m.terms.priceDecimals),size=Math.abs(lots)*entry*Number(m.terms.quoteMinorPerIndexUnitPerLot)/100,margin=p.heldMarginMinor===undefined?size*Number(m.marginPolicy.initialMarginPpm)/1000000:money(p.heldMarginMinor);return [{id:m.marketId,symbol:m.symbol,side:lots>0?'long':'short',size,entryPrice:entry,leverage:Number(p.leverage??size/Math.max(margin,0.01)),margin,openedAt:time(p.openedAt??p.updatedAt)} as Position];}),[account.positions,remote]);
 const orders=useMemo(()=>account.orders.flatMap(o=>{const m=remote.find(m=>m.marketId===o.marketId);if(!m)return [];const target=Number(o.triggerTicks??o.priceTicks??m.referenceTicks)/10**Number(m.terms.priceDecimals);return [{id:str(o.orderId),symbol:m.symbol,side:o.side==='BID'?'long':'short',type:o.type==='STOP'?'stop':'limit',size:Number(o.remainingQuantityLots??o.quantityLots)*target*Number(m.terms.quoteMinorPerIndexUnitPerLot)/100,targetPrice:target,leverage:Number(o.leverage??maxLeverageFor(m.symbol)),createdAt:time(o.createdAt)} as OpenOrder];}),[account.orders,maxLeverageFor,remote]);
 const history=useMemo(()=>account.fills.flatMap(f=>{const m=remote.find(m=>m.marketId===f.marketId);if(!m||!f.priceTicks)return [];const price=Number(f.priceTicks)/10**Number(m.terms.priceDecimals);return [{id:str(f.fillId??f.id??f.tradeId),symbol:m.symbol,side:f.side==='BID'?'long':'short',event:'filled',orderType:'market',size:Number(f.quantityLots)*price*Number(m.terms.quoteMinorPerIndexUnitPerLot)/100,leverage:Number(f.leverage??1),entryPrice:price,fee:money(f.feeMinor??'0'),pnl:money(f.realizedPnlMinor??'0'),openedAt:time(f.createdAt),createdAt:time(f.createdAt)} as TradeRecord];}),[account.fills,remote]);
 const positionPnl=useCallback((p:Position)=>money(account.positions.find(x=>x.marketId===p.id)?.unrealizedPnlMinor),[account.positions]);
 const cashBalance=money(account.portfolio.availableToTradeMinor),totalEquity=money(account.portfolio.equityMinor),unrealizedPnl=money(account.portfolio.unrealizedPnlMinor),usedMargin=account.portfolio.usedMarginMinor===undefined?positions.reduce((sum,p)=>sum+p.margin,0)+money(account.portfolio.reservedMarginMinor??'0'):money(account.portfolio.usedMarginMinor)+money(account.portfolio.reservedMarginMinor??'0');
 const submit=useCallback(async(path:string,body:Row,fingerprint:string)=>{
  if(commandLock.current)throw new Error('Another account action is being submitted.');if(!ready)throw new Error('Wait for the account and market connection.');
  if(pending.current&&pending.current.fingerprint!==fingerprint)throw new Error('Retry the previous action to resolve its outcome before placing another.');
  commandLock.current=true;setBusy(true);const request=pending.current??{path,body,fingerprint};pending.current=request;
  try{await AsyncStorage.setItem(pendingKey,JSON.stringify(request));const result=await api<Row>(request.path,request.body);await AsyncStorage.removeItem(pendingKey);pending.current=null;await refresh();return (result.order??result) as Row;}
  catch(e){if(e instanceof Error&&'status' in e&&[400,403,409,422].includes(Number(e.status))){await AsyncStorage.removeItem(pendingKey);pending.current=null;}throw e;}finally{commandLock.current=false;setBusy(false);}
 },[ready,refresh,pendingKey]);
 const placeOrder=useCallback(async(input:PlaceOrderInput)=>{
  const m=lookup.get(input.symbol),book=bookFor(input.symbol);if(!m||!book||book.status!=='RUNNING')throw new Error('Market is unavailable.');
  if(!Number.isFinite(input.amount)||input.amount<=0||input.amount>cashBalance||!Number.isInteger(input.leverage)||input.leverage<1||input.leverage>maxLeverageFor(input.symbol))throw new Error('Check your margin and leverage.');
  const scale=10**Number(m.terms.priceDecimals),price=input.type==='market'?Number((input.side==='long'?book.asks:book.bids)[0]?.priceTicks??book.lastTradePriceTicks??m.referenceTicks)/scale:input.targetPrice;
  if(!price||!Number.isFinite(price))throw new Error('Enter a valid price.');
  const lots=Math.floor(input.amount*100*input.leverage/(price*Number(m.terms.quoteMinorPerIndexUnitPerLot)));if(!Number.isSafeInteger(lots)||lots<Number(m.terms.minimumOrderLots))throw new Error('Amount is below the minimum lot size.');
  const ticks=(v:number)=>{const value=Math.round(v*scale);if(!Number.isSafeInteger(value)||value<=0)throw new Error('Invalid price.');return String(value);};
  const body:Row={commandId:uuid(),orderId:uuid(),marketId:m.marketId,side:input.side==='long'?'BID':'ASK',type:input.type.toUpperCase(),quantityLots:String(lots),leverage:input.leverage,expectedMarketVersion:book.marketVersion,expectedMarketHash:book.marketHash,...(input.type==='limit'?{priceTicks:ticks(price)}:{}),...(input.type==='stop'?{triggerTicks:ticks(price)}:{}),...(input.takeProfit===undefined?{}:{takeProfitTicks:ticks(input.takeProfit)}),...(input.stopLoss===undefined?{}:{stopLossTicks:ticks(input.stopLoss)})};
  const result=await submit(accountMode==='demo'?'/v1/demo/orders':'/v1/orders',body,accountMode+JSON.stringify(input));
  if(result.status==='CANCELLED')throw new Error('Order cancelled without a fill. Check available liquidity.');
  return {kind:result.status==='RESTING'?'order':'position',id:str(result.orderId)} as const;
 },[accountMode,bookFor,cashBalance,lookup,maxLeverageFor,submit]);
 const closePosition=useCallback(async(id:string)=>{const p=account.positions.find(p=>p.marketId===id),m=remote.find(m=>m.marketId===id),book=m&&bookFor(m.symbol);if(!p||!m||!book)throw new Error('Position unavailable.');await submit(accountMode==='demo'?'/v1/demo/orders':'/v1/orders',{commandId:uuid(),orderId:uuid(),marketId:id,side:Number(p.positionLots)>0?'ASK':'BID',type:'MARKET',quantityLots:String(Math.abs(Number(p.positionLots))),expectedMarketVersion:book.marketVersion,expectedMarketHash:book.marketHash,reduceOnly:true,expectedPositionSequence:str(p.lastTradeSequence)},accountMode+'close'+id);},[account.positions,accountMode,bookFor,remote,submit]);
 const cancelOrder=useCallback(async(id:string)=>{await submit(accountMode==='demo'?'/v1/demo/orders/'+id+'/cancel':'/v1/orders/cancel',{commandId:uuid(),orderId:id},accountMode+'cancel'+id);},[accountMode,submit]);
 const setAccountMode=useCallback(async(next:AccountMode)=>{if(commandLock.current||pending.current)throw new Error('Resolve the pending account action before switching modes.');if(next===accountMode)return;await persist({accountMode:next});generation.current++;setModeState(next);},[accountMode,persist]);
 const toggleFavorite=useCallback((symbol:string)=>{const next=new Set(favorites);if(next.has(symbol))next.delete(symbol);else next.add(symbol);setFavorites(next);void persist({favorites:[...next]}).catch(()=>{});},[favorites,persist]);
 const updateProfile=useCallback((changes:Partial<UserProfile>)=>{setProfile(current=>({...current,...changes}));void persist({...('displayName'in changes?{displayName:changes.displayName}:{}),...('avatarUri'in changes?{avatar:changes.avatarUri}:{})}).catch(()=>{});},[persist]);
 const updateSetting=useCallback(<K extends keyof ExchangeSettings,>(k:K,v:ExchangeSettings[K])=>{if(k==='appearance')setMode(v as ThemeMode);setSettings(current=>({...current,[k]:v}));void persist({[k]:v}).catch(()=>{});},[persist,setMode]);
 const liquidationEstimate=useCallback((input:PlaceOrderInput)=>{
  if(!ready||error||Date.now()-observedAt.current>15000)return NaN;
  const m=remote.find(m=>m.symbol===input.symbol),book=bookFor(input.symbol);if(!m||!book)return NaN;
  const scale=10**Number(m.terms.priceDecimals),price=input.type==='market'?Number((input.side==='long'?book.asks[0]:book.bids[0])?.priceTicks)/scale:input.targetPrice??NaN;
  const factor=Number(m.terms.quoteMinorPerIndexUnitPerLot)/100;
  const lots=Math.floor(input.amount*input.leverage/(price*factor));if(!(lots>=Number(m.terms.minimumOrderLots)))return NaN;
  const p=account.positions.find(p=>p.marketId===m.marketId);
  return estimateLiquidation({equity:totalEquity,maintenance:money(account.portfolio.maintenanceMarginMinor),existingUnits:p?Number(p.positionLots)*factor:0,existingMark:p?Number(p.markPriceTicks)/scale:0,entry:price,addedUnits:(input.side==='long'?1:-1)*lots*factor,maintenanceRate:Number(m.marginPolicy.maintenanceMarginPpm)/1e6});
 },[account,bookFor,error,ready,remote,totalEquity]);
 const value:ExchangeContextValue={markets:markets.filter(m=>m.category!=='Pairs'),pairMarkets:markets.filter(m=>m.category==='Pairs'),activeSymbol,setActiveSymbol,favorites,toggleFavorite,priceFor,changeFor,seriesFor,candlesFor,marketFor,cashBalance,totalEquity,unrealizedPnl,usedMargin,positions,orders,history,placeOrder,closePosition,cancelOrder,positionPnl,liquidationEstimate,profile,updateProfile,settings,updateSetting,accountMode,setAccountMode,loading,error,refresh,bookFor,maxLeverageFor,busy,ready};
 return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useExchange(){const value=useContext(Context);if(!value)throw new Error('Exchange provider required');return value;}

