import { useCallback, type PropsWithChildren } from 'react';
import { BackHandler, View } from 'react-native';
import { useFocusEffect, usePathname, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createThemedStyles } from '@/theme/use-themed-styles';

interface ScreenProps extends PropsWithChildren {
  edges?: Array<'top' | 'right' | 'bottom' | 'left'>;
}

export function Screen({ children, edges = ['top'] }: ScreenProps) {
  const styles = useStyles();
  const router=useRouter(),pathname=usePathname();
  useFocusEffect(useCallback(()=>{const event=BackHandler.addEventListener('hardwareBackPress',()=>{if(pathname==='/'||pathname==='/(tabs)')return true;if(router.canGoBack())router.back();else router.replace('/(tabs)');return true;});return()=>event.remove();},[router,pathname]));
  return <SafeAreaView edges={edges} style={styles.safe}><View style={styles.body}>{children}</View></SafeAreaView>;
}

const useStyles = createThemedStyles((colors) => ({
  safe: { backgroundColor: colors.bg, flex: 1 },
  body: { flex: 1 },
}));

