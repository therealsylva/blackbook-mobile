import {useNotification} from '@/context/notification-context';
import {useEffect,useRef} from 'react';
import {AppState} from 'react-native';
import type {ExchangeSettings,TradeRecord} from '@/types/exchange';
import type {MarketDefinition} from '@/data/markets';
export function useTradingNotifications({scope,settings,history,markets,enabled,updateSetting}:{scope:string;settings:ExchangeSettings;history:TradeRecord[];markets:MarketDefinition[];enabled:boolean;updateSetting:<K extends keyof ExchangeSettings>(key:K,value:ExchangeSettings[K])=>void}){
 const notify=useNotification();
 const observed=useRef<{scope:string;fills:Set<string>;alerts:Set<string>}|null>(null);
 useEffect(()=>{
  if(!enabled||AppState.currentState!=='active')return;
  const current=observed.current;
  if(!current||current.scope!==scope){observed.current={scope,fills:new Set(history.map(item=>item.id)),alerts:new Set()};return;}
  const fresh=history.filter(item=>!current.fills.has(item.id));current.fills=new Set(history.map(item=>item.id));
  if(settings.orderNotifications&&fresh.length)notify({title:'Order filled',message:`${fresh.length} new fill${fresh.length===1?'':'s'} in your account.`,tone:'success'});
  if(!settings.priceAlerts)return;
  const triggered=settings.priceAlertRules.filter(rule=>{if(rule.fired||current.alerts.has(rule.id))return false;const price=markets.find(m=>m.symbol===rule.symbol)?.price;return price!==undefined&&Number.isFinite(price)&&(rule.direction==='above'?price>=rule.price:price<=rule.price);});
  if(triggered.length){for(const rule of triggered)current.alerts.add(rule.id);updateSetting('priceAlertRules',settings.priceAlertRules.map(rule=>triggered.some(item=>item.id===rule.id)?{...rule,fired:true}:rule));notify({title:'Price alert',message:triggered.map(rule=>`${rule.symbol} ${rule.direction==='above'?'≥':'≤'} ${rule.price}`).join('\n')});}
 },[scope,settings,history,markets,enabled,updateSetting,notify]);
}
