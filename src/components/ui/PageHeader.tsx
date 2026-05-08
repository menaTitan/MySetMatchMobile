import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSport } from '../../context/SportContext';
import { spacing, typography } from '../../theme';

interface Props {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children?: React.ReactNode;
  compact?: boolean;
}

/**
 * Pro-sports page header — flat dark slab with an accent slash and sharp
 * bottom divider. No soft curves.
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
      <View pointerEvents="none" style={[styles.slash, { backgroundColor: theme.accent, opacity: 0.12 }]} />
      <View pointerEvents="none" style={[styles.divider, { backgroundColor: theme.border }]} />

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
    overflow: 'hidden',
  },
  compact: { paddingTop: spacing.base, paddingBottom: spacing.lg },
  slash: {
    position: 'absolute',
    width: 600, height: 1.5,
    top: '40%',
    left: -100,
    transform: [{ rotate: '-10deg' }],
  },
  divider: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 1,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: '#fff' },
  subtitle: {
    ...typography.small,
    color: 'rgba(250,250,250,0.7)',
    marginTop: 4,
  },
});
