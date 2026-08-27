import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Icon, type IconName } from '@/components/ui/icon';
import { colors, layout, typography } from '@/theme/tokens';

const ICONS: Record<string, IconName> = {
  index: 'home',
  indices: 'markets',
  trade: 'trade',
  portfolio: 'wallet',
  feed: 'feed',
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
        tabBarItemStyle: styles.item,
        tabBarLabelStyle: styles.label,
        tabBarStyle: styles.bar,
        tabBarIcon: ({ color, focused }) => <Icon color={color} filled={focused} name={ICONS[route.name] ?? 'home'} size={21} />,
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="indices" options={{ title: 'Indices' }} />
      <Tabs.Screen name="trade" options={{ title: 'Trade' }} />
      <Tabs.Screen name="portfolio" options={{ title: 'Portfolio' }} />
      <Tabs.Screen name="feed" options={{ title: 'Feed' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  scene: { backgroundColor: colors.bg },
  bar: { backgroundColor: colors.navigation, borderTopColor: colors.divider, height: layout.nav, paddingBottom: 4, paddingTop: 5 },
  item: { paddingVertical: 0 },
  label: { fontFamily: typography.family, fontSize: 10, fontWeight: typography.weights.medium, marginTop: 1 },
});
