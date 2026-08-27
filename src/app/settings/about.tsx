import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { BrandMark } from '@/components/ui/brand-mark';
import { Screen } from '@/components/ui/screen';
import { SettingRow } from '@/components/ui/setting-row';
import { TopBar } from '@/components/ui/top-bar';
import { colors } from '@/theme/tokens';

export default function AboutScreen() {
  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar back title="About" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.brand}><BrandMark size={68} /><Text style={styles.name}>BLACKBOOK</Text><Text style={styles.version}>Version 0.1.0</Text></View>
        <View style={styles.section}>
          <SettingRow icon="alert" label="Risk disclosure" onPress={() => undefined} />
          <SettingRow icon="lock" label="Privacy policy" onPress={() => undefined} />
          <SettingRow icon="info" label="Terms of service" onPress={() => undefined} />
          <SettingRow icon="help" label="Help centre" onPress={() => undefined} />
        </View>
        <Text style={styles.disclosure}>Index perpetuals use leverage and can result in rapid losses. Only trade with funds you can afford to lose.</Text>
        <Text style={styles.copyright}>© 2026 Modnight. All rights reserved.</Text>
      </ScrollView>
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
});
