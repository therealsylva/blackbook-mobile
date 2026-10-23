import {Pressable,Text,View} from 'react-native';
import {useRouter} from 'expo-router';
import {Screen} from '@/components/ui/screen';
import {useAuth} from '@/context/auth-context';
import {typography} from '@/theme/tokens';
import {createThemedStyles} from '@/theme/use-themed-styles';
export function AccountPrompt({title,description}:{title:string;description:string}){
 const {requestAuth}=useAuth(),router=useRouter(),styles=useStyles();
 return <Screen><View style={styles.body}><Text style={styles.title}>{title}</Text><Text style={styles.description}>{description}</Text><Pressable accessibilityRole="button" onPress={()=>requestAuth('signin')} style={styles.primary}><Text style={styles.primaryText}>Sign in</Text></Pressable><Pressable accessibilityRole="button" onPress={()=>requestAuth('signup')} style={styles.secondary}><Text style={styles.text}>Create account</Text></Pressable><Pressable accessibilityRole="button" onPress={()=>router.replace('/(tabs)')} style={styles.secondary}><Text style={styles.text}>Browse markets</Text></Pressable></View></Screen>;
}
const useStyles=createThemedStyles(colors=>({body:{padding:24,flex:1,justifyContent:'center'},title:{fontFamily:typography.semibold,fontSize:27,color:colors.text},description:{fontFamily:typography.family,fontSize:15,lineHeight:23,color:colors.textMuted,marginTop:12,marginBottom:28},primary:{backgroundColor:colors.text,borderRadius:8,minHeight:50,alignItems:'center',justifyContent:'center'},primaryText:{fontFamily:typography.semibold,color:colors.bg,fontSize:15},secondary:{minHeight:48,alignItems:'center',justifyContent:'center',marginTop:10},text:{fontFamily:typography.medium,color:colors.text,fontSize:14}}));
