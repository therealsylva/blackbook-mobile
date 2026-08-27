import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { colors, typography } from '@/theme/tokens';
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
      {onToggle ? <Switch ios_backgroundColor={colors.divider} onValueChange={onToggle} value={Boolean(toggle)} trackColor={{ false: colors.divider, true: colors.text }} thumbColor={toggle ? colors.bg : colors.textMuted} /> : null}
      {!onToggle && value ? <Text style={styles.value}>{value}</Text> : null}
      {!onToggle && onPress ? <Icon color={colors.textFaint} name="chevron" size={17} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', minHeight: 60, paddingVertical: 10 },
  pressed: { opacity: 0.62 },
  icon: { alignItems: 'center', marginRight: 14, width: 24 },
  copy: { flex: 1 },
  label: { color: colors.text, fontFamily: typography.medium, fontSize: 14 },
  destructive: { color: colors.negative },
  hint: { color: colors.textMuted, fontFamily: typography.regular, fontSize: 11, lineHeight: 16, marginTop: 3 },
  value: { color: colors.textMuted, fontFamily: typography.regular, fontSize: 12, marginRight: 4, maxWidth: '44%', textAlign: 'right' },
});
