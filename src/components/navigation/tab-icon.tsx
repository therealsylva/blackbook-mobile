import { SymbolView, type SymbolViewProps } from 'expo-symbols';

interface TabIconProps {
  color: string;
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
