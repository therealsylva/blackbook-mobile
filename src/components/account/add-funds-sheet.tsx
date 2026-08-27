import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useExchange } from '@/context/exchange-context';
import { formatMoney } from '@/lib/format';
import { colors, typography } from '@/theme/tokens';
import { BottomSheet } from '@/components/ui/bottom-sheet';

interface AddFundsSheetProps {
  visible: boolean;
  onClose: () => void;
}

const PRESETS = [250, 500, 1000, 2500];

export function AddFundsSheet({ visible, onClose }: AddFundsSheetProps) {
  const { addFunds, settings } = useExchange();
  const [amount, setAmount] = useState('500');

  const submit = () => {
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    addFunds(parsed);
    onClose();
  };

  return (
    <BottomSheet onClose={onClose} title="Deposit" visible={visible}>
      <Text style={styles.label}>Amount</Text>
      <View style={styles.inputRow}>
        <Text style={styles.currency}>{settings.currency}</Text>
        <TextInput
          accessibilityLabel="Amount to add"
          keyboardType="decimal-pad"
          onChangeText={setAmount}
          placeholder="0.00"
          placeholderTextColor={colors.textFaint}
          selectionColor={colors.accent}
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
        <Text style={styles.summaryLabel}>Available instantly</Text>
        <Text style={styles.summaryValue}>{formatMoney(Number(amount) || 0, settings.currency)}</Text>
      </View>
      <Pressable accessibilityRole="button" onPress={submit} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <Text style={styles.buttonText}>Continue</Text>
      </Pressable>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.textMuted, fontFamily: typography.regular, fontSize: 12, marginBottom: 8 },
  inputRow: { alignItems: 'center', borderBottomColor: colors.accent, borderBottomWidth: 1, flexDirection: 'row', paddingBottom: 10 },
  currency: { color: colors.textMuted, fontFamily: typography.semibold, fontSize: 14, marginRight: 12 },
  input: { color: colors.text, flex: 1, fontFamily: typography.semibold, fontSize: 30, fontVariant: ['tabular-nums'], padding: 0 },
  presets: { flexDirection: 'row', gap: 8, marginTop: 18 },
  preset: { alignItems: 'center', backgroundColor: colors.surfaceRaised, borderRadius: 4, flex: 1, minHeight: 40, justifyContent: 'center' },
  presetText: { color: colors.textMuted, fontFamily: typography.medium, fontSize: 11 },
  summary: { borderTopColor: colors.divider, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, paddingTop: 16 },
  summaryLabel: { color: colors.textMuted, fontFamily: typography.regular, fontSize: 13 },
  summaryValue: { color: colors.text, fontFamily: typography.semibold, fontSize: 13, fontVariant: ['tabular-nums'] },
  button: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: 6, justifyContent: 'center', marginTop: 24, minHeight: 52 },
  buttonText: { color: colors.bg, fontFamily: typography.semibold, fontSize: 15 },
  pressed: { opacity: 0.7 },
});
