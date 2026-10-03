import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { PAIR_MARKETS, ALL_MARKETS } from '@/data/pair-markets';
import { MARKETS, type MarketDefinition } from '@/data/markets';
import { makeCandles, makeSeries, type CandlePoint } from '@/lib/market-series';
import { useTheme, type ThemeMode } from '@/theme/theme-context';
import type { ChartRange, ExchangeSettings, OpenOrder, OrderType, Position, Side, TradeRecord, UserProfile } from '@/types/exchange';

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
  pairMarkets: MarketDefinition[];
  activeSymbol: string;
  setActiveSymbol: (symbol: string) => void;
  favorites: Set<string>;
  alerts: Set<string>;
  toggleFavorite: (symbol: string) => void;
  toggleAlert: (symbol: string) => void;
  priceFor: (symbol: string) => number;
  changeFor: (symbol: string) => number;
  seriesFor: (symbol: string, range?: ChartRange) => number[];
  candlesFor: (symbol: string, range?: ChartRange) => CandlePoint[];
  marketFor: (symbol: string) => MarketDefinition | undefined;
  cashBalance: number;
  usedMargin: number;
  totalEquity: number;
  unrealizedPnl: number;
  positions: Position[];
  orders: OpenOrder[];
  history: TradeRecord[];
  addFunds: (amount: number) => void;
  withdrawFunds: (amount: number) => boolean;
  placeOrder: (input: PlaceOrderInput) => { kind: 'position' | 'order'; id: string };
  closePosition: (id: string) => void;
  cancelOrder: (id: string) => void;
  positionPnl: (position: Position) => number;
  profile: UserProfile;
  updateProfile: (changes: Partial<UserProfile>) => void;
  settings: ExchangeSettings;
  updateSetting: <K extends keyof ExchangeSettings>(key: K, value: ExchangeSettings[K]) => void;
}

const initialSettings: ExchangeSettings = {
  interfaceMode: 'basic', appearance: 'Dark', language: 'English', currency: 'USD',
  colorPreference: 'Green up / Red down', defaultOrderType: 'market', defaultLeverage: 5,
  confirmOrders: true, attachRiskControls: true, pushNotifications: true, appLock: false,
  biometrics: false, autoLock: 'After 5 minutes', refreshRate: 'Live',
};

const initialProfile: UserProfile = {
  displayName: 'Sylva', uid: '248 731 905', email: 'syl***@****', phone: 'Not added', verified: true,
};

const referenceFor = (symbol: string) => MARKETS.find((market) => market.symbol === symbol)!.reference;

const initialPositions: Position[] = [
  { id: 'P-RMD-01', symbol: 'RMD', side: 'long', size: 1880, entryPrice: referenceFor('RMD') * 0.995, leverage: 5, margin: 376, openedAt: Date.now() - 2_820_000 },
  { id: 'P-FCB-01', symbol: 'FCB', side: 'long', size: 1320, entryPrice: referenceFor('FCB') * 1.003, leverage: 3, margin: 440, openedAt: Date.now() - 6_420_000 },
];

const initialOrders: OpenOrder[] = [
  { id: 'O-LIV-01', symbol: 'LIV', side: 'long', type: 'limit', size: 900, targetPrice: referenceFor('LIV') * 0.99, leverage: 3, createdAt: Date.now() - 740_000 },
];

const initialHistory: TradeRecord[] = [
  { id: 'H-MBP-01', symbol: 'MBP', side: 'short', event: 'closed', orderType: 'market', size: 780, leverage: 3, entryPrice: referenceFor('MBP') * 1.01, exitPrice: referenceFor('MBP'), fee: 0.47, pnl: 780 * (1 - 1 / 1.01), openedAt: Date.now() - 91_800_000, createdAt: Date.now() - 86_400_000 },
  { id: 'H-HLD-01', symbol: 'HLD', side: 'long', event: 'filled', orderType: 'limit', size: 620, leverage: 2, entryPrice: referenceFor('HLD'), fee: 0.31, openedAt: Date.now() - 172_800_000, createdAt: Date.now() - 172_800_000 },
];

const ExchangeContext = createContext<ExchangeContextValue | null>(null);
const MARKET_LOOKUP = new Map(ALL_MARKETS.map((market) => [market.symbol, market]));

export function ExchangeProvider({ children }: PropsWithChildren) {
  const { setMode } = useTheme();
  const [quotes, setQuotes] = useState<Record<string, number>>(() => Object.fromEntries(MARKETS.map((market) => [market.symbol, market.price])));
  const [activeSymbol, setActiveSymbolState] = useState('RMD');
  const [favorites, setFavorites] = useState(() => new Set<string>());
  const [alerts, setAlerts] = useState(() => new Set(['FCB']));
  const [cashBalance, setCashBalance] = useState(9840.32);
  const [positions, setPositions] = useState<Position[]>(initialPositions);
  const [orders, setOrders] = useState<OpenOrder[]>(initialOrders);
  const [history, setHistory] = useState<TradeRecord[]>(initialHistory);
  const [profile, setProfile] = useState(initialProfile);
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
        return [market.symbol, Math.min(market.upperBand, Math.max(market.lowerBand, market.price * 0.999, Math.min(market.price * 1.001, previous * (1 + wave + drift))))];
      })));
    }, settings.refreshRate === 'Every 15 seconds' ? 15_000 : settings.refreshRate === 'Every 5 seconds' ? 5_000 : 2_400);
    return () => clearInterval(interval);
  }, [settings.refreshRate]);

  const setActiveSymbol = useCallback((symbol: string) => { if (MARKET_LOOKUP.has(symbol)) setActiveSymbolState(symbol); }, []);
  const marketFor = useCallback((symbol: string) => MARKET_LOOKUP.get(symbol), []);
  const priceFor = useCallback((symbol: string) => {
 const market = MARKET_LOOKUP.get(symbol);
 if (market?.pairLegs) { const [left, right] = market.pairLegs; return ((quotes[left] ?? MARKET_LOOKUP.get(left)!.price) / (quotes[right] ?? MARKET_LOOKUP.get(right)!.price)) * 1000; }
 return quotes[symbol] ?? market?.price ?? 0;
 }, [quotes]);
  const changeFor = useCallback((symbol: string) => {
    const market = MARKET_LOOKUP.get(symbol);
    return market ? (priceFor(symbol) / (market.price / (1 + market.change24h / 100)) - 1) * 100 : 0;
  }, [priceFor]);
  const seriesFor = useCallback((symbol: string, range: ChartRange = '1D') => {
    const market = MARKET_LOOKUP.get(symbol);
    if (!market) return [];
 if (market.pairLegs) { const left = MARKET_LOOKUP.get(market.pairLegs[0])!; const right = MARKET_LOOKUP.get(market.pairLegs[1])!; const x = makeSeries({ ...left, change24h: changeFor(left.symbol) }, range, priceFor(left.symbol)); const y = makeSeries({ ...right, change24h: changeFor(right.symbol) }, range, priceFor(right.symbol)); return x.map((value,index) => value / y[index]! * 1000); }
 return makeSeries({ ...market, change24h: changeFor(symbol) }, range, priceFor(symbol));
  }, [priceFor, changeFor]);
  const candlesFor = useCallback((symbol: string, range: ChartRange = '15m') => {
    const market = MARKET_LOOKUP.get(symbol);
    return market ? makeCandles({ ...market, change24h: changeFor(symbol) }, range, priceFor(symbol), seriesFor(symbol, range)) : [];
  }, [priceFor, changeFor, seriesFor]);

  const toggleFavorite = useCallback((symbol: string) => setFavorites((current) => {
    const next = new Set(current); if (next.has(symbol)) next.delete(symbol); else next.add(symbol); return next;
  }), []);
  const toggleAlert = useCallback((symbol: string) => setAlerts((current) => {
    const next = new Set(current); if (next.has(symbol)) next.delete(symbol); else next.add(symbol); return next;
  }), []);

  const positionPnl = useCallback((position: Position) => {
    const direction = position.side === 'long' ? 1 : -1;
    return ((priceFor(position.symbol) - position.entryPrice) / position.entryPrice) * position.size * direction;
  }, [priceFor]);
  const unrealizedPnl = useMemo(() => positions.reduce((total, position) => total + positionPnl(position), 0), [positionPnl, positions]);
  const usedMargin = useMemo(() => positions.reduce((total, position) => total + position.margin, 0), [positions]);
  const totalEquity = cashBalance + usedMargin + unrealizedPnl;

  const addFunds = useCallback((amount: number) => { if (Number.isFinite(amount) && amount > 0) setCashBalance((current) => current + amount); }, []);
  const withdrawFunds = useCallback((amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0 || amount > cashBalance) return false;
    setCashBalance((current) => current - amount); return true;
  }, [cashBalance]);

  const placeOrder = useCallback((input: PlaceOrderInput) => {
    const price = priceFor(input.symbol);
    const market = MARKET_LOOKUP.get(input.symbol);
    if (!market || !Number.isFinite(input.amount) || !Number.isFinite(input.leverage) || input.amount <= 0 || input.leverage <= 0 || input.amount > cashBalance) throw new Error('Invalid order or insufficient balance');
    const target = input.type === 'market' ? price : input.targetPrice ?? price;
    if (!Number.isFinite(target) || target < market.lowerBand || target > market.upperBand) throw new Error('Order must be inside the active band');
    const now = Date.now(); const id = `${now}-${idRef.current++}`; const exposure = input.amount * input.leverage;
    if (input.type === 'market') {
      const position: Position = { id: `P-${id}`, symbol: input.symbol, side: input.side, size: exposure, entryPrice: price, leverage: input.leverage, margin: input.amount, openedAt: now };
      setPositions((current) => [position, ...current]); setCashBalance((current) => Math.max(0, current - input.amount));
      setHistory((current) => [{ id: `H-${id}`, symbol: input.symbol, side: input.side, event: 'opened', orderType: input.type, size: exposure, leverage: input.leverage, entryPrice: price, fee: exposure * 0.0006, openedAt: now, createdAt: now }, ...current]);
      return { kind: 'position' as const, id: position.id };
    }
    const order: OpenOrder = { id: `O-${id}`, symbol: input.symbol, side: input.side, type: input.type, size: exposure, targetPrice: input.targetPrice || price, leverage: input.leverage, createdAt: now };
    setOrders((current) => [order, ...current]);
    return { kind: 'order' as const, id: order.id };
  }, [cashBalance, priceFor]);

  const closePosition = useCallback((id: string) => setPositions((current) => {
    const position = current.find((item) => item.id === id); if (!position) return current;
    const pnl = positionPnl(position); const now = Date.now(); const exitPrice = priceFor(position.symbol);
    setCashBalance((cash) => cash + position.margin + pnl);
    setHistory((records) => [{ id: `H-CLOSE-${now}`, symbol: position.symbol, side: position.side, event: 'closed', orderType: 'market', size: position.size, leverage: position.leverage, entryPrice: position.entryPrice, exitPrice, fee: position.size * 0.0006, pnl, openedAt: position.openedAt, createdAt: now }, ...records]);
    return current.filter((item) => item.id !== id);
  }), [positionPnl, priceFor]);

  const cancelOrder = useCallback((id: string) => setOrders((current) => {
    const order = current.find((item) => item.id === id); if (!order) return current; const now = Date.now();
    setHistory((records) => [{ id: `H-CANCEL-${now}`, symbol: order.symbol, side: order.side, event: 'cancelled', orderType: order.type, size: order.size, leverage: order.leverage, entryPrice: order.targetPrice, fee: 0, openedAt: order.createdAt, createdAt: now }, ...records]);
    return current.filter((item) => item.id !== id);
  }), []);

  const updateProfile = useCallback((changes: Partial<UserProfile>) => setProfile((current) => ({ ...current, ...changes })), []);
  const updateSetting = useCallback(<K extends keyof ExchangeSettings,>(key: K, value: ExchangeSettings[K]) => {
    if (key === 'appearance') setMode(value as ThemeMode);
    setSettings((current) => ({ ...current, [key]: value }));
  }, [setMode]);

  const value = useMemo<ExchangeContextValue>(() => ({
    markets: MARKETS, pairMarkets: PAIR_MARKETS, activeSymbol, setActiveSymbol, favorites, alerts, toggleFavorite, toggleAlert,
    priceFor, changeFor, seriesFor, candlesFor, marketFor, cashBalance, usedMargin, totalEquity,
    unrealizedPnl, positions, orders, history, addFunds, withdrawFunds, placeOrder, closePosition,
    cancelOrder, positionPnl, profile, updateProfile, settings, updateSetting,
  }), [activeSymbol, addFunds, alerts, cancelOrder, candlesFor, cashBalance, changeFor, closePosition, favorites, history, marketFor, orders, placeOrder, positionPnl, positions, priceFor, profile, seriesFor, setActiveSymbol, settings, toggleAlert, toggleFavorite, totalEquity, unrealizedPnl, updateProfile, updateSetting, usedMargin, withdrawFunds]);

  return <ExchangeContext.Provider value={value}>{children}</ExchangeContext.Provider>;
}

export function useExchange() {
  const context = useContext(ExchangeContext);
  if (!context) throw new Error('useExchange must be used inside ExchangeProvider');
  return context;
}
