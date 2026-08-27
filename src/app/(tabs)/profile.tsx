import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { SettingRow } from '@/components/ui/setting-row';
import { SettingsSection } from '@/components/ui/settings-section';
import { useExchange } from '@/context/exchange-context';
import { colors, radii, spacing, typography } from '@/theme/tokens';

export default function ProfileScreen() {
  const router = useRouter();
  const { settings, updateSetting, positions, orders, alerts } = useExchange();
  const nextMode = settings.interfaceMode === 'basic' ? 'advanced' : 'basic';

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <Pressable accessibilityLabel="Open settings" hitSlop={10} onPress={() => router.push('/settings')} style={styles.headerAction}><Icon name="settings" size={21} /></Pressable>
        </View>

        <View style={styles.account}>
          <View style={styles.avatar}><Icon color={colors.text} filled name="profile" size={29} /></View>
          <View style={styles.accountCopy}>
            <View style={styles.nameRow}><Text style={styles.accountName}>Sylva</Text><Icon color={colors.positive} name="check" size={15} /></View>
            <Text style={styles.uid}>UID 248 731 905</Text>
          </View>
          <Pressable accessibilityLabel="Copy account ID" hitSlop={10} style={styles.copyAction}><Icon color={colors.textMuted} name="copy" size={18} /></Pressable>
        </View>

        <View style={styles.stats}>
          <AccountStat label="Positions" value={positions.length} />
          <AccountStat divider label="Orders" value={orders.length} />
          <AccountStat divider label="Alerts" value={alerts.size} />
        </View>

        <Pressable
          accessibilityLabel={`Switch to ${nextMode} trading`}
          onPress={() => updateSetting('interfaceMode', nextMode)}
          style={({ pressed }) => [styles.modeRow, pressed && styles.pressed]}
        >
          <View style={styles.modeIcon}><Icon name={settings.interfaceMode === 'advanced' ? 'chart' : 'trade'} size={20} /></View>
          <View style={styles.modeCopy}><Text style={styles.modeTitle}>Trading interface</Text><Text style={styles.modeMeta}>Switches the Trade screen layout</Text></View>
          <Text style={styles.modeValue}>{settings.interfaceMode === 'advanced' ? 'Advanced' : 'Basic'}</Text>
          <Icon color={colors.textFaint} name="chevron" size={16} />
        </Pressable>

        <SettingsSection title="Account">
          <SettingRow icon="security" label="Account & security" onPress={() => router.push('/settings/security')} value={settings.appLock ? 'Protected' : 'Standard'} />
          <SettingRow icon="orders" label="Trading preferences" onPress={() => router.push('/settings/trading')} />
          <SettingRow icon="bell" label="Notifications" onPress={() => router.push('/settings/notifications')} />
        </SettingsSection>
        <SettingsSection title="Preferences">
          <SettingRow icon="appearance" label="Appearance" onPress={() => router.push('/settings')} value="Dark" />
          <SettingRow icon="currency" label="Display currency" onPress={() => router.push('/settings')} value={settings.currency} />
          <SettingRow icon="language" label="Language" onPress={() => router.push('/settings')} value={settings.language} />
        </SettingsSection>
        <SettingsSection title="Support">
          <SettingRow icon="support" label="Help centre" onPress={() => router.push('/settings/about')} />
          <SettingRow icon="document" label="Legal & risk" onPress={() => router.push('/settings/about')} />
          <SettingRow icon="info" label="About BlackBook" onPress={() => router.push('/settings/about')} />
        </SettingsSection>
        <Pressable accessibilityRole="button" style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}><Icon color={colors.negative} name="logout" size={19} /><Text style={styles.signOutText}>Sign out</Text></Pressable>
      </ScrollView>
    </Screen>
  );
}

function AccountStat({ label, value, divider = false }: { label: string; value: number; divider?: boolean }) {
  return <View style={[styles.stat, divider && styles.statDivider]}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
  header: { alignItems: 'center', borderBottomColor: colors.dividerSoft, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', height: 52, justifyContent: 'space-between', paddingHorizontal: spacing.page },
  title: { color: colors.text, fontFamily: typography.family, fontSize: 21, fontWeight: typography.weights.bold, letterSpacing: -0.3 },
  headerAction: { alignItems: 'center', height: 44, justifyContent: 'center', width: 36 },
  account: { alignItems: 'center', flexDirection: 'row', minHeight: 84, paddingHorizontal: spacing.page },
  avatar: { alignItems: 'center', backgroundColor: colors.surfaceRaised, borderColor: colors.dividerSoft, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, height: 48, justifyContent: 'center', width: 48 },
  accountCopy: { flex: 1, marginLeft: spacing.sm },
  nameRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  accountName: { color: colors.text, fontFamily: typography.family, fontSize: 17, fontWeight: typography.weights.semibold },
  uid: { color: colors.textMuted, fontFamily: typography.family, fontSize: 10, fontWeight: typography.weights.regular, marginTop: spacing.xxs },
  copyAction: { alignItems: 'center', height: 44, justifyContent: 'center', width: 36 },
  stats: { backgroundColor: colors.section, borderBottomColor: colors.dividerSoft, borderBottomWidth: StyleSheet.hairlineWidth, borderTopColor: colors.dividerSoft, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', height: 64, marginBottom: spacing.lg },
  stat: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  statDivider: { borderLeftColor: colors.divider, borderLeftWidth: StyleSheet.hairlineWidth },
  statValue: { color: colors.text, fontFamily: typography.family, fontSize: 14, fontVariant: ['tabular-nums'], fontWeight: typography.weights.semibold },
  statLabel: { color: colors.textMuted, fontFamily: typography.family, fontSize: 9, fontWeight: typography.weights.regular, marginTop: spacing.xxs },
  modeRow: { alignItems: 'center', backgroundColor: colors.section, borderBottomColor: colors.dividerSoft, borderBottomWidth: StyleSheet.hairlineWidth, borderTopColor: colors.dividerSoft, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 64, paddingHorizontal: spacing.page },
  modeIcon: { alignItems: 'center', backgroundColor: colors.surfaceRaised, borderRadius: radii.md, height: 36, justifyContent: 'center', width: 36 },
  modeCopy: { flex: 1, marginLeft: spacing.sm },
  modeTitle: { color: colors.text, fontFamily: typography.family, fontSize: 13, fontWeight: typography.weights.medium },
  modeMeta: { color: colors.textMuted, fontFamily: typography.family, fontSize: 10, fontWeight: typography.weights.regular, marginTop: spacing.xxs },
  modeValue: { color: colors.textMuted, fontFamily: typography.family, fontSize: 11, fontWeight: typography.weights.medium, marginRight: spacing.xxs },
  signOut: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, marginHorizontal: spacing.page, marginTop: spacing.lg, minHeight: 48, paddingHorizontal: spacing.sm },
  signOutText: { color: colors.negative, fontFamily: typography.family, fontSize: 13, fontWeight: typography.weights.medium },
  pressed: { opacity: 0.68 },
});
