import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import artworkCredits from '@/data/artwork-credits.json';
import { APP_VERSION, checkForUpdate, downloadUpdate, type AppUpdate } from '@/lib/app-updates';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Screen } from '@/components/ui/screen';
import { SettingRow } from '@/components/ui/setting-row';
import { SettingsSection } from '@/components/ui/settings-section';
import { TopBar } from '@/components/ui/top-bar';
import { radii, spacing, typography } from '@/theme/tokens';
import { createThemedStyles } from '@/theme/use-themed-styles';

type Topic = 'Artwork credits' | 'Risk disclosure' | 'Privacy policy' | 'Terms of service' | 'Help centre';
const COPY: Record<Topic, string> = {
  'Artwork credits': 'Football photos from Wikimedia Commons, compressed for display. Their original licenses apply. Existing football artwork and club marks remain with their respective owners.',
  'Risk disclosure': 'Index perpetuals use leverage. Prices can move quickly, losses can exceed the margin assigned to a position, and liquidation can occur before a market recovers.',
  'Privacy policy': 'BlackBook stores app preferences on your device. Account and trading data are protected according to the privacy controls attached to your account.',
  'Terms of service': 'BlackBook market access is subject to eligibility, regional restrictions, risk controls, and the terms accepted for your account.',
  'Help centre': 'Use Profile for account preferences, All Indices to find a market, Trade to place an order, and Portfolio to manage positions and open orders.',
};

export default function AboutScreen() {
  const styles = useStyles();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [checking, setChecking] = useState(false);
  const [update, setUpdate] = useState<AppUpdate | null>(null);
  const [status, setStatus] = useState('');
  const check = async () => {
    if (checking) return;
    setChecking(true);
    try { const latest = await checkForUpdate(); setUpdate(latest); setStatus(latest ? `Version ${latest.version} available` : 'You have the latest version.'); }
    catch { setStatus('Could not check for updates. Try again.'); }
    finally { setChecking(false); }
  };
  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar back title="About BlackBook" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.brand}><Text accessibilityLabel="BlackBook" style={styles.wordmark}>BlackBook</Text><Text style={styles.version}>Version {APP_VERSION}</Text></View>
        <SettingsSection title="App updates">
          <SettingRow icon="download" label={checking ? 'Checking…' : 'Check for updates'} onPress={check} />
          {update && Platform.OS === 'android' ? <SettingRow icon="download" label={`Download BlackBook ${update.version}`} onPress={() => { void downloadUpdate(update).catch(() => Alert.alert('Download unavailable', 'Please try again.')); }} /> : null}
        </SettingsSection>
        {status ? <Text style={styles.disclosure}>{status}</Text> : null}
        {update && Platform.OS !== 'android' ? <Text style={styles.disclosure}>APK downloads are available on Android.</Text> : null}
        <SettingsSection title="Information">
          <SettingRow icon="alert" label="Risk disclosure" onPress={() => setTopic('Risk disclosure')} />
          <SettingRow icon="lock" label="Privacy policy" onPress={() => setTopic('Privacy policy')} />
          <SettingRow icon="document" label="Terms of service" onPress={() => setTopic('Terms of service')} />
          <SettingRow icon="document" label="Artwork credits" onPress={() => setTopic('Artwork credits')} />
          <SettingRow icon="support" label="Help centre" onPress={() => setTopic('Help centre')} />
        </SettingsSection>
        <Text style={styles.disclosure}>Leveraged index trading can result in rapid losses. Only trade with funds you can afford to lose.</Text>
        <Text style={styles.copyright}>© 2026 Modnight</Text>
      </ScrollView>
      <BottomSheet onClose={() => setTopic(null)} title={topic ?? ''} visible={topic !== null}>
        <Text style={styles.topicCopy}>{topic ? COPY[topic] : ''}</Text>
        {topic === 'Artwork credits' ? artworkCredits.map((credit) => <View key={credit.title} style={{ marginTop: spacing.md }}><Text style={styles.topicCopy}>{credit.title.replace('File:', '')} — {credit.author}</Text><Pressable accessibilityRole="link" onPress={() => { void Linking.openURL(credit.url).catch(() => Alert.alert('Link unavailable')); }}><Text style={styles.topicCopy}>Source image</Text></Pressable><Pressable accessibilityRole="link" onPress={() => { void Linking.openURL(credit.licenseUrl || credit.url).catch(() => Alert.alert('Link unavailable')); }}><Text style={styles.topicCopy}>{credit.license}</Text></Pressable></View>) : null}
        <Pressable onPress={() => setTopic(null)} style={({ pressed }) => [styles.done, pressed && styles.pressed]}><Text style={styles.doneText}>Done</Text></Pressable>
      </BottomSheet>
    </Screen>
  );
}

const useStyles = createThemedStyles((colors) => ({
  content: { paddingBottom: spacing.xl },
  brand: { alignItems: 'center', borderBottomColor: colors.dividerSoft, borderBottomWidth: StyleSheet.hairlineWidth, paddingBottom: spacing.lg, paddingTop: spacing.lg },
  wordmark: { color: colors.text, fontFamily: typography.bold, fontSize: 28, letterSpacing: -1 },
  version: { color: colors.textMuted, fontFamily: typography.family, fontSize: 10, fontWeight: typography.weights.regular, marginTop: spacing.xs },
  disclosure: { color: colors.textMuted, fontFamily: typography.family, fontSize: 10, fontWeight: typography.weights.regular, lineHeight: 16, paddingHorizontal: spacing.page, paddingTop: spacing.md },
  copyright: { color: colors.textFaint, fontFamily: typography.family, fontSize: 9, fontWeight: typography.weights.regular, paddingTop: spacing.lg, textAlign: 'center' },
  topicCopy: { color: colors.textMuted, fontFamily: typography.family, fontSize: 13, fontWeight: typography.weights.regular, lineHeight: 20 },
  done: { alignItems: 'center', backgroundColor: colors.text, borderRadius: radii.md, justifyContent: 'center', marginTop: spacing.lg, minHeight: 48 },
  doneText: { color: colors.bg, fontFamily: typography.family, fontSize: 14, fontWeight: typography.weights.semibold },
  pressed: { opacity: 0.72 },
}));
