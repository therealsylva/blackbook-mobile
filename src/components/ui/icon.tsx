import type { ColorValue } from 'react-native';
import { useTheme } from '@/theme/theme-context';
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowLeftRight,
  ArrowUpDown,
  ArrowUpFromLine,
  BanknoteArrowDown,
  BanknoteArrowUp,
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
  | 'deposit'
  | 'withdraw'
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
  deposit: BanknoteArrowDown,
  withdraw: BanknoteArrowUp,
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

export function Icon({ name, size = 22, color, filled = false }: IconProps) {
  const { colors } = useTheme();
  const Glyph = ICONS[name];
  const resolvedColor = String(color ?? colors.text);
  return <Glyph color={resolvedColor} fill={filled ? resolvedColor : 'none'} size={size} strokeWidth={filled ? 2.25 : 2} />;
}
