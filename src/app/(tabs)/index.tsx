import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AddFundsSheet } from '@/components/account/add-funds-sheet';
import { MarketRow } from '@/components/market/market-row';
import { Icon, type IconName } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { useExchange } from '@/context/exchange-context';
import { formatMoney, formatPercent } from '@/lib/format';
import { colors, layout, radii, spacing, typography } from '@/theme/tokens';

type MarketTab = 'Hot' | 'New' | 'Gainers' | 'Losers';

const MARKET_TABS: MarketTab[] = ['Hot', 'New', 'Gainers', 'Losers'];
const QUICK_ACTIONS: Array<{ label: string; icon: IconName; route?: '/(tabs)/trade' | '/(tabs)/portfolio' | '/settings/notifications' }> = [
  { label: 'Deposit', icon: 'download' },
  { label: 'Trade', icon: 'trade', route: '/(tabs)/trade' },
  { label: 'Positions', icon: 'positions', route: '/(tabs)/portfolio' },
  { label: 'Alerts', icon: 'bell', route: '/settings/notifications' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { markets, priceFor, changeFor, totalEquity, unrealizedPnl, settings } = useExchange();
  const [marketTab, setMarketTab] = useState<MarketTab>('Hot');
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [fundsOpen, setFundsOpen] = useState(false);

  const marketRows = useMemo(() => {
    const list = [...markets];
    if (marketTab === 'Hot') list.sort((a, b) => a.rank - b.rank);
    if (marketTab === 'New') list.sort((a, b) => b.rank - a.rank);
    if (marketTab === 'Gainers') list.sort((a, b) => changeFor(b.symbol) - changeFor(a.symbol));
    if (marketTab === 'Losers') list.sort((a, b) => changeFor(a.symbol) - changeFor(b.symbol));
    return list.slice(0, 5);
  }, [changeFor, marketTab, markets]);

  const openMarket = useCallback((symbol: string) => {
    router.push({ pathname: '/market/[symbol]', params: { symbol } });
  }, [router]);

  const pnlPercent = (unrealizedPnl / Math.max(totalEquity, 1)) * 100;
  const pnlCopy = `${unrealizedPnl >= 0 ? '+' : ''}${formatMoney(unrealizedPnl, settings.currency)} · ${formatPercent(pnlPercent)} today`;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Open profile"
            accessibilityRole="button"
            onPress={() => router.push('/(tabs)/profile')}
            style={({ pressed }) => [styles.profileButton, pressed && styles.pressed]}
          >
            <Icon color={colors.text} filled name="profile" size={20} />
          </Pressable>
          <Pressable
            accessibilityLabel="Search all indices"
            accessibilityRole="button"
            onPress={() => router.push('/(tabs)/indices')}
            style={({ pressed }) => [styles.search, pressed && styles.pressed]}
          >
            <Icon color={colors.textMuted} name="search" size={19} />
            <Text style={styles.searchText}>Search indices</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="Notifications"
            accessibilityRole="button"
            onPress={() => router.push('/settings/notifications')}
            style={({ pressed }) => [styles.headerAction, pressed && styles.pressed]}
          >
            <Icon name="bell" size={22} />
            <View style={styles.notificationDot} />
          </Pressable>
        </View>

        <View style={styles.balance}>
          <Pressable accessibilityLabel="Toggle balance visibility" onPress={() => setBalanceVisible((value) => !value)} style={styles.balanceLabelRow}>
            <Text style={styles.balanceLabel}>Total balance</Text>
            <Icon color={colors.textMuted} name={balanceVisible ? 'eye' : 'eye-off'} size={15} />
          </Pressable>
          <Text numberOfLines={1} style={styles.balanceValue}>{balanceVisible ? formatMoney(totalEquity, settings.currency) : '••••••••'}</Text>
          <Text style={[styles.pnl, { color: unrealizedPnl >= 0 ? colors.positive : colors.negative }]}>{balanceVisible ? pnlCopy : '••••'}</Text>
        </View>

        <View style={styles.actionRail}>
          {QUICK_ACTIONS.map((action, index) => (
            <Pressable
              accessibilityRole="button"
              key={action.label}
              onPress={() => action.route ? router.push(action.route) : setFundsOpen(true)}
              style={({ pressed }) => [styles.quickAction, index > 0 && styles.actionDivider, pressed && styles.actionPressed]}
            >
              <Icon color={colors.text} name={action.icon} size={21} />
              <Text style={styles.quickLabel}>{action.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.marketSection}>
          <View style={styles.marketHeader}>
            <View>
              <Text style={styles.sectionTitle}>Markets</Text>
              <Text style={styles.sectionCaption}>Major indices and active movers</Text>
            </View>
            <Pressable accessibilityRole="button" hitSlop={8} onPress={() => router.push('/(tabs)/indices')}>
              <Text style={styles.seeAll}>All indices</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.tabs} horizontal showsHorizontalScrollIndicator={false}>
            {MARKET_TABS.map((tab) => (
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: marketTab === tab }}
                key={tab}
                onPress={() => setMarketTab(tab)}
                style={styles.tab}
              >
                <Text style={[styles.tabText, marketTab === tab && styles.tabTextActive]}>{tab}</Text>
                {marketTab === tab ? <View style={styles.tabLine} /> : null}
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.marketList}>
            {marketRows.map((market) => (
              <MarketRow
                change={changeFor(market.symbol)}
                compact
                key={market.symbol}
                market={market}
                onPress={openMarket}
                price={priceFor(market.symbol)}
                showSparkline
              />
            ))}
          </View>
        </View>
      </ScrollView>
      <AddFundsSheet onClose={() => setFundsOpen(false)} visible={fundsOpen} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.lg },
  header: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs, height: layout.header, paddingHorizontal: spacing.page },
  profileButton: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 20, height: 40, justifyContent: 'center', width: 40 },
  search: { alignItems: 'center', backgroundColor: colors.surfaceRaised, borderRadius: radii.lg, flex: 1, flexDirection: 'row', gap: spacing.xs, height: 40, paddingHorizontal: spacing.sm },
  searchText: { color: colors.textMuted, fontFamily: typography.family, fontSize: 13, fontWeight: typography.weights.regular },
  headerAction: { alignItems: 'center', height: layout.touch, justifyContent: 'center', width: 36 },
  notificationDot: { backgroundColor: colors.negative, borderColor: colors.bg, borderRadius: 4, borderWidth: 2, height: 8, position: 'absolute', right: 1, top: 7, width: 8 },
  balance: { paddingHorizontal: spacing.page, paddingTop: spacing.lg },
  balanceLabelRow: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: spacing.xs, minHeight: 22 },
  balanceLabel: { color: colors.textMuted, fontFamily: typography.family, fontSize: 12, fontWeight: typography.weights.regular },
  balanceValue: { color: colors.text, fontFamily: typography.family, fontSize: 26, fontVariant: ['tabular-nums'], fontWeight: typography.weights.bold, letterSpacing: -0.6, marginTop: spacing.xxs },
  pnl: { fontFamily: typography.family, fontSize: 12, fontVariant: ['tabular-nums'], fontWeight: typography.weights.medium, marginTop: spacing.xs },
  actionRail: { backgroundColor: colors.section, borderColor: colors.dividerSoft, borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', height: 76, marginHorizontal: spacing.page, marginTop: spacing.lg, overflow: 'hidden' },
  quickAction: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  actionDivider: { borderLeftColor: colors.divider, borderLeftWidth: StyleSheet.hairlineWidth },
  actionPressed: { backgroundColor: colors.surfaceRaised },
  quickLabel: { color: colors.text, fontFamily: typography.family, fontSize: 10, fontWeight: typography.weights.medium, marginTop: spacing.xs },
  marketSection: { borderTopColor: colors.divider, borderTopWidth: StyleSheet.hairlineWidth, marginTop: spacing.lg, paddingTop: 20 },
  marketHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.page },
  sectionTitle: { color: colors.text, fontFamily: typography.family, fontSize: 20, fontWeight: typography.weights.bold, letterSpacing: -0.3 },
  sectionCaption: { color: colors.textFaint, fontFamily: typography.family, fontSize: 10, fontWeight: typography.weights.regular, marginTop: spacing.xxs },
  seeAll: { color: colors.textMuted, fontFamily: typography.family, fontSize: 12, fontWeight: typography.weights.medium, paddingVertical: spacing.xs },
  tabs: { borderBottomColor: colors.dividerSoft, borderBottomWidth: StyleSheet.hairlineWidth, gap: spacing.lg, marginTop: spacing.sm, paddingHorizontal: spacing.page },
  tab: { justifyContent: 'center', minHeight: 40, paddingBottom: 2 },
  tabText: { color: colors.textMuted, fontFamily: typography.family, fontSize: 13, fontWeight: typography.weights.medium },
  tabTextActive: { color: colors.text, fontWeight: typography.weights.semibold },
  tabLine: { backgroundColor: colors.text, bottom: -StyleSheet.hairlineWidth, height: 2, left: 0, position: 'absolute', right: 0 },
  marketList: { paddingHorizontal: spacing.page },
  pressed: { opacity: 0.7 },
});
