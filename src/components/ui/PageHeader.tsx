import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSport } from '../../context/SportContext';
import { radii, spacing, typography } from '../../theme';

interface Props {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children?: React.ReactNode;
  compact?: boolean;
  /**
   * Show a back chevron in the top-left.
   * - `true`     → uses `navigation.goBack()`
   * - `(fn)`     → custom handler
   * - `false`/omit → no back button (use on tab-root screens)
   * Auto-detects when the parent navigator can go back if not specified.
   */
  back?: boolean | (() => void);
}

/**
 * Pro-sports page header — flat dark slab with an accent slash, sharp
 * bottom divider, and an optional back chevron.
 */
export default function PageHeader({ title, subtitle, right, children, compact, back }: Props) {
  const { theme } = useSport();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const showBack =
    typeof back === 'function'
      ? true
      : back === true
        ? true
        : back === false
          ? false
          : navigation?.canGoBack?.() ?? false;
  const handleBack = typeof back === 'function' ? back : () => navigation.goBack();

  return (
    <LinearGradient
      colors={theme.headerGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.wrap, compact && styles.compact]}
    >
      <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent' }} />
      <View pointerEvents="none" style={[styles.slash, { backgroundColor: theme.accent, opacity: 0.12 }]} />
      <View pointerEvents="none" style={[styles.divider, { backgroundColor: theme.border }]} />

      {showBack ? (
        <Pressable
          onPress={handleBack}
          // Larger hit area so the chevron is forgiving on small targets.
          hitSlop={16}
          style={({ pressed }) => [
            styles.backBtn,
            // Push the button below the safe-area top inset (notch / Dynamic
            // Island). Absolute positioning otherwise ignores the SafeAreaView
            // padding, leaving the chevron partially under the status bar on
            // iPhone X+ — visible but iOS steals touches near the top edge.
            { top: insets.top + spacing.xs },
            { borderColor: theme.border, backgroundColor: 'rgba(255,255,255,0.06)' },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </Pressable>
      ) : null}

      <View style={[styles.row, showBack && { paddingLeft: 36 + spacing.sm }]}>
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
  backBtn: {
    position: 'absolute',
    left: spacing.base,
    top: spacing.lg,
    width: 36, height: 36,
    borderRadius: radii.sm,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 5,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: '#fff' },
  subtitle: {
    ...typography.small,
    color: 'rgba(250,250,250,0.7)',
    marginTop: 4,
  },
});
