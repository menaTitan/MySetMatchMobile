import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { leaderboardApi, locationsApi } from '../../api';
import { useSport } from '../../context/SportContext';
import { getHub } from '../../realtime/signalR';
import type { LeaderboardEntry } from '../../types';
import { useFetchData } from '../../hooks/useFetchData';
import SportPickerBar from '../../components/SportPickerBar';
import { radii, shadows, spacing, typography } from '../../theme';
import { Avatar, EmptyState, HeroHeader, LoadingView, SegmentedTabs, type SegmentedTab } from '../../components/ui';

const SCOPES: SegmentedTab<'global' | 'country' | 'region' | 'city'>[] = [
  { key: 'global',  label: 'Global',  icon: 'earth' },
  { key: 'country', label: 'Country', icon: 'flag' },
  { key: 'region',  label: 'Region',  icon: 'map' },
  { key: 'city',    label: 'City',    icon: 'business' },
];

const MEDALS = ['trophy', 'medal', 'ribbon'] as const;
const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

type Scope = 'global' | 'country' | 'region' | 'city';
type LocationOpt = { id: string; name: string };

export default function LeaderboardScreen({ navigation }: any) {
  const { currentSport, theme } = useSport();
  const [scope, setScope] = useState<Scope>('global');
  const [locationId, setLocationId] = useState<string | undefined>();
  const [locationLabel, setLocationLabel] = useState<string | undefined>();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [options, setOptions] = useState<LocationOpt[]>([]);
  const [loadingOpts, setLoadingOpts] = useState(false);

  // Reset selection when scope flips between global/non-global, or when narrower.
  useEffect(() => {
    setLocationId(undefined);
    setLocationLabel(undefined);
  }, [scope]);

  // Load options for the picker on demand. Country = list countries; region/city
  // need a parent — without one we just show countries and let the user drill in.
  async function openPicker() {
    if (scope === 'global') return;
    setPickerOpen(true);
    setLoadingOpts(true);
    try {
      // For region and city scopes we still pick by country first (simplest UX)
      // and let the server do the filtering by country if no narrower id is set.
      if (scope === 'country' || scope === 'region' || scope === 'city') {
        const r = await locationsApi.countries();
        setOptions(r.data.map((c) => ({ id: c.id, name: c.name })));
      }
    } catch {
      setOptions([]);
    } finally { setLoadingOpts(false); }
  }

  function pickOption(opt: LocationOpt) {
    setLocationId(opt.id);
    setLocationLabel(opt.name);
    setPickerOpen(false);
  }

  const { data, loading, refreshing, refresh } = useFetchData<LeaderboardEntry[]>(
    async () => (await leaderboardApi.get({
      sportId: currentSport?.id,
      scope,
      locationId: scope === 'global' ? undefined : locationId,
    })).data,
    [currentSport?.id, scope, locationId],
  );

  // Subscribe to LeaderboardUpdated broadcasts for the current scope group;
  // when one fires we silently re-fetch in the background.
  useEffect(() => {
    let off: (() => void) | undefined;
    let group: string | null = null;
    (async () => {
      try {
        const hub = await getHub('liveScore');
        // Server scope keys: "global", "country_{id}", "city_{id}".
        group = scope === 'global'
          ? 'global'
          : (scope === 'country' && locationId) ? `country_${locationId}`
          : (scope === 'city' && locationId)    ? `city_${locationId}`
          : null;
        if (!group) return;
        await hub.invoke('JoinLeaderboardGroup', group).catch(() => {});
        const handler = () => { refresh(); };
        hub.on('LeaderboardUpdated', handler);
        off = () => {
          hub.off('LeaderboardUpdated', handler);
          if (group) hub.invoke('LeaveLeaderboardGroup', group).catch(() => {});
        };
      } catch {}
    })();
    return () => { if (off) off(); };
  }, [scope, locationId, refresh]);
  const entries = data ?? [];
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <View style={[styles.container, { backgroundColor: theme.pageBg }]}>
      <HeroHeader
        variant="compact"
        title={`${currentSport?.name ?? 'Global'} Leaderboard`}
        subtitle="See how you stack up against the best players"
      />
      <SportPickerBar />

      <SegmentedTabs tabs={SCOPES} value={scope} onChange={setScope} variant="pill" />

      {scope !== 'global' ? (
        <Pressable
          onPress={openPicker}
          style={({ pressed }) => [
            styles.locationBar,
            { backgroundColor: theme.cardBg, borderColor: theme.border },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Ionicons name="location-outline" size={16} color={theme.secondary} />
          <Text style={[typography.small, { color: theme.textPrimary, flex: 1 }]} numberOfLines={1}>
            {locationLabel ?? `Pick a ${scope}`}
          </Text>
          <Ionicons name="chevron-down" size={14} color={theme.textMuted} />
        </Pressable>
      ) : null}

      {loading ? <LoadingView /> : entries.length === 0 ? (
        <EmptyState icon="medal-outline" title="No rankings yet" message="Play matches to appear on the leaderboard." />
      ) : (
        <FlatList
          data={rest}
          keyExtractor={(i) => String(i.rank)}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.accent} />
          }
          contentContainerStyle={{ padding: spacing.base, paddingBottom: spacing.xxl }}
          ListHeaderComponent={top3.length > 0 ? <Podium entries={top3} /> : null}
          renderItem={({ item }) => (
            <RankRow
              entry={item}
              onPress={() => navigation?.navigate('PlayerProfile', { playerId: item.playerId })}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
        />
      )}

      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.modalScrim} onPress={() => setPickerOpen(false)}>
          <Pressable
            style={[styles.modalCard, { backgroundColor: theme.cardBg }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[typography.h3, { color: theme.textPrimary, marginBottom: spacing.sm }]}>
              Choose location
            </Text>
            {loadingOpts ? <LoadingView /> : (
              <FlatList
                data={options}
                keyExtractor={(o) => o.id}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => pickOption(item)}
                    style={({ pressed }) => [
                      styles.optRow,
                      { borderBottomColor: theme.divider },
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Text style={[typography.body, { color: theme.textPrimary }]}>{item.name}</Text>
                  </Pressable>
                )}
                ListEmptyComponent={
                  <EmptyState icon="search-outline" title="No options" message="Nothing to choose from yet." />
                }
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function Podium({ entries }: { entries: LeaderboardEntry[] }) {
  const { theme } = useSport();
  // Order: 2nd, 1st, 3rd for visual podium
  const order = [entries[1], entries[0], entries[2]].filter(Boolean);
  const heights = [92, 120, 78];

  return (
    <LinearGradient
      colors={theme.heroGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.podiumWrap}
    >
      <View pointerEvents="none" style={[styles.orb, { backgroundColor: theme.accentLight }]} />
      <View style={styles.podiumTitleRow}>
        <Ionicons name="trophy" size={16} color={theme.accent} />
        <Text style={styles.podiumTitle}>Top Players</Text>
      </View>

      <View style={styles.podiumRow}>
        {order.map((entry, i) => {
          const actualPos = entry.rank;
          const podIdx = actualPos - 1;
          const h = actualPos === 1 ? heights[1] : actualPos === 2 ? heights[0] : heights[2];
          return (
            <View key={entry.playerId} style={styles.podiumSlot}>
              <View style={[styles.medalBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <Ionicons name={MEDALS[podIdx] as any} size={18} color={MEDAL_COLORS[podIdx]} />
              </View>
              <Avatar
                name={entry.name}
                photoUrl={entry.profilePhotoUrl}
                size={actualPos === 1 ? 56 : 46}
                borderColor={MEDAL_COLORS[podIdx]}
              />
              <Text style={[styles.podiumName, { color: '#fff' }]} numberOfLines={1}>
                {entry.name}
              </Text>
              <Text style={[styles.podiumRating, { color: theme.accent }]}>{entry.rating}</Text>
              <View style={[styles.podiumBlock, { height: h, backgroundColor: 'rgba(255,255,255,0.12)' }]}>
                <Text style={styles.podiumRank}>#{actualPos}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </LinearGradient>
  );
}

function RankRow({ entry, onPress }: { entry: LeaderboardEntry; onPress?: () => void }) {
  const { theme } = useSport();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, { backgroundColor: theme.cardBg }, shadows.md, pressed && { opacity: 0.85 }]}
    >
      <View style={[styles.rankBadge, { backgroundColor: theme.featureBg }]}>
        <Text style={[typography.smallStrong, { color: theme.secondary }]}>#{entry.rank}</Text>
      </View>
      <Avatar name={entry.name} photoUrl={entry.profilePhotoUrl} size={40} />
      <View style={{ flex: 1 }}>
        <Text style={[typography.bodyStrong, { color: theme.textPrimary }]} numberOfLines={1}>
          {entry.name}
        </Text>
        <View style={styles.metaRow}>
          {entry.clubName ? (
            <Text style={[typography.caption, { color: theme.textMuted }]} numberOfLines={1}>
              {entry.clubName}
            </Text>
          ) : null}
          {entry.country ? (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={10} color={theme.textMuted} />
              <Text style={[typography.caption, { color: theme.textMuted }]}>
                {entry.city ?? entry.country}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[typography.h2, { color: theme.primary, fontSize: 20 }]}>{entry.rating}</Text>
        <Text style={[typography.caption, { color: theme.successGreen, fontWeight: '700' }]}>
          {entry.winRate.toFixed(0)}% WR
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  podiumWrap: {
    padding: spacing.lg,
    paddingTop: spacing.base,
    borderRadius: radii.xl,
    marginBottom: spacing.base,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    width: 260, height: 260, borderRadius: 130,
    top: -100, right: -80, opacity: 0.7,
  },
  podiumTitleRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6, marginBottom: spacing.base,
  },
  podiumTitle: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
  podiumRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: spacing.sm },
  podiumSlot: { flex: 1, alignItems: 'center', gap: 4 },
  medalBadge: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  podiumName: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  podiumRating: { fontSize: 16, fontWeight: '900' },
  podiumBlock: {
    width: '100%', borderTopLeftRadius: radii.sm, borderTopRightRadius: radii.sm,
    justifyContent: 'flex-start', alignItems: 'center',
    paddingTop: 10, marginTop: 2,
  },
  podiumRank: { color: 'rgba(255,255,255,0.85)', fontWeight: '900', fontSize: 15 },

  row: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm + 2,
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm + 2,
    borderRadius: radii.md,
  },
  rankBadge: {
    minWidth: 42, paddingHorizontal: 8, height: 28,
    borderRadius: radii.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 2 },

  locationBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginHorizontal: spacing.base, marginTop: spacing.xs,
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    borderRadius: radii.md, borderWidth: 1,
  },
  modalScrim: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', padding: spacing.lg,
  },
  modalCard: {
    maxHeight: '70%',
    borderRadius: radii.lg, padding: spacing.base,
  },
  optRow: {
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
  },
});
