import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ChoiceSheet } from '@/components/ui/choice-sheet';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { SettingRow } from '@/components/ui/setting-row';
import { SettingsSection } from '@/components/ui/settings-section';
import { TopBar } from '@/components/ui/top-bar';
import { useExchange } from '@/context/exchange-context';
import { colors, radii, spacing, typography } from '@/theme/tokens';

export default function SecuritySettingsScreen() {
  const { settings, updateSetting } = useExchange();
  const [autoLockOpen, setAutoLockOpen] = useState(false);
  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar back title="Security" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.status}>
          <View style={styles.statusIcon}><Icon color={settings.appLock ? colors.positive : colors.textMuted} name="security" size={22} /></View>
          <View style={styles.statusCopy}><Text style={styles.statusTitle}>{settings.appLock ? 'Strong protection' : 'Standard protection'}</Text><Text style={styles.statusMeta}>{settings.appLock ? 'App access is locked.' : 'Enable app lock for stronger access control.'}</Text></View>
        </View>
        <SettingsSection title="App access">
          <SettingRow icon="lock" label="App lock" onToggle={(value) => updateSetting('appLock', value)} toggle={settings.appLock} />
          <SettingRow hint="Use Face ID or fingerprint when available." icon="security" label="Biometric unlock" onToggle={(value) => updateSetting('biometrics', value)} toggle={settings.biometrics} />
          <SettingRow icon="clock" label="Auto-lock" onPress={() => setAutoLockOpen(true)} value={settings.autoLock} />
        </SettingsSection>
        <SettingsSection title="Account access">
          <SettingRow icon="lock" label="Passcode" value="Set" />
          <SettingRow icon="profile" label="Trusted devices" value="1 device" />
          <SettingRow icon="clock" label="Login activity" onPress={() => {}} value="Current device" />
        </SettingsSection>
      </ScrollView>
      <ChoiceSheet onClose={() => setAutoLockOpen(false)} onSelect={(value) => updateSetting('autoLock', value)} options={['Immediately', 'After 1 minute', 'After 5 minutes'] as const} title="Auto-lock" value={settings.autoLock} visible={autoLockOpen} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
  status: { alignItems: 'center', borderBottomColor: colors.dividerSoft, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 76, paddingHorizontal: spacing.page },
  statusIcon: { alignItems: 'center', backgroundColor: colors.section, borderColor: colors.dividerSoft, borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, height: 44, justifyContent: 'center', width: 44 },
  statusCopy: { flex: 1, marginLeft: spacing.sm },
  statusTitle: { color: colors.text, fontFamily: typography.family, fontSize: 14, fontWeight: typography.weights.semibold },
  statusMeta: { color: colors.textMuted, fontFamily: typography.family, fontSize: 10, fontWeight: typography.weights.regular, marginTop: spacing.xxs },
});
