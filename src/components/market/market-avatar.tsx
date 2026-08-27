import { Image, StyleSheet, Text, View } from 'react-native';
import { marketImage } from '@/assets/market-images';
import { colors } from '@/theme/tokens';

interface MarketAvatarProps {
  assetKey: string;
  symbol: string;
  size?: number;
}

export function MarketAvatar({ assetKey, symbol, size = 38 }: MarketAvatarProps) {
  const source = marketImage(assetKey);
  return (
    <View style={[styles.avatar, { borderRadius: size / 2, height: size, width: size }]}>
      {source ? <Image source={source} style={styles.image} /> : <Text style={[styles.fallback, { fontSize: Math.max(9, size * 0.27) }]}>{symbol.split('/')[0]?.slice(0, 3)}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', backgroundColor: colors.surfaceRaised, justifyContent: 'center', overflow: 'hidden' },
  image: { height: '100%', width: '100%' },
  fallback: { color: colors.accent, fontWeight: '800', letterSpacing: -0.3 },
});
