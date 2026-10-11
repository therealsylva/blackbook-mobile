export type Side = 'long' | 'short';
export type OrderType = 'market' | 'limit' | 'stop';
export type InterfaceMode = 'basic' | 'advanced';
export type ChartRange = '1m' | '5m' | '15m' | '1H' | '4H' | '1D' | '1W' | '1M' | '6M';

export interface Position {
  id: string;
  symbol: string;
  side: Side;
  size: number;
  entryPrice: number;
  leverage: number;
  margin: number;
  openedAt: number;
}

export interface OpenOrder {
  id: string;
  symbol: string;
  side: Side;
  type: Exclude<OrderType, 'market'>;
  size: number;
  targetPrice: number;
  leverage: number;
  createdAt: number;
}

export interface TradeRecord {
  id: string;
  symbol: string;
  side: Side;
  event: 'opened' | 'filled' | 'closed' | 'cancelled';
  orderType: OrderType;
  size: number;
  leverage: number;
  entryPrice: number;
  exitPrice?: number;
  fee: number;
  pnl?: number;
  openedAt: number;
  createdAt: number;
}

export interface UserProfile {
  displayName: string;
  uid: string;
  email: string;
  avatarUri?: string;
}

export interface ExchangeSettings {
  interfaceMode: InterfaceMode;
  appearance: 'Dark' | 'Light' | 'System';
  locale:'en-GB'|'en-US'|'de-DE'|'fr-FR';
  timeZone:string;
  chartType:'candles'|'line'|'bar';
  candleInterval:'1m'|'5m'|'15m'|'1h'|'4h'|'1d'|'1w';
  defaultMargin:number;
  defaultTimeInForce:'GTC'|'IOC'|'FOK';
  oneClickTrading:boolean;
  marginWarnings:boolean;
  stopLossPercent:number;
  takeProfitPercent:number;
  maxPositionUsd:number;
  dailyLossUsd:number;
  orderNotifications:boolean;
  priceAlerts:boolean;
  priceAlertRules:PriceAlertRule[];
  language: 'English';
  currency: 'USD';
  colorPreference: 'Green up / Red down' | 'Red up / Green down';
  defaultOrderType: OrderType;
  defaultLeverage: number;
  confirmOrders: boolean;
  attachRiskControls: boolean;
  refreshRate: 'Live' | 'Every 5 seconds' | 'Every 15 seconds';
}

export interface PriceAlertRule {id:string;symbol:string;direction:'above'|'below';price:number;fired:boolean;}
