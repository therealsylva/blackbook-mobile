import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { MARKETS, type MarketDefinition } from '@/data/markets';
import type { ExchangeSettings, OpenOrder, OrderType, Position, Side, TradeRecord } from '@/types/exchange';

interface PlaceOrderInput {
  symbol: string;
  side: Side;
  type: OrderType;
  amount: number;
  leverage: number;
  targetPrice?: number;
}

interface ExchangeContextValue {
  markets: MarketDefinition[];
  activeSymbol: string;
  setActiveSymbol: (symbol: string) => void;
  favorites: Set<string>;
  alerts: Set<string>;
  toggleFavorite: (symbol: string) => void;
  toggleAlert: (symbol: string) => void;
  priceFor: (symbol: string) => number;
  changeFor: (symbol: string) => number;
  seriesFor: (symbol: string) => number[];
  marketFor: (symbol: string) => MarketDefinition | undefined;
  cashBalance: number;
  fundingBalance: number;
  totalEquity: number;
  unrealizedPnl: number;
  positions: Position[];
  orders: OpenOrder[];
  history: TradeRecord[];
  addFunds: (amount: number) => void;
  withdrawFunds: (amount: number) => boolean;
  transferFunds: (amount: number, direction: 'toFunding' | 'toTrading') => boolean;
  placeOrder: (input: PlaceOrderInput) => { kind: 'position' | 'order'; id: string };
  closePosition: (id: string) => void;
  cancelOrder: (id: string) => void;
  positionPnl: (position: Position) => number;
  settings: ExchangeSettings;
  updateSetting: <K extends keyof ExchangeSettings>(key: K, value: ExchangeSettings[K]) => void;
}

const initialSettings: ExchangeSettings = {
  interfaceMode: 'basic',
  appearance: 'Dark',
  language: 'English',
  currency: 'USD',
  colorPreference: 'Green up / Red down',
  defaultOrderType: 'market',
  defaultLeverage: 5,
  confirmOrders: true,
  attachRiskControls: true,
  priceAlerts: true,
  orderUpdates: true,
  positionRisk: true,
  appLock: false,
  biometrics: false,
  autoLock: 'After 5 minutes',
  refreshRate: 'Live',
};

const initialPositions: Position[] = [
  { id: 'P-RMD-01', symbol: 'RMD', side: 'long', size: 1880, entryPrice: 7358.42, leverage: 5, margin: 376, openedAt: Date.now() - 2_820_000 },
  { id: 'P-CGPT-01', symbol: 'CGPT', side: 'long', size: 1320, entryPrice: 8144.6, leverage: 3, margin: 440, openedAt: Date.now() - 6_420_000 },
];

const initialOrders: OpenOrder[] = [
  { id: 'O-LIV-01', symbol: 'LIV', side: 'long', type: 'limit', size: 900, targetPrice: 7040, leverage: 3, createdAt: Date.now() - 740_000 },
];

const initialHistory: TradeRecord[] = [
  { id: 'H-MBP-01', symbol: 'MBP', side: 'short', size: 780, price: 6881.2, status: 'closed', pnl: 42.18, createdAt: Date.now() - 86_400_000 },
  { id: 'H-SPOT-01', symbol: 'SPOT', side: 'long', size: 620, price: 7710.55, status: 'filled', createdAt: Date.now() - 172_800_000 },
];

const ExchangeContext = createContext<ExchangeContextValue | null>(null);
const MARKET_LOOKUP = new Map(MARKETS.map((market) => [market.symbol, market]));

export function ExchangeProvider({ children }: PropsWithChildren) {
  const [quotes, setQuotes] = useState<Record<string, number>>(() => Object.fromEntries(MARKETS.map((market) => [market.symbol, market.price])));
  const [activeSymbol, setActiveSymbolState] = useState('RMD');
  const [favorites, setFavorites] = useState(() => new Set(['RMD', 'CGPT', 'LIV', 'LMY']));
  const [alerts, setAlerts] = useState(() => new Set(['CGPT']));
  const [cashBalance, setCashBalance] = useState(9840.32);
  const [fundingBalance, setFundingBalance] = useState(0);
  const [positions, setPositions] = useState<Position[]>(initialPositions);
  const [orders, setOrders] = useState<OpenOrder[]>(initialOrders);
  const [history, setHistory] = useState<TradeRecord[]>(initialHistory);
  const [settings, setSettings] = useState(initialSettings);
  const tickRef = useRef(0);
  const idRef = useRef(10);

  useEffect(() => {
    const interval = setInterval(() => {
      tickRef.current += 1;
      setQuotes((current) => Object.fromEntries(MARKETS.map((market) => {
        const previous = current[market.symbol] ?? market.price;
        const wave = Math.sin((tickRef.current + market.rank * 2.7) / 3.8) * 0.00012;
        const drift = ((market.rank % 5) - 2) * 0.000008;
        return [market.symbol, Math.max(0.001, previous * (1 + wave + drift))];
      })));
    }, settings.refreshRate === 'Every 15 seconds' ? 15_000 : settings.refreshRate === 'Every 5 seconds' ? 5_000 : 2_400);
    return () => clearInterval(interval);
  }, [settings.refreshRate]);

  const setActiveSymbol = useCallback((symbol: string) => {
    if (MARKET_LOOKUP.has(symbol)) setActiveSymbolState(symbol);
  }, []);

  const marketFor = useCallback((symbol: string) => MARKET_LOOKUP.get(symbol), []);
  const priceFor = useCallback((symbol: string) => quotes[symbol] ?? MARKET_LOOKUP.get(symbol)?.price ?? 0, [quotes]);
  const changeFor = useCallback((symbol: string) => {
    const market = MARKET_LOOKUP.get(symbol);
    if (!market) return 0;
    const movement = ((priceFor(symbol) / market.price) - 1) * 100;
    return market.change24h + movement;
  }, [priceFor]);
  const seriesFor = useCallback((symbol: string) => {
    const market = MARKET_LOOKUP.get(symbol);
    if (!market) return [];
    return [...market.series.slice(0, -1), priceFor(symbol)];
  }, [priceFor]);

  const toggleFavorite = useCallback((symbol: string) => {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(symbol)) next.delete(symbol); else next.add(symbol);
      return next;
    });
  }, []);

  const toggleAlert = useCallback((symbol: string) => {
    setAlerts((current) => {
      const next = new Set(current);
      if (next.has(symbol)) next.delete(symbol); else next.add(symbol);
      return next;
    });
  }, []);

  const positionPnl = useCallback((position: Position) => {
    const current = priceFor(position.symbol);
    const direction = position.side === 'long' ? 1 : -1;
    return ((current - position.entryPrice) / position.entryPrice) * position.size * direction;
  }, [priceFor]);

  const unrealizedPnl = useMemo(() => positions.reduce((total, position) => total + positionPnl(position), 0), [positionPnl, positions]);
  const usedMargin = useMemo(() => positions.reduce((total, position) => total + position.margin, 0), [positions]);
  const totalEquity = cashBalance + fundingBalance + usedMargin + unrealizedPnl;

  const addFunds = useCallback((amount: number) => {
    if (Number.isFinite(amount) && amount > 0) setCashBalance((current) => current + amount);
  }, []);

  const withdrawFunds = useCallback((amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0 || amount > cashBalance) return false;
    setCashBalance((current) => current - amount);
    return true;
  }, [cashBalance]);

  const transferFunds = useCallback((amount: number, direction: 'toFunding' | 'toTrading') => {
    if (!Number.isFinite(amount) || amount <= 0) return false;
    if (direction === 'toFunding') {
      if (amount > cashBalance) return false;
      setCashBalance((current) => current - amount);
      setFundingBalance((current) => current + amount);
      return true;
    }
    if (amount > fundingBalance) return false;
    setFundingBalance((current) => current - amount);
    setCashBalance((current) => current + amount);
    return true;
  }, [cashBalance, fundingBalance]);

  const placeOrder = useCallback((input: PlaceOrderInput) => {
    const market = MARKET_LOOKUP.get(input.symbol);
    const price = priceFor(input.symbol);
    if (!market || input.amount <= 0 || input.leverage <= 0) throw new Error('Invalid order');
    const id = `${Date.now()}-${idRef.current++}`;
    const exposure = input.amount * input.leverage;
    if (input.type === 'market') {
      const position: Position = { id: `P-${id}`, symbol: input.symbol, side: input.side, size: exposure, entryPrice: price, leverage: input.leverage, margin: input.amount, openedAt: Date.now() };
      setPositions((current) => [position, ...current]);
      setCashBalance((current) => Math.max(0, current - input.amount));
      setHistory((current) => [{ id: `H-${id}`, symbol: input.symbol, side: input.side, size: exposure, price, status: 'filled', createdAt: Date.now() }, ...current]);
      return { kind: 'position' as const, id: position.id };
    }
    const order: OpenOrder = { id: `O-${id}`, symbol: input.symbol, side: input.side, type: input.type, size: exposure, targetPrice: input.targetPrice || price, leverage: input.leverage, createdAt: Date.now() };
    setOrders((current) => [order, ...current]);
    return { kind: 'order' as const, id: order.id };
  }, [priceFor]);

  const closePosition = useCallback((id: string) => {
    setPositions((current) => {
      const position = current.find((item) => item.id === id);
      if (!position) return current;
      const pnl = positionPnl(position);
      setCashBalance((cash) => cash + position.margin + pnl);
      setHistory((records) => [{ id: `H-CLOSE-${Date.now()}`, symbol: position.symbol, side: position.side, size: position.size, price: priceFor(position.symbol), status: 'closed', pnl, createdAt: Date.now() }, ...records]);
      return current.filter((item) => item.id !== id);
    });
  }, [positionPnl, priceFor]);

  const cancelOrder = useCallback((id: string) => {
    setOrders((current) => {
      const order = current.find((item) => item.id === id);
      if (!order) return current;
      setHistory((records) => [{ id: `H-CANCEL-${Date.now()}`, symbol: order.symbol, side: order.side, size: order.size, price: order.targetPrice, status: 'cancelled', createdAt: Date.now() }, ...records]);
      return current.filter((item) => item.id !== id);
    });
  }, []);

  const updateSetting = useCallback(<K extends keyof ExchangeSettings,>(key: K, value: ExchangeSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  }, []);

  const value = useMemo<ExchangeContextValue>(() => ({
    markets: MARKETS,
    activeSymbol,
    setActiveSymbol,
    favorites,
    alerts,
    toggleFavorite,
    toggleAlert,
    priceFor,
    changeFor,
    seriesFor,
    marketFor,
    cashBalance,
    fundingBalance,
    totalEquity,
    unrealizedPnl,
    positions,
    orders,
    history,
    addFunds,
    withdrawFunds,
    transferFunds,
    placeOrder,
    closePosition,
    cancelOrder,
    positionPnl,
    settings,
    updateSetting,
  }), [activeSymbol, addFunds, alerts, cancelOrder, cashBalance, changeFor, closePosition, favorites, fundingBalance, history, marketFor, orders, placeOrder, positionPnl, positions, priceFor, seriesFor, setActiveSymbol, settings, toggleAlert, toggleFavorite, totalEquity, transferFunds, unrealizedPnl, updateSetting, withdrawFunds]);

  return <ExchangeContext.Provider value={value}>{children}</ExchangeContext.Provider>;
}

export function useExchange() {
  const context = useContext(ExchangeContext);
  if (!context) throw new Error('useExchange must be used inside ExchangeProvider');
  return context;
}
