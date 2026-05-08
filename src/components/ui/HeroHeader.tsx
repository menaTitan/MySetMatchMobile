import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSport } from '../../context/SportContext';
import { spacing, typography } from '../../theme';

interface Props {
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  right?: React.ReactNode;
  children?: React.ReactNode;
  variant?: 'standard' | 'compact' | 'tall';
  align?: 'left' | 'center';
  rounded?: boolean;
  style?: ViewStyle;
}

/**
 * Pro-sports hero — flat near-black base with a subtle sport-tinted wash,
 * a sharp accent slash for implied motion, no soft curves.
 */
export default function HeroHeader({
  title,
  subtitle,
  eyebrow,
  right,
  children,
  variant = 'standard',
  align = 'left',
  /* `rounded` retained for back-compat — ignored in the dark redesign. */
  rounded: _rounded = true,
  style,
}: Props) {
  const { theme } = useSport();

  const padTop =
    variant === 'tall' ? spacing.lg :
    variant === 'compact' ? spacing.sm : spacing.base;
  const padBottom =
    variant === 'tall' ? spacing.xxl :
    variant === 'compact' ? spacing.lg : spacing.xl;

  return (
    <View style={style}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.pageBg }} />
      <LinearGradient
        colors={theme.heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.wrap, { paddingTop: padTop, paddingBottom: padBottom }]}
      >
        {/* Diagonal accent slash — replaces the orb/blob ornaments. */}
        <View pointerEvents="none" style={[styles.slash, { backgroundColor: theme.accent, opacity: 0.10 }]} />
        <View pointerEvents="none" style={[styles.slashThin, { backgroundColor: theme.accent, opacity: 0.18 }]} />
        <View pointerEvents="none" style={[styles.divider, { backgroundColor: theme.border }]} />

        {(title || right || eyebrow) && (
          <View style={[styles.row, align === 'center' && styles.rowCenter]}>
            <View style={{ flex: align === 'center' ? undefined : 1, paddingRight: right ? spacing.md : 0 }}>
              {eyebrow ? (
                <Text style={[styles.eyebrow, { color: theme.accent }]}>{eyebrow}</Text>
              ) : null}
              {title ? (
                <Text style={[
                  variant === 'tall' ? typography.display : typography.h1,
                  styles.title,
                  align === 'center' && { textAlign: 'center' },
                ]}>
                  {title}
                </Text>
              ) : null}
              {subtitle ? (
                <Text style={[
                  styles.subtitle,
                  align === 'center' && { textAlign: 'center' },
                ]}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
            {right}
          </View>
        )}

        {children ? (
          <View style={{ marginTop: title || eyebrow ? spacing.base : 0, zIndex: 2 }}>
            {children}
          </View>
        ) : null}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    overflow: 'hidden',
  },
  slash: {
    position: 'absolute',
    width: 600, height: 1.5,
    top: '30%',
    left: -100,
    transform: [{ rotate: '-10deg' }],
  },
  slashThin: {
    position: 'absolute',
    width: 600, height: 0.5,
    top: '60%',
    right: -100,
    transform: [{ rotate: '-10deg' }],
  },
  divider: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
  },

  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowCenter: { justifyContent: 'center' },

  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.6,
    fontFamily: typography.overline.fontFamily,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: { color: '#fff' },
  subtitle: {
    ...typography.small,
    color: 'rgba(250,250,250,0.7)',
    marginTop: 4,
  },
});
