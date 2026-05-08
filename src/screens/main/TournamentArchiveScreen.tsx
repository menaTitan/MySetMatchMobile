import React, { useState } from 'react';
import { View, FlatList, RefreshControl, Pressable, Text, StyleSheet } from 'react-native';
import { tournamentsApi } from '../../api';
import type { TournamentSummary } from '../../types';
import { useSport } from '../../context/SportContext';
import { useFetchData } from '../../hooks/useFetchData';
import { radii, spacing, typography } from '../../theme';
import { Card, Chip, EmptyState, LoadingView, PageHeader } from '../../components/ui';

export default function TournamentArchiveScreen({ navigation }: any) {
  const { theme, currentSport } = useSport();
  const [page] = useState(1);
  const { data, loading, refreshing, refresh } = useFetchData<{ items: TournamentSummary[] }>(
    async () => (await tournamentsApi.archive({ sportId: currentSport?.id, page, pageSize: 30 })).data,
    [currentSport?.id, page],
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <PageHeader title="Tournament Archive" subtitle="Past tournaments" compact />
      {loading ? <LoadingView /> : (
        <FlatList
          data={data?.items ?? []}
          keyExtractor={(t) => t.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.accent} />}
          contentContainerStyle={{ padding: spacing.base, gap: spacing.sm }}
          ListEmptyComponent={<EmptyState icon="archive-outline" title="No archived tournaments" />}
          renderItem={({ item }) => (
            <Pressable onPress={() => navigation.navigate('TournamentDetail', { id: item.id })}>
              <Card>
                <Text style={[typography.bodyStrong, { color: theme.textPrimary }]}>{item.name}</Text>
                <Text style={[typography.caption, { color: theme.textMuted, marginTop: 2 }]}>
                  {new Date(item.startDate).toLocaleDateString()}
                  {item.city ? ` · ${item.city}, ${item.country}` : ''}
                </Text>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                  {item.sportName && <Chip label={item.sportName} color="primary" variant="soft" size="sm" />}
                  <Chip label={item.type} color="muted" variant="soft" size="sm" />
                  <Chip label={`${item.registeredCount} players`} color="accent" variant="soft" size="sm" />
                </View>
              </Card>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({});
