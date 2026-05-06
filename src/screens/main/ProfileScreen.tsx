import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useSport } from '../../context/SportContext';
import { playerApi } from '../../api';
import type { SportRating } from '../../types';
import { radii, shadows, spacing, typography } from '../../theme';
import { Avatar, Button, Card, FeatureTileGrid, SectionHeader, type Tile } from '../../components/ui';
import SportIcon from '../../components/ui/SportIcon';

export default function ProfileScreen({ navigation }: any) {
  const { player, logout, isAdmin } = useAuth();
  const { theme } = useSport();
  const [sportRatings, setSportRatings] = useState<SportRating[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await playerApi.dashboard();
      setSportRatings(data.sportRatings ?? []);
    } catch {}
    finally { setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  if (!player) return null;

  async function handleLogout() {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.primary }} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: spacing.xxxl }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={theme.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <LinearGradient
          colors={theme.heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View pointerEvents="none" style={[styles.orb, styles.orbA, { backgroundColor: theme.accentLight }]} />
          <View pointerEvents="none" style={[styles.orb, styles.orbB, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />

          <View style={styles.avatarWrap}>
            <View
              style={[
                styles.avatarRing,
                { borderColor: theme.accent, shadowColor: theme.accent },
              ]}
            >
              <Avatar name={player.name} photoUrl={player.profilePhotoUrl} size={96} />
            </View>
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

          {/* Rating pills */}
          <View style={styles.ratingRow}>
            <View style={[styles.ratingPill, { borderColor: theme.accent }]}>
              <Text style={[typography.caption, { color: 'rgba(255,255,255,0.75)' }]}>GLOBAL</Text>
              <Text style={[styles.ratingVal, { color: theme.accent }]}>{player.globalRating}</Text>
            </View>
            <View style={[styles.ratingPill, { borderColor: 'rgba(255,255,255,0.3)' }]}>
              <Text style={[typography.caption, { color: 'rgba(255,255,255,0.75)' }]}>COUNTRY</Text>
              <Text style={styles.ratingVal}>{player.countryRating}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={{ padding: spacing.base, gap: spacing.base }}>
          <View style={{ marginHorizontal: -spacing.xs }}>
            <FeatureTileGrid
              tiles={[
                { key: 'edit',     icon: 'create-outline',  label: 'Edit Profile',    hint: 'Name, club, photo',  tint: 'sport',  onPress: () => navigation.navigate('EditProfile') },
                { key: 'assist',   icon: 'sparkles-outline', label: 'Assistant',      hint: 'Ask anything',       tint: 'accent', onPress: () => navigation.navigate('Assistant') },
                { key: 'pay',      icon: 'card-outline',    label: 'Payments',       hint: 'History & receipts', tint: 'green',  onPress: () => navigation.navigate('PaymentHistory') },
                ...(isAdmin ? ([{ key: 'admin', icon: 'shield-checkmark-outline', label: 'Admin Panel', hint: 'Users, refunds, stats', tint: 'red', onPress: () => navigation.navigate('AdminHome') }] as Tile[]) : []),
              ]}
            />
          </View>

          {/* Sport Ratings */}
          {sportRatings.length > 0 && (
            <Card>
              <SectionHeader title="Sport Ratings" icon="stats-chart-outline" />
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

          {/* Player Info */}
          {(player.handedness || player.playStyle) && (
            <Card>
              <SectionHeader title="Player Info" icon="person-circle-outline" />
              {player.handedness && (
                <InfoRow icon="hand-left-outline" label="Handedness" value={`${player.handedness}-handed`} />
              )}
              {player.playStyle && (
                <InfoRow icon="flash-outline" label="Play Style" value={player.playStyle} last />
              )}
            </Card>
          )}

          {/* Account */}
          <Card>
            <SectionHeader title="Account" icon="settings-outline" />
            <InfoRow icon="id-card-outline" label="Member ID" value={player.id.slice(0, 8).toUpperCase()} last />
          </Card>

          <Button
            title="Log Out"
            onPress={handleLogout}
            variant="danger"
            size="lg"
            fullWidth
            leftIcon="log-out-outline"
          />
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, label, value, last }: { icon: any; label: string; value: string; last?: boolean }) {
  const { theme } = useSport();
  return (
    <View style={[styles.infoRow, !last && { borderBottomWidth: 1, borderBottomColor: theme.divider }]}>
      <View style={[styles.infoIcon, { backgroundColor: theme.featureBg }]}>
        <Ionicons name={icon} size={14} color={theme.secondary} />
      </View>
      <Text style={[typography.small, { color: theme.textMuted, flex: 1 }]}>{label}</Text>
      <Text style={[typography.bodyStrong, { color: theme.textPrimary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl + 4,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: radii.xxl,
    borderBottomRightRadius: radii.xxl,
    overflow: 'hidden',
  },
  orb: { position: 'absolute', borderRadius: 999 },
  orbA: { width: 280, height: 280, top: -90, right: -80, opacity: 0.8 },
  orbB: { width: 180, height: 180, bottom: -60, left: -40 },

  avatarWrap: { marginBottom: spacing.md },
  avatarRing: {
    padding: 3,
    borderRadius: 56,
    borderWidth: 3,
    shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },

  name: {
    color: '#fff', fontSize: 26, fontWeight: '900',
    letterSpacing: -0.5,
    fontFamily: typography.h1.fontFamily,
  },
  club: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  location: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '500' },

  ratingRow: {
    flexDirection: 'row', gap: spacing.sm,
    marginTop: spacing.base,
  },
  ratingPill: {
    alignItems: 'center',
    paddingHorizontal: spacing.base, paddingVertical: 8,
    borderRadius: radii.md,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.05)',
    minWidth: 110,
  },
  ratingVal: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.5, marginTop: 2 },

  sportGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  sportTile: {
    width: '30%', flexGrow: 1,
    borderRadius: radii.md, borderWidth: 1,
    padding: spacing.sm + 2,
    alignItems: 'center',
    minWidth: 90,
  },
  sportIconBox: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
  },

  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm, paddingVertical: spacing.sm + 2,
  },
  infoIcon: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
});
