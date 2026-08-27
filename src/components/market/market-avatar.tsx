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
  const lightLogo = assetKey === 'openai-icon' || assetKey === 'apple';
  const containedLogo = lightLogo || assetKey.endsWith('-icon') || ['real-madrid', 'fcb-icon', 'psg', 'premier-league'].includes(assetKey);
  return (
    <View style={[styles.avatar, lightLogo && styles.lightLogo, { borderRadius: size / 2, height: size, width: size }]}>
      {source ? <Image resizeMode={containedLogo ? 'contain' : 'cover'} source={source} style={[styles.image, containedLogo && styles.contained]} /> : <Text style={[styles.fallback, { fontSize: Math.max(9, size * 0.27) }]}>{symbol.split('/')[0]?.slice(0, 3)}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', backgroundColor: colors.surfaceRaised, justifyContent: 'center', overflow: 'hidden' },
  lightLogo: { backgroundColor: colors.text },
  image: { height: '100%', width: '100%' },
  contained: { height: '78%', width: '78%' },
  fallback: { color: colors.accent, fontWeight: '800', letterSpacing: -0.3 },
});
