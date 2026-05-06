import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSport } from '../../context/SportContext';
import { radii, shadows, spacing, typography } from '../../theme';

type IconColor = 'blue' | 'accent' | 'green' | 'orange' | 'purple' | 'red';

interface Props {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: IconColor;
  style?: ViewStyle;
  orientation?: 'horizontal' | 'vertical';
}

const GRADIENTS: Record<IconColor, readonly [string, string]> = {
  blue:   ['#2B4C8C', '#1A365D'],
  accent: ['#FF9F1C', '#C87A00'],
  green:  ['#22c55e', '#16a34a'],
  orange: ['#f59e0b', '#d97706'],
  purple: ['#8b5cf6', '#7c3aed'],
  red:    ['#ef4444', '#dc2626'],
};

export default function StatTile({
  label, value, sublabel, icon, iconColor = 'blue', style, orientation = 'horizontal',
}: Props) {
  const { theme } = useSport();

  if (orientation === 'vertical') {
    return (
      <View style={[styles.wrapV, { backgroundColor: theme.cardBg }, shadows.md, style]}>
        {icon ? (
          <LinearGradient colors={GRADIENTS[iconColor]} style={styles.iconV}>
            <Ionicons name={icon} size={18} color="#fff" />
          </LinearGradient>
        ) : null}
        <Text style={[typography.h1, { color: theme.primary, marginTop: icon ? spacing.sm : 0 }]}>{value}</Text>
        <Text style={[typography.caption, { color: theme.textMuted, marginTop: 2 }]}>{label}</Text>
        {sublabel ? <Text style={[typography.caption, { color: theme.textSecondary, marginTop: 2 }]}>{sublabel}</Text> : null}
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { backgroundColor: theme.cardBg }, shadows.md, style]}>
      {icon ? (
        <LinearGradient colors={GRADIENTS[iconColor]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.icon}>
          <Ionicons name={icon} size={20} color="#fff" />
        </LinearGradient>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={[typography.h2, { color: theme.primary, fontSize: 22 }]}>{value}</Text>
        <Text style={[typography.caption, { color: theme.textMuted, marginTop: 2 }]}>{label}</Text>
        {sublabel ? <Text style={[typography.caption, { color: theme.textSecondary }]}>{sublabel}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.lg,
    padding: spacing.base,
  },
  wrapV: {
    alignItems: 'center',
    borderRadius: radii.lg,
    padding: spacing.base,
    minWidth: 80,
  },
  icon: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  iconV: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
});
