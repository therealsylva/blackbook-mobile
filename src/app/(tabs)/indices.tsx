import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { MarketDefinition } from '@/data/markets';
import { MarketRow } from '@/components/market/market-row';
import { ChoiceSheet } from '@/components/ui/choice-sheet';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { useExchange } from '@/context/exchange-context';
import { colors } from '@/theme/tokens';

type Category = 'All' | 'Sports' | 'Music' | 'Products' | 'People' | 'Relative';
type SortMode = 'Rank' | '24h change' | 'Volume';

const CATEGORIES: Category[] = ['All', 'Sports', 'Music', 'Products', 'People', 'Relative'];
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
          <Text style={styles.count}>{filtered.length} markets</Text>
        </View>
        <Pressable accessibilityLabel="Sort indices" onPress={() => setSortOpen(true)} style={styles.sortButton}>
          <Icon color={colors.textMuted} name="sliders" size={19} />
          <Text style={styles.sortLabel}>{sortMode}</Text>
        </Pressable>
      </View>

      <View style={styles.search}>
        <Icon color={colors.textMuted} name="search" size={18} />
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setQuery}
          placeholder="Search by name or symbol"
          placeholderTextColor={colors.textFaint}
          returnKeyType="search"
          selectionColor={colors.accent}
          style={styles.searchInput}
          value={query}
        />
        {query ? <Pressable accessibilityLabel="Clear search" hitSlop={8} onPress={() => setQuery('')}><Icon color={colors.textMuted} name="close" size={17} /></Pressable> : null}
      </View>

      <ScrollView contentContainerStyle={styles.categories} horizontal showsHorizontalScrollIndicator={false}>
        {CATEGORIES.map((item) => (
          <Pressable key={item} onPress={() => setCategory(item)} style={styles.category}>
            <Text style={[styles.categoryText, category === item && styles.categoryActive]}>{item}</Text>
            {category === item ? <View style={styles.categoryLine} /> : null}
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.tableHeader}>
        <Text style={[styles.column, styles.pair]}>Pair</Text>
        <Text style={styles.column}>Last price</Text>
        <Text style={styles.column}>24h change</Text>
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

      <ChoiceSheet
        onClose={() => setSortOpen(false)}
        onSelect={setSortMode}
        options={SORTS}
        title="Sort markets"
        value={sortMode}
        visible={sortOpen}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 14, paddingTop: 13 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  count: { color: colors.textMuted, fontSize: 11, marginTop: 3 },
  sortButton: { alignItems: 'center', flexDirection: 'row', gap: 6, minHeight: 36 },
  sortLabel: { color: colors.textMuted, fontSize: 12 },
  search: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 6, flexDirection: 'row', gap: 9, height: 42, marginHorizontal: 16, paddingHorizontal: 12 },
  searchInput: { color: colors.text, flex: 1, fontSize: 13, paddingVertical: 0 },
  categories: { borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 10 },
  category: { justifyContent: 'center', marginHorizontal: 6, minHeight: 47, paddingHorizontal: 2 },
  categoryText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  categoryActive: { color: colors.text },
  categoryLine: { backgroundColor: colors.accent, bottom: 0, height: 2, left: 1, position: 'absolute', right: 1 },
  tableHeader: { alignItems: 'center', flexDirection: 'row', height: 36, paddingHorizontal: 16 },
  column: { color: colors.textFaint, flex: 0.65, fontSize: 9, textAlign: 'right', textTransform: 'uppercase' },
  pair: { flex: 1.3, textAlign: 'left' },
  starSpacer: { marginLeft: 8, width: 22 },
  list: { paddingBottom: 14 },
  empty: { alignItems: 'center', padding: 48 },
  emptyTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  emptyCopy: { color: colors.textMuted, fontSize: 12, marginTop: 6 },
});
