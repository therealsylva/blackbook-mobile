import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MarketAvatar } from '@/components/market/market-avatar';
import { MarketChart } from '@/components/market/market-chart';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { ChoiceSheet } from '@/components/ui/choice-sheet';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { OrderBook } from '@/components/trade/order-book';
import { OrderReviewSheet } from '@/components/trade/order-review-sheet';
import { PairSelectorSheet } from '@/components/trade/pair-selector-sheet';
import { useExchange } from '@/context/exchange-context';
import { formatMoney, formatPercent, formatPrice } from '@/lib/format';
import { colors, radii, spacing, typography } from '@/theme/tokens';
import type { InterfaceMode, OrderType, Side } from '@/types/exchange';

type ChartFrame = '1m' | '5m' | '15m' | '1H' | '4H' | '1D';
type AdvancedPanel = 'Chart' | 'Order book';

const FRAMES: ChartFrame[] = ['1m', '5m', '15m', '1H', '4H', '1D'];
const ORDER_TYPES: OrderType[] = ['market', 'limit', 'stop'];
const LEVERAGE_PRESETS = [1, 5, 10, 20];
const PERCENTAGES = [25, 50, 75, 100];

export default function TradeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ symbol?: string; side?: Side; mode?: 'advanced'; panel?: 'book' }>();
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
    updateSetting,
    placeOrder,
  } = useExchange();
  const [pairOpen, setPairOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const [advancedPanel, setAdvancedPanel] = useState<AdvancedPanel>('Chart');
  const [frame, setFrame] = useState<ChartFrame>('15m');
  const [orderType, setOrderType] = useState<OrderType>(settings.defaultOrderType);
  const [amount, setAmount] = useState('100');
  const [targetPrice, setTargetPrice] = useState('');
  const [leverage, setLeverage] = useState(settings.defaultLeverage);
  const [riskControls, setRiskControls] = useState(settings.attachRiskControls);
  const [reduceOnly, setReduceOnly] = useState(false);
  const [takeProfit, setTakeProfit] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [reviewSide, setReviewSide] = useState<Side | null>(null);
  const [completed, setCompleted] = useState<'position' | 'order' | null>(null);

  useEffect(() => {
    if (typeof params.symbol === 'string') setActiveSymbol(params.symbol);
  }, [params.symbol, setActiveSymbol]);

  useEffect(() => {
    const nextMarket = marketFor(activeSymbol);
    if (nextMarket) setTargetPrice(formatPrice(nextMarket.price));
  }, [activeSymbol, marketFor]);

  useEffect(() => {
    if (params.panel === 'book') setAdvancedPanel('Order book');
  }, [params.panel]);

  useEffect(() => {
    setOrderType(settings.defaultOrderType);
    setLeverage(settings.defaultLeverage);
    setRiskControls(settings.attachRiskControls);
  }, [settings.attachRiskControls, settings.defaultLeverage, settings.defaultOrderType]);

  const market = marketFor(activeSymbol) ?? marketFor('RMD');
  const price = priceFor(activeSymbol);
  const change = changeFor(activeSymbol);
  const numericAmount = Number(amount) || 0;
  const numericTarget = Number(targetPrice.replace(/,/g, '')) || price;
  const canSubmit = numericAmount > 0 && numericAmount <= cashBalance;
  const exposure = numericAmount * leverage;
  const liquidation = price * (1 - 0.9 / Math.max(leverage, 1));
  const fee = exposure * 0.0006;
  const advanced = params.mode === 'advanced' || settings.interfaceMode === 'advanced';

  const series = useMemo(() => {
    const values = seriesFor(activeSymbol);
    const multiplier = frame === '1m' ? 0.18 : frame === '5m' ? 0.34 : frame === '15m' ? 0.58 : frame === '1H' ? 1 : frame === '4H' ? 1.48 : 1.9;
    const end = values.at(-1) ?? 0;
    return values.map((value) => end + (value - end) * multiplier);
  }, [activeSymbol, frame, seriesFor]);

  if (!market) return null;

  const requestOrder = (side: Side) => {
    if (!canSubmit) return;
    if (settings.confirmOrders) setReviewSide(side);
    else executeOrder(side);
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

  const selectMode = (mode: InterfaceMode) => {
    updateSetting('interfaceMode', mode);
    router.replace('/(tabs)/trade');
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Pressable accessibilityLabel="Choose index" onPress={() => setPairOpen(true)} style={styles.pair}>
              <MarketAvatar assetKey={market.assetKey} size={42} symbol={market.symbol} />
              <View style={styles.pairCopy}>
                <View style={styles.pairLine}><Text style={styles.symbol}>{market.symbol} / POINT</Text><Icon color={colors.textMuted} name="chevron" size={15} /></View>
                <Text style={styles.marketName}>{market.name}</Text>
              </View>
            </Pressable>
            <Pressable accessibilityLabel="Change trading interface" onPress={() => setModeOpen(true)} style={styles.interfaceLink}>
              <Text style={styles.interfaceText}>{advanced ? 'Advanced' : 'Basic'}</Text>
              <Icon color={colors.textMuted} name="chevron" size={16} />
            </Pressable>
          </View>

          <View style={styles.quoteRow}>
            <View>
              <Text style={styles.price}>{formatPrice(price)}</Text>
              <Text style={[styles.change, { color: change >= 0 ? colors.positive : colors.negative }]}>{formatPercent(change)} today</Text>
            </View>
            <View style={styles.quoteStats}>
              <Text style={styles.quoteLabel}>24h high  <Text style={styles.quoteValue}>{formatPrice(market.high24h)}</Text></Text>
              <Text style={styles.quoteLabel}>24h low   <Text style={styles.quoteValue}>{formatPrice(market.low24h)}</Text></Text>
            </View>
          </View>

          {advanced ? (
            <View style={styles.advancedMarket}>
              <View style={styles.panelTabs}>
                {(['Chart', 'Order book'] as AdvancedPanel[]).map((panel) => (
                  <Pressable accessibilityRole="tab" accessibilityState={{ selected: panel === advancedPanel }} key={panel} onPress={() => setAdvancedPanel(panel)} style={styles.panelTab}>
                    <Text style={[styles.panelTabText, panel === advancedPanel && styles.panelTabActive]}>{panel}</Text>
                    {panel === advancedPanel ? <View style={styles.panelTabLine} /> : null}
                  </Pressable>
                ))}
                <Text style={styles.tickSize}>0.10 tick</Text>
              </View>
              {advancedPanel === 'Chart' ? (
                <>
                  <MarketChart candles height={188} positive={change >= 0} series={series} />
                  <Timeframes frame={frame} onChange={setFrame} />
                </>
              ) : (
                <View style={styles.book}><OrderBook price={price} /></View>
              )}
            </View>
          ) : (
            <>
              <View style={styles.basicChart}><MarketChart height={214} positive={change >= 0} series={series} /></View>
              <Timeframes frame={frame} onChange={setFrame} />
            </>
          )}

          <View style={[styles.ticket, advanced && styles.advancedTicket]}>
            {advanced ? (
              <View style={styles.orderTypes}>
                {ORDER_TYPES.map((type) => (
                  <Pressable accessibilityRole="tab" accessibilityState={{ selected: orderType === type }} key={type} onPress={() => setOrderType(type)} style={styles.orderType}>
                    <Text style={[styles.orderTypeText, orderType === type && styles.orderTypeActive]}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                    {orderType === type ? <View style={styles.orderTypeLine} /> : null}
                  </Pressable>
                ))}
              </View>
            ) : <Text style={styles.ticketTitle}>Open position</Text>}

            {advanced && orderType !== 'market' ? (
              <Field label={orderType === 'limit' ? 'Limit price' : 'Trigger price'}>
                <TextInput accessibilityLabel={orderType === 'limit' ? 'Limit price' : 'Trigger price'} keyboardType="decimal-pad" onChangeText={setTargetPrice} selectionColor={colors.text} style={styles.input} value={targetPrice} />
                <Text style={styles.inputUnit}>POINT</Text>
              </Field>
            ) : null}

            <View style={styles.field}>
              <View style={styles.fieldHeading}><Text style={styles.fieldLabel}>{advanced ? 'Margin' : 'Amount'}</Text><Text style={styles.available}>Available {formatMoney(cashBalance, settings.currency)}</Text></View>
              <View style={[styles.inputRow, !canSubmit && numericAmount > 0 && styles.inputError]}>
                <TextInput accessibilityLabel="Order amount" keyboardType="decimal-pad" onChangeText={setAmount} placeholder="0.00" placeholderTextColor={colors.textFaint} selectionColor={colors.text} style={styles.input} value={amount} />
                <Text style={styles.inputUnit}>{settings.currency}</Text>
              </View>
              {!canSubmit && numericAmount > 0 ? <Text style={styles.error}>Amount exceeds available balance</Text> : null}
            </View>

            {advanced ? (
              <View style={styles.percentages}>
                {PERCENTAGES.map((percent) => (
                  <Pressable key={percent} onPress={() => setAmount((cashBalance * percent / 100).toFixed(2))} style={({ pressed }) => [styles.percentage, pressed && styles.pressed]}>
                    <Text style={styles.percentageText}>{percent}%</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            <View style={styles.leverageRow}>
              <Text style={styles.fieldLabel}>Leverage</Text>
              {advanced ? (
                <View style={styles.leverageControl}>
                  <Pressable accessibilityLabel="Decrease leverage" disabled={leverage <= 1} onPress={() => setLeverage((value) => Math.max(1, value - 1))} style={styles.leverageButton}><Text style={styles.leverageButtonText}>−</Text></Pressable>
                  <Text style={styles.leverageValue}>{leverage}x</Text>
                  <Pressable accessibilityLabel="Increase leverage" disabled={leverage >= 20} onPress={() => setLeverage((value) => Math.min(20, value + 1))} style={styles.leverageButton}><Text style={styles.leverageButtonText}>+</Text></Pressable>
                </View>
              ) : (
                <View style={styles.leveragePresets}>
                  {LEVERAGE_PRESETS.map((value) => (
                    <Pressable accessibilityState={{ selected: leverage === value }} key={value} onPress={() => setLeverage(value)} style={[styles.leveragePreset, leverage === value && styles.leveragePresetActive]}>
                      <Text style={[styles.leveragePresetText, leverage === value && styles.leveragePresetTextActive]}>{value}x</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.orderSummary}>
              <SummaryMetric label="Exposure" value={formatMoney(exposure, settings.currency)} />
              <SummaryMetric label="Est. liquidation" value={formatPrice(liquidation)} />
              <SummaryMetric label="Fee" value={formatMoney(fee, settings.currency)} />
            </View>

            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: riskControls }} onPress={() => setRiskControls((value) => !value)} style={styles.optionRow}>
              <View style={[styles.checkbox, riskControls && styles.checkboxActive]}>{riskControls ? <Icon color={colors.bg} name="check" size={13} /> : null}</View>
              <Text style={styles.optionText}>Take profit / Stop loss</Text>
            </Pressable>
            {advanced ? (
              <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: reduceOnly }} onPress={() => setReduceOnly((value) => !value)} style={styles.optionRow}>
                <View style={[styles.checkbox, reduceOnly && styles.checkboxActive]}>{reduceOnly ? <Icon color={colors.bg} name="check" size={13} /> : null}</View>
                <Text style={styles.optionText}>Reduce only</Text>
              </Pressable>
            ) : null}

            {riskControls ? (
              <View style={styles.riskFields}>
                <Field compact label="Take profit">
                  <TextInput accessibilityLabel="Take profit" keyboardType="decimal-pad" onChangeText={setTakeProfit} placeholder="Optional" placeholderTextColor={colors.textFaint} selectionColor={colors.text} style={styles.smallInput} value={takeProfit} />
                  <Text style={styles.inputUnit}>PTS</Text>
                </Field>
                <Field compact label="Stop loss">
                  <TextInput accessibilityLabel="Stop loss" keyboardType="decimal-pad" onChangeText={setStopLoss} placeholder="Optional" placeholderTextColor={colors.textFaint} selectionColor={colors.text} style={styles.smallInput} value={stopLoss} />
                  <Text style={styles.inputUnit}>PTS</Text>
                </Field>
              </View>
            ) : null}
          </View>

          {advanced ? (
            <Pressable onPress={() => router.push('/(tabs)/portfolio')} style={({ pressed }) => [styles.activity, pressed && styles.pressed]}>
              <View><Text style={styles.activityTitle}>Positions and orders</Text><Text style={styles.activityMeta}>{positions.length} positions · {orders.length} open order{orders.length === 1 ? '' : 's'}</Text></View>
              <Icon color={colors.textMuted} name="chevron" size={18} />
            </Pressable>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.stickyActions}>
        <Pressable disabled={!canSubmit} onPress={() => requestOrder('short')} style={({ pressed }) => [styles.tradeButton, styles.short, !canSubmit && styles.disabled, pressed && styles.pressed]}><Text style={styles.tradeButtonText}>Short</Text></Pressable>
        <Pressable disabled={!canSubmit} onPress={() => requestOrder('long')} style={({ pressed }) => [styles.tradeButton, styles.long, !canSubmit && styles.disabled, pressed && styles.pressed]}><Text style={styles.tradeButtonText}>Long</Text></Pressable>
      </View>

      <PairSelectorSheet onClose={() => setPairOpen(false)} onSelect={setActiveSymbol} visible={pairOpen} />
      <ChoiceSheet
        format={(value) => value === 'basic' ? 'Basic' : 'Advanced'}
        onClose={() => setModeOpen(false)}
        onSelect={selectMode}
        options={['basic', 'advanced'] as const}
        title="Trading interface"
        value={advanced ? 'advanced' : 'basic'}
        visible={modeOpen}
      />
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
          <Text style={styles.completeTitle}>{market.symbol} / POINT</Text>
          <Text style={styles.completeCopy}>{completed === 'position' ? 'Your position is now active.' : 'Your order is waiting for its target price.'}</Text>
          <Pressable onPress={() => { setCompleted(null); router.push('/(tabs)/portfolio'); }} style={styles.portfolioButton}><Text style={styles.portfolioButtonText}>View portfolio</Text></Pressable>
        </View>
      </BottomSheet>
    </Screen>
  );
}

function Timeframes({ frame, onChange }: { frame: ChartFrame; onChange: (frame: ChartFrame) => void }) {
  return (
    <View style={styles.frames}>
      {FRAMES.map((item) => (
        <Pressable accessibilityRole="tab" accessibilityState={{ selected: frame === item }} key={item} onPress={() => onChange(item)} style={styles.frame}>
          <Text style={[styles.frameText, frame === item && styles.frameActive]}>{item}</Text>
          {frame === item ? <View style={styles.frameLine} /> : null}
        </Pressable>
      ))}
    </View>
  );
}

function Field({ label, compact = false, children }: { label: string; compact?: boolean; children: ReactNode }) {
  return (
    <View style={[styles.field, compact && styles.riskField]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputRow}>{children}</View>
    </View>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return <View style={styles.summaryMetric}><Text style={styles.summaryLabel}>{label}</Text><Text numberOfLines={1} style={styles.summaryValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingBottom: spacing.lg },
  header: { alignItems: 'center', borderBottomColor: colors.dividerSoft, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', height: 56, justifyContent: 'space-between', paddingHorizontal: spacing.page },
  pair: { alignItems: 'center', flex: 1, flexDirection: 'row', minHeight: 48 },
  pairCopy: { marginLeft: spacing.sm },
  pairLine: { alignItems: 'center', flexDirection: 'row', gap: 2 },
  symbol: { color: colors.text, fontFamily: typography.family, fontWeight: typography.weights.semibold, fontSize: 15 },
  marketName: { color: colors.textMuted, fontFamily: typography.family, fontWeight: typography.weights.regular, fontSize: 11, marginTop: 3 },
  interfaceLink: { alignItems: 'center', flexDirection: 'row', gap: spacing.xxs, minHeight: 44, paddingLeft: spacing.xs },
  interfaceText: { color: colors.text, fontFamily: typography.family, fontWeight: typography.weights.medium, fontSize: 12 },
  quoteRow: { alignItems: 'flex-start', backgroundColor: colors.section, borderBottomColor: colors.dividerSoft, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', minHeight: 84, paddingHorizontal: spacing.page, paddingTop: spacing.sm },
  price: { color: colors.text, fontFamily: typography.family, fontWeight: typography.weights.bold, fontSize: 26, fontVariant: ['tabular-nums'], letterSpacing: -0.5 },
  change: { fontFamily: typography.family, fontWeight: typography.weights.medium, fontSize: 12, fontVariant: ['tabular-nums'], marginTop: 5 },
  quoteStats: { alignItems: 'flex-end', gap: 7, paddingTop: 5 },
  quoteLabel: { color: colors.textFaint, fontFamily: typography.family, fontWeight: typography.weights.regular, fontSize: 10 },
  quoteValue: { color: colors.textMuted, fontFamily: typography.family, fontWeight: typography.weights.medium, fontVariant: ['tabular-nums'] },
  basicChart: { borderBottomColor: colors.dividerSoft, borderBottomWidth: StyleSheet.hairlineWidth, paddingTop: spacing.xs },
  advancedMarket: { borderBottomColor: colors.dividerSoft, borderBottomWidth: StyleSheet.hairlineWidth },
  panelTabs: { alignItems: 'center', backgroundColor: colors.section, borderBottomColor: colors.dividerSoft, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 44, paddingHorizontal: spacing.page },
  panelTab: { justifyContent: 'center', marginRight: spacing.lg, minHeight: 44 },
  panelTabText: { color: colors.textMuted, fontFamily: typography.family, fontWeight: typography.weights.medium, fontSize: 13 },
  panelTabActive: { color: colors.text, fontFamily: typography.family, fontWeight: typography.weights.semibold },
  panelTabLine: { backgroundColor: colors.text, bottom: 0, height: 2, left: 0, position: 'absolute', right: 0 },
  tickSize: { color: colors.textFaint, flex: 1, fontFamily: typography.family, fontWeight: typography.weights.regular, fontSize: 10, textAlign: 'right' },
  book: { paddingBottom: spacing.sm, paddingHorizontal: spacing.page, paddingTop: spacing.sm },
  frames: { backgroundColor: colors.section, borderBottomColor: colors.dividerSoft, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.page },
  frame: { alignItems: 'center', justifyContent: 'center', minHeight: 40, minWidth: 36 },
  frameText: { color: colors.textMuted, fontFamily: typography.family, fontWeight: typography.weights.medium, fontSize: 11 },
  frameActive: { color: colors.text, fontFamily: typography.family, fontWeight: typography.weights.semibold },
  frameLine: { backgroundColor: colors.text, bottom: 0, height: 2, left: 8, position: 'absolute', right: 8 },
  ticket: { borderTopColor: colors.divider, borderTopWidth: StyleSheet.hairlineWidth, marginTop: spacing.md, paddingHorizontal: spacing.page, paddingTop: spacing.md },
  advancedTicket: { marginTop: 0 },
  ticketTitle: { color: colors.text, fontFamily: typography.family, fontWeight: typography.weights.bold, fontSize: 18, letterSpacing: -0.2, marginBottom: spacing.md },
  orderTypes: { borderBottomColor: colors.dividerSoft, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', marginBottom: spacing.md },
  orderType: { marginRight: spacing.lg, minHeight: 40, paddingBottom: spacing.xs },
  orderTypeText: { color: colors.textMuted, fontFamily: typography.family, fontWeight: typography.weights.medium, fontSize: 14 },
  orderTypeActive: { color: colors.text, fontFamily: typography.family, fontWeight: typography.weights.semibold },
  orderTypeLine: { backgroundColor: colors.text, bottom: 0, height: 2, left: 0, position: 'absolute', right: 0 },
  field: { marginBottom: spacing.md },
  fieldHeading: { flexDirection: 'row', justifyContent: 'space-between' },
  fieldLabel: { color: colors.textMuted, fontFamily: typography.family, fontWeight: typography.weights.regular, fontSize: 12, marginBottom: 8 },
  available: { color: colors.textFaint, fontFamily: typography.family, fontWeight: typography.weights.regular, fontSize: 11 },
  inputRow: { alignItems: 'center', backgroundColor: colors.surfaceRaised, borderColor: colors.divider, borderRadius: radii.md, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', height: 48, paddingHorizontal: spacing.sm },
  inputError: { borderColor: colors.negative, borderWidth: 1 },
  input: { color: colors.text, flex: 1, fontFamily: typography.family, fontWeight: typography.weights.semibold, fontSize: 16, fontVariant: ['tabular-nums'], padding: 0 },
  smallInput: { color: colors.text, flex: 1, fontFamily: typography.family, fontWeight: typography.weights.medium, fontSize: 13, fontVariant: ['tabular-nums'], padding: 0 },
  inputUnit: { color: colors.textMuted, fontFamily: typography.family, fontWeight: typography.weights.semibold, fontSize: 11 },
  error: { color: colors.negative, fontFamily: typography.family, fontWeight: typography.weights.regular, fontSize: 10, marginTop: 6 },
  percentages: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md },
  percentage: { alignItems: 'center', backgroundColor: colors.section, borderColor: colors.dividerSoft, borderRadius: radii.sm, borderWidth: StyleSheet.hairlineWidth, flex: 1, height: 34, justifyContent: 'center' },
  percentageText: { color: colors.textMuted, fontFamily: typography.family, fontWeight: typography.weights.semibold, fontSize: 11 },
  leverageRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  leverageControl: { alignItems: 'center', backgroundColor: colors.section, borderColor: colors.divider, borderRadius: radii.md, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', height: 38 },
  leverageButton: { alignItems: 'center', height: 38, justifyContent: 'center', width: 40 },
  leverageButtonText: { color: colors.text, fontFamily: typography.family, fontWeight: typography.weights.medium, fontSize: 19 },
  leverageValue: { color: colors.text, fontFamily: typography.family, fontWeight: typography.weights.semibold, fontSize: 13, fontVariant: ['tabular-nums'], minWidth: 42, textAlign: 'center' },
  leveragePresets: { borderColor: colors.divider, borderRadius: radii.md, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', overflow: 'hidden' },
  leveragePreset: { alignItems: 'center', backgroundColor: colors.section, borderRightColor: colors.divider, borderRightWidth: StyleSheet.hairlineWidth, height: 38, justifyContent: 'center', minWidth: 48 },
  leveragePresetActive: { backgroundColor: colors.text },
  leveragePresetText: { color: colors.textMuted, fontFamily: typography.family, fontWeight: typography.weights.semibold, fontSize: 13 },
  leveragePresetTextActive: { color: colors.bg },
  orderSummary: { backgroundColor: colors.section, borderBottomColor: colors.dividerSoft, borderBottomWidth: StyleSheet.hairlineWidth, borderTopColor: colors.dividerSoft, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', marginBottom: spacing.sm, marginHorizontal: -spacing.page },
  summaryMetric: { borderRightColor: colors.divider, borderRightWidth: StyleSheet.hairlineWidth, flex: 1, justifyContent: 'center', minHeight: 58, minWidth: 0, paddingHorizontal: spacing.sm },
  summaryLabel: { color: colors.textFaint, fontFamily: typography.family, fontWeight: typography.weights.regular, fontSize: 10, marginBottom: 5 },
  summaryValue: { color: colors.text, fontFamily: typography.family, fontWeight: typography.weights.medium, fontSize: 12, fontVariant: ['tabular-nums'] },
  optionRow: { alignItems: 'center', flexDirection: 'row', minHeight: 40 },
  checkbox: { alignItems: 'center', borderColor: colors.textFaint, borderRadius: 4, borderWidth: 1, height: 19, justifyContent: 'center', marginRight: 10, width: 19 },
  checkboxActive: { backgroundColor: colors.text, borderColor: colors.text },
  optionText: { color: colors.text, fontFamily: typography.family, fontWeight: typography.weights.medium, fontSize: 12 },
  riskFields: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs },
  riskField: { flex: 1 },
  activity: { alignItems: 'center', borderBottomColor: colors.dividerSoft, borderBottomWidth: StyleSheet.hairlineWidth, borderTopColor: colors.dividerSoft, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md, minHeight: 58, paddingHorizontal: spacing.page },
  activityTitle: { color: colors.text, fontFamily: typography.family, fontWeight: typography.weights.semibold, fontSize: 13 },
  activityMeta: { color: colors.textMuted, fontFamily: typography.family, fontWeight: typography.weights.regular, fontSize: 11, marginTop: 4 },
  stickyActions: { backgroundColor: colors.navigation, borderTopColor: colors.divider, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.page, paddingVertical: spacing.xs },
  tradeButton: { alignItems: 'center', borderRadius: radii.md, flex: 1, justifyContent: 'center', minHeight: 48 },
  long: { backgroundColor: colors.positive },
  short: { backgroundColor: colors.negative },
  disabled: { opacity: 0.35 },
  tradeButtonText: { color: colors.white, fontFamily: typography.family, fontWeight: typography.weights.semibold, fontSize: 15 },
  complete: { alignItems: 'center', paddingBottom: 4, paddingTop: 8 },
  completeIcon: { alignItems: 'center', backgroundColor: colors.surfaceRaised, borderColor: colors.divider, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, height: 48, justifyContent: 'center', width: 48 },
  completeTitle: { color: colors.text, fontFamily: typography.family, fontWeight: typography.weights.semibold, fontSize: 16, marginTop: 15 },
  completeCopy: { color: colors.textMuted, fontFamily: typography.family, fontWeight: typography.weights.regular, fontSize: 12, marginTop: 6, textAlign: 'center' },
  portfolioButton: { alignItems: 'center', backgroundColor: colors.text, borderRadius: radii.md, justifyContent: 'center', marginTop: spacing.lg, minHeight: 48, width: '100%' },
  portfolioButtonText: { color: colors.bg, fontFamily: typography.family, fontWeight: typography.weights.semibold, fontSize: 14 },
  pressed: { opacity: 0.68 },
});
