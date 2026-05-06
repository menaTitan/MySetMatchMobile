import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSport } from '../../context/SportContext';
import { radii, shadows, spacing, typography } from '../../theme';

type Variant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger' | 'glass';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  fullWidth?: boolean;
  style?: ViewStyle | ViewStyle[];
  uppercase?: boolean;
}

const SIZE: Record<Size, { padV: number; padH: number; font: number; iconSize: number; height: number }> = {
  sm: { padV: 8,  padH: 14, font: 13, iconSize: 14, height: 36 },
  md: { padV: 12, padH: 20, font: 14, iconSize: 16, height: 46 },
  lg: { padV: 15, padH: 26, font: 15, iconSize: 18, height: 54 },
};

export default function Button({
  title, onPress, variant = 'primary', size = 'md',
  loading, disabled, leftIcon, rightIcon, fullWidth, style, uppercase = true,
}: Props) {
  const { theme } = useSport();
  const s = SIZE[size];
  const isDisabled = disabled || loading;

  const baseInner: ViewStyle = {
    height: s.height,
    paddingHorizontal: s.padH,
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  };

  const labelStyle = {
    ...typography.button,
    fontSize: s.font,
    textTransform: (uppercase ? 'uppercase' : 'none') as any,
    letterSpacing: uppercase ? 0.6 : 0.2,
  };

  const content = (color: string) => (
    <>
      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <>
          {leftIcon && <Ionicons name={leftIcon} size={s.iconSize} color={color} />}
          <Text style={[labelStyle, { color }]} numberOfLines={1}>{title}</Text>
          {rightIcon && <Ionicons name={rightIcon} size={s.iconSize} color={color} />}
        </>
      )}
    </>
  );

  const outerStyle: ViewStyle[] = [
    { borderRadius: radii.md, opacity: isDisabled ? 0.5 : 1 },
    fullWidth ? { alignSelf: 'stretch' } : {},
    ...(Array.isArray(style) ? style : style ? [style] : []),
  ];

  if (variant === 'primary') {
    return (
      <Pressable onPress={onPress} disabled={isDisabled} style={({ pressed }) => [
        outerStyle, { ...shadows.md, shadowColor: theme.primary, shadowOpacity: 0.25 },
        pressed && pressStyle,
      ]}>
        <LinearGradient colors={[theme.secondary, theme.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={baseInner}>
          {content('#fff')}
        </LinearGradient>
      </Pressable>
    );
  }
  if (variant === 'accent') {
    return (
      <Pressable onPress={onPress} disabled={isDisabled} style={({ pressed }) => [
        outerStyle, { ...shadows.md, shadowColor: theme.accent, shadowOpacity: 0.35 },
        pressed && pressStyle,
      ]}>
        <LinearGradient colors={theme.accentGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={baseInner}>
          {content(theme.primary)}
        </LinearGradient>
      </Pressable>
    );
  }
  if (variant === 'secondary') {
    return (
      <Pressable onPress={onPress} disabled={isDisabled} style={({ pressed }) => [
        outerStyle, { backgroundColor: theme.divider }, baseInner, pressed && pressStyle,
      ]}>
        {content(theme.textPrimary)}
      </Pressable>
    );
  }
  if (variant === 'danger') {
    return (
      <Pressable onPress={onPress} disabled={isDisabled} style={({ pressed }) => [
        outerStyle, { ...shadows.md, shadowColor: theme.dangerRed, shadowOpacity: 0.3 },
        pressed && pressStyle,
      ]}>
        <LinearGradient colors={['#EF4444', '#DC2626']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={baseInner}>
          {content('#fff')}
        </LinearGradient>
      </Pressable>
    );
  }
  if (variant === 'glass') {
    return (
      <Pressable onPress={onPress} disabled={isDisabled} style={({ pressed }) => [
        outerStyle,
        { backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)' },
        baseInner,
        pressed && pressStyle,
      ]}>
        {content('#fff')}
      </Pressable>
    );
  }
  // ghost
  return (
    <Pressable onPress={onPress} disabled={isDisabled} style={({ pressed }) => [
      outerStyle, baseInner, pressed && pressStyle,
    ]}>
      {content(theme.primary)}
    </Pressable>
  );
}

const pressStyle = { opacity: 0.85, transform: [{ scale: 0.98 }] };
