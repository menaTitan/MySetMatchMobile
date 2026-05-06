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
    primary: { solidBg: theme.primary,   softBg: theme.featureBg,     text: theme.secondary,  solidText: '#fff' },
    accent:  { solidBg: theme.accent,    softBg: theme.accentLight,   text: theme.accentDark, solidText: theme.primary },
    success: { solidBg: theme.successGreen, softBg: 'rgba(34,197,94,0.12)', text: '#16a34a', solidText: '#fff' },
    danger:  { solidBg: theme.dangerRed, softBg: 'rgba(239,68,68,0.12)', text: '#dc2626', solidText: '#fff' },
    warning: { solidBg: theme.warning,   softBg: 'rgba(245,158,11,0.15)', text: '#b45309', solidText: '#fff' },
    muted:   { solidBg: theme.textMuted, softBg: theme.divider,          text: theme.textSecondary, solidText: '#fff' },
  }[color];

  const useSolid = variant === 'solid' || active;
  const bg = variant === 'ghost' ? 'transparent'
           : variant === 'outline' ? 'transparent'
           : useSolid ? palette.solidBg : palette.softBg;
  const textColor = useSolid && variant !== 'ghost' && variant !== 'outline' ? palette.solidText : palette.text;
  const border = variant === 'outline' ? { borderWidth: 1.5, borderColor: palette.solidBg } : {};

  const pad = size === 'sm'
    ? { paddingVertical: 4, paddingHorizontal: 10 }
    : { paddingVertical: 6, paddingHorizontal: 14 };

  const inner = (
    <View style={[styles.row, pad, { backgroundColor: bg, borderRadius: radii.pill }, border, style]}>
      {leadingEmoji ? <Text style={styles.emoji}>{leadingEmoji}</Text> : null}
      {icon ? <Ionicons name={icon} size={size === 'sm' ? 12 : 14} color={textColor} /> : null}
      <Text style={[size === 'sm' ? styles.labelSm : styles.labelMd, { color: textColor }]}>{label}</Text>
    </View>
  );

  if (onPress) return <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.7 }}>{inner}</Pressable>;
  return inner;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  emoji: { fontSize: 12 },
  labelMd: { ...typography.smallStrong, fontSize: 12.5, lineHeight: 16 },
  labelSm: { ...typography.caption, fontSize: 11, fontWeight: '700' },
});
