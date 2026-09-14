import { Pressable, Text, View } from 'react-native';
import type { MarketDefinition } from '@/data/markets';
import { formatPercent } from '@/lib/format';
import { spacing, typography } from '@/theme/tokens';
import { createThemedStyles } from '@/theme/use-themed-styles';
import { Icon } from '@/components/ui/icon';
import { MarketAvatar } from './market-avatar';

interface PairRowProps {
  change: number;
  left: MarketDefinition;
  right: MarketDefinition;
  title: string;
  onPress: () => void;
}

export function PairRow({ change, left, right, title, onPress }: PairRowProps) {
  const styles = useStyles();
  return (
    <Pressable accessibilityLabel={`${title}, ${formatPercent(change)} spread`} onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.marks}>
        <MarketAvatar assetKey={left.assetKey} size={42} symbol={left.symbol} />
        <View style={styles.overlap}><MarketAvatar assetKey={right.assetKey} size={42} symbol={right.symbol} /></View>
      </View>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.title}>{title}</Text>
        <Text style={styles.symbols}>{left.symbol} · {right.symbol}</Text>
      </View>
      <View style={styles.quote}>
        <Text style={styles.label}>Spread</Text>
        <Text style={[styles.change, change >= 0 ? styles.positive : styles.negative]}>{formatPercent(change)}</Text>
      </View>
      <Icon name="chevron" size={17} />
    </Pressable>
  );
}

const useStyles = createThemedStyles((colors) => ({
  row: { alignItems: 'center', flexDirection: 'row', minHeight: 74, paddingHorizontal: spacing.page },
  pressed: { backgroundColor: colors.section },
  marks: { flexDirection: 'row', width: 72 },
  overlap: { marginLeft: -12 },
  copy: { flex: 1, minWidth: 0 },
  title: { color: colors.text, fontFamily: typography.bold, fontSize: 15, letterSpacing: -0.3 },
  symbols: { color: colors.textMuted, fontFamily: typography.monoSemibold, fontSize: 10, marginTop: 4 },
  quote: { alignItems: 'flex-end', marginRight: spacing.xs },
  label: { color: colors.textMuted, fontFamily: typography.medium, fontSize: 10 },
  change: { fontFamily: typography.monoSemibold, fontSize: 11, marginTop: 4 },
  positive: { color: colors.positive },
  negative: { color: colors.negative },
}));
