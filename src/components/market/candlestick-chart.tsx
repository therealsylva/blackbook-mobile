import { StyleSheet, View } from 'react-native';
import Svg, { G, Line, Rect } from 'react-native-svg';

import { colors } from '@/constants/theme';

const WIDTH = 320;

export function CandlestickChart({ points, height = 260 }: { points: readonly number[]; height?: number }) {
  const minimum = Math.min(...points) - 2;
  const maximum = Math.max(...points) + 2;
  const range = maximum - minimum || 1;
  const candleWidth = WIDTH / Math.max(points.length, 1);
  const y = (value: number) => height - ((value - minimum) / range) * (height - 24) - 12;

  return (
    <View accessibilityLabel="Advanced candlestick chart" style={[styles.container, { height }]}>
      <Svg height={height} preserveAspectRatio="none" viewBox={`0 0 ${WIDTH} ${height}`} width="100%">
        {[0.2, 0.4, 0.6, 0.8].map((ratio) => (
          <Line
            key={ratio}
            stroke={colors.lineDark}
            strokeWidth="1"
            x1="0"
            x2={WIDTH}
            y1={height * ratio}
            y2={height * ratio}
          />
        ))}
        {points.slice(1).map((close, index) => {
          const open = points[index] ?? close;
          const rising = close >= open;
          const color = rising ? colors.positive : colors.negative;
          const high = Math.max(open, close) + 1.8 + (index % 3) * 0.4;
          const low = Math.min(open, close) - 1.4 - (index % 2) * 0.5;
          const x = (index + 1) * candleWidth + candleWidth * 0.1;
          const bodyTop = y(Math.max(open, close));
          const bodyBottom = y(Math.min(open, close));

          return (
            <G key={`${close}-${index}`}>
              <Line
                stroke={color}
                strokeWidth="1.2"
                x1={x + candleWidth * 0.3}
                x2={x + candleWidth * 0.3}
                y1={y(high)}
                y2={y(low)}
              />
              <Rect
                fill={color}
                height={Math.max(bodyBottom - bodyTop, 3)}
                width={Math.max(candleWidth * 0.6, 4)}
                x={x}
                y={bodyTop}
              />
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.ink,
    width: '100%',
  },
});
