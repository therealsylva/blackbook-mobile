import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MarketRow } from '@/components/market/market-row';
import { PairRow } from '@/components/market/pair-row';
import { ChoiceSheet } from '@/components/ui/choice-sheet';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { useExchange } from '@/context/exchange-context';
import { MAJOR_PAIRS } from '@/data/pairs';
import { layout, radii, spacing, typography } from '@/theme/tokens';
import { useTheme } from '@/theme/theme-context';
import { createThemedStyles } from '@/theme/use-themed-styles';

type Category = 'All' | 'Pairs' | 'Clubs' | 'Leagues' | 'Athletes' | 'Artists' | 'Products';
type SortMode = 'Rank' | '24h change' | 'Volume';

const CATEGORIES: Category[] = ['All', 'Pairs', 'Clubs', 'Leagues', 'Athletes', 'Artists', 'Products'];
const SORTS: SortMode[] = ['Rank', '24h change', 'Volume'];

export default function AllIndicesScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const { markets, priceFor, changeFor } = useExchange();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('All');
  const [sortMode, setSortMode] = useState<SortMode>('Rank');
  const [sortOpen, setSortOpen] = useState(false);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (category === 'Pairs') return [];
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
            <Text style={styles.count}>{category === 'Pairs' ? `${MAJOR_PAIRS.length} major rivalries` : `${filtered.length} live markets`}</Text>
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

        {category === 'Pairs' ? (
          <View style={styles.list}>
            {MAJOR_PAIRS.map((pair) => {
              const left = marketBySymbol(pair.left);
              const right = marketBySymbol(pair.right);
              if (!left || !right) return null;
              return <PairRow change={changeFor(left.symbol) - changeFor(right.symbol)} key={pair.id} left={left} onPress={() => openMarket(left.symbol)} right={right} title={pair.title} />;
            })}
          </View>
        ) : <>
          <View style={styles.tableHeader}>
            <Text style={styles.column}>Index · volume</Text>
            <Text style={styles.column}>Price · 24h</Text>
          </View>
          <View style={styles.list}>
            {filtered.map((market) => <MarketRow change={changeFor(market.symbol)} directory key={market.symbol} market={market} onPress={openMarket} price={priceFor(market.symbol)} showVolume />)}
            {!filtered.length ? <Text style={styles.empty}>No matching indices.</Text> : null}
          </View>
        </>}
      </ScrollView>
      <ChoiceSheet onClose={() => setSortOpen(false)} onSelect={setSortMode} options={SORTS} title="Sort indices" value={sortMode} visible={sortOpen} />
    </Screen>
  );
}

const useStyles = createThemedStyles((colors) => ({
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
  tableHeader: { alignItems: 'center', flexDirection: 'row', height: 34, justifyContent: 'space-between', paddingHorizontal: spacing.page },
  column: { color: colors.textMuted, fontFamily: typography.semibold, fontSize: 10.5, letterSpacing: 0.1 },
  list: { paddingBottom: spacing.lg },
  empty: { color: colors.textMuted, fontFamily: typography.family, fontSize: 13, padding: spacing.xl, textAlign: 'center' },
  pressed: { opacity: 0.65 },
}));
