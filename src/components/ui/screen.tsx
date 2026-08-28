import type { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createThemedStyles } from '@/theme/use-themed-styles';

interface ScreenProps extends PropsWithChildren {
  edges?: Array<'top' | 'right' | 'bottom' | 'left'>;
}

export function Screen({ children, edges = ['top'] }: ScreenProps) {
  const styles = useStyles();
  return <SafeAreaView edges={edges} style={styles.safe}><View style={styles.body}>{children}</View></SafeAreaView>;
}

const useStyles = createThemedStyles((colors) => ({
  safe: { backgroundColor: colors.bg, flex: 1 },
  body: { flex: 1 },
}));
