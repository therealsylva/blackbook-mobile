import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Screen } from '@/components/ui/screen';
import { SettingRow } from '@/components/ui/setting-row';
import { TopBar } from '@/components/ui/top-bar';
import { colors, spacing, typography } from '@/theme/tokens';

type Topic = 'Risk disclosure' | 'Privacy policy' | 'Terms of service' | 'Help centre';
const COPY: Record<Topic, string> = {
  'Risk disclosure': 'Index perpetuals use leverage. Prices can move quickly, losses can exceed the margin assigned to a position, and liquidation can occur before a market recovers.',
  'Privacy policy': 'Account preferences and trading activity in this build remain on this device. Production services will publish their data handling terms before account connectivity is introduced.',
  'Terms of service': 'Blackbook market access is subject to eligibility, regional restrictions, risk controls, and the terms presented when production account services are introduced.',
  'Help centre': 'Use Profile for account preferences, All Indices to find a market, Trade to place an order, and Portfolio to manage positions and open orders.',
};

export default function AboutScreen() {
  const [topic, setTopic] = useState<Topic | null>(null);
  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar back title="About BlackBook" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.brand}><Image accessible accessibilityLabel="BlackBook" resizeMode="contain" source={require('../../../assets/wordmark.png')} style={styles.wordmark} /><Text style={styles.version}>Version 0.1.0</Text></View>
        <View style={styles.section}>
          <SettingRow icon="alert" label="Risk disclosure" onPress={() => setTopic('Risk disclosure')} />
          <SettingRow icon="lock" label="Privacy policy" onPress={() => setTopic('Privacy policy')} />
          <SettingRow icon="info" label="Terms of service" onPress={() => setTopic('Terms of service')} />
          <SettingRow icon="help" label="Help centre" onPress={() => setTopic('Help centre')} />
        </View>
        <Text style={styles.disclosure}>Index perpetuals use leverage and can result in rapid losses. Only trade with funds you can afford to lose.</Text>
        <Text style={styles.copyright}>© 2026 Modnight. All rights reserved.</Text>
      </ScrollView>
      <BottomSheet onClose={() => setTopic(null)} title={topic ?? ''} visible={topic !== null}>
        <Text style={styles.topicCopy}>{topic ? COPY[topic] : ''}</Text>
        <Pressable onPress={() => setTopic(null)} style={styles.done}><Text style={styles.doneText}>Done</Text></Pressable>
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 28 },
  brand: { alignItems: 'center', paddingBottom: 27, paddingTop: 27 },
  wordmark: { height: 54, width: 180 },
  version: { color: colors.textMuted, fontFamily: typography.regular, fontSize: 10, marginTop: 4 },
  section: { paddingHorizontal: spacing.page },
  disclosure: { color: colors.textMuted, fontFamily: typography.regular, fontSize: 11, lineHeight: 17, paddingHorizontal: spacing.page, paddingTop: 23 },
  copyright: { color: colors.textFaint, fontFamily: typography.regular, fontSize: 9, paddingTop: 25, textAlign: 'center' },
  topicCopy: { color: colors.textMuted, fontFamily: typography.regular, fontSize: 13, lineHeight: 21 },
  done: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: 6, justifyContent: 'center', marginTop: 22, minHeight: 48 },
  doneText: { color: colors.bg, fontFamily: typography.semibold, fontSize: 14 },
});
