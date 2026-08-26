import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Wordmark } from '@/components/brand/wordmark';
import { Screen } from '@/components/layout/screen';
import { ModeSwitcher } from '@/components/mode/mode-switcher';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useInterfaceMode } from '@/context/interface-mode';

interface SettingRowProps {
  icon: SymbolViewProps['name'];
  label: string;
  value?: string;
}

function SettingRow({ icon, label, value }: SettingRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [styles.settingRow, pressed && styles.pressed]}>
      <SymbolView name={icon} size={24} tintColor={colors.text} />
      <Text style={styles.settingLabel}>{label}</Text>
      {value ? <Text style={styles.settingValue}>{value}</Text> : null}
      <SymbolView
        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        size={20}
        tintColor={colors.textMuted}
      />
    </Pressable>
  );
}

export default function MenuScreen() {
  const { mode } = useInterfaceMode();

  return (
    <Screen>
      <View style={styles.brandLine}>
        <Wordmark />
        <Text style={styles.version}>v0.1.0</Text>
      </View>
      <Text style={styles.title}>Menu</Text>

      <View style={styles.accountBlock}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>B</Text>
        </View>
        <View style={styles.accountCopy}>
          <Text style={styles.accountName}>Blackbook account</Text>
          <Text style={styles.accountMeta}>Authentication wiring follows the foundation.</Text>
        </View>
      </View>

      <View style={styles.modeSection}>
        <View style={styles.modeCopy}>
          <Text style={styles.modeTitle}>Interface mode</Text>
          <Text style={styles.modeDescription}>
            {mode === 'basic'
              ? 'Clear discovery and fast execution.'
              : 'Full charting, depth, orders, and risk detail.'}
          </Text>
        </View>
        <ModeSwitcher />
      </View>

      <Text style={styles.groupTitle}>PREFERENCES</Text>
      <View style={styles.settingsGroup}>
        <SettingRow
          icon={{ ios: 'circle.lefthalf.filled', android: 'contrast', web: 'contrast' }}
          label="Appearance"
          value="System"
        />
        <SettingRow
          icon={{ ios: 'bell', android: 'notifications', web: 'notifications' }}
          label="Alerts and notifications"
        />
        <SettingRow
          icon={{ ios: 'dollarsign.circle', android: 'attach_money', web: 'attach_money' }}
          label="Display currency"
          value="USD"
        />
        <SettingRow
          icon={{ ios: 'globe', android: 'language', web: 'language' }}
          label="Language"
          value="English"
        />
      </View>

      <Text style={styles.groupTitle}>BLACKBOOK</Text>
      <View style={styles.settingsGroup}>
        <SettingRow
          icon={{ ios: 'function', android: 'functions', web: 'functions' }}
          label="Index methodology"
        />
        <SettingRow
          icon={{ ios: 'questionmark.circle', android: 'help', web: 'help' }}
          label="Help and contact"
        />
        <SettingRow
          icon={{ ios: 'info.circle', android: 'info', web: 'info' }}
          label="About Blackbook"
        />
      </View>

      <View style={styles.disclosure}>
        <Text style={styles.disclosureTitle}>Foundation checkpoint</Text>
        <Text style={styles.disclosureBody}>
          Market fixtures, account fixtures, and order review are isolated from production services. No trade can be submitted from this build.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brandLine: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
  },
  version: {
    color: colors.textMuted,
    fontSize: typography.label,
    fontVariant: ['tabular-nums'],
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '900',
    letterSpacing: -0.9,
    marginTop: spacing.xl,
  },
  accountBlock: {
    alignItems: 'center',
    borderBottomColor: colors.line,
    borderTopColor: colors.line,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    flexDirection: 'row',
    marginTop: spacing.lg,
    paddingVertical: spacing.lg,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: radius.control,
    height: 52,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 52,
  },
  avatarText: {
    color: colors.textOnDark,
    fontSize: 22,
    fontWeight: '900',
  },
  accountCopy: {
    flex: 1,
  },
  accountName: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  accountMeta: {
    color: colors.textMuted,
    fontSize: typography.label,
    lineHeight: 17,
    marginTop: 3,
  },
  modeSection: {
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    paddingVertical: spacing.lg,
  },
  modeCopy: {
    marginBottom: spacing.md,
  },
  modeTitle: {
    color: colors.text,
    fontSize: typography.section,
    fontWeight: '800',
  },
  modeDescription: {
    color: colors.textMuted,
    fontSize: typography.compact,
    marginTop: spacing.xs,
  },
  groupTitle: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    paddingBottom: spacing.xs,
    paddingTop: spacing.xl,
  },
  settingsGroup: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
  },
  settingRow: {
    alignItems: 'center',
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 62,
  },
  settingLabel: {
    color: colors.text,
    flex: 1,
    fontSize: typography.body,
    marginLeft: spacing.md,
  },
  settingValue: {
    color: colors.textMuted,
    fontSize: typography.compact,
    marginRight: spacing.xs,
  },
  pressed: {
    opacity: 0.55,
  },
  disclosure: {
    backgroundColor: colors.mutedSurface,
    borderRadius: radius.control,
    marginTop: spacing.xl,
    padding: spacing.md,
  },
  disclosureTitle: {
    color: colors.text,
    fontSize: typography.compact,
    fontWeight: '800',
  },
  disclosureBody: {
    color: colors.textMuted,
    fontSize: typography.label,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
});
