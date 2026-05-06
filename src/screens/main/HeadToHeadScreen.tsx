import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { playerApi, type HeadToHead } from '../../api';
import { useSport } from '../../context/SportContext';
import { useFetchData } from '../../hooks/useFetchData';
import { radii, spacing, typography } from '../../theme';
import { Card, EmptyState, LoadingView, SectionHeader } from '../../components/ui';

export default function HeadToHeadScreen({ route }: any) {
  const { playerId, opponentId, opponentName } = route.params;
  const { theme } = useSport();
  const { data, loading } = useFetchData<HeadToHead>(
    async () => (await playerApi.headToHead(playerId, opponentId)).data,
    [playerId, opponentId],
  );

  if (loading || !data) return <LoadingView />;

  const { totalMatches, wins, losses, winRate, recentMatches } = data;

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.primary }} />
      <LinearGradient
        colors={theme.heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.heroTitle}>vs {opponentName ?? 'Opponent'}</Text>
        <View style={styles.tallyRow}>
          <View style={styles.tally}>
            <Text style={[typography.caption, { color: 'rgba(255,255,255,0.7)' }]}>WINS</Text>
            <Text style={[styles.tallyVal, { color: theme.successGreen }]}>{wins}</Text>
          </View>
          <Text style={[typography.caption, { color: 'rgba(255,255,255,0.4)' }]}>–</Text>
          <View style={styles.tally}>
            <Text style={[typography.caption, { color: 'rgba(255,255,255,0.7)' }]}>LOSSES</Text>
            <Text style={[styles.tallyVal, { color: theme.dangerRed }]}>{losses}</Text>
          </View>
        </View>
        <Text style={styles.winRate}>{totalMatches} matches · {winRate.toFixed(0)}% win rate</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: spacing.base }}>
        <Card>
          <SectionHeader title="Recent matchups" icon="time-outline" />
          {recentMatches.length === 0 ? (
            <EmptyState icon="tennisball-outline" title="No matches yet" message="You haven't played this opponent." />
          ) : recentMatches.map((m) => (
            <View
              key={m.id}
              style={[styles.row, { borderLeftColor: m.myWin ? theme.successGreen : theme.dangerRed, borderBottomColor: theme.divider }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyStrong, { color: theme.textPrimary }]} numberOfLines={1}>
                  {m.tournamentName ?? 'Match'}
                </Text>
                <Text style={[typography.caption, { color: theme.textMuted }]}>
                  {[m.sportName, m.date ? new Date(m.date).toLocaleDateString() : null].filter(Boolean).join(' · ')}
                </Text>
              </View>
              <Text style={[typography.h2, { color: m.myWin ? theme.successGreen : theme.dangerRed, fontSize: 20 }]}>
                {m.mySets}–{m.oppSets}
              </Text>
            </View>
          ))}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    padding: spacing.lg, paddingBottom: spacing.xl,
    borderBottomLeftRadius: radii.xxl, borderBottomRightRadius: radii.xxl,
    alignItems: 'center',
  },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: spacing.md },
  tallyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.sm },
  tally: { alignItems: 'center' },
  tallyVal: { fontSize: 44, fontWeight: '900', letterSpacing: -1 },
  winRate: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '500' },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md,
    borderLeftWidth: 3, borderBottomWidth: 1, gap: spacing.md,
  },
});
