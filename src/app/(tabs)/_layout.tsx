import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Icon, type IconName } from '@/components/ui/icon';
import { colors } from '@/theme/tokens';

const ICONS: Record<string, IconName> = {
  index: 'home',
  indices: 'markets',
  trade: 'trade',
  portfolio: 'wallet',
  profile: 'profile',
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneStyle: styles.scene,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: styles.label,
        tabBarStyle: styles.bar,
        tabBarIcon: ({ color, focused }) => <Icon color={color} filled={focused} name={ICONS[route.name] ?? 'home'} size={22} />,
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="indices" options={{ title: 'All Indices' }} />
      <Tabs.Screen name="trade" options={{ title: 'Trade' }} />
      <Tabs.Screen name="portfolio" options={{ title: 'Portfolio' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  scene: { backgroundColor: colors.bg },
  bar: { backgroundColor: colors.bg, borderTopColor: colors.divider, height: 62, paddingBottom: 7, paddingTop: 7 },
  label: { fontSize: 10, fontWeight: '600' },
});
