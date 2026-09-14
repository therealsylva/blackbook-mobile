import { Children, cloneElement, isValidElement, type ComponentProps, type ReactElement, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { spacing, typography } from '@/theme/tokens';
import { createThemedStyles } from '@/theme/use-themed-styles';
import { SettingRow } from './setting-row';

interface SettingsSectionProps {
  title: string;
  children: ReactNode;
}

export function SettingsSection({ title, children }: SettingsSectionProps) {
  const rows = Children.toArray(children);
  const styles = useStyles();
  return (
    <View style={styles.root}>
      <Text style={styles.title}>{title}</Text>
      <View>
        {rows.map((child, index) => isValidElement(child)
          ? cloneElement(child as ReactElement<ComponentProps<typeof SettingRow>>, { divider: index < rows.length - 1 })
          : child)}
      </View>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { marginTop: spacing.xl, paddingHorizontal: spacing.page },
  title: { color: colors.textMuted, fontFamily: typography.semibold, fontSize: 12, marginBottom: spacing.xs },
}));
