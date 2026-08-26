import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Wordmark } from '@/components/brand/wordmark';
import { IndexRow } from '@/components/market/index-row';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useInterfaceMode } from '@/context/interface-mode';
import { markets } from '@/data/market-fixtures';
import type { Market, MarketCategory } from '@/types/market';

type CategoryFilter = 'All' | MarketCategory;

const categories: readonly CategoryFilter[] = ['All', 'Clubs', 'Athletes', 'Leagues', 'Relative Value'];

interface IndicesHeaderProps {
  category: CategoryFilter;
  onCategoryChange: (category: CategoryFilter) => void;
  onQueryChange: (query: string) => void;
  query: string;
}

function IndicesHeader({ category, onCategoryChange, onQueryChange, query }: IndicesHeaderProps) {
  return (
    <>
      <View style={styles.brandLine}>
        <Wordmark />
        <Text style={styles.marketStatus}>MARKETS OPEN</Text>
      </View>
      <Text style={styles.title}>All Indices</Text>
      <Text style={styles.subtitle}>The complete Blackbook market universe.</Text>

      <View style={styles.searchShell}>
        <SymbolView
          name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
          size={20}
          tintColor={colors.textMuted}
        />
        <TextInput
          accessibilityLabel="Search all indices"
          autoCapitalize="characters"
          autoCorrect={false}
          onChangeText={onQueryChange}
          placeholder="Search ticker or index"
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          value={query}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.categoryContent}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categories}>
        {categories.map((option) => {
          const selected = option === category;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={option}
              onPress={() => onCategoryChange(option)}
              style={[styles.category, selected && styles.categorySelected]}>
              <Text style={[styles.categoryText, selected && styles.categoryTextSelected]}>{option}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.listHead}>
        <Text style={styles.listHeadText}>INDEX</Text>
        <Text style={styles.listHeadText}>VALUE / 24H</Text>
      </View>
    </>
  );
}

export default function IndicesScreen() {
  const router = useRouter();
  const { mode } = useInterfaceMode();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('All');

  const filteredMarkets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return markets.filter((market) => {
      const matchesCategory = category === 'All' || market.category === category;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        market.symbol.toLowerCase().includes(normalizedQuery) ||
        market.name.toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  const openMarket = (market: Market) => {
    router.push({ pathname: '/market/[symbol]', params: { symbol: market.symbol } });
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <FlatList
        contentContainerStyle={styles.content}
        data={filteredMarkets}
        keyExtractor={(market) => market.symbol}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<Text style={styles.empty}>No indices match this search.</Text>}
        ListHeaderComponent={
          <IndicesHeader
            category={category}
            onCategoryChange={setCategory}
            onQueryChange={setQuery}
            query={query}
          />
        }
        renderItem={({ item }) => (
          <IndexRow advanced={mode === 'advanced'} market={item} onPress={() => openMarket(item)} />
        )}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.paper,
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  brandLine: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
  },
  marketStatus: {
    color: colors.positive,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '900',
    letterSpacing: -0.9,
    marginTop: spacing.xl,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.compact,
    marginTop: spacing.xs,
  },
  searchShell: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radius.control,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: spacing.lg,
    minHeight: 50,
    paddingHorizontal: spacing.sm,
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    fontSize: typography.body,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  categories: {
    marginHorizontal: -spacing.lg,
    marginTop: spacing.md,
  },
  categoryContent: {
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  category: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: radius.control,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: spacing.md,
  },
  categorySelected: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  categoryText: {
    color: colors.textMuted,
    fontSize: typography.compact,
    fontWeight: '700',
  },
  categoryTextSelected: {
    color: colors.textOnDark,
  },
  listHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    paddingBottom: spacing.xs,
  },
  listHeadText: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.9,
  },
  empty: {
    color: colors.textMuted,
    fontSize: typography.body,
    paddingVertical: spacing.xxl,
    textAlign: 'center',
  },
});
