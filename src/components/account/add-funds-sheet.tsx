import {useEffect,useRef,useState} from 'react';
import {Pressable,Text,TextInput,View} from 'react-native';
import {useExchange} from '@/context/exchange-context';
import {api,uuid} from '@/lib/backend';
import {spacing} from '@/theme/tokens';
import {useTheme} from '@/theme/theme-context';
import {BottomSheet} from '@/components/ui/bottom-sheet';
type Rail={blockchain:string;tokenId:string;symbol:string;withdrawalsEnabled:boolean};
export function AddFundsSheet({visible,onClose,mode='deposit'}:{visible:boolean;onClose:()=>void;mode?:'deposit'|'withdraw'}){
 const {colors}=useTheme(),{accountMode,refresh}=useExchange();
 const [rails,setRails]=useState<Rail[]>([]),[selected,setSelected]=useState(0),[amount,setAmount]=useState(''),[address,setAddress]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[result,setResult]=useState<Record<string,unknown>|null>(null);
 const attempt=useRef<{key:string;fingerprint:string}|null>(null);
 useEffect(()=>{if(!visible)return;let alive=true;setResult(null);setError('');if(accountMode==='demo')return;
  void api<{items:Rail[]}>('/v1/funding-options').then(x=>{if(alive){setRails(x.items.filter(r=>mode==='deposit'||r.withdrawalsEnabled));setSelected(0);}}).catch(e=>{if(alive)setError(e.message);});return()=>{alive=false;};
 },[visible,accountMode,mode]);
 const submit=async()=>{
  const rail=rails[selected];if(!rail||busy)return;setError('');setBusy(true);
  try{
   if(mode==='withdraw'&&(!/^\d+(?:\.\d{1,2})?$/.test(amount)||Number(amount)<=0||!address.trim()))throw new Error('Enter an amount with up to two decimals and a destination address.');
   const parts=amount.split('.'),minor=parts[0]?String(BigInt(parts[0])*100n+BigInt((parts[1]??'').padEnd(2,'0'))):'0';
   const fingerprint=JSON.stringify({mode,rail,amount,address});
   if(attempt.current&&attempt.current.fingerprint!==fingerprint)throw new Error('Retry the previous request before changing its details.');
   const key=attempt.current?.key??uuid();attempt.current={key,fingerprint};
   const response=await api<Record<string,unknown>>(mode==='deposit'?'/v1/wallets':'/v1/withdrawals',{idempotencyKey:key,blockchain:rail.blockchain,...(mode==='withdraw'?{tokenId:rail.tokenId,amountMinor:minor,destinationAddress:address.trim()}: {})});
   setResult(response);attempt.current=null;await refresh();
  }catch(e){setError(e instanceof Error?e.message:'Funding unavailable');if(e instanceof Error&&'status'in e&&Number(e.status)<500)attempt.current=null;}finally{setBusy(false);}
 };
 const text={color:colors.text,marginBottom:12},muted={color:colors.textMuted,marginBottom:12},input={color:colors.text,backgroundColor:colors.control,borderRadius:10,padding:14,marginBottom:12};
 return <BottomSheet onClose={onClose} title={mode==='deposit'?'Deposit':'Withdraw'} visible={visible}>
  {accountMode==='demo'?<Text style={muted}>Demo starts with $10,000 in practice funds. Switch to Real money in Settings to deposit or withdraw.</Text>:<>
   <View style={{flexDirection:'row',gap:8,flexWrap:'wrap',marginBottom:12}}>{rails.map((r,i)=><Pressable key={r.blockchain+':'+r.tokenId} disabled={busy} onPress={()=>setSelected(i)} style={{padding:10,borderRadius:10,backgroundColor:selected===i?colors.surfaceRaised:colors.control}}><Text style={{color:colors.text}}>{r.symbol} · {r.blockchain}</Text></Pressable>)}</View>
   {mode==='withdraw'?<><Text style={muted}>Amount in USD</Text><TextInput accessibilityLabel="Withdrawal amount" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} style={input}/><Text style={muted}>Destination on {rails[selected]?.blockchain}</Text><TextInput accessibilityLabel="Destination address" autoCapitalize="none" value={address} onChangeText={setAddress} style={input}/></>:<Text style={muted}>Request your deposit address, then send only the selected token on the displayed network. Credit appears after the transfer is confirmed.</Text>}
   {result?<><Text style={text}>Status: {String(result.state??'pending')}</Text>{result.address?<Text selectable style={text}>{String(result.address)}</Text>:null}{mode==='withdraw'?<Text style={muted}>Request {String(result.id)}. Follow its progress in payment history; a pending review is not a completed withdrawal.</Text>:null}</>:null}
   {!!error&&<Text style={{...muted,color:colors.negative}} accessibilityRole="alert">{error}</Text>}
   <Pressable disabled={busy||!rails.length} onPress={()=>{void submit();}} style={{backgroundColor:colors.text,padding:14,borderRadius:12,alignItems:'center',marginTop:spacing.sm,opacity:busy?0.5:1}}><Text style={{color:colors.bg}}>{busy?'Submitting…':mode==='deposit'?'Get deposit address':'Request withdrawal'}</Text></Pressable>
  </>}
 </BottomSheet>;
}
