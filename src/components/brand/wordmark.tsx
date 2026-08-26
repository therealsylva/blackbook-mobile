import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';

export function Wordmark({ inverse = false }: { inverse?: boolean }) {
  const color = inverse ? colors.textOnDark : colors.ink;

  return (
    <View accessibilityLabel="Blackbook" style={styles.row}>
      <View style={[styles.mark, { borderColor: color }]}>
        <View style={[styles.markBar, { backgroundColor: color }]} />
        <View style={[styles.markBar, styles.markBarShort, { backgroundColor: color }]} />
      </View>
      <Text style={[styles.wordmark, { color }]}>BLACKBOOK</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  mark: {
    borderWidth: 2,
    height: 24,
    justifyContent: 'center',
    paddingHorizontal: 4,
    transform: [{ skewX: '-7deg' }],
    width: 21,
  },
  markBar: {
    height: 2,
    width: 10,
  },
  markBarShort: {
    marginTop: 4,
    width: 7,
  },
  wordmark: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.6,
  },
});
