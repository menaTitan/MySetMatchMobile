import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSport } from '../../context/SportContext';
import { radii, spacing, typography } from '../../theme';

interface Props {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  leadingEmoji?: string;
  variant?: 'solid' | 'soft' | 'outline' | 'ghost';
  color?: 'primary' | 'accent' | 'success' | 'danger' | 'warning' | 'muted';
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export default function Chip({
  label, active, onPress, icon, leadingEmoji,
  variant = 'soft', color = 'primary', size = 'md', style,
}: Props) {
  const { theme } = useSport();

  const palette = {
    primary: { solidBg: theme.accent,        softBg: theme.accentLight,           text: theme.accent,    solidText: theme.textInverse },
    accent:  { solidBg: theme.accent,        softBg: theme.accentLight,           text: theme.accent,    solidText: theme.textInverse },
    success: { solidBg: theme.successGreen,  softBg: 'rgba(34,197,94,0.14)',      text: '#4ADE80',       solidText: '#0F1B12' },
    danger:  { solidBg: theme.dangerRed,     softBg: 'rgba(239,68,68,0.16)',      text: '#FCA5A5',       solidText: '#1B0F0F' },
    warning: { solidBg: theme.warning,       softBg: 'rgba(245,158,11,0.16)',     text: '#FCD34D',       solidText: '#1B1305' },
    muted:   { solidBg: theme.borderStrong,  softBg: theme.cardBg,                text: theme.textSecondary, solidText: theme.textPrimary },
  }[color];

  const useSolid = variant === 'solid' || active;
  const bg = variant === 'ghost' ? 'transparent'
           : variant === 'outline' ? 'transparent'
           : useSolid ? palette.solidBg : palette.softBg;
  const textColor = useSolid && variant !== 'ghost' && variant !== 'outline' ? palette.solidText : palette.text;
  const border =
    variant === 'outline' ? { borderWidth: 1, borderColor: palette.solidBg } :
    variant === 'soft'    ? { borderWidth: 1, borderColor: `${palette.text}40` } :
    {};

  const pad = size === 'sm'
    ? { paddingVertical: 3, paddingHorizontal: 8 }
    : { paddingVertical: 5, paddingHorizontal: 12 };

  const inner = (
    <View style={[styles.row, pad, { backgroundColor: bg, borderRadius: radii.xs }, border, style]}>
      {leadingEmoji ? <Text style={styles.emoji}>{leadingEmoji}</Text> : null}
      {icon ? <Ionicons name={icon} size={size === 'sm' ? 11 : 13} color={textColor} /> : null}
      <Text style={[
        size === 'sm' ? styles.labelSm : styles.labelMd,
        { color: textColor, textTransform: 'uppercase', letterSpacing: 0.6 },
      ]}>{label}</Text>
    </View>
  );

  if (onPress) return <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.7 }}>{inner}</Pressable>;
  return inner;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  emoji: { fontSize: 12 },
  labelMd: { ...typography.caption, fontSize: 11, fontWeight: '700' },
  labelSm: { ...typography.caption, fontSize: 10, fontWeight: '700' },
});
