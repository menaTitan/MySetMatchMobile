import React from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSport } from '../../context/SportContext';
import { radii, spacing, typography } from '../../theme';

interface Props {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export default function ErrorView({ title = "Couldn't load", message, onRetry }: Props) {
  const { theme } = useSport();
  return (
    <View style={[styles.wrap, { backgroundColor: theme.pageBg }]}>
      <View style={[styles.iconBox, { backgroundColor: 'rgba(239,68,68,0.10)', borderColor: 'rgba(239,68,68,0.35)' }]}>
        <Ionicons name="cloud-offline-outline" size={30} color={theme.dangerRed} />
      </View>
      <Text style={[
        typography.h3,
        { color: theme.textPrimary, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.8 },
      ]}>{title}</Text>
      {message ? (
        <Text style={[typography.small, { color: theme.textMuted, textAlign: 'center', maxWidth: 300 }]}>
          {message}
        </Text>
      ) : null}
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => [
            styles.retryBtn,
            { backgroundColor: theme.accent },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Ionicons name="refresh" size={14} color={theme.textInverse} />
          <Text style={[typography.button, { color: theme.textInverse }]}>Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: spacing.xl, gap: spacing.sm,
  },
  iconBox: {
    width: 72, height: 72, borderRadius: radii.lg,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: spacing.lg, paddingVertical: 12,
    borderRadius: radii.md,
    marginTop: spacing.md,
  },
});
