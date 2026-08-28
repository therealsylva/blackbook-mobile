import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AddFundsSheet } from '@/components/account/add-funds-sheet';
import { MarketRow } from '@/components/market/market-row';
import { PairRow } from '@/components/market/pair-row';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { useExchange } from '@/context/exchange-context';
import { MAJOR_PAIRS } from '@/data/pairs';
import { formatMoney, formatPercent } from '@/lib/format';
import { layout, radii, spacing, typography } from '@/theme/tokens';
import { useTheme } from '@/theme/theme-context';
import { createThemedStyles } from '@/theme/use-themed-styles';

type MarketTab = 'Hot' | 'Pairs' | 'New' | 'Gainers' | 'Losers' | 'Favorites';
type FundsMode = 'deposit' | 'withdraw' | null;

const MARKET_TABS: MarketTab[] = ['Hot', 'Pairs', 'New', 'Gainers', 'Losers', 'Favorites'];

export default function HomeScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const { markets, favorites, priceFor, changeFor, totalEquity, unrealizedPnl, settings } = useExchange();
  const [marketTab, setMarketTab] = useState<MarketTab>('Hot');
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [fundsMode, setFundsMode] = useState<FundsMode>(null);

  const marketRows = useMemo(() => {
    const list = marketTab === 'Favorites' ? markets.filter((market) => favorites.has(market.symbol)) : [...markets];
    if (marketTab === 'Hot') list.sort((a, b) => a.rank - b.rank);
    if (marketTab === 'New') list.sort((a, b) => b.rank - a.rank);
    if (marketTab === 'Gainers') list.sort((a, b) => changeFor(b.symbol) - changeFor(a.symbol));
    if (marketTab === 'Losers') list.sort((a, b) => changeFor(a.symbol) - changeFor(b.symbol));
    return marketTab === 'Pairs' ? [] : list.slice(0, 6);
  }, [changeFor, favorites, marketTab, markets]);

  const openMarket = useCallback((symbol: string) => router.push({ pathname: '/market/[symbol]', params: { symbol } }), [router]);
  const marketBySymbol = useCallback((symbol: string) => markets.find((market) => market.symbol === symbol), [markets]);
  const pnlPercent = (unrealizedPnl / Math.max(totalEquity, 1)) * 100;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Open profile" onPress={() => router.push('/profile')} style={({ pressed }) => [styles.headerIcon, pressed && styles.pressed]}>
            <Icon name="profile" size={22} />
          </Pressable>
          <Text style={styles.wordmark}>BlackBook</Text>
          <Pressable accessibilityLabel="Notifications" onPress={() => router.push('/settings/notifications')} style={({ pressed }) => [styles.headerIcon, pressed && styles.pressed]}>
            <Icon name="bell" size={22} />
            <View style={styles.notificationDot} />
          </Pressable>
        </View>

        <Pressable accessibilityLabel="Search all indices" onPress={() => router.push('/(tabs)/indices')} style={({ pressed }) => [styles.search, pressed && styles.pressed]}>
          <Icon color={colors.textMuted} name="search" size={19} />
          <Text style={styles.searchText}>Search indices</Text>
        </Pressable>

        <View style={styles.balanceRow}>
          <View style={styles.balance}>
            <Pressable accessibilityLabel="Toggle balance visibility" onPress={() => setBalanceVisible((value) => !value)} style={styles.balanceLabelRow}>
              <Text style={styles.balanceLabel}>Total balance</Text>
              <Icon color={colors.textMuted} name={balanceVisible ? 'eye' : 'eye-off'} size={15} />
            </Pressable>
            <Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={styles.balanceValue}>{balanceVisible ? formatMoney(totalEquity, settings.currency) : '••••••••'}</Text>
            <Text style={[styles.pnl, { color: unrealizedPnl >= 0 ? colors.positive : colors.negative }]}>
              {balanceVisible ? `${unrealizedPnl >= 0 ? '+' : ''}${formatMoney(unrealizedPnl, settings.currency)} · ${formatPercent(pnlPercent)} today` : '••••'}
            </Text>
          </View>
          <View style={styles.fundsRail}>
            <FundsAction icon="deposit" label="Deposit" onPress={() => setFundsMode('deposit')} />
            <FundsAction icon="withdraw" label="Withdraw" onPress={() => setFundsMode('withdraw')} />
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Indices</Text>
          <Pressable hitSlop={8} onPress={() => router.push('/(tabs)/indices')} style={({ pressed }) => [styles.seeAllButton, pressed && styles.pressed]}>
            <Text style={styles.seeAll}>All indices</Text>
            <Icon name="chevron" size={13} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.tabs} horizontal showsHorizontalScrollIndicator={false}>
          {MARKET_TABS.map((tab) => (
            <Pressable accessibilityRole="tab" accessibilityState={{ selected: marketTab === tab }} key={tab} onPress={() => setMarketTab(tab)} style={[styles.tab, marketTab === tab && styles.tabActive]}>
              <Text numberOfLines={1} style={[styles.tabText, marketTab === tab && styles.tabTextActive]}>{tab}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {marketTab === 'Pairs' ? (
          <View style={styles.pairsList}>
            {MAJOR_PAIRS.map((pair) => {
              const left = marketBySymbol(pair.left);
              const right = marketBySymbol(pair.right);
              if (!left || !right) return null;
              return <PairRow change={changeFor(left.symbol) - changeFor(right.symbol)} key={pair.id} left={left} onPress={() => openMarket(left.symbol)} right={right} title={pair.title} />;
            })}
          </View>
        ) : <View style={styles.marketList}>
          {marketRows.length ? marketRows.map((market) => (
            <MarketRow change={changeFor(market.symbol)} compact key={market.symbol} market={market} onPress={openMarket} price={priceFor(market.symbol)} showSparkline />
          )) : <Text style={styles.empty}>Favorite an index from its overview to see it here.</Text>}
        </View>}
      </ScrollView>
      <AddFundsSheet mode={fundsMode ?? 'deposit'} onClose={() => setFundsMode(null)} visible={fundsMode !== null} />
    </Screen>
  );
}

function FundsAction({ icon, label, onPress }: { icon: 'deposit' | 'withdraw'; label: string; onPress: () => void }) {
  const styles = useStyles();
  return (
    <Pressable accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.fundsAction, pressed && styles.pressed]}>
      <View style={styles.fundsIcon}><Icon name={icon} size={19} /></View>
      <Text style={styles.fundsLabel}>{label}</Text>
    </Pressable>
  );
}

const useStyles = createThemedStyles((colors) => ({
  content: { paddingBottom: spacing.lg },
  header: { alignItems: 'center', flexDirection: 'row', height: layout.header, justifyContent: 'space-between', paddingHorizontal: spacing.page },
  headerIcon: { alignItems: 'center', height: 42, justifyContent: 'center', width: 42 },
  wordmark: { color: colors.text, fontFamily: typography.bold, fontSize: 20, letterSpacing: -0.8 },
  notificationDot: { backgroundColor: colors.negative, borderColor: colors.bg, borderRadius: 4, borderWidth: 2, height: 8, position: 'absolute', right: 5, top: 7, width: 8 },
  search: { alignItems: 'center', backgroundColor: colors.control, borderRadius: radii.pill, flexDirection: 'row', gap: spacing.xs, height: 42, marginHorizontal: spacing.page, marginTop: spacing.xxs, paddingHorizontal: spacing.md },
  searchText: { color: colors.textMuted, fontFamily: typography.family, fontSize: 13 },
  balanceRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.page, paddingVertical: spacing.xl },
  balance: { flex: 1, minWidth: 0, paddingRight: spacing.sm },
  balanceLabelRow: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: spacing.xs, minHeight: 22 },
  balanceLabel: { color: colors.textMuted, fontFamily: typography.medium, fontSize: 12 },
  balanceValue: { color: colors.text, fontFamily: typography.monoBold, fontSize: 29, fontVariant: ['tabular-nums', 'lining-nums'], letterSpacing: -1.2, marginTop: 3, maxWidth: '100%' },
  pnl: { fontFamily: typography.mono, fontSize: 11, fontVariant: ['tabular-nums'], marginTop: spacing.xs },
  fundsRail: { flexDirection: 'row', gap: spacing.sm },
  fundsAction: { alignItems: 'center', minWidth: 48 },
  fundsIcon: { alignItems: 'center', backgroundColor: colors.control, borderRadius: 24, height: 46, justifyContent: 'center', width: 46 },
  fundsLabel: { color: colors.text, fontFamily: typography.medium, fontSize: 9, marginTop: 5 },
  sectionHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.page },
  sectionTitle: { color: colors.text, fontFamily: typography.bold, fontSize: 22, letterSpacing: -0.55 },
  seeAllButton: { alignItems: 'center', backgroundColor: colors.control, borderRadius: radii.pill, flexDirection: 'row', gap: 2, minHeight: 32, paddingLeft: 13, paddingRight: 9 },
  seeAll: { color: colors.text, fontFamily: typography.semibold, fontSize: 11.5 },
  tabs: { gap: spacing.xs, paddingHorizontal: spacing.page, paddingVertical: spacing.md },
  tab: { alignItems: 'center', borderRadius: radii.pill, height: 34, justifyContent: 'center', paddingHorizontal: 15 },
  tabActive: { backgroundColor: colors.text },
  tabText: { color: colors.textMuted, fontFamily: typography.semibold, fontSize: 12.5 },
  tabTextActive: { color: colors.bg, fontFamily: typography.bold },
  marketList: { paddingHorizontal: spacing.page, paddingTop: spacing.xs },
  pairsList: { paddingTop: spacing.xs },
  empty: { color: colors.textMuted, fontFamily: typography.family, fontSize: 13, lineHeight: 20, paddingVertical: spacing.xl },
  pressed: { opacity: 0.65 },
}));
