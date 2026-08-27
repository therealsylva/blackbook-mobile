import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AddFundsSheet } from '@/components/account/add-funds-sheet';
import { MarketRow } from '@/components/market/market-row';
import { Icon, type IconName } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { useExchange } from '@/context/exchange-context';
import { formatMoney, formatPercent } from '@/lib/format';
import { colors, spacing, typography } from '@/theme/tokens';

type MarketTab = 'Favorites' | 'Hot' | 'Gainers' | 'Losers';

const MARKET_TABS: MarketTab[] = ['Favorites', 'Hot', 'Gainers', 'Losers'];
const QUICK_ACTIONS: Array<{ label: string; icon: IconName; route?: '/(tabs)/trade' | '/(tabs)/portfolio' | '/settings/notifications' }> = [
  { label: 'Deposit', icon: 'download' },
  { label: 'Trade', icon: 'trade', route: '/(tabs)/trade' },
  { label: 'Positions', icon: 'chart', route: '/(tabs)/portfolio' },
  { label: 'Alerts', icon: 'bell', route: '/settings/notifications' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { markets, favorites, priceFor, changeFor, totalEquity, unrealizedPnl, settings } = useExchange();
  const [marketTab, setMarketTab] = useState<MarketTab>('Favorites');
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [fundsOpen, setFundsOpen] = useState(false);

  const marketRows = useMemo(() => {
    const list = marketTab === 'Favorites' ? markets.filter((market) => favorites.has(market.symbol)) : [...markets];
    if (marketTab === 'Gainers') list.sort((a, b) => changeFor(b.symbol) - changeFor(a.symbol));
    if (marketTab === 'Losers') list.sort((a, b) => changeFor(a.symbol) - changeFor(b.symbol));
    if (marketTab === 'Hot') list.sort((a, b) => Number.parseFloat(b.volume) - Number.parseFloat(a.volume));
    return list.slice(0, 7);
  }, [changeFor, favorites, marketTab, markets]);

  const openMarket = useCallback((symbol: string) => {
    router.push({ pathname: '/market/[symbol]', params: { symbol } });
  }, [router]);

  const pnlPercent = (unrealizedPnl / Math.max(totalEquity, 1)) * 100;
  const pnlCopy = `${unrealizedPnl >= 0 ? '+' : ''}${formatMoney(unrealizedPnl, settings.currency)} · ${formatPercent(pnlPercent)} today`;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Open profile" onPress={() => router.push('/(tabs)/profile')} style={({ pressed }) => [styles.profileButton, pressed && styles.pressed]}>
            <Icon color={colors.text} filled name="profile" size={23} />
          </Pressable>
          <Pressable accessibilityLabel="Search all indices" onPress={() => router.push('/(tabs)/indices')} style={({ pressed }) => [styles.search, pressed && styles.pressed]}>
            <Icon color={colors.textMuted} name="search" size={19} />
            <Text style={styles.searchText}>Search indices</Text>
          </Pressable>
          <Pressable accessibilityLabel="Notifications" onPress={() => router.push('/settings/notifications')} style={({ pressed }) => [styles.headerAction, pressed && styles.pressed]}>
            <Icon name="bell" size={23} />
            <View style={styles.notificationDot} />
          </Pressable>
        </View>

        <View style={styles.balance}>
          <Pressable accessibilityLabel="Toggle balance visibility" onPress={() => setBalanceVisible((value) => !value)} style={styles.balanceLabelRow}>
            <Text style={styles.balanceLabel}>Total balance</Text>
            <Icon color={colors.textMuted} name={balanceVisible ? 'eye' : 'eye-off'} size={16} />
          </Pressable>
          <Text style={styles.balanceValue}>{balanceVisible ? formatMoney(totalEquity, settings.currency) : '••••••••'}</Text>
          <Text style={[styles.pnl, { color: unrealizedPnl >= 0 ? colors.positive : colors.negative }]}>{balanceVisible ? pnlCopy : '••••'}</Text>
        </View>

        <View style={styles.quickActions}>
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              accessibilityRole="button"
              key={action.label}
              onPress={() => action.route ? router.push(action.route) : setFundsOpen(true)}
              style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}
            >
              <View style={styles.quickIcon}><Icon color={colors.text} name={action.icon} size={24} /></View>
              <Text style={styles.quickLabel}>{action.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.marketHeader}>
          <Text style={styles.sectionTitle}>Markets</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/indices')}><Text style={styles.seeAll}>View all</Text></Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.tabs} horizontal showsHorizontalScrollIndicator={false}>
          {MARKET_TABS.map((tab) => (
            <Pressable accessibilityRole="tab" accessibilityState={{ selected: marketTab === tab }} key={tab} onPress={() => setMarketTab(tab)} style={styles.tab}>
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
      </ScrollView>
      <AddFundsSheet onClose={() => setFundsOpen(false)} visible={fundsOpen} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 28 },
  header: { alignItems: 'center', flexDirection: 'row', gap: 10, paddingHorizontal: spacing.page, paddingVertical: 10 },
  profileButton: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 24, height: 48, justifyContent: 'center', width: 48 },
  search: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 11, flex: 1, flexDirection: 'row', gap: 10, height: 46, paddingHorizontal: 14 },
  searchText: { color: colors.textMuted, fontFamily: typography.regular, fontSize: 13 },
  headerAction: { alignItems: 'center', height: 48, justifyContent: 'center', width: 36 },
  notificationDot: { backgroundColor: colors.negative, borderColor: colors.bg, borderRadius: 4, borderWidth: 2, height: 8, position: 'absolute', right: 2, top: 8, width: 8 },
  balance: { paddingHorizontal: spacing.page, paddingTop: 21 },
  balanceLabelRow: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: 7, minHeight: 24 },
  balanceLabel: { color: colors.textMuted, fontFamily: typography.regular, fontSize: 13 },
  balanceValue: { color: colors.text, fontFamily: typography.bold, fontSize: 28, fontVariant: ['tabular-nums'], letterSpacing: -0.8, marginTop: 4 },
  pnl: { fontFamily: typography.medium, fontSize: 13, fontVariant: ['tabular-nums'], marginTop: 6 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 25, paddingTop: 27 },
  quickAction: { alignItems: 'center', minHeight: 74, width: '24%' },
  quickIcon: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 27, height: 54, justifyContent: 'center', width: 54 },
  quickLabel: { color: colors.text, fontFamily: typography.semibold, fontSize: 11, marginTop: 8 },
  marketHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.page },
  sectionTitle: { color: colors.text, fontFamily: typography.bold, fontSize: 20, letterSpacing: -0.3 },
  seeAll: { color: colors.textMuted, fontFamily: typography.medium, fontSize: 13, paddingVertical: 10 },
  tabs: { gap: 26, paddingHorizontal: spacing.page },
  tab: { justifyContent: 'center', minHeight: 47, paddingBottom: 3 },
  tabText: { color: colors.textMuted, fontFamily: typography.medium, fontSize: 14 },
  tabTextActive: { color: colors.text, fontFamily: typography.semibold },
  tabLine: { backgroundColor: colors.text, bottom: 0, height: 2, left: 0, position: 'absolute', right: 0 },
  marketList: { paddingHorizontal: spacing.page, paddingTop: 7 },
  pressed: { opacity: 0.68 },
});

