import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MarketAvatar } from '@/components/market/market-avatar';
import { CandlestickChart, MarketChart } from '@/components/market/market-chart';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { OrderBook } from '@/components/trade/order-book';
import { OrderReviewSheet } from '@/components/trade/order-review-sheet';
import { PairSelectorSheet } from '@/components/trade/pair-selector-sheet';
import { useExchange } from '@/context/exchange-context';
import { formatMoney, formatPercent, formatPrice } from '@/lib/format';
import { radii, spacing, typography } from '@/theme/tokens';
import { useTheme } from '@/theme/theme-context';
import { createThemedStyles } from '@/theme/use-themed-styles';
import type { ChartRange, OrderType, Side } from '@/types/exchange';

type AdvancedPanel = 'Chart' | 'Book';
const BASIC_RANGES: ChartRange[] = ['15m', '1H', '4H', '1D'];
const ADVANCED_RANGES: ChartRange[] = ['1m', '5m', '15m', '1H', '4H'];
const ORDER_TYPES: OrderType[] = ['market', 'limit', 'stop'];
const LEVERAGES = [1, 3, 5, 10];

export default function TradeScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const {
    activeSymbol, setActiveSymbol, marketFor, priceFor, changeFor, seriesFor, candlesFor,
    cashBalance, positions, orders, settings, placeOrder,
  } = useExchange();
  const market = marketFor(activeSymbol) ?? marketFor('RMD');
  const advanced = settings.interfaceMode === 'advanced';
  const [pairOpen, setPairOpen] = useState(false);
  const [panel, setPanel] = useState<AdvancedPanel>('Chart');
  const [range, setRange] = useState<ChartRange>(advanced ? '15m' : '1H');
  const [side, setSide] = useState<Side>('long');
  const [orderType, setOrderType] = useState<OrderType>(settings.defaultOrderType);
  const [amount, setAmount] = useState('100');
  const [targetPrice, setTargetPrice] = useState('');
  const [leverage, setLeverage] = useState(settings.defaultLeverage);
  const [riskControls, setRiskControls] = useState(settings.attachRiskControls);
  const [takeProfit, setTakeProfit] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);

  const numericAmount = Number(amount) || 0;
  const price = market ? priceFor(market.symbol) : 0;
  const change = market ? changeFor(market.symbol) : 0;
  const selectedType = advanced ? orderType : 'market';
  const numericTarget = Number(targetPrice) || price;
  const exposure = numericAmount * leverage;
  const canSubmit = numericAmount > 0 && numericAmount <= cashBalance;
  const line = useMemo(() => market ? seriesFor(market.symbol, range) : [], [market, range, seriesFor]);
  const candles = useMemo(() => market ? candlesFor(market.symbol, range) : [], [candlesFor, market, range]);

  if (!market) return null;

  const execute = () => {
    placeOrder({ symbol: market.symbol, side, type: selectedType, amount: numericAmount, leverage, targetPrice: selectedType === 'market' ? undefined : numericTarget });
    setReviewOpen(false);
    setAmount('');
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Pressable onPress={() => setPairOpen(true)} style={({ pressed }) => [styles.pair, pressed && styles.pressed]}>
              <MarketAvatar assetKey={market.assetKey} size={42} symbol={market.symbol} />
              <View style={styles.pairCopy}>
                <View style={styles.symbolLine}><Text style={styles.symbol}>{market.symbol}</Text><Icon color={colors.textMuted} name="chevron" size={16} /></View>
                <Text numberOfLines={1} style={styles.marketName}>{market.name}</Text>
              </View>
            </Pressable>
            <View style={styles.liveQuote}>
              <Text style={styles.livePrice}>{formatPrice(price)}</Text>
              <Text style={[styles.liveChange, { color: change >= 0 ? colors.positive : colors.negative }]}>{formatPercent(change)}</Text>
            </View>
          </View>

          {advanced ? (
            <>
              <View style={styles.toolbar}>
                <View style={styles.panelPill}>
                  {(['Chart', 'Book'] as const).map((item) => (
                    <Pressable key={item} onPress={() => setPanel(item)} style={[styles.panelChoice, panel === item && styles.panelChoiceActive]}>
                      <Text style={[styles.panelText, panel === item && styles.panelTextActive]}>{item}</Text>
                    </Pressable>
                  ))}
                </View>
                <RangeRail onChange={setRange} range={range} ranges={ADVANCED_RANGES} />
              </View>
              <View style={styles.advancedMarket}>
                {panel === 'Chart' ? <CandlestickChart candles={candles} height={204} /> : <View style={styles.book}><OrderBook price={price} /></View>}
              </View>
            </>
          ) : (
            <>
              <View style={styles.basicChart}>
                <MarketChart area height={170} positive={change >= 0} series={line} strokeWidth={2} />
              </View>
              <View style={styles.basicRanges}><RangeRail onChange={setRange} range={range} ranges={BASIC_RANGES} /></View>
            </>
          )}

          <View style={styles.ticket}>
            <View style={styles.ticketHeading}>
              <Text style={styles.ticketTitle}>Order ticket</Text>
              <Text style={styles.available}>{formatMoney(cashBalance, settings.currency)} available</Text>
            </View>

            <View style={styles.sidePill}>
              {(['long', 'short'] as const).map((item) => (
                <Pressable key={item} onPress={() => setSide(item)} style={[styles.sideChoice, side === item && (item === 'long' ? styles.longChoice : styles.shortChoice)]}>
                  <Text style={[styles.sideText, side === item && styles.sideTextActive]}>{item === 'long' ? 'Long' : 'Short'}</Text>
                </Pressable>
              ))}
            </View>

            {advanced ? (
              <View style={styles.orderTypes}>
                {ORDER_TYPES.map((item) => (
                  <Pressable key={item} onPress={() => setOrderType(item)} style={[styles.typePill, orderType === item && styles.typePillActive]}>
                    <Text style={[styles.typeText, orderType === item && styles.typeTextActive]}>{item.charAt(0).toUpperCase() + item.slice(1)}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {advanced && selectedType !== 'market' ? (
              <Field label={selectedType === 'stop' ? 'Trigger price' : 'Limit price'} value={targetPrice} onChangeText={setTargetPrice} unit="POINT" />
            ) : null}
            <Field label="Margin" value={amount} onChangeText={setAmount} unit={settings.currency} />

            <View style={styles.leverageLine}>
              <Text style={styles.label}>Leverage</Text>
              <View style={styles.leverageRail}>
                {LEVERAGES.map((value) => (
                  <Pressable key={value} onPress={() => setLeverage(value)} style={[styles.leveragePill, leverage === value && styles.leverageActive]}>
                    <Text style={[styles.leverageText, leverage === value && styles.leverageTextActive]}>{value}x</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.summaryLine}>
              <Summary label="Exposure" value={formatMoney(exposure, settings.currency)} />
              <Summary label="Fee" value={formatMoney(exposure * 0.0006, settings.currency)} />
            </View>

            {advanced ? (
              <>
                <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: riskControls }} onPress={() => setRiskControls((value) => !value)} style={styles.optionRow}>
                  <View style={[styles.checkbox, riskControls && styles.checkboxActive]}>{riskControls ? <Icon color={colors.bg} name="check" size={13} /> : null}</View>
                  <Text style={styles.optionText}>Take profit / Stop loss</Text>
                </Pressable>
                {riskControls ? (
                  <View style={styles.riskFields}>
                    <Field compact label="Take profit" onChangeText={setTakeProfit} unit="POINT" value={takeProfit} />
                    <Field compact label="Stop loss" onChangeText={setStopLoss} unit="POINT" value={stopLoss} />
                  </View>
                ) : null}
              </>
            ) : null}

            <Pressable disabled={!canSubmit} onPress={() => setReviewOpen(true)} style={({ pressed }) => [styles.submit, side === 'long' ? styles.submitLong : styles.submitShort, !canSubmit && styles.disabled, pressed && styles.pressed]}>
              <Text style={styles.submitText}>Review {side} order</Text>
            </Pressable>

            <Pressable onPress={() => router.push('/(tabs)/portfolio')} style={styles.activityLink}>
              <Text style={styles.activityText}>Positions {positions.length}</Text>
              <Text style={styles.activityDot}>·</Text>
              <Text style={styles.activityText}>Orders {orders.length}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <PairSelectorSheet onClose={() => setPairOpen(false)} onSelect={setActiveSymbol} visible={pairOpen} />
      <OrderReviewSheet amount={numericAmount} currency={settings.currency} leverage={leverage} onClose={() => setReviewOpen(false)} onConfirm={execute} price={price} side={side} symbol={market.symbol} targetPrice={numericTarget} type={selectedType} visible={reviewOpen} />
    </Screen>
  );
}

function RangeRail({ ranges, range, onChange }: { ranges: ChartRange[]; range: ChartRange; onChange: (range: ChartRange) => void }) {
  const styles = useStyles();
  return (
    <View style={styles.rangeRail}>{ranges.map((item) => (
      <Pressable key={item} onPress={() => onChange(item)} style={[styles.rangeChoice, range === item && styles.rangeActive]}><Text style={[styles.rangeText, range === item && styles.rangeTextActive]}>{item}</Text></Pressable>
    ))}</View>
  );
}

function Field({ label, value, onChangeText, unit, compact = false }: { label: string; value: string; onChangeText: (value: string) => void; unit: string; compact?: boolean }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={[styles.field, compact && styles.compactField]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput keyboardType="decimal-pad" onChangeText={onChangeText} placeholder="0.00" placeholderTextColor={colors.textFaint} selectionColor={colors.text} style={styles.input} value={value} />
        <Text style={styles.unit}>{unit}</Text>
      </View>
    </View>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  return <View style={styles.summary}><Text style={styles.summaryLabel}>{label}</Text><Text style={styles.summaryValue}>{value}</Text></View>;
}

const useStyles = createThemedStyles((colors) => ({
  flex: { flex: 1 },
  content: { paddingBottom: spacing.xl },
  header: { alignItems: 'center', flexDirection: 'row', height: 62, justifyContent: 'space-between', paddingHorizontal: spacing.page },
  pair: { alignItems: 'center', flex: 1, flexDirection: 'row', minWidth: 0 },
  pairCopy: { flex: 1, marginLeft: spacing.sm, minWidth: 0 },
  symbolLine: { alignItems: 'center', flexDirection: 'row' },
  symbol: { color: colors.text, fontFamily: typography.monoBold, fontSize: 15 },
  marketName: { color: colors.textMuted, fontFamily: typography.medium, fontSize: 10, marginTop: 3 },
  liveQuote: { alignItems: 'flex-end' },
  livePrice: { color: colors.text, fontFamily: typography.monoSemibold, fontSize: 13 },
  liveChange: { fontFamily: typography.monoSemibold, fontSize: 10, marginTop: 3 },
  toolbar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 42, paddingHorizontal: spacing.page },
  panelPill: { backgroundColor: colors.surface, borderRadius: radii.pill, flexDirection: 'row', padding: 2 },
  panelChoice: { alignItems: 'center', borderRadius: radii.pill, height: 28, justifyContent: 'center', paddingHorizontal: 12 },
  panelChoiceActive: { backgroundColor: colors.text },
  panelText: { color: colors.textMuted, fontFamily: typography.semibold, fontSize: 10 },
  panelTextActive: { color: colors.bg },
  advancedMarket: { backgroundColor: colors.chart },
  book: { paddingHorizontal: spacing.page, paddingVertical: spacing.sm },
  basicChart: { backgroundColor: colors.chart, paddingTop: spacing.xs },
  basicRanges: { alignItems: 'center', paddingVertical: spacing.xs },
  rangeRail: { flexDirection: 'row', gap: 3 },
  rangeChoice: { alignItems: 'center', borderRadius: radii.pill, height: 28, justifyContent: 'center', minWidth: 38, paddingHorizontal: 8 },
  rangeActive: { backgroundColor: colors.surfaceRaised },
  rangeText: { color: colors.textMuted, fontFamily: typography.mono, fontSize: 10 },
  rangeTextActive: { color: colors.text, fontFamily: typography.monoSemibold },
  ticket: { paddingHorizontal: spacing.page, paddingTop: spacing.lg },
  ticketHeading: { alignItems: 'baseline', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  ticketTitle: { color: colors.text, fontFamily: typography.bold, fontSize: 20, letterSpacing: -0.5 },
  available: { color: colors.textMuted, fontFamily: typography.mono, fontSize: 9 },
  sidePill: { backgroundColor: colors.surface, borderRadius: radii.pill, flexDirection: 'row', marginBottom: spacing.md, padding: 3 },
  sideChoice: { alignItems: 'center', borderRadius: radii.pill, flex: 1, height: 34, justifyContent: 'center' },
  longChoice: { backgroundColor: colors.positive },
  shortChoice: { backgroundColor: colors.negative },
  sideText: { color: colors.textMuted, fontFamily: typography.semibold, fontSize: 12 },
  sideTextActive: { color: colors.white },
  orderTypes: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md },
  typePill: { alignItems: 'center', borderColor: colors.divider, borderRadius: radii.pill, borderWidth: 1, height: 32, justifyContent: 'center', paddingHorizontal: 15 },
  typePillActive: { backgroundColor: colors.text, borderColor: colors.text },
  typeText: { color: colors.textMuted, fontFamily: typography.semibold, fontSize: 11 },
  typeTextActive: { color: colors.bg },
  field: { marginBottom: spacing.md },
  compactField: { flex: 1 },
  label: { color: colors.textMuted, fontFamily: typography.medium, fontSize: 11, marginBottom: 7 },
  inputRow: { alignItems: 'center', backgroundColor: colors.control, borderRadius: radii.md, flexDirection: 'row', height: 46, paddingHorizontal: spacing.sm },
  input: { color: colors.text, flex: 1, fontFamily: typography.monoSemibold, fontSize: 15, padding: 0 },
  unit: { color: colors.textMuted, fontFamily: typography.monoSemibold, fontSize: 9 },
  leverageLine: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  leverageRail: { flexDirection: 'row', gap: spacing.xs },
  leveragePill: { alignItems: 'center', borderRadius: radii.pill, height: 30, justifyContent: 'center', minWidth: 40 },
  leverageActive: { backgroundColor: colors.text },
  leverageText: { color: colors.textMuted, fontFamily: typography.monoSemibold, fontSize: 10 },
  leverageTextActive: { color: colors.bg },
  summaryLine: { flexDirection: 'row', gap: spacing.xl, marginBottom: spacing.sm },
  summary: { flex: 1 },
  summaryLabel: { color: colors.textMuted, fontFamily: typography.medium, fontSize: 10 },
  summaryValue: { color: colors.text, fontFamily: typography.monoSemibold, fontSize: 11, marginTop: 4 },
  optionRow: { alignItems: 'center', flexDirection: 'row', minHeight: 40 },
  checkbox: { alignItems: 'center', borderColor: colors.textFaint, borderRadius: 5, borderWidth: 1, height: 20, justifyContent: 'center', marginRight: 9, width: 20 },
  checkboxActive: { backgroundColor: colors.text, borderColor: colors.text },
  optionText: { color: colors.text, fontFamily: typography.medium, fontSize: 12 },
  riskFields: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs },
  submit: { alignItems: 'center', borderRadius: radii.pill, height: 44, justifyContent: 'center', marginTop: spacing.md },
  submitLong: { backgroundColor: colors.positive },
  submitShort: { backgroundColor: colors.negative },
  submitText: { color: colors.white, fontFamily: typography.bold, fontSize: 13, textTransform: 'capitalize' },
  disabled: { opacity: 0.35 },
  activityLink: { alignItems: 'center', alignSelf: 'center', flexDirection: 'row', gap: spacing.xs, minHeight: 44 },
  activityText: { color: colors.textMuted, fontFamily: typography.mono, fontSize: 10 },
  activityDot: { color: colors.textFaint, fontFamily: typography.family },
  pressed: { opacity: 0.65 },
}));
