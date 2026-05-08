import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSport } from '../../context/SportContext';
import { radii, spacing, typography } from '../../theme';

export type TileTint = 'blue' | 'accent' | 'green' | 'orange' | 'purple' | 'red' | 'sport';

const TINTS: Record<TileTint, string> = {
  blue:   '#38BDF8',
  accent: '#FF5500',
  green:  '#22C55E',
  orange: '#F59E0B',
  purple: '#A78BFA',
  red:    '#EF4444',
  sport:  '#FF5500', // overridden at render with theme.accent
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
 * Pro-sports tile grid — sharp dark cards, monochrome line icons, no drop shadows.
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
  const tint = (tile.tint === 'sport' || !tile.tint) ? theme.accent : TINTS[tile.tint];
  const isCompact = variant === 'compact';

  return (
    <Pressable
      onPress={tile.onPress}
      style={({ pressed }) => [
        isCompact ? styles.tileCompact : styles.tile,
        { backgroundColor: theme.cardBg, borderColor: theme.border },
        pressed && { transform: [{ scale: 0.98 }], borderColor: tint },
      ]}
    >
      {isCompact ? (
        <>
          <Ionicons name={tile.icon} size={22} color={tint} />
          <Text
            style={[
              typography.overline,
              { color: theme.textPrimary, marginTop: spacing.sm, textAlign: 'center', fontSize: 10 },
            ]}
            numberOfLines={2}
          >
            {tile.label}
          </Text>
          {tile.badge ? (
            <View style={[styles.badgeAbsolute, { backgroundColor: theme.accent }]}>
              <Text style={[typography.caption, { color: theme.textInverse, fontWeight: '800', fontSize: 10 }]}>
                {tile.badge}
              </Text>
            </View>
          ) : null}
        </>
      ) : (
        <>
          <View style={styles.iconRow}>
            <Ionicons name={tile.icon} size={24} color={tint} />
            {tile.badge ? (
              <View style={[styles.badge, { backgroundColor: theme.accent }]}>
                <Text style={[typography.caption, { color: theme.textInverse, fontWeight: '800', fontSize: 10 }]}>
                  {tile.badge}
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={[
            typography.h4,
            { color: theme.textPrimary, marginTop: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.6 },
          ]} numberOfLines={1}>
            {tile.label}
          </Text>
          {tile.hint ? (
            <Text style={[typography.small, { color: theme.textMuted, marginTop: 2 }]} numberOfLines={2}>
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
    borderWidth: 1,
    minHeight: 110,
  },
  tileCompact: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 92,
  },
  iconRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radii.sm,
    minWidth: 22, alignItems: 'center',
  },
  badgeAbsolute: {
    position: 'absolute',
    top: 6, right: 6,
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: radii.sm,
    minWidth: 18, alignItems: 'center',
  },
});
