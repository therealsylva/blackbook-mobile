import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { MarketDefinition } from '@/data/markets';
import { formatPercent, formatPrice } from '@/lib/format';
import { layout, spacing, typography } from '@/theme/tokens';
import { useTheme } from '@/theme/theme-context';
import { createThemedStyles } from '@/theme/use-themed-styles';
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
  directory?: boolean;
}

function MarketRowComponent({ market, price, change, onPress, compact = false, showSparkline = false, showVolume = false, directory = false }: MarketRowProps) {
  const { colors } = useTheme();
  const styles = useStyles();
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
          <View style={styles.metadata}>
            <Text style={styles.symbol}>{market.symbol}</Text>
            {showSparkline ? (
              <View style={styles.sparkline}>
                <MarketChart area={false} grid={false} height={20} positive={change >= 0} series={market.series.slice(-16)} strokeWidth={1.7} />
              </View>
            ) : null}
            {showVolume ? <Text numberOfLines={1} style={styles.volume}>Vol ${market.volume}</Text> : null}
          </View>
        </View>
      </View>

      <View style={[styles.priceColumn, compact && styles.compactPrice]}>
        <Text style={styles.price}>{formatPrice(price)}</Text>
        {(compact || directory) ? <Text style={[styles.change, { color: direction }]}>{formatPercent(change)}</Text> : null}
      </View>
      {!compact && !directory ? <Text style={[styles.change, styles.changeColumn, { color: direction }]}>{formatPercent(change)}</Text> : null}
    </Pressable>
  );
}

export const MarketRow = memo(MarketRowComponent);

const useStyles = createThemedStyles((colors) => ({
  row: { alignItems: 'center', flexDirection: 'row', minHeight: 70, paddingHorizontal: 16 },
  compactRow: { minHeight: 76, paddingHorizontal: 0 },
  pressed: { backgroundColor: colors.section },
  identity: { alignItems: 'center', flex: 1, flexDirection: 'row', minWidth: 0 },
  identityCopy: { flex: 1, marginLeft: 11, minWidth: 0 },
  name: { color: colors.text, fontFamily: typography.bold, fontSize: 15.5, letterSpacing: -0.35 },
  metadata: { alignItems: 'center', flexDirection: 'row', minHeight: 22, marginTop: 2 },
  symbol: { color: colors.textMuted, fontFamily: typography.monoSemibold, fontSize: 10.5 },
  sparkline: { flex: 1, height: 20, marginLeft: spacing.sm, maxWidth: 76, minWidth: 46 },
  priceColumn: { alignItems: 'flex-end', marginLeft: spacing.sm, width: 96 },
  compactPrice: { width: 92 },
  price: { color: colors.text, fontFamily: typography.monoSemibold, fontSize: 13.5, fontVariant: ['tabular-nums'], letterSpacing: -0.4 },
  change: { fontFamily: typography.monoSemibold, fontSize: 11.5, fontVariant: ['tabular-nums'], marginTop: 4 },
  changeColumn: { marginLeft: 8, marginTop: 0, textAlign: 'right', width: 54 },
  volume: { color: colors.textMuted, flexShrink: 1, fontFamily: typography.mono, fontSize: 9.5, marginLeft: spacing.sm },
}));
