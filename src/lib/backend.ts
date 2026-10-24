import 'react-native-url-polyfill/auto';
import {createClient, processLock} from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import {Platform} from 'react-native';
import {PublicRequestCache} from './public-request-cache';
import connection from './public-connection.json';

// Public client settings, never service-role credentials. Keep statically named
// Expo env reads so custom builds can override the checked-in public defaults.
const apiUrl=(process.env.EXPO_PUBLIC_BLACKBOOK_API_URL?.trim()||connection.apiUrl).replace(/\/$/,'');
const authUrl=process.env.EXPO_PUBLIC_SUPABASE_URL?.trim()||connection.authUrl;
const key=process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()||connection.publishableKey;
export const configured=Boolean(authUrl&&key);
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
const authFetch:typeof fetch=async(input,init)=>{
 const controller=new AbortController(),abort=()=>controller.abort(),timer=setTimeout(abort,20000);
 init?.signal?.addEventListener('abort',abort,{once:true});
 if(init?.signal?.aborted)abort();
 try{return await fetch(input,{...init,signal:controller.signal});}
 finally{clearTimeout(timer);init?.signal?.removeEventListener('abort',abort);}
};
export const supabase=configured?createClient(authUrl,key,{global:{fetch:authFetch},auth:{storage,autoRefreshToken:true,persistSession:true,detectSessionInUrl:false,flowType:'pkce',lock:processLock}}):null;

async function request<T>(path:string,body:unknown,method:string,token?:string):Promise<T>{
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
 try{
  const response=await fetch(`${apiUrl}${path}`,{method,signal:controller.signal,headers:{...(token?{authorization:`Bearer ${token}`} : {}),'content-type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const result=await response.json();
  if(!response.ok)throw Object.assign(new Error(typeof result.error==='string'?result.error.replace(/_/g,' '):'BlackBook is unavailable. Please try again.'),{status:response.status});
  return result as T;
 }catch(error){if(controller.signal.aborted)throw new Error('The connection timed out. Please try again.');throw error;}finally{clearTimeout(timer);}
}
/** Account requests must always use api(), including while browsing as a guest. */
const publicReads=new PublicRequestCache();
export function publicApi<T=Record<string,unknown>>(path:string,{fresh=false}:{fresh?:boolean}={}):Promise<T>{
 if(!/^\/v1\/(?:markets(?:\?|\/|$)|indices(?:\?|\/|$))/.test(path))throw new Error('This endpoint requires sign-in.');
 const ttl=path.includes('/snapshot')?750:path.includes('/candles')||path.includes('/history')?30000:path.startsWith('/v1/indices')?30000:2000;
 return publicReads.get(path,ttl,()=>request<T>(path,undefined,'GET'),fresh);
}
export async function api<T=Record<string,unknown>>(path:string,body?:unknown,method=body===undefined?'GET':'POST'):Promise<T>{
 if(!supabase)throw new Error('BlackBook connection is not configured.');
 const {data,error}=await supabase.auth.getSession();if(error)throw error;
 if(!data.session)throw new Error('Sign in to continue.');
 return request<T>(path,body,method,data.session.access_token);
}
export const uuid=()=>Crypto.randomUUID();

