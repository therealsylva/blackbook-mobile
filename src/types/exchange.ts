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
  phone: string;
  verified: boolean;
  avatarUri?: string;
}

export interface ExchangeSettings {
  interfaceMode: InterfaceMode;
  appearance: 'Dark' | 'Light' | 'System';
  language: 'English' | 'French' | 'Spanish';
  currency: 'USD' | 'EUR' | 'GBP';
  colorPreference: 'Green up / Red down' | 'Red up / Green down';
  defaultOrderType: OrderType;
  defaultLeverage: number;
  confirmOrders: boolean;
  attachRiskControls: boolean;
  pushNotifications: boolean;
  appLock: boolean;
  biometrics: boolean;
  autoLock: 'Immediately' | 'After 1 minute' | 'After 5 minutes';
  refreshRate: 'Live' | 'Every 5 seconds' | 'Every 15 seconds';
}
