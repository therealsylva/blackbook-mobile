import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MarketAvatar } from '@/components/market/market-avatar';
import { MarketChart } from '@/components/market/market-chart';
import { Screen } from '@/components/ui/screen';
import { TopBar } from '@/components/ui/top-bar';
import { useExchange } from '@/context/exchange-context';
import { SNAPSHOT_LABEL, type MarketDefinition } from '@/data/football-markets';
import { MAJOR_PAIRS } from '@/data/pairs';
import { formatPercent, formatPrice } from '@/lib/format';
import { spacing, radii, typography } from '@/theme/tokens';
import { createThemedStyles } from '@/theme/use-themed-styles';

export function generateStaticParams() { return MAJOR_PAIRS.map((pair) => ({ id: pair.id })); }

export default function PairOverviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const pair = MAJOR_PAIRS.find((item) => item.id === id);
  const { marketFor, priceFor } = useExchange();
  const styles = useStyles();
  const left = pair && marketFor(pair.left);
  const right = pair && marketFor(pair.right);
  if (!pair || !left || !right) return <Screen><TopBar back title="Pair unavailable" /></Screen>;
  const ratio = priceFor(left.symbol) / priceFor(right.symbol);
  const referenceRatio = left.reference / right.reference;
  return <Screen><TopBar back title={pair.title} /><ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.caption}>Market ratio · {pair.title}</Text>
    <Text style={styles.value}>{ratio.toFixed(4)}</Text>
    <Text style={styles.caption}>{formatPercent((ratio / referenceRatio - 1) * 100)} vs reference ratio {referenceRatio.toFixed(4)}</Text>
    <Text style={styles.caption}>Published references · {SNAPSHOT_LABEL}</Text>
    <PairSide market={left} /><PairSide market={right} />
  </ScrollView></Screen>;
}

function PairSide({ market }: { market: MarketDefinition }) {
  const styles = useStyles();
  const router = useRouter();
  const { priceFor, changeFor, setActiveSymbol } = useExchange();
  return <View style={styles.card}>
    <View style={styles.identity}><MarketAvatar assetKey={market.assetKey} symbol={market.symbol} size={46} /><View style={styles.copy}><Text style={styles.name}>{market.symbol}</Text><Text style={styles.caption}>{market.name}</Text></View></View>
    <Text style={styles.value}>{formatPrice(priceFor(market.symbol))}</Text>
    <Text style={styles.caption}>R {formatPrice(market.reference)} · {formatPercent(changeFor(market.symbol))} vs R</Text>
    <Text style={styles.caption}>Band {formatPrice(market.lowerBand)} – {formatPrice(market.upperBand)}</Text>
    <MarketChart series={market.series} height={100} area positive />
    <Text style={styles.caption}>{market.history.length ? 'Published reference history' : 'Snapshot only'}</Text>
    <View style={styles.actions}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Inspect ${market.symbol}`} style={styles.button} onPress={() => router.push({ pathname: '/market/[symbol]', params: { symbol: market.symbol } })}><Text style={styles.buttonText}>Overview</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`Trade ${market.symbol}`} style={styles.button} onPress={() => { setActiveSymbol(market.symbol); router.push('/(tabs)/trade'); }}><Text style={styles.buttonText}>Trade {market.symbol}</Text></Pressable>
    </View>
  </View>;
}
const useStyles = createThemedStyles((colors) => ({
  content: { padding: spacing.page, paddingBottom: spacing.xl },
  caption: { color: colors.textMuted, fontFamily: typography.medium, fontSize: 12, lineHeight: 20 },
  value: { color: colors.text, fontFamily: typography.monoBold, fontSize: 28, marginVertical: spacing.xs },
  card: { backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.md, marginTop: spacing.md },
  identity: { flexDirection: 'row', alignItems: 'center' }, copy: { flex: 1, marginLeft: spacing.sm },
  name: { color: colors.text, fontFamily: typography.bold, fontSize: 18 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  button: { flex: 1, borderRadius: radii.pill, backgroundColor: colors.control, padding: spacing.sm, alignItems: 'center' },
  buttonText: { color: colors.text, fontFamily: typography.semibold, fontSize: 12 },
}));
