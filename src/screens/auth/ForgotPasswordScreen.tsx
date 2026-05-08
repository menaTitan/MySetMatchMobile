import React, { useState } from 'react';
import { Text, View, StyleSheet, Alert } from 'react-native';
import { authApi } from '../../api';
import { DEFAULT_THEME, spacing, typography } from '../../theme';
import { AuthScreen, Button, Input } from '../../components/ui';

const T = DEFAULT_THEME;

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    if (!email.trim()) {
      Alert.alert('Missing email', 'Enter your email address.');
      return;
    }
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
    } catch {
      // Always show success-ish message even on failure to prevent enumeration.
    } finally {
      setSent(true);
      setLoading(false);
    }
  }

  return (
    <AuthScreen icon="lock-closed-outline" title="Forgot password?" onBack={() => navigation.goBack()}>
      {sent ? (
        <>
          <Text style={[typography.body, styles.body]}>
            If an account exists for <Text style={{ fontWeight: '700' }}>{email}</Text>, we've sent a reset link. Check your inbox.
          </Text>
          <Button
            title="Back to sign in"
            onPress={() => navigation.goBack()}
            variant="primary" size="lg" fullWidth
            style={{ marginTop: spacing.lg }}
          />
          <Button
            title="I have a code"
            onPress={() => navigation.navigate('ResetPassword', { email })}
            variant="ghost" size="md" fullWidth
            style={{ marginTop: spacing.sm }}
          />
        </>
      ) : (
        <>
          <Text style={[typography.body, styles.body]}>
            Enter your email and we'll send you a link to reset your password.
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
          <Button
            title="Send reset link"
            onPress={submit}
            loading={loading}
            variant="primary" size="lg" fullWidth
            rightIcon="send-outline"
            style={{ marginTop: spacing.sm }}
          />
          <Button
            title="Back to sign in"
            onPress={() => navigation.goBack()}
            variant="ghost" size="md" fullWidth
            style={{ marginTop: spacing.sm }}
          />
        </>
      )}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  body: {
    color: T.textMuted, textAlign: 'center',
    marginTop: spacing.sm, marginBottom: spacing.lg,
  },
});
