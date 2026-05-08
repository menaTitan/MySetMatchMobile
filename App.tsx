import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Image, Text, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useFonts,
  Inter_400Regular, Inter_500Medium, Inter_600SemiBold,
  Inter_700Bold, Inter_800ExtraBold, Inter_900Black,
} from '@expo-google-fonts/inter';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SportProvider } from './src/context/SportContext';
import AppNavigator from './src/navigation/AppNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import { navigationRef } from './src/navigation/navigationRef';
import { DEFAULT_THEME } from './src/theme';
import { ToastProvider } from './src/components/ui';
import { usePushNotifications } from './src/hooks/usePushNotifications';

function SplashScreen({ message }: { message?: string }) {
  return (
    <LinearGradient
      colors={DEFAULT_THEME.heroGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.loading}
    >
      <View style={styles.iconWrap}>
        <Image source={require('./assets/icon.png')} style={styles.icon} resizeMode="contain" />
      </View>
      <Text style={styles.appName}>MySetMatch</Text>
      <Text style={styles.tagline}>{message ?? 'Your Multi-Sport Platform'}</Text>
      <ActivityIndicator size="small" color={DEFAULT_THEME.accent} style={styles.spinner} />
    </LinearGradient>
  );
}

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  usePushNotifications();
  if (isLoading) return <SplashScreen />;
  return isAuthenticated ? <AppNavigator /> : <AuthNavigator />;
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold,
    Inter_700Bold, Inter_800ExtraBold, Inter_900Black,
  });

  // Proceed once fonts are ready OR if loading errors (don't block the app offline)
  if (!fontsLoaded && !fontError) return <SplashScreen message="Loading…" />;

  return (
    <SafeAreaProvider>
      <ToastProvider>
        <AuthProvider>
          <SportProvider>
            <NavigationContainer ref={navigationRef}>
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
  iconWrap: {
    width: 120, height: 120, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
    shadowColor: DEFAULT_THEME.accent, shadowOpacity: 0.45, shadowRadius: 24, elevation: 8,
  },
  icon: { width: 84, height: 84 },
  appName: {
    color: '#fff', fontSize: 34, fontWeight: '900', letterSpacing: -1,
  },
  tagline: {
    color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 4, letterSpacing: 0.3,
  },
  spinner: { marginTop: 32 },
});
