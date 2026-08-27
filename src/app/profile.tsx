import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { ChoiceSheet } from '@/components/ui/choice-sheet';
import { Icon, type IconName } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { useExchange } from '@/context/exchange-context';
import { colors, radii, spacing, typography } from '@/theme/tokens';

type ProfileTab = 'My info' | 'Security' | 'Preferences' | 'General';
type Choice = 'interface' | 'language' | 'currency' | null;

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, updateProfile, settings, updateSetting } = useExchange();
  const [tab, setTab] = useState<ProfileTab>('My info');
  const [editOpen, setEditOpen] = useState(false);
  const [choice, setChoice] = useState<Choice>(null);
  const [name, setName] = useState(profile.displayName);
  const [avatar, setAvatar] = useState(profile.avatarUri ?? 'void');
  const [imageUri, setImageUri] = useState(profile.avatarUri?.startsWith('http') ? profile.avatarUri : '');

  const save = () => {
    const displayName = name.trim();
    if (!displayName) return;
    updateProfile({ displayName, avatarUri: imageUri.trim() || avatar });
    setEditOpen(false);
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}><Icon name="back" /></Pressable>
          <Text style={styles.title}>User center</Text>
          <View style={styles.back} />
        </View>

        <View style={styles.identity}>
          <Pressable accessibilityLabel="Edit profile picture" onPress={() => setEditOpen(true)} style={styles.avatarWrap}>
            <ProfileAvatar displayName={profile.displayName} variant={profile.avatarUri ?? 'void'} />
            <View style={styles.camera}><Icon color={colors.bg} name="camera" size={13} /></View>
          </Pressable>
          <View style={styles.identityCopy}>
            <View style={styles.nameLine}><Text style={styles.name}>{profile.displayName}</Text>{profile.verified ? <Icon color={colors.positive} name="check" size={18} /> : null}</View>
            <Text style={styles.uid}>UID {profile.uid}</Text>
          </View>
          <Pressable accessibilityLabel="Edit profile" onPress={() => setEditOpen(true)} style={styles.edit}><Icon name="edit" size={19} /></Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.tabs} horizontal showsHorizontalScrollIndicator={false}>
          {(['My info', 'Security', 'Preferences', 'General'] as const).map((item) => (
            <Pressable key={item} onPress={() => setTab(item)} style={styles.tab}>
              <Text style={[styles.tabText, tab === item && styles.tabTextActive]}>{item}</Text>
              {tab === item ? <View style={styles.tabLine} /> : null}
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.rows}>
          {tab === 'My info' ? (
            <>
              <ProfileRow icon="profile" label="Profile picture" onPress={() => setEditOpen(true)} value="Edit" />
              <ProfileRow icon="edit" label="Display name" onPress={() => setEditOpen(true)} value={profile.displayName} />
              <ProfileRow icon="copy" label="UID" value={profile.uid} />
              <ProfileRow icon="security" label="Identity verification" value={profile.verified ? 'Verified' : 'Not verified'} />
              <ProfileRow icon="document" label="Email" value={profile.email} />
              <ProfileRow icon="profile" label="Phone" value={profile.phone} />
            </>
          ) : null}
          {tab === 'Security' ? (
            <>
              <ProfileToggle icon="lock" label="App lock" onValueChange={(value) => updateSetting('appLock', value)} value={settings.appLock} />
              <ProfileToggle icon="security" label="Biometrics" onValueChange={(value) => updateSetting('biometrics', value)} value={settings.biometrics} />
              <ProfileRow icon="scan" label="Auto-lock" onPress={() => router.push('/settings/security')} value={settings.autoLock} />
              <ProfileRow icon="security" label="Security activity" onPress={() => router.push('/settings/security')} />
            </>
          ) : null}
          {tab === 'Preferences' ? (
            <>
              <ProfileRow icon="mode" label="Trading interface" onPress={() => setChoice('interface')} value={settings.interfaceMode === 'basic' ? 'Basic' : 'Advanced'} />
              <ProfileRow icon="orders" label="Order defaults" onPress={() => router.push('/settings/trading')} />
              <ProfileRow icon="bell" label="Notifications" onPress={() => router.push('/settings/notifications')} />
              <ProfileRow icon="language" label="Language" onPress={() => setChoice('language')} value={settings.language} />
              <ProfileRow icon="currency" label="Display currency" onPress={() => setChoice('currency')} value={settings.currency} />
            </>
          ) : null}
          {tab === 'General' ? (
            <>
              <ProfileRow icon="help" label="Help center" onPress={() => router.push('/settings/about')} />
              <ProfileRow icon="document" label="Legal & risk" onPress={() => router.push('/settings/about')} />
              <ProfileRow icon="info" label="About BlackBook" onPress={() => router.push('/settings/about')} value="0.1.0" />
              <ProfileRow icon="logout" label="Log out" />
            </>
          ) : null}
        </View>
      </ScrollView>

      <BottomSheet onClose={() => setEditOpen(false)} title="Edit profile" visible={editOpen}>
        <Text style={styles.sheetLabel}>Profile picture</Text>
        <View style={styles.avatarChoices}>
          {['void', 'light', 'signal'].map((item) => (
            <Pressable key={item} onPress={() => setAvatar(item)} style={[styles.avatarChoice, avatar === item && styles.avatarChoiceActive]}>
              <ProfileAvatar displayName={name || profile.displayName} size={52} variant={item} />
            </Pressable>
          ))}
        </View>
        <Text style={styles.sheetLabel}>Image URL</Text>
        <View style={[styles.nameInput, styles.urlInput]}><TextInput autoCapitalize="none" autoCorrect={false} onChangeText={setImageUri} placeholder="https://" placeholderTextColor={colors.textFaint} selectionColor={colors.text} style={styles.input} value={imageUri} /></View>
        <Text style={styles.sheetLabel}>Display name</Text>
        <View style={styles.nameInput}><TextInput autoCapitalize="words" onChangeText={setName} selectionColor={colors.text} style={styles.input} value={name} /></View>
        <Pressable onPress={save} style={styles.save}><Text style={styles.saveText}>Save changes</Text></Pressable>
      </BottomSheet>

      <ChoiceSheet format={(value) => value === 'basic' ? 'Basic' : 'Advanced'} onClose={() => setChoice(null)} onSelect={(value) => updateSetting('interfaceMode', value)} options={['basic', 'advanced'] as const} title="Trading interface" value={settings.interfaceMode} visible={choice === 'interface'} />
      <ChoiceSheet onClose={() => setChoice(null)} onSelect={(value) => updateSetting('language', value)} options={['English', 'French', 'Spanish'] as const} title="Language" value={settings.language} visible={choice === 'language'} />
      <ChoiceSheet onClose={() => setChoice(null)} onSelect={(value) => updateSetting('currency', value)} options={['USD', 'EUR', 'GBP'] as const} title="Display currency" value={settings.currency} visible={choice === 'currency'} />
    </Screen>
  );
}

function ProfileAvatar({ displayName, variant, size = 74 }: { displayName: string; variant: string; size?: number }) {
  if (variant.startsWith('http')) return <Image source={{ uri: variant }} style={{ borderRadius: size / 2, height: size, width: size }} />;
  const palette = variant === 'light' ? { background: colors.text, foreground: colors.bg } : variant === 'signal' ? { background: colors.positive, foreground: colors.bg } : { background: colors.surfaceRaised, foreground: colors.text };
  return <View style={[styles.profileAvatar, { backgroundColor: palette.background, borderRadius: size / 2, height: size, width: size }]}><Text style={[styles.initial, { color: palette.foreground, fontSize: size * 0.34 }]}>{displayName.slice(0, 2).toUpperCase()}</Text></View>;
}

function ProfileRow({ icon, label, value, onPress }: { icon: IconName; label: string; value?: string; onPress?: () => void }) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <Icon name={icon} size={21} />
      <Text style={styles.rowLabel}>{label}</Text>
      {value ? <Text numberOfLines={1} style={styles.rowValue}>{value}</Text> : null}
      {onPress ? <Icon color={colors.textMuted} name="chevron" size={17} /> : null}
    </Pressable>
  );
}

function ProfileToggle({ icon, label, value, onValueChange }: { icon: IconName; label: string; value: boolean; onValueChange: (value: boolean) => void }) {
  return (
    <View style={styles.row}>
      <Icon name={icon} size={21} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch ios_backgroundColor="#313131" onValueChange={onValueChange} thumbColor={colors.white} trackColor={{ false: '#313131', true: colors.positive }} value={value} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
  header: { alignItems: 'center', flexDirection: 'row', minHeight: 58, paddingHorizontal: spacing.page },
  back: { alignItems: 'flex-start', justifyContent: 'center', width: 42 },
  title: { color: colors.text, flex: 1, fontFamily: typography.bold, fontSize: 22, letterSpacing: -0.55, textAlign: 'center' },
  identity: { alignItems: 'center', flexDirection: 'row', paddingHorizontal: spacing.page, paddingVertical: spacing.lg },
  avatarWrap: { height: 74, width: 74 },
  profileAvatar: { alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: typography.bold, letterSpacing: -1 },
  camera: { alignItems: 'center', backgroundColor: colors.text, borderColor: colors.bg, borderRadius: 12, borderWidth: 2, bottom: 0, height: 24, justifyContent: 'center', position: 'absolute', right: 0, width: 24 },
  identityCopy: { flex: 1, marginLeft: spacing.md },
  nameLine: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  name: { color: colors.text, fontFamily: typography.bold, fontSize: 24, letterSpacing: -0.7 },
  uid: { color: colors.textMuted, fontFamily: typography.mono, fontSize: 10, marginTop: 5 },
  edit: { alignItems: 'center', height: 44, justifyContent: 'center', width: 38 },
  tabs: { gap: spacing.lg, paddingHorizontal: spacing.page },
  tab: { minHeight: 44, paddingBottom: 8 },
  tabText: { color: colors.textMuted, fontFamily: typography.semibold, fontSize: 14 },
  tabTextActive: { color: colors.text },
  tabLine: { backgroundColor: colors.text, bottom: 0, height: 2, left: 0, position: 'absolute', right: 0 },
  rows: { marginTop: spacing.md },
  row: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, minHeight: 66, paddingHorizontal: spacing.page },
  rowLabel: { color: colors.text, flex: 1, fontFamily: typography.semibold, fontSize: 15 },
  rowValue: { color: colors.textMuted, flexShrink: 1, fontFamily: typography.medium, fontSize: 12, maxWidth: '42%' },
  pressed: { backgroundColor: colors.section },
  sheetLabel: { color: colors.textMuted, fontFamily: typography.medium, fontSize: 11, marginBottom: spacing.xs },
  avatarChoices: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  avatarChoice: { borderColor: 'transparent', borderRadius: radii.pill, borderWidth: 2, padding: 3 },
  avatarChoiceActive: { borderColor: colors.text },
  nameInput: { backgroundColor: colors.control, borderRadius: radii.md, height: 48, justifyContent: 'center', paddingHorizontal: spacing.sm },
  urlInput: { marginBottom: spacing.lg },
  input: { color: colors.text, fontFamily: typography.semibold, fontSize: 15, padding: 0 },
  save: { alignItems: 'center', backgroundColor: colors.text, borderRadius: radii.pill, height: 44, justifyContent: 'center', marginTop: spacing.lg },
  saveText: { color: colors.bg, fontFamily: typography.bold, fontSize: 13 },
});
