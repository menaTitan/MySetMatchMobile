import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSport } from '../../context/SportContext';
import type { Player } from '../../types';
import { radii, spacing, typography } from '../../theme';
import { Avatar, EmptyState } from '../ui';

interface Props {
  players: Player[];
  onOpenPlayer?: (id: string) => void;
}

export default function PlayersPane({ players, onOpenPlayer }: Props) {
  const { theme } = useSport();

  if (!players || players.length === 0) {
    return (
      <View style={{ paddingVertical: spacing.lg }}>
        <EmptyState icon="people-outline" title="No players yet" message="Registrations will appear here." />
      </View>
    );
  }

  return (
    <View style={{ paddingHorizontal: spacing.base }}>
      <Text style={[
        typography.overline,
        { color: theme.textMuted, marginBottom: spacing.sm },
      ]}>
        {players.length} {players.length === 1 ? 'PLAYER' : 'PLAYERS'} REGISTERED
      </Text>
      {players.map((p, i) => {
        const inner = (
          <View
            style={[
              styles.row,
              {
                backgroundColor: theme.cardBg,
                borderColor: theme.border,
                marginTop: i === 0 ? 0 : spacing.xs + 2,
              },
            ]}
          >
            <Avatar name={p.name} photoUrl={p.profilePhotoUrl} size={40} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[typography.bodyStrong, { color: theme.textPrimary }]} numberOfLines={1}>
                {p.name}
              </Text>
              {(() => {
                // Avoid a stray leading comma when the player has a country
                // but no city (or vice versa).
                const parts = [p.city, p.country].filter((s) => !!s && s.trim().length > 0);
                if (parts.length === 0) return null;
                return (
                  <Text style={[typography.caption, { color: theme.textMuted }]} numberOfLines={1}>
                    {parts.join(', ')}
                  </Text>
                );
              })()}
            </View>
            <View style={[styles.ratingPill, { backgroundColor: theme.featureBg, borderColor: `${theme.accent}40` }]}>
              <Text style={[typography.smallStrong, { color: theme.accent, fontFamily: typography.display.fontFamily, fontSize: 16, letterSpacing: 0.4 }]}>
                {p.globalRating}
              </Text>
            </View>
          </View>
        );
        if (!onOpenPlayer) return <View key={p.id}>{inner}</View>;
        return (
          <Pressable
            key={p.id}
            onPress={() => onOpenPlayer(p.id)}
            style={({ pressed }) => pressed && { opacity: 0.7 }}
          >
            {inner}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    padding: spacing.sm + 4,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  ratingPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.sm,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 56,
  },
});
