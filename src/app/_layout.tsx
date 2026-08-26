import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" backgroundColor="#000000" />
      <Stack screenOptions={{ contentStyle: { backgroundColor: '#000000' }, headerShown: false }} />
    </>
  );
}
