import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { ColorValue } from 'react-native';

interface TabIconProps {
  color: ColorValue;
  focused: boolean;
  name: SymbolViewProps['name'];
  size: number;
}

export function TabIcon({ color, focused, name, size }: TabIconProps) {
  return (
    <SymbolView
      name={name}
      size={size}
      tintColor={color}
      type={focused ? 'hierarchical' : 'monochrome'}
    />
  );
}
