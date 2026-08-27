import { Image, StyleSheet, Text, View, type ImageStyle, type StyleProp } from 'react-native';
import { marketImage } from '@/assets/market-images';
import { colors, typography } from '@/theme/tokens';

interface MarketAvatarProps {
  assetKey: string;
  symbol: string;
  size?: number;
}

const CONTAINED_MARKS = new Set([
  'apple', 'openai-icon', 'spotify-icon', 'real-madrid', 'fcb-icon', 'psg',
  'premier-league', 'arsenal', 'liverpool-crest', 'manchester-city',
  'manchester-united', 'los-angeles-lakers', 'boston-celtics',
  'kansas-city-chiefs', 'dallas-cowboys',
]);

const PORTRAIT_CROPS: Record<string, StyleProp<ImageStyle>> = {
  'lamine-profile': { transform: [{ scale: 1.3 }, { translateY: 5 }] },
  'kylian-mbappe': { transform: [{ scale: 1.28 }, { translateY: 7 }] },
  'lebron-profile': { transform: [{ scale: 1.48 }, { translateY: 15 }] },
  'vinicius-junior': { transform: [{ scale: 1.32 }, { translateY: 9 }] },
  'erling-haaland': { transform: [{ scale: 1.32 }, { translateY: 9 }] },
  'jude-bellingham': { transform: [{ scale: 1.26 }, { translateY: 4 }] },
};

export function MarketAvatar({ assetKey, symbol, size = 38 }: MarketAvatarProps) {
  const source = marketImage(assetKey);
  const lightLogo = assetKey === 'openai-icon' || assetKey === 'apple';
  const containedLogo = CONTAINED_MARKS.has(assetKey) || assetKey.endsWith('-icon');
  return (
    <View style={[styles.avatar, containedLogo ? styles.markFrame : styles.portraitFrame, lightLogo && styles.lightLogo, { borderRadius: containedLogo ? 0 : size / 2, height: size, width: size }]}> 
      {source ? <Image accessible={false} resizeMode={containedLogo ? 'contain' : 'cover'} source={source} style={[styles.image, containedLogo && styles.contained, !containedLogo && PORTRAIT_CROPS[assetKey]]} /> : <Text style={[styles.fallback, { fontSize: Math.max(9, size * 0.27) }]}>{symbol.split('/')[0]?.slice(0, 3)}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
  portraitFrame: { backgroundColor: colors.surfaceRaised, overflow: 'hidden' },
  markFrame: { backgroundColor: 'transparent', overflow: 'visible' },
  lightLogo: { backgroundColor: colors.text, borderRadius: 10, overflow: 'hidden' },
  image: { height: '100%', width: '100%' },
  contained: { height: '88%', width: '88%' },
  fallback: { color: colors.text, fontFamily: typography.semibold, letterSpacing: -0.3 },
});
