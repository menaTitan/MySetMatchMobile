import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, RefreshControl, Alert, TextInput, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tournamentsApi, type RegistrationRow } from '../../api';
import { useSport } from '../../context/SportContext';
import { useFetchData } from '../../hooks/useFetchData';
import { radii, spacing, typography } from '../../theme';
import { Avatar, BottomSheet, Button, Card, Chip, EmptyState, LoadingView, PageHeader, useToast } from '../../components/ui';

type Tab = 'players' | 'actions';

export default function ManageTournamentScreen({ route, navigation }: any) {
  const { id, name } = route.params;
  const { theme } = useSport();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('players');
  const [extendOpen, setExtendOpen] = useState(false);
  const [newDeadline, setNewDeadline] = useState('');
  const [busy, setBusy] = useState(false);

  // Edit-participant sheet state.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ firstName: string; lastName: string; email: string; phone: string }>({
    firstName: '', lastName: '', email: '', phone: '',
  });
  const [editLoading, setEditLoading] = useState(false);

  async function openEdit(regId: string) {
    setEditingId(regId);
    setEditLoading(true);
    try {
      const { data: r } = await tournamentsApi.registrationDetail(regId);
      setEditForm({
        firstName: r.firstName ?? '',
        lastName: r.lastName ?? '',
        email: r.email ?? '',
        phone: r.phone ?? '',
      });
    } catch {} finally { setEditLoading(false); }
  }

  async function saveEdit() {
    if (!editingId) return;
    setBusy(true);
    try {
      await tournamentsApi.updateRegistration(editingId, editForm as any);
      toast('Saved', 'success');
      setEditingId(null);
      reload();
    } catch (err: any) {
      Alert.alert('Failed', err?.response?.data?.message ?? 'Could not save changes.');
    } finally { setBusy(false); }
  }

  const { data, loading, refreshing, refresh, reload } = useFetchData<RegistrationRow[]>(
    async () => (await tournamentsApi.registrations(id)).data,
    [id],
  );

  async function approve(regId: string) {
    try { await tournamentsApi.approveRegistration(id, regId); toast('Approved', 'success'); reload(); }
    catch {}
  }

  async function reject(regId: string, playerName: string) {
    Alert.alert('Reject registration', `Reject ${playerName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: async () => {
        try { await tournamentsApi.rejectRegistration(id, regId); reload(); }
        catch {}
      } },
    ]);
  }

  async function removeReg(regId: string, playerName: string) {
    Alert.alert('Remove player', `Permanently remove ${playerName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try { await tournamentsApi.removeRegistration(regId); toast('Removed', 'success'); reload(); }
        catch {}
      } },
    ]);
  }

  async function doAction(label: string, fn: () => Promise<any>, confirm = true) {
    const run = async () => {
      setBusy(true);
      try { await fn(); toast(`${label} done`, 'success'); reload(); }
      catch (err: any) { Alert.alert('Failed', err?.response?.data?.message ?? `${label} failed`); }
      finally { setBusy(false); }
    };
    if (!confirm) return run();
    Alert.alert(label, `${label} this tournament?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: label, onPress: run },
    ]);
  }

  async function extendDeadline() {
    if (!newDeadline) { Alert.alert('Date required', 'Enter a date in YYYY-MM-DD format.'); return; }
    setBusy(true);
    try {
      await tournamentsApi.extendDeadline(id, new Date(newDeadline).toISOString());
      toast('Deadline extended', 'success');
      setExtendOpen(false);
      setNewDeadline('');
    } catch (err: any) {
      Alert.alert('Failed', err?.response?.data?.message ?? 'Could not extend.');
    } finally { setBusy(false); }
  }

  const regs = data ?? [];
  const pending = regs.filter((r) => r.status === 'Pending');
  const confirmed = regs.filter((r) => r.status === 'Confirmed');
  const withdrawn = regs.filter((r) => r.status === 'Withdrawn');

  const playersList = [
    { kind: 'header' as const, title: 'Pending approval', count: pending.length },
    ...pending.map((r) => ({ kind: 'pending' as const, reg: r })),
    { kind: 'header' as const, title: 'Confirmed', count: confirmed.length },
    ...confirmed.map((r) => ({ kind: 'confirmed' as const, reg: r })),
    ...(withdrawn.length ? [{ kind: 'header' as const, title: 'Withdrawn', count: withdrawn.length }] : []),
    ...withdrawn.map((r) => ({ kind: 'withdrawn' as const, reg: r })),
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <PageHeader title="Manage" subtitle={name ?? 'Tournament'} compact />

      <View style={[styles.tabs, { backgroundColor: theme.cardBg, borderBottomColor: theme.divider }]}>
        <Pressable
          onPress={() => setTab('players')}
          style={[styles.tab, tab === 'players' && { borderBottomColor: theme.primary }]}
        >
          <Text style={[typography.smallStrong, { color: tab === 'players' ? theme.primary : theme.textMuted }]}>
            Players ({regs.length})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab('actions')}
          style={[styles.tab, tab === 'actions' && { borderBottomColor: theme.primary }]}
        >
          <Text style={[typography.smallStrong, { color: tab === 'actions' ? theme.primary : theme.textMuted }]}>
            Actions
          </Text>
        </Pressable>
      </View>

      {tab === 'players' ? (
        loading ? <LoadingView /> : (
          <FlatList
            data={playersList}
            keyExtractor={(item, i) => (item.kind === 'header' ? `h-${item.title}-${i}` : `${item.reg.registrationId}`)}
            renderItem={({ item }) => {
              if (item.kind === 'header')
                return (
                  <View style={styles.sectionHead}>
                    <Text style={[typography.overline, { color: theme.secondary }]}>{item.title}</Text>
                    <Text style={[typography.caption, { color: theme.textMuted }]}>{item.count}</Text>
                  </View>
                );
              const r = item.reg;
              return (
                <Card padding={0}>
                  <View style={styles.row}>
                    <Avatar name={r.playerName} size={40} />
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.bodyStrong, { color: theme.textPrimary }]} numberOfLines={1}>
                        {r.playerName}
                      </Text>
                      <Text style={[typography.caption, { color: theme.textMuted }]} numberOfLines={1}>
                        Rating {r.globalRating}{r.city ? ` · ${r.city}` : ''}{r.country ? `, ${r.country}` : ''}
                      </Text>
                    </View>
                    {item.kind === 'pending' ? (
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <Pressable onPress={() => openEdit(r.registrationId)} style={[styles.btn, { backgroundColor: theme.featureBg }]}>
                          <Ionicons name="create-outline" size={14} color={theme.secondary} />
                        </Pressable>
                        <Pressable onPress={() => approve(r.registrationId)} style={[styles.btn, { backgroundColor: 'rgba(34,197,94,0.12)' }]}>
                          <Ionicons name="checkmark" size={16} color={theme.successGreen} />
                        </Pressable>
                        <Pressable onPress={() => reject(r.registrationId, r.playerName)} style={[styles.btn, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
                          <Ionicons name="close" size={16} color={theme.dangerRed} />
                        </Pressable>
                      </View>
                    ) : item.kind === 'confirmed' ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Chip label="IN" color="success" variant="soft" size="sm" />
                        <Pressable onPress={() => openEdit(r.registrationId)} style={[styles.btn, { backgroundColor: theme.featureBg }]}>
                          <Ionicons name="create-outline" size={14} color={theme.secondary} />
                        </Pressable>
                        <Pressable onPress={() => removeReg(r.registrationId, r.playerName)} style={[styles.btn, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
                          <Ionicons name="trash-outline" size={14} color={theme.dangerRed} />
                        </Pressable>
                      </View>
                    ) : (
                      <Chip label="OUT" color="muted" variant="soft" size="sm" />
                    )}
                  </View>
                </Card>
              );
            }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.accent} />}
            contentContainerStyle={{ padding: spacing.base, gap: spacing.xs + 2 }}
            ListHeaderComponent={
              <Button
                title="Add Player"
                onPress={() => navigation.navigate('AddPlayer', { tournamentId: id, name })}
                leftIcon="person-add-outline"
                variant="primary" size="md" fullWidth uppercase={false}
                style={{ marginBottom: spacing.sm }}
              />
            }
            ListEmptyComponent={
              <EmptyState icon="people-outline" title="No registrations yet" />
            }
          />
        )
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: spacing.base, gap: spacing.sm }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.accent} />}
        >
          <Card>
            <Text style={[typography.h3, { color: theme.primary, marginBottom: spacing.sm }]}>Tournament lifecycle</Text>
            <ActionBtn label="Start Tournament" icon="play-outline" color={theme.successGreen} onPress={() => doAction('Start', () => tournamentsApi.start(id))} disabled={busy} />
            <ActionBtn label="Extend Registration Deadline" icon="time-outline" onPress={() => setExtendOpen(true)} disabled={busy} />
            <ActionBtn label="Cancel Tournament" icon="close-circle-outline" color={theme.warning} onPress={() => doAction('Cancel', () => tournamentsApi.cancel(id))} disabled={busy} />
            <ActionBtn label="Finish Tournament" icon="trophy-outline" color={theme.accent} onPress={() => doAction('Finish', () => tournamentsApi.finish(id))} disabled={busy} />
          </Card>

          <Card>
            <Text style={[typography.h3, { color: theme.primary, marginBottom: spacing.sm }]}>Brackets</Text>
            <ActionBtn label="Generate Group Stage" icon="grid-outline" onPress={() => doAction('Generate groups', () => tournamentsApi.generateGroups(id))} disabled={busy} />
            <ActionBtn label="Generate Knockout Stage" icon="git-branch-outline" onPress={() => doAction('Generate knockout', () => tournamentsApi.generateKnockout(id))} disabled={busy} />
            <ActionBtn label="Regenerate Knockout (after groups complete)" icon="refresh-outline" onPress={() => doAction('Regenerate knockout', () => tournamentsApi.regenerateKnockout(id))} disabled={busy} />
            <ActionBtn label="Open Bracket Editor" icon="construct-outline" onPress={() => navigation.navigate('BracketEditor', { tournamentId: id, name })} />
            <ActionBtn label="View Brackets" icon="eye-outline" onPress={() => navigation.navigate('Brackets', { tournamentId: id, name })} />
          </Card>

          <Card>
            <Text style={[typography.h3, { color: theme.primary, marginBottom: spacing.sm }]}>Communications & payments</Text>
            <ActionBtn label="Send Results Email" icon="mail-outline" onPress={() => doAction('Send results email', () => tournamentsApi.sendResultsEmail(id))} disabled={busy} />
            <ActionBtn label="Tournament Payments" icon="card-outline" onPress={() => navigation.navigate('TournamentPayments', { tournamentId: id, name })} />
            <ActionBtn label="Create Tournament Chat" icon="chatbubble-ellipses-outline" onPress={async () => {
              try { const { chatApi } = await import('../../api'); const r = await chatApi.createTournamentChat(id); toast('Chat created', 'success'); navigation.navigate('ChatRoom', { roomId: r.data.id }); } catch {}
            }} />
          </Card>

          <Card>
            <Text style={[typography.h3, { color: theme.primary, marginBottom: spacing.sm }]}>Edit / Danger zone</Text>
            <ActionBtn label="Edit Tournament" icon="create-outline" onPress={() => navigation.navigate('CreateTournament', { id, edit: true })} />
            <ActionBtn label="Tournament Winners" icon="trophy-outline" onPress={() => navigation.navigate('TournamentWinners', { tournamentId: id, name })} />
            <ActionBtn label="Delete Tournament" icon="trash-outline" color={theme.dangerRed} onPress={() =>
              Alert.alert('Delete tournament', 'This is permanent. All registrations and matches will be removed.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: async () => {
                  try { await tournamentsApi.delete(id); toast('Deleted', 'success'); navigation.popToTop(); }
                  catch (err: any) { Alert.alert('Error', err?.response?.data?.message ?? 'Failed'); }
                } },
              ])
            } disabled={busy} />
          </Card>
        </ScrollView>
      )}

      <BottomSheet
        visible={!!editingId}
        onClose={() => setEditingId(null)}
        title="Edit participant"
        subtitle="Update contact details. Status changes use the row buttons."
      >
        {editLoading ? <LoadingView /> : (
          <View style={{ gap: spacing.sm }}>
            <TextInput
              value={editForm.firstName}
              onChangeText={(v) => setEditForm((f) => ({ ...f, firstName: v }))}
              placeholder="First name"
              placeholderTextColor={theme.textMuted}
              style={[styles.input, { borderColor: theme.border, color: theme.textPrimary }]}
            />
            <TextInput
              value={editForm.lastName}
              onChangeText={(v) => setEditForm((f) => ({ ...f, lastName: v }))}
              placeholder="Last name"
              placeholderTextColor={theme.textMuted}
              style={[styles.input, { borderColor: theme.border, color: theme.textPrimary }]}
            />
            <TextInput
              value={editForm.email}
              onChangeText={(v) => setEditForm((f) => ({ ...f, email: v }))}
              placeholder="Email"
              placeholderTextColor={theme.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              style={[styles.input, { borderColor: theme.border, color: theme.textPrimary }]}
            />
            <TextInput
              value={editForm.phone}
              onChangeText={(v) => setEditForm((f) => ({ ...f, phone: v }))}
              placeholder="Phone"
              placeholderTextColor={theme.textMuted}
              keyboardType="phone-pad"
              style={[styles.input, { borderColor: theme.border, color: theme.textPrimary }]}
            />
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
              <Button title="Cancel" variant="ghost" onPress={() => setEditingId(null)} style={{ flex: 1 }} />
              <Button title="Save" variant="primary" onPress={saveEdit} loading={busy} style={{ flex: 1 }} />
            </View>
          </View>
        )}
      </BottomSheet>

      <BottomSheet
        visible={extendOpen}
        onClose={() => setExtendOpen(false)}
        title="Extend deadline"
        subtitle="Enter the new registration deadline."
      >
        <TextInput
          value={newDeadline}
          onChangeText={setNewDeadline}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={theme.textMuted}
          style={[styles.input, { borderColor: theme.border, color: theme.textPrimary }]}
        />
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
          <Button title="Cancel" variant="ghost" onPress={() => setExtendOpen(false)} style={{ flex: 1 }} />
          <Button title="Extend" variant="primary" onPress={extendDeadline} loading={busy} style={{ flex: 1 }} />
        </View>
      </BottomSheet>
    </View>
  );
}

function ActionBtn({
  label, icon, color, onPress, disabled,
}: { label: string; icon: any; color?: string; onPress: () => void; disabled?: boolean }) {
  const { theme } = useSport();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.actionRow,
        { borderColor: theme.divider, opacity: disabled ? 0.5 : pressed ? 0.7 : 1 },
      ]}
    >
      <View style={[styles.actionIcon, { backgroundColor: theme.featureBg }]}>
        <Ionicons name={icon} size={16} color={color ?? theme.primary} />
      </View>
      <Text style={[typography.body, { color: color ?? theme.textPrimary, flex: 1 }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: spacing.sm + 4, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },

  sectionHead: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    paddingTop: spacing.sm, paddingBottom: 4,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2,
    padding: spacing.sm + 4,
    borderRadius: radii.md,
  },
  btn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },

  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    borderTopWidth: 1,
  },
  actionIcon: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },

  input: {
    borderWidth: 1, borderRadius: radii.md,
    padding: spacing.sm + 2, fontSize: 16,
  },
});
