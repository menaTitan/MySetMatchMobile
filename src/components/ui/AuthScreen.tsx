import React from 'react';
import { Image, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { DEFAULT_THEME, radii, spacing, typography } from '../../theme';
import KeyboardAware from './KeyboardAware';

interface Props {
  title: string;
  subtitle?: string;
  /** Show the marketing badge + logo + app name (Login + Register only). */
  showBranding?: boolean;
  /** Optional Ionicon shown in a circle above the title — used for Forgot/Reset/Confirm. */
  icon?: keyof typeof Ionicons.glyphMap;
  iconTone?: 'accent' | 'success' | 'danger';
  /** Render a back button (top-left, over gradient). */
  onBack?: () => void;
  /** Footer line below the card (e.g. "By continuing you agree…"). */
  footer?: React.ReactNode;
  children: React.ReactNode;
  style?: ViewStyle;
}

const T = DEFAULT_THEME;

/**
 * Shared shell for auth screens — pro-sports dark base, faint sport-tinted
 * gradient wash, dark surface card, cyber-accent ornaments.
 */
export default function AuthScreen({
  title, subtitle, showBranding, icon, iconTone = 'accent', onBack, footer, children, style,
}: Props) {
  const iconBg =
    iconTone === 'success' ? 'rgba(34,197,94,0.15)' :
    iconTone === 'danger'  ? 'rgba(239,68,68,0.15)' :
    T.accentLight;
  const iconColor =
    iconTone === 'success' ? T.successGreen :
    iconTone === 'danger'  ? T.dangerRed :
    T.accent;

  return (
    <LinearGradient
      colors={T.heroGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[{ flex: 1 }, style]}
    >
      <View pointerEvents="none" style={[styles.orb, styles.orbA, { backgroundColor: T.accentLight }]} />
      <View pointerEvents="none" style={[styles.orb, styles.orbB, { backgroundColor: 'rgba(255,255,255,0.025)' }]} />

      {/* Diagonal slash — implied motion against the dark base. */}
      <View pointerEvents="none" style={[styles.slash, { backgroundColor: T.accent, opacity: 0.06 }]} />

      {onBack ? (
        <Pressable onPress={onBack} style={styles.back} hitSlop={10}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      ) : null}

      <KeyboardAware contentContainerStyle={styles.scroll} extraScroll={60}>
        {showBranding ? (
          <View style={styles.logoArea}>
            <View style={styles.logoBox}>
              <Image source={require('../../../assets/icon.png')} style={styles.logoImg} resizeMode="contain" />
            </View>
            <Text style={styles.badge}>
              <Ionicons name="flash" size={11} color={T.accent} /> MULTI-SPORT PLATFORM
            </Text>
            <Text style={styles.appName}>MySetMatch</Text>
            <Text style={styles.tagline}>Compete. Connect. Climb the ranks.</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          {icon ? (
            <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
              <Ionicons name={icon} size={28} color={iconColor} />
            </View>
          ) : null}
          <Text style={[
            typography.h1,
            { color: T.textPrimary, textAlign: 'center', marginBottom: subtitle ? 4 : spacing.lg },
          ]}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[typography.small, { color: T.textSecondary, textAlign: 'center', marginBottom: spacing.xl }]}>
              {subtitle}
            </Text>
          ) : null}
          {children}
        </View>

        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAware>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg, paddingTop: spacing.xxxl, paddingBottom: spacing.xxxl },
  orb: { position: 'absolute', borderRadius: 999 },
  orbA: { width: 320, height: 320, top: -100, right: -80, opacity: 0.7 },
  orbB: { width: 260, height: 260, bottom: -60, left: -80 },
  slash: {
    position: 'absolute',
    width: 600, height: 2,
    top: '40%',
    left: -100,
    transform: [{ rotate: '-12deg' }],
  },

  logoArea: { alignItems: 'center', marginBottom: spacing.xl },
  logoBox: {
    width: 88, height: 88, borderRadius: radii.lg,
    backgroundColor: T.cardBg,
    borderWidth: 1, borderColor: T.border,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
    shadowColor: T.accent, shadowOpacity: 0.55, shadowRadius: 24, elevation: 10,
  },
  logoImg: { width: 58, height: 58 },
  badge: {
    ...typography.overline,
    fontSize: 10,
    color: T.accent,
    backgroundColor: T.accentLight,
    borderWidth: 1, borderColor: T.accent,
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: radii.sm,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  appName: {
    color: '#fff',
    fontSize: 44,
    letterSpacing: 1.5,
    fontFamily: typography.display.fontFamily,
    textTransform: 'uppercase',
  },
  tagline: {
    color: T.textSecondary,
    fontSize: 13,
    marginTop: 4,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontFamily: typography.body.fontFamily,
  },

  card: {
    backgroundColor: T.cardBg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: T.border,
    padding: spacing.xl,
  },
  iconCircle: {
    width: 64, height: 64, borderRadius: 32,
    alignSelf: 'center',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  back: {
    position: 'absolute',
    top: spacing.xxl + 8,
    left: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 10,
  },
  backText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  footer: { marginTop: spacing.xl, alignItems: 'center' },
});
