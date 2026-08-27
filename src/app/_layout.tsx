import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ExchangeProvider } from '@/context/exchange-context';
import { colors } from '@/theme/tokens';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    MonaSansRegular: require('../assets/fonts/MonaSans-Regular.ttf'),
    MonaSansMedium: require('../assets/fonts/MonaSans-Medium.ttf'),
    MonaSansSemiBold: require('../assets/fonts/MonaSans-SemiBold.ttf'),
    MonaSansBold: require('../assets/fonts/MonaSans-Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ExchangeProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ animation: 'slide_from_right', contentStyle: { backgroundColor: colors.bg }, headerShown: false }} />
      </ExchangeProvider>
    </SafeAreaProvider>
  );
}
