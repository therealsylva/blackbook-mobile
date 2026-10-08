import {createContext,useContext,useEffect,useState,type PropsWithChildren} from 'react';
import {AppState} from 'react-native';
import {makeRedirectUri} from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import type {Session} from '@supabase/supabase-js';
import {supabase} from '@/lib/backend';
WebBrowser.maybeCompleteAuthSession();
const redirect=makeRedirectUri({scheme:'blackbook',path:'auth/callback'});
const exchanges=new Map<string,Promise<void>>();
async function acceptCallback(url:string){
 if(!url.startsWith(redirect))return;
 const code=new URL(url).searchParams.get('code');if(!code)return;
 if(!exchanges.has(code))exchanges.set(code,(async()=>{const {error}=await client().auth.exchangeCodeForSession(code);if(error)throw error;})());
 await exchanges.get(code);
}
type AuthValue={session:Session|null;loading:boolean;recovery:boolean;signIn:(email:string,password:string)=>Promise<void>;signUp:(email:string,password:string)=>Promise<void>;google:()=>Promise<void>;recover:(email:string)=>Promise<void>;changePassword:(password:string)=>Promise<void>;signOut:()=>Promise<void>};
const Context=createContext<AuthValue|null>(null);
function client(){if(!supabase)throw new Error('BlackBook connection is not configured.');return supabase;}
export function AuthProvider({children}:PropsWithChildren){
 const [session,setSession]=useState<Session|null>(null),[loading,setLoading]=useState(true),[recovery,setRecovery]=useState(false);
 useEffect(()=>{
  const authClient=supabase;if(!authClient){setLoading(false);return;}
  let alive=true;
  void authClient.auth.getSession().then(({data})=>{if(alive){setSession(data.session);setLoading(false);}}).catch(()=>{if(alive)setLoading(false);});
  const {data}=authClient.auth.onAuthStateChange((event,next)=>{setSession(next);if(event==='PASSWORD_RECOVERY')setRecovery(true);if(event==='SIGNED_OUT')setRecovery(false);});
  const listener=AppState.addEventListener('change',state=>{if(state==='active')authClient.auth.startAutoRefresh();else authClient.auth.stopAutoRefresh();});
  authClient.auth.startAutoRefresh();
  const link=Linking.addEventListener('url',({url})=>{void acceptCallback(url).catch(()=>{});});
  void Linking.getInitialURL().then(url=>url?acceptCallback(url):undefined).catch(()=>{});
  return()=>{alive=false;data.subscription.unsubscribe();listener.remove();link.remove();authClient.auth.stopAutoRefresh();};
 },[]);
 const signIn=async(email:string,password:string)=>{const {error}=await client().auth.signInWithPassword({email,password});if(error)throw error;};
 const signUp=async(email:string,password:string)=>{const {error}=await client().auth.signUp({email,password,options:{emailRedirectTo:redirect}});if(error)throw error;};
 const google=async()=>{
  const {data,error}=await client().auth.signInWithOAuth({provider:'google',options:{redirectTo:redirect,skipBrowserRedirect:true}});if(error)throw error;
  const result=await WebBrowser.openAuthSessionAsync(data.url,redirect);
  if(result.type==='success')await acceptCallback(result.url);
 };
 const recover=async(email:string)=>{const {error}=await client().auth.resetPasswordForEmail(email,{redirectTo:redirect});if(error)throw error;};
 const changePassword=async(password:string)=>{const {error}=await client().auth.updateUser({password});if(error)throw error;setRecovery(false);};
 const signOut=async()=>{const {error}=await client().auth.signOut();if(error)throw error;setRecovery(false);};
 return <Context.Provider value={{session,loading,recovery,signIn,signUp,google,recover,changePassword,signOut}}>{children}</Context.Provider>;
}
export function useAuth(){const auth=useContext(Context);if(!auth)throw new Error('Auth provider required');return auth;}
