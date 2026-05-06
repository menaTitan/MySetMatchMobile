import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { paymentApi, tournamentsApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useSport } from '../../context/SportContext';
import type { TournamentDetail } from '../../types';
import { radii, spacing, typography } from '../../theme';
import { Avatar, Button, Card, Chip, EmptyState, LoadingView, SectionHeader, useToast } from '../../components/ui';

export default function TournamentDetailScreen({ route, navigation }: any) {
  const { id } = route.params;
  const { player } = useAuth();
  const { theme } = useSport();
  const toast = useToast();
  const [data, setData] = useState<TournamentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { load(); }, [id]);

  async function load() {
    setLoading(true);
    try {
      const r = await tournamentsApi.detail(id);
      setData(r.data);
    } catch {}
    finally { setLoading(false); }
  }

  async function handleRegister() {
    if (!player) { Alert.alert('Sign In Required', 'Please sign in to register.'); return; }
    setActionLoading(true);
    try {
      // Paid tournament → go via Stripe Checkout
      if (data && data.entryFee != null && data.entryFee > 0) {
        const { data: resp } = await paymentApi.createCheckout({ tournamentId: id });
        await WebBrowser.openBrowserAsync(resp.checkoutUrl);
        // When the user returns, re-load so registration state reflects the webhook.
        await load();
        toast('Check your email for a receipt once payment completes.', 'info', 5000);
        return;
      }
      await tournamentsApi.register(id);
      toast('Registered!', 'success');
      await load();
    } catch (err: any) {
      // interceptor shows generic error toast; only alert for explicit messages
      const msg = err?.response?.data?.message;
      if (msg) Alert.alert('Error', msg);
    } finally { setActionLoading(false); }
  }

  async function handleUnregister() {
    Alert.alert('Withdraw', 'Are you sure you want to withdraw from this tournament?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Withdraw', style: 'destructive', onPress: async () => {
          setActionLoading(true);
          try {
            await tournamentsApi.unregister(id);
            await load();
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message ?? 'Could not withdraw.');
          } finally { setActionLoading(false); }
        },
      },
    ]);
  }

  if (loading) return <LoadingView />;
  if (!data) return <EmptyState icon="trophy-outline" title="Tournament not found" message="It may have been deleted or the link is invalid." />;

  const canRegister = data.status === 'Upcoming' && !data.isRegistered;
  const isFull = data.maxPlayers != null && data.registeredCount >= data.maxPlayers;
  const statusColor: any = data.status === 'Completed' ? 'success'
    : data.status === 'InProgress' ? 'warning'
    : 'primary';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.pageBg }]}
      contentContainerStyle={{ padding: spacing.base, paddingBottom: spacing.xxl }}
    >
      {/* Title & chips */}
      <Text style={[typography.h1, { color: theme.textPrimary, marginBottom: spacing.sm }]}>
        {data.name}
      </Text>
      <View style={styles.chipRow}>
        <Chip label={data.status} color={statusColor} variant="soft" size="sm" />
        {data.sportName && <Chip label={data.sportName} color="primary" variant="soft" size="sm" />}
        {data.isDoubles && <Chip label="Doubles" color="accent" variant="soft" size="sm" leadingEmoji="👥" />}
      </View>

      {/* Info card */}
      <Card style={{ marginBottom: spacing.base }}>
        <InfoRow icon="calendar-outline" label="Start" value={new Date(data.startDate).toLocaleDateString()} />
        {data.endDate && <InfoRow icon="calendar-outline" label="End" value={new Date(data.endDate).toLocaleDateString()} />}
        {data.city && <InfoRow icon="location-outline" label="Location" value={`${data.city}, ${data.country}`} />}
        {data.venueAddress && <InfoRow icon="business-outline" label="Venue" value={data.venueAddress} />}
        <InfoRow icon="game-controller-outline" label="Format" value={data.type} />
        <InfoRow
          icon="people-outline"
          label="Players"
          value={`${data.registeredCount}${data.maxPlayers ? `/${data.maxPlayers}` : ''}`}
        />
        {data.entryFee != null && (
          <InfoRow
            icon="cash-outline"
            label="Entry Fee"
            value={data.entryFee === 0 ? 'Free' : `$${data.entryFee}`}
            last
          />
        )}
      </Card>

      {/* Action buttons */}
      <View style={{ gap: spacing.sm, marginBottom: spacing.base }}>
        {data.isRegistered ? (
          <Button
            title="Withdraw"
            variant="danger"
            size="lg"
            leftIcon="exit-outline"
            onPress={handleUnregister}
            loading={actionLoading}
            fullWidth
          />
        ) : canRegister ? (
          <Button
            title={isFull ? 'Tournament Full' : (data.entryFee && data.entryFee > 0 ? `Register · $${data.entryFee}` : 'Register Now')}
            variant="primary"
            size="lg"
            leftIcon={isFull ? 'close-circle-outline' : (data.entryFee && data.entryFee > 0 ? 'card-outline' : 'checkmark-circle-outline')}
            onPress={handleRegister}
            loading={actionLoading}
            disabled={isFull}
            fullWidth
          />
        ) : null}

        {(data.status === 'InProgress' || data.status === 'Completed') && (
          <Button
            title="View Brackets"
            variant="accent"
            size="lg"
            rightIcon="arrow-forward"
            onPress={() => navigation.navigate('Brackets', { tournamentId: id, name: data.name })}
            fullWidth
          />
        )}

        {data.isOrganizer ? (
          <Button
            title="Manage Registrations"
            variant="secondary"
            size="lg"
            leftIcon="people-outline"
            uppercase={false}
            onPress={() => navigation.navigate('ManageTournament', { id, name: data.name })}
            fullWidth
          />
        ) : null}
      </View>

      {/* Description */}
      {data.description ? (
        <Card style={{ marginBottom: spacing.base }}>
          <SectionHeader title="About" icon="information-circle-outline" />
          <Text style={[typography.body, { color: theme.textSecondary }]}>{data.description}</Text>
        </Card>
      ) : null}

      {/* Players */}
      {data.registrations.length > 0 && (
        <Card>
          <SectionHeader
            title="Registered Players"
            eyebrow={`${data.registrations.length} players`}
            icon="people-outline"
          />
          {data.registrations.map((p, i) => (
            <View
              key={p.id}
              style={[
                styles.playerRow,
                i > 0 && { borderTopWidth: 1, borderTopColor: theme.divider },
              ]}
            >
              <Avatar name={p.name} photoUrl={p.profilePhotoUrl} size={36} />
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyStrong, { color: theme.textPrimary }]}>{p.name}</Text>
                {p.city && (
                  <Text style={[typography.caption, { color: theme.textMuted }]}>
                    {p.city}{p.country ? `, ${p.country}` : ''}
                  </Text>
                )}
              </View>
              <View style={[styles.ratingPill, { backgroundColor: theme.featureBg }]}>
                <Text style={[typography.smallStrong, { color: theme.primary }]}>{p.globalRating}</Text>
              </View>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}

function InfoRow({
  icon, label, value, last,
}: { icon: any; label: string; value: string; last?: boolean }) {
  const { theme } = useSport();
  return (
    <View style={[styles.infoRow, !last && { borderBottomWidth: 1, borderBottomColor: theme.divider }]}>
      <View style={[styles.infoIconBox, { backgroundColor: theme.featureBg }]}>
        <Ionicons name={icon} size={14} color={theme.secondary} />
      </View>
      <Text style={[typography.small, { color: theme.textMuted, flex: 1 }]}>{label}</Text>
      <Text style={[typography.bodyStrong, { color: theme.textPrimary }]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.base },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
  },
  infoIconBox: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  playerRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
  },
  ratingPill: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.pill,
  },
});
