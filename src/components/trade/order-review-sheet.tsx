import {executionLabel,type MarketExecution} from '@/lib/market-execution';
import { Pressable, Text, View } from 'react-native';
import type { OrderType, Side } from '@/types/exchange';
import { formatLeverage, formatMoney, formatPrice } from '@/lib/format';
import { typography } from '@/theme/tokens';
import { useTheme } from '@/theme/theme-context';
import { createThemedStyles } from '@/theme/use-themed-styles';
import { BottomSheet } from '@/components/ui/bottom-sheet';

interface OrderReviewSheetProps {
  visible: boolean;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  symbol: string;
  side: Side;
  type: OrderType;
  marketExecution: MarketExecution;
  amount: number;
  fee: number;
  exposure: number;
  leverage: number;
  price: number;
  targetPrice?: number;
  currency: string;
}

export function OrderReviewSheet({ visible, busy = false, onClose, onConfirm, symbol, side, type, marketExecution, amount, fee, exposure, leverage, price, targetPrice, currency }: OrderReviewSheetProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const execution = type === 'market' && !targetPrice ? 'Best available · within band' : formatPrice(targetPrice || price);
  return (
    <BottomSheet onClose={onClose} title="Confirm order" visible={visible}>
      <View style={styles.heading}>
        <Text style={styles.symbol}>{symbol}</Text>
        <Text style={[styles.side, { color: side === 'long' ? colors.positive : colors.negative }]}>{side === 'long' ? 'Long' : 'Short'} · {type.charAt(0).toUpperCase() + type.slice(1)}</Text>
      </View>
      <View style={styles.rows}>
        <ReviewRow label="Margin" value={formatMoney(amount, currency)} />
        <ReviewRow label="Exposure" value={formatMoney(exposure, currency)} />
        <ReviewRow label="Leverage" value={formatLeverage(leverage)} />
        <ReviewRow label="Price" value={execution} />
        {type==='market'?<ReviewRow label="Execution" value={executionLabel(marketExecution)} />:null}
        <ReviewRow label="Estimated fee" value={formatMoney(fee, currency)} />
      </View>
      <Text style={styles.risk}>{type==='market'?(marketExecution==='IOC'?'Any unfilled remainder is cancelled. ':marketExecution==='FOK'?'The order fills in full immediately or is cancelled. ':'Any unfilled remainder stays open at your price limit. '):''}Fee estimate uses the taker rate. Each fill is charged on exposure; maker fills use the lower maker rate. Fees also apply when closing.</Text>
      <Pressable disabled={busy} accessibilityState={{disabled:busy, busy}} onPress={onConfirm} style={({ pressed }) => [styles.button, { backgroundColor: side === 'long' ? colors.positive : colors.negative }, pressed && styles.pressed]}>
        <Text style={styles.buttonText}>{busy?'Processing…':`Confirm ${side === 'long' ? 'Long' : 'Short'}`}</Text>
      </Pressable>
    </BottomSheet>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  return <View style={styles.row}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>;
}

const useStyles = createThemedStyles((colors) => ({
  heading: { paddingBottom: 16 },
  symbol: { color: colors.text, fontFamily: typography.family, fontWeight: typography.weights.semibold, fontSize: 18 },
  side: { fontFamily: typography.semibold, fontSize: 12, marginTop: 5 },
  rows: { paddingTop: 11 },
  row: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 36 },
  label: { color: colors.textMuted, fontFamily: typography.family, fontWeight: typography.weights.regular, fontSize: 12 },
  value: { flexShrink: 1, textAlign: 'right', marginLeft: 12, color: colors.text, fontFamily: typography.family, fontWeight: typography.weights.medium, fontSize: 12, fontVariant: ['tabular-nums'] },
  risk: { color: colors.textMuted, fontFamily: typography.family, fontWeight: typography.weights.regular, fontSize: 11, lineHeight: 17, marginTop: 14 },
  button: { alignItems: 'center', borderRadius: 10, justifyContent: 'center', marginTop: 20, minHeight: 52 },
  buttonText: { color: colors.white, fontFamily: typography.family, fontWeight: typography.weights.semibold, fontSize: 15 },
  pressed: { opacity: 0.72 },
}));

