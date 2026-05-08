import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminApi, type AdminStats } from '../../api';
import { useSport } from '../../context/SportContext';
import { useFetchData } from '../../hooks/useFetchData';
import { radii, shadows, spacing, typography } from '../../theme';
import { Card, FeatureTileGrid, LoadingView, PageHeader, StatTile } from '../../components/ui';

export default function AdminHomeScreen({ navigation }: any) {
  const { theme } = useSport();
  const { data, loading, refreshing, refresh } = useFetchData<AdminStats>(
    async () => (await adminApi.stats()).data,
    [],
  );

  if (loading || !data) return <LoadingView />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <PageHeader title="Admin" subtitle="Platform control panel" compact />

      <ScrollView
        contentContainerStyle={{ padding: spacing.base, paddingBottom: spacing.xxl, gap: spacing.base }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.accent} />}
      >
        {/* Stats grid */}
        <View style={styles.grid}>
          <StatTile label="Users" value={data.totalUsers} icon="people-outline" iconColor="blue" />
          <StatTile label="Tournaments" value={data.totalTournaments} icon="trophy-outline" iconColor="accent" />
        </View>
        <View style={styles.grid}>
          <StatTile label="Active" value={data.activeTournaments} icon="flame-outline" iconColor="red" />
          <StatTile label="Matches" value={data.completedMatches} icon="tennisball-outline" iconColor="green" />
        </View>
        <Card borderLeftColor={theme.dangerRed}>
          <Text style={[typography.overline, { color: theme.dangerRed }]}>ADMIN · TOTAL REVENUE</Text>
          <Text style={[typography.scoreboard, { color: theme.textPrimary, marginTop: 4, fontSize: 44, lineHeight: 48 }]}>
            ${data.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </Card>

        {/* Admin tiles — neon red signals authority and sensitive control. */}
        <FeatureTileGrid
          tiles={[
            { key: 'users',     icon: 'people',          label: 'Users',       hint: 'Search, suspend, edit, roles',  tint: 'red',    onPress: () => navigation.navigate('AdminUsers') },
            { key: 'payments',  icon: 'card',            label: 'Payments',    hint: 'View payments & refunds',        tint: 'red',    onPress: () => navigation.navigate('AdminPayments') },
            { key: 'tourns',    icon: 'trophy',          label: 'Tournaments', hint: 'All tournaments overview',       tint: 'red',    onPress: () => navigation.navigate('AdminTournaments') },
            { key: 'analytics', icon: 'bar-chart',       label: 'Analytics',   hint: 'Platform usage & revenue',       tint: 'red',    onPress: () => navigation.navigate('AdminAnalytics') },
            { key: 'locations', icon: 'location',        label: 'Locations',   hint: 'Countries, regions, cities',     tint: 'red',    onPress: () => navigation.navigate('AdminLocations') },
            { key: 'debug',     icon: 'construct',       label: 'Debug & QA',  hint: 'Recalc, seed, test data',        tint: 'red',    onPress: () => navigation.navigate('AdminDebug') },
          ]}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: spacing.sm },
});
