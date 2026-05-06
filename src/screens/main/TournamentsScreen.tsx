import React from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tournamentsApi } from '../../api';
import { useSport } from '../../context/SportContext';
import type { TournamentSummary } from '../../types';
import { useFetchData } from '../../hooks/useFetchData';
import SportPickerBar from '../../components/SportPickerBar';
import { radii, shadows, spacing, typography } from '../../theme';
import { Card, Chip, EmptyState, LoadingView, PageHeader } from '../../components/ui';

export default function TournamentsScreen({ navigation }: any) {
  const { currentSport, theme } = useSport();
  const { data, loading, refreshing, refresh } = useFetchData<TournamentSummary[]>(
    async () => (await tournamentsApi.list({ sportId: currentSport?.id })).data.items,
    [currentSport?.id],
  );
  const items = data ?? [];

  const renderItem = ({ item }: { item: TournamentSummary }) => {
    const fillPct = item.maxPlayers ? Math.min(1, item.registeredCount / item.maxPlayers) : 0;
    const startDate = new Date(item.startDate);
    return (
      <Card
        style={styles.card}
        padding="base"
        onPress={() => navigation.navigate('TournamentDetail', { id: item.id })}
      >
        <View style={styles.cardRow}>
          {/* Date block */}
          <View style={[styles.dateBlock, { backgroundColor: theme.featureBg }]}>
            <Text style={[typography.caption, { color: theme.secondary, fontSize: 10, fontWeight: '800' }]}>
              {startDate.toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}
            </Text>
            <Text style={[typography.h2, { color: theme.primary, fontSize: 22 }]}>
              {startDate.getDate()}
            </Text>
            <Text style={[typography.caption, { color: theme.textMuted, fontSize: 9 }]}>
              {startDate.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase()}
            </Text>
          </View>

          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.topRow}>
              <Text style={[typography.h3, { color: theme.textPrimary, flex: 1 }]} numberOfLines={1}>
                {item.name}
              </Text>
              {item.isRegistered && <Chip label="Joined" color="success" variant="soft" size="sm" />}
            </View>

            <View style={styles.metaRow}>
              {item.city && (
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={12} color={theme.textMuted} />
                  <Text style={[typography.caption, { color: theme.textMuted }]} numberOfLines={1}>
                    {item.city}{item.country ? `, ${item.country}` : ''}
                  </Text>
                </View>
              )}
              {item.sportName && (
                <View style={styles.metaItem}>
                  <Ionicons name="trophy-outline" size={12} color={theme.textMuted} />
                  <Text style={[typography.caption, { color: theme.textMuted }]}>{item.sportName}</Text>
                </View>
              )}
            </View>

            <View style={styles.bottomRow}>
              <Chip label={item.type} color="primary" variant="soft" size="sm" />
              <View style={{ flex: 1 }}>
                <Text style={[typography.caption, { color: theme.textSecondary, textAlign: 'right' }]}>
                  {item.registeredCount}{item.maxPlayers ? `/${item.maxPlayers}` : ''} players
                </Text>
                {item.maxPlayers ? (
                  <View style={[styles.progressTrack, { backgroundColor: theme.divider }]}>
                    <View style={[styles.progressFill, { backgroundColor: theme.accent, width: `${fillPct * 100}%` }]} />
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
        </View>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.pageBg }]}>
      <PageHeader
        title="Tournaments"
        subtitle={`Browse ${currentSport?.name ?? 'all'} events`}
        right={
          <Pressable
            onPress={() => navigation?.navigate('CreateTournament')}
            style={({ pressed }) => [
              styles.newBtn,
              { backgroundColor: theme.accent },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Ionicons name="add" size={18} color={theme.primary} />
            <Text style={[typography.smallStrong, { color: theme.primary, fontWeight: '800' }]}>New</Text>
          </Pressable>
        }
      />
      <SportPickerBar />

      {loading ? <LoadingView /> : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.accent} />
          }
          contentContainerStyle={{ padding: spacing.base }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          ListEmptyComponent={
            <EmptyState
              icon="trophy-outline"
              title="No tournaments found"
              message={`There are no ${currentSport?.name ?? ''} tournaments scheduled right now.`}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { padding: 0 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.base },
  dateBlock: {
    width: 56, height: 64, borderRadius: radii.md,
    alignItems: 'center', justifyContent: 'center', paddingVertical: 4,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 4 },
  metaRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  progressTrack: {
    height: 4, borderRadius: 2, marginTop: 4, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2 },
  countPill: {
    alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: radii.md, borderWidth: 1,
  },
  newBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: radii.pill,
  },
});
