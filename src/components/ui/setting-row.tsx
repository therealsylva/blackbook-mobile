import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { layout, typography } from '@/theme/tokens';
import { useTheme } from '@/theme/theme-context';
import { createThemedStyles } from '@/theme/use-themed-styles';
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
  divider?: boolean;
}

export function SettingRow({ icon, label, value, hint, onPress, toggle, onToggle, destructive, divider = true }: SettingRowProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : onToggle ? 'switch' : undefined}
      accessibilityState={onToggle ? { checked: Boolean(toggle) } : undefined}
      disabled={!onPress && onToggle === undefined}
      onPress={onPress ?? (onToggle ? () => onToggle(!toggle) : undefined)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {icon ? <View style={styles.icon}><Icon color={destructive ? colors.negative : colors.text} name={icon} size={20} /></View> : null}
      <View style={[styles.body, divider && styles.divider]}>
        <View style={styles.copy}>
          <Text style={[styles.label, destructive && styles.destructive]}>{label}</Text>
          {hint ? <Text style={styles.hint}>{hint}</Text> : null}
        </View>
        {onToggle ? (
          <Switch
            accessibilityLabel={label}
            ios_backgroundColor={colors.divider}
            onValueChange={onToggle}
            style={styles.switch}
            value={Boolean(toggle)}
            trackColor={{ false: colors.divider, true: colors.positive }}
            thumbColor={colors.white}
          />
        ) : null}
        {!onToggle && value ? <Text numberOfLines={1} style={styles.value}>{value}</Text> : null}
        {!onToggle && onPress ? <Icon color={colors.textFaint} name="chevron" size={16} /> : null}
      </View>
    </Pressable>
  );
}

const useStyles = createThemedStyles((colors) => ({
  row: { alignItems: 'stretch', flexDirection: 'row', minHeight: 62 },
  pressed: { backgroundColor: colors.surfaceRaised },
  icon: { alignItems: 'center', justifyContent: 'center', marginRight: 12, width: 22 },
  body: { alignItems: 'center', flex: 1, flexDirection: 'row', minHeight: 62, paddingRight: 0, paddingVertical: 8 },
  divider: { borderBottomColor: colors.dividerSoft, borderBottomWidth: StyleSheet.hairlineWidth },
  copy: { flex: 1 },
  label: { color: colors.text, fontFamily: typography.semibold, fontSize: 15 },
  destructive: { color: colors.negative },
  hint: { color: colors.textMuted, fontFamily: typography.family, fontSize: 10, lineHeight: 14, marginTop: 3 },
  value: { color: colors.textMuted, fontFamily: typography.medium, fontSize: 12, marginRight: 4, maxWidth: '42%', textAlign: 'right' },
  switch: { marginLeft: 8, transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }], width: layout.touch },
}));
