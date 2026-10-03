import { View } from 'react-native';
import { MARKETS, type MarketDefinition } from '@/data/markets';
import { MarketAvatar } from './market-avatar';
export function MarketIdentityAvatar({ market, size = 42 }: { market: MarketDefinition; size?: number }) {
 if (!market.pairLegs) return <MarketAvatar assetKey={market.assetKey} symbol={market.symbol} size={size} />;
 const legs = market.pairLegs.map(symbol => MARKETS.find(item => item.symbol === symbol)!);
 return <View style={{ flexDirection: 'row', alignItems: 'center', width: size * 1.5 }}>
  {legs.map((leg, index) => <View key={leg.symbol} style={{ marginLeft: index ? -size * 0.2 : 0 }}><MarketAvatar assetKey={leg.assetKey} symbol={leg.symbol} size={size * 0.85} /></View>)}
 </View>;
}
