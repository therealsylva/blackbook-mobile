import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MarketAvatar } from '@/components/market/market-avatar';
import { MarketChart } from '@/components/market/market-chart';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { useExchange } from '@/context/exchange-context';
import { formatPercent, formatPrice } from '@/lib/format';
import { colors, spacing, typography } from '@/theme/tokens';
import type { Side } from '@/types/exchange';

type Timeframe = '1H' | '1D' | '1W' | '1M' | '6M';

const TIMEFRAMES: Timeframe[] = ['1H', '1D', '1W', '1M', '6M'];
const SCALE: Record<Timeframe, number> = { '1H': 0.26, '1D': 1, '1W': 1.35, '1M': 2.1, '6M': 3.2 };

export default function MarketDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ symbol?: string }>();
  const symbol = typeof params.symbol === 'string' ? params.symbol : 'RMD';
  const { marketFor, priceFor, changeFor, seriesFor, favorites, alerts, toggleFavorite, toggleAlert, setActiveSymbol, updateSetting } = useExchange();
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const market = marketFor(symbol) ?? marketFor('RMD');

  const series = useMemo(() => {
    const values = seriesFor(market?.symbol ?? 'RMD');
    const end = values.at(-1) ?? 0;
    return values.map((value) => end + (value - end) * SCALE[timeframe]);
  }, [market?.symbol, seriesFor, timeframe]);

  if (!market) return null;
  const price = priceFor(market.symbol);
  const change = changeFor(market.symbol);
  const positive = change >= 0;

  const openTrade = (side: Side, advanced = false) => {
    setActiveSymbol(market.symbol);
    if (advanced) {
      updateSetting('interfaceMode', 'advanced');
      router.push({ pathname: '/(tabs)/trade', params: { symbol: market.symbol, side, mode: 'advanced' } });
      return;
    }
    router.push({ pathname: '/(tabs)/trade', params: { symbol: market.symbol, side } });
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Go back" hitSlop={10} onPress={() => router.back()}><Icon name="back" size={23} /></Pressable>
        <View style={styles.identity}>
          <MarketAvatar assetKey={market.assetKey} size={38} symbol={market.symbol} />
          <View>
            <Text style={styles.symbol}>{market.symbol}/POINT</Text>
            <Text style={styles.name}>{market.name}</Text>
          </View>
        </View>
        <Pressable accessibilityLabel="Price alert" hitSlop={10} onPress={() => toggleAlert(market.symbol)}>
          <Icon color={alerts.has(market.symbol) ? colors.accent : colors.textMuted} filled={alerts.has(market.symbol)} name="bell" size={21} />
        </Pressable>
        <Pressable accessibilityLabel="Favorite" hitSlop={10} onPress={() => toggleFavorite(market.symbol)}>
          <Icon color={favorites.has(market.symbol) ? colors.accent : colors.textMuted} filled={favorites.has(market.symbol)} name="star" size={21} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastLabel}>Last price</Text>
        <Text style={styles.price}>{formatPrice(price)}</Text>
        <Text style={[styles.change, { color: positive ? colors.positive : colors.negative }]}>{formatPercent(change)} · 24h</Text>

        <View style={styles.chart}>
          <MarketChart height={224} positive={positive} series={series} />
        </View>
        <View style={styles.timeframes}>
          {TIMEFRAMES.map((item) => (
            <Pressable key={item} onPress={() => setTimeframe(item)} style={styles.timeframe}>
              <Text style={[styles.timeframeText, timeframe === item && styles.timeframeActive]}>{item}</Text>
              {timeframe === item ? <View style={styles.timeframeLine} /> : null}
            </Pressable>
          ))}
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>24h high</Text>
            <Text style={styles.statValue}>{formatPrice(market.high24h)}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>24h low</Text>
            <Text style={styles.statValue}>{formatPrice(market.low24h)}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>24h volume</Text>
            <Text style={styles.statValue}>{market.volume}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Market density</Text>
            <Text style={styles.statValue}>{market.density}/100</Text>
          </View>
        </View>

        <View style={styles.marketInfo}>
          <Text style={styles.infoTitle}>Market</Text>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Category</Text><Text style={styles.infoValue}>{market.category}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Contract</Text><Text style={styles.infoValue}>Perpetual</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Settlement</Text><Text style={styles.infoValue}>POINT</Text></View>
          <Pressable onPress={() => openTrade('long', true)} style={styles.advancedLink}>
            <Text style={styles.advancedText}>Open advanced trade</Text>
            <Icon color={colors.accent} name="chevron" size={16} />
          </Pressable>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <Pressable onPress={() => openTrade('short')} style={({ pressed }) => [styles.action, styles.short, pressed && styles.pressed]}><Text style={styles.actionText}>Short</Text></Pressable>
        <Pressable onPress={() => openTrade('long')} style={({ pressed }) => [styles.action, styles.long, pressed && styles.pressed]}><Text style={styles.actionText}>Long</Text></Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', flexDirection: 'row', gap: 14, minHeight: 62, paddingHorizontal: spacing.page },
  identity: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 10 },
  symbol: { color: colors.text, fontFamily: typography.semibold, fontSize: 14 },
  name: { color: colors.textMuted, fontFamily: typography.regular, fontSize: 10, marginTop: 2 },
  content: { paddingBottom: 20 },
  lastLabel: { color: colors.textMuted, fontFamily: typography.regular, fontSize: 11, marginTop: 22, paddingHorizontal: spacing.page },
  price: { color: colors.text, fontFamily: typography.bold, fontSize: 30, fontVariant: ['tabular-nums'], letterSpacing: -0.8, marginTop: 4, paddingHorizontal: spacing.page },
  change: { fontFamily: typography.medium, fontSize: 12, fontVariant: ['tabular-nums'], marginTop: 6, paddingHorizontal: spacing.page },
  chart: { marginTop: 12 },
  timeframes: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: spacing.page },
  timeframe: { alignItems: 'center', minWidth: 44, paddingBottom: 11, paddingTop: 7 },
  timeframeText: { color: colors.textMuted, fontFamily: typography.medium, fontSize: 11 },
  timeframeActive: { color: colors.text },
  timeframeLine: { backgroundColor: colors.accent, bottom: 0, height: 2, left: 7, position: 'absolute', right: 7 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.page, paddingTop: 22, rowGap: 18 },
  stat: { width: '50%' },
  statLabel: { color: colors.textMuted, fontFamily: typography.regular, fontSize: 11 },
  statValue: { color: colors.text, fontFamily: typography.semibold, fontSize: 14, fontVariant: ['tabular-nums'], marginTop: 5 },
  marketInfo: { marginTop: 24, paddingHorizontal: spacing.page, paddingTop: 20 },
  infoTitle: { color: colors.text, fontFamily: typography.bold, fontSize: 17, marginBottom: 9 },
  infoRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 38 },
  infoLabel: { color: colors.textMuted, fontFamily: typography.regular, fontSize: 12 },
  infoValue: { color: colors.text, fontFamily: typography.medium, fontSize: 12 },
  advancedLink: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, minHeight: 50 },
  advancedText: { color: colors.text, fontFamily: typography.semibold, fontSize: 13 },
  actions: { backgroundColor: colors.bg, borderTopColor: colors.divider, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 10, padding: 12 },
  action: { alignItems: 'center', borderRadius: 10, flex: 1, justifyContent: 'center', minHeight: 52 },
  long: { backgroundColor: colors.positive },
  short: { backgroundColor: colors.negative },
  actionText: { color: colors.white, fontFamily: typography.semibold, fontSize: 15 },
  pressed: { opacity: 0.72 },
});
