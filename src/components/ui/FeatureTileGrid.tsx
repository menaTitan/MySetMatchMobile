import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSport } from '../../context/SportContext';
import { radii, shadows, spacing, typography } from '../../theme';

export type TileTint = 'blue' | 'accent' | 'green' | 'orange' | 'purple' | 'red' | 'sport';

const GRADIENTS: Record<TileTint, readonly [string, string]> = {
  blue:   ['#2B4C8C', '#1A365D'],
  accent: ['#FF9F1C', '#C87A00'],
  green:  ['#22c55e', '#16a34a'],
  orange: ['#f59e0b', '#d97706'],
  purple: ['#8b5cf6', '#7c3aed'],
  red:    ['#ef4444', '#dc2626'],
  sport:  ['#000', '#000'], // overridden at render with theme.headerGradient
};

export interface Tile {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint?: string;
  badge?: string;
  tint?: TileTint;
  onPress: () => void;
}

interface Props {
  tiles: Tile[];
  /** Tiles per row. Defaults to 2 (standard) or 4 (compact). */
  columns?: number;
  /**
   * "standard": tall card, icon + label + hint (default — Profile/Admin home).
   * "compact":  square tile, centered icon + label, no hint (Dashboard quick actions).
   */
  variant?: 'standard' | 'compact';
}

/**
 * Modern tile grid — gradient icon + label + optional hint + badge.
 *
 * - `standard`: 2-up cards with hints (Profile, Admin home)
 * - `compact`: 4-up centered tiles, no hint (Dashboard quick actions row)
 */
export default function FeatureTileGrid({ tiles, columns, variant = 'standard' }: Props) {
  const cols = columns ?? (variant === 'compact' ? 4 : 2);
  return (
    <View style={[styles.grid, { gap: spacing.sm }]}>
      {tiles.map((t) => (
        <View key={t.key} style={{ width: `${100 / cols}%`, padding: spacing.xs }}>
          <FeatureTile tile={t} variant={variant} />
        </View>
      ))}
    </View>
  );
}

function FeatureTile({ tile, variant }: { tile: Tile; variant: 'standard' | 'compact' }) {
  const { theme } = useSport();
  const colors: readonly [string, string] =
    tile.tint === 'sport' || !tile.tint ? theme.headerGradient : GRADIENTS[tile.tint];

  const isCompact = variant === 'compact';

  return (
    <Pressable
      onPress={tile.onPress}
      style={({ pressed }) => [
        isCompact ? styles.tileCompact : styles.tile,
        { backgroundColor: theme.cardBg },
        shadows.card,
        pressed && { transform: [{ scale: 0.97 }] },
      ]}
    >
      {isCompact ? (
        <>
          <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconBoxCompact}
          >
            <Ionicons name={tile.icon} size={20} color="#fff" />
          </LinearGradient>
          <Text
            style={[typography.caption, { color: theme.textPrimary, fontWeight: '700', marginTop: spacing.xs + 2, textAlign: 'center' }]}
            numberOfLines={2}
          >
            {tile.label}
          </Text>
          {tile.badge ? (
            <View style={[styles.badgeAbsolute, { backgroundColor: theme.accent }]}>
              <Text style={[typography.caption, { color: theme.primary, fontWeight: '800', fontSize: 10 }]}>
                {tile.badge}
              </Text>
            </View>
          ) : null}
        </>
      ) : (
        <>
          <View style={styles.iconRow}>
            <LinearGradient
              colors={colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconBox}
            >
              <Ionicons name={tile.icon} size={22} color="#fff" />
            </LinearGradient>
            {tile.badge ? (
              <View style={[styles.badge, { backgroundColor: theme.accent }]}>
                <Text style={[typography.caption, { color: theme.primary, fontWeight: '800', fontSize: 10 }]}>
                  {tile.badge}
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={[typography.bodyStrong, { color: theme.textPrimary, marginTop: spacing.sm }]} numberOfLines={1}>
            {tile.label}
          </Text>
          {tile.hint ? (
            <Text style={[typography.caption, { color: theme.textMuted, marginTop: 2 }]} numberOfLines={2}>
              {tile.hint}
            </Text>
          ) : null}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  tile: {
    flex: 1,
    padding: spacing.base,
    borderRadius: radii.lg,
    minHeight: 110,
  },
  tileCompact: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 92,
  },
  iconRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBox: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  iconBoxCompact: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radii.pill,
    minWidth: 22, alignItems: 'center',
  },
  badgeAbsolute: {
    position: 'absolute',
    top: 6, right: 6,
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: radii.pill,
    minWidth: 18, alignItems: 'center',
  },
});
