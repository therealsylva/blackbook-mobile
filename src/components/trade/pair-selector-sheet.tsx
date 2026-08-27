import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useExchange } from '@/context/exchange-context';
import { formatPercent, formatPrice } from '@/lib/format';
import { colors, typography } from '@/theme/tokens';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Icon } from '@/components/ui/icon';
import { MarketAvatar } from '@/components/market/market-avatar';

interface PairSelectorSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (symbol: string) => void;
}

export function PairSelectorSheet({ visible, onClose, onSelect }: PairSelectorSheetProps) {
  const { markets, priceFor, changeFor } = useExchange();
  const [query, setQuery] = useState('');
  const matches = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    return markets.filter((market) => !normalized || market.symbol.toLowerCase().includes(normalized) || market.name.toLowerCase().includes(normalized));
  }, [markets, query]);
  return (
    <BottomSheet onClose={onClose} scroll={false} title="Select market" visible={visible}>
      <View style={styles.search}>
        <Icon color={colors.textMuted} name="search" size={17} />
        <TextInput autoCapitalize="none" autoCorrect={false} onChangeText={setQuery} placeholder="Search indices" placeholderTextColor={colors.textFaint} selectionColor={colors.accent} style={styles.input} value={query} />
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={styles.list}>
        {matches.map((market) => {
          const change = changeFor(market.symbol);
          return (
            <Pressable key={market.symbol} onPress={() => { onSelect(market.symbol); onClose(); }} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
              <MarketAvatar assetKey={market.assetKey} size={34} symbol={market.symbol} />
              <View style={styles.copy}><Text style={styles.symbol}>{market.symbol}/POINT</Text><Text numberOfLines={1} style={styles.name}>{market.name}</Text></View>
              <View style={styles.quote}><Text style={styles.price}>{formatPrice(priceFor(market.symbol))}</Text><Text style={[styles.change, { color: change >= 0 ? colors.positive : colors.negative }]}>{formatPercent(change)}</Text></View>
            </Pressable>
          );
        })}
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  search: { alignItems: 'center', backgroundColor: colors.bg, borderRadius: 10, flexDirection: 'row', gap: 8, height: 44, paddingHorizontal: 12 },
  input: { color: colors.text, flex: 1, fontFamily: typography.regular, fontSize: 13, paddingVertical: 0 },
  list: { marginTop: 10 },
  row: { alignItems: 'center', flexDirection: 'row', minHeight: 62 },
  copy: { flex: 1, marginLeft: 10 },
  symbol: { color: colors.text, fontFamily: typography.semibold, fontSize: 13 },
  name: { color: colors.textMuted, fontFamily: typography.regular, fontSize: 10, marginTop: 3 },
  quote: { alignItems: 'flex-end' },
  price: { color: colors.text, fontFamily: typography.medium, fontSize: 12, fontVariant: ['tabular-nums'] },
  change: { fontFamily: typography.medium, fontSize: 10, fontVariant: ['tabular-nums'], marginTop: 4 },
  pressed: { opacity: 0.62 },
});
