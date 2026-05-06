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
    <View style={styles.wrap}>
      <View style={[styles.iconBox, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
        <Ionicons name="cloud-offline-outline" size={30} color={theme.dangerRed} />
      </View>
      <Text style={[typography.h3, { color: theme.textPrimary, textAlign: 'center' }]}>{title}</Text>
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
            { backgroundColor: theme.primary },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Ionicons name="refresh" size={14} color="#fff" />
          <Text style={[typography.smallStrong, { color: '#fff' }]}>Try again</Text>
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
    width: 72, height: 72, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.base, paddingVertical: 10,
    borderRadius: radii.pill,
    marginTop: spacing.md,
  },
});
