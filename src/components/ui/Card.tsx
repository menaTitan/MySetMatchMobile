import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { useSport } from '../../context/SportContext';
import { radii, shadows, spacing } from '../../theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  padding?: keyof typeof spacing | 0;
  /** "card" matches the website's signature shadow (0 10px 30px). */
  elevation?: 'none' | 'sm' | 'md' | 'lg' | 'card';
  onPress?: () => void;
  radius?: keyof typeof radii;
  borderLeftColor?: string;
}

export default function Card({
  children,
  style,
  padding = 'lg',
  elevation = 'card',
  onPress,
  radius = 'xl',
  borderLeftColor,
}: Props) {
  const { theme } = useSport();
  const pad = padding === 0 ? 0 : spacing[padding];
  const inner: ViewStyle = {
    backgroundColor: theme.cardBg,
    borderRadius: radii[radius],
    padding: pad,
    ...(elevation !== 'none' ? shadows[elevation] : {}),
    ...(borderLeftColor ? { borderLeftWidth: 4, borderLeftColor } : {}),
  };
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [inner, style, pressed && styles.pressed]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[inner, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
});
