import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSport } from '../../context/SportContext';
import { spacing, typography } from '../../theme';

export default function LoadingView({ message }: { message?: string }) {
  const { theme } = useSport();
  return (
    <View style={[styles.wrap, { backgroundColor: theme.pageBg }]}>
      <ActivityIndicator size="large" color={theme.primary} />
      {message ? <Text style={[typography.small, { color: theme.textMuted, marginTop: spacing.md }]}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { flex: 1, justifyContent: 'center', alignItems: 'center' } });
