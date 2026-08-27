import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChoiceSheet } from '@/components/ui/choice-sheet';
import { Screen } from '@/components/ui/screen';
import { SettingRow } from '@/components/ui/setting-row';
import { TopBar } from '@/components/ui/top-bar';
import { useExchange } from '@/context/exchange-context';
import { colors } from '@/theme/tokens';

type Choice = 'appearance' | 'language' | 'currency' | 'colors' | 'refresh' | null;

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, updateSetting } = useExchange();
  const [choice, setChoice] = useState<Choice>(null);
  const [cacheStatus, setCacheStatus] = useState('');

  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar back title="Settings" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Section title="Display">
          <SettingRow icon="palette" label="Appearance" onPress={() => setChoice('appearance')} value={settings.appearance} />
          <SettingRow icon="globe" label="Language" onPress={() => setChoice('language')} value={settings.language} />
          <SettingRow icon="currency" label="Display currency" onPress={() => setChoice('currency')} value={settings.currency} />
          <SettingRow icon="markets" label="Market colors" onPress={() => setChoice('colors')} value={settings.colorPreference} />
        </Section>
        <Section title="Trading">
          <SettingRow icon="trade" label="Trading interface" onPress={() => router.push('/settings/trading')} value={settings.interfaceMode === 'basic' ? 'Basic' : 'Advanced'} />
          <SettingRow icon="sliders" label="Order and risk preferences" onPress={() => router.push('/settings/trading')} />
        </Section>
        <Section title="Market data">
          <SettingRow icon="refresh" label="Refresh rate" onPress={() => setChoice('refresh')} value={settings.refreshRate} />
          <SettingRow icon="download" label="Clear cached market data" onPress={() => setCacheStatus('Cleared just now')} value={cacheStatus} />
        </Section>
        <Section title="App">
          <SettingRow icon="help" label="About, legal and risk" onPress={() => router.push('/settings/about')} />
          <SettingRow icon="info" label="Version" value="0.1.0" />
        </Section>
      </ScrollView>

      <ChoiceSheet onClose={() => setChoice(null)} onSelect={(value) => updateSetting('appearance', value)} options={['Dark', 'Light', 'System'] as const} title="Appearance" value={settings.appearance} visible={choice === 'appearance'} />
      <ChoiceSheet onClose={() => setChoice(null)} onSelect={(value) => updateSetting('language', value)} options={['English', 'French', 'Spanish'] as const} title="Language" value={settings.language} visible={choice === 'language'} />
      <ChoiceSheet onClose={() => setChoice(null)} onSelect={(value) => updateSetting('currency', value)} options={['USD', 'EUR', 'GBP'] as const} title="Display currency" value={settings.currency} visible={choice === 'currency'} />
      <ChoiceSheet onClose={() => setChoice(null)} onSelect={(value) => updateSetting('colorPreference', value)} options={['Green up / Red down', 'Red up / Green down'] as const} title="Market colors" value={settings.colorPreference} visible={choice === 'colors'} />
      <ChoiceSheet onClose={() => setChoice(null)} onSelect={(value) => updateSetting('refreshRate', value)} options={['Live', 'Every 5 seconds', 'Every 15 seconds'] as const} title="Refresh rate" value={settings.refreshRate} visible={choice === 'refresh'} />
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: 28 },
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: { color: colors.textFaint, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 5, textTransform: 'uppercase' },
});
