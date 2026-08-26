import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Sparkline } from '@/components/market/sparkline';
import { OrderSheet } from '@/components/trade/order-sheet';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useInterfaceMode } from '@/context/interface-mode';
import { marketBySymbol } from '@/data/market-fixtures';
import { formatCompactCurrency, formatIndexValue, formatPercent, formatSignedValue } from '@/lib/format';
import type { OrderSide } from '@/types/market';

const ranges = ['1D', '5D', '1M', '3M', 'YTD', '1Y', 'All'] as const;

export default function MarketDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ symbol?: string | string[] }>();
  const { setMode } = useInterfaceMode();
  const [range, setRange] = useState<(typeof ranges)[number]>('1D');
  const [orderSide, setOrderSide] = useState<OrderSide | null>(null);
  const symbol = Array.isArray(params.symbol) ? params.symbol[0] : params.symbol;
  const market = marketBySymbol(symbol);
  const movementColor = market.changePercent >= 0 ? colors.positive : colors.negative;

  const openAdvanced = () => {
    setMode('advanced');
    router.replace('/trade');
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Go back" accessibilityRole="button" onPress={router.back} style={styles.headerButton}>
          <SymbolView
            name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
            size={24}
            tintColor={colors.text}
          />
        </Pressable>
        <Text style={styles.headerSymbol}>{market.symbol}</Text>
        <Pressable accessibilityLabel="More index options" accessibilityRole="button" style={styles.headerButton}>
          <SymbolView
            name={{ ios: 'ellipsis', android: 'more_horiz', web: 'more_horiz' }}
            size={24}
            tintColor={colors.text}
          />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.identity}>
          <View style={[styles.mark, { backgroundColor: market.color }]}>
            <Text style={styles.markText}>{market.symbol.slice(0, 3)}</Text>
          </View>
          <View style={styles.identityCopy}>
            <Text style={styles.name}>{market.name}</Text>
            <Text style={styles.meta}>{market.category} · {market.status}</Text>
          </View>
        </View>

        <Text style={styles.price}>{formatIndexValue(market.price)}</Text>
        <Text style={[styles.change, { color: movementColor }]}>
          {formatSignedValue(market.change)} {formatPercent(market.changePercent)} today
        </Text>

        <View style={styles.chart}>
          <Sparkline color={movementColor} fillColor={movementColor} height={260} points={market.points} />
        </View>

        <View style={styles.rangeRow}>
          {ranges.map((option) => {
            const selected = range === option;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={option}
                onPress={() => setRange(option)}
                style={[styles.range, selected && styles.rangeSelected]}>
                <Text style={[styles.rangeText, selected && styles.rangeTextSelected]}>{option}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable accessibilityRole="button" onPress={openAdvanced} style={styles.advancedButton}>
          <SymbolView
            name={{ ios: 'chart.xyaxis.line', android: 'candlestick_chart', web: 'candlestick_chart' }}
            size={20}
            tintColor={colors.textOnDark}
          />
          <Text style={styles.advancedButtonText}>Open Advanced chart</Text>
        </Pressable>

        <View style={styles.eventSection}>
          <Text style={styles.eyebrow}>WHAT MOVED IT</Text>
          <Text style={styles.event}>{market.latestEvent}</Text>
          <Text style={styles.eventMeta}>{market.latestEventTime} · verified performance event</Text>
        </View>

        <View style={styles.facts}>
          <View style={styles.factRow}>
            <Text style={styles.factLabel}>24-hour notional</Text>
            <Text style={styles.factValue}>{formatCompactCurrency(market.notionalVolume)}</Text>
          </View>
          <View style={styles.factRow}>
            <Text style={styles.factLabel}>Band remaining</Text>
            <Text style={styles.factValue}>{market.bandRemaining.toFixed(2)}%</Text>
          </View>
          <View style={styles.factRow}>
            <Text style={styles.factLabel}>Density</Text>
            <Text style={styles.factValue}>{market.density.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setOrderSide('Short')}
          style={[styles.actionButton, styles.shortButton]}>
          <Text style={styles.actionText}>Short</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => setOrderSide('Long')}
          style={[styles.actionButton, styles.longButton]}>
          <Text style={styles.actionText}>Long</Text>
        </Pressable>
      </View>

      <OrderSheet market={market} onClose={() => setOrderSide(null)} side={orderSide} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.paper,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 54,
    paddingHorizontal: spacing.sm,
  },
  headerButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  headerSymbol: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  content: {
    paddingBottom: 112,
    paddingHorizontal: spacing.lg,
  },
  identity: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingTop: spacing.lg,
  },
  mark: {
    alignItems: 'center',
    borderRadius: radius.control,
    height: 52,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 52,
  },
  markText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '900',
  },
  identityCopy: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: typography.section,
    fontWeight: '800',
  },
  meta: {
    color: colors.textMuted,
    fontSize: typography.compact,
    marginTop: 3,
  },
  price: {
    color: colors.text,
    fontSize: 50,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
    letterSpacing: -1.8,
    marginTop: spacing.xl,
  },
  change: {
    fontSize: typography.body,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
    marginTop: spacing.xxs,
  },
  chart: {
    marginHorizontal: -spacing.lg,
    marginTop: spacing.xl,
  },
  rangeRow: {
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  range: {
    alignItems: 'center',
    borderRadius: radius.control,
    justifyContent: 'center',
    minHeight: 38,
    minWidth: 38,
  },
  rangeSelected: {
    backgroundColor: colors.ink,
  },
  rangeText: {
    color: colors.textMuted,
    fontSize: typography.label,
    fontWeight: '700',
  },
  rangeTextSelected: {
    color: colors.textOnDark,
  },
  advancedButton: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: radius.control,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    marginTop: spacing.lg,
    minHeight: 50,
  },
  advancedButtonText: {
    color: colors.textOnDark,
    fontSize: typography.compact,
    fontWeight: '800',
  },
  eventSection: {
    borderBottomColor: colors.line,
    paddingVertical: spacing.xl,
  },
  eyebrow: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  event: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
    lineHeight: 24,
    marginTop: spacing.xs,
  },
  eventMeta: {
    color: colors.textMuted,
    fontSize: typography.label,
    marginTop: spacing.xs,
  },
  facts: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
  },
  factRow: {
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  factLabel: {
    color: colors.textMuted,
    fontSize: typography.compact,
  },
  factValue: {
    color: colors.text,
    fontSize: typography.compact,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
  },
  actions: {
    backgroundColor: colors.paper,
    borderTopColor: colors.line,
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: 'row',
    gap: spacing.xs,
    left: 0,
    padding: spacing.md,
    position: 'absolute',
    right: 0,
  },
  actionButton: {
    alignItems: 'center',
    borderRadius: radius.control,
    flex: 1,
    justifyContent: 'center',
    minHeight: 54,
  },
  shortButton: {
    backgroundColor: colors.negative,
  },
  longButton: {
    backgroundColor: colors.positive,
  },
  actionText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '900',
  },
});
