import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/ui/screen';
import { SettingRow } from '@/components/ui/setting-row';
import { SettingsSection } from '@/components/ui/settings-section';
import { TopBar } from '@/components/ui/top-bar';
import { useExchange } from '@/context/exchange-context';
import { colors, spacing, typography } from '@/theme/tokens';

export default function NotificationSettingsScreen() {
  const { settings, updateSetting, alerts } = useExchange();
  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar back title="Notifications" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.status}><Text style={styles.statusLabel}>Push notifications</Text><Text style={styles.statusValue}>On</Text></View>
        <SettingsSection title="Trading">
          <SettingRow hint={`${alerts.size} active price alert${alerts.size === 1 ? '' : 's'}`} icon="bell" label="Price alerts" onToggle={(value) => updateSetting('priceAlerts', value)} toggle={settings.priceAlerts} />
          <SettingRow hint="Fills, cancellations and rejected orders." icon="orders" label="Order updates" onToggle={(value) => updateSetting('orderUpdates', value)} toggle={settings.orderUpdates} />
          <SettingRow hint="Liquidation proximity and margin changes." icon="alert" label="Position risk" onToggle={(value) => updateSetting('positionRisk', value)} toggle={settings.positionRisk} />
        </SettingsSection>
        <Text style={styles.note}>Critical security notices stay enabled.</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
  status: { alignItems: 'center', borderBottomColor: colors.dividerSoft, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', minHeight: 52, paddingHorizontal: spacing.page },
  statusLabel: { color: colors.text, fontFamily: typography.family, fontSize: 13, fontWeight: typography.weights.medium },
  statusValue: { color: colors.positive, fontFamily: typography.family, fontSize: 11, fontWeight: typography.weights.semibold },
  note: { color: colors.textMuted, fontFamily: typography.family, fontSize: 10, fontWeight: typography.weights.regular, paddingHorizontal: spacing.page, paddingTop: spacing.md },
});
