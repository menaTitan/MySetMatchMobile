import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { DEFAULT_THEME, spacing, typography } from '../../theme';
import { AuthScreen, Button, Input } from '../../components/ui';
import {
  biometricLabel,
  clearBiometricCredentials,
  hasBiometricCredentials,
  isBiometricAvailable,
  isBiometricEnabled,
  unlockBiometricCredentials,
} from '../../utils/biometric';

const T = DEFAULT_THEME;

export default function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  // Biometric sign-in button visibility — only shown when the user
  // previously enabled the toggle AND we have credentials on file AND
  // the device still has a usable biometric.
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioLabelText, setBioLabelText] = useState('Face ID');

  useEffect(() => {
    (async () => {
      const [enabled, hasCreds, available, label] = await Promise.all([
        isBiometricEnabled(),
        hasBiometricCredentials(),
        isBiometricAvailable(),
        biometricLabel(),
      ]);
      setBioAvailable(enabled && hasCreds && available);
      setBioLabelText(label);
    })();
  }, []);

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

  async function handleBiometricSignIn() {
    setLoading(true);
    try {
      const creds = await unlockBiometricCredentials(`Sign in with ${bioLabelText}`);
      if (!creds) return; // user cancelled or biometric failed
      try {
        await login(creds.email, creds.password);
      } catch (err: any) {
        // Stored password no longer works (rotated, account disabled,
        // etc.) — clear creds so the button hides and force a manual
        // sign-in.
        await clearBiometricCredentials();
        setBioAvailable(false);
        Alert.alert(
          'Saved password is out of date',
          'Please sign in once with your password to re-enable biometric login.',
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreen
      showBranding
      title="Welcome back"
      subtitle="Sign in to continue to your dashboard"
      footer={
        <Text style={[typography.caption, { color: 'rgba(255,255,255,0.55)', textAlign: 'center' }]}>
          By continuing you agree to our Terms & Privacy Policy
        </Text>
      }
    >
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

      {bioAvailable ? (
        <Button
          title={`Sign in with ${bioLabelText}`}
          onPress={handleBiometricSignIn}
          variant="secondary"
          size="md"
          fullWidth
          uppercase={false}
          leftIcon="finger-print-outline"
          style={{ marginTop: spacing.sm }}
        />
      ) : null}

      <Button
        title="Forgot password?"
        onPress={() => navigation.navigate('ForgotPassword')}
        variant="ghost" size="sm" fullWidth uppercase={false}
        style={{ marginTop: spacing.xs }}
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
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  dividerRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  divider: { flex: 1, height: 1 },
});
