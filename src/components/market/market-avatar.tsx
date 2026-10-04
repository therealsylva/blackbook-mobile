import { Image, StyleSheet, Text, View } from 'react-native';
import { marketImage } from '@/assets/market-images';
import { typography } from '@/theme/tokens';
import { createThemedStyles } from '@/theme/use-themed-styles';

interface MarketAvatarProps {
  assetKey: string;
  symbol: string;
  size?: number;
}

const PORTRAITS = new Set(["lamine-profile", "kylian-mbappe", "dembele-profile", "raphinha-profile", "erling-haaland", "kane-profile", "vinicius-junior", "jude-bellingham", "olise-profile", "bruno-profile", "rodri-profile", "osimhen-profile", "musiala-profile", "saka-profile", "palmer-profile"]);
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

export function MarketAvatar({ assetKey, symbol, size = 42 }: MarketAvatarProps) {
  const styles = useStyles();
  const source = marketImage(assetKey);
  const portrait = PORTRAITS.has(assetKey);
  const circularProduct = false;
  const productBackground = assetKey === 'ac-milan' ? '#FFFFFF' : 'transparent';
  const scale = assetKey === 'ac-milan' ? 0.82 : OPTICAL_SCALE[assetKey] ?? 1;

  return (
    <View style={[styles.frame, (portrait || circularProduct) && styles.circle, { backgroundColor: productBackground, borderRadius: size / 2, height: size, width: size }]}>
      {source ? (
        <Image
          accessible={false}
          resizeMode={portrait || assetKey === 'claude-icon' ? 'cover' : 'contain'}
          source={source}
          style={{ ...(assetKey === 'raphinha-profile' ? { position: 'absolute' as const, top: 0, left: -size * 0.4 } : {}), borderRadius: circularProduct ? size / 2 : 0, height: assetKey === 'raphinha-profile' ? size * 1.8 : size * scale, tintColor: assetKey === 'premier-league' ? '#3D195B' : undefined, width: assetKey === 'raphinha-profile' ? size * 1.8 : size * scale }}
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
