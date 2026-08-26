import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors, radius, spacing, typography } from '@/constants/theme';
import { formatCurrency, formatIndexValue } from '@/lib/format';
import type { Market, OrderSide } from '@/types/market';

interface OrderSheetProps {
  market: Market;
  onClose: () => void;
  side: OrderSide | null;
}

const leverageOptions = [1, 2, 5] as const;

export function OrderSheet({ market, onClose, side }: OrderSheetProps) {
  const [amount, setAmount] = useState('25');
  const [leverage, setLeverage] = useState<(typeof leverageOptions)[number]>(1);
  const [riskControls, setRiskControls] = useState(false);

  useEffect(() => {
    if (side) {
      setAmount('25');
      setLeverage(1);
      setRiskControls(false);
    }
  }, [side]);

  const margin = Number.parseFloat(amount) || 0;
  const exposure = useMemo(() => margin * leverage, [leverage, margin]);
  const actionColor = side === 'Short' ? colors.negative : colors.positive;

  const reviewOrder = () => {
    Alert.alert(
      'Execution is disconnected',
      'This foundation validates the complete order interaction without sending a trade. Production execution will be connected through the Blackbook API contract.',
    );
  };

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={side !== null}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalRoot}>
        <Pressable accessibilityLabel="Close order ticket" onPress={onClose} style={styles.backdrop} />

        <View accessibilityViewIsModal style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>{side} {market.symbol}</Text>
              <Text style={styles.title}>{market.name}</Text>
            </View>
            <Text style={styles.markPrice}>{formatIndexValue(market.price)}</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Margin</Text>
            <View style={styles.inputShell}>
              <TextInput
                accessibilityLabel="Margin amount"
                keyboardType="decimal-pad"
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                value={amount}
              />
              <Text style={styles.inputUnit}>USD</Text>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Leverage</Text>
            <View style={styles.leverageRow}>
              {leverageOptions.map((option) => {
                const selected = leverage === option;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    key={option}
                    onPress={() => setLeverage(option)}
                    style={[styles.leverageOption, selected && styles.leverageOptionSelected]}>
                    <Text style={[styles.leverageText, selected && styles.leverageTextSelected]}>{option}×</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.riskRow}>
            <View style={styles.riskCopy}>
              <Text style={styles.riskTitle}>Take-profit and stop-loss</Text>
              <Text style={styles.riskDescription}>Attach exits after reviewing the order.</Text>
            </View>
            <Switch
              accessibilityLabel="Enable take-profit and stop-loss"
              onValueChange={setRiskControls}
              thumbColor={colors.white}
              trackColor={{ false: colors.line, true: colors.ink }}
              value={riskControls}
            />
          </View>

          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Estimated exposure</Text>
              <Text style={styles.summaryValue}>{formatCurrency(exposure)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Order type</Text>
              <Text style={styles.summaryValue}>Market</Text>
            </View>
            <Text style={styles.disclaimer}>
              Preview data only. The production risk engine will provide fees, band impact, and liquidation information before submission.
            </Text>
          </View>

          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: margin <= 0 }}
              disabled={margin <= 0}
              onPress={reviewOrder}
              style={[styles.reviewButton, { backgroundColor: actionColor }, margin <= 0 && styles.disabled]}>
              <Text style={styles.reviewText}>Review {side}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.48)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.panel,
    borderTopRightRadius: radius.panel,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: colors.line,
    borderRadius: 2,
    height: 4,
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
    width: 42,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  eyebrow: {
    color: colors.text,
    fontSize: typography.section,
    fontWeight: '900',
  },
  title: {
    color: colors.textMuted,
    fontSize: typography.compact,
    marginTop: 2,
  },
  markPrice: {
    color: colors.text,
    fontSize: typography.section,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
  },
  fieldGroup: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    color: colors.textMuted,
    fontSize: typography.compact,
    marginBottom: spacing.xs,
  },
  inputShell: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: radius.control,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 54,
    paddingHorizontal: spacing.md,
  },
  input: {
    color: colors.text,
    flex: 1,
    fontSize: 20,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
    paddingVertical: spacing.sm,
  },
  inputUnit: {
    color: colors.textMuted,
    fontSize: typography.compact,
    fontWeight: '700',
  },
  leverageRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  leverageOption: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: radius.control,
    borderWidth: 1,
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  leverageOptionSelected: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  leverageText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  leverageTextSelected: {
    color: colors.textOnDark,
  },
  riskRow: {
    alignItems: 'center',
    borderBottomColor: colors.line,
    borderTopColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  riskCopy: {
    flex: 1,
    paddingRight: spacing.md,
  },
  riskTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  riskDescription: {
    color: colors.textMuted,
    fontSize: typography.label,
    marginTop: 3,
  },
  summary: {
    backgroundColor: colors.mutedSurface,
    borderRadius: radius.control,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: typography.compact,
  },
  summaryValue: {
    color: colors.text,
    fontSize: typography.compact,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
  },
  disclaimer: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  cancelButton: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: radius.control,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 54,
  },
  cancelText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  reviewButton: {
    alignItems: 'center',
    borderRadius: radius.control,
    flex: 1.8,
    justifyContent: 'center',
    minHeight: 54,
  },
  reviewText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '800',
  },
  disabled: {
    opacity: 0.4,
  },
});
