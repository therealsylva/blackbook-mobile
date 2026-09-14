import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import type { CandlePoint } from '@/lib/market-series';
import { useTheme } from '@/theme/theme-context';
import { createThemedStyles } from '@/theme/use-themed-styles';

interface MarketChartProps {
  series: number[];
  positive: boolean;
  height?: number;
  grid?: boolean;
  strokeWidth?: number;
  area?: boolean;
}

interface CandlestickChartProps {
  candles: CandlePoint[];
  height?: number;
  showVolume?: boolean;
}

const WIDTH = 360;
const PAD_X = 8;

function geometry(series: number[], height: number, bottom = 8) {
  const clean = series.length > 1 ? series : [0, 0];
  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const span = Math.max(max - min, 1);
  const x = (index: number) => PAD_X + (index / Math.max(1, clean.length - 1)) * (WIDTH - PAD_X * 2);
  const y = (value: number) => 8 + ((max - value) / span) * (height - 8 - bottom);
  const path = clean.map((value, index) => `${index === 0 ? 'M' : 'L'} ${x(index).toFixed(2)} ${y(value).toFixed(2)}`).join(' ');
  return { clean, min, max, span, x, y, path };
}

export function MarketChart({ series, positive, height = 190, grid = false, strokeWidth = 2, area = false }: MarketChartProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const chart = useMemo(() => geometry(series, height), [height, series]);
  const lineColor = positive ? colors.overviewPositive : colors.overviewNegative;
  const areaPath = `${chart.path} L ${chart.x(chart.clean.length - 1)} ${height} L ${chart.x(0)} ${height} Z`;

  return (
    <View style={[styles.frame, { height }]}>
      <Svg height="100%" preserveAspectRatio="none" viewBox={`0 0 ${WIDTH} ${height}`} width="100%">
        <Defs>
          <LinearGradient id="area" x1="0" x2="0" y1="0" y2="1">
            <Stop offset="0" stopColor={lineColor} stopOpacity="0.16" />
            <Stop offset="0.55" stopColor={lineColor} stopOpacity="0.045" />
            <Stop offset="1" stopColor={lineColor} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        {grid ? [0.25, 0.5, 0.75].map((ratio) => <Line key={ratio} opacity={0.55} stroke={colors.dividerSoft} strokeDasharray="2 7" strokeWidth="0.6" x1="0" x2={WIDTH} y1={height * ratio} y2={height * ratio} />) : null}
        {area ? <Path d={areaPath} fill="url(#area)" /> : null}
        <Path d={chart.path} fill="none" stroke={lineColor} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} />
      </Svg>
    </View>
  );
}

export function CandlestickChart({ candles, height = 212, showVolume = true }: CandlestickChartProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const chart = useMemo(() => {
    const clean = candles.length > 1 ? candles : [{ time: 0, open: 0, high: 1, low: 0, close: 1, volume: 1 }, { time: 1, open: 1, high: 1, low: 0, close: 0, volume: 1 }];
    const priceHeight = showVolume ? height * 0.78 : height - 8;
    const min = Math.min(...clean.map((item) => item.low));
    const max = Math.max(...clean.map((item) => item.high));
    const span = Math.max(max - min, 1);
    const xStep = (WIDTH - PAD_X * 2) / clean.length;
    const y = (value: number) => 8 + ((max - value) / span) * (priceHeight - 14);
    const maxVolume = Math.max(...clean.map((item) => item.volume), 1);
    return { clean, priceHeight, xStep, y, maxVolume };
  }, [candles, height, showVolume]);

  return (
    <View style={[styles.candleFrame, { height }]}>
      <Svg height="100%" preserveAspectRatio="none" viewBox={`0 0 ${WIDTH} ${height}`} width="100%">
        {[0.22, 0.5, 0.78].map((ratio) => <Line key={ratio} opacity={0.55} stroke={colors.dividerSoft} strokeDasharray="2 7" strokeWidth="0.6" x1="0" x2={WIDTH} y1={chart.priceHeight * ratio} y2={chart.priceHeight * ratio} />)}
        {chart.clean.map((item, index) => {
          const up = item.close >= item.open;
          const color = up ? colors.positive : colors.negative;
          const x = PAD_X + chart.xStep * index + chart.xStep / 2;
          const bodyWidth = Math.max(2, Math.min(7, chart.xStep * 0.58));
          const bodyY = Math.min(chart.y(item.open), chart.y(item.close));
          const bodyHeight = Math.max(1.5, Math.abs(chart.y(item.open) - chart.y(item.close)));
          return (
            <Path
              key={item.time}
              d={`M ${x} ${chart.y(item.high)} L ${x} ${chart.y(item.low)} M ${x - bodyWidth / 2} ${bodyY} L ${x + bodyWidth / 2} ${bodyY} L ${x + bodyWidth / 2} ${bodyY + bodyHeight} L ${x - bodyWidth / 2} ${bodyY + bodyHeight} Z`}
              fill={color}
              stroke={color}
              strokeWidth="1"
            />
          );
        })}
        {showVolume ? chart.clean.map((item, index) => {
          const color = item.close >= item.open ? colors.positive : colors.negative;
          const volumeHeight = (item.volume / chart.maxVolume) * (height - chart.priceHeight - 5);
          return <Rect fill={color} height={volumeHeight} key={`v-${item.time}`} opacity={0.18} width={Math.max(1, chart.xStep * 0.55)} x={PAD_X + chart.xStep * index + chart.xStep * 0.22} y={height - volumeHeight} />;
        }) : null}
      </Svg>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  frame: { overflow: 'hidden', width: '100%' },
  candleFrame: { backgroundColor: colors.chart, overflow: 'hidden', width: '100%' },
}));
