import {useEffect, useState} from 'react';
import {Pressable, Text, TextInput, View} from 'react-native';
import {useTheme} from '@/theme/theme-context';
import {radii,typography} from '@/theme/tokens';

export function LeverageControl({value, max = 30, onChange, onFocus}: {value: number; max?: number; onChange: (value: number) => void; onFocus?: () => void}) {
  const {colors} = useTheme();
  const limit = Math.max(1, Math.min(30, Math.floor(max)));
  const current = Math.min(limit, Math.max(1, Math.round(value)));
  const [text, setText] = useState(String(current));
  useEffect(() => setText(String(current)), [current]);
  const commit = () => {const next = Math.min(limit, Math.max(1, Math.round(Number(text) || 1))); setText(String(next)); onChange(next);};
  const button = (label: string, delta: number) => <Pressable accessibilityRole="button" accessibilityLabel={delta < 0 ? 'Decrease leverage' : 'Increase leverage'} disabled={delta < 0 ? current <= 1 : current >= limit} onPress={() => {const next=current+delta;setText(String(next));onChange(next);}} style={{width:44,height:44,alignItems:'center',justifyContent:'center',opacity:(delta<0?current<=1:current>=limit)?0.35:1}}><Text style={{color:colors.text,fontSize:22}}>{label}</Text></Pressable>;
  return <View style={{gap:6}}>
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12}}>
      <Text style={{color:colors.textMuted,fontFamily:typography.medium,fontSize:11,flex:1,minWidth:0}}>Leverage</Text>
      <View style={{flexDirection:'row',alignItems:'center',flexShrink:0,backgroundColor:colors.control,borderRadius:radii.md}}>
        {button('−',-1)}
        <TextInput accessibilityLabel="Leverage" accessibilityHint={`Enter a whole number from 1 to ${limit}`} keyboardType="number-pad" selectTextOnFocus onFocus={onFocus} value={text} onChangeText={next=>{const clean=next.replace(/[^0-9]/g,'').slice(0,2);setText(clean);const n=Number(clean);if(clean&&n>=1&&n<=limit)onChange(n);}} onBlur={commit} onSubmitEditing={commit} style={{width:44,minWidth:0,height:44,textAlign:'center',color:colors.text,fontFamily:typography.monoSemibold,fontSize:15,padding:0}}/>
        <Text style={{color:colors.textMuted}}>×</Text>{button('+',1)}
      </View>
    </View>
    <Text style={{color:colors.textMuted,fontFamily:typography.family,fontSize:11,textAlign:'right'}}>1–{limit}×</Text>
  </View>;
}
