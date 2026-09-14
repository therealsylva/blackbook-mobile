import { useMemo } from 'react';
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';
import { useTheme } from './theme-context';
import type { ThemeColors } from './tokens';

type NamedStyles = Record<string, ViewStyle | TextStyle | ImageStyle>;

export function createThemedStyles<T extends NamedStyles>(factory: (colors: ThemeColors) => T) {
  let cachedColors: ThemeColors | null = null;
  let cachedStyles: T | null = null;

  return function useThemedStyles() {
    const { colors } = useTheme();
    return useMemo(() => {
      if (cachedColors !== colors || !cachedStyles) {
        cachedColors = colors;
        cachedStyles = StyleSheet.create(factory(colors));
      }
      return cachedStyles;
    }, [colors]);
  };
}
