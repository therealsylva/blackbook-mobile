import {useState,type PropsWithChildren} from 'react';
import {ActivityIndicator,Alert,Pressable,Text,TextInput,View} from 'react-native';
import {Screen} from '@/components/ui/screen';
import {useAuth} from '@/context/auth-context';
import {useTheme} from '@/theme/theme-context';
import {configured} from '@/lib/backend';
export function AuthGate({children}:PropsWithChildren){
 const auth=useAuth(),{colors}=useTheme();const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false);
 const run=async(action:()=>Promise<void>)=>{if(busy)return;setBusy(true);try{await action();}catch(e){Alert.alert('Account',e instanceof Error?e.message:'Please try again.');}finally{setBusy(false);}};
 if(auth.loading)return <Screen><ActivityIndicator style={{flex:1}} color={colors.text}/></Screen>;
 if(auth.session&&!auth.recovery)return children;
 const button=(label:string,action:()=>Promise<void>)=><Pressable disabled={busy||!configured} onPress={()=>void run(action)} style={{padding:16,borderWidth:1,borderColor:colors.dividerSoft,borderRadius:10,marginTop:12}}><Text style={{color:colors.text,textAlign:'center'}}>{label}</Text></Pressable>;
 return <Screen><View style={{flex:1,justifyContent:'center',padding:24,gap:12}}><Text style={{fontSize:30,color:colors.text,fontWeight:'700'}}>BlackBook</Text><Text style={{color:colors.textMuted}}>{auth.recovery?'Choose a new password':configured?'Sign in to your trading account':'Connection configuration is needed before signing in.'}</Text>
 {!auth.recovery?<TextInput accessibilityLabel="Email" autoCapitalize="none" autoComplete="email" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={colors.textMuted} style={{padding:14,color:colors.text,borderWidth:1,borderColor:colors.dividerSoft,borderRadius:8}}/>:null}
 <TextInput accessibilityLabel="Password" autoCapitalize="none" secureTextEntry value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor={colors.textMuted} style={{padding:14,color:colors.text,borderWidth:1,borderColor:colors.dividerSoft,borderRadius:8}}/>
 {auth.recovery?button('Save password',()=>auth.changePassword(password)):<>{button('Sign in',()=>auth.signIn(email.trim(),password))}{button('Create account',async()=>{await auth.signUp(email.trim(),password);Alert.alert('Check your email','Confirm your email to sign in.');})}{button('Continue with Google',auth.google)}{button('Reset password',async()=>{await auth.recover(email.trim());Alert.alert('Check your email','Follow the link to reset your password.');})}</>}
 {busy?<ActivityIndicator color={colors.text}/>:null}</View></Screen>;
}
