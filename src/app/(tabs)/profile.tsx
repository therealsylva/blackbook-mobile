import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Icon, type IconName } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { useExchange } from '@/context/exchange-context';
import { colors, spacing, typography } from '@/theme/tokens';

type ProfileRoute = '/settings' | '/settings/trading' | '/settings/notifications' | '/settings/security' | '/settings/about';

interface ProfileLink {
  label: string;
  copy?: string;
  icon: IconName;
  route: ProfileRoute;
  value?: string;
}

const SUPPORT_LINKS: ProfileLink[] = [
  { label: 'Help centre', copy: 'Using BlackBook and account support', icon: 'help', route: '/settings/about' },
  { label: 'Legal and risk', icon: 'alert', route: '/settings/about' },
  { label: 'About BlackBook', icon: 'info', route: '/settings/about' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { settings, updateSetting, positions, orders, alerts } = useExchange();
  const nextMode = settings.interfaceMode === 'basic' ? 'advanced' : 'basic';
  const accountLinks: ProfileLink[] = [
    { label: 'Account & security', icon: 'security', route: '/settings/security', value: settings.appLock ? 'Protected' : 'Standard' },
    { label: 'Trading preferences', icon: 'sliders', route: '/settings/trading' },
    { label: 'Notifications', icon: 'bell', route: '/settings/notifications', value: alerts.size ? `${alerts.size} active` : undefined },
  ];
  const appLinks: ProfileLink[] = [
    { label: 'Appearance', icon: 'palette', route: '/settings', value: 'Dark' },
    { label: 'Display currency', icon: 'currency', route: '/settings', value: settings.currency },
    { label: 'Language', icon: 'globe', route: '/settings', value: settings.language },
  ];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Profile</Text>
          <Pressable accessibilityLabel="Open settings" hitSlop={10} onPress={() => router.push('/settings')} style={styles.titleAction}><Icon name="settings" size={22} /></Pressable>
        </View>

        <View style={styles.account}>
          <View style={styles.avatar}><Icon color={colors.text} filled name="profile" size={32} /></View>
          <View style={styles.accountCopy}><Text style={styles.accountName}>Sylva</Text><Text style={styles.uid}>UID 248 731 905</Text></View>
          <View style={styles.verified}><Icon color={colors.positive} name="check" size={13} /><Text style={styles.verifiedText}>Verified</Text></View>
        </View>

        <View style={styles.accountStats}>
          <AccountStat label="Positions" value={positions.length} />
          <AccountStat label="Open orders" value={orders.length} />
          <AccountStat label="Active alerts" value={alerts.size} />
        </View>

        <Pressable
          accessibilityLabel={`Switch to ${nextMode} trading`}
          onPress={() => updateSetting('interfaceMode', nextMode)}
          style={({ pressed }) => [styles.modeCard, pressed && styles.pressed]}
        >
          <View style={styles.modeIcon}><Icon name={nextMode === 'advanced' ? 'chart' : 'trade'} size={22} /></View>
          <View style={styles.modeCopy}>
            <Text style={styles.modeTitle}>Switch to {nextMode === 'advanced' ? 'Advanced' : 'Basic'}</Text>
            <Text style={styles.modeMeta}>{nextMode === 'advanced' ? 'Candles, order book and full order controls' : 'A faster, streamlined order flow'}</Text>
          </View>
          <Icon color={colors.textMuted} name="chevron" size={17} />
        </Pressable>

        <ProfileSection links={accountLinks} title="Account" onOpen={(route) => router.push(route)} />
        <ProfileSection links={appLinks} title="App" onOpen={(route) => router.push(route)} />
        <ProfileSection links={SUPPORT_LINKS} title="Support" onOpen={(route) => router.push(route)} />

        <Text style={styles.version}>BlackBook 0.1.0</Text>
      </ScrollView>
    </Screen>
  );
}

function AccountStat({ label, value }: { label: string; value: number }) {
  return <View style={styles.accountStat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

function ProfileSection({ title, links, onOpen }: { title: string; links: ProfileLink[]; onOpen: (route: ProfileRoute) => void }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {links.map((link) => (
        <Pressable accessibilityRole="button" key={link.label} onPress={() => onOpen(link.route)} style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
          <View style={styles.linkIcon}><Icon color={colors.textMuted} name={link.icon} size={21} /></View>
          <View style={styles.linkCopy}><Text style={styles.linkLabel}>{link.label}</Text>{link.copy ? <Text style={styles.linkMeta}>{link.copy}</Text> : null}</View>
          {link.value ? <Text style={styles.linkValue}>{link.value}</Text> : null}
          <Icon color={colors.textFaint} name="chevron" size={17} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 32 },
  titleRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 58, paddingHorizontal: spacing.page },
  title: { color: colors.text, fontFamily: typography.bold, fontSize: 25, letterSpacing: -0.5 },
  titleAction: { alignItems: 'center', height: 48, justifyContent: 'center', width: 44 },
  account: { alignItems: 'center', flexDirection: 'row', paddingHorizontal: spacing.page, paddingTop: 18 },
  avatar: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 29, height: 58, justifyContent: 'center', width: 58 },
  accountCopy: { flex: 1, marginLeft: 13 },
  accountName: { color: colors.text, fontFamily: typography.semibold, fontSize: 19 },
  uid: { color: colors.textMuted, fontFamily: typography.regular, fontSize: 10, letterSpacing: 0.25, marginTop: 5 },
  verified: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  verifiedText: { color: colors.positive, fontFamily: typography.semibold, fontSize: 10 },
  accountStats: { flexDirection: 'row', marginHorizontal: spacing.page, marginTop: 24 },
  accountStat: { flex: 1 },
  statValue: { color: colors.text, fontFamily: typography.semibold, fontSize: 15, fontVariant: ['tabular-nums'] },
  statLabel: { color: colors.textMuted, fontFamily: typography.regular, fontSize: 9, marginTop: 4 },
  modeCard: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, flexDirection: 'row', marginHorizontal: spacing.page, marginTop: 25, minHeight: 74, paddingHorizontal: 13 },
  modeIcon: { alignItems: 'center', backgroundColor: colors.surfaceRaised, borderRadius: 20, height: 40, justifyContent: 'center', width: 40 },
  modeCopy: { flex: 1, marginHorizontal: 11 },
  modeTitle: { color: colors.text, fontFamily: typography.semibold, fontSize: 13 },
  modeMeta: { color: colors.textMuted, fontFamily: typography.regular, fontSize: 10, lineHeight: 14, marginTop: 4 },
  section: { marginTop: 27, paddingHorizontal: spacing.page },
  sectionTitle: { color: colors.textFaint, fontFamily: typography.semibold, fontSize: 10, letterSpacing: 0.75, marginBottom: 5, textTransform: 'uppercase' },
  link: { alignItems: 'center', flexDirection: 'row', minHeight: 60 },
  linkIcon: { alignItems: 'center', marginRight: 13, width: 24 },
  linkCopy: { flex: 1 },
  linkLabel: { color: colors.text, fontFamily: typography.medium, fontSize: 14 },
  linkMeta: { color: colors.textMuted, fontFamily: typography.regular, fontSize: 10, marginTop: 3 },
  linkValue: { color: colors.textMuted, fontFamily: typography.regular, fontSize: 11, marginRight: 5 },
  version: { color: colors.textFaint, fontFamily: typography.regular, fontSize: 10, marginTop: 26, textAlign: 'center' },
  pressed: { opacity: 0.64 },
});
