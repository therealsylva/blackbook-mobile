import {createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@/theme/theme-context';
import {typography} from '@/theme/tokens';

type Notice = {title: string; message: string; tone?: 'info' | 'success' | 'error'};
const Context = createContext<((notice: Notice) => void) | null>(null);
export function NotificationProvider({children}: PropsWithChildren) {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const [notice, setNotice] = useState<(Notice & {id: number}) | null>(null);
  const notify = useCallback((value: Notice) => setNotice({...value, id: Date.now()}), []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 6500);
    return () => clearTimeout(timer);
  }, [notice]);
  const accent = notice?.tone === 'error' ? colors.negative : notice?.tone === 'success' ? colors.positive : colors.text;
  const style = useMemo(() => ({backgroundColor: colors.surfaceRaised, borderColor: colors.divider, borderLeftColor: accent, top: insets.top + 8}), [colors, accent, insets.top]);
  return <Context.Provider value={notify}>
    {children}
    {notice ? <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.banner, style]}>
        <View style={styles.copy}>
          <Text style={[styles.brand, {color: colors.textMuted}]}>BLACKBOOK</Text>
          <Text style={[styles.title, {color: colors.text}]}>{notice.title}</Text>
          <Text style={[styles.message, {color: colors.textMuted}]}>{notice.message}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Dismiss notification" onPress={() => setNotice(null)} style={styles.dismiss}><Text style={{color: colors.text, fontSize: 24}}>×</Text></Pressable>
      </View>
    </View> : null}
  </Context.Provider>;
}
export function useNotification() {
  const notify = useContext(Context);
  if (!notify) throw new Error('Notification provider required');
  return notify;
}
const styles = StyleSheet.create({
  banner: {position: 'absolute', left: 16, right: 16, borderWidth: 1, borderLeftWidth: 3, borderRadius: 12, padding: 16, flexDirection: 'row', elevation: 12, shadowOpacity: 0.3, shadowRadius: 12},
  copy: {flex: 1}, brand: {fontFamily: typography.bold, fontSize: 10, letterSpacing: 1.5, marginBottom: 5},
  title: {fontFamily: typography.semibold, fontSize: 16}, message: {fontFamily: typography.family, fontSize: 14, marginTop: 5},
  dismiss: {width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center'},
});
