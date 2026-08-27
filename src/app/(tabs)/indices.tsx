import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { MarketDefinition } from '@/data/markets';
import { MarketRow } from '@/components/market/market-row';
import { ChoiceSheet } from '@/components/ui/choice-sheet';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { useExchange } from '@/context/exchange-context';
import { colors, spacing, typography } from '@/theme/tokens';

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
        <Pressable accessibilityLabel={`Sort indices by ${sortMode}`} onPress={() => setSortOpen(true)} style={({ pressed }) => [styles.moreButton, pressed && styles.pressed]}>
          <Icon color={colors.text} name="more" size={22} />
        </Pressable>
      </View>

      <View style={styles.search}>
        <Icon color={colors.textMuted} name="search" size={20} />
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
        {query ? <Pressable accessibilityLabel="Clear search" hitSlop={10} onPress={() => setQuery('')}><Icon color={colors.textMuted} name="close" size={18} /></Pressable> : null}
      </View>

      <ScrollView contentContainerStyle={styles.categories} horizontal showsHorizontalScrollIndicator={false}>
        {CATEGORIES.map((item) => (
          <Pressable accessibilityRole="tab" accessibilityState={{ selected: category === item }} key={item} onPress={() => setCategory(item)} style={styles.category}>
            <Text style={[styles.categoryText, category === item && styles.categoryActive]}>{item}</Text>
            {category === item ? <View style={styles.categoryLine} /> : null}
          </Pressable>
        ))}
      </ScrollView>

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
  titleRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 18, paddingHorizontal: spacing.page, paddingTop: 12 },
  title: { color: colors.text, fontFamily: typography.bold, fontSize: 27, letterSpacing: -0.7 },
  count: { color: colors.textMuted, fontFamily: typography.regular, fontSize: 12, marginTop: 3 },
  moreButton: { alignItems: 'center', height: 48, justifyContent: 'center', width: 48 },
  search: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 11, flexDirection: 'row', gap: 10, height: 48, marginHorizontal: spacing.page, paddingHorizontal: 14 },
  searchInput: { color: colors.text, flex: 1, fontFamily: typography.regular, fontSize: 14, paddingVertical: 0 },
  categories: { gap: 25, paddingHorizontal: spacing.page, paddingTop: 7 },
  category: { justifyContent: 'center', minHeight: 51, paddingBottom: 3 },
  categoryText: { color: colors.textMuted, fontFamily: typography.medium, fontSize: 14 },
  categoryActive: { color: colors.text, fontFamily: typography.semibold },
  categoryLine: { backgroundColor: colors.text, bottom: 0, height: 2, left: 0, position: 'absolute', right: 0 },
  tableHeader: { alignItems: 'center', flexDirection: 'row', height: 38, paddingHorizontal: spacing.page },
  column: { color: colors.textFaint, fontFamily: typography.semibold, fontSize: 9, letterSpacing: 0.15, textTransform: 'uppercase' },
  pair: { flex: 1.35, textAlign: 'left' },
  priceColumn: { flex: 0.76, textAlign: 'right' },
  changeColumn: { flex: 0.58, textAlign: 'right' },
  starSpacer: { marginLeft: 8, width: 22 },
  list: { paddingBottom: 18 },
  empty: { alignItems: 'center', padding: 54 },
  emptyTitle: { color: colors.text, fontFamily: typography.semibold, fontSize: 15 },
  emptyCopy: { color: colors.textMuted, fontFamily: typography.regular, fontSize: 12, marginTop: 6 },
  pressed: { opacity: 0.65 },
});

