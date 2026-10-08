import {useExchange} from '@/context/exchange-context';
import { Text, View } from 'react-native';
import { formatPrice } from '@/lib/format';
import { typography } from '@/theme/tokens';
import { useTheme } from '@/theme/theme-context';
import { createThemedStyles } from '@/theme/use-themed-styles';

interface OrderBookProps {
  price: number;
  compact?: boolean;
  lowerBand?: number;
  upperBand?: number;
}

export function OrderBook({ price, compact = false, lowerBand = 0, upperBand = Infinity }: OrderBookProps) {
  const styles = useStyles();
  const {bookFor,activeSymbol,marketFor}=useExchange();
  const book=bookFor(activeSymbol),market=marketFor(activeSymbol);
  const scale=market && book? Number(book.referenceTicks)/market.reference : 1;
  const rows={asks:(book?.asks??[]).slice(0,compact?4:6).reverse().map(row=>({price:Number(row.priceTicks)/scale,size:Number(row.quantityLots)})),bids:(book?.bids??[]).slice(0,compact?4:6).map(row=>({price:Number(row.priceTicks)/scale,size:Number(row.quantityLots)}))};
  return (
    <View style={styles.root}>
      <View style={styles.header}><Text style={styles.label}>Price</Text><Text style={styles.label}>Size</Text></View>
      {rows.asks.map((row, index) => <BookRow key={'a' + index} price={row.price} size={row.size} side="ask" strength={(index + 2) / (rows.asks.length + 2)} />)}
      <Text style={styles.mid}>{formatPrice(price)}</Text>
      {!rows.asks.length && !rows.bids.length ? <Text style={styles.label}>No resting orders</Text> : null}
      {rows.bids.map((row, index) => <BookRow key={'b' + index} price={row.price} size={row.size} side="bid" strength={(rows.bids.length - index + 1) / (rows.bids.length + 2)} />)}
    </View>
  );
}

function BookRow({ price, size, side, strength }: { price: number; size: number; side: 'ask' | 'bid'; strength: number }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const color = side === 'bid' ? colors.positive : colors.negative;
  return (
    <View style={styles.row}>
      <View style={[styles.depth, { backgroundColor: color, opacity: 0.08, width: (String(Math.round(strength * 100)) + '%') as `${number}%` }]} />
      <Text style={[styles.number, { color }]}>{formatPrice(price)}</Text><Text style={styles.size}>{size.toFixed(2)}</Text>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { minWidth: 142 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { color: colors.textFaint, fontSize: 9 },
  row: { alignItems: 'center', flexDirection: 'row', height: 22, justifyContent: 'space-between', overflow: 'hidden', paddingHorizontal: 3 },
  depth: { bottom: 0, position: 'absolute', right: 0, top: 0 },
  number: { fontFamily: typography.mono, fontSize: 9.5 },
  size: { color: colors.textMuted, fontFamily: typography.mono, fontSize: 9.5 },
  mid: { color: colors.text, fontFamily: typography.mono, fontSize: 12, fontWeight: '700', paddingVertical: 5 },
}));
