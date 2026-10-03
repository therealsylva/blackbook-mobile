import { useLocalSearchParams } from 'expo-router';
import { MAJOR_PAIRS } from '@/data/pairs';
import { MarketOverview } from '../market/[symbol]';
export function generateStaticParams() { return MAJOR_PAIRS.map(pair => ({ id: pair.id })); }
export default function PairOverviewScreen() {
 const { id } = useLocalSearchParams<{ id: string }>();
 const pair = MAJOR_PAIRS.find(item => item.id === id);
 return <MarketOverview selectedSymbol={pair?.title ?? 'unavailable'} />;
}
