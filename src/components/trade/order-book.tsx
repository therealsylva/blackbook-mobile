import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatPrice } from '@/lib/format';
import { colors, typography } from '@/theme/tokens';

interface OrderBookProps {
  price: number;
  compact?: boolean;
}

export function OrderBook({ price, compact = false }: OrderBookProps) {
  const rows = useMemo(() => {
    const asks = Array.from({ length: compact ? 4 : 6 }, (_, index) => ({ price: price * (1 + (compact ? 4 - index : 6 - index) * 0.0007), size: 2.18 + ((index * 1.37) % 4.7) }));
    const bids = Array.from({ length: compact ? 4 : 6 }, (_, index) => ({ price: price * (1 - (index + 1) * 0.0007), size: 1.76 + ((index * 1.91) % 5.2) }));
    return { asks, bids };
  }, [compact, price]);
  return (
    <View style={styles.root}>
      <View style={styles.header}><Text style={styles.label}>Price</Text><Text style={styles.label}>Size</Text></View>
      {rows.asks.map((row, index) => <BookRow key={'a' + index} price={row.price} size={row.size} side="ask" strength={(index + 2) / (rows.asks.length + 2)} />)}
      <Text style={styles.mid}>{formatPrice(price)}</Text>
      {rows.bids.map((row, index) => <BookRow key={'b' + index} price={row.price} size={row.size} side="bid" strength={(rows.bids.length - index + 1) / (rows.bids.length + 2)} />)}
    </View>
  );
}

function BookRow({ price, size, side, strength }: { price: number; size: number; side: 'ask' | 'bid'; strength: number }) {
  const color = side === 'bid' ? colors.positive : colors.negative;
  return (
    <View style={styles.row}>
      <View style={[styles.depth, { backgroundColor: color, opacity: 0.08, width: (String(Math.round(strength * 100)) + '%') as `${number}%` }]} />
      <Text style={[styles.number, { color }]}>{formatPrice(price)}</Text><Text style={styles.size}>{size.toFixed(2)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { minWidth: 142 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { color: colors.textFaint, fontSize: 9 },
  row: { alignItems: 'center', flexDirection: 'row', height: 22, justifyContent: 'space-between', overflow: 'hidden', paddingHorizontal: 3 },
  depth: { bottom: 0, position: 'absolute', right: 0, top: 0 },
  number: { fontFamily: typography.mono, fontSize: 9.5 },
  size: { color: colors.textMuted, fontFamily: typography.mono, fontSize: 9.5 },
  mid: { color: colors.text, fontFamily: typography.mono, fontSize: 12, fontWeight: '700', paddingVertical: 5 },
});
