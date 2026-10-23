import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import { darkColors, lightColors, type ThemeColors } from './tokens';

export type ThemeMode = 'Dark' | 'Light' | 'System';

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const [mode, setMode] = useState<ThemeMode>('Dark');
  const system = useColorScheme();
  const isDark = mode === 'System' ? system !== 'light' : mode === 'Dark';

  useEffect(() => {
    if (typeof Appearance.setColorScheme === 'function') Appearance.setColorScheme(mode === 'System' ? 'unspecified' : isDark ? 'dark' : 'light');
  }, [isDark, mode]);

  const value = useMemo<ThemeContextValue>(() => ({
    colors: isDark ? darkColors : lightColors,
    isDark,
    mode,
    setMode,
  }), [isDark, mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}
