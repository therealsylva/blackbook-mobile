import type {MarketDefinition} from '../data/markets';
import type {FeePolicy} from './trading-fees';
export type RemoteMarket={marketId:string;entityId:string;symbol:string;displayName?:string;kind:string;marketVersion:string;marketHash:string;referenceTicks:string;lowerTicks:string;upperTicks:string;terms:{priceDecimals:string;quoteMinorPerIndexUnitPerLot:string;minimumOrderLots:string;feePolicyVersion:string};feePolicy:FeePolicy;marginPolicy:{initialMarginPpm:string;maintenanceMarginPpm:string};tradable:boolean;indexChangePct?:number;asOf?:string;phase?:string};
type Row=Record<string,unknown>;
/** Join on stable entity identity; backend symbols may differ from app tickers. */
export function normalizeMarketCatalog(trading:Row[],indices:Row[],known:MarketDefinition[]):RemoteMarket[]{
 const output=new Map<string,RemoteMarket>();
 for(const row of [...indices,...trading]){
  const meta=known.find(m=>m.entityId===row.entityId||m.symbol===row.symbol||(Array.isArray(row.aliases)&&row.aliases.includes(m.symbol)));
  if(!meta)continue;
  const previous=output.get(meta.symbol),terms=row.terms as RemoteMarket['terms']|undefined;
  const tradable=Boolean(row.marketId&&terms?.priceDecimals&&terms.quoteMinorPerIndexUnitPerLot&&terms.minimumOrderLots&&row.feePolicy&&row.marginPolicy);
  output.set(meta.symbol,{
   ...previous,...row,entityId:meta.entityId,symbol:meta.symbol,displayName:String(row.displayName??meta.name),kind:String(row.kind??(meta.category==='Pairs'?'PAIR':meta.category==='Clubs'?'CLUB':'PLAYER')),
   marketId:String(row.marketId??previous?.marketId??''),marketVersion:String(row.marketVersion??previous?.marketVersion??''),marketHash:String(row.marketHash??previous?.marketHash??''),
   referenceTicks:String(row.referenceTicks??row.referenceMicros??previous?.referenceTicks??''),lowerTicks:String(row.lowerTicks??row.lowerMicros??previous?.lowerTicks??''),upperTicks:String(row.upperTicks??row.upperMicros??previous?.upperTicks??''),
   // Display-only projections have no contract. Never permit an order using
   // inferred economics, stale seed values, or guessed fee/margin settings.
   terms:terms??previous?.terms??{priceDecimals:'6',quoteMinorPerIndexUnitPerLot:'0',minimumOrderLots:'0',feePolicyVersion:''},
   feePolicy:(row.feePolicy??previous?.feePolicy) as FeePolicy,
   marginPolicy:(row.marginPolicy??previous?.marginPolicy??{initialMarginPpm:'1000000',maintenanceMarginPpm:'1000000'}) as RemoteMarket['marginPolicy'],tradable:tradable||Boolean(previous?.tradable),
  } as RemoteMarket);
 }
 return [...output.values()];
}
