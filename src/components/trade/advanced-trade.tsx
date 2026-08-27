import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { CandlestickChart } from '@/components/market/candlestick-chart';
import { ModeSwitcher } from '@/components/mode/mode-switcher';
import { OrderSheet } from '@/components/trade/order-sheet';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { formatCompactCurrency, formatIndexValue, formatPercent } from '@/lib/format';
import type { Market, OrderSide } from '@/types/market';

const orderBook = [
  { price: 1185.72, size: 38, side: 'ask' },
  { price: 1185.14, size: 21, side: 'ask' },
  { price: 1184.66, size: 42, side: 'ask' },
  { price: 1184.02, size: 55, side: 'bid' },
  { price: 1183.74, size: 34, side: 'bid' },
  { price: 1183.2, size: 63, side: 'bid' },
] as const;

export function AdvancedTrade({ market }: { market: Market }) {
  const [orderSide, setOrderSide] = useState<OrderSide | null>(null);
  const movementColor = market.changePercent >= 0 ? colors.positive : colors.negative;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topLine}>
          <View>
            <Text style={styles.symbol}>{market.symbol}</Text>
            <Text numberOfLines={1} style={styles.name}>{market.name}</Text>
          </View>
          <ModeSwitcher inverse />
        </View>

        <View style={styles.priceLine}>
          <Text style={styles.price}>{formatIndexValue(market.price)}</Text>
          <Text style={[styles.change, { color: movementColor }]}>{formatPercent(market.changePercent)}</Text>
        </View>

        <View style={styles.metricLine}>
          <Text style={styles.metric}>{market.status.toUpperCase()}</Text>
          <Text style={styles.metric}>{formatCompactCurrency(market.notionalVolume)} NOTIONAL</Text>
          <Text style={styles.metric}>{market.bandRemaining.toFixed(2)}% BAND</Text>
          <Text style={styles.metric}>{market.density.toFixed(2)} DENSITY</Text>
        </View>

        <View style={styles.chartShell}>
          <CandlestickChart height={300} points={market.points} />
          <View style={styles.chartControls}>
            {['1D', '1W', '1M', '3M', '1Y', 'All'].map((range, index) => (
              <Text key={range} style={[styles.chartControl, index === 0 && styles.chartControlActive]}>{range}</Text>
            ))}
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Market depth</Text>
          <Text style={styles.sectionMeta}>NOTIONAL ONLY</Text>
        </View>
        <View style={styles.orderBook}>
          <View style={styles.orderBookHead}>
            <Text style={styles.orderBookLabel}>PRICE</Text>
            <Text style={styles.orderBookLabel}>SIZE</Text>
          </View>
          {orderBook.map((level) => (
            <View key={`${level.side}-${level.price}`} style={styles.level}>
              <Text style={[styles.levelPrice, { color: level.side === 'ask' ? colors.negative : colors.positive }]}>
                {level.price.toFixed(2)}
              </Text>
              <Text style={styles.levelSize}>${level.size}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Open positions</Text>
          <Text style={styles.sectionMeta}>1 ACTIVE</Text>
        </View>
        <View style={styles.positionRow}>
          <View>
            <Text style={styles.positionTitle}>RMD · LONG 3×</Text>
            <Text style={styles.positionMeta}>Entry 1,162.70 · Mark {formatIndexValue(market.price)}</Text>
          </View>
          <Text style={styles.positionPnl}>+$7.42</Text>
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
    backgroundColor: colors.ink,
    flex: 1,
  },
  content: {
    paddingBottom: 110,
  },
  topLine: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  symbol: {
    color: colors.textOnDark,
    fontSize: typography.section,
    fontWeight: '900',
  },
  name: {
    color: colors.textMutedOnDark,
    fontSize: typography.label,
    marginTop: 2,
    maxWidth: 160,
  },
  priceLine: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  price: {
    color: colors.textOnDark,
    fontSize: 34,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
    letterSpacing: -1,
  },
  change: {
    fontSize: typography.body,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
  },
  metricLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  metric: {
    color: colors.textMutedOnDark,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  chartShell: {
    borderBottomColor: colors.lineDark,
    borderTopColor: colors.lineDark,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.md,
  },
  chartControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chartControl: {
    color: colors.textMutedOnDark,
    fontSize: typography.label,
    fontWeight: '700',
  },
  chartControlActive: {
    color: colors.textOnDark,
  },
  sectionHeader: {
    alignItems: 'center',
    borderBottomColor: colors.lineDark,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    paddingTop: spacing.lg,
  },
  sectionTitle: {
    color: colors.textOnDark,
    fontSize: typography.body,
    fontWeight: '800',
  },
  sectionMeta: {
    color: colors.textMutedOnDark,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  orderBook: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  orderBookHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  orderBookLabel: {
    color: colors.textMutedOnDark,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  level: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 30,
  },
  levelPrice: {
    fontSize: typography.compact,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
  },
  levelSize: {
    color: colors.textOnDark,
    fontSize: typography.compact,
    fontVariant: ['tabular-nums'],
  },
  positionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  positionTitle: {
    color: colors.textOnDark,
    fontSize: typography.compact,
    fontWeight: '800',
  },
  positionMeta: {
    color: colors.textMutedOnDark,
    fontSize: 10,
    marginTop: 3,
  },
  positionPnl: {
    color: colors.positive,
    fontSize: typography.body,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
  },
  actions: {
    backgroundColor: colors.ink,
    borderTopColor: colors.lineDark,
    borderTopWidth: StyleSheet.hairlineWidth,
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
    minHeight: 52,
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
