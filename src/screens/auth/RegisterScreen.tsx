import React, { useState } from 'react';
import { Text, StyleSheet, Alert, Pressable } from 'react-native';
import { authApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { DEFAULT_THEME, spacing, typography } from '../../theme';
import { AuthScreen, Button, Input } from '../../components/ui';

const T = DEFAULT_THEME;

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
      // Email verification is temporarily off — backend returns tokens directly.
      // The root navigator routes to CreateProfile when player is null.
      await applyAuthResponse(data);
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
