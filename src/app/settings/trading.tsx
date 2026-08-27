import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ChoiceSheet } from '@/components/ui/choice-sheet';
import { Screen } from '@/components/ui/screen';
import { SettingRow } from '@/components/ui/setting-row';
import { TopBar } from '@/components/ui/top-bar';
import { useExchange } from '@/context/exchange-context';
import { colors, spacing, typography } from '@/theme/tokens';

type Choice = 'interface' | 'orderType' | 'leverage' | null;

export default function TradingSettingsScreen() {
  const { settings, updateSetting } = useExchange();
  const [choice, setChoice] = useState<Choice>(null);
  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar back title="Trading preferences" />
      <ScrollView contentContainerStyle={styles.content}>
        <Section title="Interface">
          <SettingRow
            hint={settings.interfaceMode === 'basic' ? 'Streamlined chart and market execution.' : 'Candles, order book and full order controls.'}
            icon="trade"
            label="Trading interface"
            onPress={() => setChoice('interface')}
            value={settings.interfaceMode === 'basic' ? 'Basic' : 'Advanced'}
          />
        </Section>
        <Section title="Order defaults">
          <SettingRow icon="trade" label="Default order type" onPress={() => setChoice('orderType')} value={settings.defaultOrderType.charAt(0).toUpperCase() + settings.defaultOrderType.slice(1)} />
          <SettingRow icon="sliders" label="Default leverage" onPress={() => setChoice('leverage')} value={String(settings.defaultLeverage) + 'x'} />
          <SettingRow icon="check" label="Confirm orders" onToggle={(value) => updateSetting('confirmOrders', value)} toggle={settings.confirmOrders} />
          <SettingRow hint="Show take-profit and stop-loss fields on the order ticket." icon="alert" label="Risk controls" onToggle={(value) => updateSetting('attachRiskControls', value)} toggle={settings.attachRiskControls} />
        </Section>
        <Text style={styles.note}>Interface changes apply immediately and use the same balance, positions and orders.</Text>
      </ScrollView>

      <ChoiceSheet format={(value) => value === 'basic' ? 'Basic' : 'Advanced'} onClose={() => setChoice(null)} onSelect={(value) => updateSetting('interfaceMode', value)} options={['basic', 'advanced'] as const} title="Trading interface" value={settings.interfaceMode} visible={choice === 'interface'} />
      <ChoiceSheet format={(value) => value.charAt(0).toUpperCase() + value.slice(1)} onClose={() => setChoice(null)} onSelect={(value) => updateSetting('defaultOrderType', value)} options={['market', 'limit', 'stop'] as const} title="Default order type" value={settings.defaultOrderType} visible={choice === 'orderType'} />
      <ChoiceSheet format={(value) => String(value) + 'x'} onClose={() => setChoice(null)} onSelect={(value) => updateSetting('defaultLeverage', value)} options={[1, 2, 3, 5, 10, 20] as const} title="Default leverage" value={settings.defaultLeverage} visible={choice === 'leverage'} />
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: 28 },
  section: { marginTop: 22, paddingHorizontal: spacing.page },
  sectionTitle: { color: colors.textFaint, fontFamily: typography.semibold, fontSize: 10, letterSpacing: 0.8, marginBottom: 5, textTransform: 'uppercase' },
  note: { color: colors.textMuted, fontFamily: typography.regular, fontSize: 11, lineHeight: 17, paddingHorizontal: spacing.page, paddingTop: 20 },
});
