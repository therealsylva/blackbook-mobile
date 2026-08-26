import 'react-native-gesture-handler';
import 'react-native-reanimated';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { colors } from '@/constants/theme';
import { InterfaceModeProvider } from '@/context/interface-mode';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <InterfaceModeProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: colors.paper },
            headerShown: false,
          }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="market/[symbol]" />
        </Stack>
      </InterfaceModeProvider>
    </GestureHandlerRootView>
  );
}
