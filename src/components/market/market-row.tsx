import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MarketDefinition } from '@/data/markets';
import { formatPercent, formatPrice } from '@/lib/format';
import { colors, layout, typography } from '@/theme/tokens';
import { MarketAvatar } from './market-avatar';
import { MarketChart } from './market-chart';

interface MarketRowProps {
  market: MarketDefinition;
  price: number;
  change: number;
  onPress: (symbol: string) => void;
  compact?: boolean;
  showSparkline?: boolean;
  showVolume?: boolean;
}

function MarketRowComponent({ market, price, change, onPress, compact = false, showSparkline = false, showVolume = false }: MarketRowProps) {
  const direction = change >= 0 ? colors.positive : colors.negative;
  return (
    <Pressable
      accessibilityLabel={`${market.name}, ${formatPrice(price)}, ${formatPercent(change)}`}
      accessibilityRole="button"
      onPress={() => onPress(market.symbol)}
      style={({ pressed }) => [styles.row, compact && styles.compactRow, pressed && styles.pressed]}
    >
      <View style={styles.identity}>
        <MarketAvatar assetKey={market.assetKey} size={compact ? 42 : layout.entity} symbol={market.symbol} />
        <View style={styles.identityCopy}>
          <Text numberOfLines={1} style={styles.name}>{market.name}</Text>
          <Text style={styles.symbol}>{market.symbol}</Text>
        </View>
      </View>

      {showSparkline ? (
        <View style={styles.sparkline}>
          <MarketChart area={false} grid={false} height={29} positive={change >= 0} series={market.series.slice(-16)} strokeWidth={1.8} />
        </View>
      ) : null}

      <View style={[styles.priceColumn, compact && styles.compactPrice]}>
        <Text style={styles.price}>{formatPrice(price)}</Text>
        {compact ? <Text style={[styles.change, { color: direction }]}>{formatPercent(change)}</Text> : null}
      </View>
      {!compact ? <Text style={[styles.change, styles.changeColumn, { color: direction }]}>{formatPercent(change)}</Text> : null}
      {showVolume ? <Text style={styles.volume}>${market.volume}</Text> : null}
    </Pressable>
  );
}

export const MarketRow = memo(MarketRowComponent);

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', minHeight: 70, paddingHorizontal: 16 },
  compactRow: { minHeight: 72, paddingHorizontal: 0 },
  pressed: { backgroundColor: colors.section },
  identity: { alignItems: 'center', flex: 1, flexDirection: 'row', minWidth: 0 },
  identityCopy: { flex: 1, marginLeft: 11, minWidth: 0 },
  name: { color: colors.text, fontFamily: typography.bold, fontSize: 15, letterSpacing: -0.35 },
  symbol: { color: colors.textMuted, fontFamily: typography.monoSemibold, fontSize: 11, marginTop: 3 },
  sparkline: { height: 29, marginHorizontal: 9, width: 57 },
  priceColumn: { alignItems: 'flex-end', width: 76 },
  compactPrice: { width: 82 },
  price: { color: colors.text, fontFamily: typography.monoSemibold, fontSize: 13, fontVariant: ['tabular-nums'], letterSpacing: -0.35 },
  change: { fontFamily: typography.monoSemibold, fontSize: 11, fontVariant: ['tabular-nums'], marginTop: 4 },
  changeColumn: { marginLeft: 8, marginTop: 0, textAlign: 'right', width: 54 },
  volume: { color: colors.textMuted, fontFamily: typography.mono, fontSize: 10, marginLeft: 8, textAlign: 'right', width: 48 },
});
