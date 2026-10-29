type PositionRow = Record<string, unknown>;

/** Keep account positions countable even if their market is missing from the current catalog. */
export function unavailablePositions(positions: PositionRow[], markets: {marketId: string}[]) {
 const marketIds = new Set(markets.map(m => m.marketId));
 return positions.filter(p => !p.positionId || !marketIds.has(String(p.marketId ?? '')))
  .map(p => ({positionId: String(p.positionId ?? p.marketId ?? ''), marketId: String(p.marketId ?? ''), positionLots: String(p.positionLots ?? '')}));
}

