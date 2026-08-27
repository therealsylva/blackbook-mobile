import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChoiceSheet } from '@/components/ui/choice-sheet';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { SettingRow } from '@/components/ui/setting-row';
import { SettingsSection } from '@/components/ui/settings-section';
import { TopBar } from '@/components/ui/top-bar';
import { useExchange } from '@/context/exchange-context';
import { colors, radii, spacing, typography } from '@/theme/tokens';

type Choice = 'language' | 'currency' | 'colors' | null;

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, updateSetting } = useExchange();
  const [choice, setChoice] = useState<Choice>(null);

  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar back title="Settings" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.account}>
          <View style={styles.avatar}><Icon filled name="profile" size={25} /></View>
          <View style={styles.accountCopy}><Text style={styles.accountName}>Sylva</Text><Text style={styles.uid}>UID 248 731 905</Text></View>
          <Icon color={colors.positive} name="security" size={18} />
        </View>

        <SettingsSection title="Account">
          <SettingRow icon="security" label="Security" onPress={() => router.push('/settings/security')} value={settings.appLock ? 'Protected' : 'Standard'} />
          <SettingRow icon="bell" label="Notifications" onPress={() => router.push('/settings/notifications')} />
          <SettingRow icon="trade" label="Trading preferences" onPress={() => router.push('/settings/trading')} value={settings.interfaceMode === 'basic' ? 'Basic' : 'Advanced'} />
        </SettingsSection>

        <SettingsSection title="App preferences">
          <SettingRow icon="appearance" label="Appearance" value="Dark" />
          <SettingRow icon="language" label="Language" onPress={() => setChoice('language')} value={settings.language} />
          <SettingRow icon="currency" label="Display currency" onPress={() => setChoice('currency')} value={settings.currency} />
          <SettingRow icon="markets" label="Market colours" onPress={() => setChoice('colors')} value={settings.colorPreference} />
        </SettingsSection>

        <SettingsSection title="Support">
          <SettingRow icon="support" label="Help centre" onPress={() => router.push('/settings/about')} />
          <SettingRow icon="document" label="Legal & risk" onPress={() => router.push('/settings/about')} />
          <SettingRow icon="info" label="About BlackBook" onPress={() => router.push('/settings/about')} value="0.1.0" />
        </SettingsSection>
      </ScrollView>

      <ChoiceSheet onClose={() => setChoice(null)} onSelect={(value) => updateSetting('language', value)} options={['English', 'French', 'Spanish'] as const} title="Language" value={settings.language} visible={choice === 'language'} />
      <ChoiceSheet onClose={() => setChoice(null)} onSelect={(value) => updateSetting('currency', value)} options={['USD', 'EUR', 'GBP'] as const} title="Display currency" value={settings.currency} visible={choice === 'currency'} />
      <ChoiceSheet onClose={() => setChoice(null)} onSelect={(value) => updateSetting('colorPreference', value)} options={['Green up / Red down', 'Red up / Green down'] as const} title="Market colours" value={settings.colorPreference} visible={choice === 'colors'} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
  account: { alignItems: 'center', backgroundColor: colors.section, borderBottomColor: colors.dividerSoft, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 76, paddingHorizontal: spacing.page },
  avatar: { alignItems: 'center', backgroundColor: colors.surfaceRaised, borderRadius: radii.lg, height: 44, justifyContent: 'center', width: 44 },
  accountCopy: { flex: 1, marginLeft: spacing.sm },
  accountName: { color: colors.text, fontFamily: typography.family, fontSize: 15, fontWeight: typography.weights.semibold },
  uid: { color: colors.textMuted, fontFamily: typography.family, fontSize: 10, fontWeight: typography.weights.regular, marginTop: spacing.xxs },
});
