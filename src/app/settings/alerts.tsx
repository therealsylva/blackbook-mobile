import {useState} from 'react';
import {Alert,Pressable,ScrollView,Text,TextInput,View} from 'react-native';
import {ChoiceSheet} from '@/components/ui/choice-sheet';
import {Screen} from '@/components/ui/screen';
import {TopBar} from '@/components/ui/top-bar';
import {useExchange} from '@/context/exchange-context';
import {uuid} from '@/lib/backend';
import {useTheme} from '@/theme/theme-context';
export default function AlertsScreen(){
 const {settings,updateSetting,markets,pairMarkets}=useExchange(),{colors}=useTheme();const [symbol,setSymbol]=useState(markets[0]?.symbol || 'RMD'),[direction,setDirection]=useState<'above'|'below'>('above'),[price,setPrice]=useState(''),[selecting,setSelecting]=useState(false);
 const add=()=>{const target=Number(price);if(!(target>0)||!Number.isFinite(target)){Alert.alert('Invalid price','Enter a positive target price.');return;}updateSetting('priceAlertRules',[...settings.priceAlertRules,{id:uuid(),symbol,direction,price:target,fired:false}]);setPrice('');};
 const button={padding:14,borderRadius:8,backgroundColor:colors.control,marginBottom:12};
 return <Screen><TopBar back title="Price alerts"/><ScrollView contentContainerStyle={{padding:20}} keyboardShouldPersistTaps="handled"><Text style={{color:colors.textMuted,marginBottom:20}}>Price alerts notify you while BlackBook is open.</Text><Pressable style={button} onPress={()=>setSelecting(true)}><Text style={{color:colors.text}}>Index · {symbol}</Text></Pressable><Pressable style={button} onPress={()=>setDirection(direction==='above'?'below':'above')}><Text style={{color:colors.text}}>{direction==='above'?'At or above':'At or below'}</Text></Pressable><TextInput accessibilityLabel="Target price" placeholder="Target price" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" value={price} onChangeText={setPrice} style={{...button,color:colors.text}}/><Pressable style={button} onPress={add}><Text style={{color:colors.text}}>Create alert</Text></Pressable>{settings.priceAlertRules.map(rule=><View key={rule.id} style={{paddingVertical:16,borderBottomWidth:1,borderBottomColor:colors.divider}}><Text style={{color:colors.text}}>{rule.symbol} {rule.direction==='above'?'≥':'≤'} {rule.price}</Text><Text style={{color:colors.textMuted,marginVertical:8}}>{rule.fired?'Triggered':'Watching'}</Text><Pressable accessibilityLabel={'Remove alert for '+rule.symbol} onPress={()=>updateSetting('priceAlertRules',settings.priceAlertRules.filter(item=>item.id!==rule.id))}><Text style={{color:colors.negative}}>Remove</Text></Pressable></View>)}</ScrollView><ChoiceSheet onClose={()=>setSelecting(false)} onSelect={setSymbol} options={[...markets,...pairMarkets].map(m=>m.symbol)} title="Index" value={symbol} visible={selecting}/></Screen>;
}
