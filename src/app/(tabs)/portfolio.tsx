import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AddFundsSheet } from '@/components/account/add-funds-sheet';
import { MarketAvatar } from '@/components/market/market-avatar';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { useExchange } from '@/context/exchange-context';
import { formatMoney, formatPrice } from '@/lib/format';
import { colors, typography } from '@/theme/tokens';
import type { Position } from '@/types/exchange';

type PortfolioTab = 'Positions' | 'Orders' | 'History';
const TABS: PortfolioTab[] = ['Positions', 'Orders', 'History'];

export default function PortfolioScreen() {
  const {
    totalEquity,
    cashBalance,
    unrealizedPnl,
    positions,
    orders,
    history,
    marketFor,
    priceFor,
    positionPnl,
    closePosition,
    cancelOrder,
    settings,
  } = useExchange();
  const [tab, setTab] = useState<PortfolioTab>('Positions');
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [fundsOpen, setFundsOpen] = useState(false);
  const [closing, setClosing] = useState<Position | null>(null);
  const usedMargin = useMemo(() => positions.reduce((sum, item) => sum + item.margin, 0), [positions]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Portfolio</Text>
          <Pressable accessibilityLabel="Add funds" onPress={() => setFundsOpen(true)} style={styles.addButton}><Icon color={colors.bg} name="plus" size={16} /><Text style={styles.addText}>Add funds</Text></Pressable>
        </View>

        <View style={styles.balance}>
          <Pressable onPress={() => setBalanceVisible((value) => !value)} style={styles.balanceLabel}>
            <Text style={styles.muted}>Total equity</Text>
            <Icon color={colors.textMuted} name={balanceVisible ? 'eye' : 'eye-off'} size={16} />
          </Pressable>
          <Text style={styles.balanceValue}>{balanceVisible ? formatMoney(totalEquity, settings.currency) : '••••••••'}</Text>
        </View>

        <View style={styles.summary}>
          <SummaryStat label="Available" value={balanceVisible ? formatMoney(cashBalance, settings.currency) : '••••'} />
          <SummaryStat color={unrealizedPnl >= 0 ? colors.positive : colors.negative} label="Unrealized P&L" value={balanceVisible ? formatMoney(unrealizedPnl, settings.currency) : '••••'} />
          <SummaryStat label="Used margin" value={balanceVisible ? formatMoney(usedMargin, settings.currency) : '••••'} />
        </View>

        <View style={styles.tabs}>
          {TABS.map((item) => (
            <Pressable key={item} onPress={() => setTab(item)} style={styles.tab}>
              <Text style={[styles.tabText, tab === item && styles.tabActive]}>{item}</Text>
              <Text style={styles.tabCount}>{item === 'Positions' ? positions.length : item === 'Orders' ? orders.length : history.length}</Text>
              {tab === item ? <View style={styles.tabLine} /> : null}
            </Pressable>
          ))}
        </View>

        {tab === 'Positions' ? (
          positions.length ? positions.map((position) => {
            const market = marketFor(position.symbol);
            const pnl = positionPnl(position);
            const mark = priceFor(position.symbol);
            const liquidation = position.side === 'long' ? position.entryPrice * (1 - 0.9 / position.leverage) : position.entryPrice * (1 + 0.9 / position.leverage);
            if (!market) return null;
            return (
              <View key={position.id} style={styles.position}>
                <View style={styles.rowTop}>
                  <View style={styles.marketIdentity}><MarketAvatar assetKey={market.assetKey} size={34} symbol={market.symbol} /><View><Text style={styles.symbol}>{market.symbol}/POINT</Text><Text style={[styles.side, { color: position.side === 'long' ? colors.positive : colors.negative }]}>{position.side.toUpperCase()} · {position.leverage}x</Text></View></View>
                  <View style={styles.pnlColumn}><Text style={[styles.pnlValue, { color: pnl >= 0 ? colors.positive : colors.negative }]}>{formatMoney(pnl, settings.currency)}</Text><Text style={styles.pnlLabel}>Unrealized P&L</Text></View>
                </View>
                <View style={styles.metrics}>
                  <Metric label="Size" value={formatMoney(position.size, settings.currency)} />
                  <Metric label="Entry" value={formatPrice(position.entryPrice)} />
                  <Metric label="Mark" value={formatPrice(mark)} />
                  <Metric label="Liq. price" value={formatPrice(liquidation)} />
                </View>
                <Pressable onPress={() => setClosing(position)} style={({ pressed }) => [styles.rowAction, pressed && styles.pressed]}><Text style={styles.rowActionText}>Close position</Text></Pressable>
              </View>
            );
          }) : <EmptyState copy="Positions you open will appear here." title="No open positions" />
        ) : null}

        {tab === 'Orders' ? (
          orders.length ? orders.map((order) => {
            const market = marketFor(order.symbol);
            if (!market) return null;
            return (
              <View key={order.id} style={styles.order}>
                <View style={styles.rowTop}>
                  <View style={styles.marketIdentity}><MarketAvatar assetKey={market.assetKey} size={34} symbol={market.symbol} /><View><Text style={styles.symbol}>{market.symbol}/POINT</Text><Text style={[styles.side, { color: order.side === 'long' ? colors.positive : colors.negative }]}>{order.side.toUpperCase()} · {order.type.toUpperCase()}</Text></View></View>
                  <Pressable onPress={() => cancelOrder(order.id)} style={styles.cancel}><Text style={styles.cancelText}>Cancel</Text></Pressable>
                </View>
                <View style={styles.metrics}>
                  <Metric label="Size" value={formatMoney(order.size, settings.currency)} />
                  <Metric label="Target price" value={formatPrice(order.targetPrice)} />
                  <Metric label="Leverage" value={String(order.leverage) + 'x'} />
                  <Metric label="Status" value="Open" />
                </View>
              </View>
            );
          }) : <EmptyState copy="Limit and stop orders will appear here." title="No open orders" />
        ) : null}

        {tab === 'History' ? (
          history.length ? history.map((record) => {
            const market = marketFor(record.symbol);
            if (!market) return null;
            return (
              <View key={record.id} style={styles.historyRow}>
                <MarketAvatar assetKey={market.assetKey} size={32} symbol={market.symbol} />
                <View style={styles.historyCopy}><Text style={styles.symbol}>{market.symbol}/POINT</Text><Text style={styles.historyMeta}>{record.side.toUpperCase()} · {record.status.toUpperCase()} · {new Date(record.createdAt).toLocaleDateString()}</Text></View>
                <View style={styles.historyValue}><Text style={styles.historyPrice}>{formatPrice(record.price)}</Text>{record.pnl !== undefined ? <Text style={[styles.historyPnl, { color: record.pnl >= 0 ? colors.positive : colors.negative }]}>{formatMoney(record.pnl, settings.currency)}</Text> : null}</View>
              </View>
            );
          }) : <EmptyState copy="Filled and closed trades will appear here." title="No trade history" />
        ) : null}
      </ScrollView>

      <AddFundsSheet onClose={() => setFundsOpen(false)} visible={fundsOpen} />
      <BottomSheet onClose={() => setClosing(null)} title="Close position" visible={closing !== null}>
        <Text style={styles.closeCopy}>Close the full {closing?.symbol}/POINT position at the current market price?</Text>
        <View style={styles.closeSummary}><Text style={styles.muted}>Current P&L</Text><Text style={[styles.closePnl, { color: closing && positionPnl(closing) >= 0 ? colors.positive : colors.negative }]}>{closing ? formatMoney(positionPnl(closing), settings.currency) : ''}</Text></View>
        <Pressable onPress={() => { if (closing) closePosition(closing.id); setClosing(null); }} style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}><Text style={styles.closeButtonText}>Confirm close</Text></Pressable>
      </BottomSheet>
    </Screen>
  );
}

function SummaryStat({ label, value, color = colors.text }: { label: string; value: string; color?: string }) {
  return <View style={styles.summaryStat}><Text style={styles.summaryLabel}>{label}</Text><Text style={[styles.summaryValue, { color }]}>{value}</Text></View>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>;
}

function EmptyState({ title, copy }: { title: string; copy: string }) {
  return <View style={styles.empty}><Icon color={colors.textFaint} name="positions" size={28} /><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyCopy}>{copy}</Text></View>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: 28 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 13 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  addButton: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: 5, flexDirection: 'row', gap: 5, height: 34, paddingHorizontal: 11 },
  addText: { color: colors.bg, fontSize: 11, fontWeight: '800' },
  balance: { paddingHorizontal: 16, paddingTop: 25 },
  balanceLabel: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: 7 },
  muted: { color: colors.textMuted, fontSize: 11 },
  balanceValue: { color: colors.text, fontFamily: typography.mono, fontSize: 30, fontWeight: '700', letterSpacing: -1, marginTop: 7 },
  summary: { borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 22, paddingTop: 20 },
  summaryStat: { flex: 1 },
  summaryLabel: { color: colors.textMuted, fontSize: 9 },
  summaryValue: { fontFamily: typography.mono, fontSize: 11, fontWeight: '700', marginTop: 6 },
  tabs: { borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', paddingHorizontal: 10 },
  tab: { alignItems: 'center', flexDirection: 'row', gap: 5, marginHorizontal: 6, minHeight: 48, paddingHorizontal: 2 },
  tabText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  tabActive: { color: colors.text },
  tabCount: { color: colors.textFaint, fontSize: 9 },
  tabLine: { backgroundColor: colors.accent, bottom: 0, height: 2, left: 1, position: 'absolute', right: 1 },
  position: { borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth, padding: 16 },
  order: { borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth, padding: 16 },
  rowTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  marketIdentity: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  symbol: { color: colors.text, fontSize: 13, fontWeight: '800' },
  side: { fontSize: 9, fontWeight: '800', marginTop: 4 },
  pnlColumn: { alignItems: 'flex-end' },
  pnlValue: { fontFamily: typography.mono, fontSize: 13, fontWeight: '700' },
  pnlLabel: { color: colors.textFaint, fontSize: 9, marginTop: 4 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', paddingTop: 16, rowGap: 15 },
  metric: { width: '50%' },
  metricLabel: { color: colors.textFaint, fontSize: 9 },
  metricValue: { color: colors.text, fontFamily: typography.mono, fontSize: 11, fontWeight: '600', marginTop: 4 },
  rowAction: { alignItems: 'center', borderColor: colors.divider, borderRadius: 4, borderWidth: 1, justifyContent: 'center', marginTop: 16, minHeight: 38 },
  rowActionText: { color: colors.text, fontSize: 11, fontWeight: '700' },
  cancel: { borderColor: colors.divider, borderRadius: 4, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 7 },
  cancelText: { color: colors.text, fontSize: 10, fontWeight: '700' },
  historyRow: { alignItems: 'center', borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 67, paddingHorizontal: 16 },
  historyCopy: { flex: 1, marginLeft: 10 },
  historyMeta: { color: colors.textMuted, fontSize: 9, marginTop: 4 },
  historyValue: { alignItems: 'flex-end' },
  historyPrice: { color: colors.text, fontFamily: typography.mono, fontSize: 11 },
  historyPnl: { fontFamily: typography.mono, fontSize: 10, marginTop: 4 },
  empty: { alignItems: 'center', paddingHorizontal: 40, paddingVertical: 70 },
  emptyTitle: { color: colors.text, fontSize: 14, fontWeight: '700', marginTop: 13 },
  emptyCopy: { color: colors.textMuted, fontSize: 11, marginTop: 6, textAlign: 'center' },
  closeCopy: { color: colors.text, fontSize: 13, lineHeight: 20 },
  closeSummary: { borderTopColor: colors.divider, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', marginTop: 17, paddingTop: 15 },
  closePnl: { fontFamily: typography.mono, fontSize: 12, fontWeight: '700' },
  closeButton: { alignItems: 'center', backgroundColor: colors.negative, borderRadius: 6, justifyContent: 'center', marginTop: 22, minHeight: 50 },
  closeButtonText: { color: colors.white, fontSize: 14, fontWeight: '800' },
  pressed: { opacity: 0.7 },
});
