import { MARKETS, type MarketDefinition } from './markets';
import { MAJOR_PAIRS } from './pairs';
export const PAIR_MARKETS: MarketDefinition[] = MAJOR_PAIRS.map((pair, rank) => {
 const left = MARKETS.find(market => market.symbol === pair.left)!;
 const right = MARKETS.find(market => market.symbol === pair.right)!;
 const reference = left.reference / right.reference * 1000;
 const price = left.price / right.price * 1000;
 const lowerPercent = Math.min(left.lowerBand / left.reference - 1, right.lowerBand / right.reference - 1);
 const upperPercent = Math.max(left.upperBand / left.reference - 1, right.upperBand / right.reference - 1);
 const opening = (left.price / (1 + left.change24h / 100)) / (right.price / (1 + right.change24h / 100)) * 1000;
 return { ...left, rank: rank + 31, symbol: pair.title, name: pair.title, entityId: pair.id, category: 'Pairs',
  pairLegs: [pair.left, pair.right], reference, price, change24h: (price / opening - 1) * 100,
  lowerBand: reference * (1 + lowerPercent), upperBand: reference * (1 + upperPercent),
  volume: `${(1.8 + rank * 0.47).toFixed(1)}M`, series: [], history: [],
  description: `${pair.title} is a pair index that tracks ${left.name}'s performance compared with ${right.name}.` };
});
export const ALL_MARKETS = [...MARKETS, ...PAIR_MARKETS];
