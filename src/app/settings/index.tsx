import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChoiceSheet } from '@/components/ui/choice-sheet';
import { Screen } from '@/components/ui/screen';
import { SettingRow } from '@/components/ui/setting-row';
import { TopBar } from '@/components/ui/top-bar';
import { useExchange } from '@/context/exchange-context';
import { colors, typography } from '@/theme/tokens';

type Choice = 'language' | 'currency' | 'colors' | null;

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, updateSetting } = useExchange();
  const [choice, setChoice] = useState<Choice>(null);

  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar back title="Settings" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Section title="General">
          <SettingRow hint="BlackBook uses its pitch-black market theme." icon="palette" label="Appearance" value="Dark" />
          <SettingRow icon="globe" label="Language" onPress={() => setChoice('language')} value={settings.language} />
          <SettingRow icon="currency" label="Display currency" onPress={() => setChoice('currency')} value={settings.currency} />
          <SettingRow icon="markets" label="Market colors" onPress={() => setChoice('colors')} value={settings.colorPreference} />
        </Section>
        <Section title="Trading & account">
          <SettingRow icon="trade" label="Trading preferences" onPress={() => router.push('/settings/trading')} value={settings.interfaceMode === 'basic' ? 'Basic' : 'Advanced'} />
          <SettingRow icon="bell" label="Notifications" onPress={() => router.push('/settings/notifications')} />
          <SettingRow icon="security" label="Security" onPress={() => router.push('/settings/security')} value={settings.appLock ? 'Protected' : 'Standard'} />
        </Section>
        <Section title="Support">
          <SettingRow icon="help" label="Help centre" onPress={() => router.push('/settings/about')} />
          <SettingRow icon="alert" label="Legal and risk" onPress={() => router.push('/settings/about')} />
          <SettingRow icon="info" label="About BlackBook" onPress={() => router.push('/settings/about')} />
          <SettingRow icon="info" label="Version" value="0.1.0" />
        </Section>
      </ScrollView>

      <ChoiceSheet onClose={() => setChoice(null)} onSelect={(value) => updateSetting('language', value)} options={['English', 'French', 'Spanish'] as const} title="Language" value={settings.language} visible={choice === 'language'} />
      <ChoiceSheet onClose={() => setChoice(null)} onSelect={(value) => updateSetting('currency', value)} options={['USD', 'EUR', 'GBP'] as const} title="Display currency" value={settings.currency} visible={choice === 'currency'} />
      <ChoiceSheet onClose={() => setChoice(null)} onSelect={(value) => updateSetting('colorPreference', value)} options={['Green up / Red down', 'Red up / Green down'] as const} title="Market colors" value={settings.colorPreference} visible={choice === 'colors'} />
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: 28 },
  section: { marginTop: 22, paddingHorizontal: 18 },
  sectionTitle: { color: colors.textFaint, fontFamily: typography.semibold, fontSize: 10, letterSpacing: 0.8, marginBottom: 5, textTransform: 'uppercase' },
});
