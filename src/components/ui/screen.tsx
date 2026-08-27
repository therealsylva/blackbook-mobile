import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme/tokens';

interface ScreenProps extends PropsWithChildren {
  edges?: Array<'top' | 'right' | 'bottom' | 'left'>;
}

export function Screen({ children, edges = ['top'] }: ScreenProps) {
  return <SafeAreaView edges={edges} style={styles.safe}><View style={styles.body}>{children}</View></SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.bg, flex: 1 },
  body: { flex: 1 },
});
