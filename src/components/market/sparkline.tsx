import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { colors } from '@/constants/theme';

interface SparklineProps {
  color?: string;
  fillColor?: string;
  grid?: boolean;
  height?: number;
  points: readonly number[];
}

const VIEWBOX_WIDTH = 320;

function coordinates(points: readonly number[], height: number) {
  const minimum = Math.min(...points);
  const maximum = Math.max(...points);
  const range = maximum - minimum || 1;
  const horizontalStep = VIEWBOX_WIDTH / Math.max(points.length - 1, 1);

  return points.map((point, index) => ({
    x: index * horizontalStep,
    y: height - ((point - minimum) / range) * (height - 20) - 10,
  }));
}

export function Sparkline({
  color = colors.positive,
  fillColor = color,
  grid = false,
  height = 150,
  points,
}: SparklineProps) {
  const chartPoints = coordinates(points, height);
  const first = chartPoints[0];
  const last = chartPoints.at(-1);
  const linePath = chartPoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
  const areaPath = first && last ? `${linePath} L ${last.x} ${height} L ${first.x} ${height} Z` : '';

  return (
    <View accessibilityLabel="Index price chart" style={[styles.container, { height }]}>
      <Svg height={height} preserveAspectRatio="none" viewBox={`0 0 ${VIEWBOX_WIDTH} ${height}`} width="100%">
        {grid ? (
          <>
            <Line stroke={colors.lineDark} strokeWidth="1" x1="0" x2={VIEWBOX_WIDTH} y1={height * 0.25} y2={height * 0.25} />
            <Line stroke={colors.lineDark} strokeWidth="1" x1="0" x2={VIEWBOX_WIDTH} y1={height * 0.5} y2={height * 0.5} />
            <Line stroke={colors.lineDark} strokeWidth="1" x1="0" x2={VIEWBOX_WIDTH} y1={height * 0.75} y2={height * 0.75} />
          </>
        ) : null}
        <Path d={areaPath} fill={fillColor} fillOpacity={grid ? 0.06 : 0.09} />
        <Path d={linePath} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
        {last ? <Circle cx={last.x} cy={last.y} fill={color} r="5" /> : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    width: '100%',
  },
});
