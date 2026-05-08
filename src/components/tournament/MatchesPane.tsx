import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSport } from '../../context/SportContext';
import { navigate } from '../../navigation/navigationRef';
import type { BracketMatch, BracketRound } from '../../types';
import { radii, spacing, typography } from '../../theme';
import { Avatar, EmptyState } from '../ui';

interface Props {
  rounds: BracketRound[] | null;
  /** When true, only show matches involving the given player. */
  mineOnly?: boolean;
  myPlayerId?: string;
  /** Tap handler — fires for matches with both players assigned. */
  onMatchPress?: (matchId: string) => void;
}

interface FlatMatch extends BracketMatch {
  stage: string;
  round: string;
}

/**
 * Flat list of all tournament matches, grouped by stage label.
 * `mineOnly` filters to matches where the current player participates.
 */
export default function MatchesPane({ rounds, mineOnly, myPlayerId, onMatchPress }: Props) {
  const { theme } = useSport();

  const matches = useMemo<FlatMatch[]>(() => {
    if (!rounds) return [];
    const flat: FlatMatch[] = [];
    for (const r of rounds) {
      for (const m of r.matches) {
        flat.push({ ...m, stage: r.stage, round: r.round });
      }
    }
    if (mineOnly && myPlayerId) {
      return flat.filter(m => m.player1?.id === myPlayerId || m.player2?.id === myPlayerId);
    }
    return flat;
  }, [rounds, mineOnly, myPlayerId]);

  if (matches.length === 0) {
    return (
      <View style={{ paddingVertical: spacing.lg }}>
        <EmptyState
          icon={mineOnly ? 'tennisball-outline' : 'list-outline'}
          title={mineOnly ? 'No matches yet' : 'No matches'}
          message={
            mineOnly
              ? "Your matches will show up here once they're scheduled."
              : 'Matches will appear here once the tournament begins.'
          }
        />
      </View>
    );
  }

  return (
    <View style={{ paddingHorizontal: spacing.base, gap: spacing.sm }}>
      {matches.map((m, i) => (
        <MatchCard
          key={m.id ?? i}
          match={m}
          highlightPlayerId={mineOnly ? myPlayerId : undefined}
          onPress={onMatchPress}
        />
      ))}
    </View>
  );
}

function MatchCard({
  match,
  highlightPlayerId,
  onPress,
}: {
  match: FlatMatch;
  highlightPlayerId?: string;
  onPress?: (matchId: string) => void;
}) {
  const { theme } = useSport();
  const p1Won = match.winnerId && match.player1 && match.winnerId === match.player1.id;
  const p2Won = match.winnerId && match.player2 && match.winnerId === match.player2.id;
  const statusColor =
    match.status === 'Completed' ? theme.successGreen
    : match.status === 'InProgress' ? theme.warning
    : theme.border;

  // Tap is only meaningful once both players are assigned.
  const tappable = !!onPress && !!match.id && !!match.player1 && !!match.player2;
  const editable = tappable && match.status !== 'Completed';

  const inner = (
    <View style={[
      styles.card,
      { backgroundColor: theme.cardBg, borderColor: theme.border, borderLeftColor: statusColor },
    ]}>
      <View style={styles.headerRow}>
        <Text style={[typography.overline, { color: theme.accent, fontSize: 9 }]}>
          {match.stage.toUpperCase()} · {match.round}
        </Text>
        <StatusPill status={match.status} />
      </View>

      <Player
        name={match.player1?.name ?? 'TBD'}
        photoUrl={match.player1?.profilePhotoUrl}
        sets={match.player1SetsWon}
        won={!!p1Won}
        mine={!!highlightPlayerId && match.player1?.id === highlightPlayerId}
        playerId={match.player1?.id}
      />
      <View style={[styles.divider, { backgroundColor: theme.divider }]} />
      <Player
        name={match.player2?.name ?? 'TBD'}
        photoUrl={match.player2?.profilePhotoUrl}
        sets={match.player2SetsWon}
        won={!!p2Won}
        mine={!!highlightPlayerId && match.player2?.id === highlightPlayerId}
        playerId={match.player2?.id}
      />

      {match.sets.length > 0 && (
        <View style={[styles.setsRow, { borderTopColor: theme.divider }]}>
          {match.sets.map((s) => (
            <View key={s.setNumber} style={[styles.setCell, { backgroundColor: theme.pageBg, borderColor: theme.border }]}>
              <Text style={[typography.caption, { color: theme.textMuted, fontSize: 9 }]}>S{s.setNumber}</Text>
              <Text style={[typography.smallStrong, { color: theme.textPrimary }]}>
                {s.player1Score}–{s.player2Score}
              </Text>
            </View>
          ))}
        </View>
      )}

      {tappable ? (
        <View style={[styles.tapHint, { borderTopColor: theme.divider }]}>
          <Ionicons
            name={editable ? 'create-outline' : 'eye-outline'}
            size={12}
            color={editable ? theme.accent : theme.textMuted}
          />
          <Text style={[
            typography.overline,
            { color: editable ? theme.accent : theme.textMuted, fontSize: 10 },
          ]}>
            {editable ? 'TAP TO ENTER SCORE' : 'TAP TO VIEW'}
          </Text>
        </View>
      ) : null}
    </View>
  );

  if (!tappable) return inner;
  return (
    <Pressable onPress={() => onPress!(match.id)} style={({ pressed }) => pressed && { opacity: 0.7 }}>
      {inner}
    </Pressable>
  );
}

function StatusPill({ status }: { status: string }) {
  const { theme } = useSport();
  const map = {
    Completed:  { bg: 'rgba(34,197,94,0.14)',  text: '#4ADE80', label: 'FINAL' },
    InProgress: { bg: 'rgba(245,158,11,0.16)', text: '#FCD34D', label: 'LIVE' },
    Scheduled:  { bg: theme.featureBg,         text: theme.accent, label: 'UPCOMING' },
  } as const;
  const m = (map as any)[status] ?? map.Scheduled;
  return (
    <View style={[styles.statusPill, { backgroundColor: m.bg, borderColor: `${m.text}40` }]}>
      {status === 'InProgress' ? <Ionicons name="radio" size={9} color={m.text} /> : null}
      <Text style={[typography.caption, { color: m.text, fontSize: 9, fontWeight: '800', letterSpacing: 0.6 }]}>
        {m.label}
      </Text>
    </View>
  );
}

function Player({
  name, photoUrl, sets, won, mine, playerId,
}: {
  name: string;
  photoUrl?: string;
  sets: number;
  won: boolean;
  mine?: boolean;
  playerId?: string;
}) {
  const { theme } = useSport();
  const nameNode = (
    <Text
      style={[
        { flex: 1, fontSize: 14 },
        won ? { color: theme.accent, fontWeight: '800' } : { color: theme.textPrimary, fontWeight: '500' },
        mine && !won && { color: theme.textPrimary, fontWeight: '700' },
      ]}
      numberOfLines={1}
    >
      {name}{mine ? '  ·  YOU' : ''}
    </Text>
  );
  return (
    <View style={styles.playerRow}>
      {won ? <Ionicons name="trophy" size={13} color={theme.accent} /> : <View style={{ width: 13 }} />}
      <Avatar
        name={name}
        photoUrl={photoUrl}
        size={28}
        playerId={playerId}
        borderColor={won ? theme.accent : undefined}
      />
      {playerId ? (
        <Pressable
          onPress={() => navigate('PlayerProfile', { playerId })}
          hitSlop={4}
          style={{ flex: 1 }}
        >
          {nameNode}
        </Pressable>
      ) : nameNode}
      <Text
        style={[
          { fontSize: 18, width: 28, textAlign: 'right', fontFamily: typography.display.fontFamily, letterSpacing: 0.4 },
          won ? { color: theme.accent } : { color: theme.textMuted },
        ]}
      >
        {sets}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderLeftWidth: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: radii.xs,
    borderWidth: 1,
  },
  divider: { height: 1, marginVertical: spacing.xs + 2 },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 4 },
  setsRow: {
    flexDirection: 'row', gap: spacing.xs,
    paddingTop: spacing.sm, marginTop: spacing.xs,
    borderTopWidth: 1, flexWrap: 'wrap',
  },
  setCell: {
    alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: radii.xs,
    borderWidth: 1,
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    justifyContent: 'flex-end',
  },
});
