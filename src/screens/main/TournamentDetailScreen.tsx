import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Share } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { chatApi, matchesApi, paymentApi, tournamentsApi } from '../../api';
import { API_BASE_URL } from '../../config/env';
import { useAuth } from '../../context/AuthContext';
import { useSport } from '../../context/SportContext';
import { getHub } from '../../realtime/signalR';
import type { BracketRound, TournamentDetail } from '../../types';
import { spacing, typography } from '../../theme';
import {
  Button, Card, Chip, EmptyState, LoadingView, SectionHeader,
  SegmentedTabs, type SegmentedTab, useToast,
} from '../../components/ui';
import BracketPane from '../../components/tournament/BracketPane';
import PlayersPane from '../../components/tournament/PlayersPane';
import MatchesPane from '../../components/tournament/MatchesPane';

type TabKey = 'bracket' | 'players' | 'mine' | 'matches';

const TABS: SegmentedTab<TabKey>[] = [
  { key: 'bracket',  label: 'Bracket',    icon: 'git-branch-outline' },
  { key: 'players',  label: 'Players',    icon: 'people-outline' },
  { key: 'mine',     label: 'My Matches', icon: 'person-outline' },
  { key: 'matches',  label: 'Matches',    icon: 'list-outline' },
];

export default function TournamentDetailScreen({ route, navigation }: any) {
  const { id } = route.params;
  const { player } = useAuth();
  const { theme } = useSport();
  const toast = useToast();
  const [data, setData] = useState<TournamentDetail | null>(null);
  const [rounds, setRounds] = useState<BracketRound[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('bracket');

  // Reload whenever the screen regains focus (e.g. returning from ScoreEntry
  // after submitting a score). SignalR also pushes live updates while we're
  // foregrounded — this is the belt-and-braces for when it isn't connected.
  useFocusEffect(useCallback(() => { load(); }, [id]));

  // Tournament-level realtime: any score update inside this tournament
  // emits TournamentMatchUpdate; refresh detail + brackets so counts and the
  // active tab pane stay current.
  useEffect(() => {
    let off: (() => void) | undefined;
    (async () => {
      try {
        const hub = await getHub('liveScore');
        await hub.invoke('JoinTournamentGroup', id).catch(() => {});
        const handler = () => { load(); };
        hub.on('TournamentMatchUpdate', handler);
        off = () => {
          hub.off('TournamentMatchUpdate', handler);
          hub.invoke('LeaveTournamentGroup', id).catch(() => {});
        };
      } catch {}
    })();
    return () => { if (off) off(); };
  }, [id]);

  async function load() {
    setLoading(true);
    try {
      const [detail, brackets] = await Promise.all([
        tournamentsApi.detail(id),
        matchesApi.brackets(id).catch(() => ({ data: [] as BracketRound[] })),
      ]);
      setData(detail.data);
      setRounds(brackets.data);
    } catch {}
    finally { setLoading(false); }
  }

  async function handleRegister() {
    if (!player) { Alert.alert('Sign In Required', 'Please sign in to register.'); return; }
    setActionLoading(true);
    try {
      if (data && data.entryFee != null && data.entryFee > 0) {
        // Paid tournament — open Stripe Checkout in an in-app browser tab.
        // openAuthSessionAsync watches for our mysetmatch://payment/* redirect
        // and auto-closes the tab + returns control here when Stripe finishes.
        // openBrowserAsync (the previous call) resolved the moment the tab
        // opened, so the immediate load() ran while the user was still on
        // Stripe — leaving the screen stuck on "Register" instead of
        // reflecting the new payment + registration state.
        const returnUrl = 'mysetmatch://payment/return';
        const { data: resp } = await paymentApi.createCheckout({
          tournamentId: id,
          successUrl: 'mysetmatch://payment/success',
          cancelUrl: 'mysetmatch://payment/cancel',
        });
        const result = await WebBrowser.openAuthSessionAsync(resp.checkoutUrl, returnUrl);
        if (result.type === 'success' && result.url?.includes('payment/success')) {
          toast('Payment successful — registering you now…', 'success');
        } else if (result.type === 'success' && result.url?.includes('payment/cancel')) {
          toast('Payment cancelled', 'warning');
        }
        // Either way, refresh — Stripe's webhook updates the payment row +
        // registration on the server. There's a brief lag before the webhook
        // fires, so retry once after a short delay if still not registered.
        await load();
        if (!data?.isRegistered) {
          setTimeout(() => load(), 2500);
        }
        return;
      }
      await tournamentsApi.register(id);
      toast('Registered!', 'success');
      await load();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      if (msg) Alert.alert('Error', msg);
    } finally { setActionLoading(false); }
  }

  async function handleUnregister() {
    const inProgress = data?.status === 'Ongoing';
    const title = inProgress ? 'Withdraw from tournament' : 'Cancel registration';
    const body = inProgress
      ? 'You will be marked as withdrawn and any remaining matches will be forfeited. Continue?'
      : 'Are you sure you want to cancel your registration?';
    Alert.alert(title, body, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: inProgress ? 'Withdraw' : 'Cancel registration',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(true);
          try {
            if (inProgress) await tournamentsApi.withdraw(id);
            else await tournamentsApi.unregister(id);
            await load();
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message ?? 'Could not withdraw.');
          } finally { setActionLoading(false); }
        },
      },
    ]);
  }

  async function handleShare() {
    if (!data) return;
    const url = `${API_BASE_URL}/Tournament/Details/${id}`;
    const dateStr = new Date(data.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const where = data.city ? ` in ${data.city}${data.country ? `, ${data.country}` : ''}` : '';
    const sport = data.sportName ? ` ${data.sportName}` : '';
    const message = `Check out the ${data.name}${sport} tournament${where} on ${dateStr}.\n${url}`;
    try {
      await Share.share(
        // iOS reads `url` separately so it can attach a rich preview; Android
        // only reads `message`, so include the link there too.
        { title: data.name, message, url },
        { dialogTitle: 'Share tournament' },
      );
    } catch {
      // user cancelled or platform-level error — nothing to do
    }
  }

  if (loading) return <LoadingView />;
  if (!data) return <EmptyState icon="trophy-outline" title="Tournament not found" message="It may have been deleted or the link is invalid." />;

  const canRegister = data.status === 'Upcoming' && !data.isRegistered;
  const isFull = data.maxPlayers != null && data.registeredCount >= data.maxPlayers;
  const statusColor: any = data.status === 'Finished' ? 'success'
    : data.status === 'Ongoing' ? 'warning'
    : 'primary';

  // Tab counts shown in the segmented control.
  const tabsWithCounts: SegmentedTab<TabKey>[] = TABS.map((t) => {
    if (t.key === 'players') return { ...t, count: data.registrations.length };
    if (t.key === 'matches') return { ...t, count: rounds?.reduce((acc, r) => acc + r.matches.length, 0) ?? 0 };
    if (t.key === 'mine' && player?.id) {
      const mine = (rounds ?? []).reduce((acc, r) =>
        acc + r.matches.filter(m => m.player1?.id === player.id || m.player2?.id === player.id).length, 0);
      return { ...t, count: mine };
    }
    return t;
  });

  const openPlayer = (playerId: string) => {
    const root = navigation.getParent()?.getParent() ?? navigation.getParent() ?? navigation;
    root.navigate('PlayerProfile', { playerId });
  };

  const openScoreEntry = (matchId: string) => {
    // ScoreEntry lives in the Play stack; TournamentDetail is already part of it.
    navigation.navigate('ScoreEntry', { matchId });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.pageBg }]}
      contentContainerStyle={{ paddingBottom: spacing.xxl }}
      stickyHeaderIndices={[1]}
    >
      {/* ── Overview header ───────────────────────────────────────── */}
      <View style={{ padding: spacing.base }}>
        <Text style={[typography.h1, { color: theme.textPrimary, marginBottom: spacing.sm }]}>
          {data.name}
        </Text>
        <View style={styles.chipRow}>
          <Chip label={data.status} color={statusColor} variant="soft" size="sm" />
          {data.sportName && <Chip label={data.sportName} color="primary" variant="soft" size="sm" />}
          {data.isDoubles && <Chip label="Doubles" color="accent" variant="soft" size="sm" leadingEmoji="👥" />}
          {data.privateFeedId && (
            <Chip
              label={data.privateFeedName ?? 'Private'}
              color="muted"
              variant="solid"
              size="sm"
              leadingEmoji="🔒"
            />
          )}
        </View>

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

          {data.status === 'Ongoing' && (
            <Button
              title="View Live Scores"
              variant="ghost"
              size="lg"
              leftIcon="radio-outline"
              uppercase={false}
              onPress={() => navigation.navigate('LiveScore', { tournamentId: id, tournamentName: data.name })}
              fullWidth
            />
          )}

          <Button
            title="Share"
            variant="ghost"
            size="lg"
            leftIcon="share-social-outline"
            uppercase={false}
            onPress={handleShare}
            fullWidth
          />

          {data.status === 'Finished' && (
            <Button
              title="Download Results PDF"
              variant="ghost"
              size="lg"
              leftIcon="document-text-outline"
              uppercase={false}
              onPress={async () => {
                const path = tournamentsApi.resultsPdfUrl(id);
                const url = path.startsWith('http') ? path : `${API_BASE_URL}/api${path}`;
                await WebBrowser.openBrowserAsync(url);
              }}
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

          {(data.isRegistered || data.isOrganizer) ? (
            <Button
              title="Tournament Chat"
              variant="ghost"
              size="lg"
              leftIcon="chatbubbles-outline"
              uppercase={false}
              onPress={async () => {
                try {
                  const r = await chatApi.createTournamentChat(id);
                  const root = navigation.getParent()?.getParent() ?? navigation.getParent() ?? navigation;
                  // RootStack → Main → Community tab → ChatRoom.
                  root.navigate('Main', {
                    screen: 'Community',
                    params: {
                      screen: 'ChatRoom',
                      params: { roomId: r.data.id, title: data.name },
                    },
                  });
                } catch (err: any) {
                  Alert.alert('Error', err?.response?.data?.message ?? 'Could not open tournament chat.');
                }
              }}
              fullWidth
            />
          ) : null}
        </View>

        {data.description ? (
          <Card>
            <SectionHeader title="About" icon="information-circle-outline" />
            <Text style={[typography.body, { color: theme.textSecondary }]}>{data.description}</Text>
          </Card>
        ) : null}
      </View>

      {/* ── Tab strip (sticky) ────────────────────────────────────── */}
      <SegmentedTabs<TabKey>
        tabs={tabsWithCounts}
        value={activeTab}
        onChange={setActiveTab}
        variant="underline"
      />

      {/* ── Active pane ───────────────────────────────────────────── */}
      <View style={{ paddingTop: spacing.base }}>
        {activeTab === 'bracket' && <BracketPane rounds={rounds} />}
        {activeTab === 'players' && (
          <PlayersPane players={data.registrations} onOpenPlayer={openPlayer} />
        )}
        {activeTab === 'mine' && (
          <MatchesPane
            rounds={rounds}
            mineOnly
            myPlayerId={player?.id}
            onMatchPress={openScoreEntry}
          />
        )}
        {activeTab === 'matches' && (
          <MatchesPane rounds={rounds} onMatchPress={openScoreEntry} />
        )}
      </View>
    </ScrollView>
  );
}

function InfoRow({
  icon, label, value, last,
}: { icon: any; label: string; value: string; last?: boolean }) {
  const { theme } = useSport();
  return (
    <View style={[styles.infoRow, !last && { borderBottomWidth: 1, borderBottomColor: theme.divider }]}>
      <View style={[styles.infoIconBox, { backgroundColor: theme.featureBg, borderColor: theme.border }]}>
        <Ionicons name={icon} size={14} color={theme.accent} />
      </View>
      <Text style={[typography.overline, { color: theme.textMuted, flex: 1, fontSize: 11 }]}>{label}</Text>
      <Text style={[typography.bodyStrong, { color: theme.textPrimary }]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.base },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
  },
  infoIconBox: {
    width: 30, height: 30, borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
});
