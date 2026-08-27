export type Side = 'long' | 'short';
export type OrderType = 'market' | 'limit' | 'stop';
export type InterfaceMode = 'basic' | 'advanced';

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
  size: number;
  price: number;
  status: 'filled' | 'closed' | 'cancelled';
  pnl?: number;
  createdAt: number;
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
  priceAlerts: boolean;
  orderUpdates: boolean;
  positionRisk: boolean;
  appLock: boolean;
  biometrics: boolean;
  autoLock: 'Immediately' | 'After 1 minute' | 'After 5 minutes';
  refreshRate: 'Live' | 'Every 5 seconds' | 'Every 15 seconds';
}
