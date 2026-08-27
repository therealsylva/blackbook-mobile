import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { OrderType, Side } from '@/types/exchange';
import { formatMoney, formatPrice } from '@/lib/format';
import { colors, typography } from '@/theme/tokens';
import { BottomSheet } from '@/components/ui/bottom-sheet';

interface OrderReviewSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  symbol: string;
  side: Side;
  type: OrderType;
  amount: number;
  leverage: number;
  price: number;
  targetPrice?: number;
  currency: string;
}

export function OrderReviewSheet({ visible, onClose, onConfirm, symbol, side, type, amount, leverage, price, targetPrice, currency }: OrderReviewSheetProps) {
  const execution = type === 'market' ? 'Best available' : formatPrice(targetPrice || price);
  return (
    <BottomSheet onClose={onClose} title="Confirm order" visible={visible}>
      <View style={styles.heading}>
        <Text style={styles.symbol}>{symbol}</Text>
        <Text style={[styles.side, { color: side === 'long' ? colors.positive : colors.negative }]}>{side === 'long' ? 'Long' : 'Short'} · {type.charAt(0).toUpperCase() + type.slice(1)}</Text>
      </View>
      <View style={styles.rows}>
        <ReviewRow label="Margin" value={formatMoney(amount, currency)} />
        <ReviewRow label="Exposure" value={formatMoney(amount * leverage, currency)} />
        <ReviewRow label="Leverage" value={String(leverage) + 'x'} />
        <ReviewRow label="Execution" value={execution} />
        <ReviewRow label="Estimated fee" value={formatMoney(amount * leverage * 0.0006, currency)} />
      </View>
      <Text style={styles.risk}>Leveraged positions can move quickly. Check your size and risk controls before confirming.</Text>
      <Pressable onPress={onConfirm} style={({ pressed }) => [styles.button, { backgroundColor: side === 'long' ? colors.positive : colors.negative }, pressed && styles.pressed]}>
        <Text style={styles.buttonText}>Confirm {side === 'long' ? 'Long' : 'Short'}</Text>
      </Pressable>
    </BottomSheet>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.row}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  heading: { paddingBottom: 16 },
  symbol: { color: colors.text, fontFamily: typography.family, fontWeight: typography.weights.semibold, fontSize: 18 },
  side: { fontFamily: typography.semibold, fontSize: 12, marginTop: 5 },
  rows: { paddingTop: 11 },
  row: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 36 },
  label: { color: colors.textMuted, fontFamily: typography.family, fontWeight: typography.weights.regular, fontSize: 12 },
  value: { color: colors.text, fontFamily: typography.family, fontWeight: typography.weights.medium, fontSize: 12, fontVariant: ['tabular-nums'] },
  risk: { color: colors.textMuted, fontFamily: typography.family, fontWeight: typography.weights.regular, fontSize: 11, lineHeight: 17, marginTop: 14 },
  button: { alignItems: 'center', borderRadius: 10, justifyContent: 'center', marginTop: 20, minHeight: 52 },
  buttonText: { color: colors.white, fontFamily: typography.family, fontWeight: typography.weights.semibold, fontSize: 15 },
  pressed: { opacity: 0.72 },
});
