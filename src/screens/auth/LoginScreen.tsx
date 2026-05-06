import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Alert, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { DEFAULT_THEME, radii, shadows, spacing, typography } from '../../theme';
import { Button, Input, KeyboardAware } from '../../components/ui';

const T = DEFAULT_THEME;

export default function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Missing info', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err: any) {
      Alert.alert('Login failed', err?.response?.data?.message ?? 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={T.heroGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
      {/* Background orbs */}
      <View pointerEvents="none" style={[styles.orb, styles.orbA, { backgroundColor: T.accentLight }]} />
      <View pointerEvents="none" style={[styles.orb, styles.orbB, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />

      <KeyboardAware contentContainerStyle={styles.scroll} extraScroll={60}>
          {/* Logo area */}
          <View style={styles.logoArea}>
            <View style={styles.logoBox}>
              <Image source={require('../../../assets/icon.png')} style={styles.logoImg} resizeMode="contain" />
            </View>
            <Text style={styles.badge}>
              <Ionicons name="flash" size={11} color={T.accent} /> MULTI-SPORT PLATFORM
            </Text>
            <Text style={styles.appName}>MySetMatch</Text>
            <Text style={styles.tagline}>Compete. Connect. Climb the ranks.</Text>
          </View>

          {/* Auth card */}
          <View style={styles.card}>
            <Text style={[typography.h1, { color: T.primary, textAlign: 'center', marginBottom: 4 }]}>
              Welcome back
            </Text>
            <Text style={[typography.small, { color: T.textMuted, textAlign: 'center', marginBottom: spacing.xl }]}>
              Sign in to continue to your dashboard
            </Text>

            <Input
              label="Email"
              leftIcon="mail-outline"
              placeholder="you@example.com"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <Input
              label="Password"
              leftIcon="lock-closed-outline"
              rightIcon={showPass ? 'eye-off-outline' : 'eye-outline'}
              onRightIconPress={() => setShowPass((x) => !x)}
              placeholder="••••••••"
              secureTextEntry={!showPass}
              value={password}
              onChangeText={setPassword}
            />

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              variant="primary"
              size="lg"
              fullWidth
              rightIcon="arrow-forward"
              style={{ marginTop: spacing.sm }}
            />

            <View style={styles.dividerRow}>
              <View style={[styles.divider, { backgroundColor: T.divider }]} />
              <Text style={[typography.caption, { color: T.textMuted }]}>NEW TO MYSETMATCH?</Text>
              <View style={[styles.divider, { backgroundColor: T.divider }]} />
            </View>

            <Button
              title="Create an account"
              onPress={() => navigation.navigate('Register')}
              variant="secondary"
              size="md"
              fullWidth
              uppercase={false}
              rightIcon="person-add-outline"
            />
          </View>

          <Text style={styles.footer}>
            By continuing you agree to our Terms & Privacy Policy
          </Text>
      </KeyboardAware>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg, paddingTop: spacing.xxxl },
  orb: { position: 'absolute', borderRadius: 999 },
  orbA: { width: 320, height: 320, top: -100, right: -80, opacity: 0.8 },
  orbB: { width: 260, height: 260, bottom: -60, left: -80 },

  logoArea: { alignItems: 'center', marginBottom: spacing.xl },
  logoBox: {
    width: 88, height: 88, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
    shadowColor: T.accent, shadowOpacity: 0.4, shadowRadius: 20, elevation: 8,
  },
  logoImg: { width: 58, height: 58 },
  badge: {
    ...typography.overline,
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: radii.pill,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  appName: {
    color: '#fff',
    fontSize: 36, fontWeight: '900',
    letterSpacing: -1.2,
    fontFamily: typography.display.fontFamily,
  },
  tagline: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14, marginTop: 4,
    letterSpacing: 0.2,
    fontFamily: typography.body.fontFamily,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: radii.xxl,
    padding: spacing.xl,
    ...shadows.xl,
  },
  dividerRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  divider: { flex: 1, height: 1 },

  footer: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
