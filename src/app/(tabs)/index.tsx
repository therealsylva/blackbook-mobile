import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Wordmark } from '@/components/brand/wordmark';
import { Screen } from '@/components/layout/screen';
import { IndexRow } from '@/components/market/index-row';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useInterfaceMode } from '@/context/interface-mode';
import { markets, positions } from '@/data/market-fixtures';
import { formatCurrency, formatPercent } from '@/lib/format';
import type { Market } from '@/types/market';

function SectionHeader({ action, title }: { action?: string; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? <Text style={styles.sectionAction}>{action}</Text> : null}
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { mode } = useInterfaceMode();
  const openMarket = (market: Market) => {
    router.push({ pathname: '/market/[symbol]', params: { symbol: market.symbol } });
  };
  const previewPnl = positions.reduce((total, position) => total + position.pnl, 0);

  return (
    <Screen>
      <View style={styles.header}>
        <Wordmark />
        <Pressable accessibilityLabel="Open account" accessibilityRole="button" style={styles.profile}>
          <SymbolView
            name={{ ios: 'person', android: 'person', web: 'person' }}
            size={21}
            tintColor={colors.textOnDark}
          />
        </Pressable>
      </View>

      <View style={styles.hero}>
        <Text style={styles.kicker}>REAL-WORLD PERFORMANCE MARKETS</Text>
        <Text style={styles.heroTitle}>Trade what you know.</Text>
        <Text style={styles.heroBody}>
          Continuous indices that turn verified performance into markets you can hold across events.
        </Text>
      </View>

      <View style={styles.accountSummary}>
        <View>
          <Text style={styles.accountLabel}>Preview account equity</Text>
          <Text style={styles.accountValue}>{formatCurrency(12480.64)}</Text>
        </View>
        <View style={styles.pnlBlock}>
          <Text style={styles.accountLabel}>Open P&amp;L</Text>
          <Text style={styles.pnlValue}>+{formatCurrency(previewPnl)}</Text>
        </View>
      </View>

      {mode === 'advanced' ? (
        <View style={styles.deskStrip}>
          <View style={styles.deskMetric}>
            <Text style={styles.deskLabel}>MARKETS</Text>
            <Text style={styles.deskValue}>7 open</Text>
          </View>
          <View style={styles.deskMetric}>
            <Text style={styles.deskLabel}>MARGIN USED</Text>
            <Text style={styles.deskValue}>18.4%</Text>
          </View>
          <View style={styles.deskMetric}>
            <Text style={styles.deskLabel}>OPEN ORDERS</Text>
            <Text style={styles.deskValue}>2</Text>
          </View>
        </View>
      ) : null}

      <SectionHeader action="All indices" title="Major indices" />
      <View>
        {markets.slice(0, 3).map((market) => (
          <IndexRow advanced={mode === 'advanced'} key={market.symbol} market={market} onPress={() => openMarket(market)} />
        ))}
      </View>

      <SectionHeader action="24H" title="Fastest movers" />
      <View>
        {[markets[3], markets[0], markets[6]].map((market) =>
          market ? (
            <IndexRow advanced={mode === 'advanced'} key={market.symbol} market={market} onPress={() => openMarket(market)} />
          ) : null,
        )}
      </View>

      <SectionHeader title="What moved" />
      <Pressable
        accessibilityRole="button"
        onPress={() => openMarket(markets[0]!)}
        style={({ pressed }) => [styles.event, pressed && styles.pressed]}>
        <View style={styles.eventRule} />
        <View style={styles.eventCopy}>
          <Text style={styles.eventSymbol}>RMD · VERIFIED</Text>
          <Text style={styles.eventTitle}>Performance update expanded Real Madrid’s upside band.</Text>
          <Text style={styles.eventMeta}>18 min ago · {formatPercent(markets[0]!.changePercent)}</Text>
        </View>
      </Pressable>

      <Text style={styles.previewNote}>Foundation preview · market and account data are fixtures · execution disconnected</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
  },
  profile: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: radius.control,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  hero: {
    paddingBottom: spacing.xl,
    paddingTop: spacing.xxl,
  },
  kicker: {
    color: colors.textMuted,
    fontSize: typography.label,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  heroTitle: {
    color: colors.text,
    fontSize: typography.display,
    fontWeight: '900',
    letterSpacing: -1.8,
    lineHeight: 46,
    marginTop: spacing.sm,
    maxWidth: 310,
  },
  heroBody: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24,
    marginTop: spacing.md,
    maxWidth: 340,
  },
  accountSummary: {
    alignItems: 'flex-end',
    borderBottomColor: colors.line,
    borderTopColor: colors.line,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
  },
  accountLabel: {
    color: colors.textMuted,
    fontSize: typography.label,
  },
  accountValue: {
    color: colors.text,
    fontSize: 28,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
    letterSpacing: -0.8,
    marginTop: spacing.xxs,
  },
  pnlBlock: {
    alignItems: 'flex-end',
  },
  pnlValue: {
    color: colors.positive,
    fontSize: typography.body,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
    marginTop: spacing.xxs,
  },
  deskStrip: {
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingVertical: spacing.md,
  },
  deskMetric: {
    flex: 1,
  },
  deskLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  deskValue: {
    color: colors.text,
    fontSize: typography.compact,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
    marginTop: 3,
  },
  sectionHeader: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    paddingTop: spacing.xl,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.section,
    fontWeight: '800',
  },
  sectionAction: {
    color: colors.textMuted,
    fontSize: typography.label,
    fontWeight: '700',
  },
  event: {
    borderBottomColor: colors.line,
    borderTopColor: colors.line,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingVertical: spacing.md,
  },
  eventRule: {
    backgroundColor: colors.accent,
    marginRight: spacing.md,
    width: 3,
  },
  eventCopy: {
    flex: 1,
  },
  eventSymbol: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  eventTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
    lineHeight: 23,
    marginTop: spacing.xs,
  },
  eventMeta: {
    color: colors.textMuted,
    fontSize: typography.label,
    marginTop: spacing.xs,
  },
  pressed: {
    opacity: 0.56,
  },
  previewNote: {
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: spacing.xl,
    textAlign: 'center',
  },
});
