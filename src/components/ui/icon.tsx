import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';
import type { ReactNode } from 'react';
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
  | 'clock';

interface IconProps {
  name: IconName;
  size?: number;
  color?: ColorValue;
  filled?: boolean;
}

export function Icon({ name, size = 24, color = '#F5F6F7', filled = false }: IconProps) {
  const common = { fill: 'none', stroke: color, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, strokeWidth: 2 };

  let glyph: ReactNode;
  switch (name) {
    case 'home':
      glyph = filled
        ? <Path fill={color} d="M2.7 10.6 12 2.7l9.3 7.9v9.1a1.7 1.7 0 0 1-1.7 1.7h-4.8v-6.2H9.2v6.2H4.4a1.7 1.7 0 0 1-1.7-1.7v-9.1Z" />
        : <><Path {...common} d="M3 10.8 12 3l9 7.8" /><Path {...common} d="M5.2 9.5V21h13.6V9.5M9 21v-6h6v6" /></>;
      break;
    case 'markets':
      glyph = filled
        ? <><Rect fill={color} x="3" y="11" width="4" height="10" rx="1" /><Rect fill={color} x="10" y="4" width="4" height="17" rx="1" /><Rect fill={color} x="17" y="8" width="4" height="13" rx="1" /></>
        : <><Line {...common} x1="5" y1="20" x2="5" y2="12" /><Line {...common} x1="12" y1="20" x2="12" y2="5" /><Line {...common} x1="19" y1="20" x2="19" y2="9" /><Line {...common} x1="2.5" y1="20" x2="21.5" y2="20" /></>;
      break;
    case 'trade':
      glyph = filled
        ? <><Path fill={color} d="M3 5.1h12V2l6 5.2-6 5.2V9.1H3z" /><Path fill={color} d="M21 18.9H9V22l-6-5.2 6-5.2v3.3h12z" /></>
        : <><Path {...common} d="M4 7h13" /><Polyline {...common} points="14,4 18,7 14,10" /><Path {...common} d="M20 17H7" /><Polyline {...common} points="10,14 6,17 10,20" /></>;
      break;
    case 'wallet':
      glyph = filled
        ? <Path fill={color} fillRule="evenodd" d="M4.5 3h14A1.5 1.5 0 0 1 20 4.5V6h.5A1.5 1.5 0 0 1 22 7.5v12a1.5 1.5 0 0 1-1.5 1.5h-16A2.5 2.5 0 0 1 2 18.5v-13A2.5 2.5 0 0 1 4.5 3ZM16 11a2.5 2.5 0 0 0 0 5h6v-5h-6Z" />
        : <><Path {...common} d="M3 6.5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-14a2 2 0 0 1 2-2h13" /><Path {...common} d="M16 11h5v5h-5a2.5 2.5 0 0 1 0-5Z" /></>;
      break;
    case 'profile':
      glyph = filled
        ? <><Circle fill={color} cx="12" cy="7.6" r="4.2" /><Path fill={color} d="M3.7 21a8.3 8.3 0 0 1 16.6 0Z" /></>
        : <><Circle {...common} cx="12" cy="8" r="4" /><Path {...common} d="M4.5 21a7.5 7.5 0 0 1 15 0" /></>;
      break;
    case 'search':
      glyph = <><Circle {...common} cx="10.7" cy="10.7" r="6.7" /><Line {...common} x1="15.5" y1="15.5" x2="21" y2="21" /></>;
      break;
    case 'bell':
      glyph = <><Path {...common} d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><Path {...common} d="M9.5 21h5" /></>;
      break;
    case 'eye':
      glyph = <><Path {...common} d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><Circle {...common} cx="12" cy="12" r="2.5" /></>;
      break;
    case 'eye-off':
      glyph = <><Path {...common} d="m3 3 18 18M10.4 6.2A9 9 0 0 1 12 6c6 0 9.5 6 9.5 6a14 14 0 0 1-2.2 2.8M6.2 6.3C3.8 8 2.5 12 2.5 12s3.5 6 9.5 6a9 9 0 0 0 3-.5" /></>;
      break;
    case 'plus':
      glyph = <><Line {...common} x1="12" y1="5" x2="12" y2="19" /><Line {...common} x1="5" y1="12" x2="19" y2="12" /></>;
      break;
    case 'positions':
      glyph = <><Rect {...common} x="4" y="4" width="16" height="16" rx="2" /><Path {...common} d="M7 15l3-3 2 2 5-5" /></>;
      break;
    case 'alert':
      glyph = <><Path {...common} d="M12 3 2.8 20h18.4L12 3Z" /><Line {...common} x1="12" y1="9" x2="12" y2="14" /><Circle fill={color} cx="12" cy="17" r="0.8" /></>;
      break;
    case 'star':
      glyph = <Path {...common} fill={filled ? color : 'none'} d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />;
      break;
    case 'back':
      glyph = <><Line {...common} x1="20" y1="12" x2="5" y2="12" /><Polyline {...common} points="11,6 5,12 11,18" /></>;
      break;
    case 'chevron':
      glyph = <Polyline {...common} points="9,5 16,12 9,19" />;
      break;
    case 'close':
      glyph = <><Line {...common} x1="5" y1="5" x2="19" y2="19" /><Line {...common} x1="19" y1="5" x2="5" y2="19" /></>;
      break;
    case 'settings':
      glyph = <><Circle {...common} cx="12" cy="12" r="3" /><Path {...common} d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>;
      break;
    case 'security':
      glyph = <Path {...common} d="M12 3 4.5 6v5.5c0 4.8 3.2 8 7.5 9.5 4.3-1.5 7.5-4.7 7.5-9.5V6L12 3Z" />;
      break;
    case 'sliders':
      glyph = <><Line {...common} x1="4" y1="7" x2="20" y2="7" /><Circle {...common} cx="9" cy="7" r="2" /><Line {...common} x1="4" y1="17" x2="20" y2="17" /><Circle {...common} cx="15" cy="17" r="2" /></>;
      break;
    case 'help':
      glyph = <><Circle {...common} cx="12" cy="12" r="9" /><Path {...common} d="M9.7 9a2.4 2.4 0 1 1 3.6 2.1c-1 .6-1.3 1.1-1.3 2.2" /><Circle fill={color} cx="12" cy="17" r=".8" /></>;
      break;
    case 'info':
      glyph = <><Circle {...common} cx="12" cy="12" r="9" /><Line {...common} x1="12" y1="10.5" x2="12" y2="17" /><Circle fill={color} cx="12" cy="7.2" r=".8" /></>;
      break;
    case 'palette':
      glyph = <><Circle {...common} cx="12" cy="12" r="9" /><Circle fill={color} cx="8" cy="9" r="1" /><Circle fill={color} cx="12" cy="7" r="1" /><Circle fill={color} cx="16" cy="9" r="1" /><Path {...common} d="M12 21c-1.5 0-2.4-1.2-1.6-2.5.7-1.2 2.6-.5 4.2-1.4 2.2-1.2 2.8-3.2 2.4-5.2" /></>;
      break;
    case 'globe':
      glyph = <><Circle {...common} cx="12" cy="12" r="9" /><Path {...common} d="M3 12h18M12 3c2.3 2.4 3.4 5.4 3.4 9S14.3 18.6 12 21M12 3C9.7 5.4 8.6 8.4 8.6 12s1.1 6.6 3.4 9" /></>;
      break;
    case 'currency':
      glyph = <><Circle {...common} cx="12" cy="12" r="9" /><Path {...common} d="M15.5 8.5c-.8-1-2-1.5-3.5-1.5-2 0-3.5 1-3.5 2.5 0 3.8 7 1.6 7 5.2 0 1.4-1.4 2.5-3.5 2.5-1.7 0-3.1-.6-4-1.8M12 5v14" /></>;
      break;
    case 'refresh':
      glyph = <><Path {...common} d="M20 7v5h-5" /><Path {...common} d="M18.2 17a8 8 0 1 1 1.5-8" /></>;
      break;
    case 'lock':
      glyph = <><Rect {...common} x="5" y="10" width="14" height="11" rx="2" /><Path {...common} d="M8 10V7a4 4 0 0 1 8 0v3" /></>;
      break;
    case 'check':
      glyph = <Polyline {...common} points="4,13 9,18 20,6" />;
      break;
    case 'more':
      glyph = <><Circle fill={color} cx="5" cy="12" r="1.3" /><Circle fill={color} cx="12" cy="12" r="1.3" /><Circle fill={color} cx="19" cy="12" r="1.3" /></>;
      break;
    case 'swap':
      glyph = <><Path {...common} d="M7 4v15M7 4l-3 3M7 4l3 3M17 20V5M17 20l-3-3M17 20l3-3" /></>;
      break;
    case 'download':
      glyph = <><Path {...common} d="M12 3v12M7 10l5 5 5-5" /><Path {...common} d="M4 20h16" /></>;
      break;
    case 'upload':
      glyph = <><Path {...common} d="M12 21V9M7 14l5-5 5 5" /><Path {...common} d="M4 4h16" /></>;
      break;
    case 'chart':
      glyph = <><Rect {...common} x="3" y="3" width="18" height="18" rx="3" /><Path {...common} d="m6.5 15 3.2-3.2 2.6 2.2 5.2-5.5" /></>;
      break;
    case 'clock':
      glyph = <><Circle {...common} cx="12" cy="12" r="9" /><Path {...common} d="M12 7v5l3 2" /></>;
      break;
    default:
      glyph = null;
  }

  return <Svg width={size} height={size} viewBox="0 0 24 24">{glyph}</Svg>;
}
