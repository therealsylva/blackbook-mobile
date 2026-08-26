import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Sparkline } from '@/components/market/sparkline';
import { ModeSwitcher } from '@/components/mode/mode-switcher';
import { OrderSheet } from '@/components/trade/order-sheet';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { formatIndexValue, formatPercent, formatSignedValue } from '@/lib/format';
import type { Market, OrderSide } from '@/types/market';

const ranges = ['1D', '5D', '1M', '3M', 'YTD', '1Y', 'All'] as const;

export function BasicTrade({ market }: { market: Market }) {
  const [range, setRange] = useState<(typeof ranges)[number]>('1D');
  const [orderSide, setOrderSide] = useState<OrderSide | null>(null);
  const movementColor = market.changePercent >= 0 ? colors.positive : colors.negative;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topLine}>
          <View>
            <Text style={styles.eyebrow}>TRADE</Text>
            <Text style={styles.title}>Simple execution</Text>
          </View>
          <ModeSwitcher />
        </View>

        <View style={styles.identityRow}>
          <View style={[styles.mark, { backgroundColor: market.color }]}>
            <Text style={styles.markText}>{market.symbol.slice(0, 3)}</Text>
          </View>
          <View style={styles.identityCopy}>
            <Text style={styles.marketName}>{market.name}</Text>
            <Text style={styles.marketMeta}>{market.symbol} · {market.status}</Text>
          </View>
        </View>

        <Text style={styles.price}>{formatIndexValue(market.price)}</Text>
        <Text style={[styles.change, { color: movementColor }]}>
          {formatSignedValue(market.change)} {formatPercent(market.changePercent)} today
        </Text>

        <View style={styles.chart}>
          <Sparkline color={movementColor} fillColor={movementColor} height={230} points={market.points} />
        </View>

        <View style={styles.rangeRow}>
          {ranges.map((option) => {
            const selected = option === range;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={option}
                onPress={() => setRange(option)}
                style={[styles.rangeOption, selected && styles.rangeOptionSelected]}>
                <Text style={[styles.rangeText, selected && styles.rangeTextSelected]}>{option}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.eventSection}>
          <Text style={styles.sectionEyebrow}>WHAT MOVED IT</Text>
          <Text style={styles.eventTitle}>{market.latestEvent}</Text>
          <Text style={styles.eventTime}>{market.latestEventTime} · verified performance event</Text>
        </View>

        <View style={styles.marketFacts}>
          <View style={styles.fact}>
            <Text style={styles.factLabel}>Band remaining</Text>
            <Text style={styles.factValue}>{market.bandRemaining.toFixed(2)}%</Text>
          </View>
          <View style={styles.fact}>
            <Text style={styles.factLabel}>Density</Text>
            <Text style={styles.factValue}>{market.density.toFixed(2)}</Text>
          </View>
          <View style={styles.fact}>
            <Text style={styles.factLabel}>Market</Text>
            <Text style={styles.factValue}>{market.status}</Text>
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
  content: {
    paddingBottom: 110,
    paddingHorizontal: spacing.lg,
  },
  topLine: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
  },
  eyebrow: {
    color: colors.textMuted,
    fontSize: typography.label,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  title: {
    color: colors.text,
    fontSize: typography.section,
    fontWeight: '800',
    marginTop: 2,
  },
  identityRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: spacing.xl,
  },
  mark: {
    alignItems: 'center',
    borderRadius: radius.control,
    height: 48,
    justifyContent: 'center',
    marginRight: spacing.sm,
    width: 48,
  },
  markText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '900',
  },
  identityCopy: {
    flex: 1,
  },
  marketName: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  marketMeta: {
    color: colors.textMuted,
    fontSize: typography.compact,
    marginTop: 3,
  },
  price: {
    color: colors.text,
    fontSize: 48,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
    letterSpacing: -1.8,
    marginTop: spacing.lg,
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
    borderTopColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
  },
  rangeOption: {
    alignItems: 'center',
    borderRadius: radius.control,
    justifyContent: 'center',
    minHeight: 38,
    minWidth: 38,
  },
  rangeOptionSelected: {
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
  eventSection: {
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.lg,
  },
  sectionEyebrow: {
    color: colors.textMuted,
    fontSize: typography.label,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  eventTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
    lineHeight: 24,
    marginTop: spacing.xs,
  },
  eventTime: {
    color: colors.textMuted,
    fontSize: typography.label,
    marginTop: spacing.xs,
  },
  marketFacts: {
    flexDirection: 'row',
    paddingVertical: spacing.lg,
  },
  fact: {
    flex: 1,
  },
  factLabel: {
    color: colors.textMuted,
    fontSize: 11,
  },
  factValue: {
    color: colors.text,
    fontSize: typography.body,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
    marginTop: 3,
  },
  actions: {
    backgroundColor: colors.paper,
    borderTopColor: colors.line,
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
    fontSize: 17,
    fontWeight: '900',
  },
});
