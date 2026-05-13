import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { privateGroupsApi, chatApi, type GroupMember, type ChatParticipantDto, type OutgoingInvitation } from '../../api';
import { useSport } from '../../context/SportContext';
import { radii, spacing, typography } from '../../theme';
import { Avatar, BottomSheet, Button, Chip, EmptyState, LoadingView, PageHeader, SearchBar, useToast } from '../../components/ui';

export default function GroupMembersScreen({ route }: any) {
  const { groupId, name } = route.params;
  const { theme } = useSport();
  const toast = useToast();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [pending, setPending] = useState<OutgoingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<ChatParticipantDto[]>([]);

  const load = useCallback(async () => {
    try {
      const [mem, inv] = await Promise.all([
        privateGroupsApi.members(groupId),
        privateGroupsApi.groupInvitations(groupId).catch(() => ({ data: [] as OutgoingInvitation[] })),
      ]);
      setMembers(mem.data);
      setPending(inv.data);
    } catch {} finally { setLoading(false); }
  }, [groupId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (q.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      try { const { data } = await chatApi.searchUsers(q.trim()); setResults(data); } catch {}
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  async function invite(u: ChatParticipantDto) {
    try {
      const { data } = await privateGroupsApi.invite(groupId, u.userId);
      toast(data.alreadyPending ? 'Already invited' : `Invitation sent to ${u.userName}`, 'success');
      load();
    } catch (err: any) {
      Alert.alert('Failed', err?.response?.data?.message ?? 'Could not invite.');
    }
  }

  async function cancelInvite(inv: OutgoingInvitation) {
    Alert.alert('Cancel invitation', `Cancel invite to ${inv.fullName ?? inv.userName ?? 'this user'}?`, [
      { text: 'Keep', style: 'cancel' },
      { text: 'Cancel invite', style: 'destructive', onPress: async () => {
        try { await privateGroupsApi.cancelInvitation(groupId, inv.id); load(); } catch {}
      } },
    ]);
  }

  async function remove(m: GroupMember) {
    Alert.alert('Remove member', `Remove ${m.userName} from the group?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try { await privateGroupsApi.removeMember(groupId, m.userId); load(); } catch {}
      } },
    ]);
  }

  if (loading) return <LoadingView />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <PageHeader title="Members" subtitle={name ?? 'Group members'} compact />
      <FlatList
        data={members}
        keyExtractor={(m) => m.userId}
        contentContainerStyle={{ padding: spacing.base, gap: spacing.xs + 2 }}
        ListHeaderComponent={
          <View>
            <Button title="Invite player" onPress={() => setAddOpen(true)} leftIcon="person-add-outline" variant="primary" size="md" fullWidth uppercase={false} style={{ marginBottom: spacing.sm }} />
            {pending.length > 0 ? (
              <View style={{ marginBottom: spacing.sm }}>
                <Text style={[typography.smallStrong, { color: theme.textSecondary, marginBottom: 6 }]}>
                  Pending invitations ({pending.length})
                </Text>
                {pending.map((p) => (
                  <View key={p.id} style={[styles.row, { backgroundColor: theme.cardBg, marginBottom: 6 }]}>
                    <Avatar name={p.userName ?? p.fullName} photoUrl={p.profilePhotoUrl} size={32} />
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.body, { color: theme.textPrimary }]}>
                        {p.fullName ?? p.userName}
                      </Text>
                      <Text style={[typography.caption, { color: theme.textMuted }]}>
                        Awaiting response · {new Date(p.createdDate).toLocaleDateString()}
                      </Text>
                    </View>
                    <Pressable onPress={() => cancelInvite(p)} style={styles.removeBtn}>
                      <Ionicons name="close-outline" size={18} color={theme.dangerRed} />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item: m }) => (
          <View style={[styles.row, { backgroundColor: theme.cardBg }]}>
            <Avatar name={m.userName} photoUrl={m.profilePhotoUrl} size={36} />
            <View style={{ flex: 1 }}>
              <Text style={[typography.bodyStrong, { color: theme.textPrimary }]}>{m.fullName ?? m.userName}</Text>
              <Text style={[typography.caption, { color: theme.textMuted }]}>
                Joined {new Date(m.joinedDate).toLocaleDateString()}
              </Text>
            </View>
            {m.isAdmin ? <Chip label="ADMIN" color="accent" variant="soft" size="sm" /> : (
              <Pressable onPress={() => remove(m)} style={styles.removeBtn}>
                <Ionicons name="trash-outline" size={16} color={theme.dangerRed} />
              </Pressable>
            )}
          </View>
        )}
        ListEmptyComponent={<EmptyState icon="people-outline" title="No members yet" />}
      />

      <BottomSheet visible={addOpen} onClose={() => setAddOpen(false)} title="Invite player" scrollable={false}>
        <SearchBar value={q} onChangeText={setQ} placeholder="Search players..." />
        <FlatList
          data={results}
          keyExtractor={(u) => u.userId}
          renderItem={({ item: u }) => (
            <Pressable onPress={() => invite(u)} style={[styles.row, { borderBottomColor: theme.divider }]}>
              <Avatar name={u.userName} photoUrl={u.profilePhotoUrl} size={32} />
              <Text style={[typography.body, { color: theme.textPrimary, flex: 1 }]}>{u.userName}</Text>
              <Ionicons name="paper-plane-outline" size={20} color={theme.primary} />
            </Pressable>
          )}
          style={{ flex: 1, marginTop: spacing.sm }}
        />
        <Button title="Done" variant="primary" onPress={() => setAddOpen(false)} fullWidth style={{ marginTop: spacing.sm }} />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.sm + 2,
    borderRadius: radii.md,
  },
  removeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(239,68,68,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
});
