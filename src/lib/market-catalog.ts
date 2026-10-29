import type {MarketDefinition} from '../data/markets';
import type {FeePolicy} from './trading-fees';
export type RemoteMarket={marketId:string;entityId:string;symbol:string;displayName?:string;kind:string;marketVersion:string;marketHash:string;referenceTicks:string;lowerTicks:string;upperTicks:string;terms:{priceDecimals:string;quoteMinorPerIndexUnitPerLot:string;minimumOrderLots:string;feePolicyVersion:string};feePolicy:FeePolicy;marginPolicy:{initialMarginPpm:string;maintenanceMarginPpm:string};statistics?:{changePct24h?:number|string|null;volumeLots24h?:string;volumeMinor24h?:string;rangePct24h?:number;highPriceTicks24h?:string;lowPriceTicks24h?:string};tradable:boolean;indexChangePct?:number;asOf?:string;phase?:string};
type Row=Record<string,unknown>;
const canonicalSymbol=(value:unknown)=>String(value??'').split('/').map(s=>s==='FCB'?'BAR':s).join('/');
/** Join on stable entity identity; backend symbols may differ from app tickers. */
export function normalizeMarketCatalog(trading:Row[],indices:Row[],known:MarketDefinition[]):RemoteMarket[]{
 const output=new Map<string,RemoteMarket>();
 for(const row of [...indices,...trading]){
  const meta=known.find(m=>m.entityId===row.entityId||canonicalSymbol(m.symbol)===canonicalSymbol(row.symbol)||(Array.isArray(row.aliases)&&row.aliases.includes(m.symbol)));
  if(!meta)continue;
  const previous=output.get(meta.symbol),terms=row.terms as RemoteMarket['terms']|undefined;
  const tradable=Boolean(row.marketId&&terms?.priceDecimals&&terms.quoteMinorPerIndexUnitPerLot&&terms.minimumOrderLots&&row.feePolicy&&row.marginPolicy);
  output.set(meta.symbol,{
   ...previous,...row,entityId:String(row.entityId??previous?.entityId??meta.entityId),symbol:meta.symbol,displayName:String(row.displayName??meta.name),kind:String(row.kind??(meta.category==='Pairs'?'PAIR':meta.category==='Clubs'?'CLUB':'PLAYER')),
   marketId:String(row.marketId??previous?.marketId??''),marketVersion:String(row.marketVersion??previous?.marketVersion??''),marketHash:String(row.marketHash??previous?.marketHash??''),
   referenceTicks:String(row.referenceTicks??row.referenceMicros??previous?.referenceTicks??''),lowerTicks:String(row.lowerTicks??row.lowerMicros??previous?.lowerTicks??''),upperTicks:String(row.upperTicks??row.upperMicros??previous?.upperTicks??''),
   // Display-only projections have no contract. Never permit an order using
   // inferred economics, stale seed values, or guessed fee/margin settings.
   terms:terms??previous?.terms??{priceDecimals:'6',quoteMinorPerIndexUnitPerLot:'0',minimumOrderLots:'0',feePolicyVersion:''},
   feePolicy:(row.feePolicy??previous?.feePolicy) as FeePolicy,
   marginPolicy:(row.marginPolicy??previous?.marginPolicy??{initialMarginPpm:'1000000',maintenanceMarginPpm:'1000000'}) as RemoteMarket['marginPolicy'],tradable:meta.symbol!=='OSI'&&row.tradable!==false&&row.launchEligible!==false&&(tradable||Boolean(previous?.tradable)),
  } as RemoteMarket);
 }
 return [...output.values()];
}


/** Keep index updates distinct from the 24-hour traded-price statistic. */
export function selectedMarketChange(market:Pick<RemoteMarket,'indexChangePct'|'statistics'>|undefined,basis:'Index update'|'24h market'):number {
 const value=basis==='24h market'?market?.statistics?.changePct24h:market?.indexChangePct;
 if(value===null||value===undefined||value===''){
  // A successful statistics response with no trades is a neutral session.
  // Missing/failed statistics remain unavailable rather than reporting zero.
  if(basis==='24h market' && market?.statistics?.volumeLots24h==='0')return 0;
  return NaN;
 }
 const parsed=Number(value);return Number.isFinite(parsed)?parsed:NaN;
}
