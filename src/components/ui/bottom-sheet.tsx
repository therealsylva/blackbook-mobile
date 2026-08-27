import type { PropsWithChildren } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing, typography } from '@/theme/tokens';
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
        <View style={[styles.sheet, { paddingBottom: Math.max(spacing.md, insets.bottom) }]}>
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
  sheet: { backgroundColor: colors.section, borderColor: colors.divider, borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet, borderWidth: StyleSheet.hairlineWidth, maxHeight: '88%', paddingHorizontal: spacing.page },
  handle: { alignSelf: 'center', backgroundColor: colors.textFaint, borderRadius: 2, height: 4, marginBottom: spacing.sm, marginTop: spacing.xs, width: 32 },
  header: { alignItems: 'center', borderBottomColor: colors.dividerSoft, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md, paddingBottom: spacing.sm },
  title: { color: colors.text, fontFamily: typography.family, fontWeight: typography.weights.semibold, fontSize: 17 },
});
