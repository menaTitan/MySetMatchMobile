import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { matchesApi } from '../../api';
import { useSport } from '../../context/SportContext';
import type { MatchDetail } from '../../types';
import { useFetchData } from '../../hooks/useFetchData';
import SportPickerBar from '../../components/SportPickerBar';
import { radii, shadows, spacing, typography } from '../../theme';
import { Card, EmptyState, LoadingView, PageHeader } from '../../components/ui';

const POLL_MS = 8_000;

export default function LiveScoreScreen() {
  const { currentSport, theme } = useSport();
  const { data, loading, refreshing, refresh, reload } = useFetchData<MatchDetail[]>(
    async () => (await matchesApi.live({ sportId: currentSport?.id })).data,
    [currentSport?.id],
  );
  const matches = data ?? [];

  // Background refresh while the screen is focused (quiet reload, no spinner).
  useEffect(() => {
    const t = setInterval(reload, POLL_MS);
    return () => clearInterval(t);
  }, [reload]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <PageHeader
        title="Live Scores"
        subtitle="Matches in progress right now"
        compact
        right={
          <View style={[styles.livePill, { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)' }]}>
            <View style={[styles.pulseDot, { backgroundColor: theme.accent }]} />
            <Text style={styles.livePillText}>LIVE · {matches.length}</Text>
          </View>
        }
      />
      <SportPickerBar />

      {loading ? <LoadingView /> : (
        <FlatList
          data={matches}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <LiveMatchRow m={item} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.accent} />
          }
          contentContainerStyle={{ padding: spacing.base, gap: spacing.sm }}
          ListEmptyComponent={
            <EmptyState
              icon="radio-outline"
              title="No live matches"
              message="When matches are in progress, they'll appear here in real time."
            />
          }
        />
      )}
    </View>
  );
}

function LiveMatchRow({ m }: { m: MatchDetail }) {
  const { theme } = useSport();
  const p1Sets = m.player1SetsWon;
  const p2Sets = m.player2SetsWon;
  const p1Leading = p1Sets > p2Sets;
  const p2Leading = p2Sets > p1Sets;

  return (
    <Card padding="base" borderLeftColor={theme.warning}>
      <View style={styles.topRow}>
        <View style={[styles.badge, { backgroundColor: 'rgba(245,158,11,0.15)' }]}>
          <View style={[styles.pulseDot, { backgroundColor: theme.warning }]} />
          <Text style={[typography.caption, { color: '#b45309', fontWeight: '800' }]}>LIVE</Text>
        </View>
        {m.sportName ? (
          <Text style={[typography.caption, { color: theme.secondary, fontWeight: '700' }]}>
            {m.sportName.toUpperCase()}
          </Text>
        ) : null}
      </View>

      <View style={styles.matchRow}>
        <PlayerCol name={m.player1?.name ?? 'TBD'} sets={p1Sets} leading={p1Leading} />
        <Text style={[typography.caption, { color: theme.textMuted, marginHorizontal: spacing.sm }]}>VS</Text>
        <PlayerCol name={m.player2?.name ?? 'TBD'} sets={p2Sets} leading={p2Leading} align="right" />
      </View>

      {m.sets && m.sets.length > 0 ? (
        <View style={[styles.setsRow, { borderTopColor: theme.divider }]}>
          {m.sets.map((s) => (
            <View key={s.setNumber} style={[styles.setCell, { backgroundColor: theme.pageBg }]}>
              <Text style={[typography.caption, { color: theme.textMuted, fontSize: 9 }]}>S{s.setNumber}</Text>
              <Text style={[typography.smallStrong, { color: theme.textPrimary }]}>
                {s.player1Score}–{s.player2Score}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.footer}>
        <Ionicons name="trophy-outline" size={11} color={theme.textMuted} />
        <Text style={[typography.caption, { color: theme.textMuted }]} numberOfLines={1}>
          {m.tournamentName} · {m.stage}
        </Text>
      </View>
    </Card>
  );
}

function PlayerCol({
  name, sets, leading, align,
}: { name: string; sets: number; leading: boolean; align?: 'left' | 'right' }) {
  const { theme } = useSport();
  return (
    <View style={{ flex: 1, alignItems: align === 'right' ? 'flex-end' : 'flex-start' }}>
      <Text
        style={[
          typography.bodyStrong,
          { color: leading ? theme.primary : theme.textPrimary, fontSize: 14 },
        ]}
        numberOfLines={1}
      >
        {name}
      </Text>
      <Text style={{ fontSize: 32, fontWeight: '900', color: leading ? theme.primary : theme.textMuted, letterSpacing: -0.5 }}>
        {sets}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  livePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: radii.pill, borderWidth: 1,
  },
  livePillText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  pulseDot: { width: 6, height: 6, borderRadius: 3 },

  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radii.pill,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  matchRow: { flexDirection: 'row', alignItems: 'center' },
  setsRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    paddingTop: spacing.sm, marginTop: spacing.sm,
    borderTopWidth: 1,
  },
  setCell: {
    alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: radii.xs,
  },
  footer: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: spacing.sm + 2,
  },
});
