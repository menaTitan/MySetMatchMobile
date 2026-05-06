import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSport } from '../../context/SportContext';
import { radii, spacing, typography } from '../../theme';

interface Props {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children?: React.ReactNode;
  compact?: boolean;
}

/**
 * Gradient page header — mirrors .page-header on the website.
 * Renders a 135° secondary→primary gradient with radial orb accents.
 */
export default function PageHeader({ title, subtitle, right, children, compact }: Props) {
  const { theme } = useSport();
  return (
    <LinearGradient
      colors={theme.headerGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.wrap, compact && styles.compact]}
    >
      {/* Decorative radial orb */}
      <View pointerEvents="none" style={[styles.orb, { backgroundColor: theme.accentLight }]} />

      <View style={styles.row}>
        <View style={{ flex: 1, paddingRight: right ? spacing.md : 0 }}>
          <Text style={[typography.h1, styles.title]}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
      {children ? <View style={{ marginTop: spacing.md }}>{children}</View> : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl + 8,
    borderBottomLeftRadius: radii.xxl,
    borderBottomRightRadius: radii.xxl,
    overflow: 'hidden',
  },
  compact: { paddingTop: spacing.base, paddingBottom: spacing.lg },
  orb: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.55,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: '#fff' },
  subtitle: {
    ...typography.small,
    color: 'rgba(255,255,255,0.82)',
    marginTop: 4,
  },
});
