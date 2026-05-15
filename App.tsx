import React from 'react';
import { NavigationContainer, DarkTheme, LinkingOptions } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Image, Text, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useFonts,
  Inter_400Regular, Inter_500Medium, Inter_600SemiBold,
  Inter_700Bold, Inter_800ExtraBold, Inter_900Black,
} from '@expo-google-fonts/inter';
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SportProvider } from './src/context/SportContext';
import AppNavigator from './src/navigation/AppNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import { navigationRef } from './src/navigation/navigationRef';
import { DEFAULT_THEME, typography } from './src/theme';
import { ToastProvider } from './src/components/ui';
import { usePushNotifications } from './src/hooks/usePushNotifications';

const NAV_THEME = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: DEFAULT_THEME.pageBg,
    card: DEFAULT_THEME.pageBg,
    text: DEFAULT_THEME.textPrimary,
    border: DEFAULT_THEME.border,
    primary: DEFAULT_THEME.accent,
    notification: DEFAULT_THEME.accent,
  },
};

// Deep-link map. The backend's password-reset email sends
// mysetmatch://reset-password?email=…&token=…  — without this config the app
// just opens to whatever the current root is and the token is lost.
// React Navigation auto-decodes query params into route.params.
const LINKING: LinkingOptions<ReactNavigation.RootParamList> = {
  prefixes: ['mysetmatch://'],
  config: {
    screens: {
      ResetPassword: 'reset-password',
      ConfirmEmail: 'confirm-email',
    },
  },
};

function SplashScreen({ message }: { message?: string }) {
  return (
    <LinearGradient
      colors={DEFAULT_THEME.heroGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.loading}
    >
      <View pointerEvents="none" style={[styles.slash, { backgroundColor: DEFAULT_THEME.accent }]} />
      <View style={styles.iconWrap}>
        <Image source={require('./assets/icon.png')} style={styles.icon} resizeMode="contain" />
      </View>
      <Text style={styles.appName}>MYSETMATCH</Text>
      <Text style={styles.tagline}>{message ?? 'YOUR MULTI-SPORT PLATFORM'}</Text>
      <ActivityIndicator size="small" color={DEFAULT_THEME.accent} style={styles.spinner} />
    </LinearGradient>
  );
}

function RootNavigator() {
  const { isAuthenticated, isLoading, player } = useAuth();
  usePushNotifications();
  if (isLoading) return <SplashScreen />;
  // Three states:
  //   - Not signed in → Auth flow
  //   - Signed in but no Player yet (just verified email) → Auth flow lands
  //     on CreateProfile so the user finishes onboarding before the main app
  //   - Signed in with Player → Main app
  if (!isAuthenticated) return <AuthNavigator />;
  if (!player) return <AuthNavigator initialRouteName="CreateProfile" />;
  return <AppNavigator />;
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold,
    Inter_700Bold, Inter_800ExtraBold, Inter_900Black,
    BebasNeue_400Regular,
  });

  if (!fontsLoaded && !fontError) return <SplashScreen message="LOADING…" />;

  return (
    <SafeAreaProvider>
      <ToastProvider>
        <AuthProvider>
          <SportProvider>
            <NavigationContainer ref={navigationRef} theme={NAV_THEME} linking={LINKING}>
              <StatusBar style="light" />
              <RootNavigator />
            </NavigationContainer>
          </SportProvider>
        </AuthProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  slash: {
    position: 'absolute',
    width: 800, height: 1.5,
    top: '45%',
    left: -100,
    transform: [{ rotate: '-10deg' }],
    opacity: 0.18,
  },
  iconWrap: {
    width: 120, height: 120, borderRadius: 8,
    backgroundColor: DEFAULT_THEME.cardBg,
    borderWidth: 1, borderColor: DEFAULT_THEME.border,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
    shadowColor: DEFAULT_THEME.accent, shadowOpacity: 0.55, shadowRadius: 28, elevation: 12,
  },
  icon: { width: 84, height: 84 },
  appName: {
    color: '#fff',
    fontSize: 44,
    letterSpacing: 2.5,
    fontFamily: typography.display.fontFamily,
  },
  tagline: {
    color: DEFAULT_THEME.textSecondary,
    fontSize: 12,
    marginTop: 6,
    letterSpacing: 1.6,
  },
  spinner: { marginTop: 32 },
});
