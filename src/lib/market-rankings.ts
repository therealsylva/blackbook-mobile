import type { MarketDefinition } from '../data/football-markets';

/** Rank every supplied market, including pairs, on the same published metrics. */
export function rankMarkets(markets: MarketDefinition[], changeFor: (symbol: string) => number) {
  const eligible = [...new Map(markets.map(market => [market.symbol, market])).values()];
  const gains = eligible.filter(market => Number.isFinite(changeFor(market.symbol)))
    .sort((a, b) => changeFor(b.symbol) - changeFor(a.symbol));
  const descending = (key: 'volumeUsd24h' | 'volatility24h') => eligible
    .filter(market => Number.isFinite(market[key]))
    .sort((a, b) => b[key]! - a[key]! || a.symbol.localeCompare(b.symbol)).slice(0, 4);
  return { gainers: gains.slice(0, 4), losers: gains.slice(-4).reverse(), volume: descending('volumeUsd24h'), volatility: descending('volatility24h') };
}
