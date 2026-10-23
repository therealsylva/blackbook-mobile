import {createContext,useContext,useEffect,useState,type PropsWithChildren} from 'react';
import {AppState} from 'react-native';
import {makeRedirectUri} from 'expo-auth-session';
import * as Linking from 'expo-linking';
import type {Session} from '@supabase/supabase-js';
import {supabase} from '@/lib/backend';
const redirect=makeRedirectUri({scheme:'blackbook',path:'auth/callback'});
const exchanges=new Map<string,Promise<void>>();
function client(){if(!supabase)throw new Error('Unable to connect to BlackBook. Please update the app.');return supabase;}
async function acceptCallback(url:string){
 const target=new URL(redirect),incoming=new URL(url);
 if(incoming.protocol!==target.protocol||incoming.host!==target.host||incoming.pathname!==target.pathname)return;
 const error=incoming.searchParams.get('error_description');if(error)throw new Error(error);
 const code=incoming.searchParams.get('code');if(!code)return;
 if(!exchanges.has(code)){
  const operation=(async()=>{const {error}=await client().auth.exchangeCodeForSession(code);if(error)throw error;})();
  exchanges.set(code,operation);void operation.catch(()=>exchanges.delete(code));
 }
 await exchanges.get(code);
}
export type AuthView='signin'|'signup';
type AuthValue={session:Session|null;loading:boolean;recovery:boolean;view:AuthView|null;callbackError:string|null;requestAuth:(view?:AuthView)=>void;dismissAuth:()=>void;signIn:(email:string,password:string)=>Promise<void>;signUp:(email:string,password:string)=>Promise<{confirmationRequired:boolean}>;recover:(email:string)=>Promise<void>;changePassword:(password:string)=>Promise<void>;signOut:()=>Promise<void>};
const Context=createContext<AuthValue|null>(null);
export function AuthProvider({children}:PropsWithChildren){
 const [session,setSession]=useState<Session|null>(null),[loading,setLoading]=useState(true),[recovery,setRecovery]=useState(false),[view,setView]=useState<AuthView|null>(null),[callbackError,setCallbackError]=useState<string|null>(null);
 useEffect(()=>{
  const authClient=supabase;if(!authClient){setLoading(false);return;}
  let alive=true;
  void authClient.auth.getSession().then(({data,error})=>{if(alive){setSession(data.session);if(error)setCallbackError(error.message);setLoading(false);}}).catch(()=>{if(alive)setLoading(false);});
  const {data}=authClient.auth.onAuthStateChange((event,next)=>{if(!alive)return;setSession(next);if(event==='PASSWORD_RECOVERY'){setRecovery(true);setView('signin');}else if(event==='SIGNED_IN')setView(null);if(event==='SIGNED_OUT')setRecovery(false);});
  const listener=AppState.addEventListener('change',state=>{if(state==='active')authClient.auth.startAutoRefresh();else authClient.auth.stopAutoRefresh();});
  authClient.auth.startAutoRefresh();
  const handle=(url:string)=>{void acceptCallback(url).catch(error=>{if(alive){setCallbackError(error instanceof Error?error.message:'The account link could not be opened. Please try again.');setView('signin');}});};
  const link=Linking.addEventListener('url',({url})=>handle(url));
  void Linking.getInitialURL().then(url=>{if(url)handle(url);}).catch(()=>{});
  return()=>{alive=false;data.subscription.unsubscribe();listener.remove();link.remove();authClient.auth.stopAutoRefresh();};
 },[]);
 const signIn=async(email:string,password:string)=>{const {error}=await client().auth.signInWithPassword({email,password});if(error)throw error;setView(null);};
 const signUp=async(email:string,password:string)=>{const {data,error}=await client().auth.signUp({email,password,options:{emailRedirectTo:redirect}});if(error)throw error;if(data.session)setView(null);return {confirmationRequired:!data.session};};
 const recover=async(email:string)=>{const {error}=await client().auth.resetPasswordForEmail(email,{redirectTo:redirect});if(error)throw error;};
 const changePassword=async(password:string)=>{const {error}=await client().auth.updateUser({password});if(error)throw error;setRecovery(false);setView(null);};
 const signOut=async()=>{const {error}=await client().auth.signOut();if(error)throw error;setRecovery(false);setView(null);};
 return <Context.Provider value={{session,loading,recovery,view,callbackError,requestAuth:(next='signin')=>{setCallbackError(null);setView(next);},dismissAuth:()=>{setView(null);setCallbackError(null);if(recovery){setRecovery(false);void signOut().catch(()=>{});}},signIn,signUp,recover,changePassword,signOut}}>{children}</Context.Provider>;
}
export function useAuth(){const auth=useContext(Context);if(!auth)throw new Error('Auth provider required');return auth;}
