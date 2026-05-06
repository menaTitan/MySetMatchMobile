import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { matchesApi } from '../../api';
import { useSport } from '../../context/SportContext';
import type { BracketRound, BracketMatch } from '../../types';
import { fonts, radii, shadows, spacing, typography } from '../../theme';
import { EmptyState, LoadingView } from '../../components/ui';

export default function BracketsScreen({ route }: any) {
  const { tournamentId } = route.params;
  const { theme } = useSport();
  const [rounds, setRounds] = useState<BracketRound[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    matchesApi.brackets(tournamentId)
      .then((r) => setRounds(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tournamentId]);

  if (loading) return <LoadingView />;
  if (rounds.length === 0) {
    return (
      <View style={[styles.emptyWrap, { backgroundColor: theme.pageBg }]}>
        <EmptyState
          icon="git-branch-outline"
          title="Brackets not ready"
          message="The bracket will appear here once the tournament begins."
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.pageBg }]}
      contentContainerStyle={{ padding: spacing.base, paddingBottom: spacing.xxl }}
    >
      {rounds.map((round, ri) => (
        <View key={`${round.stage}-${round.round}-${ri}`} style={{ marginBottom: spacing.lg }}>
          <LinearGradient
            colors={theme.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.roundHeader}
          >
            <View>
              <Text style={styles.roundStage}>{round.stage.toUpperCase()}</Text>
              <Text style={styles.roundName}>{round.round}</Text>
            </View>
            <View style={styles.roundCount}>
              <Ionicons name="people" size={12} color="#fff" />
              <Text style={styles.roundCountText}>{round.matches.length}</Text>
            </View>
          </LinearGradient>

          {round.matches.map((match, mi) => (
            <MatchCardView key={match.id ?? mi} match={match} />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

function MatchCardView({ match }: { match: BracketMatch }) {
  const { theme } = useSport();
  const p1Won = match.winnerId && match.player1 && match.winnerId === match.player1.id;
  const p2Won = match.winnerId && match.player2 && match.winnerId === match.player2.id;
  const statusColor =
    match.status === 'Completed' ? theme.successGreen
    : match.status === 'InProgress' ? theme.warning
    : theme.border;

  return (
    <View style={[styles.matchCard, { backgroundColor: theme.cardBg, borderLeftColor: statusColor }, shadows.md]}>
      <PlayerLine
        name={match.player1?.name ?? 'TBD'}
        sets={match.player1SetsWon}
        won={!!p1Won}
      />
      <View style={[styles.matchDivider, { backgroundColor: theme.divider }]} />
      <PlayerLine
        name={match.player2?.name ?? 'TBD'}
        sets={match.player2SetsWon}
        won={!!p2Won}
      />
      {match.sets.length > 0 && (
        <View style={[styles.setsRow, { borderTopColor: theme.divider }]}>
          {match.sets.map((s) => (
            <View key={s.setNumber} style={[styles.setCell, { backgroundColor: theme.pageBg }]}>
              <Text style={[typography.caption, { color: theme.textMuted, fontSize: 9 }]}>S{s.setNumber}</Text>
              <Text style={[typography.smallStrong, { color: theme.textPrimary }]}>
                {s.player1Score}–{s.player2Score}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function PlayerLine({ name, sets, won }: { name: string; sets: number; won: boolean }) {
  const { theme } = useSport();
  return (
    <View style={styles.playerRow}>
      {won ? <Ionicons name="trophy" size={14} color={theme.accent} /> : <View style={{ width: 14 }} />}
      <Text
        style={[
          { flex: 1, fontSize: 14 },
          won
            ? { color: theme.primary, fontWeight: '800', fontFamily: fonts.heading700 }
            : { color: theme.textPrimary, fontWeight: '500' },
        ]}
        numberOfLines={1}
      >
        {name}
      </Text>
      <Text
        style={[
          { fontSize: 18, width: 28, textAlign: 'right' },
          won ? { color: theme.primary, fontWeight: '900' } : { color: theme.textMuted, fontWeight: '500' },
        ]}
      >
        {sets}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyWrap: { flex: 1, justifyContent: 'center' },
  roundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
  },
  roundStage: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  roundName: { color: '#fff', fontSize: 16, fontWeight: '800', marginTop: 2 },
  roundCount: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: radii.pill,
  },
  roundCountText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  matchCard: {
    borderRadius: radii.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderLeftWidth: 4,
  },
  matchDivider: { height: 1, marginVertical: spacing.xs + 2 },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 4 },
  setsRow: {
    flexDirection: 'row', gap: spacing.xs, paddingTop: spacing.sm,
    marginTop: spacing.xs, borderTopWidth: 1, flexWrap: 'wrap',
  },
  setCell: {
    alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: radii.xs,
  },
});
