import {useEffect,useState} from 'react';
import {Pressable,Text,View} from 'react-native';
import {BottomSheet} from '@/components/ui/bottom-sheet';
import {useTheme} from '@/theme/theme-context';
import {useAuth} from '@/context/auth-context';
import {api} from '@/lib/backend';
import {formatMoney,formatTimestamp} from '@/lib/format';
type Payment={id:string;state:string;type:string;amountMinor:string;currency:string;blockchain:string;txHash?:string;createdAt?:string};
export function PaymentHistorySheet({visible,onClose}:{visible:boolean;onClose:()=>void}){
 const {colors}=useTheme(),{session}=useAuth();const [items,setItems]=useState<Payment[]>([]),[error,setError]=useState(''),[revision,setRevision]=useState(0);
 useEffect(()=>{let alive=true;setItems([]);setError('');if(!visible)return;void(async()=>{const rows:Payment[]=[];let cursor:string|null=null;do{const page:{items:Payment[];nextCursor:string|null}=await api('/v1/payments'+(cursor?'?cursor='+encodeURIComponent(cursor):''));rows.push(...page.items);cursor=page.nextCursor;}while(cursor&&alive);if(alive)setItems(rows);})().catch(e=>{if(alive)setError(e.message);});return()=>{alive=false;};},[visible,session?.user.id,revision]);
 return <BottomSheet title="Payment history" visible={visible} onClose={onClose}><Pressable accessibilityRole="button" onPress={()=>setRevision(n=>n+1)}><Text style={{color:colors.text,marginBottom:16}}>Refresh</Text></Pressable>{error?<Text accessibilityRole="alert" style={{color:colors.negative}}>{error}</Text>:!items.length?<Text style={{color:colors.textMuted}}>No payments to display.</Text>:items.map(p=><View key={p.id} style={{paddingVertical:16,borderBottomWidth:1,borderBottomColor:colors.divider}}><Text style={{color:colors.text}}>{p.type} · {formatMoney(Number(p.amountMinor)/100,p.currency || 'USD')}</Text><Text style={{color:colors.textMuted,marginVertical:8}}>{p.state} · {p.blockchain}{p.createdAt?' · '+formatTimestamp(Date.parse(p.createdAt)):''}</Text><Text selectable style={{color:colors.textMuted}}>{p.txHash || p.id}</Text></View>)}</BottomSheet>;
}
