import React from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tournamentsApi, type TournamentWinner } from '../../api';
import { useSport } from '../../context/SportContext';
import { useFetchData } from '../../hooks/useFetchData';
import { radii, spacing, typography } from '../../theme';
import { Card, EmptyState, LoadingView, PageHeader } from '../../components/ui';

export default function TournamentWinnersScreen({ route }: any) {
  const { tournamentId, name } = route.params;
  const { theme } = useSport();

  const { data, loading, refreshing, refresh } = useFetchData<TournamentWinner[]>(
    async () => (await tournamentsApi.winners(tournamentId)).data,
    [tournamentId],
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <PageHeader title="Winners" subtitle={name ?? 'Tournament winners'} compact />
      {loading ? <LoadingView /> : (
        <FlatList
          data={data ?? []}
          keyExtractor={(w) => `${w.rank}-${w.playerId}`}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.accent} />}
          contentContainerStyle={{ padding: spacing.base, gap: spacing.sm }}
          ListEmptyComponent={<EmptyState icon="trophy-outline" title="No winners yet" message="Winners will appear once the tournament finishes." />}
          renderItem={({ item: w }) => (
            <Card>
              <View style={styles.row}>
                <View style={[styles.rankBox, { backgroundColor: rankColor(w.rank) }]}>
                  <Ionicons name="trophy" size={18} color="#fff" />
                  <Text style={styles.rankText}>{rankLabel(w.rank)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyStrong, { color: theme.textPrimary }]}>{w.playerName}</Text>
                  {w.prizeAmount ? (
                    <Text style={[typography.caption, { color: theme.successGreen }]}>
                      Prize: ${w.prizeAmount.toFixed(2)}
                    </Text>
                  ) : null}
                </View>
              </View>
            </Card>
          )}
        />
      )}
    </View>
  );
}

function rankLabel(r: number) { return r === 1 ? '1ST' : r === 2 ? '2ND' : r === 3 ? '3RD' : `${r}TH`; }
function rankColor(r: number) { return r === 1 ? '#eab308' : r === 2 ? '#9ca3af' : r === 3 ? '#a16207' : '#64748b'; }

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2 },
  rankBox: {
    width: 64, height: 64, borderRadius: radii.lg,
    alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  rankText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
});
