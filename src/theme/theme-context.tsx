import { createContext, useContext, useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const [mode, updateMode] = useState<ThemeMode>('Dark');
  const [loaded,setLoaded]=useState(false);
  useEffect(()=>{let alive=true;void AsyncStorage.getItem('blackbook.device.appearance').then(value=>{if(alive&&['Dark','Light','System'].includes(value??''))updateMode(value as ThemeMode);}).catch(()=>{}).finally(()=>{if(alive)setLoaded(true);});return()=>{alive=false;};},[]);
  const setMode=useCallback((value:ThemeMode)=>{updateMode(value);void AsyncStorage.setItem('blackbook.device.appearance',value).catch(()=>{});},[]);
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
  }), [isDark, mode, setMode]);

  if(!loaded)return null;
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}

