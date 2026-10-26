import {useCallback, useEffect, useRef} from 'react';
import {Keyboard, Platform, ScrollView, TextInput} from 'react-native';

/** Re-measure the focused field after Android resize / iOS keyboard animation. */
export function useKeyboardScroll() {
  const scroll = useRef<ScrollView>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollFocused = useCallback(() => {
    if(timer.current)clearTimeout(timer.current);
    timer.current=setTimeout(() => {
      if(Platform.OS==='web'){document.activeElement?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'smooth'});return;}
      const field=TextInput.State.currentlyFocusedInput();
      if(field)scroll.current?.scrollResponderScrollNativeHandleToKeyboard(field,32,true);
    }, 150);
  }, []);
  useEffect(() => {
    const listener=Keyboard.addListener('keyboardDidShow',scrollFocused);
    return () => {listener.remove();if(timer.current)clearTimeout(timer.current);};
  }, [scrollFocused]);
  return {scroll,scrollFocused};
}
