import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ExchangeProvider } from '@/context/exchange-context';
import { colors } from '@/theme/tokens';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    const timer = setTimeout(() => {
      void SplashScreen.hideAsync();
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaProvider>
      <ExchangeProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ animation: 'slide_from_right', contentStyle: { backgroundColor: colors.bg }, headerShown: false }} />
      </ExchangeProvider>
    </SafeAreaProvider>
  );
}
