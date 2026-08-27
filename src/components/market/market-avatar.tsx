import { Image, StyleSheet, Text, View } from 'react-native';
import { marketImage } from '@/assets/market-images';
import { colors, typography } from '@/theme/tokens';

interface MarketAvatarProps {
  assetKey: string;
  symbol: string;
  size?: number;
}

const ENTITY_MARKS = new Set([
  'apple', 'openai-icon', 'spotify-icon', 'real-madrid', 'fcb-icon', 'psg',
  'premier-league', 'arsenal', 'liverpool-crest', 'manchester-city',
  'manchester-united', 'los-angeles-lakers', 'boston-celtics',
  'kansas-city-chiefs', 'dallas-cowboys', 'claude-icon',
]);

const TILE_MARKS = new Set(['apple', 'openai-icon']);

export function MarketAvatar({ assetKey, symbol, size = 42 }: MarketAvatarProps) {
  const source = marketImage(assetKey);
  const isMark = ENTITY_MARKS.has(assetKey) || assetKey.endsWith('-icon');
  const isTile = TILE_MARKS.has(assetKey);

  return (
    <View
      style={[
        styles.frame,
        isMark ? styles.markFrame : styles.portraitFrame,
        isTile && styles.tileFrame,
        { borderRadius: isMark ? (isTile ? 7 : 0) : size / 2, height: size, width: size },
      ]}
    >
      {source ? (
        <Image
          accessible={false}
          resizeMode={isMark ? 'contain' : 'cover'}
          source={source}
          style={[styles.image, isTile && styles.tileImage]}
        />
      ) : (
        <Text style={[styles.fallback, { fontSize: Math.max(9, size * 0.27) }]}>{symbol.slice(0, 3)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { alignItems: 'center', justifyContent: 'center' },
  portraitFrame: { backgroundColor: colors.surfaceRaised, overflow: 'hidden' },
  markFrame: { backgroundColor: 'transparent' },
  tileFrame: { backgroundColor: colors.text, overflow: 'hidden' },
  image: { height: '100%', width: '100%' },
  tileImage: { height: '82%', width: '82%' },
  fallback: { color: colors.text, fontFamily: typography.family, fontWeight: typography.weights.semibold, letterSpacing: -0.2 },
});
