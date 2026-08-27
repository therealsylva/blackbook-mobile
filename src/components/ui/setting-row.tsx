import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { colors } from '@/theme/tokens';
import { Icon, type IconName } from './icon';

interface SettingRowProps {
  icon?: IconName;
  label: string;
  value?: string;
  hint?: string;
  onPress?: () => void;
  toggle?: boolean;
  onToggle?: (value: boolean) => void;
  destructive?: boolean;
}

export function SettingRow({ icon, label, value, hint, onPress, toggle, onToggle, destructive }: SettingRowProps) {
  return (
    <Pressable accessibilityRole={onPress ? 'button' : undefined} disabled={!onPress && onToggle === undefined} onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      {icon ? <View style={styles.icon}><Icon color={destructive ? colors.negative : colors.textMuted} name={icon} size={21} /></View> : null}
      <View style={styles.copy}>
        <Text style={[styles.label, destructive && styles.destructive]}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      {onToggle ? <Switch onValueChange={onToggle} value={Boolean(toggle)} trackColor={{ false: colors.divider, true: colors.accent }} thumbColor={colors.text} /> : null}
      {!onToggle && value ? <Text style={styles.value}>{value}</Text> : null}
      {!onToggle && onPress ? <Icon color={colors.textFaint} name="chevron" size={17} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 58, paddingVertical: 10 },
  pressed: { opacity: 0.62 },
  icon: { alignItems: 'center', marginRight: 14, width: 24 },
  copy: { flex: 1 },
  label: { color: colors.text, fontSize: 15, fontWeight: '500' },
  destructive: { color: colors.negative },
  hint: { color: colors.textMuted, fontSize: 12, lineHeight: 16, marginTop: 3 },
  value: { color: colors.textMuted, fontSize: 13, marginRight: 4, maxWidth: '44%', textAlign: 'right' },
});
