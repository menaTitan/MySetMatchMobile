import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { playerApi, type PublicPlayerProfile, type RatingHistoryPoint } from '../../api';
import { useSport } from '../../context/SportContext';
import { useAuth } from '../../context/AuthContext';
import { useFetchData } from '../../hooks/useFetchData';
import { getHub } from '../../realtime/signalR';
import MatchCard from '../../components/MatchCard';
import RatingChart from '../../components/RatingChart';
import SportIcon from '../../components/ui/SportIcon';
import { radii, spacing, typography } from '../../theme';
import { Avatar, Button, Card, EmptyState, HeroHeader, LoadingView, SectionHeader, StatTile, useToast } from '../../components/ui';

export default function PlayerProfileScreen({ route, navigation }: any) {
  const { playerId } = route.params;
  const { currentSport, theme } = useSport();
  const { player: me } = useAuth();

  const { data, loading, refreshing, refresh } = useFetchData<PublicPlayerProfile>(
    async () => (await playerApi.getProfile(playerId, currentSport?.id)).data,
    [playerId, currentSport?.id],
  );

  const { data: history } = useFetchData<RatingHistoryPoint[]>(
    async () => (await playerApi.ratingHistory(playerId)).data.points,
    [playerId],
  );

  const toast = useToast();
  // Live rating change banner — driven by PlayerRatingUpdated SignalR events.
  useEffect(() => {
    let off: (() => void) | undefined;
    (async () => {
      try {
        const hub = await getHub('liveScore');
        await hub.invoke('JoinPlayerGroup', playerId).catch(() => {});
        const handler = (_pid: string, _newRating: number, change: number) => {
          if (change == null) return;
          const sign = change > 0 ? '+' : '';
          toast(`Rating updated: ${sign}${change}`, change >= 0 ? 'success' : 'info');
          refresh();
        };
        hub.on('PlayerRatingUpdated', handler);
        off = () => {
          hub.off('PlayerRatingUpdated', handler);
          hub.invoke('LeavePlayerGroup', playerId).catch(() => {});
        };
      } catch {}
    })();
    return () => { if (off) off(); };
  }, [playerId, refresh, toast]);

  if (loading || !data) return <LoadingView />;

  const { player, displayRating, globalRank, countryRank, wins, losses, winRate, totalMatches, sportRatings, recentMatches } = data;
  const isMe = me?.id === player.id;

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.accent} />}
        showsVerticalScrollIndicator={false}
      >
        <HeroHeader variant="standard" align="center">
          <View style={styles.heroBody}>
            <View style={[styles.avatarRing, { borderColor: theme.accent, shadowColor: theme.accent }]}>
              <Avatar name={player.name} photoUrl={player.profilePhotoUrl} size={96} />
            </View>

            <Text style={styles.name}>{player.name}</Text>
            {player.clubName ? <Text style={styles.club}>{player.clubName}</Text> : null}
            {(player.city || player.country) ? (
              <View style={styles.locationRow}>
                <Ionicons name="location" size={12} color="rgba(255,255,255,0.8)" />
                <Text style={styles.location}>
                  {player.city}{player.country ? `, ${player.country}` : ''}
                </Text>
              </View>
            ) : null}

            <View style={styles.ratingRow}>
              <View style={[styles.ratingPill, { borderColor: theme.accent }]}>
                <Text style={styles.ratingLbl}>{currentSport?.name?.toUpperCase() ?? 'GLOBAL'}</Text>
                <Text style={[styles.ratingVal, { color: theme.accent }]}>{displayRating}</Text>
              </View>
              <View style={[styles.ratingPill, { borderColor: 'rgba(255,255,255,0.3)' }]}>
                <Text style={styles.ratingLbl}>RANK</Text>
                <Text style={styles.ratingVal}>#{globalRank}</Text>
              </View>
            </View>
          </View>
        </HeroHeader>

        <View style={{ padding: spacing.base, gap: spacing.base }}>
          {!isMe && me ? (
            <Button
              title="View Head-to-Head"
              variant="accent"
              size="md"
              leftIcon="flash-outline"
              onPress={() => navigation.navigate('HeadToHead', {
                playerId: me.id, opponentId: player.id, opponentName: player.name,
              })}
              fullWidth
            />
          ) : null}

          {/* Stat tiles */}
          <View style={styles.statsRow}>
            <StatTile label="Matches" value={totalMatches} icon="tennisball-outline" iconColor="blue" />
            <StatTile label="Win Rate" value={`${winRate.toFixed(0)}%`} icon="trending-up" iconColor="green" />
          </View>
          <View style={styles.statsRow}>
            <StatTile label="Wins" value={wins} icon="ribbon-outline" iconColor="accent" />
            <StatTile label="Losses" value={losses} icon="close-circle-outline" iconColor="red" />
          </View>

          {/* Rating history chart */}
          <Card>
            <SectionHeader title="Rating history" icon="trending-up-outline" />
            <RatingChart points={history ?? []} />
          </Card>

          {/* Sport ratings */}
          {sportRatings.length > 0 && (
            <Card>
              <SectionHeader title="Sport ratings" icon="stats-chart-outline" />
              <View style={styles.sportGrid}>
                {sportRatings.map((sr) => (
                  <View key={sr.sportId} style={[styles.sportTile, { backgroundColor: theme.pageBg, borderColor: theme.border }]}>
                    <View style={[styles.sportIconBox, { backgroundColor: theme.featureBg }]}>
                      <SportIcon icon={sr.sportIcon} size={18} color={theme.secondary} />
                    </View>
                    <Text style={[typography.h2, { color: theme.primary, fontSize: 20 }]}>{sr.globalRating}</Text>
                    <Text style={[typography.caption, { color: theme.textMuted }]} numberOfLines={1}>
                      {sr.sportName}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          )}

          {/* Recent matches */}
          <Card>
            <SectionHeader title="Recent matches" icon="time-outline" />
            {recentMatches.length === 0 ? (
              <EmptyState icon="tennisball-outline" title="No matches yet" />
            ) : (
              recentMatches.map((m) => <MatchCard key={m.id} match={m} theme={theme} />)
            )}
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  heroBody: { alignItems: 'center' },
  avatarRing: {
    padding: 3, borderRadius: 56, borderWidth: 3,
    shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 8,
    marginBottom: spacing.md,
  },
  name: { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  club: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  location: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '500' },

  ratingRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.base },
  ratingPill: {
    alignItems: 'center',
    paddingHorizontal: spacing.base, paddingVertical: 8,
    borderRadius: radii.md, borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.05)',
    minWidth: 110,
  },
  ratingLbl: { color: 'rgba(255,255,255,0.7)', fontSize: 10, letterSpacing: 1, fontWeight: '700' },
  ratingVal: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.5, marginTop: 2 },

  statsRow: { flexDirection: 'row', gap: spacing.sm },
  sportGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  sportTile: {
    width: '30%', flexGrow: 1,
    borderRadius: radii.md, borderWidth: 1,
    padding: spacing.sm + 2, alignItems: 'center',
    minWidth: 90,
  },
  sportIconBox: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
  },
});
