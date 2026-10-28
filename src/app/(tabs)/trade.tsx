import {ChoiceSheet} from '@/components/ui/choice-sheet';
import {executionLabel,marketExecutionOptions,type MarketExecution} from '@/lib/market-execution';
import {createContext,useContext} from 'react';
import {useKeyboardScroll} from '@/hooks/use-keyboard-scroll';
import {LeverageControl} from '@/components/ui/leverage-control';
import {useNotification} from '@/context/notification-context';
import {useAuth} from '@/context/auth-context';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MarketIdentityAvatar } from '@/components/market/market-identity-avatar';
import { MarketAvatar } from '@/components/market/market-avatar';
import { CandlestickChart, MarketChart } from '@/components/market/market-chart';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { OrderBook } from '@/components/trade/order-book';
import { OrderReviewSheet } from '@/components/trade/order-review-sheet';
import { PairSelectorSheet } from '@/components/trade/pair-selector-sheet';
import { useExchange } from '@/context/exchange-context';
import { formatBand, formatMoney, formatPercent, formatPrice } from '@/lib/format';
import { radii, spacing, typography } from '@/theme/tokens';
import { useTheme } from '@/theme/theme-context';
import { createThemedStyles } from '@/theme/use-themed-styles';
import type { ChartRange, OrderType, Side } from '@/types/exchange';

type AdvancedPanel = 'Chart' | 'Book';
const BASIC_RANGES: ChartRange[] = ['15m', '1H', '4H', '1D'];
const ADVANCED_RANGES: ChartRange[] = ['1m', '5m', '15m', '1H', '4H'];
const ORDER_TYPES: OrderType[] = ['market', 'limit', 'stop'];
const FocusContext=createContext<()=>void>(()=>{});

export default function TradeScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const {scroll,scrollFocused}=useKeyboardScroll();
  const router = useRouter();
  const notify=useNotification();
  const {session,requestAuth}=useAuth();
  const {
    activeSymbol, setActiveSymbol, marketFor, priceFor, changeFor, seriesFor, candlesFor, historyLoadingFor,
    cashBalance, positions, orders, settings, updateSetting, placeOrder, isTradableFor, maxLeverageFor, liquidationEstimate, orderEstimate, busy, ready, accountMode, error,
  } = useExchange();
  const market = marketFor(activeSymbol) ?? marketFor('RMD');
  const advanced = settings.interfaceMode === 'advanced';
  const [pairOpen, setPairOpen] = useState(false);
  const [panel, setPanel] = useState<AdvancedPanel>('Chart');
  const [range, setRange] = useState<ChartRange>('1D');
  const [side, setSide] = useState<Side>('long');
  const [orderType, setOrderType] = useState<OrderType>(settings.defaultOrderType);
  const [amount, setAmount] = useState(String(settings.defaultMargin));
  const [targetPrice, setTargetPrice] = useState('');
  const [marketLimit, setMarketLimit] = useState('');
  const [execution, setExecution] = useState<MarketExecution>(settings.defaultMarketExecution);
  const [executionOpen, setExecutionOpen] = useState(false);
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
  const effectiveExecution = advanced ? execution : settings.defaultMarketExecution;
  const marketTarget = (advanced || effectiveExecution === 'GTC') && marketLimit.trim() ? Number(marketLimit) : undefined;
  const validMarketLimit = selectedType !== 'market' || ((marketTarget === undefined || Number.isFinite(marketTarget) && marketTarget > 0) && (effectiveExecution !== 'GTC' || marketTarget !== undefined));
  const chosenTarget = selectedType === 'market' ? marketTarget : numericTarget;
  const effectiveLeverage = Math.min(leverage, market ? maxLeverageFor(market.symbol) : 1);
  const estimate=orderEstimate({symbol:market?.symbol??'',side,type:selectedType,amount:numericAmount,leverage:effectiveLeverage,marketExecution:effectiveExecution,targetPrice:chosenTarget});
  const exposure = estimate.exposure;
  const liquidation=liquidationEstimate({symbol:market?.symbol??'',side,type:selectedType,amount:numericAmount,leverage:effectiveLeverage,marketExecution:effectiveExecution,targetPrice:chosenTarget});
  const canSubmit = ready && !busy && validMarketLimit && numericAmount > 0 && Number.isFinite(estimate.requiredBalance) && estimate.requiredBalance <= cashBalance;
  const tradable=market?isTradableFor(market.symbol):false;
  const priceReady=price>0;
  const changeRange=(value:ChartRange)=>{setRange(value);};
  const line = useMemo(() => market ? seriesFor(market.symbol, range) : [], [market, range, seriesFor]);
  const candles = useMemo(() => market ? candlesFor(market.symbol, range) : [], [candlesFor, market, range]);

  useEffect(()=>setExecution(settings.defaultMarketExecution),[settings.defaultMarketExecution]);
  useEffect(()=>{setOrderType(settings.defaultOrderType);setLeverage(settings.defaultLeverage);setAmount(String(settings.defaultMargin));},[settings.defaultOrderType,settings.defaultLeverage,settings.defaultMargin]);
  useEffect(()=>{if(!(price>0))return;setTakeProfit(settings.takeProfitPercent>0?String(price*(1+(side==='long'?1:-1)*settings.takeProfitPercent/100)):'');setStopLoss(settings.stopLossPercent>0?String(price*(1+(side==='long'?-1:1)*settings.stopLossPercent/100)):'');},[activeSymbol,side,priceReady,settings.takeProfitPercent,settings.stopLossPercent]);
  if (!market) return <Screen><View style={{padding:24}}><Text style={{color:colors.text}}>Loading market…</Text></View></Screen>;

  const execute = async () => {
    if(busy)return;
    try { await placeOrder({ symbol: market.symbol, side, type: selectedType, amount: numericAmount, leverage: effectiveLeverage, ...(riskControls && takeProfit.trim() ? {takeProfit:Number(takeProfit)} : {}), ...(riskControls && stopLoss.trim() ? {stopLoss:Number(stopLoss)} : {}), marketExecution:effectiveExecution, targetPrice:chosenTarget }); }
    catch (error) { setReviewOpen(false); notify({title:'Order unavailable', message:error instanceof Error ? error.message : 'Please try again.',tone:'error'}); return; }
    setReviewOpen(false);
    setAmount('');
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <FocusContext.Provider value={scrollFocused}><ScrollView ref={scroll} automaticallyAdjustKeyboardInsets keyboardDismissMode="on-drag" contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={{color:colors.textMuted,paddingHorizontal:spacing.page,paddingVertical:8}}>{!session?'Browsing markets':accountMode === 'demo' ? 'Demo · practice funds' : 'Live account'}{error ? ' · '+error : ''}</Text>
          <View style={styles.header}>
            <Pressable onPress={() => setPairOpen(true)} style={({ pressed }) => [styles.pair, pressed && styles.pressed]}>
              <MarketIdentityAvatar market={market} size={42} />
              <View style={styles.pairCopy}>
                <View style={styles.symbolLine}><Text style={styles.symbol}>{market.symbol}</Text><Icon color={colors.textMuted} name="chevron" size={16} /></View>
                {!market.pairLegs ? <Text numberOfLines={1} style={styles.marketName}>{market.name}</Text> : null}
              </View>
            </Pressable>
            <View style={styles.liveQuote}>
              <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65} style={styles.livePrice}>{formatPrice(price)}</Text>
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
                <RangeRail onChange={changeRange} range={range} ranges={ADVANCED_RANGES} />
              </View>
              <View style={styles.advancedMarket}>
                {panel === 'Chart' ? (settings.chartType==='line'?<MarketChart loading={historyLoadingFor(market.symbol)} candles={candles} series={line} positive={change>=0} height={204} />:<CandlestickChart loading={historyLoadingFor(market.symbol)} candles={candles} mode={settings.chartType} height={204} />) : <View style={styles.book}><OrderBook lowerBand={market.lowerBand} upperBand={market.upperBand} price={price} /></View>}
              </View>
            </>
          ) : (
            <>
              <View style={styles.basicChart}>
                {settings.chartType==='line'?<MarketChart loading={historyLoadingFor(market.symbol)} candles={candles} area height={170} positive={change >= 0} series={line} strokeWidth={2} />:<CandlestickChart loading={historyLoadingFor(market.symbol)} candles={candles} mode={settings.chartType} height={170}/>}
              </View>
              <View style={styles.basicRanges}><RangeRail onChange={changeRange} range={range} ranges={BASIC_RANGES} /></View>
            </>
          )}

          <View style={{paddingHorizontal:spacing.page,paddingTop:12,flexDirection:'row',justifyContent:'space-between',gap:8}}>
            <Text style={{color:colors.textMuted,fontFamily:typography.mono,fontSize:10}}>Lower band {formatBand(market.lowerBand,market.reference,settings.bandDisplay)}</Text>
            <Text style={{color:colors.textMuted,fontFamily:typography.mono,fontSize:10}}>Upper band {formatBand(market.upperBand,market.reference,settings.bandDisplay)}</Text>
          </View>
          <View style={styles.ticket}>
            <View style={styles.ticketHeading}>
              <Text style={styles.ticketTitle}>Order ticket</Text>
              <Text style={styles.available}>{formatMoney(cashBalance, settings.currency)} available</Text>
            </View>

            {!tradable?<Text style={{color:colors.textMuted,marginBottom:16}}>Trading is unavailable for this index. You can still browse its prices and history.</Text>:null}
            <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:16}}><Text style={styles.label}>Advanced trading</Text><Switch trackColor={{false:colors.divider,true:colors.textMuted}} thumbColor={colors.text} ios_backgroundColor={colors.divider} accessibilityLabel="Advanced trading" value={advanced} onValueChange={value=>updateSetting('interfaceMode',value?'advanced':'basic')}/></View>
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

            {advanced && selectedType === 'market' ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Execution preference" onPress={()=>setExecutionOpen(true)} style={{paddingVertical:12}}>
                <Text style={styles.label}>Execution</Text><Text style={{color:colors.text}}>{executionLabel(effectiveExecution)} ▾</Text>
              </Pressable>
            ) : null}
            {selectedType === 'market' && (advanced || effectiveExecution === 'GTC') ? (
              <Field label={(side === 'long' ? 'Maximum buy price' : 'Minimum sell price')+(effectiveExecution === 'GTC' ? '' : ' (optional)')} value={marketLimit} onChangeText={setMarketLimit} unit="POINT" />
            ) : null}

            {advanced && selectedType !== 'market' ? (
              <Field label={selectedType === 'stop' ? 'Trigger price' : 'Limit price'} value={targetPrice} onChangeText={setTargetPrice} unit="POINT" />
            ) : null}
            {settings.marginWarnings&&numericAmount>0&&estimate.requiredBalance>cashBalance*settings.balanceWarningPercent/100?<Text accessibilityRole="alert" style={{color:colors.negative,marginBottom:12}}>This order uses over {settings.balanceWarningPercent}% of your available trading balance.</Text>:null}
            <Field label="Margin" value={amount} onChangeText={setAmount} unit="$" />
            <Text style={styles.available}>Estimated fee {formatMoney(estimate.fee, settings.currency)} · balance needed {formatMoney(estimate.requiredBalance, settings.currency)}</Text>

            <View style={{marginBottom:16}}><LeverageControl value={effectiveLeverage} max={maxLeverageFor(market.symbol)} onChange={setLeverage} onFocus={scrollFocused}/></View>

            <View style={styles.summaryLine}>
              <Summary label="Exposure" value={formatMoney(exposure, settings.currency)} />
              <Summary label="Fee" value={formatMoney(estimate.fee, settings.currency)} />
              <Summary label="Est. isolated liq." value={liquidation===Infinity?'Below zero':formatPrice(liquidation)} />
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

            <Pressable accessibilityRole="button" accessibilityLabel={!tradable?'Trading unavailable':session?`Review ${side} order`:'Sign in to trade'} disabled={!tradable||Boolean(session)&&!canSubmit} onPress={() => {if(!session){requestAuth();return;}if(settings.confirmOrders)setReviewOpen(true);else void execute();}} style={({ pressed }) => [styles.submit, side === 'long' ? styles.submitLong : styles.submitShort, (!tradable||Boolean(session)&&!canSubmit) && styles.disabled, pressed && styles.pressed]}>
              <Text style={styles.submitText}>{!tradable?'Trading unavailable':session?`Review ${side} order`:'Sign in to trade'}</Text>
            </Pressable>

            {session && !canSubmit ? <Text style={{color:colors.textMuted}}>{busy?'A previous account action is awaiting confirmation. BlackBook is checking it automatically.':!ready?'Waiting for your account connection.':numericAmount<=0?'Enter a trade amount.':!validMarketLimit?'Enter a valid price limit for this order.':!Number.isFinite(estimate.requiredBalance)?'Waiting for a current quote and fee estimate.':'Available balance must cover margin and trading fees.'}</Text> : null}

            <Pressable onPress={() => router.push('/(tabs)/portfolio')} style={styles.activityLink}>
              <Text style={styles.activityText}>Positions {positions.length}</Text>
              <Text style={styles.activityDot}>·</Text>
              <Text style={styles.activityText}>Orders {orders.length}</Text>
            </Pressable>
          </View>
        </ScrollView></FocusContext.Provider>
      </KeyboardAvoidingView>

      <ChoiceSheet visible={executionOpen} title="Execution" value={execution} options={marketExecutionOptions} format={executionLabel} onSelect={setExecution} onClose={()=>setExecutionOpen(false)} />
      <PairSelectorSheet onClose={() => setPairOpen(false)} onSelect={setActiveSymbol} visible={pairOpen} />
      <OrderReviewSheet busy={busy} amount={numericAmount} fee={estimate.fee} exposure={exposure} currency={settings.currency} leverage={effectiveLeverage} onClose={() => setReviewOpen(false)} onConfirm={() => {void execute();}} price={price} marketExecution={effectiveExecution} side={side} symbol={market.symbol} targetPrice={chosenTarget} type={selectedType} visible={reviewOpen} />
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
  const onFocus=useContext(FocusContext);
  return (
    <View style={[styles.field, compact && styles.compactField]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput onFocus={onFocus} accessibilityLabel={label} keyboardType="decimal-pad" onChangeText={onChangeText} placeholder="0.00" placeholderTextColor={colors.textFaint} selectionColor={colors.text} style={styles.input} value={value} />
        <Text style={styles.unit}>{unit}</Text>
      </View>
    </View>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  return <View style={styles.summary}><Text style={styles.summaryLabel}>{label}</Text><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65} style={styles.summaryValue}>{value}</Text></View>;
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
  liveQuote: { maxWidth:'48%', minWidth:0, alignItems: 'flex-end' },
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
  input: { color: colors.text, flex: 1,minWidth:0, fontFamily: typography.monoSemibold, fontSize: 15, padding: 0 },
  unit: { color: colors.textMuted, fontFamily: typography.monoSemibold, fontSize: 9 },
  leverageLine: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  leverageRail: { flexDirection: 'row', gap: spacing.xs },
  leveragePill: { alignItems: 'center', borderRadius: radii.pill, height: 30, justifyContent: 'center', minWidth: 32 },
  leverageActive: { backgroundColor: colors.text },
  leverageText: { color: colors.textMuted, fontFamily: typography.monoSemibold, fontSize: 10 },
  leverageTextActive: { color: colors.bg },
  summaryLine: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  summary: { flex: 1,minWidth:0 },
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
