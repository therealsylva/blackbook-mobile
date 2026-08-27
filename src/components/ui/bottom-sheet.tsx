import type { PropsWithChildren } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '@/theme/tokens';
import { Icon } from './icon';

interface BottomSheetProps extends PropsWithChildren {
  visible: boolean;
  title: string;
  onClose: () => void;
  scroll?: boolean;
}

export function BottomSheet({ visible, title, onClose, children, scroll = true }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const content = scroll ? <ScrollView showsVerticalScrollIndicator={false}>{children}</ScrollView> : children;
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable accessibilityLabel="Close sheet" onPress={onClose} style={styles.backdrop} />
        <View style={[styles.sheet, { paddingBottom: Math.max(18, insets.bottom) }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable accessibilityLabel="Close" hitSlop={12} onPress={onClose}><Icon name="close" size={20} /></Pressable>
          </View>
          {content}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: colors.overlay, bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 14, borderTopRightRadius: 14, maxHeight: '88%', paddingHorizontal: spacing.page },
  handle: { alignSelf: 'center', backgroundColor: colors.textFaint, borderRadius: 2, height: 4, marginBottom: 16, marginTop: 8, width: 36 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  title: { color: colors.text, fontFamily: typography.semibold, fontSize: 18 },
});
