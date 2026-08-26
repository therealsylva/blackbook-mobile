import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/constants/theme';
import {
  formatCompactCurrency,
  formatIndexValue,
  formatPercent,
  formatSignedValue,
} from '@/lib/format';
import type { Market } from '@/types/market';

interface IndexRowProps {
  advanced?: boolean;
  market: Market;
  onPress?: () => void;
}

export function IndexRow({ advanced = false, market, onPress }: IndexRowProps) {
  const movementColor = market.changePercent >= 0 ? colors.positive : colors.negative;

  return (
    <Pressable
      accessibilityLabel={`${market.name}, ${formatIndexValue(market.price)}, ${formatPercent(market.changePercent)}`}
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={[styles.mark, { backgroundColor: market.color }]}>
        <Text style={styles.markText}>{market.symbol.slice(0, 3)}</Text>
      </View>

      <View style={styles.identity}>
        <View style={styles.symbolLine}>
          <Text style={styles.symbol}>{market.symbol}</Text>
          <Text style={styles.status}>{market.status}</Text>
        </View>
        <Text numberOfLines={1} style={styles.name}>
          {market.name}
        </Text>
        {advanced ? (
          <Text style={styles.advancedMeta}>
            {formatCompactCurrency(market.notionalVolume)} notional · {market.bandRemaining.toFixed(2)}% band ·{' '}
            {market.density.toFixed(2)} density
          </Text>
        ) : null}
      </View>

      <View style={styles.priceColumn}>
        <Text style={styles.price}>{formatIndexValue(market.price)}</Text>
        <Text style={[styles.change, { color: movementColor }]}>
          {formatSignedValue(market.change)} {formatPercent(market.changePercent)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: 82,
    paddingVertical: spacing.sm,
  },
  pressed: {
    opacity: 0.58,
  },
  mark: {
    alignItems: 'center',
    borderRadius: radius.control,
    height: 44,
    justifyContent: 'center',
    marginRight: spacing.sm,
    width: 44,
  },
  markText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  identity: {
    flex: 1,
    minWidth: 0,
  },
  symbolLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  symbol: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  status: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  name: {
    color: colors.textMuted,
    fontSize: typography.compact,
    marginTop: 2,
  },
  advancedMeta: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: spacing.xxs,
  },
  priceColumn: {
    alignItems: 'flex-end',
    marginLeft: spacing.sm,
  },
  price: {
    color: colors.text,
    fontSize: typography.body,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
  },
  change: {
    fontSize: typography.label,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
    marginTop: 3,
  },
});
