import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type InterfaceMode = 'basic' | 'advanced';

interface InterfaceModeContextValue {
  mode: InterfaceMode;
  setMode: (mode: InterfaceMode) => void;
}

const STORAGE_KEY = 'blackbook.interface-mode.v1';
const InterfaceModeContext = createContext<InterfaceModeContextValue | null>(null);

export function InterfaceModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<InterfaceMode>('basic');

  useEffect(() => {
    let active = true;

    void AsyncStorage.getItem(STORAGE_KEY).then((storedMode) => {
      if (active && (storedMode === 'basic' || storedMode === 'advanced')) {
        setModeState(storedMode);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const setMode = useCallback((nextMode: InterfaceMode) => {
    setModeState(nextMode);
    void AsyncStorage.setItem(STORAGE_KEY, nextMode);
  }, []);

  const value = useMemo(() => ({ mode, setMode }), [mode, setMode]);

  return <InterfaceModeContext.Provider value={value}>{children}</InterfaceModeContext.Provider>;
}

export function useInterfaceMode() {
  const value = useContext(InterfaceModeContext);

  if (!value) {
    throw new Error('useInterfaceMode must be used inside InterfaceModeProvider.');
  }

  return value;
}
