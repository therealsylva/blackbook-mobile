export type MarketCategory = 'Clubs' | 'Athletes' | 'Leagues' | 'Relative Value';

export type MarketStatus = 'Live' | 'Open' | 'Paused';

export interface Market {
  symbol: string;
  name: string;
  category: MarketCategory;
  price: number;
  change: number;
  changePercent: number;
  status: MarketStatus;
  color: string;
  points: readonly number[];
  latestEvent: string;
  latestEventTime: string;
  notionalVolume: number;
  bandRemaining: number;
  density: number;
}

export interface Position {
  id: string;
  symbol: string;
  side: 'Long' | 'Short';
  size: number;
  entry: number;
  mark: number;
  pnl: number;
  pnlPercent: number;
  leverage: number;
}

export type OrderSide = 'Long' | 'Short';
