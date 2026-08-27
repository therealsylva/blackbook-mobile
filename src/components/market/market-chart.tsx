import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';
import { colors } from '@/theme/tokens';

interface MarketChartProps {
  series: number[];
  positive: boolean;
  height?: number;
  candles?: boolean;
}

const WIDTH = 360;
const PAD = 8;

export function MarketChart({ series, positive, height = 190, candles = false }: MarketChartProps) {
  const chart = useMemo(() => {
    const clean = series.length > 1 ? series : [0, 0];
    const min = Math.min(...clean);
    const max = Math.max(...clean);
    const span = Math.max(max - min, 1);
    const x = (index: number) => PAD + (index / (clean.length - 1)) * (WIDTH - PAD * 2);
    const y = (value: number) => PAD + ((max - value) / span) * (height - PAD * 2);
    const path = clean.map((value, index) => `${index === 0 ? 'M' : 'L'} ${x(index).toFixed(2)} ${y(value).toFixed(2)}`).join(' ');
    const candleItems = clean.slice(1).map((close, index) => {
      const open = clean[index] ?? close;
      const high = Math.max(open, close) + span * 0.018;
      const low = Math.min(open, close) - span * 0.018;
      return { close, open, high, low, x: x(index + 1), yOpen: y(open), yClose: y(close), yHigh: y(high), yLow: y(low) };
    });
    return { path, candleItems };
  }, [height, series]);

  const lineColor = positive ? colors.positive : colors.negative;
  return (
    <View style={[styles.frame, { height }]}>
      <Svg height="100%" preserveAspectRatio="none" viewBox={`0 0 ${WIDTH} ${height}`} width="100%">
        {[0.25, 0.5, 0.75].map((ratio) => <Line key={ratio} stroke={colors.divider} strokeDasharray="3 6" strokeWidth="0.6" x1="0" x2={WIDTH} y1={height * ratio} y2={height * ratio} />)}
        {candles ? chart.candleItems.map((item, index) => {
          const up = item.close >= item.open;
          const color = up ? colors.positive : colors.negative;
          const bodyY = Math.min(item.yOpen, item.yClose);
          const bodyHeight = Math.max(2, Math.abs(item.yClose - item.yOpen));
          return <Path key={index} d={`M ${item.x} ${item.yHigh} L ${item.x} ${item.yLow} M ${item.x - 3.2} ${bodyY} L ${item.x + 3.2} ${bodyY} L ${item.x + 3.2} ${bodyY + bodyHeight} L ${item.x - 3.2} ${bodyY + bodyHeight} Z`} fill={color} stroke={color} strokeWidth="0.8" />;
        }) : <Path d={chart.path} fill="none" stroke={lineColor} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', width: '100%' },
});
