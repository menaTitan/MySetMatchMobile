import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, RefreshControl, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useSport } from '../../context/SportContext';
import { playerApi, preferencesApi, type UserPreferences } from '../../api';
import type { SportRating } from '../../types';
import { radii, spacing, typography } from '../../theme';
import { Avatar, Button, Card, FeatureTileGrid, HeroHeader, ListRow, PhotoLightbox, SectionHeader } from '../../components/ui';
import SportIcon from '../../components/ui/SportIcon';
import {
  biometricLabel,
  isBiometricAvailable,
  isBiometricEnabled,
  promptBiometric,
  setBiometricEnabled,
} from '../../utils/biometric';

// Backend has seven email-notification flags; the Account Settings master
// switch flips all of them on/off in one tap. Listed once here so the
// load-on-focus, "any-on" detection, and the patch all stay in sync.
const EMAIL_PREF_KEYS = [
  'emailTournamentAnnouncements',
  'emailMatchResults',
  'emailPostComments',
  'emailPostReactions',
  'emailDirectMessages',
  'emailClubInvitations',
  'emailMarketing',
] as const satisfies readonly (keyof UserPreferences)[];

export default function ProfileScreen({ navigation }: any) {
  const { player, logout, isAdmin } = useAuth();
  const { theme } = useSport();
  const [sportRatings, setSportRatings] = useState<SportRating[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  // Master email-notification switch state. Treated as "any email flag is
  // on" so a user who already opted out of marketing alone still sees the
  // switch as enabled; flipping it OFF clears all seven flags.
  const [emailOn, setEmailOn] = useState<boolean | null>(null);
  const [emailBusy, setEmailBusy] = useState(false);
  // Biometric unlock: bioAvailable tracks whether the device even has a
  // sensor with an enrolled fingerprint / face; bioOn is the user's
  // opt-in. bioLabel ("Face ID" / "Touch ID") drives the row copy.
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioOn, setBioOn] = useState(false);
  const [bioLabel, setBioLabel] = useState('Face ID');
  const [bioBusy, setBioBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [{ data: dash }, { data: prefs }, available, enabled, label] = await Promise.all([
        playerApi.dashboard(),
        preferencesApi.get(),
        isBiometricAvailable(),
        isBiometricEnabled(),
        biometricLabel(),
      ]);
      setSportRatings(dash.sportRatings ?? []);
      setEmailOn(EMAIL_PREF_KEYS.some(k => prefs[k]));
      setBioAvailable(available);
      setBioLabel(label);
      // If the user enabled biometric earlier on a different device or
      // removed their enrollment since, surface the off state — the
      // toggle should only read as on when it's both opted-in and
      // actually usable right now.
      setBioOn(enabled && available);
    } catch {}
    finally { setRefreshing(false); }
  }, []);

  async function toggleBiometric(next: boolean) {
    if (bioBusy) return;
    if (next && !bioAvailable) {
      Alert.alert(`${bioLabel} unavailable`, `Set up ${bioLabel} in your device settings first.`);
      return;
    }
    setBioBusy(true);
    try {
      if (next) {
        // Make the user prove they can pass the biometric before we
        // enable the gate — otherwise an enabled toggle could lock them
        // out at next launch.
        const ok = await promptBiometric(`Enable ${bioLabel} sign-in`);
        if (!ok) return;
      }
      await setBiometricEnabled(next);
      setBioOn(next);
    } catch (err: any) {
      Alert.alert('Could not update', err?.message ?? 'Try again.');
    } finally {
      setBioBusy(false);
    }
  }

  async function toggleEmail(next: boolean) {
    if (emailBusy) return;
    // Optimistic — the switch is the only visible state, so flipping it
    // back on failure is enough to keep the UI honest.
    setEmailOn(next);
    setEmailBusy(true);
    try {
      const patch = Object.fromEntries(EMAIL_PREF_KEYS.map(k => [k, next])) as Partial<UserPreferences>;
      await preferencesApi.update(patch);
    } catch (err: any) {
      setEmailOn(!next);
      Alert.alert('Could not update', err?.response?.data?.message ?? 'Try again in a moment.');
    } finally { setEmailBusy(false); }
  }

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
        <HeroHeader variant="tall" align="center">
          <View style={styles.heroBody}>
            <View
              style={[
                styles.avatarRing,
                { borderColor: theme.accent, shadowColor: theme.accent },
              ]}
            >
              <Avatar
                name={player.name}
                photoUrl={player.profilePhotoUrl}
                size={96}
                onPress={() => setPhotoOpen(true)}
              />
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
                <Text style={[typography.caption, { color: 'rgba(255,255,255,0.75)' }]}>GLOBAL</Text>
                <Text style={[styles.ratingVal, { color: theme.accent }]}>{player.globalRating}</Text>
              </View>
              <View style={[styles.ratingPill, { borderColor: 'rgba(255,255,255,0.3)' }]}>
                <Text style={[typography.caption, { color: 'rgba(255,255,255,0.75)' }]}>COUNTRY</Text>
                <Text style={styles.ratingVal}>{player.countryRating}</Text>
              </View>
            </View>
          </View>
        </HeroHeader>

        <View style={{ padding: spacing.base, gap: spacing.base }}>
          {/* Quick actions — 4 most-used in one horizontal row */}
          <View style={{ marginHorizontal: -spacing.xs }}>
            <FeatureTileGrid
              variant="compact"
              tiles={[
                {
                  key: 'profile', icon: 'person-outline', label: 'My Profile', tint: 'sport',
                  // PlayerProfile lives on the root stack (above the tabs).
                  onPress: () => {
                    const root = navigation.getParent()?.getParent() ?? navigation.getParent() ?? navigation;
                    root.navigate('PlayerProfile', { playerId: player.id });
                  },
                },
                { key: 'history', icon: 'list-outline',     label: 'History',   tint: 'blue',   onPress: () => navigation.navigate('MatchHistory') },
                { key: 'pay',     icon: 'card-outline',     label: 'Payments',  tint: 'green',  onPress: () => navigation.navigate('PaymentHistory') },
                { key: 'assist',  icon: 'sparkles-outline', label: 'Assistant', tint: 'accent', onPress: () => navigation.navigate('Assistant') },
              ]}
            />
          </View>

          {/* Admin shortcut — prominent, only for admins */}
          {isAdmin && (
            <Card padding={0} onPress={() => navigation.navigate('AdminHome')}>
              <ListRow
                icon="shield-checkmark-outline"
                iconColor="#fff"
                iconBg={theme.dangerRed}
                title="Admin Panel"
                subtitle="Users, payments, analytics"
                showChevron
                style={{ paddingHorizontal: spacing.base }}
              />
            </Card>
          )}

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

          {/* Account Settings */}
          <Card padding={0}>
            <View style={{ paddingHorizontal: spacing.base, paddingTop: spacing.sm }}>
              <SectionHeader title="Account Settings" icon="settings-outline" />
              <InfoRow icon="id-card-outline" label="Member ID" value={player.id.slice(0, 8).toUpperCase()} last />
            </View>
            <View style={{ paddingHorizontal: spacing.base }}>
              <ListRow
                icon="key-outline"
                title="Change Password"
                subtitle="Update your sign-in password"
                showChevron
                divider
                onPress={() => navigation.navigate('ChangePassword')}
              />
              <ListRow
                icon="finger-print-outline"
                title={`${bioLabel} Sign-In`}
                subtitle={
                  !bioAvailable
                    ? `Not set up on this device`
                    : bioOn
                      ? `Required to unlock the app`
                      : `Use ${bioLabel} to unlock the app`
                }
                divider
                trailing={
                  <Switch
                    value={bioOn}
                    onValueChange={toggleBiometric}
                    disabled={!bioAvailable || bioBusy}
                    trackColor={{ true: theme.accent, false: theme.border }}
                    thumbColor="#fff"
                  />
                }
              />
              <ListRow
                icon="mail-outline"
                title="Email Notifications"
                subtitle={emailOn ? 'Sending updates to your inbox' : 'All emails turned off'}
                divider
                trailing={
                  <Switch
                    value={emailOn ?? false}
                    onValueChange={toggleEmail}
                    disabled={emailOn === null || emailBusy}
                    trackColor={{ true: theme.accent, false: theme.border }}
                    thumbColor="#fff"
                  />
                }
              />
              <ListRow
                icon="trash-outline"
                iconColor={theme.dangerRed}
                title="Delete Account"
                subtitle="Permanently remove your account"
                showChevron
                divider
                onPress={() => navigation.navigate('DeleteAccount')}
              />
            </View>
          </Card>

          {/* Help & Legal — collapsed list of secondary destinations */}
          <Card padding={0}>
            <View style={{ paddingHorizontal: spacing.base, paddingTop: spacing.sm }}>
              <SectionHeader title="Help & Legal" icon="help-buoy-outline" />
            </View>
            <View style={{ paddingHorizontal: spacing.base }}>
              <ListRow
                icon="mail-outline"
                title="Contact"
                subtitle="Reach the team"
                showChevron
                onPress={() => navigation.navigate('Contact')}
              />
              <ListRow
                icon="notifications-outline"
                title="Notifications & Privacy"
                subtitle="Email, push, and visibility"
                showChevron
                divider
                onPress={() => navigation.navigate('Settings')}
              />
              <ListRow
                icon="information-circle-outline"
                title="About"
                subtitle="Mission, sports"
                showChevron
                divider
                onPress={() => navigation.navigate('About')}
              />
              <ListRow
                icon="list-circle-outline"
                title="Rules"
                subtitle="Tournament rules"
                showChevron
                divider
                onPress={() => navigation.navigate('Rules')}
              />
              <ListRow
                icon="shield-outline"
                title="Privacy Policy"
                showChevron
                divider
                onPress={() => navigation.navigate('Privacy')}
              />
              <ListRow
                icon="document-text-outline"
                title="Terms of Service"
                showChevron
                divider
                onPress={() => navigation.navigate('Terms')}
              />
              <ListRow
                icon="cash-outline"
                title="Refunds Policy"
                showChevron
                divider
                onPress={() => navigation.navigate('Refunds')}
              />
              <ListRow
                icon="ban-outline"
                title="Blocked Users"
                showChevron
                onPress={() => navigation.navigate('BlockedUsers')}
              />
            </View>
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

      <PhotoLightbox
        visible={photoOpen}
        photoUrl={player.profilePhotoUrl}
        caption={player.name}
        onClose={() => setPhotoOpen(false)}
      />
    </View>
  );
}

function InfoRow({ icon, label, value, last }: { icon: any; label: string; value: string; last?: boolean }) {
  const { theme } = useSport();
  return (
    <View style={[styles.infoRow, !last && { borderBottomWidth: 1, borderBottomColor: theme.divider }]}>
      <View style={[styles.infoIcon, { backgroundColor: theme.featureBg, borderColor: theme.border }]}>
        <Ionicons name={icon} size={14} color={theme.accent} />
      </View>
      <Text style={[typography.overline, { color: theme.textMuted, flex: 1, fontSize: 11 }]}>{label}</Text>
      <View style={[
        {
          paddingHorizontal: 8, paddingVertical: 3,
          borderRadius: 4,
          borderWidth: 1,
          borderColor: `${theme.accent}40`,
          backgroundColor: theme.featureBg,
        },
      ]}>
        <Text style={[
          typography.caption,
          { color: theme.accent, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
        ]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroBody: { alignItems: 'center' },
  avatarRing: {
    padding: 3,
    borderRadius: 56,
    borderWidth: 3,
    shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 8,
    marginBottom: spacing.md,
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
    width: 30, height: 30, borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
});
