import { StyleSheet, Text, View } from 'react-native';

import { Wordmark } from '@/components/brand/wordmark';
import { Screen } from '@/components/layout/screen';
import { colors, spacing, typography } from '@/constants/theme';
import { useInterfaceMode } from '@/context/interface-mode';
import { positions } from '@/data/market-fixtures';
import { formatCurrency, formatIndexValue, formatPercent } from '@/lib/format';

export default function PortfolioScreen() {
  const { mode } = useInterfaceMode();
  const openPnl = positions.reduce((total, position) => total + position.pnl, 0);

  return (
    <Screen>
      <View style={styles.brandLine}>
        <Wordmark />
        <Text style={styles.preview}>PREVIEW DATA</Text>
      </View>
      <Text style={styles.title}>Portfolio</Text>

      <View style={styles.equityBlock}>
        <Text style={styles.label}>Account equity</Text>
        <Text style={styles.equity}>{formatCurrency(12480.64)}</Text>
        <View style={styles.equityMeta}>
          <Text style={styles.metaItem}>Available {formatCurrency(12150.28)}</Text>
          <Text style={styles.positive}>Open P&amp;L +{formatCurrency(openPnl)}</Text>
        </View>
      </View>

      {mode === 'advanced' ? (
        <View style={styles.riskStrip}>
          <View style={styles.riskMetric}>
            <Text style={styles.riskLabel}>MARGIN RATIO</Text>
            <Text style={styles.riskValue}>18.4%</Text>
          </View>
          <View style={styles.riskMetric}>
            <Text style={styles.riskLabel}>EXPOSURE</Text>
            <Text style={styles.riskValue}>{formatCurrency(170)}</Text>
          </View>
          <View style={styles.riskMetric}>
            <Text style={styles.riskLabel}>OPEN ORDERS</Text>
            <Text style={styles.riskValue}>2</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.tabs}>
        <Text style={[styles.tab, styles.tabActive]}>Positions</Text>
        <Text style={styles.tab}>Orders</Text>
        <Text style={styles.tab}>History</Text>
        <Text style={styles.tab}>Journal</Text>
      </View>

      <View style={styles.listHead}>
        <Text style={styles.listHeadText}>OPEN POSITIONS</Text>
        <Text style={styles.listHeadText}>{positions.length}</Text>
      </View>

      {positions.map((position) => {
        const positive = position.pnl >= 0;
        return (
          <View key={position.id} style={styles.position}>
            <View style={styles.positionTop}>
              <View>
                <Text style={styles.positionTitle}>{position.symbol} · {position.side.toUpperCase()}</Text>
                <Text style={styles.positionMeta}>{formatCurrency(position.size)} margin · {position.leverage}×</Text>
              </View>
              <View style={styles.pnlColumn}>
                <Text style={[styles.positionPnl, { color: positive ? colors.positive : colors.negative }]}>
                  {positive ? '+' : '−'}{formatCurrency(Math.abs(position.pnl))}
                </Text>
                <Text style={[styles.positionPnlPercent, { color: positive ? colors.positive : colors.negative }]}>
                  {formatPercent(position.pnlPercent)}
                </Text>
              </View>
            </View>
            <View style={styles.positionStats}>
              <Text style={styles.stat}>Entry {formatIndexValue(position.entry)}</Text>
              <Text style={styles.stat}>Mark {formatIndexValue(position.mark)}</Text>
              <Text style={styles.stat}>TP/SL —</Text>
            </View>
          </View>
        );
      })}

      <Text style={styles.note}>Execution and account services are intentionally disconnected in this foundation.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brandLine: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
  },
  preview: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '900',
    letterSpacing: -0.9,
    marginTop: spacing.xl,
  },
  equityBlock: {
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    paddingBottom: spacing.lg,
    paddingTop: spacing.xl,
  },
  label: {
    color: colors.textMuted,
    fontSize: typography.compact,
  },
  equity: {
    color: colors.text,
    fontSize: 38,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
    letterSpacing: -1.2,
    marginTop: spacing.xs,
  },
  equityMeta: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  metaItem: {
    color: colors.textMuted,
    fontSize: typography.label,
  },
  positive: {
    color: colors.positive,
    fontSize: typography.label,
    fontWeight: '700',
  },
  riskStrip: {
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingVertical: spacing.md,
  },
  riskMetric: {
    flex: 1,
  },
  riskLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  riskValue: {
    color: colors.text,
    fontSize: typography.compact,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
    marginTop: 3,
  },
  tabs: {
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  tab: {
    color: colors.textMuted,
    fontSize: typography.compact,
    fontWeight: '700',
    paddingBottom: spacing.sm,
  },
  tabActive: {
    borderBottomColor: colors.ink,
    borderBottomWidth: 2,
    color: colors.text,
  },
  listHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: spacing.xs,
    paddingTop: spacing.xl,
  },
  listHeadText: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  position: {
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    paddingVertical: spacing.md,
  },
  positionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  positionTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  positionMeta: {
    color: colors.textMuted,
    fontSize: typography.label,
    marginTop: 3,
  },
  pnlColumn: {
    alignItems: 'flex-end',
  },
  positionPnl: {
    fontSize: typography.body,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
  },
  positionPnlPercent: {
    fontSize: typography.label,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
    marginTop: 3,
  },
  positionStats: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  stat: {
    color: colors.textMuted,
    fontSize: 10,
    fontVariant: ['tabular-nums'],
  },
  note: {
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: spacing.xl,
    textAlign: 'center',
  },
});
