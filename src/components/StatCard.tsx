import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSport } from '../context/SportContext';
import { radii, shadows, spacing, typography } from '../theme';

interface Props {
  label: string;
  value: string;
  accent?: boolean;
}

export default function StatCard({ label, value, accent }: Props) {
  const { theme } = useSport();
  return (
    <View style={[
      styles.card,
      { backgroundColor: accent ? theme.primary : theme.cardBg, borderTopColor: theme.accent },
      shadows.md,
    ]}>
      <Text style={[
        styles.value,
        { color: accent ? '#fff' : theme.primary },
      ]}>
        {value}
      </Text>
      <Text style={[
        styles.label,
        { color: accent ? 'rgba(255,255,255,0.75)' : theme.textMuted },
      ]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1, minWidth: '45%',
    borderRadius: radii.lg,
    padding: spacing.base,
    alignItems: 'center',
    borderTopWidth: 3,
  },
  value: { ...typography.h1, fontSize: 22 },
  label: { ...typography.caption, marginTop: 2, textAlign: 'center' },
});
