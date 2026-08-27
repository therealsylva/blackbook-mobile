import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import mediumAndroid from 'expo-symbols/androidWeights/medium';
import regularAndroid from 'expo-symbols/androidWeights/regular';
import type { ColorValue } from 'react-native';

export type IconName =
  | 'home'
  | 'markets'
  | 'trade'
  | 'wallet'
  | 'profile'
  | 'search'
  | 'bell'
  | 'eye'
  | 'eye-off'
  | 'plus'
  | 'positions'
  | 'alert'
  | 'star'
  | 'back'
  | 'chevron'
  | 'close'
  | 'settings'
  | 'security'
  | 'sliders'
  | 'help'
  | 'info'
  | 'palette'
  | 'globe'
  | 'currency'
  | 'refresh'
  | 'lock'
  | 'check'
  | 'more'
  | 'swap'
  | 'download'
  | 'upload'
  | 'chart'
  | 'clock'
  | 'orders'
  | 'filter'
  | 'document'
  | 'support'
  | 'logout'
  | 'appearance'
  | 'language'
  | 'mode'
  | 'copy'
  | 'scan'
  | 'order-book';

interface IconProps {
  name: IconName;
  size?: number;
  color?: ColorValue;
  filled?: boolean;
}

type SymbolName = SymbolViewProps['name'];

const symbol = (ios: string, android: string): SymbolName => ({ ios, android, web: android }) as SymbolName;

const ICONS: Record<IconName, { outline: SymbolName; filled?: SymbolName }> = {
  home: { outline: symbol('house', 'home'), filled: symbol('house.fill', 'home_filled') },
  markets: { outline: symbol('chart.bar.xaxis', 'bar_chart'), filled: symbol('chart.bar.fill', 'bar_chart') },
  trade: { outline: symbol('arrow.left.arrow.right', 'swap_horiz') },
  wallet: { outline: symbol('creditcard', 'account_balance_wallet'), filled: symbol('creditcard.fill', 'account_balance_wallet') },
  profile: { outline: symbol('person', 'person'), filled: symbol('person.fill', 'person') },
  search: { outline: symbol('magnifyingglass', 'search') },
  bell: { outline: symbol('bell', 'notifications'), filled: symbol('bell.fill', 'notifications') },
  eye: { outline: symbol('eye', 'visibility') },
  'eye-off': { outline: symbol('eye.slash', 'visibility_off') },
  plus: { outline: symbol('plus', 'add') },
  positions: { outline: symbol('chart.line.uptrend.xyaxis', 'monitoring') },
  alert: { outline: symbol('exclamationmark.triangle', 'warning') },
  star: { outline: symbol('star', 'star'), filled: symbol('star.fill', 'star') },
  back: { outline: symbol('arrow.left', 'arrow_back') },
  chevron: { outline: symbol('chevron.right', 'chevron_right') },
  close: { outline: symbol('xmark', 'close') },
  settings: { outline: symbol('gearshape', 'settings'), filled: symbol('gearshape.fill', 'settings') },
  security: { outline: symbol('lock.shield', 'shield_lock') },
  sliders: { outline: symbol('slider.horizontal.3', 'tune') },
  help: { outline: symbol('questionmark.circle', 'help') },
  info: { outline: symbol('info.circle', 'info') },
  palette: { outline: symbol('paintpalette', 'palette') },
  globe: { outline: symbol('globe', 'language') },
  currency: { outline: symbol('dollarsign.circle', 'paid') },
  refresh: { outline: symbol('arrow.clockwise', 'refresh') },
  lock: { outline: symbol('lock', 'lock') },
  check: { outline: symbol('checkmark', 'check') },
  more: { outline: symbol('ellipsis', 'more_horiz') },
  swap: { outline: symbol('arrow.up.arrow.down', 'swap_vert') },
  download: { outline: symbol('arrow.down.to.line', 'download') },
  upload: { outline: symbol('arrow.up.to.line', 'upload') },
  chart: { outline: symbol('chart.xyaxis.line', 'show_chart') },
  clock: { outline: symbol('clock', 'schedule'), filled: symbol('clock.fill', 'schedule') },
  orders: { outline: symbol('list.bullet.rectangle', 'receipt_long') },
  filter: { outline: symbol('line.3.horizontal.decrease', 'filter_list') },
  document: { outline: symbol('doc.text', 'description') },
  support: { outline: symbol('headphones', 'support_agent') },
  logout: { outline: symbol('rectangle.portrait.and.arrow.right', 'logout') },
  appearance: { outline: symbol('circle.lefthalf.filled', 'contrast') },
  language: { outline: symbol('character.bubble', 'translate') },
  mode: { outline: symbol('rectangle.2.swap', 'switch_access_shortcut') },
  copy: { outline: symbol('doc.on.doc', 'content_copy') },
  scan: { outline: symbol('viewfinder', 'qr_code_scanner') },
  'order-book': { outline: symbol('rectangle.3.group', 'view_list') },
};

export function Icon({ name, size = 22, color = '#F5F6F7', filled = false }: IconProps) {
  const definition = ICONS[name];
  return (
    <SymbolView
      name={filled && definition.filled ? definition.filled : definition.outline}
      size={size}
      tintColor={color}
      type="monochrome"
      weight={filled ? { ios: 'semibold', android: mediumAndroid } : { ios: 'regular', android: regularAndroid }}
    />
  );
}
