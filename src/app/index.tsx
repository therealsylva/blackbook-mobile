import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

// The native shell packages index-frontend; its mobile layer changes arrangement only.
const ANDROID_ENTRY = 'file:///android_asset/blackbook/index.html';
const WEB_ENTRY = 'https://blackbook.modnight.com';

export default function BlackbookMobile() {
  const webView = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!canGoBack) return false;
      webView.current?.goBack();
      return true;
    });

    return () => subscription.remove();
  }, [canGoBack]);

  const source = Platform.OS === 'android' ? { uri: ANDROID_ENTRY } : { uri: WEB_ENTRY };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <WebView
        ref={webView}
        allowFileAccess
        allowFileAccessFromFileURLs
        allowUniversalAccessFromFileURLs
        allowsBackForwardNavigationGestures
        cacheEnabled
        domStorageEnabled
        javaScriptEnabled
        mediaPlaybackRequiresUserAction
        mixedContentMode="compatibility"
        onNavigationStateChange={(state) => setCanGoBack(state.canGoBack)}
        originWhitelist={['file://*', 'https://*', 'http://*']}
        renderError={() => (
          <View style={styles.state}>
            <Text style={styles.stateTitle}>Blackbook could not load</Text>
            <Text style={styles.stateCopy}>The bundled index-frontend surface is unavailable.</Text>
          </View>
        )}
        renderLoading={() => (
          <View style={styles.state}>
            <ActivityIndicator color="#e7e7e7" />
            <Text style={styles.loadingCopy}>Loading Blackbook</Text>
          </View>
        )}
        setSupportMultipleWindows={false}
        sharedCookiesEnabled
        source={source}
        startInLoadingState
        style={styles.webView}
        thirdPartyCookiesEnabled
        userAgent="BlackbookMobile/0.1 index-frontend"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingCopy: {
    color: '#777777',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 12,
  },
  safeArea: {
    backgroundColor: '#000000',
    flex: 1,
  },
  state: {
    alignItems: 'center',
    backgroundColor: '#000000',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    padding: 28,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  stateCopy: {
    color: '#6e6e6e',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 7,
    textAlign: 'center',
  },
  stateTitle: {
    color: '#e7e7e7',
    fontSize: 16,
    fontWeight: '700',
  },
  webView: {
    backgroundColor: '#000000',
    flex: 1,
  },
});
