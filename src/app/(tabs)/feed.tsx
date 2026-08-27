import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MarketAvatar } from '@/components/market/market-avatar';
import { Icon, type IconName } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { useExchange } from '@/context/exchange-context';
import { formatPercent, formatPrice } from '@/lib/format';
import { colors, radii, spacing, typography } from '@/theme/tokens';

type FeedTab = 'Highlights' | 'News' | 'Strategies' | 'Movers';
const TABS: FeedTab[] = ['Highlights', 'News', 'Strategies', 'Movers'];

const STORIES = [
  { kicker: 'Club & athlete news', title: 'Madrid attention holds as the European club cycle resets', symbol: 'RMD', meta: '8 min' },
  { kicker: 'Artist indices', title: 'US artist activity broadens beyond the highest-volume names', symbol: 'KDOT', meta: '21 min' },
  { kicker: 'Index & product news', title: 'AI product indices lead the latest participation expansion', symbol: 'CGPT', meta: '34 min' },
  { kicker: 'Culture news', title: 'New listings reshape the artist momentum table', symbol: 'DRK', meta: '1h' },
];

const STRATEGIES: Array<{ icon: IconName; title: string; copy: string }> = [
  { icon: 'chart', title: 'Index range & recalibration', copy: 'Read range compression against the next recalibration window.' },
  { icon: 'positions', title: 'Density strength profile', copy: 'Compare market density with price momentum before sizing a position.' },
  { icon: 'trade', title: 'Signal chain explorer', copy: 'Trace category, entity, and volume signals through one setup.' },
  { icon: 'swap', title: 'Relative-value divergence', copy: 'Track rivalry spreads without turning them into a duplicate directory market.' },
];

export default function FeedScreen() {
  const router = useRouter();
  const { markets, priceFor, changeFor } = useExchange();
  const [tab, setTab] = useState<FeedTab>('Highlights');
  const movers = useMemo(() => {
    const gains = [...markets].sort((a, b) => changeFor(b.symbol) - changeFor(a.symbol));
    const volume = [...markets].sort((a, b) => Number.parseFloat(b.volume) - Number.parseFloat(a.volume));
    const volatility = [...markets].sort((a, b) => ((b.high24h - b.low24h) / b.price) - ((a.high24h - a.low24h) / a.price));
    return { gainers: gains.slice(0, 4), losers: gains.slice(-4).reverse(), volume: volume.slice(0, 4), volatility: volatility.slice(0, 4) };
  }, [changeFor, markets]);
  const openMarket = (symbol: string) => router.push({ pathname: '/market/[symbol]', params: { symbol } });

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Feed</Text>
          <Pressable accessibilityLabel="Notification feeds" onPress={() => router.push('/settings/notifications')} style={styles.headerIcon}><Icon name="bell" size={21} /></Pressable>
        </View>

        <View style={styles.tabs}>
          {TABS.map((item) => (
            <Pressable key={item} onPress={() => setTab(item)} style={[styles.tab, tab === item && styles.tabActive]}>
              <Text style={[styles.tabText, tab === item && styles.tabTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </View>

        {tab === 'Highlights' ? (
          <>
            <SectionTitle title="Market trends" />
            {movers.gainers.slice(0, 3).map((market) => <TrendRow change={changeFor(market.symbol)} key={market.symbol} market={market} onPress={openMarket} price={priceFor(market.symbol)} />)}
            <SectionTitle action="See news" onAction={() => setTab('News')} title="Top stories" />
            {STORIES.slice(0, 3).map((story) => <StoryRow key={story.title} onPress={openMarket} story={story} market={markets.find((market) => market.symbol === story.symbol)} />)}
            <SectionTitle action="Explore" onAction={() => setTab('Strategies')} title="Index tools & strategies" />
            {STRATEGIES.slice(0, 2).map((strategy) => <StrategyRow key={strategy.title} strategy={strategy} />)}
          </>
        ) : null}

        {tab === 'News' ? (
          <>
            <SectionTitle title="Top sports news" />
            {STORIES.map((story) => <StoryRow key={story.title} onPress={openMarket} story={story} market={markets.find((market) => market.symbol === story.symbol)} />)}
            <SectionTitle title="New index listings" />
            {markets.slice().sort((a, b) => b.rank - a.rank).slice(0, 4).map((market) => <ListingRow key={market.symbol} market={market} onPress={openMarket} />)}
          </>
        ) : null}

        {tab === 'Strategies' ? (
          <>
            <SectionTitle title="Index tools & strategies" />
            {STRATEGIES.map((strategy) => <StrategyRow key={strategy.title} strategy={strategy} />)}
            <SectionTitle title="Trade ideas" />
            {movers.volatility.slice(0, 3).map((market) => <TrendRow change={changeFor(market.symbol)} key={market.symbol} market={market} onPress={openMarket} price={priceFor(market.symbol)} />)}
          </>
        ) : null}

        {tab === 'Movers' ? (
          <>
            <MoverSection changeFor={changeFor} markets={movers.gainers} onPress={openMarket} priceFor={priceFor} title="Index gainers" />
            <MoverSection changeFor={changeFor} markets={movers.losers} onPress={openMarket} priceFor={priceFor} title="Index losers" />
            <MoverSection changeFor={changeFor} markets={movers.volume} onPress={openMarket} priceFor={priceFor} title="Highest volume indices" />
            <MoverSection changeFor={changeFor} markets={movers.volatility} onPress={openMarket} priceFor={priceFor} title="Most volatile indices" />
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

type Market = ReturnType<typeof useExchange>['markets'][number];

function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>{title}</Text>{action ? <Pressable onPress={onAction}><Text style={styles.sectionAction}>{action}</Text></Pressable> : null}</View>;
}

function TrendRow({ market, price, change, onPress }: { market: Market; price: number; change: number; onPress: (symbol: string) => void }) {
  return (
    <Pressable onPress={() => onPress(market.symbol)} style={({ pressed }) => [styles.trendRow, pressed && styles.pressed]}>
      <MarketAvatar assetKey={market.assetKey} size={42} symbol={market.symbol} />
      <View style={styles.trendCopy}><Text style={styles.trendName}>{market.name}</Text><Text style={styles.trendSymbol}>{market.symbol} · ${market.volume} vol</Text></View>
      <View style={styles.trendQuote}><Text style={styles.trendPrice}>{formatPrice(price)}</Text><Text style={[styles.trendChange, { color: change >= 0 ? colors.positive : colors.negative }]}>{formatPercent(change)}</Text></View>
    </Pressable>
  );
}

function StoryRow({ story, market, onPress }: { story: typeof STORIES[number]; market?: Market; onPress: (symbol: string) => void }) {
  return (
    <Pressable disabled={!market} onPress={() => market && onPress(market.symbol)} style={({ pressed }) => [styles.storyRow, pressed && styles.pressed]}>
      {market ? <MarketAvatar assetKey={market.assetKey} size={48} symbol={market.symbol} /> : null}
      <View style={styles.storyCopy}><Text style={styles.kicker}>{story.kicker} · {story.meta}</Text><Text style={styles.storyTitle}>{story.title}</Text></View>
      <Icon color={colors.textMuted} name="chevron" size={17} />
    </Pressable>
  );
}

function StrategyRow({ strategy }: { strategy: typeof STRATEGIES[number] }) {
  return (
    <Pressable style={({ pressed }) => [styles.strategyRow, pressed && styles.pressed]}>
      <Icon name={strategy.icon} size={23} />
      <View style={styles.strategyCopy}><Text style={styles.strategyTitle}>{strategy.title}</Text><Text style={styles.strategyBody}>{strategy.copy}</Text></View>
      <Icon color={colors.textMuted} name="chevron" size={17} />
    </Pressable>
  );
}

function ListingRow({ market, onPress }: { market: Market; onPress: (symbol: string) => void }) {
  return <Pressable onPress={() => onPress(market.symbol)} style={styles.listingRow}><MarketAvatar assetKey={market.assetKey} size={38} symbol={market.symbol} /><Text style={styles.listingName}>{market.name}</Text><Text style={styles.listingTicker}>{market.symbol}</Text><Text style={styles.newPill}>New</Text></Pressable>;
}

function MoverSection({ title, markets, priceFor, changeFor, onPress }: { title: string; markets: Market[]; priceFor: (symbol: string) => number; changeFor: (symbol: string) => number; onPress: (symbol: string) => void }) {
  return <View><SectionTitle title={title} />{markets.map((market) => <TrendRow change={changeFor(market.symbol)} key={market.symbol} market={market} onPress={onPress} price={priceFor(market.symbol)} />)}</View>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
  header: { alignItems: 'center', flexDirection: 'row', height: 62, justifyContent: 'space-between', paddingHorizontal: spacing.page },
  title: { color: colors.text, fontFamily: typography.bold, fontSize: 27, letterSpacing: -0.8 },
  headerIcon: { alignItems: 'center', height: 42, justifyContent: 'center', width: 42 },
  tabs: { flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.page },
  tab: { alignItems: 'center', borderRadius: radii.pill, height: 32, justifyContent: 'center', paddingHorizontal: 14 },
  tabActive: { backgroundColor: colors.text },
  tabText: { color: colors.textMuted, fontFamily: typography.semibold, fontSize: 11 },
  tabTextActive: { color: colors.bg },
  sectionHeading: { alignItems: 'baseline', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm, marginTop: spacing.xl, paddingHorizontal: spacing.page },
  sectionTitle: { color: colors.text, fontFamily: typography.bold, fontSize: 20, letterSpacing: -0.5 },
  sectionAction: { color: colors.textMuted, fontFamily: typography.semibold, fontSize: 11 },
  trendRow: { alignItems: 'center', flexDirection: 'row', minHeight: 66, paddingHorizontal: spacing.page },
  trendCopy: { flex: 1, marginLeft: spacing.sm },
  trendName: { color: colors.text, fontFamily: typography.bold, fontSize: 14 },
  trendSymbol: { color: colors.textMuted, fontFamily: typography.mono, fontSize: 9, marginTop: 4 },
  trendQuote: { alignItems: 'flex-end' },
  trendPrice: { color: colors.text, fontFamily: typography.monoSemibold, fontSize: 11 },
  trendChange: { fontFamily: typography.monoSemibold, fontSize: 10, marginTop: 4 },
  storyRow: { alignItems: 'center', flexDirection: 'row', minHeight: 82, paddingHorizontal: spacing.page },
  storyCopy: { flex: 1, marginLeft: spacing.sm },
  kicker: { color: colors.textMuted, fontFamily: typography.semibold, fontSize: 9 },
  storyTitle: { color: colors.text, fontFamily: typography.bold, fontSize: 14, letterSpacing: -0.2, lineHeight: 18, marginTop: 4 },
  strategyRow: { alignItems: 'center', flexDirection: 'row', minHeight: 78, paddingHorizontal: spacing.page },
  strategyCopy: { flex: 1, marginLeft: spacing.md },
  strategyTitle: { color: colors.text, fontFamily: typography.bold, fontSize: 14 },
  strategyBody: { color: colors.textMuted, fontFamily: typography.family, fontSize: 10, lineHeight: 15, marginTop: 4 },
  listingRow: { alignItems: 'center', flexDirection: 'row', minHeight: 62, paddingHorizontal: spacing.page },
  listingName: { color: colors.text, flex: 1, fontFamily: typography.bold, fontSize: 14, marginLeft: spacing.sm },
  listingTicker: { color: colors.textMuted, fontFamily: typography.monoSemibold, fontSize: 9 },
  newPill: { backgroundColor: colors.surface, borderRadius: radii.pill, color: colors.text, fontFamily: typography.semibold, fontSize: 9, marginLeft: spacing.sm, overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 5 },
  pressed: { backgroundColor: colors.section },
});
