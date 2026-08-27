import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Icon, type IconName } from '@/components/ui/icon';
import { colors, typography } from '@/theme/tokens';

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
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: styles.label,
        tabBarStyle: styles.bar,
        tabBarIcon: ({ color, focused }) => <Icon color={color} filled={focused} name={ICONS[route.name] ?? 'home'} size={22} />,
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="indices" options={{ title: 'Indices' }} />
      <Tabs.Screen name="trade" options={{ title: 'Trade' }} />
      <Tabs.Screen name="portfolio" options={{ title: 'Portfolio' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  scene: { backgroundColor: colors.bg },
  bar: { backgroundColor: colors.navigation, borderTopColor: colors.divider, height: 64, paddingBottom: 7, paddingTop: 7 },
  label: { fontFamily: typography.semibold, fontSize: 10 },
});
