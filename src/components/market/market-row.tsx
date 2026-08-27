import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MarketDefinition } from '@/data/markets';
import { formatPercent, formatPrice } from '@/lib/format';
import { colors, layout, typography } from '@/theme/tokens';
import { Icon } from '@/components/ui/icon';
import { MarketAvatar } from './market-avatar';
import { MarketChart } from './market-chart';

interface MarketRowProps {
  market: MarketDefinition;
  price: number;
  change: number;
  favorite?: boolean;
  onFavorite?: (symbol: string) => void;
  onPress: (symbol: string) => void;
  compact?: boolean;
  showSparkline?: boolean;
}

function MarketRowComponent({ market, price, change, favorite, onFavorite, onPress, compact = false, showSparkline = false }: MarketRowProps) {
  const direction = change >= 0 ? colors.positive : colors.negative;
  return (
    <View style={[styles.row, compact && styles.compactRow]}>
      <Pressable
        accessibilityLabel={`${market.name}, ${formatPrice(price)}, ${formatPercent(change)}`}
        accessibilityRole="button"
        onPress={() => onPress(market.symbol)}
        style={({ pressed }) => [styles.marketAction, pressed && styles.pressed]}
      >
        <View style={styles.identity}>
          <MarketAvatar assetKey={market.assetKey} size={compact ? 38 : layout.entity} symbol={market.symbol} />
          <View style={styles.identityCopy}>
            <View style={styles.symbolLine}>
              <Text style={styles.symbol}>{market.symbol}</Text>
              {!compact ? <Text style={styles.quote}>/POINT</Text> : null}
            </View>
            <Text numberOfLines={1} style={styles.name}>{market.name}</Text>
          </View>
        </View>

        {showSparkline ? (
          <View style={styles.sparkline}>
            <MarketChart grid={false} height={25} positive={change >= 0} series={market.series.slice(-12)} strokeWidth={2} />
          </View>
        ) : null}

        {compact ? (
          <View style={styles.compactValue}>
            <Text style={styles.price}>{formatPrice(price)}</Text>
            <Text style={[styles.compactChange, { color: direction }]}>{formatPercent(change)}</Text>
          </View>
        ) : (
          <>
            <View style={styles.priceColumn}>
              <Text style={styles.price}>{formatPrice(price)}</Text>
              <Text style={styles.volume}>{market.volume} vol</Text>
            </View>
            <View style={styles.changeColumn}>
              <Text style={[styles.change, { color: direction }]}>{formatPercent(change)}</Text>
            </View>
          </>
        )}
      </Pressable>

      {onFavorite ? (
        <Pressable
          accessibilityLabel={favorite ? 'Remove from saved markets' : 'Save market'}
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => onFavorite(market.symbol)}
          style={styles.star}
        >
          <Icon color={favorite ? colors.text : colors.textFaint} filled={favorite} name="star" size={19} />
        </Pressable>
      ) : null}

      <View pointerEvents="none" style={[styles.divider, compact ? styles.compactDivider : styles.directoryDivider]} />
    </View>
  );
}

export const MarketRow = memo(MarketRowComponent);

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', minHeight: layout.marketRow, paddingHorizontal: 16, position: 'relative' },
  compactRow: { paddingHorizontal: 0 },
  marketAction: { alignItems: 'center', alignSelf: 'stretch', flex: 1, flexDirection: 'row', minWidth: 0 },
  pressed: { backgroundColor: colors.section },
  identity: { alignItems: 'center', flex: 1, flexDirection: 'row', minWidth: 0 },
  identityCopy: { flex: 1, marginLeft: 10, minWidth: 0 },
  symbolLine: { alignItems: 'baseline', flexDirection: 'row' },
  symbol: { color: colors.text, fontFamily: typography.family, fontSize: 14, fontWeight: typography.weights.semibold },
  quote: { color: colors.textFaint, fontFamily: typography.family, fontSize: 9, fontWeight: typography.weights.regular, marginLeft: 2 },
  name: { color: colors.textMuted, fontFamily: typography.family, fontSize: 11, fontWeight: typography.weights.regular, marginTop: 3 },
  sparkline: { height: 25, marginHorizontal: 9, width: 50 },
  compactValue: { alignItems: 'flex-end', width: 72 },
  priceColumn: { alignItems: 'flex-end', width: 74 },
  price: { color: colors.text, fontFamily: typography.family, fontSize: 13, fontVariant: ['tabular-nums'], fontWeight: typography.weights.semibold },
  volume: { color: colors.textFaint, fontFamily: typography.family, fontSize: 9, fontWeight: typography.weights.regular, marginTop: 4 },
  changeColumn: { alignItems: 'flex-end', marginLeft: 8, width: 52 },
  change: { fontFamily: typography.family, fontSize: 12, fontVariant: ['tabular-nums'], fontWeight: typography.weights.medium },
  compactChange: { fontFamily: typography.family, fontSize: 11, fontVariant: ['tabular-nums'], fontWeight: typography.weights.medium, marginTop: 3 },
  star: { alignItems: 'flex-end', height: layout.touch, justifyContent: 'center', marginLeft: 4, width: 28 },
  divider: { backgroundColor: colors.dividerSoft, bottom: 0, height: StyleSheet.hairlineWidth, position: 'absolute', right: 0 },
  compactDivider: { left: 48 },
  directoryDivider: { left: 68 },
});
