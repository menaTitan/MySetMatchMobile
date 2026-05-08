import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSport } from '../../context/SportContext';
import { radii, spacing, typography } from '../../theme';

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon = 'sparkles-outline', title, message, action }: Props) {
  const { theme } = useSport();
  return (
    <View style={styles.wrap}>
      <View style={[
        styles.iconBox,
        { borderColor: theme.border, backgroundColor: theme.featureBg },
      ]}>
        <Ionicons name={icon} size={32} color={theme.accent} />
      </View>
      <Text style={[
        typography.h3,
        { color: theme.textPrimary, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.8 },
      ]}>{title}</Text>
      {message ? (
        <Text style={[typography.small, { color: theme.textMuted, textAlign: 'center', maxWidth: 280 }]}>
          {message}
        </Text>
      ) : null}
      {action ? <View style={{ marginTop: spacing.md }}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', padding: spacing.xl, gap: spacing.sm },
  iconBox: {
    width: 72, height: 72, borderRadius: radii.lg,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs,
  },
});
