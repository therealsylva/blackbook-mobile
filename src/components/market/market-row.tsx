import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MarketDefinition } from '@/data/markets';
import { formatPercent, formatPrice } from '@/lib/format';
import { colors, typography } from '@/theme/tokens';
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
    <Pressable accessibilityLabel={`${market.name}, ${formatPrice(price)}, ${formatPercent(change)}`} onPress={() => onPress(market.symbol)} style={({ pressed }) => [styles.row, compact && styles.compact, pressed && styles.pressed]}>
      <View style={styles.market}>
        <MarketAvatar assetKey={market.assetKey} size={compact ? 42 : 44} symbol={market.symbol} />
        <View style={styles.marketCopy}>
          <View style={styles.symbolLine}>
            <Text style={styles.symbol}>{market.symbol}</Text>
            {!compact ? <Text style={styles.quote}>/POINT</Text> : null}
          </View>
          <Text numberOfLines={1} style={styles.name}>{market.name}</Text>
        </View>
      </View>
      {showSparkline ? <View style={styles.sparkline}><MarketChart grid={false} height={28} positive={change >= 0} series={market.series.slice(-12)} strokeWidth={2.2} /></View> : null}
      <View style={styles.priceColumn}>
        <Text style={styles.price}>{formatPrice(price)}</Text>
        {!compact ? <Text style={styles.volume}>{market.volume} vol</Text> : null}
      </View>
      <View style={styles.changeColumn}>
        <Text style={[styles.change, { color: direction }]}>{formatPercent(change)}</Text>
      </View>
      {onFavorite ? (
        <Pressable accessibilityLabel={favorite ? 'Remove from favorites' : 'Add to favorites'} hitSlop={10} onPress={() => onFavorite(market.symbol)} style={styles.star}>
          <Icon color={favorite ? colors.accent : colors.textFaint} filled={favorite} name="star" size={18} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

export const MarketRow = memo(MarketRowComponent);

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', minHeight: 68, paddingHorizontal: 18 },
  compact: { minHeight: 68, paddingHorizontal: 0 },
  pressed: { backgroundColor: colors.surface },
  market: { alignItems: 'center', flex: 1.35, flexDirection: 'row', minWidth: 0 },
  marketCopy: { flex: 1, marginLeft: 10, minWidth: 0 },
  symbolLine: { alignItems: 'baseline', flexDirection: 'row' },
  symbol: { color: colors.text, fontFamily: typography.semibold, fontSize: 14 },
  quote: { color: colors.textFaint, fontSize: 9, marginLeft: 2 },
  name: { color: colors.textMuted, fontFamily: typography.regular, fontSize: 11, marginTop: 3 },
  sparkline: { height: 28, marginHorizontal: 8, width: 54 },
  priceColumn: { alignItems: 'flex-end', flex: 0.76 },
  price: { color: colors.text, fontFamily: typography.semibold, fontSize: 13, fontVariant: ['tabular-nums'] },
  volume: { color: colors.textFaint, fontSize: 9, marginTop: 4 },
  changeColumn: { alignItems: 'flex-end', flex: 0.58 },
  change: { fontFamily: typography.medium, fontSize: 12, fontVariant: ['tabular-nums'] },
  star: { alignItems: 'flex-end', justifyContent: 'center', marginLeft: 8, width: 22 },
});
