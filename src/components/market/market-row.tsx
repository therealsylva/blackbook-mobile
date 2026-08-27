import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MarketDefinition } from '@/data/markets';
import { formatPercent, formatPrice } from '@/lib/format';
import { colors, typography } from '@/theme/tokens';
import { Icon } from '@/components/ui/icon';
import { MarketAvatar } from './market-avatar';

interface MarketRowProps {
  market: MarketDefinition;
  price: number;
  change: number;
  favorite?: boolean;
  onFavorite?: (symbol: string) => void;
  onPress: (symbol: string) => void;
  compact?: boolean;
}

function MarketRowComponent({ market, price, change, favorite, onFavorite, onPress, compact = false }: MarketRowProps) {
  const direction = change >= 0 ? colors.positive : colors.negative;
  return (
    <Pressable accessibilityLabel={`${market.name}, ${formatPrice(price)}, ${formatPercent(change)}`} onPress={() => onPress(market.symbol)} style={({ pressed }) => [styles.row, compact && styles.compact, pressed && styles.pressed]}>
      <View style={styles.market}>
        <MarketAvatar assetKey={market.assetKey} size={compact ? 34 : 38} symbol={market.symbol} />
        <View style={styles.marketCopy}>
          <View style={styles.symbolLine}>
            <Text style={styles.symbol}>{market.symbol}</Text>
            <Text style={styles.quote}>/POINT</Text>
          </View>
          <Text numberOfLines={1} style={styles.name}>{market.name}</Text>
        </View>
      </View>
      <View style={styles.priceColumn}>
        <Text style={styles.price}>{formatPrice(price)}</Text>
        <Text style={styles.volume}>{market.volume} vol</Text>
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
  row: { alignItems: 'center', borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 68, paddingHorizontal: 16 },
  compact: { minHeight: 62, paddingHorizontal: 0 },
  pressed: { backgroundColor: colors.surface },
  market: { alignItems: 'center', flex: 1.3, flexDirection: 'row', minWidth: 0 },
  marketCopy: { flex: 1, marginLeft: 10, minWidth: 0 },
  symbolLine: { alignItems: 'baseline', flexDirection: 'row' },
  symbol: { color: colors.text, fontSize: 14, fontWeight: '700' },
  quote: { color: colors.textFaint, fontSize: 9, marginLeft: 2 },
  name: { color: colors.textMuted, fontSize: 11, marginTop: 3 },
  priceColumn: { alignItems: 'flex-end', flex: 0.8 },
  price: { color: colors.text, fontFamily: typography.mono, fontSize: 13, fontWeight: '600' },
  volume: { color: colors.textFaint, fontSize: 9, marginTop: 4 },
  changeColumn: { alignItems: 'flex-end', flex: 0.65 },
  change: { fontFamily: typography.mono, fontSize: 12, fontWeight: '700' },
  star: { alignItems: 'flex-end', justifyContent: 'center', marginLeft: 8, width: 22 },
});
