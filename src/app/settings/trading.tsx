import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { ChoiceSheet } from '@/components/ui/choice-sheet';
import { Screen } from '@/components/ui/screen';
import { SettingRow } from '@/components/ui/setting-row';
import { SettingsSection } from '@/components/ui/settings-section';
import { TopBar } from '@/components/ui/top-bar';
import { useExchange } from '@/context/exchange-context';
import { colors, spacing, typography } from '@/theme/tokens';

type Choice = 'interface' | 'orderType' | 'leverage' | 'refresh' | null;

export default function TradingSettingsScreen() {
  const { settings, updateSetting } = useExchange();
  const [choice, setChoice] = useState<Choice>(null);
  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar back title="Trading preferences" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SettingsSection title="Trading interface">
          <SettingRow hint="Basic is streamlined. Advanced adds candles, the order book and complete controls." icon="mode" label="Interface" onPress={() => setChoice('interface')} value={settings.interfaceMode === 'basic' ? 'Basic' : 'Advanced'} />
          <SettingRow icon="refresh" label="Market refresh" onPress={() => setChoice('refresh')} value={settings.refreshRate} />
        </SettingsSection>
        <SettingsSection title="Order defaults">
          <SettingRow icon="orders" label="Default order type" onPress={() => setChoice('orderType')} value={settings.defaultOrderType.charAt(0).toUpperCase() + settings.defaultOrderType.slice(1)} />
          <SettingRow icon="sliders" label="Default leverage" onPress={() => setChoice('leverage')} value={`${settings.defaultLeverage}x`} />
          <SettingRow icon="check" label="Order confirmation" onToggle={(value) => updateSetting('confirmOrders', value)} toggle={settings.confirmOrders} />
          <SettingRow hint="Attach take-profit and stop-loss fields to new tickets." icon="alert" label="Risk controls" onToggle={(value) => updateSetting('attachRiskControls', value)} toggle={settings.attachRiskControls} />
        </SettingsSection>
        <Text style={styles.note}>Interface changes keep the same balance, positions and open orders.</Text>
      </ScrollView>
      <ChoiceSheet format={(value) => value === 'basic' ? 'Basic' : 'Advanced'} onClose={() => setChoice(null)} onSelect={(value) => updateSetting('interfaceMode', value)} options={['basic', 'advanced'] as const} title="Trading interface" value={settings.interfaceMode} visible={choice === 'interface'} />
      <ChoiceSheet format={(value) => value.charAt(0).toUpperCase() + value.slice(1)} onClose={() => setChoice(null)} onSelect={(value) => updateSetting('defaultOrderType', value)} options={['market', 'limit', 'stop'] as const} title="Default order type" value={settings.defaultOrderType} visible={choice === 'orderType'} />
      <ChoiceSheet format={(value) => `${value}x`} onClose={() => setChoice(null)} onSelect={(value) => updateSetting('defaultLeverage', value)} options={[1, 2, 3, 5, 10, 20] as const} title="Default leverage" value={settings.defaultLeverage} visible={choice === 'leverage'} />
      <ChoiceSheet onClose={() => setChoice(null)} onSelect={(value) => updateSetting('refreshRate', value)} options={['Live', 'Every 5 seconds', 'Every 15 seconds'] as const} title="Market refresh" value={settings.refreshRate} visible={choice === 'refresh'} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
  note: { color: colors.textMuted, fontFamily: typography.family, fontSize: 10, fontWeight: typography.weights.regular, lineHeight: 15, paddingHorizontal: spacing.page, paddingTop: spacing.md },
});
