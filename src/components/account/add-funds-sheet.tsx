import {useEffect,useRef,useState} from 'react';
import {Pressable,Text,TextInput,View} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useExchange} from '@/context/exchange-context';
import {useAuth} from '@/context/auth-context';
import {api,uuid} from '@/lib/backend';
import {formatMoney} from '@/lib/format';
import {useTheme} from '@/theme/theme-context';
import {BottomSheet,useSheetInputFocus} from '@/components/ui/bottom-sheet';
type Rail={blockchain:string;tokenId:string;symbol:string;withdrawalsEnabled:boolean};
type Attempt={fingerprint:string;body:Record<string,unknown>};
export function AddFundsSheet({visible,onClose,mode='deposit'}:{visible:boolean;onClose:()=>void;mode?:'deposit'|'withdraw'}){
 const {colors}=useTheme(),{accountMode,cashBalance,refresh}=useExchange(),{session}=useAuth();
 const owner=session?.user.id??'',storageKey=`blackbook.funding.${owner}.${mode}`;
 const [rails,setRails]=useState<Rail[]>([]),[selected,setSelected]=useState(0),[amount,setAmount]=useState(''),[address,setAddress]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[review,setReview]=useState(false),[result,setResult]=useState<Record<string,unknown>|null>(null);
 const attempt=useRef<Attempt|null>(null),generation=useRef(0),lock=useRef(false);
 useEffect(()=>{const token=++generation.current;attempt.current=null;setReview(false);setResult(null);setError('');setRails([]);setBusy(false);if(!visible||accountMode==='demo'||!owner)return;
  void Promise.all([api<{items:Rail[]}>('/v1/funding-options'),AsyncStorage.getItem(storageKey)]).then(([x,saved])=>{if(token!==generation.current)return;const choices=x.items.filter(r=>r.blockchain==='POLYGON'&&(mode==='deposit'||r.withdrawalsEnabled));if(!choices.length)throw new Error('Polygon funding is unavailable. Please retry.');setRails(choices);setSelected(0);if(saved){attempt.current=JSON.parse(saved);const body=attempt.current!.body;setSelected(Math.max(0,choices.findIndex(r=>r.blockchain===body.blockchain&&(mode==='deposit'||r.tokenId===body.tokenId))));if(mode==='withdraw'){setAmount(String(Number(body.amountMinor)/100));setAddress(String(body.destinationAddress));}setError('A previous request is unresolved. Retry it with the same details.');}}).catch(e=>{if(token===generation.current)setError(e.message);});return()=>{generation.current++;};
 },[visible,accountMode,mode,owner,storageKey]);
 const submit=async()=>{
  const rail=rails[selected];if(!rail||lock.current||accountMode!=='real'||!owner)return;setError('');
  const token=generation.current;
  try{
   if(mode==='withdraw'&&(!/^\d+(?:\.\d{1,2})?$/.test(amount)||Number(amount)<=0||!address.trim()))throw new Error('Enter a positive amount with up to two decimals and a destination address.');
   const parts=amount.split('.'),minor=mode==='withdraw'?String(BigInt(parts[0]!)*100n+BigInt((parts[1]??'').padEnd(2,'0'))):'0';
   const details={blockchain:rail.blockchain,...(mode==='withdraw'?{tokenId:rail.tokenId,amountMinor:minor,destinationAddress:address.trim()}: {})},fingerprint=JSON.stringify(details);
   if(attempt.current&&attempt.current.fingerprint!==fingerprint)throw new Error('Restore the previous request details before retrying.');
   if(mode==='withdraw'&&!review){setReview(true);return;}
   lock.current=true;setBusy(true);const request=attempt.current??{fingerprint,body:{idempotencyKey:uuid(),...details}};attempt.current=request;
   await AsyncStorage.setItem(storageKey,JSON.stringify(request));if(token!==generation.current)return;
   const response=await api<Record<string,unknown>>(mode==='deposit'?'/v1/wallets':'/v1/withdrawals',request.body);
   if(mode==='deposit'&&!/^0x[0-9a-f]{40}$/i.test(String(response.address??'')))throw new Error('A Polygon address was not returned. Retry the request.');
   await AsyncStorage.removeItem(storageKey);if(token!==generation.current)return;attempt.current=null;setResult(response);setReview(false);await refresh();
  }catch(e){if(token!==generation.current)return;setError(e instanceof Error?e.message:'Funding unavailable');if(e instanceof Error&&'status'in e&&[400,403,409,422].includes(Number(e.status))){await AsyncStorage.removeItem(storageKey);attempt.current=null;}setReview(false);}finally{lock.current=false;if(token===generation.current)setBusy(false);}
 };
 useEffect(()=>{if(visible&&mode==='deposit'&&accountMode==='real'&&rails[selected]&&!result&&!error&&!lock.current)void submit();},[visible,mode,accountMode,rails,selected]);
 const muted={color:colors.textMuted,marginBottom:12},input={color:colors.text,backgroundColor:colors.control,borderRadius:10,padding:14,marginBottom:12};
 const change=()=>{setReview(false);setResult(null);};
 return <BottomSheet onClose={onClose} title={mode==='deposit'?'Deposit':'Withdraw'} visible={visible}>
  {accountMode==='demo'?<Text style={muted}>Demo uses practice funds. Switch to Live in your account to deposit or withdraw.</Text>:<>
   <Text style={muted}>Live account · {formatMoney(cashBalance)} available to trade</Text>
   <View style={{flexDirection:'row',gap:8,flexWrap:'wrap',marginBottom:12}}>{rails.map((r,i)=><Pressable accessibilityRole="button" accessibilityState={{selected:selected===i,disabled:busy}} key={r.blockchain+':'+r.tokenId} disabled={busy} onPress={()=>{setSelected(i);change();}} style={{padding:10,borderRadius:10,backgroundColor:selected===i?colors.surfaceRaised:colors.control}}><Text style={{color:colors.text}}>{r.symbol} · {r.blockchain}</Text></Pressable>)}</View>
   {mode==='withdraw'?<><Text style={muted}>Amount in USD</Text><FundingInput editable={!busy} accessibilityLabel="Withdrawal amount" keyboardType="decimal-pad" value={amount} onChangeText={value=>{setAmount(value);change();}} style={input}/><Text style={muted}>Destination on {rails[selected]?.blockchain}</Text><FundingInput editable={!busy} accessibilityLabel="Destination address" autoCapitalize="none" value={address} onChangeText={value=>{setAddress(value);change();}} style={input}/></>:<Text style={muted}>Send only the selected token on the displayed network. Credit appears after the transfer is confirmed.</Text>}
   {review?<View accessibilityRole="summary"><Text style={{color:colors.text,marginBottom:12}}>Review withdrawal · {formatMoney(Number(amount))} · {rails[selected]?.symbol} on {rails[selected]?.blockchain}</Text><Text selectable style={muted}>{address.trim()}</Text><Text style={muted}>Submitting creates a withdrawal request. Payment history shows approval and transfer status. A network fee quote is not available here.</Text><Pressable accessibilityRole="button" onPress={()=>setReview(false)}><Text style={muted}>Back to details</Text></Pressable></View>:null}
   {result?<><Text style={{color:colors.text,marginBottom:12}}>{mode==='deposit'?'Polygon deposit address':'Status: '+String(result.state??'pending')}</Text>{result.address?<Text selectable style={{color:colors.text,marginBottom:12}}>{String(result.address)}</Text>:null}{result.address?<Pressable accessibilityRole="button" accessibilityLabel="Copy deposit address" onPress={()=>{void Clipboard.setStringAsync(String(result.address));}}><Text style={{color:colors.text,marginBottom:16}}>Copy address</Text></Pressable>:null}{mode==='withdraw'?<Text style={muted}>Request {String(result.id)}. Follow its progress in Payment history.</Text>:null}</>:null}
   {!rails.length&&!error?<Text style={muted}>Loading Polygon funding options…</Text>:null}
   {!!error&&<Text style={{...muted,color:colors.negative}} accessibilityRole="alert">{error}</Text>}
   {!result?<Pressable accessibilityRole="button" disabled={busy||!rails.length} onPress={()=>{void submit();}} style={{backgroundColor:colors.text,padding:14,borderRadius:12,alignItems:'center',opacity:busy?0.5:1}}><Text style={{color:colors.bg}}>{busy?'Submitting…':mode==='deposit'?'Get deposit address':review?'Confirm withdrawal request':'Review withdrawal'}</Text></Pressable>:null}
  </>}
 </BottomSheet>;
}


function FundingInput(props:React.ComponentProps<typeof TextInput>){const onFocus=useSheetInputFocus();return <TextInput {...props} onFocus={onFocus}/>;}
