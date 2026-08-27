import { useMemo, useState } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/screen';
import { BrandMark } from '@/components/ui/brand-mark';
import { Icon, type IconName } from '@/components/ui/icon';
import { MarketRow } from '@/components/market/market-row';
import { AddFundsSheet } from '@/components/account/add-funds-sheet';
import { useExchange } from '@/context/exchange-context';
import { formatMoney, formatPercent } from '@/lib/format';
import { colors, typography } from '@/theme/tokens';

type MarketTab = 'Favorites' | 'Hot' | 'Gainers' | 'Losers';

const QUICK_ACTIONS: Array<{ label: string; icon: IconName; route?: '/(tabs)/trade' | '/(tabs)/portfolio' | '/settings/notifications' }> = [
  { label: 'Add funds', icon: 'plus' },
  { label: 'Trade', icon: 'trade', route: '/(tabs)/trade' },
  { label: 'Positions', icon: 'positions', route: '/(tabs)/portfolio' },
  { label: 'Alerts', icon: 'bell', route: '/settings/notifications' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { markets, favorites, priceFor, changeFor, totalEquity, unrealizedPnl, settings } = useExchange();
  const [marketTab, setMarketTab] = useState<MarketTab>('Favorites');
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [fundsOpen, setFundsOpen] = useState(false);

  const marketRows = useMemo(() => {
    const list = marketTab === 'Favorites'
      ? markets.filter((market) => favorites.has(market.symbol))
      : [...markets];
    if (marketTab === 'Gainers') list.sort((a, b) => changeFor(b.symbol) - changeFor(a.symbol));
    if (marketTab === 'Losers') list.sort((a, b) => changeFor(a.symbol) - changeFor(b.symbol));
    if (marketTab === 'Hot') list.sort((a, b) => Number.parseFloat(b.volume) - Number.parseFloat(a.volume));
    return list.slice(0, 6);
  }, [changeFor, favorites, marketTab, markets]);

  const openMarket = (symbol: string) => router.push({ pathname: '/market/[symbol]', params: { symbol } });
  const pnlCopy = formatMoney(unrealizedPnl, settings.currency) + '  ' + formatPercent((unrealizedPnl / Math.max(totalEquity, 1)) * 100) + ' today';

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <BrandMark size={34} />
          <Pressable accessibilityLabel="Search indices" onPress={() => router.push('/(tabs)/indices')} style={styles.search}>
            <Icon color={colors.textMuted} name="search" size={17} />
            <Text style={styles.searchText}>Search indices</Text>
          </Pressable>
          <Pressable accessibilityLabel="Notifications" hitSlop={10} onPress={() => router.push('/settings/notifications')} style={styles.headerAction}>
            <Icon name="bell" size={21} />
            <View style={styles.notificationDot} />
          </Pressable>
        </View>

        <View style={styles.balance}>
          <Pressable hitSlop={8} onPress={() => setBalanceVisible((value) => !value)} style={styles.balanceLabelRow}>
            <Text style={styles.balanceLabel}>Total balance</Text>
            <Icon color={colors.textMuted} name={balanceVisible ? 'eye' : 'eye-off'} size={16} />
          </Pressable>
          <Text style={styles.balanceValue}>{balanceVisible ? formatMoney(totalEquity, settings.currency) : '••••••••'}</Text>
          <Text style={[styles.pnl, { color: unrealizedPnl >= 0 ? colors.positive : colors.negative }]}>
            {balanceVisible ? pnlCopy : '••••'}
          </Text>
        </View>

        <View style={styles.quickActions}>
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.label}
              onPress={() => action.route ? router.push(action.route) : setFundsOpen(true)}
              style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}
            >
              <View style={styles.quickIcon}><Icon color={colors.text} name={action.icon} size={21} /></View>
              <Text style={styles.quickLabel}>{action.label}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable onPress={() => router.push('/(tabs)/indices')} style={({ pressed }) => [styles.sessionStrip, pressed && styles.pressed]}>
          <ImageBackground imageStyle={styles.stripImage} source={require('../../../assets/market-strip.jpg')} style={styles.stripBackground}>
            <View style={styles.stripCopy}>
              <Text style={styles.stripEyebrow}>INDEX PERPETUALS</Text>
              <Text style={styles.stripTitle}>Markets are open</Text>
              <Text style={styles.stripMeta}>39 indices · continuous pricing</Text>
            </View>
            <Icon color={colors.text} name="chevron" size={20} />
          </ImageBackground>
        </Pressable>

        <View style={styles.marketHeader}>
          <Text style={styles.sectionTitle}>Markets</Text>
          <Pressable onPress={() => router.push('/(tabs)/indices')}><Text style={styles.seeAll}>View all</Text></Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
          {(['Favorites', 'Hot', 'Gainers', 'Losers'] as MarketTab[]).map((tab) => (
            <Pressable key={tab} onPress={() => setMarketTab(tab)} style={styles.tab}>
              <Text style={[styles.tabText, marketTab === tab && styles.tabTextActive]}>{tab}</Text>
              {marketTab === tab ? <View style={styles.tabLine} /> : null}
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.tableHeader}>
          <Text style={[styles.columnLabel, styles.pairColumn]}>Pair</Text>
          <Text style={styles.columnLabel}>Last price</Text>
          <Text style={styles.columnLabel}>24h change</Text>
        </View>
        {marketRows.map((market) => (
          <MarketRow
            change={changeFor(market.symbol)}
            compact
            key={market.symbol}
            market={market}
            onPress={openMarket}
            price={priceFor(market.symbol)}
          />
        ))}
      </ScrollView>
      <AddFundsSheet onClose={() => setFundsOpen(false)} visible={fundsOpen} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 24 },
  header: { alignItems: 'center', flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 10 },
  search: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 6, flex: 1, flexDirection: 'row', gap: 8, height: 36, paddingHorizontal: 12 },
  searchText: { color: colors.textMuted, fontSize: 12 },
  headerAction: { alignItems: 'center', height: 34, justifyContent: 'center', width: 28 },
  notificationDot: { backgroundColor: colors.negative, borderColor: colors.bg, borderRadius: 4, borderWidth: 1.5, height: 7, position: 'absolute', right: 1, top: 5, width: 7 },
  balance: { paddingHorizontal: 16, paddingTop: 14 },
  balanceLabelRow: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: 7 },
  balanceLabel: { color: colors.textMuted, fontSize: 12 },
  balanceValue: { color: colors.text, fontFamily: typography.mono, fontSize: 30, fontWeight: '700', letterSpacing: -1, marginTop: 7 },
  pnl: { fontFamily: typography.mono, fontSize: 12, fontWeight: '600', marginTop: 7 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 13, paddingVertical: 24 },
  quickAction: { alignItems: 'center', width: '24%' },
  quickIcon: { alignItems: 'center', backgroundColor: colors.surfaceRaised, borderRadius: 8, height: 44, justifyContent: 'center', width: 44 },
  quickLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '600', marginTop: 7 },
  sessionStrip: { marginHorizontal: 16, overflow: 'hidden' },
  stripBackground: { alignItems: 'center', backgroundColor: colors.surface, flexDirection: 'row', height: 86, justifyContent: 'space-between', paddingHorizontal: 16 },
  stripImage: { opacity: 0.28 },
  stripCopy: { flex: 1 },
  stripEyebrow: { color: colors.accent, fontSize: 9, fontWeight: '800', letterSpacing: 1.3 },
  stripTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginTop: 5 },
  stripMeta: { color: colors.textMuted, fontSize: 10, marginTop: 4 },
  marketHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 27, paddingHorizontal: 16 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  seeAll: { color: colors.accent, fontSize: 12, fontWeight: '600' },
  tabs: { borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth, marginTop: 12, paddingHorizontal: 10 },
  tab: { marginHorizontal: 6, paddingBottom: 10, paddingHorizontal: 2, paddingTop: 4 },
  tabText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: colors.text },
  tabLine: { backgroundColor: colors.accent, bottom: 0, height: 2, left: 1, position: 'absolute', right: 1 },
  tableHeader: { alignItems: 'center', flexDirection: 'row', paddingHorizontal: 16, paddingTop: 14 },
  columnLabel: { color: colors.textFaint, flex: 0.65, fontSize: 9, textAlign: 'right', textTransform: 'uppercase' },
  pairColumn: { flex: 1.3, textAlign: 'left' },
  pressed: { opacity: 0.72 },
});
