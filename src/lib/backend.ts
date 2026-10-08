import 'react-native-url-polyfill/auto';
import {createClient, processLock} from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import {Platform} from 'react-native';

const apiUrl=(process.env.EXPO_PUBLIC_BLACKBOOK_API_URL??'').replace(/\/$/,'');
const authUrl=process.env.EXPO_PUBLIC_SUPABASE_URL??'';
const key=process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY??'';
export const configured=Boolean(apiUrl&&authUrl&&key);
let writes=Promise.resolve();
const storage={
 async getItem(name:string){
  if(Platform.OS==='web')return globalThis.localStorage?.getItem(name)??null;
  const raw=await SecureStore.getItemAsync(name);if(!raw)return null;
  const meta=JSON.parse(raw) as {id:string;count:number};
  const chunks=await Promise.all(Array.from({length:meta.count},(_,i)=>SecureStore.getItemAsync(`${name}.${meta.id}.${i}`)));
  return chunks.some(x=>x===null)?null:chunks.join('');
 },
 async setItem(name:string,value:string){
  if(Platform.OS==='web'){globalThis.localStorage?.setItem(name,value);return;}
  const operation=async()=>{
   const previous=await SecureStore.getItemAsync(name),id=Crypto.randomUUID();
   const chars=Array.from(value),chunks:string[]=[];for(let i=0;i<chars.length;i+=400)chunks.push(chars.slice(i,i+400).join(''));
   for(let i=0;i<chunks.length;i++)await SecureStore.setItemAsync(`${name}.${id}.${i}`,chunks[i]!,{keychainAccessible:SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY});
   await SecureStore.setItemAsync(name,JSON.stringify({id,count:chunks.length}),{keychainAccessible:SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY});
   if(previous){const old=JSON.parse(previous) as {id:string;count:number};await Promise.all(Array.from({length:old.count},(_,i)=>SecureStore.deleteItemAsync(`${name}.${old.id}.${i}`)));}
  };
  const pending=writes.then(operation);writes=pending.catch(()=>{});await pending;
 },
 async removeItem(name:string){
  if(Platform.OS==='web'){globalThis.localStorage?.removeItem(name);return;}
  const pending=writes.then(async()=>{const raw=await SecureStore.getItemAsync(name);await SecureStore.deleteItemAsync(name);if(raw){const meta=JSON.parse(raw) as {id:string;count:number};await Promise.all(Array.from({length:meta.count},(_,i)=>SecureStore.deleteItemAsync(`${name}.${meta.id}.${i}`)));}});
  writes=pending.catch(()=>{});await pending;
 },
};
export const supabase=configured?createClient(authUrl,key,{auth:{storage,autoRefreshToken:true,persistSession:true,detectSessionInUrl:false,flowType:'pkce',lock:processLock}}):null;

export async function api<T=Record<string,unknown>>(path:string,body?:unknown,method=body===undefined?'GET':'POST'):Promise<T>{
 if(!supabase)throw new Error('BlackBook connection is not configured.');
 const {data,error}=await supabase.auth.getSession();if(error)throw error;
 if(!data.session)throw new Error('Sign in to continue.');
 const response=await fetch(`${apiUrl}${path}`,{method,headers:{authorization:`Bearer ${data.session.access_token}`,'content-type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
 const result=await response.json();if(!response.ok)throw Object.assign(new Error(typeof result.error==='string'?result.error.replace(/_/g,' '):'BlackBook is unavailable. Please try again.'),{status:response.status});return result as T;
}
export const uuid=()=>Crypto.randomUUID();
