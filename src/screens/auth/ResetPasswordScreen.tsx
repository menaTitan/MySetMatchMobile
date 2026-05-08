import React, { useState } from 'react';
import { Text, StyleSheet, Alert } from 'react-native';
import { authApi } from '../../api';
import { DEFAULT_THEME, spacing, typography } from '../../theme';
import { AuthScreen, Button, Input } from '../../components/ui';

const T = DEFAULT_THEME;

export default function ResetPasswordScreen({ navigation, route }: any) {
  const [email, setEmail] = useState(route?.params?.email ?? '');
  const [token, setToken] = useState(route?.params?.token ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!email.trim() || !token.trim()) {
      Alert.alert('Missing info', 'Enter your email and reset code.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Passwords do not match', 'Please re-enter your password.');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword({
        email: email.trim().toLowerCase(),
        token: token.trim(),
        password,
      });
      Alert.alert('Password reset', 'You can now sign in with your new password.', [
        { text: 'OK', onPress: () => navigation.popToTop() },
      ]);
    } catch (err: any) {
      Alert.alert('Reset failed', err?.response?.data?.message ?? 'Invalid or expired reset code.');
    } finally { setLoading(false); }
  }

  return (
    <AuthScreen
      icon="key-outline"
      title="Reset password"
      subtitle="Enter the code from your email and choose a new password."
      onBack={() => navigation.goBack()}
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
        label="Reset code"
        leftIcon="ticket-outline"
        placeholder="Code from email"
        autoCapitalize="none"
        autoCorrect={false}
        value={token}
        onChangeText={setToken}
      />
      <Input
        label="New password"
        leftIcon="lock-closed-outline"
        rightIcon={showPass ? 'eye-off-outline' : 'eye-outline'}
        onRightIconPress={() => setShowPass((x) => !x)}
        placeholder="At least 8 characters"
        secureTextEntry={!showPass}
        value={password}
        onChangeText={setPassword}
      />
      <Input
        label="Confirm password"
        leftIcon="lock-closed-outline"
        placeholder="••••••••"
        secureTextEntry={!showPass}
        value={confirm}
        onChangeText={setConfirm}
      />

      <Button
        title="Reset password"
        onPress={submit}
        loading={loading}
        variant="primary" size="lg" fullWidth
        style={{ marginTop: spacing.sm }}
      />
      <Button
        title="Back to sign in"
        onPress={() => navigation.popToTop()}
        variant="ghost" size="md" fullWidth
        style={{ marginTop: spacing.sm }}
      />
    </AuthScreen>
  );
}
