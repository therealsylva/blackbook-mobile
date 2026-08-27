import { Children, cloneElement, isValidElement, type ComponentProps, type ReactElement, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '@/theme/tokens';
import { SettingRow } from './setting-row';

interface SettingsSectionProps {
  title: string;
  children: ReactNode;
}

export function SettingsSection({ title, children }: SettingsSectionProps) {
  const rows = Children.toArray(children);
  return (
    <View style={styles.root}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.group}>
        {rows.map((child, index) => isValidElement(child)
          ? cloneElement(child as ReactElement<ComponentProps<typeof SettingRow>>, { divider: index < rows.length - 1 })
          : child)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginTop: spacing.lg, paddingHorizontal: spacing.page },
  title: { color: colors.textFaint, fontFamily: typography.family, fontSize: 10, fontWeight: typography.weights.semibold, letterSpacing: 0.7, marginBottom: spacing.xs, textTransform: 'uppercase' },
  group: { backgroundColor: colors.section, borderColor: colors.dividerSoft, borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
});
