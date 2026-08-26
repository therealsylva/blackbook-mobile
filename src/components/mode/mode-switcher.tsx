import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/constants/theme';
import { useInterfaceMode, type InterfaceMode } from '@/context/interface-mode';

const modes: readonly InterfaceMode[] = ['basic', 'advanced'];

export function ModeSwitcher({ inverse = false }: { inverse?: boolean }) {
  const { mode, setMode } = useInterfaceMode();
  const trackColor = inverse ? colors.elevatedGraphite : colors.mutedSurface;

  return (
    <View accessibilityLabel="Interface mode" style={[styles.track, { backgroundColor: trackColor }]}>
      {modes.map((option) => {
        const selected = mode === option;
        const selectedBackground = inverse ? colors.surface : colors.ink;
        const textColor = selected
          ? inverse
            ? colors.ink
            : colors.textOnDark
          : inverse
            ? colors.textMutedOnDark
            : colors.textMuted;

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected }}
            key={option}
            onPress={() => setMode(option)}
            style={({ pressed }) => [
              styles.option,
              selected && { backgroundColor: selectedBackground },
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.label, { color: textColor }]}>
              {option === 'basic' ? 'Basic' : 'Advanced'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    alignSelf: 'flex-start',
    borderRadius: radius.control,
    flexDirection: 'row',
    padding: 3,
  },
  option: {
    alignItems: 'center',
    borderRadius: 4,
    justifyContent: 'center',
    minHeight: 36,
    minWidth: 88,
    paddingHorizontal: spacing.sm,
  },
  label: {
    fontSize: typography.compact,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.72,
  },
});
