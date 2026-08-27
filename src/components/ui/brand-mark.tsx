import { Image, StyleSheet, View } from 'react-native';

interface BrandMarkProps {
  size?: number;
}

export function BrandMark({ size = 34 }: BrandMarkProps) {
  return (
    <View style={[styles.frame, { width: size, height: size }]}>
      <Image source={require('../../../assets/brand-mark.png')} resizeMode="contain" style={styles.image} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
});
