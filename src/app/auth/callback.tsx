import {Redirect} from 'expo-router';
// AuthProvider handles the PKCE code and surfaces expired/invalid links.
export default function AuthCallback(){return <Redirect href="/(tabs)"/>;}
