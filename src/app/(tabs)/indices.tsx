import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { MarketDefinition } from '@/data/markets';
import { MarketRow } from '@/components/market/market-row';
import { ChoiceSheet } from '@/components/ui/choice-sheet';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { useExchange } from '@/context/exchange-context';
import { colors, layout, radii, spacing, typography } from '@/theme/tokens';

type Category = 'All' | 'Sports' | 'Music' | 'People' | 'Products' | 'Relative';
type SortMode = 'Rank' | '24h change' | 'Volume';

const CATEGORIES: Category[] = ['All', 'Sports', 'Music', 'People', 'Products', 'Relative'];
const SORTS: SortMode[] = ['Rank', '24h change', 'Volume'];

function inCategory(market: MarketDefinition, category: Category) {
  if (category === 'All') return true;
  if (category === 'Sports') return ['Clubs', 'Athletes', 'Leagues'].includes(market.category);
  if (category === 'Music') return market.category === 'Artists';
  if (category === 'Products') return market.category === 'Products';
  if (category === 'People') return market.category === 'Public Figures';
  return market.category === 'Relative Value';
}

export default function AllIndicesScreen() {
  const router = useRouter();
  const { markets, favorites, toggleFavorite, priceFor, changeFor } = useExchange();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('All');
  const [sortMode, setSortMode] = useState<SortMode>('Rank');
  const [sortOpen, setSortOpen] = useState(false);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const list = markets.filter((market) => inCategory(market, category) && (!normalized || market.name.toLowerCase().includes(normalized) || market.symbol.toLowerCase().includes(normalized)));
    if (sortMode === '24h change') list.sort((a, b) => changeFor(b.symbol) - changeFor(a.symbol));
    if (sortMode === 'Volume') list.sort((a, b) => Number.parseFloat(b.volume) - Number.parseFloat(a.volume));
    if (sortMode === 'Rank') list.sort((a, b) => a.rank - b.rank);
    return list;
  }, [category, changeFor, markets, query, sortMode]);

  const openMarket = useCallback((symbol: string) => {
    router.push({ pathname: '/market/[symbol]', params: { symbol } });
  }, [router]);

  const renderMarket = useCallback(({ item }: { item: MarketDefinition }) => (
    <MarketRow
      change={changeFor(item.symbol)}
      favorite={favorites.has(item.symbol)}
      market={item}
      onFavorite={toggleFavorite}
      onPress={openMarket}
      price={priceFor(item.symbol)}
    />
  ), [changeFor, favorites, openMarket, priceFor, toggleFavorite]);

  return (
    <Screen>
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.title}>All Indices</Text>
          <Text style={styles.count}>{filtered.length} live markets</Text>
        </View>
        <Pressable
          accessibilityLabel={`Sort indices by ${sortMode}`}
          accessibilityRole="button"
          onPress={() => setSortOpen(true)}
          style={({ pressed }) => [styles.sortButton, pressed && styles.pressed]}
        >
          <Icon color={colors.text} name="filter" size={21} />
        </Pressable>
      </View>

      <View style={styles.search}>
        <Icon color={colors.textMuted} name="search" size={19} />
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setQuery}
          placeholder="Search by name or symbol"
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
          selectionColor={colors.text}
          style={styles.searchInput}
          value={query}
        />
        {query ? <Pressable accessibilityLabel="Clear search" hitSlop={10} onPress={() => setQuery('')}><Icon color={colors.textMuted} name="close" size={17} /></Pressable> : null}
      </View>

      <View style={styles.categoryRail}>
        <ScrollView contentContainerStyle={styles.categories} horizontal showsHorizontalScrollIndicator={false}>
          {CATEGORIES.map((item) => (
            <Pressable accessibilityRole="tab" accessibilityState={{ selected: category === item }} key={item} onPress={() => setCategory(item)} style={styles.category}>
              <Text style={[styles.categoryText, category === item && styles.categoryActive]}>{item}</Text>
              {category === item ? <View style={styles.categoryLine} /> : null}
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.column, styles.pair]}>Index / 24h vol</Text>
        <Text style={[styles.column, styles.priceColumn]}>Price</Text>
        <Text style={[styles.column, styles.changeColumn]}>24h</Text>
        <View style={styles.starSpacer} />
      </View>

      <FlatList
        contentContainerStyle={styles.list}
        data={filtered}
        initialNumToRender={12}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(item) => item.symbol}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyTitle}>No indices found</Text><Text style={styles.emptyCopy}>Try another name or category.</Text></View>}
        maxToRenderPerBatch={12}
        renderItem={renderMarket}
        showsVerticalScrollIndicator={false}
        windowSize={7}
      />

      <ChoiceSheet onClose={() => setSortOpen(false)} onSelect={setSortMode} options={SORTS} title="Sort indices" value={sortMode} visible={sortOpen} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleRow: { alignItems: 'center', flexDirection: 'row', height: 70, justifyContent: 'space-between', paddingHorizontal: spacing.page },
  title: { color: colors.text, fontFamily: typography.family, fontSize: 24, fontWeight: typography.weights.bold, letterSpacing: -0.5 },
  count: { color: colors.textMuted, fontFamily: typography.family, fontSize: 11, fontWeight: typography.weights.regular, marginTop: spacing.xxs },
  sortButton: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.md, height: 40, justifyContent: 'center', width: 40 },
  search: { alignItems: 'center', backgroundColor: colors.surfaceRaised, borderRadius: radii.lg, flexDirection: 'row', gap: spacing.xs, height: layout.search, marginHorizontal: spacing.page, paddingHorizontal: spacing.sm },
  searchInput: { color: colors.text, flex: 1, fontFamily: typography.family, fontSize: 13, fontWeight: typography.weights.regular, paddingVertical: 0 },
  categoryRail: { borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth, marginTop: spacing.sm },
  categories: { gap: spacing.lg, paddingHorizontal: spacing.page },
  category: { justifyContent: 'center', minHeight: 44, paddingBottom: 2 },
  categoryText: { color: colors.textMuted, fontFamily: typography.family, fontSize: 13, fontWeight: typography.weights.medium },
  categoryActive: { color: colors.text, fontWeight: typography.weights.semibold },
  categoryLine: { backgroundColor: colors.text, bottom: -StyleSheet.hairlineWidth, height: 2, left: 0, position: 'absolute', right: 0 },
  tableHeader: { alignItems: 'center', backgroundColor: colors.section, flexDirection: 'row', height: 32, paddingHorizontal: spacing.page },
  column: { color: colors.textFaint, fontFamily: typography.family, fontSize: 9, fontWeight: typography.weights.semibold, letterSpacing: 0.3, textTransform: 'uppercase' },
  pair: { flex: 1, textAlign: 'left' },
  priceColumn: { textAlign: 'right', width: 74 },
  changeColumn: { marginLeft: spacing.xs, textAlign: 'right', width: 52 },
  starSpacer: { marginLeft: spacing.xxs, width: 28 },
  list: { paddingBottom: spacing.md },
  empty: { alignItems: 'center', padding: 54 },
  emptyTitle: { color: colors.text, fontFamily: typography.family, fontSize: 15, fontWeight: typography.weights.semibold },
  emptyCopy: { color: colors.textMuted, fontFamily: typography.family, fontSize: 12, fontWeight: typography.weights.regular, marginTop: spacing.xs },
  pressed: { opacity: 0.68 },
});
