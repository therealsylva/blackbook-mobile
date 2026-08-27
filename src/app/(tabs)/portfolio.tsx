import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AddFundsSheet } from '@/components/account/add-funds-sheet';
import { MarketAvatar } from '@/components/market/market-avatar';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Icon, type IconName } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { useExchange } from '@/context/exchange-context';
import { formatMoney, formatPrice } from '@/lib/format';
import { colors, spacing, typography } from '@/theme/tokens';
import type { Position } from '@/types/exchange';

type PortfolioTab = 'Positions' | 'Orders' | 'History' | 'Assets';
type FundsAction = 'withdraw' | 'transfer';

const TABS: PortfolioTab[] = ['Positions', 'Orders', 'History', 'Assets'];
const ACTIONS: Array<{ label: string; icon: IconName; action: 'deposit' | FundsAction | 'history' }> = [
  { label: 'Deposit', icon: 'download', action: 'deposit' },
  { label: 'Withdraw', icon: 'upload', action: 'withdraw' },
  { label: 'Transfer', icon: 'swap', action: 'transfer' },
  { label: 'History', icon: 'clock', action: 'history' },
];

export default function PortfolioScreen() {
  const {
    totalEquity,
    cashBalance,
    fundingBalance,
    unrealizedPnl,
    positions,
    orders,
    history,
    positionPnl,
    closePosition,
    settings,
  } = useExchange();
  const [tab, setTab] = useState<PortfolioTab>('Positions');
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [depositOpen, setDepositOpen] = useState(false);
  const [fundsAction, setFundsAction] = useState<FundsAction | null>(null);
  const [closing, setClosing] = useState<Position | null>(null);

  const usedMargin = useMemo(() => positions.reduce((sum, item) => sum + item.margin, 0), [positions]);
  const realizedPnl = useMemo(() => history.reduce((sum, item) => sum + (item.pnl ?? 0), 0), [history]);
  const masked = (value: number) => balanceVisible ? formatMoney(value, settings.currency) : '••••';

  const runAction = (action: (typeof ACTIONS)[number]['action']) => {
    if (action === 'deposit') setDepositOpen(true);
    else if (action === 'history') setTab('History');
    else setFundsAction(action);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Portfolio</Text>
          <Pressable accessibilityLabel="Trade history" hitSlop={10} onPress={() => setTab('History')} style={styles.headerAction}><Icon name="clock" size={22} /></Pressable>
        </View>

        <View style={styles.balance}>
          <Pressable accessibilityLabel="Toggle balance visibility" onPress={() => setBalanceVisible((value) => !value)} style={styles.balanceLabel}>
            <Text style={styles.muted}>Total equity</Text>
            <Icon color={colors.textMuted} name={balanceVisible ? 'eye' : 'eye-off'} size={16} />
          </Pressable>
          <Text style={styles.balanceValue}>{balanceVisible ? formatMoney(totalEquity, settings.currency) : '••••••••'}</Text>
          <Text style={[styles.todayPnl, { color: unrealizedPnl >= 0 ? colors.positive : colors.negative }]}>{balanceVisible ? `${unrealizedPnl >= 0 ? '+' : ''}${formatMoney(unrealizedPnl, settings.currency)} today` : '••••'}</Text>
        </View>

        <View style={styles.summary}>
          <SummaryStat label="Available" value={masked(cashBalance)} />
          <SummaryStat label="In use" value={masked(usedMargin)} />
          <SummaryStat color={realizedPnl >= 0 ? colors.positive : colors.negative} label="Realised P&L" value={masked(realizedPnl)} />
        </View>

        <View style={styles.quickActions}>
          {ACTIONS.map((item) => (
            <Pressable accessibilityRole="button" key={item.label} onPress={() => runAction(item.action)} style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}>
              <View style={styles.quickIcon}><Icon name={item.icon} size={23} /></View>
              <Text style={styles.quickLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.tabs} horizontal showsHorizontalScrollIndicator={false}>
          {TABS.map((item) => (
            <Pressable accessibilityRole="tab" accessibilityState={{ selected: tab === item }} key={item} onPress={() => setTab(item)} style={styles.tab}>
              <Text style={[styles.tabText, tab === item && styles.tabActive]}>{item}</Text>
              {item !== 'Assets' ? <Text style={styles.tabCount}>{item === 'Positions' ? positions.length : item === 'Orders' ? orders.length : history.length}</Text> : null}
              {tab === item ? <View style={styles.tabLine} /> : null}
            </Pressable>
          ))}
        </ScrollView>

        {tab === 'Positions' ? <PositionsList onClosePosition={setClosing} /> : null}
        {tab === 'Orders' ? <OrdersList /> : null}
        {tab === 'History' ? <HistoryList /> : null}
        {tab === 'Assets' ? (
          <View style={styles.assets}>
            <AssetRow copy="Used for index orders and margin" icon="trade" label="Trading account" value={masked(cashBalance + usedMargin + unrealizedPnl)} />
            <AssetRow copy="Available for deposits and withdrawals" icon="wallet" label="Funding account" value={masked(fundingBalance)} />
          </View>
        ) : null}
      </ScrollView>

      <AddFundsSheet onClose={() => setDepositOpen(false)} visible={depositOpen} />
      <FundsActionSheet action={fundsAction} onClose={() => setFundsAction(null)} />
      <BottomSheet onClose={() => setClosing(null)} title="Close position" visible={closing !== null}>
        <Text style={styles.closeCopy}>Close the full {closing?.symbol}/POINT position at the current market price?</Text>
        <View style={styles.closeSummary}><Text style={styles.muted}>Current P&L</Text><Text style={[styles.closePnl, { color: closing && positionPnl(closing) >= 0 ? colors.positive : colors.negative }]}>{closing ? formatMoney(positionPnl(closing), settings.currency) : ''}</Text></View>
        <Pressable onPress={() => { if (closing) closePosition(closing.id); setClosing(null); }} style={({ pressed }) => [styles.dangerButton, pressed && styles.pressed]}><Text style={styles.dangerButtonText}>Confirm close</Text></Pressable>
      </BottomSheet>
    </Screen>
  );

}

function PositionsList({ onClosePosition }: { onClosePosition: (position: Position) => void }) {
  const { positions, marketFor, positionPnl, priceFor, settings } = useExchange();
  if (!positions.length) return <EmptyState copy="Positions you open will appear here." title="No open positions" />;
  return <View style={styles.list}>{positions.map((position) => {
    const market = marketFor(position.symbol);
    if (!market) return null;
    const pnl = positionPnl(position);
    const mark = priceFor(position.symbol);
    const liquidation = position.side === 'long' ? position.entryPrice * (1 - 0.9 / position.leverage) : position.entryPrice * (1 + 0.9 / position.leverage);
    return (
      <View key={position.id} style={styles.position}>
        <View style={styles.rowTop}>
          <View style={styles.marketIdentity}><MarketAvatar assetKey={market.assetKey} size={40} symbol={market.symbol} /><View><Text style={styles.symbol}>{market.symbol}<Text style={styles.quote}> / POINT</Text></Text><Text style={[styles.side, { color: position.side === 'long' ? colors.positive : colors.negative }]}>{position.side.toUpperCase()} · {position.leverage}x</Text></View></View>
          <View style={styles.pnlColumn}><Text style={[styles.pnlValue, { color: pnl >= 0 ? colors.positive : colors.negative }]}>{formatMoney(pnl, settings.currency)}</Text><Text style={styles.pnlLabel}>Unrealised P&L</Text></View>
        </View>
        <View style={styles.metrics}>
          <Metric label="Size" value={formatMoney(position.size, settings.currency)} />
          <Metric label="Entry" value={formatPrice(position.entryPrice)} />
          <Metric label="Mark" value={formatPrice(mark)} />
          <Metric label="Liq. price" value={formatPrice(liquidation)} />
        </View>
        <Pressable onPress={() => onClosePosition(position)} style={({ pressed }) => [styles.rowAction, pressed && styles.pressed]}><Text style={styles.rowActionText}>Close position</Text></Pressable>
      </View>
    );
  })}</View>;
}

function OrdersList() {
  const { orders, marketFor, cancelOrder, settings } = useExchange();
  if (!orders.length) return <EmptyState copy="Limit and stop orders will appear here." title="No open orders" />;
  return <View style={styles.list}>{orders.map((order) => {
    const market = marketFor(order.symbol);
    if (!market) return null;
    return (
      <View key={order.id} style={styles.position}>
        <View style={styles.rowTop}>
          <View style={styles.marketIdentity}><MarketAvatar assetKey={market.assetKey} size={40} symbol={market.symbol} /><View><Text style={styles.symbol}>{market.symbol}<Text style={styles.quote}> / POINT</Text></Text><Text style={[styles.side, { color: order.side === 'long' ? colors.positive : colors.negative }]}>{order.side.toUpperCase()} · {order.type.toUpperCase()}</Text></View></View>
          <Pressable onPress={() => cancelOrder(order.id)} style={styles.cancel}><Text style={styles.cancelText}>Cancel</Text></Pressable>
        </View>
        <View style={styles.metrics}>
          <Metric label="Size" value={formatMoney(order.size, settings.currency)} />
          <Metric label="Target" value={formatPrice(order.targetPrice)} />
          <Metric label="Leverage" value={`${order.leverage}x`} />
          <Metric label="Status" value="Open" />
        </View>
      </View>
    );
  })}</View>;
}

function HistoryList() {
  const { history, marketFor, settings } = useExchange();
  if (!history.length) return <EmptyState copy="Filled and closed trades will appear here." title="No trade history" />;
  return <View style={styles.historyList}>{history.map((record) => {
    const market = marketFor(record.symbol);
    if (!market) return null;
    return (
      <View key={record.id} style={styles.historyRow}>
        <MarketAvatar assetKey={market.assetKey} size={38} symbol={market.symbol} />
        <View style={styles.historyCopy}><Text style={styles.symbol}>{market.symbol}<Text style={styles.quote}> / POINT</Text></Text><Text style={styles.historyMeta}>{record.side.toUpperCase()} · {record.status.toUpperCase()} · {new Date(record.createdAt).toLocaleDateString()}</Text></View>
        <View style={styles.historyValue}><Text style={styles.historyPrice}>{formatPrice(record.price)}</Text>{record.pnl !== undefined ? <Text style={[styles.historyPnl, { color: record.pnl >= 0 ? colors.positive : colors.negative }]}>{formatMoney(record.pnl, settings.currency)}</Text> : null}</View>
      </View>
    );
  })}</View>;
}

function FundsActionSheet({ action, onClose }: { action: FundsAction | null; onClose: () => void }) {
  const { cashBalance, fundingBalance, settings, withdrawFunds, transferFunds } = useExchange();
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<'toFunding' | 'toTrading'>('toFunding');
  const [error, setError] = useState('');

  useEffect(() => {
    if (action) {
      setAmount('');
      setError('');
      setDirection('toFunding');
    }
  }, [action]);

  const available = action === 'transfer' && direction === 'toTrading' ? fundingBalance : cashBalance;
  const submit = () => {
    const parsed = Number(amount);
    const success = action === 'withdraw' ? withdrawFunds(parsed) : action === 'transfer' ? transferFunds(parsed, direction) : false;
    if (!success) {
      setError(parsed > available ? 'Amount exceeds available balance' : 'Enter a valid amount');
      return;
    }
    onClose();
  };

  return (
    <BottomSheet onClose={onClose} title={action === 'withdraw' ? 'Withdraw' : 'Transfer'} visible={action !== null}>
      {action === 'transfer' ? (
        <View style={styles.transferTabs}>
          <TransferTab active={direction === 'toFunding'} label="Trading → Funding" onPress={() => setDirection('toFunding')} />
          <TransferTab active={direction === 'toTrading'} label="Funding → Trading" onPress={() => setDirection('toTrading')} />
        </View>
      ) : null}
      <View style={styles.sheetHeading}><Text style={styles.sheetLabel}>Amount</Text><Text style={styles.sheetAvailable}>Available {formatMoney(available, settings.currency)}</Text></View>
      <View style={[styles.amountInput, Boolean(error) && styles.amountInputError]}>
        <TextInput accessibilityLabel={`${action ?? 'funds'} amount`} autoFocus keyboardType="decimal-pad" onChangeText={(value) => { setAmount(value); setError(''); }} placeholder="0.00" placeholderTextColor={colors.textFaint} selectionColor={colors.text} style={styles.amountText} value={amount} />
        <Text style={styles.amountUnit}>{settings.currency}</Text>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable onPress={() => setAmount(available.toFixed(2))} style={styles.maxAction}><Text style={styles.maxText}>Use maximum</Text></Pressable>
      <Pressable onPress={submit} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><Text style={styles.primaryButtonText}>{action === 'withdraw' ? 'Review withdrawal' : 'Confirm transfer'}</Text></Pressable>
    </BottomSheet>
  );
}

function TransferTab({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.transferTab}><Text style={[styles.transferText, active && styles.transferActive]}>{label}</Text>{active ? <View style={styles.transferLine} /> : null}</Pressable>;
}

function SummaryStat({ label, value, color = colors.text }: { label: string; value: string; color?: string }) {
  return <View style={styles.summaryStat}><Text style={styles.summaryLabel}>{label}</Text><Text numberOfLines={1} style={[styles.summaryValue, { color }]}>{value}</Text></View>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>;
}

function AssetRow({ icon, label, copy, value }: { icon: IconName; label: string; copy: string; value: string }) {
  return <View style={styles.assetRow}><View style={styles.assetIcon}><Icon name={icon} size={22} /></View><View style={styles.assetCopy}><Text style={styles.assetLabel}>{label}</Text><Text style={styles.assetMeta}>{copy}</Text></View><Text style={styles.assetValue}>{value}</Text></View>;
}

function EmptyState({ title, copy }: { title: string; copy: string }) {
  return <View style={styles.empty}><Icon color={colors.textFaint} name="positions" size={28} /><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyCopy}>{copy}</Text></View>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: 32 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 58, paddingHorizontal: spacing.page },
  title: { color: colors.text, fontFamily: typography.bold, fontSize: 25, letterSpacing: -0.5 },
  headerAction: { alignItems: 'center', height: 48, justifyContent: 'center', width: 44 },
  balance: { paddingHorizontal: spacing.page, paddingTop: 17 },
  balanceLabel: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: 7, minHeight: 24 },
  muted: { color: colors.textMuted, fontFamily: typography.regular, fontSize: 12 },
  balanceValue: { color: colors.text, fontFamily: typography.bold, fontSize: 27, fontVariant: ['tabular-nums'], letterSpacing: -0.7, marginTop: 4 },
  todayPnl: { fontFamily: typography.medium, fontSize: 12, fontVariant: ['tabular-nums'], marginTop: 6 },
  summary: { flexDirection: 'row', gap: 12, paddingHorizontal: spacing.page, paddingTop: 22 },
  summaryStat: { flex: 1, minWidth: 0 },
  summaryLabel: { color: colors.textMuted, fontFamily: typography.regular, fontSize: 10 },
  summaryValue: { fontFamily: typography.semibold, fontSize: 12, fontVariant: ['tabular-nums'], marginTop: 5 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 24, paddingTop: 27 },
  quickAction: { alignItems: 'center', minHeight: 72, width: '24%' },
  quickIcon: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 25, height: 50, justifyContent: 'center', width: 50 },
  quickLabel: { color: colors.text, fontFamily: typography.medium, fontSize: 11, marginTop: 8 },
  tabs: { gap: 25, minWidth: '100%', paddingHorizontal: spacing.page },
  tab: { alignItems: 'center', flexDirection: 'row', gap: 5, minHeight: 47, paddingBottom: 3 },
  tabText: { color: colors.textMuted, fontFamily: typography.medium, fontSize: 13 },
  tabActive: { color: colors.text, fontFamily: typography.semibold },
  tabCount: { color: colors.textFaint, fontFamily: typography.medium, fontSize: 9 },
  tabLine: { backgroundColor: colors.text, bottom: 0, height: 2, left: 0, position: 'absolute', right: 0 },
  list: { paddingHorizontal: spacing.page },
  position: { paddingBottom: 20, paddingTop: 19 },
  rowTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  marketIdentity: { alignItems: 'center', flexDirection: 'row', gap: 11 },
  symbol: { color: colors.text, fontFamily: typography.semibold, fontSize: 13 },
  quote: { color: colors.textFaint, fontFamily: typography.regular, fontSize: 9 },
  side: { fontFamily: typography.semibold, fontSize: 9, marginTop: 4 },
  pnlColumn: { alignItems: 'flex-end' },
  pnlValue: { fontFamily: typography.semibold, fontSize: 13, fontVariant: ['tabular-nums'] },
  pnlLabel: { color: colors.textFaint, fontFamily: typography.regular, fontSize: 9, marginTop: 4 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', paddingTop: 16, rowGap: 14 },
  metric: { width: '50%' },
  metricLabel: { color: colors.textFaint, fontFamily: typography.regular, fontSize: 9 },
  metricValue: { color: colors.text, fontFamily: typography.medium, fontSize: 11, fontVariant: ['tabular-nums'], marginTop: 4 },
  rowAction: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: colors.surface, borderRadius: 8, justifyContent: 'center', marginTop: 16, minHeight: 38, paddingHorizontal: 14 },
  rowActionText: { color: colors.text, fontFamily: typography.medium, fontSize: 11 },
  cancel: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 8, justifyContent: 'center', minHeight: 36, paddingHorizontal: 12 },
  cancelText: { color: colors.text, fontFamily: typography.medium, fontSize: 10 },
  historyList: { paddingHorizontal: spacing.page, paddingTop: 5 },
  historyRow: { alignItems: 'center', flexDirection: 'row', minHeight: 68 },
  historyCopy: { flex: 1, marginLeft: 10 },
  historyMeta: { color: colors.textMuted, fontFamily: typography.regular, fontSize: 9, marginTop: 4 },
  historyValue: { alignItems: 'flex-end' },
  historyPrice: { color: colors.text, fontFamily: typography.medium, fontSize: 11, fontVariant: ['tabular-nums'] },
  historyPnl: { fontFamily: typography.medium, fontSize: 10, fontVariant: ['tabular-nums'], marginTop: 4 },
  assets: { paddingHorizontal: spacing.page, paddingTop: 8 },
  assetRow: { alignItems: 'center', flexDirection: 'row', minHeight: 78 },
  assetIcon: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 21, height: 42, justifyContent: 'center', width: 42 },
  assetCopy: { flex: 1, marginLeft: 12 },
  assetLabel: { color: colors.text, fontFamily: typography.semibold, fontSize: 13 },
  assetMeta: { color: colors.textMuted, fontFamily: typography.regular, fontSize: 10, marginTop: 3 },
  assetValue: { color: colors.text, fontFamily: typography.semibold, fontSize: 12, fontVariant: ['tabular-nums'] },
  empty: { alignItems: 'center', paddingHorizontal: 40, paddingVertical: 70 },
  emptyTitle: { color: colors.text, fontFamily: typography.semibold, fontSize: 14, marginTop: 13 },
  emptyCopy: { color: colors.textMuted, fontFamily: typography.regular, fontSize: 11, marginTop: 6, textAlign: 'center' },
  closeCopy: { color: colors.text, fontFamily: typography.regular, fontSize: 13, lineHeight: 20 },
  closeSummary: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  closePnl: { fontFamily: typography.semibold, fontSize: 12, fontVariant: ['tabular-nums'] },
  dangerButton: { alignItems: 'center', backgroundColor: colors.negative, borderRadius: 10, justifyContent: 'center', marginTop: 24, minHeight: 52 },
  dangerButtonText: { color: colors.white, fontFamily: typography.semibold, fontSize: 14 },
  transferTabs: { flexDirection: 'row', gap: 25, marginBottom: 25 },
  transferTab: { justifyContent: 'center', minHeight: 42 },
  transferText: { color: colors.textMuted, fontFamily: typography.medium, fontSize: 13 },
  transferActive: { color: colors.text, fontFamily: typography.semibold },
  transferLine: { backgroundColor: colors.text, bottom: 0, height: 2, left: 0, position: 'absolute', right: 0 },
  sheetHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  sheetLabel: { color: colors.textMuted, fontFamily: typography.regular, fontSize: 12 },
  sheetAvailable: { color: colors.textFaint, fontFamily: typography.regular, fontSize: 11 },
  amountInput: { alignItems: 'center', backgroundColor: colors.surfaceRaised, borderRadius: 10, flexDirection: 'row', height: 54, paddingHorizontal: 14 },
  amountInputError: { borderColor: colors.negative, borderWidth: 1 },
  amountText: { color: colors.text, flex: 1, fontFamily: typography.semibold, fontSize: 18, fontVariant: ['tabular-nums'], padding: 0 },
  amountUnit: { color: colors.textMuted, fontFamily: typography.semibold, fontSize: 11 },
  error: { color: colors.negative, fontFamily: typography.regular, fontSize: 10, marginTop: 6 },
  maxAction: { alignSelf: 'flex-end', justifyContent: 'center', minHeight: 42 },
  maxText: { color: colors.textMuted, fontFamily: typography.medium, fontSize: 11 },
  primaryButton: { alignItems: 'center', backgroundColor: colors.text, borderRadius: 10, justifyContent: 'center', marginTop: 12, minHeight: 52 },
  primaryButtonText: { color: colors.bg, fontFamily: typography.semibold, fontSize: 14 },
  pressed: { opacity: 0.66 },
});
