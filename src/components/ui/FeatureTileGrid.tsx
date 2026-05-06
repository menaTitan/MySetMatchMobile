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
  /** Tiles per row. Defaults to 2. */
  columns?: number;
}

/**
 * Modern 2-up tile grid mirroring the website's `.feature-card` row —
 * gradient icon circle + label + optional one-line hint + badge.
 * Used for Dashboard quick actions, Profile actions, Admin home, Play hub.
 */
export default function FeatureTileGrid({ tiles, columns = 2 }: Props) {
  return (
    <View style={[styles.grid, { gap: spacing.sm }]}>
      {tiles.map((t) => (
        <View key={t.key} style={{ width: `${100 / columns}%`, padding: spacing.xs }}>
          <FeatureTile tile={t} />
        </View>
      ))}
    </View>
  );
}

function FeatureTile({ tile }: { tile: Tile }) {
  const { theme } = useSport();
  const colors: readonly [string, string] =
    tile.tint === 'sport' || !tile.tint ? theme.headerGradient : GRADIENTS[tile.tint];

  return (
    <Pressable
      onPress={tile.onPress}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: theme.cardBg },
        shadows.card,
        pressed && { transform: [{ scale: 0.97 }] },
      ]}
    >
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
  iconRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBox: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radii.pill,
    minWidth: 22, alignItems: 'center',
  },
});
