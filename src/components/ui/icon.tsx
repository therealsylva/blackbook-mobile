import type { ColorValue } from 'react-native';
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowLeftRight,
  ArrowUpDown,
  ArrowUpFromLine,
  Bell,
  BookOpenText,
  Camera,
  ChartNoAxesColumnIncreasing,
  ChartNoAxesCombined,
  ChartSpline,
  Check,
  ChevronRight,
  CircleDollarSign,
  CircleHelp,
  Info,
  Clock3,
  Contrast,
  Copy,
  Ellipsis,
  Eye,
  EyeOff,
  FileText,
  Globe2,
  Headphones,
  House,
  Languages,
  ListFilter,
  ListOrdered,
  LockKeyhole,
  LogOut,
  Newspaper,
  Palette,
  PanelsTopLeft,
  Pencil,
  Plus,
  RefreshCw,
  ScanLine,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  TriangleAlert,
  UserRound,
  WalletCards,
  X,
  type LucideIcon,
} from 'lucide-react-native';

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
  | 'order-book'
  | 'feed'
  | 'edit'
  | 'camera';

interface IconProps {
  name: IconName;
  size?: number;
  color?: ColorValue;
  filled?: boolean;
}

const ICONS: Record<IconName, LucideIcon> = {
  home: House,
  markets: ChartNoAxesColumnIncreasing,
  trade: ArrowLeftRight,
  wallet: WalletCards,
  profile: UserRound,
  search: Search,
  bell: Bell,
  eye: Eye,
  'eye-off': EyeOff,
  plus: Plus,
  positions: ChartNoAxesCombined,
  alert: TriangleAlert,
  star: Star,
  back: ArrowLeft,
  chevron: ChevronRight,
  close: X,
  settings: Settings,
  security: ShieldCheck,
  sliders: SlidersHorizontal,
  help: CircleHelp,
  info: Info,
  palette: Palette,
  globe: Globe2,
  currency: CircleDollarSign,
  refresh: RefreshCw,
  lock: LockKeyhole,
  check: Check,
  more: Ellipsis,
  swap: ArrowUpDown,
  download: ArrowDownToLine,
  upload: ArrowUpFromLine,
  chart: ChartSpline,
  clock: Clock3,
  orders: ListOrdered,
  filter: ListFilter,
  document: FileText,
  support: Headphones,
  logout: LogOut,
  appearance: Contrast,
  language: Languages,
  mode: PanelsTopLeft,
  copy: Copy,
  scan: ScanLine,
  'order-book': BookOpenText,
  feed: Newspaper,
  edit: Pencil,
  camera: Camera,
};

export function Icon({ name, size = 22, color = '#FFFFFF', filled = false }: IconProps) {
  const Glyph = ICONS[name];
  return <Glyph color={String(color)} fill={filled ? String(color) : 'none'} size={size} strokeWidth={filled ? 2.25 : 2} />;
}
