import {executionLabel,marketExecutionOptions,type MarketExecution} from '@/lib/market-execution';
import {LeverageControl} from '@/components/ui/leverage-control';
import {useKeyboardScroll} from '@/hooks/use-keyboard-scroll';
import {useEffect,useState} from 'react';
import {Alert,KeyboardAvoidingView,Platform,Pressable,ScrollView,Text,TextInput,View} from 'react-native';
import {useRouter} from 'expo-router';
import {ChoiceSheet} from '@/components/ui/choice-sheet';
import {Screen} from '@/components/ui/screen';
import {SettingRow} from '@/components/ui/setting-row';
import {SettingsSection} from '@/components/ui/settings-section';
import {TopBar} from '@/components/ui/top-bar';
import {useExchange} from '@/context/exchange-context';
import {useTheme} from '@/theme/theme-context';
import {spacing} from '@/theme/tokens';
import type {ExchangeSettings} from '@/types/exchange';

const choices={appearance:['Dark','Light','System'],locale:['en-GB','en-US','de-DE','fr-FR'],timeZone:['UTC','Africa/Lagos','Europe/London','America/New_York','Asia/Dubai','Asia/Singapore'],chartType:['candles','line','bar'],candleInterval:['1m','5m','15m','1h','4h','1d','1w'],bandDisplay:['Index','Percentage'],interfaceMode:['basic','advanced'],defaultOrderType:['market','limit','stop'],defaultLeverage:[1,2,5,10,20,25,50],defaultTimeInForce:['GTC','IOC','FOK'],defaultMarketExecution:marketExecutionOptions,refreshRate:['Live','Every 5 seconds','Every 15 seconds']} as const;
type Choice=keyof typeof choices;
type NumericKey='defaultMargin'|'stopLossPercent'|'takeProfitPercent'|'maxPositionUsd'|'dailyLossUsd'|'balanceWarningPercent';
export default function TradingSettingsScreen(){
 const {settings,updateSetting,positions,orders,closePosition,cancelOrder}=useExchange(),{colors}=useTheme(),router=useRouter();
 const {scroll,scrollFocused}=useKeyboardScroll();
 const [choice,setChoice]=useState<Choice|null>(null),[closing,setClosing]=useState(false);
 const select=(key:Choice,label:string)=><SettingRow icon="sliders" key={key} label={label} onPress={()=>setChoice(key)} value={key==='defaultMarketExecution'?executionLabel(settings.defaultMarketExecution):String(settings[key])}/>;
 const toggle=(key:'confirmOrders'|'oneClickTrading'|'marginWarnings'|'orderNotifications'|'priceAlerts',label:string)=><SettingRow icon="check" key={key} label={label} onToggle={value=>updateSetting(key,value)} toggle={settings[key]}/>;
 const number=(key:NumericKey,label:string)=> <NumericSetting key={key} label={label} value={settings[key]} onFocus={scrollFocused} onSave={value=>{if(value<0||value>1e9||key==='defaultMargin'&&value<1||key==='stopLossPercent'&&value>100||key==='balanceWarningPercent'&&(value<1||value>100)){Alert.alert('Invalid value','Enter a value within the supported range.');return;}updateSetting(key,value);}}/>;
 const closeAll=()=>Alert.alert('Close all positions?','Cancel open orders and submit a close for each position in this account.',[{text:'Cancel',style:'cancel'},{text:'Close all',style:'destructive',onPress:()=>{void(async()=>{setClosing(true);try{for(const order of orders)await cancelOrder(order.id);for(const position of positions)await closePosition(position.id);Alert.alert('Close requests submitted','Check Portfolio for any remaining exposure.');}catch(error){Alert.alert('Some actions remain pending',error instanceof Error?error.message:'Refresh Portfolio before retrying.');}finally{setClosing(false);}})();}}]);
 const choose=(value:string|number)=>{if(!choice)return;updateSetting(choice,value as never);};
 return <Screen edges={['top','bottom']}><TopBar back title="Settings"/><KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={{flex:1}}><ScrollView ref={scroll} automaticallyAdjustKeyboardInsets contentContainerStyle={{paddingBottom:spacing.xl}} keyboardShouldPersistTaps="handled">
 <SettingsSection title="Appearance & time">{select('appearance','Theme')}{select('locale','Number & date format')}{select('timeZone','Time zone')}</SettingsSection>
 <SettingsSection title="Chart & display">{select('chartType','Chart type')}{select('candleInterval','Default candle interval')}{select('bandDisplay','Band display')}{select('interfaceMode','Trading interface')}{select('refreshRate','Market refresh')}</SettingsSection>
 <SettingsSection title="Order defaults">{select('defaultOrderType','Default order type')}{number('defaultMargin','Default margin · USD')}<View style={{paddingVertical:16}}><LeverageControl value={settings.defaultLeverage} max={30} onFocus={scrollFocused} onChange={value=>updateSetting('defaultLeverage',value)}/></View>{select('defaultMarketExecution','Default market execution')}{select('defaultTimeInForce','Limit order duration')}{toggle('confirmOrders','Review before submit')}{toggle('oneClickTrading','One-click trading')}<Text style={{color:colors.textMuted,lineHeight:20,paddingVertical:10}}>Your market execution default applies in Basic and Advanced trading. Keeping the remainder open requires a price limit. Stop entries remain active until triggered or cancelled.</Text></SettingsSection>
 <SettingsSection title="Risk">{number('maxPositionUsd','Max position exposure · USD')}{number('dailyLossUsd','Daily realized loss limit · USD')}{toggle('marginWarnings','Balance usage warnings')}{settings.marginWarnings?number('balanceWarningPercent','Warn above balance usage · %'):null}{number('stopLossPercent','Default stop-loss · %')}{number('takeProfitPercent','Default take-profit · %')}<Text style={{color:colors.textMuted,lineHeight:20,paddingVertical:10}}>Set 0 to leave a limit or exit unset. Position limits include open entry orders at the upper band. Daily realized loss includes fees and resets at 00:00 UTC.</Text><Pressable disabled={closing} onPress={closeAll} style={{paddingVertical:16}}><Text style={{color:colors.negative}}>{closing?'Closing…':'Cancel orders & close all'}</Text></Pressable></SettingsSection>
 <SettingsSection title="Notifications">{toggle('orderNotifications','Order fill / cancel notifications')}{toggle('priceAlerts','Price alerts')}<SettingRow icon="alert" label="Manage price alerts" onPress={()=>router.push('/settings/alerts')}/></SettingsSection>
 </ScrollView></KeyboardAvoidingView>{choice?<ChoiceSheet onClose={()=>setChoice(null)} onSelect={choose} options={choices[choice] as readonly (string|number)[]} format={choice==='defaultMarketExecution'?(value)=>executionLabel(value as MarketExecution):undefined} title="Choose preference" value={settings[choice]} visible/>:null}</Screen>;
}
function NumericSetting({label,value,onSave,onFocus}:{label:string;value:number;onFocus:()=>void;onSave:(value:number)=>void}){
 const {colors}=useTheme();const [text,setText]=useState(String(value));useEffect(()=>setText(String(value)),[value]);
 return <View style={{flexDirection:'row',alignItems:'center',gap:12,paddingVertical:16,borderBottomWidth:1,borderBottomColor:colors.dividerSoft}}><Text style={{color:colors.text,flex:1}}>{label}</Text><TextInput onFocus={onFocus} accessibilityLabel={label} keyboardType="decimal-pad" value={text} onChangeText={setText} onEndEditing={()=>{const value=Number(text);if(Number.isFinite(value)&&text.trim())onSave(value);else setText('0');}} style={{color:colors.text,backgroundColor:colors.control,padding:10,borderRadius:8,minWidth:84,maxWidth:120,textAlign:'right'}}/></View>;
}
