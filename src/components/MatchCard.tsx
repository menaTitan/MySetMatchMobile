import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { MatchSummary } from '../types';
import type { SportTheme } from '../theme';
import { DEFAULT_THEME, radii, spacing, typography } from '../theme';
import Avatar from './ui/Avatar';
import { navigate } from '../navigation/navigationRef';

interface Props {
  match: MatchSummary;
  theme?: SportTheme;
  onPress?: () => void;
  /** If provided, tapping the opponent name/avatar opens their public profile. */
  onOpponentPress?: (opponentId: string) => void;
  compact?: boolean;
}

export default function MatchCard({ match, theme = DEFAULT_THEME, onPress, onOpponentPress, compact }: Props) {
  const win = match.won;
  const stateColor = win ? theme.successGreen : theme.dangerRed;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        { borderLeftColor: stateColor, backgroundColor: pressed ? theme.pageBgTint : 'transparent' },
      ]}
    >
      <View style={styles.leadCol}>
        <Avatar
          name={match.opponentName}
          photoUrl={match.opponentPhotoUrl}
          size={compact ? 36 : 42}
          playerId={match.opponentId}
          onPress={onOpponentPress ? () => onOpponentPress(match.opponentId) : undefined}
        />
        <View style={[styles.stateBadge, { backgroundColor: stateColor }]}>
          <Text style={styles.stateText}>{win ? 'W' : 'L'}</Text>
        </View>
      </View>
      <View style={styles.info}>
        <Text
          style={[typography.bodyStrong, { color: theme.accent, fontSize: 14.5 }]}
          numberOfLines={1}
          onPress={onOpponentPress
            ? () => onOpponentPress(match.opponentId)
            : () => navigate('PlayerProfile', { playerId: match.opponentId })
          }
        >
          {match.opponentName}
        </Text>
        <Text style={[typography.small, { color: theme.textMuted, fontSize: 12 }]} numberOfLines={1}>
          {match.tournamentName} · {match.stage}
        </Text>
        {match.sportName ? (
          <Text style={[typography.caption, { color: theme.secondary, marginTop: 2 }]}>
            {match.sportName.toUpperCase()}
          </Text>
        ) : null}
      </View>
      <View style={styles.right}>
        <Text style={[typography.h2, { color: win ? theme.successGreen : theme.primary }]}>
          {match.mySets}–{match.opponentSets}
        </Text>
        <Text style={[typography.caption, { color: theme.textMuted }]}>
          {match.date ? new Date(match.date).toLocaleDateString() : ''}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderLeftWidth: 3,
    borderRadius: radii.sm,
    marginBottom: 2,
    gap: spacing.md,
  },
  leadCol: { position: 'relative' },
  stateBadge: {
    position: 'absolute',
    bottom: -2, right: -2,
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  stateText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  info: { flex: 1, minWidth: 0 },
  right: { alignItems: 'flex-end' },
});
