import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { authApi } from '../../api';
import { DEFAULT_THEME, spacing, typography } from '../../theme';
import { AuthScreen, Button } from '../../components/ui';

const T = DEFAULT_THEME;

export default function ConfirmEmailScreen({ navigation, route }: any) {
  const { userId, token } = route?.params ?? {};
  const [state, setState] = useState<'loading' | 'ok' | 'fail'>('loading');

  useEffect(() => {
    if (!userId || !token) { setState('fail'); return; }
    authApi.confirmEmail(userId, token)
      .then(() => setState('ok'))
      .catch(() => setState('fail'));
  }, [userId, token]);

  const title = state === 'loading' ? 'Confirming…' : state === 'ok' ? 'Email confirmed' : 'Confirmation failed';
  const body = state === 'loading'
    ? 'Please wait a moment.'
    : state === 'ok'
      ? 'Your email has been verified. You can now sign in.'
      : 'The confirmation link is invalid or has expired.';

  return (
    <AuthScreen
      icon={state === 'loading' ? undefined : state === 'ok' ? 'checkmark-circle' : 'alert-circle'}
      iconTone={state === 'ok' ? 'success' : state === 'fail' ? 'danger' : 'accent'}
      title={title}
    >
      {state === 'loading' && (
        <View style={{ alignSelf: 'center', marginBottom: spacing.md }}>
          <ActivityIndicator color={T.primary} size="large" />
        </View>
      )}
      <Text style={[typography.body, styles.body]}>{body}</Text>
      {state !== 'loading' && (
        <Button
          title="Continue to sign in"
          onPress={() => navigation.popToTop()}
          variant="primary" size="lg" fullWidth
          style={{ marginTop: spacing.lg }}
        />
      )}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  body: { color: T.textMuted, textAlign: 'center', marginTop: spacing.sm },
});
