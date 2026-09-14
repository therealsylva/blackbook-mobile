import type { MarketDefinition } from '@/data/markets';
import type { ChartRange } from '@/types/exchange';

export interface CandlePoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const RANGE_LENGTH: Record<ChartRange, number> = {
  '1m': 42,
  '5m': 48,
  '15m': 52,
  '1H': 56,
  '4H': 60,
  '1D': 64,
  '1W': 58,
  '1M': 62,
  '6M': 68,
};

function hash(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function random(seed: number) {
  let state = seed || 1;
  return () => {
    state = Math.imul(state ^ (state >>> 15), state | 1);
    state ^= state + Math.imul(state ^ (state >>> 7), state | 61);
    return ((state ^ (state >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeSeries(market: MarketDefinition, range: ChartRange, livePrice = market.price) {
  const count = RANGE_LENGTH[range];
  const rng = random(hash(`${market.symbol}:${range}`));
  const rangeScale = {
    '1m': 0.0025,
    '5m': 0.004,
    '15m': 0.006,
    '1H': 0.01,
    '4H': 0.016,
    '1D': 0.026,
    '1W': 0.045,
    '1M': 0.072,
    '6M': 0.12,
  }[range];

  const values = Array.from({ length: count }, (_, index) => {
    const progress = index / Math.max(1, count - 1);
    const visibleChange = market.change24h / 100;
    const trendWeight = range === '1m' || range === '5m' ? 0.12 : range === '15m' || range === '1H' ? 0.28 : 1;
    const start = livePrice / Math.max(0.2, 1 + visibleChange * trendWeight);
    const baseline = start + (livePrice - start) * progress;
    const wave = Math.sin(progress * Math.PI * (3 + (market.rank % 4))) * livePrice * rangeScale * 0.32;
    const noise = (rng() - 0.5) * livePrice * rangeScale;
    return Math.max(0.01, baseline + wave + noise);
  });

  const anchor = livePrice / (values[values.length - 1] ?? livePrice);
  return values.map((value) => value * anchor);
}

export function makeCandles(market: MarketDefinition, range: ChartRange, livePrice = market.price): CandlePoint[] {
  const series = makeSeries(market, range, livePrice);
  const rng = random(hash(`${market.symbol}:${range}:ohlcv`));
  const volume = Number.parseFloat(market.volume.replace(/[^0-9.]/g, '')) || 10;
  const now = Date.now();

  return series.map((close, index) => {
    const open = index === 0 ? close * (1 + (rng() - 0.5) * 0.002) : (series[index - 1] ?? close);
    const body = Math.abs(close - open);
    const minimumSpread = Math.abs(close) * 0.0007;
    const spread = Math.max(minimumSpread, body * 0.55, 0.35);
    const high = Math.max(open, close) + spread * (0.55 + rng() * 0.65);
    const low = Math.min(open, close) - spread * (0.55 + rng() * 0.65);
    return {
      time: now - (series.length - index) * 60_000,
      open,
      high,
      low,
      close,
      volume: volume * 1_000_000 * (0.55 + rng() * 0.9),
    };
  });
}
