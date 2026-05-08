import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminApi, type AnalyticsResponse } from '../../api';
import { useSport } from '../../context/SportContext';
import { useFetchData } from '../../hooks/useFetchData';
import { radii, spacing, typography } from '../../theme';
import { Card, Chip, LoadingView, PageHeader, StatTile } from '../../components/ui';

export default function AdminAnalyticsScreen() {
  const { theme } = useSport();
  const [days, setDays] = useState(30);
  const { data, loading, refreshing, refresh } = useFetchData<AnalyticsResponse>(
    async () => (await adminApi.analytics(days)).data,
    [days],
  );

  if (loading || !data) return <LoadingView />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <PageHeader title="Analytics" subtitle={`Last ${days} days`} compact />
      <ScrollView
        contentContainerStyle={{ padding: spacing.base, gap: spacing.sm }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.accent} />}
      >
        <View style={styles.range}>
          {[7, 14, 30, 90].map((d) => (
            <Chip
              key={d}
              label={`${d}d`}
              color={days === d ? 'primary' : 'muted'}
              variant={days === d ? 'solid' : 'soft'}
              onPress={() => setDays(d)}
            />
          ))}
        </View>

        <View style={styles.statsGrid}>
          <StatTile label="New Users" value={String(data.totalNewUsers)} icon="person-add-outline" />
          <StatTile label="New Tournaments" value={String(data.totalNewTournaments)} icon="trophy-outline" />
          <StatTile label="Matches" value={String(data.totalMatches)} icon="game-controller-outline" />
          <StatTile label="Revenue" value={`$${data.totalRevenue.toFixed(0)}`} icon="cash-outline" />
        </View>

        <Sparkline title="New Users" data={data.newUsersByDay.map((d) => d.count)} color={theme.primary} />
        <Sparkline title="Tournaments" data={data.newTournamentsByDay.map((d) => d.count)} color={theme.accent} />
        <Sparkline title="Matches" data={data.matchesByDay.map((d) => d.count)} color={theme.successGreen} />
        <Sparkline title="Revenue ($)" data={data.revenueByDay.map((d) => d.amount)} color={theme.warning} />
      </ScrollView>
    </View>
  );
}

function Sparkline({ title, data, color }: { title: string; data: number[]; color: string }) {
  const { theme } = useSport();
  const max = Math.max(...data, 1);
  return (
    <Card>
      <Text style={[typography.smallStrong, { color: theme.textPrimary, marginBottom: spacing.sm }]}>{title}</Text>
      <View style={styles.bars}>
        {data.map((v, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: Math.max(2, (v / max) * 60),
              backgroundColor: color,
              borderRadius: 2,
              opacity: 0.85,
            }}
          />
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  range: { flexDirection: 'row', gap: 6 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 60 },
});
