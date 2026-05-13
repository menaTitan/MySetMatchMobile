import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Pressable } from 'react-native';
import { authApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { DEFAULT_THEME, spacing, typography } from '../../theme';
import { AuthScreen, Button, Input } from '../../components/ui';

const T = DEFAULT_THEME;

/**
 * Step 1 of registration. Collects only name / email / password so the
 * user gets out of the form quickly. After the backend creates the
 * unconfirmed user and sends a 6-digit code, the navigation moves to
 * VerifyEmailScreen and then CreateProfileScreen.
 */
export default function RegisterScreen({ navigation }: any) {
  const { applyAuthResponse } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleRegister() {
    const email = form.email.trim().toLowerCase();
    const name = form.name.trim();
    if (!name || !email || !form.password) {
      Alert.alert('Missing info', 'Name, email and password are required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }
    if (form.password.length < 6) {
      Alert.alert('Password too short', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authApi.register({ email, password: form.password, name });
      // Sign the user in immediately so the rest of the flow isn't blocked
      // on email delivery. Email verification becomes an optional next step.
      await applyAuthResponse({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        player: data.player ?? null,
      });
      navigation.replace('VerifyEmail', {
        userId: data.userId,
        email,
        name,
        resent: data.resent === true,
        canSkip: true,
      });
    } catch (err: any) {
      const errors = err?.response?.data?.errors;
      const msg = errors ? errors.join('\n') : (err?.response?.data?.message ?? 'Registration failed. Please try again.');
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreen
      title="Create account"
      subtitle="Join the MySetMatch community"
      onBack={() => navigation.goBack()}
    >
      <Input
        label="Full name"
        leftIcon="person-outline"
        placeholder="John Doe"
        autoCapitalize="words"
        value={form.name}
        onChangeText={v => update('name', v)}
      />
      <Input
        label="Email"
        leftIcon="mail-outline"
        placeholder="you@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
        value={form.email}
        onChangeText={v => update('email', v)}
      />
      <Input
        label="Password"
        leftIcon="lock-closed-outline"
        rightIcon={showPass ? 'eye-off-outline' : 'eye-outline'}
        onRightIconPress={() => setShowPass(x => !x)}
        placeholder="At least 6 characters"
        secureTextEntry={!showPass}
        value={form.password}
        onChangeText={v => update('password', v)}
      />

      <Text style={[typography.small, { color: T.textMuted, marginTop: spacing.xs, marginBottom: spacing.sm }]}>
        We'll send a 6-digit code to your email to verify it.
      </Text>

      <Button
        title="Continue"
        onPress={handleRegister}
        loading={loading}
        variant="primary"
        size="lg"
        fullWidth
        rightIcon="arrow-forward"
        style={{ marginTop: spacing.sm }}
      />

      <Pressable onPress={() => navigation.goBack()} style={styles.signInLink}>
        <Text style={[typography.small, { color: T.textMuted }]}>
          Already have an account? <Text style={{ color: T.primary, fontWeight: '700' }}>Sign in</Text>
        </Text>
      </Pressable>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  signInLink: { marginTop: spacing.lg, alignItems: 'center' },
});
