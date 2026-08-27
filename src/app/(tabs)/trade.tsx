import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MarketAvatar } from '@/components/market/market-avatar';
import { MarketChart } from '@/components/market/market-chart';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { OrderBook } from '@/components/trade/order-book';
import { OrderReviewSheet } from '@/components/trade/order-review-sheet';
import { PairSelectorSheet } from '@/components/trade/pair-selector-sheet';
import { useExchange } from '@/context/exchange-context';
import { formatMoney, formatPercent, formatPrice } from '@/lib/format';
import { colors, typography } from '@/theme/tokens';
import type { OrderType, Side } from '@/types/exchange';

type ChartFrame = '1m' | '5m' | '15m' | '1H' | '4H';
const FRAMES: ChartFrame[] = ['1m', '5m', '15m', '1H', '4H'];
const ORDER_TYPES: OrderType[] = ['market', 'limit', 'stop'];
const PERCENTAGES = [25, 50, 75, 100];

export default function TradeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ symbol?: string; side?: Side }>();
  const {
    activeSymbol,
    setActiveSymbol,
    marketFor,
    priceFor,
    changeFor,
    seriesFor,
    cashBalance,
    positions,
    orders,
    settings,
    placeOrder,
  } = useExchange();
  const [pairOpen, setPairOpen] = useState(false);
  const [frame, setFrame] = useState<ChartFrame>('15m');
  const [orderType, setOrderType] = useState<OrderType>(settings.defaultOrderType);
  const [amount, setAmount] = useState('100');
  const [targetPrice, setTargetPrice] = useState('');
  const [leverage, setLeverage] = useState(settings.defaultLeverage);
  const [riskControls, setRiskControls] = useState(settings.attachRiskControls);
  const [takeProfit, setTakeProfit] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [reviewSide, setReviewSide] = useState<Side | null>(null);
  const [completed, setCompleted] = useState<'position' | 'order' | null>(null);

  useEffect(() => {
    if (typeof params.symbol === 'string') setActiveSymbol(params.symbol);
  }, [params.symbol, setActiveSymbol]);

  useEffect(() => {
    setTargetPrice(formatPrice(priceFor(activeSymbol)));
  }, [activeSymbol, priceFor]);

  const market = marketFor(activeSymbol) ?? marketFor('RMD');
  const price = priceFor(activeSymbol);
  const change = changeFor(activeSymbol);
  const numericAmount = Number(amount) || 0;
  const numericTarget = Number(targetPrice.replace(/,/g, '')) || price;
  const canSubmit = numericAmount > 0 && numericAmount <= cashBalance;
  const exposure = numericAmount * leverage;
  const advanced = settings.interfaceMode === 'advanced';
  const series = useMemo(() => {
    const values = seriesFor(activeSymbol);
    const multiplier = frame === '1m' ? 0.18 : frame === '5m' ? 0.34 : frame === '15m' ? 0.58 : frame === '1H' ? 1 : 1.48;
    const end = values.at(-1) ?? 0;
    return values.map((value) => end + (value - end) * multiplier);
  }, [activeSymbol, frame, seriesFor]);

  if (!market) return null;

  const requestOrder = (side: Side) => {
    if (!canSubmit) return;
    if (settings.confirmOrders) {
      setReviewSide(side);
    } else {
      executeOrder(side);
    }
  };

  const executeOrder = (side: Side) => {
    const result = placeOrder({
      symbol: activeSymbol,
      side,
      type: advanced ? orderType : 'market',
      amount: numericAmount,
      leverage,
      targetPrice: numericTarget,
    });
    setReviewSide(null);
    setCompleted(result.kind);
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Pressable onPress={() => setPairOpen(true)} style={styles.pair}>
              <MarketAvatar assetKey={market.assetKey} size={34} symbol={market.symbol} />
              <View style={styles.pairCopy}>
                <View style={styles.pairLine}><Text style={styles.symbol}>{market.symbol}/POINT</Text><Icon color={colors.textMuted} name="chevron" size={15} /></View>
                <Text style={styles.marketName}>{market.name}</Text>
              </View>
            </Pressable>
            <Pressable onPress={() => router.push('/settings/trading')} style={styles.interfaceLink}>
              <Text style={styles.interfaceText}>{advanced ? 'Advanced' : 'Basic'}</Text>
              <Icon color={colors.textMuted} name="chevron" size={15} />
            </Pressable>
          </View>

          <View style={styles.quoteRow}>
            <View>
              <Text style={styles.price}>{formatPrice(price)}</Text>
              <Text style={[styles.change, { color: change >= 0 ? colors.positive : colors.negative }]}>{formatPercent(change)}</Text>
            </View>
            <View style={styles.quoteStats}>
              <Text style={styles.quoteLabel}>24h high <Text style={styles.quoteValue}>{formatPrice(market.high24h)}</Text></Text>
              <Text style={styles.quoteLabel}>24h low  <Text style={styles.quoteValue}>{formatPrice(market.low24h)}</Text></Text>
            </View>
          </View>

          <MarketChart candles={advanced} height={advanced ? 214 : 178} positive={change >= 0} series={series} />
          <View style={styles.frames}>
            {FRAMES.map((item) => (
              <Pressable key={item} onPress={() => setFrame(item)} style={styles.frame}>
                <Text style={[styles.frameText, frame === item && styles.frameActive]}>{item}</Text>
              </Pressable>
            ))}
            <Pressable onPress={() => router.push({ pathname: '/market/[symbol]', params: { symbol: market.symbol } })} style={styles.frame}><Icon color={colors.textMuted} name="more" size={17} /></Pressable>
          </View>

          {advanced ? (
            <View style={styles.bookSection}>
              <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Order book</Text><Text style={styles.tickSize}>0.10 tick</Text></View>
              <OrderBook compact price={price} />
            </View>
          ) : null}

          <View style={styles.ticket}>
            {advanced ? (
              <View style={styles.orderTypes}>
                {ORDER_TYPES.map((type) => (
                  <Pressable key={type} onPress={() => setOrderType(type)} style={styles.orderType}>
                    <Text style={[styles.orderTypeText, orderType === type && styles.orderTypeActive]}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                    {orderType === type ? <View style={styles.orderTypeLine} /> : null}
                  </Pressable>
                ))}
              </View>
            ) : <Text style={styles.ticketTitle}>Open position</Text>}

            <View style={styles.marginRow}>
              <Text style={styles.marginMode}>Cross margin</Text>
              <View style={styles.leverageControl}>
                <Pressable accessibilityLabel="Decrease leverage" disabled={leverage <= 1} onPress={() => setLeverage((value) => Math.max(1, value - 1))} style={styles.leverageButton}><Text style={styles.leverageButtonText}>−</Text></Pressable>
                <Text style={styles.leverageValue}>{leverage}x</Text>
                <Pressable accessibilityLabel="Increase leverage" disabled={leverage >= 20} onPress={() => setLeverage((value) => Math.min(20, value + 1))} style={styles.leverageButton}><Text style={styles.leverageButtonText}>+</Text></Pressable>
              </View>
            </View>

            {advanced && orderType !== 'market' ? (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>{orderType === 'limit' ? 'Limit price' : 'Trigger price'}</Text>
                <View style={styles.inputRow}><TextInput keyboardType="decimal-pad" onChangeText={setTargetPrice} selectionColor={colors.accent} style={styles.input} value={targetPrice} /><Text style={styles.inputUnit}>POINT</Text></View>
              </View>
            ) : null}

            <View style={styles.field}>
              <View style={styles.fieldHeading}><Text style={styles.fieldLabel}>Margin</Text><Text style={styles.available}>Available {formatMoney(cashBalance, settings.currency)}</Text></View>
              <View style={[styles.inputRow, !canSubmit && numericAmount > 0 && styles.inputError]}>
                <TextInput keyboardType="decimal-pad" onChangeText={setAmount} placeholder="0.00" placeholderTextColor={colors.textFaint} selectionColor={colors.accent} style={styles.input} value={amount} />
                <Text style={styles.inputUnit}>{settings.currency}</Text>
              </View>
              {!canSubmit && numericAmount > 0 ? <Text style={styles.error}>Amount exceeds available balance</Text> : null}
            </View>

            <View style={styles.percentages}>
              {PERCENTAGES.map((percent) => (
                <Pressable key={percent} onPress={() => setAmount((cashBalance * percent / 100).toFixed(2))} style={({ pressed }) => [styles.percentage, pressed && styles.pressed]}>
                  <Text style={styles.percentageText}>{percent}%</Text>
                </Pressable>
              ))}
            </View>

            <Pressable onPress={() => setRiskControls((value) => !value)} style={styles.riskToggle}>
              <View style={[styles.checkbox, riskControls && styles.checkboxActive]}>{riskControls ? <Icon color={colors.bg} name="check" size={13} /> : null}</View>
              <Text style={styles.riskToggleText}>Take profit / Stop loss</Text>
            </Pressable>
            {riskControls ? (
              <View style={styles.riskFields}>
                <View style={[styles.field, styles.riskField]}><Text style={styles.fieldLabel}>Take profit</Text><View style={styles.inputRow}><TextInput keyboardType="decimal-pad" onChangeText={setTakeProfit} placeholder="Optional" placeholderTextColor={colors.textFaint} selectionColor={colors.accent} style={styles.smallInput} value={takeProfit} /><Text style={styles.inputUnit}>POINT</Text></View></View>
                <View style={[styles.field, styles.riskField]}><Text style={styles.fieldLabel}>Stop loss</Text><View style={styles.inputRow}><TextInput keyboardType="decimal-pad" onChangeText={setStopLoss} placeholder="Optional" placeholderTextColor={colors.textFaint} selectionColor={colors.accent} style={styles.smallInput} value={stopLoss} /><Text style={styles.inputUnit}>POINT</Text></View></View>
              </View>
            ) : null}

            <View style={styles.exposureRow}><Text style={styles.exposureLabel}>Position exposure</Text><Text style={styles.exposureValue}>{formatMoney(exposure, settings.currency)}</Text></View>
            <View style={styles.tradeButtons}>
              <Pressable disabled={!canSubmit} onPress={() => requestOrder('short')} style={({ pressed }) => [styles.tradeButton, styles.short, !canSubmit && styles.disabled, pressed && styles.pressed]}><Text style={styles.tradeButtonText}>Short</Text></Pressable>
              <Pressable disabled={!canSubmit} onPress={() => requestOrder('long')} style={({ pressed }) => [styles.tradeButton, styles.long, !canSubmit && styles.disabled, pressed && styles.pressed]}><Text style={styles.tradeButtonText}>Long</Text></Pressable>
            </View>
          </View>

          <Pressable onPress={() => router.push('/(tabs)/portfolio')} style={styles.activity}>
            <View><Text style={styles.activityTitle}>Your activity</Text><Text style={styles.activityMeta}>{positions.length} positions · {orders.length} open orders</Text></View>
            <Icon color={colors.textMuted} name="chevron" size={17} />
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <PairSelectorSheet onClose={() => setPairOpen(false)} onSelect={setActiveSymbol} visible={pairOpen} />
      <OrderReviewSheet
        amount={numericAmount}
        currency={settings.currency}
        leverage={leverage}
        onClose={() => setReviewSide(null)}
        onConfirm={() => reviewSide && executeOrder(reviewSide)}
        price={price}
        side={reviewSide ?? 'long'}
        symbol={market.symbol}
        targetPrice={numericTarget}
        type={advanced ? orderType : 'market'}
        visible={reviewSide !== null}
      />
      <BottomSheet onClose={() => setCompleted(null)} title={completed === 'position' ? 'Position opened' : 'Order submitted'} visible={completed !== null}>
        <View style={styles.complete}>
          <View style={styles.completeIcon}><Icon color={colors.positive} name="check" size={30} /></View>
          <Text style={styles.completeTitle}>{market.symbol}/POINT</Text>
          <Text style={styles.completeCopy}>{completed === 'position' ? 'Your position is now active.' : 'Your order is waiting for its target price.'}</Text>
          <Pressable onPress={() => { setCompleted(null); router.push('/(tabs)/portfolio'); }} style={styles.portfolioButton}><Text style={styles.portfolioButtonText}>View portfolio</Text></Pressable>
        </View>
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingBottom: 22 },
  header: { alignItems: 'center', borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', minHeight: 58, paddingHorizontal: 16 },
  pair: { alignItems: 'center', flexDirection: 'row', flex: 1 },
  pairCopy: { marginLeft: 10 },
  pairLine: { alignItems: 'center', flexDirection: 'row' },
  symbol: { color: colors.text, fontSize: 14, fontWeight: '800' },
  marketName: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  interfaceLink: { alignItems: 'center', flexDirection: 'row', gap: 2, minHeight: 40 },
  interfaceText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  quoteRow: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 18 },
  price: { color: colors.text, fontFamily: typography.mono, fontSize: 25, fontWeight: '700', letterSpacing: -0.5 },
  change: { fontFamily: typography.mono, fontSize: 11, fontWeight: '700', marginTop: 4 },
  quoteStats: { alignItems: 'flex-end', gap: 6 },
  quoteLabel: { color: colors.textFaint, fontSize: 9 },
  quoteValue: { color: colors.textMuted, fontFamily: typography.mono },
  frames: { borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 8 },
  frame: { alignItems: 'center', justifyContent: 'center', minHeight: 37, minWidth: 42 },
  frameText: { color: colors.textMuted, fontSize: 10, fontWeight: '600' },
  frameActive: { color: colors.accent },
  bookSection: { borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingVertical: 14 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  sectionTitle: { color: colors.text, fontSize: 13, fontWeight: '700' },
  tickSize: { color: colors.textFaint, fontSize: 9 },
  ticket: { paddingHorizontal: 16, paddingTop: 18 },
  ticketTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginBottom: 16 },
  orderTypes: { borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', marginBottom: 18 },
  orderType: { marginRight: 27, paddingBottom: 10 },
  orderTypeText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  orderTypeActive: { color: colors.text },
  orderTypeLine: { backgroundColor: colors.accent, bottom: 0, height: 2, left: 0, position: 'absolute', right: 0 },
  marginRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  marginMode: { color: colors.textMuted, fontSize: 12 },
  leverageControl: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 4, flexDirection: 'row', height: 34 },
  leverageButton: { alignItems: 'center', height: 34, justifyContent: 'center', width: 36 },
  leverageButtonText: { color: colors.text, fontSize: 18 },
  leverageValue: { color: colors.text, fontFamily: typography.mono, fontSize: 12, fontWeight: '700', minWidth: 36, textAlign: 'center' },
  field: { marginBottom: 16 },
  fieldHeading: { flexDirection: 'row', justifyContent: 'space-between' },
  fieldLabel: { color: colors.textMuted, fontSize: 11, marginBottom: 7 },
  available: { color: colors.textFaint, fontSize: 10 },
  inputRow: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.divider, borderRadius: 4, borderWidth: 1, flexDirection: 'row', height: 48, paddingHorizontal: 12 },
  inputError: { borderColor: colors.negative },
  input: { color: colors.text, flex: 1, fontFamily: typography.mono, fontSize: 16, fontWeight: '600', padding: 0 },
  smallInput: { color: colors.text, flex: 1, fontFamily: typography.mono, fontSize: 12, padding: 0 },
  inputUnit: { color: colors.textMuted, fontSize: 10, fontWeight: '700' },
  error: { color: colors.negative, fontSize: 10, marginTop: 6 },
  percentages: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  percentage: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 4, flex: 1, height: 34, justifyContent: 'center' },
  percentageText: { color: colors.textMuted, fontSize: 10, fontWeight: '700' },
  riskToggle: { alignItems: 'center', flexDirection: 'row', minHeight: 36 },
  checkbox: { alignItems: 'center', borderColor: colors.textFaint, borderRadius: 3, borderWidth: 1, height: 18, justifyContent: 'center', marginRight: 9, width: 18 },
  checkboxActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  riskToggleText: { color: colors.text, fontSize: 12, fontWeight: '600' },
  riskFields: { flexDirection: 'row', gap: 10, marginTop: 9 },
  riskField: { flex: 1 },
  exposureRow: { borderTopColor: colors.divider, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, paddingTop: 15 },
  exposureLabel: { color: colors.textMuted, fontSize: 11 },
  exposureValue: { color: colors.text, fontFamily: typography.mono, fontSize: 12, fontWeight: '700' },
  tradeButtons: { flexDirection: 'row', gap: 10, marginTop: 17 },
  tradeButton: { alignItems: 'center', borderRadius: 6, flex: 1, justifyContent: 'center', minHeight: 50 },
  long: { backgroundColor: colors.positive },
  short: { backgroundColor: colors.negative },
  disabled: { opacity: 0.35 },
  tradeButtonText: { color: colors.white, fontSize: 15, fontWeight: '800' },
  activity: { alignItems: 'center', borderTopColor: colors.divider, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, minHeight: 62, paddingHorizontal: 16 },
  activityTitle: { color: colors.text, fontSize: 13, fontWeight: '700' },
  activityMeta: { color: colors.textMuted, fontSize: 10, marginTop: 4 },
  complete: { alignItems: 'center', paddingBottom: 4, paddingTop: 10 },
  completeIcon: { alignItems: 'center', borderColor: colors.positive, borderRadius: 30, borderWidth: 1, height: 58, justifyContent: 'center', width: 58 },
  completeTitle: { color: colors.text, fontSize: 18, fontWeight: '800', marginTop: 15 },
  completeCopy: { color: colors.textMuted, fontSize: 12, marginTop: 6 },
  portfolioButton: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: 6, justifyContent: 'center', marginTop: 22, minHeight: 50, width: '100%' },
  portfolioButtonText: { color: colors.bg, fontSize: 14, fontWeight: '800' },
  pressed: { opacity: 0.7 },
});
