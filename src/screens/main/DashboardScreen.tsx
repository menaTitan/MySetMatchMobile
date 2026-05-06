import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { playerApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useSport } from '../../context/SportContext';
import type { Dashboard } from '../../types';
import SportPickerBar from '../../components/SportPickerBar';
import MatchCard from '../../components/MatchCard';
import { radii, shadows, spacing, typography } from '../../theme';
import { Card, Chip, EmptyState, FeatureTileGrid, LoadingView, SearchBar, SectionHeader, StatTile } from '../../components/ui';

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

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.primary }} />

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
        {/* Hero header */}
        <LinearGradient
          colors={theme.heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View pointerEvents="none" style={[styles.orb, styles.orbA, { backgroundColor: theme.accentLight }]} />
          <View pointerEvents="none" style={[styles.orb, styles.orbB, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />

          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.name}>{firstName} 👋</Text>
            </View>
            <View style={styles.sportBadge}>
              <Ionicons name="trophy" size={11} color={theme.accent} />
              <Text style={styles.sportBadgeText}>
                {(currentSport?.name ?? 'All Sports').toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Rating hero */}
          <View style={styles.ratingHero}>
            <Text style={[styles.ratingLabel, { color: 'rgba(255,255,255,0.65)' }]}>
              {currentSport?.name ?? 'Global'} Rating
            </Text>
            <Text style={[styles.ratingValue, { color: theme.accent }]}>
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

          {/* Search */}
          <View style={{ marginTop: spacing.base }}>
            <SearchBar onPress={() => navigation.navigate('Search')} placeholder="Search players, tournaments…" />
          </View>
        </LinearGradient>

        {/* Quick actions — modern web-style feature tile grid */}
        <View style={styles.quickWrap}>
          <FeatureTileGrid
            tiles={[
              { key: 'score',     icon: 'flash-outline',  label: 'Enter Score', hint: 'Submit match results',  tint: 'accent', onPress: () => navigation.navigate('Play', { screen: 'PlayHome' }) },
              { key: 'live',      icon: 'radio-outline',  label: 'Live Scores', hint: 'Watch matches in progress', tint: 'red', onPress: () => navigation.navigate('Play', { screen: 'PlayHome' }) },
              { key: 'find',      icon: 'people-outline', label: 'Find Players', hint: 'Search across sports', tint: 'blue',  onPress: () => navigation.navigate('Search') },
              { key: 'post',      icon: 'create-outline', label: 'New Post',     hint: 'Share with the community', tint: 'green', onPress: () => navigation.navigate('Community', { screen: 'CommunityHome' }) },
            ]}
          />
        </View>

        <SportPickerBar />

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
                        borderColor: active ? theme.primary : theme.border,
                        backgroundColor: active ? theme.accentLight : theme.pageBg,
                      },
                    ]}
                  >
                    <Text style={[styles.sportRatingVal, { color: theme.primary }]}>{sr.globalRating}</Text>
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
                  <View style={[styles.tournamentDate, { backgroundColor: theme.featureBg }]}>
                    <Text style={[typography.caption, { color: theme.secondary, fontSize: 10 }]}>
                      {new Date(t.startDate).toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}
                    </Text>
                    <Text style={[typography.h3, { color: theme.primary, fontSize: 18 }]}>
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
  hero: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.base,
    paddingBottom: spacing.xl + 6,
    borderBottomLeftRadius: radii.xxl,
    borderBottomRightRadius: radii.xxl,
    overflow: 'hidden',
  },
  orb: { position: 'absolute', borderRadius: 999 },
  orbA: { width: 240, height: 240, top: -80, right: -60, opacity: 0.9 },
  orbB: { width: 160, height: 160, bottom: -40, left: -30 },

  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13, letterSpacing: 0.2,
    fontFamily: typography.body.fontFamily,
  },
  name: {
    color: '#fff',
    fontSize: 24, fontWeight: '900',
    marginTop: 2, letterSpacing: -0.5,
    fontFamily: typography.h1.fontFamily,
  },
  sportBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: radii.pill,
  },
  sportBadgeText: {
    color: '#fff', fontSize: 9.5,
    fontWeight: '800', letterSpacing: 0.8,
    fontFamily: typography.overline.fontFamily,
  },

  ratingHero: { alignItems: 'center', marginTop: spacing.lg },
  ratingLabel: {
    ...typography.caption, fontSize: 11, letterSpacing: 1.2,
  },
  ratingValue: {
    fontSize: 68, fontWeight: '900',
    letterSpacing: -2, lineHeight: 74,
    fontFamily: typography.display.fontFamily,
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowRadius: 10,
    textShadowOffset: { width: 0, height: 2 },
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
    borderRadius: radii.md, borderWidth: 1.5,
    alignItems: 'center', minWidth: 80,
  },
  sportRatingVal: { fontSize: 18, fontWeight: '800' },
  sportRatingName: { fontSize: 10, marginTop: 1 },

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
