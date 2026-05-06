import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { leaderboardApi } from '../../api';
import { useSport } from '../../context/SportContext';
import type { LeaderboardEntry } from '../../types';
import { useFetchData } from '../../hooks/useFetchData';
import SportPickerBar from '../../components/SportPickerBar';
import { radii, shadows, spacing, typography } from '../../theme';
import { Avatar, EmptyState, LoadingView, PageHeader } from '../../components/ui';

const SCOPES = [
  { key: 'global',  label: 'Global',  icon: 'earth' },
  { key: 'country', label: 'Country', icon: 'flag' },
  { key: 'city',    label: 'City',    icon: 'business' },
] as const;

const MEDALS = ['trophy', 'medal', 'ribbon'] as const;
const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

type Scope = typeof SCOPES[number]['key'];

export default function LeaderboardScreen({ navigation }: any) {
  const { currentSport, theme } = useSport();
  const [scope, setScope] = useState<Scope>('global');
  const { data, loading, refreshing, refresh } = useFetchData<LeaderboardEntry[]>(
    async () => (await leaderboardApi.get({ sportId: currentSport?.id, scope })).data,
    [currentSport?.id, scope],
  );
  const entries = data ?? [];
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <View style={[styles.container, { backgroundColor: theme.pageBg }]}>
      <PageHeader
        title={`${currentSport?.name ?? 'Global'} Leaderboard`}
        subtitle="See how you stack up against the best players"
      />
      <SportPickerBar />

      {/* Scope chips */}
      <View style={[styles.scopeRow, { backgroundColor: theme.cardBg, borderBottomColor: theme.divider }]}>
        {SCOPES.map((s) => {
          const active = scope === s.key;
          return (
            <Pressable
              key={s.key}
              onPress={() => setScope(s.key)}
              style={[
                styles.scopePill,
                active
                  ? { backgroundColor: theme.primary, borderColor: theme.primary }
                  : { backgroundColor: 'transparent', borderColor: theme.border },
              ]}
            >
              <Ionicons name={s.icon as any} size={13} color={active ? '#fff' : theme.textSecondary} />
              <Text style={[
                typography.smallStrong,
                { color: active ? '#fff' : theme.textSecondary },
              ]}>{s.label}</Text>
            </Pressable>
          );
        })}
      </View>

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
  scopeRow: {
    flexDirection: 'row', gap: spacing.sm,
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  scopePill: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: radii.md, borderWidth: 1.5,
  },

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
});
