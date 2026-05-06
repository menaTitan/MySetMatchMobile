import React from 'react';
import { Platform, StyleProp, ViewStyle } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Extra pixels of space between the focused input and the top of the keyboard. */
  extraScroll?: number;
  keyboardShouldPersistTaps?: 'always' | 'handled' | 'never';
}

/**
 * Drop-in replacement for <ScrollView> on forms. Ensures the focused TextInput
 * automatically scrolls to stay above the keyboard on both iOS and Android.
 * Pair with `android.softwareKeyboardLayoutMode: 'pan'` in app.config.ts.
 */
export default function KeyboardAware({
  children,
  style,
  contentContainerStyle,
  extraScroll = 24,
  keyboardShouldPersistTaps = 'handled',
}: Props) {
  return (
    <KeyboardAwareScrollView
      style={style}
      contentContainerStyle={contentContainerStyle}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      enableOnAndroid
      extraScrollHeight={extraScroll}
      // Let the library manage positioning on both platforms; it applies
      // padding on iOS and adjusts scroll offset on Android.
      enableAutomaticScroll={Platform.OS === 'ios'}
      keyboardOpeningTime={180}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </KeyboardAwareScrollView>
  );
}
