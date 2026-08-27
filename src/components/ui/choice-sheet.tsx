import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '@/theme/tokens';
import { BottomSheet } from './bottom-sheet';
import { Icon } from './icon';

interface ChoiceSheetProps<T extends string | number> {
  visible: boolean;
  title: string;
  value: T;
  options: readonly T[];
  onSelect: (value: T) => void;
  onClose: () => void;
  format?: (value: T) => string;
}

export function ChoiceSheet<T extends string | number>({ visible, title, value, options, onSelect, onClose, format }: ChoiceSheetProps<T>) {
  return (
    <BottomSheet onClose={onClose} title={title} visible={visible}>
      <View style={styles.list}>
        {options.map((option) => {
          const selected = option === value;
          return (
            <Pressable key={String(option)} onPress={() => { onSelect(option); onClose(); }} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
              <Text style={[styles.label, selected && styles.selected]}>{format ? format(option) : String(option)}</Text>
              {selected ? <Icon color={colors.text} name="check" size={19} /> : null}
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 8 },
  row: { alignItems: 'center', borderBottomColor: colors.dividerSoft, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', minHeight: 52 },
  pressed: { backgroundColor: colors.surfaceRaised },
  label: { color: colors.text, fontFamily: typography.family, fontWeight: typography.weights.regular, fontSize: 14 },
  selected: { color: colors.text, fontFamily: typography.family, fontWeight: typography.weights.semibold },
});
