import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MarketAvatar } from '@/components/market/market-avatar';
import { MarketChart } from '@/components/market/market-chart';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { useExchange } from '@/context/exchange-context';
import { formatPercent, formatPrice } from '@/lib/format';
import { radii, spacing, typography } from '@/theme/tokens';
import { useTheme } from '@/theme/theme-context';
import { createThemedStyles } from '@/theme/use-themed-styles';
import type { ChartRange } from '@/types/exchange';

const RANGES: ChartRange[] = ['1H', '1D', '1W', '1M', '6M'];

export default function MarketOverviewScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const params = useLocalSearchParams<{ symbol?: string }>();
  const { marketFor, priceFor, changeFor, seriesFor, favorites, alerts, toggleFavorite, toggleAlert, setActiveSymbol } = useExchange();
  const symbol = Array.isArray(params.symbol) ? params.symbol[0] : params.symbol;
  const market = marketFor(symbol ?? 'RMD');
  const [range, setRange] = useState<ChartRange>('1D');

  const series = useMemo(() => market ? seriesFor(market.symbol, range) : [], [market, range, seriesFor]);
  if (!market) return <Screen><View style={styles.missing}><Text style={styles.missingText}>Index unavailable</Text></View></Screen>;

  const price = priceFor(market.symbol);
  const change = changeFor(market.symbol);
  const direction = change >= 0 ? colors.positive : colors.negative;

  const openTrade = () => {
    setActiveSymbol(market.symbol);
    router.push('/(tabs)/trade');
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Go back" hitSlop={12} onPress={() => router.back()} style={styles.headerButton}><Icon name="back" /></Pressable>
          <MarketAvatar assetKey={market.assetKey} size={46} symbol={market.symbol} />
          <View style={styles.identity}>
            <Text numberOfLines={1} style={styles.name}>{market.name}</Text>
            <Text style={styles.symbol}>{market.symbol}</Text>
          </View>
          <Pressable accessibilityLabel="Toggle price alert" onPress={() => toggleAlert(market.symbol)} style={styles.headerButton}><Icon color={alerts.has(market.symbol) ? colors.text : colors.textMuted} filled={alerts.has(market.symbol)} name="bell" size={21} /></Pressable>
          <Pressable accessibilityLabel="Toggle favorite" onPress={() => toggleFavorite(market.symbol)} style={styles.headerButton}><Icon color={favorites.has(market.symbol) ? colors.text : colors.textMuted} filled={favorites.has(market.symbol)} name="star" size={21} /></Pressable>
        </View>

        <View style={styles.quote}>
          <Text style={styles.eyebrow}>Index value</Text>
          <View style={styles.priceLine}>
            <Text style={styles.price}>{formatPrice(price)}</Text>
            <Text style={styles.unit}>POINT</Text>
          </View>
          <Text style={[styles.change, { color: direction }]}>{formatPercent(change)} · 24h</Text>
        </View>

        <View style={styles.chart}>
          <MarketChart area height={234} positive={change >= 0} series={series} strokeWidth={2} />
        </View>

        <View style={styles.ranges}>
          {RANGES.map((item) => (
            <Pressable accessibilityRole="tab" accessibilityState={{ selected: range === item }} key={item} onPress={() => setRange(item)} style={[styles.range, range === item && styles.rangeActive]}>
              <Text style={[styles.rangeText, range === item && styles.rangeTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.metrics}>
          <Metric label="24h high" value={formatPrice(market.high24h)} />
          <Metric label="24h low" value={formatPrice(market.low24h)} />
          <Metric label="24h volume" value={`$${market.volume}`} />
          <Metric label="Density" value={`${market.density}/100`} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.body}>{market.name} tracks the live attention and performance signals behind this {market.category.toLowerCase()} index.</Text>
          <View style={styles.signalLine}>
            <Text style={styles.signalLabel}>Current signal</Text>
            <Text style={[styles.signalValue, { color: direction }]}>{change >= 0 ? 'Positive momentum' : 'Negative momentum'}</Text>
          </View>
          <View style={styles.signalLine}>
            <Text style={styles.signalLabel}>Market density</Text>
            <Text style={styles.signalValue}>{market.density}/100</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable onPress={() => router.push('/(tabs)/feed')} style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}><Text style={styles.secondaryText}>News & analysis</Text></Pressable>
          <Pressable onPress={openTrade} style={({ pressed }) => [styles.tradeAction, pressed && styles.pressed]}><Text style={styles.tradeText}>Trade {market.symbol}</Text></Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>;
}

const useStyles = createThemedStyles((colors) => ({
  content: { paddingBottom: spacing.xl },
  header: { alignItems: 'center', flexDirection: 'row', minHeight: 64, paddingHorizontal: spacing.xs },
  headerButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 42 },
  identity: { flex: 1, marginLeft: spacing.sm, minWidth: 0 },
  name: { color: colors.text, fontFamily: typography.bold, fontSize: 16, letterSpacing: -0.35 },
  symbol: { color: colors.textMuted, fontFamily: typography.monoSemibold, fontSize: 11, marginTop: 3 },
  quote: { paddingHorizontal: spacing.page, paddingTop: spacing.lg },
  eyebrow: { color: colors.textMuted, fontFamily: typography.medium, fontSize: 11 },
  priceLine: { alignItems: 'baseline', flexDirection: 'row', marginTop: 2 },
  price: { color: colors.text, fontFamily: typography.monoBold, fontSize: 36, fontVariant: ['tabular-nums'], letterSpacing: -1.8 },
  unit: { color: colors.textMuted, fontFamily: typography.monoSemibold, fontSize: 11, marginLeft: 7 },
  change: { fontFamily: typography.monoSemibold, fontSize: 13, marginTop: 4 },
  chart: { marginTop: spacing.md },
  ranges: { alignSelf: 'center', backgroundColor: colors.surface, borderRadius: radii.pill, flexDirection: 'row', gap: 2, marginTop: spacing.sm, padding: 3 },
  range: { alignItems: 'center', borderRadius: radii.pill, height: 30, justifyContent: 'center', minWidth: 48, paddingHorizontal: 10 },
  rangeActive: { backgroundColor: colors.text },
  rangeText: { color: colors.textMuted, fontFamily: typography.semibold, fontSize: 11 },
  rangeTextActive: { color: colors.bg },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.lg, paddingHorizontal: spacing.page },
  metric: { backgroundColor: colors.surface, borderRadius: radii.pill, flexDirection: 'row', gap: spacing.xs, paddingHorizontal: 12, paddingVertical: 8 },
  metricLabel: { color: colors.textMuted, fontFamily: typography.medium, fontSize: 10 },
  metricValue: { color: colors.text, fontFamily: typography.monoSemibold, fontSize: 10 },
  section: { marginTop: spacing.xl, paddingHorizontal: spacing.page },
  sectionTitle: { color: colors.text, fontFamily: typography.bold, fontSize: 21, letterSpacing: -0.5 },
  body: { color: colors.textMuted, fontFamily: typography.family, fontSize: 13, lineHeight: 20, marginTop: spacing.sm },
  signalLine: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  signalLabel: { color: colors.textMuted, fontFamily: typography.medium, fontSize: 12 },
  signalValue: { color: colors.text, fontFamily: typography.monoSemibold, fontSize: 11 },
  actions: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xl, paddingHorizontal: spacing.page },
  secondaryAction: { alignItems: 'center', borderColor: colors.divider, borderRadius: radii.pill, borderWidth: 1, flex: 1, height: 44, justifyContent: 'center' },
  secondaryText: { color: colors.text, fontFamily: typography.semibold, fontSize: 12 },
  tradeAction: { alignItems: 'center', backgroundColor: colors.text, borderRadius: radii.pill, flex: 1, height: 44, justifyContent: 'center' },
  tradeText: { color: colors.bg, fontFamily: typography.bold, fontSize: 12 },
  pressed: { opacity: 0.65 },
  missing: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  missingText: { color: colors.textMuted, fontFamily: typography.medium, fontSize: 14 },
}));
