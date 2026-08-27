import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ChoiceSheet } from '@/components/ui/choice-sheet';
import { Screen } from '@/components/ui/screen';
import { SettingRow } from '@/components/ui/setting-row';
import { TopBar } from '@/components/ui/top-bar';
import { useExchange } from '@/context/exchange-context';
import { colors } from '@/theme/tokens';

export default function SecuritySettingsScreen() {
  const { settings, updateSetting } = useExchange();
  const [autoLockOpen, setAutoLockOpen] = useState(false);
  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar back title="Security" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.score}><View><Text style={styles.scoreTitle}>Security status</Text><Text style={styles.scoreCopy}>{settings.appLock ? 'App access is protected.' : 'Turn on app lock for stronger access control.'}</Text></View><Text style={[styles.scoreValue, { color: settings.appLock ? colors.positive : colors.accent }]}>{settings.appLock ? 'Strong' : 'Standard'}</Text></View>
        <Section title="App access">
          <SettingRow icon="lock" label="App lock" onToggle={(value) => updateSetting('appLock', value)} toggle={settings.appLock} />
          <SettingRow hint="Use Face ID or fingerprint when available." icon="security" label="Biometric unlock" onToggle={(value) => updateSetting('biometrics', value)} toggle={settings.biometrics} />
          <SettingRow icon="clock" label="Auto-lock" onPress={() => setAutoLockOpen(true)} value={settings.autoLock} />
        </Section>
        <Section title="Account">
          <SettingRow icon="security" label="Passcode" value="Set" />
          <SettingRow icon="profile" label="Trusted devices" value="1 device" />
          <SettingRow icon="clock" label="Login activity" value="No recent activity" />
        </Section>
      </ScrollView>
      <ChoiceSheet onClose={() => setAutoLockOpen(false)} onSelect={(value) => updateSetting('autoLock', value)} options={['Immediately', 'After 1 minute', 'After 5 minutes'] as const} title="Auto-lock" value={settings.autoLock} visible={autoLockOpen} />
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: 28 },
  score: { alignItems: 'center', backgroundColor: colors.surface, flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 16, marginTop: 16, padding: 14 },
  scoreTitle: { color: colors.text, fontSize: 13, fontWeight: '700' },
  scoreCopy: { color: colors.textMuted, fontSize: 10, lineHeight: 15, marginTop: 4, maxWidth: 245 },
  scoreValue: { fontSize: 11, fontWeight: '800' },
  section: { marginTop: 23, paddingHorizontal: 16 },
  sectionTitle: { color: colors.textFaint, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 5, textTransform: 'uppercase' },
});
