import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable } from 'react-native';
import { adminApi, type AdminTournamentRow } from '../../api';
import { useSport } from '../../context/SportContext';
import { radii, spacing, typography } from '../../theme';
import { Card, Chip, EmptyState, LoadingView, PageHeader } from '../../components/ui';

export default function AdminTournamentsScreen({ navigation }: any) {
  const { theme } = useSport();
  const [items, setItems] = useState<AdminTournamentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try { const { data } = await adminApi.tournaments(); setItems(data); }
    catch {} finally { setLoading(false); setRefreshing(false); }
  }
  useEffect(() => { load(); }, []);

  if (loading) return <LoadingView />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <PageHeader title="All Tournaments" subtitle={`${items.length} total`} compact />
      <FlatList
        data={items}
        keyExtractor={(t) => t.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={theme.accent} />}
        contentContainerStyle={{ padding: spacing.base, gap: spacing.sm }}
        renderItem={({ item: t }) => (
          <Pressable onPress={() => navigation.navigate('TournamentDetail', { id: t.id })}>
            <Card>
              <Text style={[typography.bodyStrong, { color: theme.textPrimary }]}>{t.name}</Text>
              <Text style={[typography.caption, { color: theme.textMuted, marginTop: 2 }]}>
                {t.organizerName ?? '—'} · {new Date(t.startDate).toLocaleDateString()}
              </Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                <Chip label={t.status} color={t.status === 'Completed' ? 'success' : 'primary'} variant="soft" size="sm" />
                {t.sportName && <Chip label={t.sportName} color="muted" variant="soft" size="sm" />}
                <Chip label={`${t.registeredCount}${t.maxPlayers ? `/${t.maxPlayers}` : ''} players`} color="accent" variant="soft" size="sm" />
              </View>
            </Card>
          </Pressable>
        )}
        ListEmptyComponent={<EmptyState icon="trophy-outline" title="No tournaments" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({});
