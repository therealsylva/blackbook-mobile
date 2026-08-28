import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Icon, type IconName } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { TopBar } from '@/components/ui/top-bar';
import { useExchange } from '@/context/exchange-context';
import { spacing, typography } from '@/theme/tokens';
import { useTheme } from '@/theme/theme-context';
import { createThemedStyles } from '@/theme/use-themed-styles';

const FEEDS: Array<{ icon: IconName; label: string; count?: (alerts: number) => string }> = [
  { icon: 'bell', label: 'Price alerts', count: (alerts) => `${alerts} active` },
  { icon: 'orders', label: 'Order updates' },
  { icon: 'alert', label: 'Position risk' },
  { icon: 'security', label: 'Account notices' },
  { icon: 'feed', label: 'Market updates' },
];

export default function NotificationsScreen() {
  const { colors, isDark } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const { settings, updateSetting, alerts } = useExchange();
  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar back title="Notifications" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.pushRow}>
          <Text style={styles.pushLabel}>Push notifications</Text>
          <Switch
            ios_backgroundColor={colors.divider}
            onValueChange={(value) => updateSetting('pushNotifications', value)}
            thumbColor={isDark ? colors.white : '#FFFFFF'}
            trackColor={{ false: colors.divider, true: colors.positive }}
            value={settings.pushNotifications}
          />
        </View>

        <Text style={styles.heading}>Notification feeds</Text>
        {FEEDS.map((feed) => (
          <Pressable key={feed.label} onPress={() => router.push('/(tabs)/feed')} style={({ pressed }) => [styles.feedRow, pressed && styles.pressed]}>
            <Icon name={feed.icon} size={22} />
            <Text style={styles.feedLabel}>{feed.label}</Text>
            {feed.count ? <Text style={styles.count}>{feed.count(alerts.size)}</Text> : null}
            <Icon color={colors.textMuted} name="chevron" size={18} />
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}

const useStyles = createThemedStyles((colors) => ({
  content: { paddingBottom: spacing.xl },
  pushRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 76, paddingHorizontal: spacing.page },
  pushLabel: { color: colors.text, fontFamily: typography.semibold, fontSize: 16 },
  heading: { color: colors.textMuted, fontFamily: typography.semibold, fontSize: 11, letterSpacing: 0.3, marginBottom: spacing.xs, marginTop: spacing.lg, paddingHorizontal: spacing.page },
  feedRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, minHeight: 66, paddingHorizontal: spacing.page },
  feedLabel: { color: colors.text, flex: 1, fontFamily: typography.semibold, fontSize: 15 },
  count: { color: colors.textMuted, fontFamily: typography.mono, fontSize: 10 },
  pressed: { backgroundColor: colors.section },
}));
