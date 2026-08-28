import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { MarketAvatar } from '@/components/market/market-avatar';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { useExchange } from '@/context/exchange-context';
import { formatMoney, formatPercent, formatPrice } from '@/lib/format';
import { radii, spacing, typography } from '@/theme/tokens';
import { useTheme } from '@/theme/theme-context';
import { createThemedStyles } from '@/theme/use-themed-styles';
import type { OpenOrder, Position, TradeRecord } from '@/types/exchange';

type PortfolioTab = 'Positions' | 'Orders' | 'Journal';

export default function PortfolioScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { cashBalance, usedMargin, totalEquity, unrealizedPnl, positions, orders, history, settings } = useExchange();
  const [tab, setTab] = useState<PortfolioTab>('Positions');
  const counts = { Positions: positions.length, Orders: orders.length, Journal: history.length };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}><Text style={styles.title}>Portfolio</Text></View>

        <View style={styles.equity}>
          <Text style={styles.eyebrow}>Total equity</Text>
          <Text style={styles.equityValue}>{formatMoney(totalEquity, settings.currency)}</Text>
          <Text style={[styles.today, { color: unrealizedPnl >= 0 ? colors.positive : colors.negative }]}>{unrealizedPnl >= 0 ? '+' : ''}{formatMoney(unrealizedPnl, settings.currency)} today</Text>
          <View style={styles.balanceMetrics}>
            <BalanceMetric label="Available" value={formatMoney(cashBalance, settings.currency)} />
            <BalanceMetric label="In use" value={formatMoney(usedMargin, settings.currency)} />
          </View>
        </View>

        <View style={styles.tabs}>
          {(['Positions', 'Orders', 'Journal'] as const).map((item) => (
            <Pressable key={item} onPress={() => setTab(item)} style={[styles.tab, tab === item && styles.tabActive]}>
              <Text style={[styles.tabText, tab === item && styles.tabTextActive]}>{item}</Text>
              <View style={[styles.tabBadge, tab === item && styles.tabBadgeActive]}><Text style={[styles.tabCount, tab === item && styles.tabCountActive]}>{counts[item]}</Text></View>
            </Pressable>
          ))}
        </View>

        <View style={styles.list}>
          {tab === 'Positions' ? <PositionsList /> : null}
          {tab === 'Orders' ? <OrdersList /> : null}
          {tab === 'Journal' ? <JournalList /> : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

function BalanceMetric({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  return <View style={styles.balanceMetric}><Text style={styles.balanceLabel}>{label}</Text><Text style={styles.balanceValue}>{value}</Text></View>;
}

function PositionsList() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { positions, marketFor, priceFor, positionPnl, closePosition, settings } = useExchange();
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const toggle = (id: string) => setExpanded((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });

  if (!positions.length) return <Empty title="No open positions" />;
  return <>{positions.map((position) => {
    const market = marketFor(position.symbol); if (!market) return null;
    const pnl = positionPnl(position); const current = priceFor(position.symbol); const open = expanded.has(position.id);
    const pnlPercent = (pnl / Math.max(position.margin, 1)) * 100;
    return (
      <View key={position.id} style={styles.item}>
        <Pressable onPress={() => toggle(position.id)} style={({ pressed }) => [styles.itemMain, pressed && styles.pressed]}>
          <MarketAvatar assetKey={market.assetKey} size={42} symbol={market.symbol} />
          <View style={styles.itemCopy}>
            <View style={styles.itemTitleLine}><Text numberOfLines={1} style={styles.itemTitle}>{market.name}</Text><Text style={styles.ticker}>{market.symbol}</Text></View>
            <Text style={[styles.sideMeta, { color: position.side === 'long' ? colors.positive : colors.negative }]}>{position.side === 'long' ? 'Long' : 'Short'} · {position.leverage}x</Text>
          </View>
          <View style={styles.itemQuote}>
            <Text style={[styles.pnl, { color: pnl >= 0 ? colors.positive : colors.negative }]}>{pnl >= 0 ? '+' : ''}{formatMoney(pnl, settings.currency)}</Text>
            <Text style={[styles.contextMove, { color: pnl >= 0 ? colors.positive : colors.negative }]}>{formatPercent(pnlPercent)}</Text>
          </View>
          <Icon color={colors.textMuted} name="chevron" size={17} />
        </Pressable>
        <View style={styles.priceContext}>
          <Text style={styles.context}>Entry <Text style={styles.contextValue}>{formatPrice(position.entryPrice)}</Text></Text>
          <Icon color={colors.textFaint} name="chevron" size={13} />
          <Text style={styles.context}>Current <Text style={styles.contextValue}>{formatPrice(current)}</Text></Text>
        </View>
        {open ? (
          <View style={styles.details}>
            <Detail label="Position size" value={formatMoney(position.size, settings.currency)} />
            <Detail label="Margin" value={formatMoney(position.margin, settings.currency)} />
            <Detail label="Opened" value={formatAge(position.openedAt)} />
            <Pressable onPress={() => closePosition(position.id)} style={styles.outlineButton}><Text style={styles.outlineButtonText}>Close position</Text></Pressable>
          </View>
        ) : null}
      </View>
    );
  })}</>;
}

function OrdersList() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { orders, marketFor, priceFor, cancelOrder, settings } = useExchange();
  if (!orders.length) return <Empty title="No open orders" />;
  return <>{orders.map((order: OpenOrder) => {
    const market = marketFor(order.symbol); if (!market) return null;
    const current = priceFor(order.symbol);
    const distance = ((order.targetPrice - current) / current) * 100;
    return (
      <View key={order.id} style={styles.item}>
        <View style={styles.itemMain}>
          <MarketAvatar assetKey={market.assetKey} size={42} symbol={market.symbol} />
          <View style={styles.itemCopy}>
            <View style={styles.itemTitleLine}><Text numberOfLines={1} style={styles.itemTitle}>{market.name}</Text><Text style={styles.ticker}>{market.symbol}</Text></View>
            <Text style={[styles.sideMeta, { color: order.side === 'long' ? colors.positive : colors.negative }]}>{order.side === 'long' ? 'Long' : 'Short'} · {order.type} · {order.leverage}x</Text>
            <View style={styles.orderNumbers}>
              <Text style={styles.context}>Target <Text style={styles.contextValue}>{formatPrice(order.targetPrice)}</Text></Text>
              <Text style={styles.context}>Current <Text style={styles.contextValue}>{formatPrice(current)}</Text></Text>
            </View>
            <Text style={styles.orderMeta}>{formatMoney(order.size, settings.currency)} · placed {formatAge(order.createdAt)}</Text>
          </View>
          <View style={styles.orderQuote}>
            <Text style={[styles.distance, { color: distance >= 0 ? colors.positive : colors.negative }]}>{distance >= 0 ? '+' : ''}{distance.toFixed(2)}%</Text>
            <Pressable onPress={() => cancelOrder(order.id)} style={styles.cancel}><Text style={styles.cancelText}>Cancel</Text></Pressable>
          </View>
        </View>
      </View>
    );
  })}</>;
}

function JournalList() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { history, marketFor, settings } = useExchange();
  if (!history.length) return <Empty title="No journal entries" />;
  return <>{history.map((record: TradeRecord, index) => {
    const market = marketFor(record.symbol); if (!market) return null;
    const prior = history[index - 1];
    const showDate = !prior || new Date(prior.createdAt).toDateString() !== new Date(record.createdAt).toDateString();
    return (
      <View key={record.id}>
        {showDate ? <Text style={styles.dateHeading}>{formatDate(record.createdAt)}</Text> : null}
        <View style={styles.journalRow}>
          <View style={[styles.timelineDot, { backgroundColor: record.pnl === undefined ? colors.textMuted : record.pnl >= 0 ? colors.positive : colors.negative }]} />
          <View style={styles.journalCopy}>
            <Text style={styles.journalTitle}>{journalTitle(record, market.name)}</Text>
            <Text style={styles.journalDetail}>{record.side === 'long' ? 'Long' : 'Short'} · {record.leverage}x · {formatMoney(record.size, settings.currency)}</Text>
            <Text style={styles.journalDetail}>{formatPrice(record.entryPrice)}{record.exitPrice ? ` → ${formatPrice(record.exitPrice)}` : ''} · fee {formatMoney(record.fee, settings.currency)}</Text>
          </View>
          {record.pnl !== undefined ? <Text style={[styles.journalPnl, { color: record.pnl >= 0 ? colors.positive : colors.negative }]}>{record.pnl >= 0 ? '+' : ''}{formatMoney(record.pnl, settings.currency)}</Text> : null}
        </View>
      </View>
    );
  })}</>;
}

function Detail({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  return <View style={styles.detail}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>;
}

function Empty({ title }: { title: string }) {
  const styles = useStyles();
  return <View style={styles.empty}><Text style={styles.emptyText}>{title}</Text></View>;
}

function journalTitle(record: TradeRecord, name: string) {
  if (record.event === 'closed') return `Closed ${name}`;
  if (record.event === 'cancelled') return `Cancelled ${name} order`;
  if (record.event === 'opened') return `Opened ${name}`;
  return `${name} order filled`;
}

function formatAge(timestamp: number) {
  const minutes = Math.max(1, Math.round((Date.now() - timestamp) / 60_000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`;
}

function formatDate(timestamp: number) {
  const date = new Date(timestamp);
  if (date.toDateString() === new Date().toDateString()) return 'Today';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const useStyles = createThemedStyles((colors) => ({
  content: { paddingBottom: spacing.xl },
  header: { justifyContent: 'center', minHeight: 64, paddingHorizontal: spacing.page },
  title: { color: colors.text, fontFamily: typography.bold, fontSize: 27, letterSpacing: -0.8 },
  equity: { backgroundColor: colors.section, borderBottomColor: colors.dividerSoft, borderBottomWidth: 1, borderTopColor: colors.dividerSoft, borderTopWidth: 1, paddingHorizontal: spacing.page, paddingVertical: spacing.lg },
  eyebrow: { color: colors.textMuted, fontFamily: typography.semibold, fontSize: 11.5 },
  equityValue: { color: colors.text, fontFamily: typography.monoBold, fontSize: 36, fontVariant: ['tabular-nums', 'lining-nums'], letterSpacing: -1.7, marginTop: 4 },
  today: { fontFamily: typography.monoSemibold, fontSize: 11.5, fontVariant: ['tabular-nums'], marginTop: spacing.xs },
  balanceMetrics: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.lg },
  balanceMetric: { minWidth: 100 },
  balanceLabel: { color: colors.textMuted, fontFamily: typography.semibold, fontSize: 10.5 },
  balanceValue: { color: colors.text, fontFamily: typography.monoSemibold, fontSize: 12.5, fontVariant: ['tabular-nums'], marginTop: 4 },
  tabs: { backgroundColor: colors.control, borderRadius: radii.pill, flexDirection: 'row', gap: 3, marginHorizontal: spacing.page, marginTop: spacing.lg, padding: 3 },
  tab: { alignItems: 'center', borderRadius: radii.pill, flex: 1, flexDirection: 'row', gap: 6, justifyContent: 'center', minHeight: 38 },
  tabActive: { backgroundColor: colors.surfaceRaised },
  tabText: { color: colors.textMuted, fontFamily: typography.semibold, fontSize: 12.5 },
  tabTextActive: { color: colors.text },
  tabBadge: { alignItems: 'center', backgroundColor: colors.surfaceRaised, borderRadius: radii.pill, height: 18, justifyContent: 'center', minWidth: 18, paddingHorizontal: 5 },
  tabBadgeActive: { backgroundColor: colors.text },
  tabCount: { color: colors.textMuted, fontFamily: typography.monoSemibold, fontSize: 9 },
  tabCountActive: { color: colors.bg },
  list: { paddingHorizontal: spacing.page, paddingTop: spacing.sm },
  item: { borderBottomColor: colors.dividerSoft, borderBottomWidth: 1, paddingVertical: spacing.md },
  itemMain: { alignItems: 'center', flexDirection: 'row', minHeight: 48 },
  itemCopy: { flex: 1, marginLeft: spacing.sm, minWidth: 0 },
  itemTitleLine: { alignItems: 'baseline', flexDirection: 'row', gap: spacing.xs },
  itemTitle: { color: colors.text, flexShrink: 1, fontFamily: typography.bold, fontSize: 15.5, letterSpacing: -0.35 },
  ticker: { color: colors.textMuted, fontFamily: typography.monoSemibold, fontSize: 9 },
  sideMeta: { fontFamily: typography.monoSemibold, fontSize: 10.5, marginTop: 4, textTransform: 'capitalize' },
  itemQuote: { alignItems: 'flex-end', marginRight: spacing.xs },
  pnl: { fontFamily: typography.monoBold, fontSize: 12.5, fontVariant: ['tabular-nums'], letterSpacing: -0.3 },
  contextMove: { fontFamily: typography.monoSemibold, fontSize: 10.5, fontVariant: ['tabular-nums'], marginTop: 3 },
  context: { color: colors.textMuted, fontFamily: typography.semibold, fontSize: 10 },
  contextValue: { color: colors.text, fontFamily: typography.monoSemibold, fontVariant: ['tabular-nums'] },
  priceContext: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs, marginLeft: 54, marginTop: spacing.sm },
  details: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, marginLeft: 54, marginTop: spacing.md },
  detail: { minWidth: 84 },
  detailLabel: { color: colors.textMuted, fontFamily: typography.medium, fontSize: 9 },
  detailValue: { color: colors.text, fontFamily: typography.monoSemibold, fontSize: 11, marginTop: 4 },
  outlineButton: { alignItems: 'center', borderColor: colors.divider, borderRadius: radii.pill, borderWidth: 1, height: 34, justifyContent: 'center', paddingHorizontal: spacing.md },
  outlineButtonText: { color: colors.text, fontFamily: typography.semibold, fontSize: 10 },
  cancel: { alignItems: 'center', borderColor: colors.divider, borderRadius: radii.pill, borderWidth: 1, height: 32, justifyContent: 'center', paddingHorizontal: spacing.md },
  cancelText: { color: colors.text, fontFamily: typography.semibold, fontSize: 10 },
  orderNumbers: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.sm },
  orderQuote: { alignItems: 'flex-end', alignSelf: 'stretch', justifyContent: 'space-between', marginLeft: spacing.sm },
  distance: { fontFamily: typography.monoSemibold, fontSize: 10.5, fontVariant: ['tabular-nums'] },
  orderMeta: { color: colors.textMuted, fontFamily: typography.mono, fontSize: 9, marginTop: spacing.xs },
  dateHeading: { color: colors.textMuted, fontFamily: typography.semibold, fontSize: 11, marginBottom: spacing.sm, marginTop: spacing.md },
  journalRow: { flexDirection: 'row', minHeight: 84 },
  timelineDot: { borderRadius: 4, height: 8, marginRight: spacing.sm, marginTop: 7, width: 8 },
  journalCopy: { flex: 1 },
  journalTitle: { color: colors.text, fontFamily: typography.bold, fontSize: 14 },
  journalDetail: { color: colors.textMuted, fontFamily: typography.mono, fontSize: 9, marginTop: 5 },
  journalPnl: { fontFamily: typography.monoSemibold, fontSize: 11 },
  empty: { alignItems: 'center', paddingVertical: 64 },
  emptyText: { color: colors.textMuted, fontFamily: typography.medium, fontSize: 13 },
  pressed: { opacity: 0.65 },
}));
