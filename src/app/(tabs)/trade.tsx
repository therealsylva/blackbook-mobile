import { AdvancedTrade } from '@/components/trade/advanced-trade';
import { BasicTrade } from '@/components/trade/basic-trade';
import { useInterfaceMode } from '@/context/interface-mode';
import { markets } from '@/data/market-fixtures';

export default function TradeScreen() {
  const { mode } = useInterfaceMode();
  const market = markets[0]!;

  return mode === 'advanced' ? <AdvancedTrade market={market} /> : <BasicTrade market={market} />;
}
