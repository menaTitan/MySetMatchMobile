import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { matchesApi } from '../../api';
import { useSport } from '../../context/SportContext';
import type { MatchDetail } from '../../types';
import SportPickerBar from '../../components/SportPickerBar';
import { radii, shadows, spacing, typography } from '../../theme';
import { Card, Chip, EmptyState, LoadingView, PageHeader } from '../../components/ui';

const STATUS_TABS = [
  { key: 'all',       label: 'All' },
  { key: 'pending',   label: 'Upcoming' },
  { key: 'live',      label: 'Live' },
  { key: 'completed', label: 'Done' },
] as const;

type TabKey = typeof STATUS_TABS[number]['key'];

export default function MatchesScreen({ navigation }: any) {
  const { currentSport, theme } = useSport();
  const [matches, setMatches] = useState<MatchDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<TabKey>('all');

  const load = useCallback(async () => {
    try {
      const { data } = await matchesApi.my({ sportId: currentSport?.id, status: tab });
      setMatches(data);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [currentSport?.id, tab]);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const renderMatch = ({ item }: { item: MatchDetail }) => {
    const canEnterScore = item.status === 'Scheduled' || item.status === 'InProgress';
    const isCompleted = item.status === 'Completed';
    const isLive = item.status === 'InProgress';
    const myScore = item.amPlayer1 ? item.player1SetsWon : item.player2SetsWon;
    const oppScore = item.amPlayer1 ? item.player2SetsWon : item.player1SetsWon;
    const won = isCompleted && myScore > oppScore;

    const borderColor = isLive ? theme.warning
      : isCompleted ? (won ? theme.successGreen : theme.dangerRed)
      : theme.secondary;

    return (
      <Card
        style={styles.matchCard}
        padding="base"
        onPress={() => canEnterScore ? navigation.navigate('ScoreEntry', { matchId: item.id }) : undefined}
        borderLeftColor={borderColor}
      >
        <View style={styles.topRow}>
          <StatusChip status={item.status} />
          {item.sportName ? (
            <Text style={[typography.caption, { color: theme.secondary, fontWeight: '700' }]}>
              {item.sportName.toUpperCase()}
            </Text>
          ) : null}
        </View>

        <View style={styles.matchup}>
          <Text style={[typography.h3, { color: theme.textPrimary, flex: 1 }]} numberOfLines={1}>
            {item.player1?.name}
          </Text>
          <Text style={[typography.caption, { color: theme.textMuted, marginHorizontal: spacing.sm }]}>VS</Text>
          <Text style={[typography.h3, { color: theme.textPrimary, flex: 1, textAlign: 'right' }]} numberOfLines={1}>
            {item.player2?.name}
          </Text>
        </View>

        <Text style={[typography.caption, { color: theme.textMuted, marginTop: 2 }]}>
          {item.tournamentName} · {item.stage}
        </Text>

        {item.scheduledDateTime ? (
          <View style={styles.dateRow}>
            <Ionicons name="time-outline" size={12} color={theme.textMuted} />
            <Text style={[typography.caption, { color: theme.textMuted }]}>
              {new Date(item.scheduledDateTime).toLocaleString()}
            </Text>
          </View>
        ) : null}

        {isCompleted ? (
          <View style={[styles.scoreBanner, { backgroundColor: won ? theme.featureBg : theme.pageBg }]}>
            <Text style={[typography.caption, { color: theme.textMuted }]}>FINAL</Text>
            <Text style={[typography.h1, { color: won ? theme.successGreen : theme.dangerRed, fontSize: 28 }]}>
              {item.player1SetsWon} – {item.player2SetsWon}
            </Text>
          </View>
        ) : null}

        {canEnterScore ? (
          <View style={[styles.enterBtn, { backgroundColor: theme.featureBg, borderColor: theme.secondary }]}>
            <Ionicons name="create-outline" size={16} color={theme.secondary} />
            <Text style={[typography.smallStrong, { color: theme.secondary }]}>
              {isLive ? 'Update score' : 'Enter score'}
            </Text>
            <Ionicons name="chevron-forward" size={14} color={theme.secondary} />
          </View>
        ) : null}
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.pageBg }]}>
      <PageHeader
        title="My Matches"
        subtitle="Track your matches and enter scores"
      />
      <SportPickerBar />

      {/* Scrollable tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
        style={{ backgroundColor: theme.cardBg, borderBottomWidth: 1, borderBottomColor: theme.divider, flexGrow: 0 }}
      >
        {STATUS_TABS.map((t) => {
          const active = tab === t.key;
          return (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              style={[
                styles.tab,
                { borderColor: active ? theme.primary : theme.border, backgroundColor: active ? theme.primary : 'transparent' },
              ]}
            >
              <Text style={[typography.smallStrong, { color: active ? '#fff' : theme.textSecondary }]}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {loading ? <LoadingView /> : (
        <FlatList
          data={matches}
          keyExtractor={(i) => i.id}
          renderItem={renderMatch}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor={theme.accent}
            />
          }
          contentContainerStyle={{ padding: spacing.base, gap: spacing.sm }}
          ListEmptyComponent={
            <EmptyState
              icon="tennisball-outline"
              title="No matches here"
              message="When you play matches, they'll show up here."
            />
          }
        />
      )}
    </View>
  );
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { color: any; icon: any }> = {
    Completed:   { color: 'success', icon: 'checkmark-circle' },
    InProgress:  { color: 'warning', icon: 'radio' },
    Scheduled:   { color: 'primary', icon: 'calendar' },
  };
  const c = map[status] ?? { color: 'muted', icon: 'ellipse' };
  return <Chip label={status} color={c.color} variant="soft" size="sm" icon={c.icon} />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabsRow: { padding: spacing.sm, gap: spacing.xs + 2 },
  tab: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1.5,
  },
  matchCard: { padding: spacing.base },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  matchup: { flexDirection: 'row', alignItems: 'center' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  scoreBanner: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    marginTop: spacing.sm + 2,
  },
  enterBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: spacing.sm + 2,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  liveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: radii.pill, borderWidth: 1,
  },
  liveDot: { width: 7, height: 7, borderRadius: 3.5 },
  liveBtnText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
});
