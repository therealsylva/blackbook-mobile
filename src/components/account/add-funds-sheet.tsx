import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useExchange } from '@/context/exchange-context';
import { formatMoney } from '@/lib/format';
import { colors, radii, spacing, typography } from '@/theme/tokens';
import { BottomSheet } from '@/components/ui/bottom-sheet';

interface AddFundsSheetProps {
  visible: boolean;
  onClose: () => void;
  mode?: 'deposit' | 'withdraw';
}

const PRESETS = [250, 500, 1000, 2500];

export function AddFundsSheet({ visible, onClose, mode = 'deposit' }: AddFundsSheetProps) {
  const { addFunds, withdrawFunds, cashBalance, settings } = useExchange();
  const [amount, setAmount] = useState('500');

  const submit = () => {
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    if (mode === 'withdraw' && !withdrawFunds(parsed)) return;
    if (mode === 'deposit') addFunds(parsed);
    onClose();
  };

  return (
    <BottomSheet onClose={onClose} title={mode === 'deposit' ? 'Deposit' : 'Withdraw'} visible={visible}>
      <Text style={styles.label}>Amount</Text>
      <View style={styles.inputRow}>
        <Text style={styles.currency}>{settings.currency}</Text>
        <TextInput
          accessibilityLabel={mode === 'deposit' ? 'Deposit amount' : 'Withdrawal amount'}
          keyboardType="decimal-pad"
          onChangeText={setAmount}
          placeholder="0.00"
          placeholderTextColor={colors.textFaint}
          selectionColor={colors.text}
          style={styles.input}
          value={amount}
        />
      </View>
      <View style={styles.presets}>
        {PRESETS.map((preset) => (
          <Pressable key={preset} onPress={() => setAmount(String(preset))} style={({ pressed }) => [styles.preset, pressed && styles.pressed]}>
            <Text style={styles.presetText}>{formatMoney(preset, settings.currency)}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>{mode === 'deposit' ? 'Deposit amount' : 'Available balance'}</Text>
        <Text style={styles.summaryValue}>{mode === 'deposit' ? formatMoney(Number(amount) || 0, settings.currency) : formatMoney(cashBalance, settings.currency)}</Text>
      </View>
      <Pressable accessibilityRole="button" onPress={submit} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <Text style={styles.buttonText}>{mode === 'deposit' ? 'Deposit' : 'Withdraw'}</Text>
      </Pressable>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.textMuted, fontFamily: typography.family, fontWeight: typography.weights.regular, fontSize: 12, marginBottom: 8 },
  inputRow: { alignItems: 'center', backgroundColor: colors.surfaceRaised, borderColor: colors.divider, borderRadius: radii.md, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 54, paddingHorizontal: spacing.sm },
  currency: { color: colors.textMuted, fontFamily: typography.family, fontWeight: typography.weights.semibold, fontSize: 14, marginRight: 12 },
  input: { color: colors.text, flex: 1, fontFamily: typography.family, fontWeight: typography.weights.semibold, fontSize: 30, fontVariant: ['tabular-nums'], padding: 0 },
  presets: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.md },
  preset: { alignItems: 'center', backgroundColor: colors.surfaceRaised, borderColor: colors.dividerSoft, borderRadius: radii.sm, borderWidth: StyleSheet.hairlineWidth, flex: 1, minHeight: 38, justifyContent: 'center' },
  presetText: { color: colors.textMuted, fontFamily: typography.family, fontWeight: typography.weights.medium, fontSize: 11 },
  summary: { borderTopColor: colors.divider, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, paddingTop: 16 },
  summaryLabel: { color: colors.textMuted, fontFamily: typography.family, fontWeight: typography.weights.regular, fontSize: 13 },
  summaryValue: { color: colors.text, fontFamily: typography.family, fontWeight: typography.weights.semibold, fontSize: 13, fontVariant: ['tabular-nums'] },
  button: { alignItems: 'center', backgroundColor: colors.text, borderRadius: radii.md, justifyContent: 'center', marginTop: spacing.lg, minHeight: 48 },
  buttonText: { color: colors.bg, fontFamily: typography.family, fontWeight: typography.weights.semibold, fontSize: 15 },
  pressed: { opacity: 0.7 },
});
