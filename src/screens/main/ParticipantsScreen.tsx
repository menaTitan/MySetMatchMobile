import React from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { tournamentsApi, type RegistrationRow } from '../../api';
import { useSport } from '../../context/SportContext';
import { useFetchData } from '../../hooks/useFetchData';
import { radii, spacing, typography } from '../../theme';
import { Avatar, Card, Chip, EmptyState, LoadingView, PageHeader } from '../../components/ui';

export default function ParticipantsScreen({ route }: any) {
  const { tournamentId, name } = route.params;
  const { theme } = useSport();
  const { data, loading, refreshing, refresh } = useFetchData<RegistrationRow[]>(
    async () => (await tournamentsApi.participants(tournamentId)).data,
    [tournamentId],
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <PageHeader title="Participants" subtitle={name ?? 'Registered players'} compact />
      {loading ? <LoadingView /> : (
        <FlatList
          data={(data ?? []).filter((r) => r.status === 'Confirmed')}
          keyExtractor={(r) => r.registrationId}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.accent} />}
          contentContainerStyle={{ padding: spacing.base, gap: spacing.xs + 2 }}
          ListEmptyComponent={<EmptyState icon="people-outline" title="No participants yet" />}
          renderItem={({ item: r }) => (
            <Card padding={0}>
              <View style={styles.row}>
                <Avatar name={r.playerName} size={40} />
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyStrong, { color: theme.textPrimary }]}>{r.playerName}</Text>
                  <Text style={[typography.caption, { color: theme.textMuted }]}>
                    {r.city ? `${r.city}` : ''}{r.country ? `, ${r.country}` : ''}
                  </Text>
                </View>
                <Chip label={String(r.globalRating)} color="primary" variant="soft" size="sm" />
              </View>
            </Card>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2, padding: spacing.sm + 4 },
});
