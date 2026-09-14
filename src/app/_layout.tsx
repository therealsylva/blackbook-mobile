import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { NavigationBar } from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ExchangeProvider } from '@/context/exchange-context';
import { ThemeProvider, useTheme } from '@/theme/theme-context';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    MonaSans: require('../assets/fonts/MonaSans-Regular.ttf'),
    'MonaSans-Medium': require('../assets/fonts/MonaSans-Medium.ttf'),
    'MonaSans-SemiBold': require('../assets/fonts/MonaSans-SemiBold.ttf'),
    'MonaSans-Bold': require('../assets/fonts/MonaSans-Bold.ttf'),
    'RobotoMono-Medium': require('../assets/fonts/RobotoMono-Medium.ttf'),
    'RobotoMono-SemiBold': require('../assets/fonts/RobotoMono-SemiBold.ttf'),
    'RobotoMono-Bold': require('../assets/fonts/RobotoMono-Bold.ttf'),
  });

  useEffect(() => {
    if (!fontsLoaded) return undefined;
    const timer = setTimeout(() => {
      void SplashScreen.hideAsync();
    }, 220);
    return () => clearTimeout(timer);
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { colors, isDark } = useTheme();
  return (
    <SafeAreaProvider>
      <ExchangeProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <NavigationBar style={isDark ? 'light' : 'dark'} />
        <Stack screenOptions={{ animation: 'slide_from_right', contentStyle: { backgroundColor: colors.bg }, headerShown: false }} />
      </ExchangeProvider>
    </SafeAreaProvider>
  );
}
