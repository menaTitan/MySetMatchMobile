import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSport } from '../../context/SportContext';
import { radii, spacing, typography } from '../../theme';

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
 * Unified gradient hero header for primary screens.
 * Replaces the bespoke LinearGradient blocks scattered across Dashboard/Profile/etc.
 */
export default function HeroHeader({
  title,
  subtitle,
  eyebrow,
  right,
  children,
  variant = 'standard',
  align = 'left',
  rounded = true,
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
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.primary }} />
      <LinearGradient
        colors={theme.heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.wrap,
          { paddingTop: padTop, paddingBottom: padBottom },
          rounded && styles.rounded,
        ]}
      >
        <View pointerEvents="none" style={[styles.orb, styles.orbA, { backgroundColor: theme.accentLight }]} />
        <View pointerEvents="none" style={[styles.orb, styles.orbB, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />

        {(title || right || eyebrow) && (
          <View style={[styles.row, align === 'center' && styles.rowCenter]}>
            <View style={{ flex: align === 'center' ? undefined : 1, paddingRight: right ? spacing.md : 0 }}>
              {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
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
  rounded: {
    borderBottomLeftRadius: radii.xxl,
    borderBottomRightRadius: radii.xxl,
  },
  orb: { position: 'absolute', borderRadius: 999 },
  orbA: { width: 240, height: 240, top: -80, right: -60, opacity: 0.9 },
  orbB: { width: 160, height: 160, bottom: -40, left: -30 },

  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowCenter: { justifyContent: 'center' },

  eyebrow: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    letterSpacing: 1.4,
    fontFamily: typography.overline.fontFamily,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: { color: '#fff' },
  subtitle: {
    ...typography.small,
    color: 'rgba(255,255,255,0.82)',
    marginTop: 4,
  },
});
