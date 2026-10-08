import publication from './index-snapshot.json';
export type MarketCategory = 'Clubs' | 'Athletes' | 'Pairs';
export interface ReferenceObservation { asOf: string; reference: number; previousReference: number }
export interface MarketDefinition {
  pairLegs?: [string, string]; description?: string; rank: number; symbol: string; name: string; category: MarketCategory;
  entityId: string; price: number; reference: number; lowerBand: number; upperBand: number;
  change24h: number; volume: string; density: number; high24h: number; low24h: number;
  assetKey: string; series: number[]; history: ReferenceObservation[]; snapshotAsOf: string;
}
export const SNAPSHOT_AS_OF = publication.pointer.asOf;
export const SNAPSHOT_LABEL = '1 September 2026';
export const MARKETS: MarketDefinition[] = publication.indices.map((index, rank) => {
  const row = index.snapshot;
  const reference = row.referenceMicros / 1_000_000;
  const history = index.movements.map((move) => ({ asOf: move.asOf,
    reference: move.newReferenceMicros / 1_000_000, previousReference: move.previousReferenceMicros / 1_000_000 }));
  return { rank: rank + 1, symbol: index.symbol, name: index.name, entityId: row.entityId,
    category: row.kind === 'CLUB' ? 'Clubs' : 'Athletes', price: reference, reference,
    lowerBand: row.lowerMicros / 1_000_000, upperBand: row.upperMicros / 1_000_000,
    change24h: NaN, volume: '—', density: row.densityPpm / 10_000,
    high24h: row.upperMicros / 1_000_000, low24h: row.lowerMicros / 1_000_000,
    assetKey: index.assetKey, snapshotAsOf: row.asOf, history,
    series: history.length ? [history[0]!.previousReference, ...history.map((point) => point.reference), reference] : [reference, reference] };
});
