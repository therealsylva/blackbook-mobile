import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { MarketDefinition } from '@/data/markets';
import { MarketAvatar } from '@/components/market/market-avatar';
import { MarketRow } from '@/components/market/market-row';
import { ChoiceSheet } from '@/components/ui/choice-sheet';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { useExchange } from '@/context/exchange-context';
import { formatPercent } from '@/lib/format';
import { colors, layout, radii, spacing, typography } from '@/theme/tokens';

type Category = 'All' | 'Clubs' | 'Leagues' | 'Athletes' | 'Artists' | 'Products';
type SortMode = 'Rank' | '24h change' | 'Volume';

const CATEGORIES: Category[] = ['All', 'Clubs', 'Leagues', 'Athletes', 'Artists', 'Products'];
const SORTS: SortMode[] = ['Rank', '24h change', 'Volume'];
const PAIRS = [
  { title: 'El Clásico', left: 'RMD', right: 'BAR' },
  { title: 'Manchester derby', left: 'MCI', right: 'MUN' },
  { title: 'NBA rivalry', left: 'LAL', right: 'BOS' },
];

export default function AllIndicesScreen() {
  const router = useRouter();
  const { markets, priceFor, changeFor } = useExchange();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('All');
  const [sortMode, setSortMode] = useState<SortMode>('Rank');
  const [sortOpen, setSortOpen] = useState(false);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const list = markets.filter((market) => (category === 'All' || market.category === category) && (!normalized || market.name.toLowerCase().includes(normalized) || market.symbol.toLowerCase().includes(normalized)));
    if (sortMode === '24h change') list.sort((a, b) => changeFor(b.symbol) - changeFor(a.symbol));
    if (sortMode === 'Volume') list.sort((a, b) => Number.parseFloat(b.volume) - Number.parseFloat(a.volume));
    if (sortMode === 'Rank') list.sort((a, b) => a.rank - b.rank);
    return list;
  }, [category, changeFor, markets, query, sortMode]);

  const openMarket = useCallback((symbol: string) => router.push({ pathname: '/market/[symbol]', params: { symbol } }), [router]);
  const marketBySymbol = useCallback((symbol: string) => markets.find((market) => market.symbol === symbol), [markets]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>All indices</Text>
            <Text style={styles.count}>{filtered.length} live markets</Text>
          </View>
          <Pressable accessibilityLabel={`Sort indices by ${sortMode}`} onPress={() => setSortOpen(true)} style={({ pressed }) => [styles.sortButton, pressed && styles.pressed]}>
            <Icon name="filter" size={20} />
          </Pressable>
        </View>

        <View style={styles.search}>
          <Icon color={colors.textMuted} name="search" size={19} />
          <TextInput autoCapitalize="none" autoCorrect={false} onChangeText={setQuery} placeholder="Search by name or ticker" placeholderTextColor={colors.textMuted} returnKeyType="search" selectionColor={colors.text} style={styles.searchInput} value={query} />
          {query ? <Pressable accessibilityLabel="Clear search" hitSlop={10} onPress={() => setQuery('')}><Icon color={colors.textMuted} name="close" size={17} /></Pressable> : null}
        </View>

        <ScrollView contentContainerStyle={styles.categories} horizontal showsHorizontalScrollIndicator={false}>
          {CATEGORIES.map((item) => (
            <Pressable accessibilityRole="tab" accessibilityState={{ selected: category === item }} key={item} onPress={() => setCategory(item)} style={[styles.category, category === item && styles.categoryActive]}>
              <Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.tableHeader}>
          <Text style={[styles.column, styles.indexColumn]}>Index</Text>
          <Text style={[styles.column, styles.priceColumn]}>Price</Text>
          <Text style={[styles.column, styles.changeColumn]}>24h</Text>
          <Text style={[styles.column, styles.volumeColumn]}>Vol</Text>
        </View>

        <View style={styles.list}>
          {filtered.map((market) => <MarketRow change={changeFor(market.symbol)} key={market.symbol} market={market} onPress={openMarket} price={priceFor(market.symbol)} showVolume />)}
          {!filtered.length ? <Text style={styles.empty}>No matching indices.</Text> : null}
        </View>

        {!query && category === 'All' ? (
          <View style={styles.pairsSection}>
            <View style={styles.pairsHeading}>
              <Text style={styles.pairsTitle}>Major pairs</Text>
              <Text style={styles.pairsMeta}>Rivalry spread</Text>
            </View>
            {PAIRS.map((pair) => {
              const left = marketBySymbol(pair.left);
              const right = marketBySymbol(pair.right);
              if (!left || !right) return null;
              return <PairRow change={changeFor(left.symbol) - changeFor(right.symbol)} key={pair.title} left={left} onPress={openMarket} right={right} title={pair.title} />;
            })}
          </View>
        ) : null}
      </ScrollView>
      <ChoiceSheet onClose={() => setSortOpen(false)} onSelect={setSortMode} options={SORTS} title="Sort indices" value={sortMode} visible={sortOpen} />
    </Screen>
  );
}

function PairRow({ title, left, right, change, onPress }: { title: string; left: MarketDefinition; right: MarketDefinition; change: number; onPress: (symbol: string) => void }) {
  return (
    <Pressable onPress={() => onPress(left.symbol)} style={({ pressed }) => [styles.pairRow, pressed && styles.pressed]}>
      <View style={styles.pairMarks}>
        <MarketAvatar assetKey={left.assetKey} size={38} symbol={left.symbol} />
        <View style={styles.overlap}><MarketAvatar assetKey={right.assetKey} size={38} symbol={right.symbol} /></View>
      </View>
      <View style={styles.pairCopy}>
        <Text style={styles.pairTitle}>{title}</Text>
        <Text style={styles.pairTickers}>{left.symbol} · {right.symbol}</Text>
      </View>
      <Text style={[styles.pairChange, { color: change >= 0 ? colors.positive : colors.negative }]}>{formatPercent(change)}</Text>
      <Icon color={colors.textMuted} name="chevron" size={17} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
  titleRow: { alignItems: 'center', flexDirection: 'row', height: 72, justifyContent: 'space-between', paddingHorizontal: spacing.page },
  title: { color: colors.text, fontFamily: typography.bold, fontSize: 27, letterSpacing: -0.8 },
  count: { color: colors.textMuted, fontFamily: typography.family, fontSize: 11, marginTop: 3 },
  sortButton: { alignItems: 'center', height: 42, justifyContent: 'center', width: 42 },
  search: { alignItems: 'center', backgroundColor: colors.control, borderRadius: radii.pill, flexDirection: 'row', gap: spacing.xs, height: layout.search, marginHorizontal: spacing.page, paddingHorizontal: spacing.md },
  searchInput: { color: colors.text, flex: 1, fontFamily: typography.family, fontSize: 13, paddingVertical: 0 },
  categories: { gap: spacing.xs, paddingHorizontal: spacing.page, paddingVertical: spacing.md },
  category: { alignItems: 'center', borderRadius: radii.pill, height: 32, justifyContent: 'center', paddingHorizontal: 14 },
  categoryActive: { backgroundColor: colors.text },
  categoryText: { color: colors.textMuted, fontFamily: typography.semibold, fontSize: 12 },
  categoryTextActive: { color: colors.bg },
  tableHeader: { alignItems: 'center', flexDirection: 'row', height: 28, paddingHorizontal: spacing.page },
  column: { color: colors.textFaint, fontFamily: typography.semibold, fontSize: 9, letterSpacing: 0.15 },
  indexColumn: { flex: 1 },
  priceColumn: { textAlign: 'right', width: 76 },
  changeColumn: { marginLeft: 8, textAlign: 'right', width: 54 },
  volumeColumn: { marginLeft: 8, textAlign: 'right', width: 48 },
  list: { paddingBottom: spacing.lg },
  empty: { color: colors.textMuted, fontFamily: typography.family, fontSize: 13, padding: spacing.xl, textAlign: 'center' },
  pairsSection: { paddingHorizontal: spacing.page, paddingTop: spacing.md },
  pairsHeading: { alignItems: 'baseline', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  pairsTitle: { color: colors.text, fontFamily: typography.bold, fontSize: 21, letterSpacing: -0.5 },
  pairsMeta: { color: colors.textMuted, fontFamily: typography.medium, fontSize: 11 },
  pairRow: { alignItems: 'center', flexDirection: 'row', minHeight: 68 },
  pairMarks: { flexDirection: 'row', width: 66 },
  overlap: { marginLeft: -10 },
  pairCopy: { flex: 1 },
  pairTitle: { color: colors.text, fontFamily: typography.semibold, fontSize: 14 },
  pairTickers: { color: colors.textMuted, fontFamily: typography.mono, fontSize: 10, marginTop: 3 },
  pairChange: { fontFamily: typography.monoSemibold, fontSize: 11, marginRight: spacing.xs },
  pressed: { opacity: 0.65 },
});
