import { createContext, useCallback, useContext, useEffect, useRef, type PropsWithChildren } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radii, spacing, typography } from '@/theme/tokens';
import { createThemedStyles } from '@/theme/use-themed-styles';
import { Icon } from './icon';

const SheetInputFocusContext=createContext<()=>void>(()=>{});
export const useSheetInputFocus=()=>useContext(SheetInputFocusContext);

interface BottomSheetProps extends PropsWithChildren {
  visible: boolean;
  title: string;
  onClose: () => void;
  scroll?: boolean;
}

export function BottomSheet({ visible, title, onClose, children, scroll = true }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const scrollRef=useRef<ScrollView>(null);
  const scrollFocused=useCallback(()=>{setTimeout(()=>{if(Platform.OS==='web'){document.activeElement?.scrollIntoView({block:'nearest'});return;}const input=TextInput.State.currentlyFocusedInput();if(input)scrollRef.current?.scrollResponderScrollNativeHandleToKeyboard(input,24,true);},100);},[]);
  useEffect(()=>{if(!visible)return;const listener=Keyboard.addListener('keyboardDidShow',scrollFocused);return()=>listener.remove();},[visible,scrollFocused]);
  const content = scroll ? <ScrollView ref={scrollRef} automaticallyAdjustKeyboardInsets keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>{children}</ScrollView> : children;
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={styles.root}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close sheet" onPress={onClose} style={styles.backdrop} />
        <View style={[styles.sheet, { paddingBottom: Math.max(spacing.md, insets.bottom) }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={12} onPress={onClose}><Icon name="close" size={20} /></Pressable>
          </View>
          <SheetInputFocusContext.Provider value={scrollFocused}>{content}</SheetInputFocusContext.Provider>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: colors.overlay, bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  sheet: { backgroundColor: colors.section, borderColor: colors.divider, borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet, borderWidth: StyleSheet.hairlineWidth, maxHeight: '88%', paddingHorizontal: spacing.page },
  handle: { alignSelf: 'center', backgroundColor: colors.textFaint, borderRadius: 2, height: 4, marginBottom: spacing.sm, marginTop: spacing.xs, width: 32 },
  header: { alignItems: 'center', borderBottomColor: colors.dividerSoft, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md, paddingBottom: spacing.sm },
  title: { color: colors.text, fontFamily: typography.family, fontWeight: typography.weights.semibold, fontSize: 17 },
}));

