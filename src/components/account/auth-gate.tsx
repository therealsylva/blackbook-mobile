import {useEffect,useRef,useState,type PropsWithChildren} from 'react';
import {ActivityIndicator,Image,KeyboardAvoidingView,Modal,Platform,Pressable,ScrollView,Text,TextInput,View} from 'react-native';
import {useRouter} from 'expo-router';
import {Screen} from '@/components/ui/screen';
import {Icon} from '@/components/ui/icon';
import {useAuth} from '@/context/auth-context';
import {useTheme} from '@/theme/theme-context';
import {typography} from '@/theme/tokens';
import {createThemedStyles} from '@/theme/use-themed-styles';
type FormMode='signin'|'signup'|'reset';
export function AuthGate({children}:PropsWithChildren){
 const auth=useAuth(),{colors}=useTheme(),styles=useStyles(),router=useRouter();
 const [mode,setMode]=useState<FormMode>('signin'),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[showPassword,setShowPassword]=useState(false),[busy,setBusy]=useState(false),[feedback,setFeedback]=useState<{text:string;error:boolean}|null>(null);
 const locked=useRef(false),passwordInput=useRef<TextInput>(null);
 useEffect(()=>{if(auth.view){setMode(auth.view);setPassword('');setShowPassword(false);setFeedback(null);}},[auth.view]);
 const changeMode=(next:FormMode)=>{if(locked.current)return;setMode(next);setPassword('');setShowPassword(false);setFeedback(null);};
 const dismiss=()=>{if(!locked.current){setPassword('');setFeedback(null);auth.dismissAuth();}};
 const browse=()=>{if(!locked.current){dismiss();router.replace('/(tabs)');}};
 const submit=async()=>{
  if(locked.current)return;
  const address=email.trim();
  if(!auth.recovery&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)){setFeedback({text:'Enter a valid email address.',error:true});return;}
  if((auth.recovery||mode!=='reset')&&(!password||((auth.recovery||mode==='signup')&&password.length<8))){setFeedback({text:auth.recovery||mode==='signup'?'Choose a password with at least 8 characters.':'Enter your password.',error:true});return;}
  locked.current=true;setBusy(true);setFeedback(null);
  try{
   if(auth.recovery)await auth.changePassword(password);
   else if(mode==='signin'){await auth.signIn(address,password);setPassword('');}
   else if(mode==='signup'){
    const result=await auth.signUp(address,password);
    if(result.confirmationRequired){setPassword('');setFeedback({text:'Check your email to confirm your account, then come back to sign in.',error:false});}
   }else{await auth.recover(address);setFeedback({text:'If an account exists for this email, a password reset link will be sent. Check your inbox and spam folder.',error:false});}
  }catch(error){setFeedback({text:error instanceof Error?(/abort|timed? ?out/i.test(error.message)?'The connection timed out. Please try again.':error.message):'Unable to connect. Please try again.',error:true});}
  finally{locked.current=false;setBusy(false);}
 };
 const signup=mode==='signup',reset=mode==='reset'&&!auth.recovery;
 const label=auth.recovery?'Save password':signup?'Create account':reset?'Send reset link':'Sign in';
 return <><View style={styles.flex} aria-hidden={auth.view!==null||auth.recovery} importantForAccessibility={auth.view!==null||auth.recovery?'no-hide-descendants':'auto'}>{children}</View><Modal visible={auth.view!==null||auth.recovery} animationType="slide" onRequestClose={dismiss} presentationStyle="fullScreen">
  <Screen edges={['top','bottom']}><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS==='ios'?'padding':undefined}><ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
   <View style={styles.header}><Image accessibilityLabel="BlackBook" source={require('../../../assets/wordmark.png')} resizeMode="contain" style={[styles.logo,{tintColor:colors.text}]}/><Pressable accessibilityRole="button" accessibilityLabel="Browse markets without signing up" disabled={busy} onPress={dismiss} style={styles.iconButton}><Icon name="close" size={20}/></Pressable></View>
   <View style={styles.form}>
    <Text accessibilityRole="header" style={styles.heading}>{auth.recovery?'Choose a new password':signup?'Create your account':reset?'Reset password':'Welcome back'}</Text>
    <Text style={styles.intro}>{auth.recovery?'Set a new password for your account.':signup?'Your edge starts with what you know.':reset?'We’ll email you a link to choose a new password.':'Sign in to your BlackBook account.'}</Text>
    {!auth.recovery?<><Pressable accessibilityRole="button" disabled={busy} onPress={browse} style={styles.browse}><Text style={styles.browseText}>Browse markets first</Text><Icon name="chevron" size={18}/></Pressable><View style={styles.separator}><View style={styles.line}/><Text style={styles.or}>or continue with email</Text><View style={styles.line}/></View></>:null}
    {!auth.recovery?<View style={styles.field}><Text style={styles.label}>Email address</Text><TextInput accessibilityLabel="Email" editable={!busy} autoCapitalize="none" autoCorrect={false} autoComplete="email" keyboardType="email-address" returnKeyType={reset?'go':'next'} value={email} onChangeText={setEmail} onSubmitEditing={()=>reset?void submit():passwordInput.current?.focus()} placeholder="you@example.com" placeholderTextColor={colors.textFaint} style={styles.input}/></View>:null}
    {!reset?<View style={styles.field}><Text style={styles.label}>Password</Text><View style={styles.password}><TextInput ref={passwordInput} accessibilityLabel="Password" editable={!busy} autoCapitalize="none" autoCorrect={false} autoComplete={signup||auth.recovery?'new-password':'current-password'} secureTextEntry={!showPassword} value={password} onChangeText={setPassword} returnKeyType="go" onSubmitEditing={()=>void submit()} placeholder={signup||auth.recovery?'Create a password':'Enter your password'} placeholderTextColor={colors.textFaint} style={[styles.input,styles.passwordInput]}/><Pressable accessibilityRole="button" accessibilityLabel={showPassword?'Hide password':'Show password'} onPress={()=>setShowPassword(value=>!value)} style={styles.eye}><Icon name={showPassword?'eye-off':'eye'} size={19} color={colors.textMuted}/></Pressable></View>{signup||auth.recovery?<Text style={styles.hint}>Use at least 8 characters.</Text>:null}</View>:null}
    {!signup&&!reset&&!auth.recovery?<Pressable accessibilityRole="button" disabled={busy} onPress={()=>changeMode('reset')} style={styles.forgot}><Text style={styles.link}>Forgot password?</Text></Pressable>:null}
    {feedback||auth.callbackError?<Text accessibilityRole={feedback?.error||auth.callbackError?'alert':undefined} accessibilityLiveRegion="polite" style={[styles.feedback,(feedback?.error||auth.callbackError)?styles.error:styles.success]}>{feedback?.text??auth.callbackError}</Text>:null}
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{busy,disabled:busy}} disabled={busy} onPress={()=>void submit()} style={[styles.primary,busy&&styles.disabled]}>{busy?<ActivityIndicator color={colors.bg}/>:<><Text style={styles.primaryText}>{label}</Text><Icon name="chevron" size={18} color={colors.bg}/></>}</Pressable>
    {!auth.recovery?<View style={styles.switch}><Text style={styles.switchText}>{signup?'Already have an account?':reset?'Remember your password?':'New to BlackBook?'}</Text><Pressable accessibilityRole="button" disabled={busy} onPress={()=>changeMode(signup||reset?'signin':'signup')} style={styles.switchAction}><Text style={styles.link}>{signup||reset?'Sign in':'Create account'}</Text></Pressable></View>:null}
   </View>
  </ScrollView></KeyboardAvoidingView></Screen>
 </Modal></>;
}
const useStyles=createThemedStyles(colors=>({
 flex:{flex:1},scroll:{flexGrow:1,paddingBottom:32},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:24,paddingTop:20},logo:{width:164,height:50},iconButton:{height:44,width:44,alignItems:'center',justifyContent:'center'},form:{paddingHorizontal:26,paddingTop:25,width:'100%',maxWidth:460,alignSelf:'center'},heading:{fontFamily:typography.semibold,color:colors.text,fontSize:29,letterSpacing:-1},intro:{fontFamily:typography.family,color:colors.textMuted,fontSize:14,lineHeight:22,marginTop:10,marginBottom:28},browse:{borderWidth:1,borderColor:colors.divider,minHeight:52,borderRadius:8,flexDirection:'row',justifyContent:'center',alignItems:'center',gap:10,padding:12},browseText:{fontFamily:typography.semibold,color:colors.text,fontSize:15},separator:{flexDirection:'row',alignItems:'center',gap:14,marginVertical:23},line:{height:1,backgroundColor:colors.divider,flex:1},or:{color:colors.textMuted,fontFamily:typography.family,fontSize:12},field:{marginBottom:19},label:{fontFamily:typography.medium,color:colors.text,fontSize:13,marginBottom:9},input:{borderWidth:1,borderColor:colors.divider,borderRadius:8,backgroundColor:colors.control,color:colors.text,fontFamily:typography.family,fontSize:16,minHeight:52,paddingHorizontal:14,paddingVertical:12},password:{position:'relative'},passwordInput:{paddingRight:52},eye:{position:'absolute',right:3,top:3,width:44,height:46,alignItems:'center',justifyContent:'center'},hint:{fontFamily:typography.family,color:colors.textMuted,fontSize:12,marginTop:9},forgot:{alignSelf:'flex-end',minHeight:40,justifyContent:'center',marginTop:-10},link:{fontFamily:typography.semibold,color:colors.text,fontSize:13},primary:{backgroundColor:colors.text,minHeight:52,borderRadius:8,flexDirection:'row',gap:10,alignItems:'center',justifyContent:'center',padding:12,marginTop:22},primaryText:{fontFamily:typography.semibold,color:colors.bg,fontSize:15},switch:{flexDirection:'row',alignItems:'center',justifyContent:'center',flexWrap:'wrap',gap:4,marginTop:18},switchText:{fontFamily:typography.family,color:colors.textMuted,fontSize:13},switchAction:{minHeight:44,justifyContent:'center',paddingHorizontal:5},feedback:{fontFamily:typography.family,fontSize:13,lineHeight:21,padding:12,backgroundColor:colors.control,borderLeftWidth:2,marginTop:8,color:colors.text},error:{borderLeftColor:colors.negative},success:{borderLeftColor:colors.positive},disabled:{opacity:.6},
}));
