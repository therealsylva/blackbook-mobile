import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BrandMark } from '@/components/ui/brand-mark';
import { Icon, type IconName } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { useExchange } from '@/context/exchange-context';
import { colors } from '@/theme/tokens';

interface ProfileLink {
  label: string;
  icon: IconName;
  route?: '/settings' | '/settings/trading' | '/settings/notifications' | '/settings/security' | '/settings/about';
  value?: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { settings, positions, orders, alerts } = useExchange();
  const accountLinks: ProfileLink[] = [
    { label: 'Security', icon: 'security', route: '/settings/security', value: settings.appLock ? 'Protected' : 'Standard' },
    { label: 'Identity verification', icon: 'profile', value: 'Verified' },
    { label: 'Payment methods', icon: 'wallet', value: '2 methods' },
  ];
  const preferenceLinks: ProfileLink[] = [
    { label: 'Trading preferences', icon: 'trade', route: '/settings/trading', value: settings.interfaceMode === 'basic' ? 'Basic' : 'Advanced' },
    { label: 'Notifications', icon: 'bell', route: '/settings/notifications' },
    { label: 'Settings', icon: 'settings', route: '/settings' },
  ];
  const supportLinks: ProfileLink[] = [
    { label: 'Help centre', icon: 'help', route: '/settings/about' },
    { label: 'Risk disclosure', icon: 'alert', route: '/settings/about' },
    { label: 'About Blackbook', icon: 'info', route: '/settings/about' },
  ];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}><Text style={styles.title}>Profile</Text><Pressable onPress={() => router.push('/settings')}><Icon name="settings" size={22} /></Pressable></View>
        <View style={styles.account}>
          <View style={styles.avatar}><BrandMark size={47} /></View>
          <View style={styles.accountCopy}><Text style={styles.accountName}>Sylva</Text><Text style={styles.uid}>UID 248 731 905</Text></View>
          <View style={styles.verified}><Icon color={colors.positive} name="check" size={13} /><Text style={styles.verifiedText}>Verified</Text></View>
        </View>

        <View style={styles.accountStats}>
          <View style={styles.accountStat}><Text style={styles.statValue}>{positions.length}</Text><Text style={styles.statLabel}>Positions</Text></View>
          <View style={styles.accountStat}><Text style={styles.statValue}>{orders.length}</Text><Text style={styles.statLabel}>Open orders</Text></View>
          <View style={styles.accountStat}><Text style={styles.statValue}>{alerts.size}</Text><Text style={styles.statLabel}>Active alerts</Text></View>
        </View>

        <ProfileSection links={accountLinks} title="Account" onOpen={(route) => route && router.push(route)} />
        <ProfileSection links={preferenceLinks} title="Preferences" onOpen={(route) => route && router.push(route)} />
        <ProfileSection links={supportLinks} title="Support" onOpen={(route) => route && router.push(route)} />

        <Text style={styles.version}>Blackbook 0.1.0</Text>
      </ScrollView>
    </Screen>
  );
}

function ProfileSection({ title, links, onOpen }: { title: string; links: ProfileLink[]; onOpen: (route?: ProfileLink['route']) => void }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {links.map((link) => (
        <Pressable disabled={!link.route} key={link.label} onPress={() => onOpen(link.route)} style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
          <View style={styles.linkIcon}><Icon color={colors.textMuted} name={link.icon} size={21} /></View>
          <Text style={styles.linkLabel}>{link.label}</Text>
          {link.value ? <Text style={styles.linkValue}>{link.value}</Text> : null}
          {link.route ? <Icon color={colors.textFaint} name="chevron" size={17} /> : null}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 30 },
  titleRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 13 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  account: { alignItems: 'center', flexDirection: 'row', paddingHorizontal: 16, paddingTop: 24 },
  avatar: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 29, height: 58, justifyContent: 'center', width: 58 },
  accountCopy: { flex: 1, marginLeft: 13 },
  accountName: { color: colors.text, fontSize: 19, fontWeight: '800' },
  uid: { color: colors.textMuted, fontSize: 10, letterSpacing: 0.3, marginTop: 5 },
  verified: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  verifiedText: { color: colors.positive, fontSize: 10, fontWeight: '700' },
  accountStats: { borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', marginHorizontal: 16, marginTop: 22, paddingVertical: 15 },
  accountStat: { alignItems: 'center', flex: 1 },
  statValue: { color: colors.text, fontSize: 15, fontWeight: '800' },
  statLabel: { color: colors.textMuted, fontSize: 9, marginTop: 4 },
  section: { marginTop: 25, paddingHorizontal: 16 },
  sectionTitle: { color: colors.textFaint, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 5, textTransform: 'uppercase' },
  link: { alignItems: 'center', borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 57 },
  linkIcon: { alignItems: 'center', marginRight: 13, width: 24 },
  linkLabel: { color: colors.text, flex: 1, fontSize: 14, fontWeight: '500' },
  linkValue: { color: colors.textMuted, fontSize: 11, marginRight: 5 },
  version: { color: colors.textFaint, fontSize: 10, marginTop: 25, textAlign: 'center' },
  pressed: { opacity: 0.6 },
});
