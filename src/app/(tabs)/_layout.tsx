import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabIcon } from '@/components/navigation/tab-icon';
import { colors } from '@/constants/theme';

const homeIcon = { ios: 'house', android: 'home', web: 'home' } as const;
const indicesIcon = {
  ios: 'list.bullet.rectangle',
  android: 'format_list_bulleted',
  web: 'format_list_bulleted',
} as const;
const tradeIcon = { ios: 'arrow.up.arrow.down', android: 'swap_vert', web: 'swap_vert' } as const;
const portfolioIcon = {
  ios: 'briefcase',
  android: 'account_balance_wallet',
  web: 'account_balance_wallet',
} as const;
const menuIcon = { ios: 'line.3.horizontal', android: 'menu', web: 'menu' } as const;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.paper },
        tabBarActiveTintColor: colors.ink,
        tabBarHideOnKeyboard: true,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarItemStyle: { paddingTop: 7 },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 2,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          borderTopWidth: 1,
          height: 64 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 6),
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon color={color} focused={focused} name={homeIcon} size={size} />
          ),
          tabBarLabel: 'Home',
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="indices"
        options={{
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon color={color} focused={focused} name={indicesIcon} size={size} />
          ),
          tabBarLabel: 'All Indices',
          title: 'All Indices',
        }}
      />
      <Tabs.Screen
        name="trade"
        options={{
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon color={color} focused={focused} name={tradeIcon} size={size + 2} />
          ),
          tabBarLabel: 'Trade',
          title: 'Trade',
        }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon color={color} focused={focused} name={portfolioIcon} size={size} />
          ),
          tabBarLabel: 'Portfolio',
          title: 'Portfolio',
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon color={color} focused={focused} name={menuIcon} size={size} />
          ),
          tabBarLabel: 'Menu',
          title: 'Menu',
        }}
      />
    </Tabs>
  );
}
