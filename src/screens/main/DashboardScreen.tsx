import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { playerApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useSport } from '../../context/SportContext';
import type { Dashboard } from '../../types';
import SportPickerBar from '../../components/SportPickerBar';
import HomeSearch from '../../components/HomeSearch';
import MatchCard from '../../components/MatchCard';
import { radii, shadows, spacing, typography } from '../../theme';
import { Card, Chip, EmptyState, FeatureTileGrid, HeroHeader, LoadingView, SectionHeader, StatTile } from '../../components/ui';

export default function DashboardScreen({ navigation }: any) {
  const { player } = useAuth();
  const { currentSport, theme } = useSport();
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data: d } = await playerApi.dashboard(currentSport?.id);
      setData(d);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [currentSport?.id]);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  if (loading) return <LoadingView />;

  const firstName = player?.name?.split(' ')[0] ?? 'Player';
  const rating = data?.displayRating ?? 1500;

  const openPlayer = (id: string) => {
    const root = navigation.getParent()?.getParent() ?? navigation.getParent() ?? navigation;
    root.navigate('PlayerProfile', { playerId: id });
  };
  const openTournament = (id: string) => {
    navigation.navigate('Play', { screen: 'TournamentDetail', params: { id } });
  };
  const openGroup = (id: string, name: string) => {
    navigation.navigate('Community', { screen: 'GroupDetail', params: { groupId: id, groupName: name } });
  };
  const openMarket = () => {
    navigation.navigate('Market');
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={theme.accent}
            colors={[theme.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <HeroHeader variant="standard">
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.name}>{firstName} 👋</Text>
          </View>

          <View style={styles.ratingHero}>
            <Text style={[styles.ratingLabel, { color: 'rgba(255,255,255,0.65)' }]}>
              {currentSport?.name ?? 'Global'} Rating
            </Text>
            <Text style={[
              styles.ratingValue,
              { color: theme.accent, textShadowColor: theme.accentGlow },
            ]}>
              {rating}
            </Text>
            <View style={styles.rankRow}>
              <View style={styles.rankItem}>
                <Ionicons name="globe-outline" size={12} color="rgba(255,255,255,0.75)" />
                <Text style={styles.rankText}>#{data?.globalRank ?? '—'} Global</Text>
              </View>
              <View style={styles.rankDot} />
              <View style={styles.rankItem}>
                <Ionicons name="flag-outline" size={12} color="rgba(255,255,255,0.75)" />
                <Text style={styles.rankText}>#{data?.countryRank ?? '—'} Country</Text>
              </View>
            </View>
          </View>

          <View style={{ marginTop: spacing.base, zIndex: 30 }}>
            <HomeSearch
              onPlayer={openPlayer}
              onTournament={openTournament}
              onGroup={openGroup}
              onListing={openMarket}
            />
          </View>
        </HeroHeader>

        {/* Sport selector — horizontal pill row, sticky-feel below the hero. */}
        <SportPickerBar />

        {/* Quick actions — single horizontal row of compact tiles */}
        <View style={styles.quickWrap}>
          <FeatureTileGrid
            variant="compact"
            tiles={[
              { key: 'score', icon: 'flash-outline',  label: 'Enter Score',  tint: 'accent', onPress: () => navigation.navigate('Play', { screen: 'PlayHome' }) },
              { key: 'live',  icon: 'radio-outline',  label: 'Live',         tint: 'red',    onPress: () => navigation.navigate('Play', { screen: 'PlayHome' }) },
              { key: 'find',  icon: 'people-outline', label: 'Find Players', tint: 'blue',   onPress: () => navigation.navigate('Play', { screen: 'PlayHome' }) },
              { key: 'post',  icon: 'create-outline', label: 'New Post',     tint: 'green',  onPress: () => navigation.navigate('Community', { screen: 'CommunityHome' }) },
            ]}
          />
        </View>

        {/* Stat tiles */}
        <View style={styles.statsGrid}>
          <StatTile
            label="Matches"
            value={data?.totalMatches ?? 0}
            icon="tennisball-outline"
            iconColor="blue"
          />
          <StatTile
            label="Win Rate"
            value={`${(data?.winRate ?? 0).toFixed(0)}%`}
            icon="trending-up"
            iconColor="green"
          />
        </View>
        <View style={styles.statsGrid}>
          <StatTile
            label="Wins"
            value={data?.wins ?? 0}
            icon="ribbon-outline"
            iconColor="accent"
          />
          <StatTile
            label="Losses"
            value={data?.losses ?? 0}
            icon="close-circle-outline"
            iconColor="red"
          />
        </View>

        {/* Recent Form */}
        {(data?.recentForm?.length ?? 0) > 0 && (
          <Card style={styles.section}>
            <SectionHeader title="Recent Form" icon="pulse-outline" />
            <View style={styles.formRow}>
              {data!.recentForm.map((r, i) => (
                <View
                  key={i}
                  style={[
                    styles.formBadge,
                    { backgroundColor: r === 'W' ? theme.successGreen : theme.dangerRed },
                    { ...shadows.sm, shadowOpacity: 0.4, shadowColor: r === 'W' ? theme.successGreen : theme.dangerRed },
                  ]}
                >
                  <Text style={styles.formText}>{r}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Sport Ratings */}
        {(data?.sportRatings?.length ?? 0) > 0 && (
          <Card style={styles.section}>
            <SectionHeader title="Your Sport Ratings" icon="stats-chart-outline" />
            <View style={styles.sportRatingRow}>
              {data!.sportRatings.map((sr) => {
                const active = sr.sportId === currentSport?.id;
                return (
                  <View
                    key={sr.sportId}
                    style={[
                      styles.sportRatingTile,
                      {
                        borderColor: active ? theme.accent : theme.border,
                        backgroundColor: active ? theme.featureBg : theme.pageBg,
                      },
                    ]}
                  >
                    <Text style={[styles.sportRatingVal, { color: active ? theme.accent : theme.textPrimary }]}>{sr.globalRating}</Text>
                    <Text style={[styles.sportRatingName, { color: theme.textMuted }]} numberOfLines={1}>
                      {sr.sportName}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Card>
        )}

        {/* Upcoming Tournaments */}
        {(data?.upcomingTournaments?.length ?? 0) > 0 && (
          <Card style={styles.section}>
            <SectionHeader
              title="Upcoming Tournaments"
              icon="calendar-outline"
              action={{ label: 'View all', onPress: () => navigation.navigate('Play', { screen: 'PlayHome' }) }}
            />
            {data!.upcomingTournaments.map((t, i) => (
              <View key={t.id}>
                <View
                  style={[
                    styles.tournamentRow,
                    i > 0 && { borderTopWidth: 1, borderTopColor: theme.divider },
                  ]}
                >
                  <View style={[
                    styles.tournamentDate,
                    { backgroundColor: theme.featureBg, borderColor: theme.border, borderWidth: 1 },
                  ]}>
                    <Text style={[typography.overline, { color: theme.accent, fontSize: 9 }]}>
                      {new Date(t.startDate).toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}
                    </Text>
                    <Text style={[
                      typography.display,
                      { color: theme.textPrimary, fontSize: 22, lineHeight: 24 },
                    ]}>
                      {new Date(t.startDate).getDate()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.bodyStrong, { color: theme.textPrimary }]} numberOfLines={1}>
                      {t.name}
                    </Text>
                    <View style={styles.tournamentMeta}>
                      <Ionicons name="location-outline" size={11} color={theme.textMuted} />
                      <Text style={[typography.caption, { color: theme.textMuted }]}>
                        {t.city}{t.country ? `, ${t.country}` : ''}
                      </Text>
                    </View>
                  </View>
                  {t.isRegistered ? (
                    <Chip label="Registered" color="success" variant="soft" size="sm" />
                  ) : null}
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* Recent Matches */}
        <Card style={styles.section}>
          <SectionHeader
            title={`Recent ${currentSport?.name ?? ''} Matches`.trim()}
            icon="time-outline"
            action={{ label: 'See all', onPress: () => navigation.navigate('Play', { screen: 'PlayHome' }) }}
          />
          {(data?.recentMatches?.length ?? 0) > 0 ? (
            data!.recentMatches.slice(0, 5).map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                theme={theme}
                onOpponentPress={(id) => navigation.getParent()?.navigate('PlayerProfile', { playerId: id })}
              />
            ))
          ) : (
            <EmptyState
              icon="tennisball-outline"
              title="No matches yet"
              message={`Start playing to see your ${currentSport?.name ?? ''} match history here.`}
            />
          )}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  greeting: {
    color: 'rgba(250,250,250,0.55)',
    fontSize: 11, letterSpacing: 1.6,
    textTransform: 'uppercase',
    fontFamily: typography.body.fontFamily,
  },
  name: {
    color: '#fff',
    fontSize: 28,
    marginTop: 2, letterSpacing: 1,
    fontFamily: typography.display.fontFamily,
    textTransform: 'uppercase',
  },
  ratingHero: { alignItems: 'center', marginTop: spacing.lg },
  ratingLabel: {
    ...typography.overline, fontSize: 11, letterSpacing: 1.6,
  },
  ratingValue: {
    fontSize: 88,
    letterSpacing: 2, lineHeight: 92,
    fontFamily: typography.scoreboard.fontFamily,
    textShadowRadius: 24,
    textShadowOffset: { width: 0, height: 0 },
  },
  rankRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm, marginTop: spacing.xs,
  },
  rankItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rankText: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' },
  rankDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.4)' },

  quickWrap: {
    paddingHorizontal: spacing.base - spacing.xs,
    marginTop: spacing.base,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    marginTop: spacing.base,
  },
  section: {
    marginHorizontal: spacing.base,
    marginTop: spacing.base,
  },
  formRow: { flexDirection: 'row', gap: spacing.sm },
  formBadge: {
    width: 40, height: 40, borderRadius: radii.md,
    justifyContent: 'center', alignItems: 'center',
  },
  formText: { color: '#fff', fontWeight: '900', fontSize: 16 },

  sportRatingRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  sportRatingTile: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radii.md, borderWidth: 1,
    alignItems: 'center', minWidth: 80,
  },
  sportRatingVal: { fontSize: 22, fontFamily: typography.display.fontFamily, letterSpacing: 0.6 },
  sportRatingName: { fontSize: 10, marginTop: 1, textTransform: 'uppercase', letterSpacing: 0.8 },

  tournamentRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.md, paddingVertical: spacing.sm + 2,
  },
  tournamentDate: {
    width: 52, height: 52, borderRadius: radii.md,
    alignItems: 'center', justifyContent: 'center',
  },
  tournamentMeta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
});
