import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert, Pressable, TextInput } from 'react-native';
import { authApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { DEFAULT_THEME, radii, spacing, typography } from '../../theme';
import { AuthScreen, Button } from '../../components/ui';

const T = DEFAULT_THEME;
const CODE_LENGTH = 6;

/**
 * Step 2 of registration. The user types the 6-digit code that was emailed
 * to them. On success the backend returns auth tokens and we route to
 * CreateProfile to finish onboarding.
 */
export default function VerifyEmailScreen({ navigation, route }: any) {
  const { userId, email, name, resent } = route.params ?? {};
  const { applyAuthResponse } = useAuth();
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const inputs = useRef<Array<TextInput | null>>([]);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (resent) {
      Alert.alert('Code resent', 'We sent a new verification code to your email.');
    }
    // Focus first cell after a beat so the keyboard pops up on entry.
    const t = setTimeout(() => inputs.current[0]?.focus(), 150);
    return () => clearTimeout(t);
  }, [resent]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function setDigit(idx: number, value: string) {
    // Paste / autofill: distribute multi-char input across cells.
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length > 1) {
      const next = [...digits];
      for (let i = 0; i < CODE_LENGTH && i + idx < CODE_LENGTH; i++) {
        next[idx + i] = cleaned[i] ?? '';
      }
      setDigits(next);
      const lastFilled = Math.min(idx + cleaned.length, CODE_LENGTH - 1);
      inputs.current[lastFilled]?.focus();
      if (next.every((d) => d.length === 1)) submit(next.join(''));
      return;
    }
    const next = [...digits];
    next[idx] = cleaned;
    setDigits(next);
    if (cleaned && idx < CODE_LENGTH - 1) inputs.current[idx + 1]?.focus();
    if (cleaned && idx === CODE_LENGTH - 1 && next.every((d) => d.length === 1)) {
      submit(next.join(''));
    }
  }

  function handleKey(idx: number, key: string) {
    if (key === 'Backspace' && !digits[idx] && idx > 0) inputs.current[idx - 1]?.focus();
  }

  async function submit(code?: string) {
    const value = (code ?? digits.join('')).trim();
    if (value.length !== CODE_LENGTH) {
      Alert.alert('Enter code', `Please enter the ${CODE_LENGTH}-digit code from your email.`);
      return;
    }
    setVerifying(true);
    try {
      const { data } = await authApi.verifyEmail({ userId, code: value });
      await applyAuthResponse(data);
      // After tokens are stored the root navigator will land the user on
      // CreateProfile automatically (because player is still null).
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Invalid code. Please try again.';
      Alert.alert('Verification failed', msg);
      // Clear and refocus so they can retype.
      setDigits(Array(CODE_LENGTH).fill(''));
      inputs.current[0]?.focus();
    } finally { setVerifying(false); }
  }

  async function resend() {
    if (cooldown > 0) return;
    setResending(true);
    try {
      await authApi.resendVerification(userId);
      Alert.alert('Code sent', 'A new verification code is on its way.');
      setCooldown(30);
    } catch (err: any) {
      Alert.alert('Failed', err?.response?.data?.message ?? 'Could not resend code.');
    } finally { setResending(false); }
  }

  return (
    <AuthScreen
      title="Verify your email"
      subtitle={email ? `We sent a 6-digit code to ${email}` : 'Enter the code we emailed you'}
      onBack={() => navigation.goBack()}
    >
      <View style={styles.cells}>
        {digits.map((d, i) => (
          <TextInput
            key={i}
            ref={(r) => { inputs.current[i] = r; }}
            value={d}
            onChangeText={(v) => setDigit(i, v)}
            onKeyPress={(e) => handleKey(i, e.nativeEvent.key)}
            keyboardType="number-pad"
            maxLength={CODE_LENGTH}  // allow paste; we slice
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            style={[styles.cell, { borderColor: d ? T.primary : T.border, color: T.textPrimary, backgroundColor: T.cardBg }]}
            selectionColor={T.primary}
          />
        ))}
      </View>

      <Button
        title="Verify"
        onPress={() => submit()}
        loading={verifying}
        variant="primary"
        size="lg"
        fullWidth
        rightIcon="arrow-forward"
        style={{ marginTop: spacing.lg }}
      />

      <Pressable onPress={resend} disabled={resending || cooldown > 0} style={styles.resend}>
        <Text style={[typography.small, { color: cooldown > 0 ? T.textMuted : T.primary, fontWeight: '700' }]}>
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </Text>
      </Pressable>

      <Text style={[typography.small, { color: T.textMuted, marginTop: spacing.lg, textAlign: 'center' }]}>
        Didn't get an email? Check your spam folder.
      </Text>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  cells: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: spacing.lg },
  cell: {
    flex: 1,
    height: 56,
    borderWidth: 2,
    borderRadius: radii.md,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
  },
  resend: { marginTop: spacing.lg, alignItems: 'center' },
});
