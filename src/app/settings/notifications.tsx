import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/ui/screen';
import { SettingRow } from '@/components/ui/setting-row';
import { TopBar } from '@/components/ui/top-bar';
import { useExchange } from '@/context/exchange-context';
import { colors, spacing, typography } from '@/theme/tokens';

export default function NotificationSettingsScreen() {
  const { settings, updateSetting, alerts } = useExchange();
  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar back title="Notifications" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.status}><Text style={styles.statusLabel}>Push notifications</Text><Text style={styles.statusValue}>Enabled</Text></View>
        <Section title="Markets">
          <SettingRow hint={String(alerts.size) + ' active market alerts'} icon="bell" label="Price alerts" onToggle={(value) => updateSetting('priceAlerts', value)} toggle={settings.priceAlerts} />
          <SettingRow hint="Fills, cancellations and rejected orders." icon="trade" label="Order updates" onToggle={(value) => updateSetting('orderUpdates', value)} toggle={settings.orderUpdates} />
          <SettingRow hint="Liquidation proximity and sharp margin changes." icon="alert" label="Position risk" onToggle={(value) => updateSetting('positionRisk', value)} toggle={settings.positionRisk} />
        </Section>
        <Text style={styles.note}>Critical account security alerts remain enabled.</Text>
      </ScrollView>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: 28 },
  status: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: spacing.page, marginTop: 16, minHeight: 48, paddingHorizontal: 13 },
  statusLabel: { color: colors.text, fontFamily: typography.medium, fontSize: 12 },
  statusValue: { color: colors.positive, fontFamily: typography.semibold, fontSize: 11 },
  section: { marginTop: 23, paddingHorizontal: spacing.page },
  sectionTitle: { color: colors.textFaint, fontFamily: typography.semibold, fontSize: 10, letterSpacing: 0.8, marginBottom: 5, textTransform: 'uppercase' },
  note: { color: colors.textMuted, fontFamily: typography.regular, fontSize: 11, lineHeight: 17, paddingHorizontal: spacing.page, paddingTop: 20 },
});
