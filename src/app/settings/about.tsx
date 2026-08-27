import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Screen } from '@/components/ui/screen';
import { SettingRow } from '@/components/ui/setting-row';
import { SettingsSection } from '@/components/ui/settings-section';
import { TopBar } from '@/components/ui/top-bar';
import { colors, radii, spacing, typography } from '@/theme/tokens';

type Topic = 'Risk disclosure' | 'Privacy policy' | 'Terms of service' | 'Help centre';
const COPY: Record<Topic, string> = {
  'Risk disclosure': 'Index perpetuals use leverage. Prices can move quickly, losses can exceed the margin assigned to a position, and liquidation can occur before a market recovers.',
  'Privacy policy': 'Account preferences and trading activity in this build remain on this device. Production services will publish their data handling terms before account connectivity is introduced.',
  'Terms of service': 'BlackBook market access is subject to eligibility, regional restrictions, risk controls, and the terms presented when production account services are introduced.',
  'Help centre': 'Use Profile for account preferences, All Indices to find a market, Trade to place an order, and Portfolio to manage positions and open orders.',
};

export default function AboutScreen() {
  const [topic, setTopic] = useState<Topic | null>(null);
  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar back title="About BlackBook" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.brand}><Image accessibilityLabel="BlackBook" resizeMode="contain" source={require('../../../assets/splash-icon.png')} style={styles.wordmark} /><Text style={styles.version}>Version 0.1.0</Text></View>
        <SettingsSection title="Information">
          <SettingRow icon="alert" label="Risk disclosure" onPress={() => setTopic('Risk disclosure')} />
          <SettingRow icon="lock" label="Privacy policy" onPress={() => setTopic('Privacy policy')} />
          <SettingRow icon="document" label="Terms of service" onPress={() => setTopic('Terms of service')} />
          <SettingRow icon="support" label="Help centre" onPress={() => setTopic('Help centre')} />
        </SettingsSection>
        <Text style={styles.disclosure}>Leveraged index trading can result in rapid losses. Only trade with funds you can afford to lose.</Text>
        <Text style={styles.copyright}>© 2026 Modnight</Text>
      </ScrollView>
      <BottomSheet onClose={() => setTopic(null)} title={topic ?? ''} visible={topic !== null}>
        <Text style={styles.topicCopy}>{topic ? COPY[topic] : ''}</Text>
        <Pressable onPress={() => setTopic(null)} style={({ pressed }) => [styles.done, pressed && styles.pressed]}><Text style={styles.doneText}>Done</Text></Pressable>
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
  brand: { alignItems: 'center', borderBottomColor: colors.dividerSoft, borderBottomWidth: StyleSheet.hairlineWidth, paddingBottom: spacing.lg, paddingTop: spacing.lg },
  wordmark: { height: 44, width: 210 },
  version: { color: colors.textMuted, fontFamily: typography.family, fontSize: 10, fontWeight: typography.weights.regular, marginTop: spacing.xs },
  disclosure: { color: colors.textMuted, fontFamily: typography.family, fontSize: 10, fontWeight: typography.weights.regular, lineHeight: 16, paddingHorizontal: spacing.page, paddingTop: spacing.md },
  copyright: { color: colors.textFaint, fontFamily: typography.family, fontSize: 9, fontWeight: typography.weights.regular, paddingTop: spacing.lg, textAlign: 'center' },
  topicCopy: { color: colors.textMuted, fontFamily: typography.family, fontSize: 13, fontWeight: typography.weights.regular, lineHeight: 20 },
  done: { alignItems: 'center', backgroundColor: colors.text, borderRadius: radii.md, justifyContent: 'center', marginTop: spacing.lg, minHeight: 48 },
  doneText: { color: colors.bg, fontFamily: typography.family, fontSize: 14, fontWeight: typography.weights.semibold },
  pressed: { opacity: 0.72 },
});
