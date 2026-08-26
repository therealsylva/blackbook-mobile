import type { ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/constants/theme';

interface ScreenProps {
  children: ReactNode;
  backgroundColor?: string;
  contentStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
}

export function Screen({
  children,
  backgroundColor = colors.paper,
  contentStyle,
  scroll = true,
}: ScreenProps) {
  if (!scroll) {
    return (
      <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor }]}>
        <View style={[styles.staticContent, contentStyle]}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, contentStyle]}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  staticContent: {
    flex: 1,
  },
});
