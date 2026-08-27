import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '@/theme/tokens';
import { Icon, type IconName } from './icon';

interface TopBarProps {
  title: string;
  subtitle?: string;
  rightIcon?: IconName;
  onRightPress?: () => void;
  back?: boolean;
}

export function TopBar({ title, subtitle, rightIcon, onRightPress, back = false }: TopBarProps) {
  const router = useRouter();
  return (
    <View style={styles.bar}>
      {back ? <Pressable accessibilityLabel="Go back" hitSlop={12} onPress={() => router.back()} style={styles.leading}><Icon name="back" /></Pressable> : null}
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.title}>{title}</Text>
        {subtitle ? <Text numberOfLines={1} style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {rightIcon ? <Pressable accessibilityLabel={rightIcon} hitSlop={12} onPress={onRightPress} style={styles.trailing}><Icon name={rightIcon} /></Pressable> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { alignItems: 'center', flexDirection: 'row', minHeight: 56, paddingHorizontal: spacing.page },
  leading: { alignItems: 'flex-start', justifyContent: 'center', marginRight: 12, width: 28 },
  trailing: { alignItems: 'flex-end', justifyContent: 'center', marginLeft: 12, width: 28 },
  copy: { flex: 1 },
  title: { color: colors.text, fontFamily: typography.semibold, fontSize: 19 },
  subtitle: { color: colors.textMuted, fontFamily: typography.regular, fontSize: 11, marginTop: 2 },
});
