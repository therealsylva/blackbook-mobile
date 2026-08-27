import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BrandMark } from '@/components/ui/brand-mark';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Screen } from '@/components/ui/screen';
import { SettingRow } from '@/components/ui/setting-row';
import { TopBar } from '@/components/ui/top-bar';
import { colors } from '@/theme/tokens';

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
      <TopBar back title="About" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.brand}><BrandMark size={68} /><Text style={styles.name}>BLACKBOOK</Text><Text style={styles.version}>Version 0.1.0</Text></View>
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
  brand: { alignItems: 'center', paddingBottom: 25, paddingTop: 24 },
  name: { color: colors.text, fontSize: 17, fontWeight: '900', letterSpacing: 2.2, marginTop: 10 },
  version: { color: colors.textMuted, fontSize: 10, marginTop: 5 },
  section: { borderTopColor: colors.divider, borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16 },
  disclosure: { color: colors.textMuted, fontSize: 11, lineHeight: 17, paddingHorizontal: 16, paddingTop: 23 },
  copyright: { color: colors.textFaint, fontSize: 9, paddingTop: 25, textAlign: 'center' },
  topicCopy: { color: colors.textMuted, fontSize: 13, lineHeight: 21 },
  done: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: 6, justifyContent: 'center', marginTop: 22, minHeight: 48 },
  doneText: { color: colors.bg, fontSize: 14, fontWeight: '800' },
});
