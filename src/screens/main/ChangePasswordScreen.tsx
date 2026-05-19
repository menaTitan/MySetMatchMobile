import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { authApi } from '../../api';
import { useSport } from '../../context/SportContext';
import { spacing, typography } from '../../theme';
import { Button, Card, Input, PageHeader } from '../../components/ui';

/**
 * Lets the signed-in user rotate their password. The backend enforces
 * Identity complexity rules (8+ chars, upper, lower, digit, non-alpha)
 * and revokes all outstanding refresh tokens, so any other signed-in
 * device gets bounced to login the next time it refreshes.
 */
export default function ChangePasswordScreen({ navigation }: any) {
  const { theme } = useSport();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [saving, setSaving] = useState(false);

  // Mirror the backend Identity policy so the user gets an immediate hint
  // instead of a round-trip error wall.
  const rules = [
    { ok: next.length >= 8,          label: 'At least 8 characters' },
    { ok: /[A-Z]/.test(next),        label: 'An uppercase letter' },
    { ok: /[a-z]/.test(next),        label: 'A lowercase letter' },
    { ok: /\d/.test(next),           label: 'A digit' },
    { ok: /[^A-Za-z0-9]/.test(next), label: 'A symbol' },
  ];
  const allRulesOk = rules.every(r => r.ok);
  const matches = next.length > 0 && next === confirm;
  const canSubmit = current.length > 0 && allRulesOk && matches && !saving;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSaving(true);
    try {
      await authApi.changePassword(current, next);
      Alert.alert('Password updated', 'Your password has been changed.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      // Backend returns either { errors: [...] } (Identity validation) or
      // { message } (current password wrong). Show whichever came back.
      const errors = err?.response?.data?.errors;
      const msg = Array.isArray(errors) && errors.length
        ? errors.join('\n')
        : (err?.response?.data?.message ?? 'Could not change password.');
      Alert.alert('Change failed', msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <PageHeader title="Change Password" subtitle="Update your sign-in password" compact />
      <ScrollView contentContainerStyle={{ padding: spacing.base, gap: spacing.base }}>
        <Card>
          <Input
            label="Current password"
            leftIcon="lock-closed-outline"
            rightIcon={showCurrent ? 'eye-off-outline' : 'eye-outline'}
            onRightIconPress={() => setShowCurrent(x => !x)}
            placeholder="Your current password"
            secureTextEntry={!showCurrent}
            value={current}
            onChangeText={setCurrent}
          />
          <Input
            label="New password"
            leftIcon="key-outline"
            rightIcon={showNext ? 'eye-off-outline' : 'eye-outline'}
            onRightIconPress={() => setShowNext(x => !x)}
            placeholder="At least 8 characters"
            secureTextEntry={!showNext}
            value={next}
            onChangeText={setNext}
          />
          <Input
            label="Confirm new password"
            leftIcon="key-outline"
            placeholder="Re-enter your new password"
            secureTextEntry={!showNext}
            value={confirm}
            onChangeText={setConfirm}
          />

          <View style={{ marginTop: spacing.sm }}>
            {rules.map(r => (
              <View key={r.label} style={styles.ruleRow}>
                <Text style={{ color: r.ok ? theme.successGreen ?? '#22c55e' : theme.textMuted, width: 16 }}>
                  {r.ok ? '✓' : '•'}
                </Text>
                <Text style={[typography.small, { color: r.ok ? theme.textPrimary : theme.textMuted }]}>
                  {r.label}
                </Text>
              </View>
            ))}
            {confirm.length > 0 && !matches ? (
              <Text style={[typography.small, { color: theme.dangerRed, marginTop: 4 }]}>
                Passwords don't match.
              </Text>
            ) : null}
          </View>
        </Card>

        <Button
          title="Update Password"
          variant="primary"
          size="lg"
          fullWidth
          disabled={!canSubmit}
          loading={saving}
          rightIcon="checkmark-circle-outline"
          onPress={handleSubmit}
        />

        <Button
          title="Cancel"
          variant="ghost"
          size="md"
          fullWidth
          uppercase={false}
          onPress={() => navigation.goBack()}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
});
