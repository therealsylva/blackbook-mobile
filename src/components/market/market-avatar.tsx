import { Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { marketImage } from '@/assets/market-images';
import { typography } from '@/theme/tokens';
import { createThemedStyles } from '@/theme/use-themed-styles';
import { NbaMark } from './nba-mark';

interface MarketAvatarProps {
  assetKey: string;
  symbol: string;
  size?: number;
}

const PORTRAITS = new Set([
  'lamine-profile', 'kendrick-lamar', 'drake', 'kylian-mbappe', 'eminem-profile',
  'lebron-profile', 'vinicius-junior', 'erling-haaland', 'jude-bellingham',
  'taylor-swift', 'beyonce', 'the-weeknd', 'bad-bunny', 'kanye-west',
  'travis-scott', 'doja-cat', 'future', 'central-cee',
  'justin-bieber', 'tyla-profile',
]);

const CIRCULAR_PRODUCTS = new Set(['openai-icon', 'claude-icon', 'apple', 'premier-league']);
const OPTICAL_SCALE: Record<string, number> = {
  'openai-icon': 0.74,
  apple: 0.94,
  'premier-league': 1.08,
  'fcb-icon': 0.9,
  psg: 0.95,
  'manchester-city': 0.96,
  'manchester-united': 0.94,
  'liverpool-crest': 0.92,
  arsenal: 0.92,
  'los-angeles-lakers': 0.94,
  'boston-celtics': 0.94,
};

function SpotifyMark({ size }: { size: number }) {
  return (
    <Svg height={size} viewBox="0 0 48 48" width={size}>
      <Circle cx="24" cy="24" fill="#1ED760" r="23" />
      <Path d="M12 18.2c8.7-2.3 18.9-1.4 25.2 2" fill="none" stroke="#000" strokeLinecap="round" strokeWidth="3.4" />
      <Path d="M13.6 24.4c7.8-1.8 16.4-1 22 1.7" fill="none" stroke="#000" strokeLinecap="round" strokeWidth="3" />
      <Path d="M15 30.2c6.3-1.2 13.2-.5 18.5 1.7" fill="none" stroke="#000" strokeLinecap="round" strokeWidth="2.7" />
    </Svg>
  );
}

export function MarketAvatar({ assetKey, symbol, size = 42 }: MarketAvatarProps) {
  const styles = useStyles();
  if (assetKey === 'spotify-icon') return <View style={{ height: size, width: size }}><SpotifyMark size={size} /></View>;
  if (assetKey === 'nba-icon') return <View style={{ height: size, width: size }}><NbaMark size={size} /></View>;

  const source = marketImage(assetKey);
  const portrait = PORTRAITS.has(assetKey);
  const circularProduct = CIRCULAR_PRODUCTS.has(assetKey);
  const productBackground = assetKey === 'openai-icon' || assetKey === 'premier-league' ? '#FFFFFF' : assetKey === 'apple' ? '#000000' : 'transparent';
  const scale = OPTICAL_SCALE[assetKey] ?? 1;

  return (
    <View style={[styles.frame, (portrait || circularProduct) && styles.circle, { backgroundColor: productBackground, borderRadius: size / 2, height: size, width: size }]}>
      {source ? (
        <Image
          accessible={false}
          resizeMode={portrait || assetKey === 'claude-icon' ? 'cover' : 'contain'}
          source={source}
          style={{ borderRadius: circularProduct ? size / 2 : 0, height: size * scale, tintColor: assetKey === 'premier-league' ? '#3D195B' : undefined, width: size * scale }}
        />
      ) : (
        <View style={[styles.fallbackFrame, { borderRadius: size / 2, height: size, width: size }]}>
          <Text style={[styles.fallback, { fontSize: Math.max(9, size * 0.25) }]}>{symbol.slice(0, 3)}</Text>
        </View>
      )}
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  frame: { alignItems: 'center', backgroundColor: 'transparent', justifyContent: 'center' },
  circle: { overflow: 'hidden' },
  fallbackFrame: { alignItems: 'center', borderColor: colors.divider, borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center' },
  fallback: { color: colors.text, fontFamily: typography.bold, letterSpacing: -0.4 },
}));
