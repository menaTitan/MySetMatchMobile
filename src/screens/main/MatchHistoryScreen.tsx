import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { playerApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useSport } from '../../context/SportContext';
import type { MatchSummary } from '../../types';
import SportPickerBar from '../../components/SportPickerBar';
import { radii, spacing, typography } from '../../theme';
import { Card, Chip, EmptyState, LoadingView, PageHeader } from '../../components/ui';

const PAGE = 30;

export default function MatchHistoryScreen({ route, navigation }: any) {
  const { theme, currentSport } = useSport();
  const { player } = useAuth();
  const playerId = route?.params?.playerId ?? player?.id;
  const [items, setItems] = useState<MatchSummary[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'won' | 'lost'>('all');

  async function load(p = 1, replace = false) {
    if (!playerId) return;
    try {
      const { data } = await playerApi.matchHistory(playerId, {
        page: p, pageSize: PAGE, sportId: currentSport?.id,
      });
      setTotal(data.total);
      setItems((prev) => replace ? data.items : [...prev, ...data.items]);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }

  useEffect(() => { setLoading(true); setPage(1); load(1, true); }, [playerId, currentSport?.id]);

  const filtered = items.filter((m) => filter === 'all' ? true : filter === 'won' ? m.won : !m.won);

  if (loading) return <LoadingView />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <PageHeader title="Match History" subtitle={`${total} matches`} compact />
      <SportPickerBar />
      <View style={styles.tabs}>
        {(['all', 'won', 'lost'] as const).map((t) => (
          <Chip
            key={t}
            label={t.toUpperCase()}
            color={filter === t ? 'primary' : 'muted'}
            variant={filter === t ? 'solid' : 'soft'}
            onPress={() => setFilter(t)}
          />
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: spacing.base, gap: spacing.sm, paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setPage(1); load(1, true); }} tintColor={theme.accent} />}
        onEndReached={() => {
          if (items.length < total) { const next = page + 1; setPage(next); load(next, false); }
        }}
        ListEmptyComponent={<EmptyState icon="trophy-outline" title="No matches yet" />}
        renderItem={({ item: m }) => (
          <Pressable onPress={() => navigation.navigate('PlayerProfile', { playerId: m.opponentId })}>
            <Card padding="base" borderLeftColor={m.won ? theme.successGreen : theme.dangerRed}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyStrong, { color: theme.textPrimary }]} numberOfLines={1}>
                    vs {m.opponentName}
                  </Text>
                  <Text style={[typography.caption, { color: theme.textMuted }]} numberOfLines={1}>
                    {m.tournamentName} · {m.stage}
                  </Text>
                  {m.date && (
                    <Text style={[typography.caption, { color: theme.textMuted }]}>
                      {new Date(m.date).toLocaleDateString()}
                    </Text>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[typography.bodyStrong, { color: m.won ? theme.successGreen : theme.dangerRed, fontSize: 18 }]}>
                    {m.mySets} – {m.opponentSets}
                  </Text>
                  <Text style={[typography.caption, { color: m.won ? theme.successGreen : theme.dangerRed, fontWeight: '800' }]}>
                    {m.won ? 'WIN' : 'LOSS'}
                  </Text>
                </View>
              </View>
            </Card>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 6, padding: spacing.base, paddingTop: spacing.sm, paddingBottom: 0 },
  row: { flexDirection: 'row', alignItems: 'center' },
});
