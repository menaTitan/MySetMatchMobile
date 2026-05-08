import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { chatApi, type ChatParticipantDto } from '../../api';
import { useSport } from '../../context/SportContext';
import { radii, spacing, typography } from '../../theme';
import { Avatar, BottomSheet, Button, EmptyState, PageHeader, SearchBar, useToast } from '../../components/ui';

export default function ChatParticipantsScreen({ route, navigation }: any) {
  const { roomId, title } = route.params;
  const { theme } = useSport();
  const toast = useToast();

  const [participants, setParticipants] = useState<ChatParticipantDto[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<ChatParticipantDto[]>([]);
  const [picking, setPicking] = useState<ChatParticipantDto[]>([]);

  async function load() {
    try {
      const { data } = await chatApi.rooms();
      const r = data.find((x) => x.id === roomId);
      setParticipants(r?.participants ?? []);
    } catch {}
  }
  useEffect(() => { load(); }, [roomId]);

  useEffect(() => {
    if (q.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      try { const { data } = await chatApi.searchUsers(q.trim()); setResults(data); } catch {}
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  async function remove(u: ChatParticipantDto) {
    Alert.alert('Remove', `Remove ${u.userName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try { await chatApi.removeParticipant(roomId, u.userId); toast('Removed', 'success'); load(); }
        catch {}
      } },
    ]);
  }

  async function addPicked() {
    if (picking.length === 0) return;
    try {
      await chatApi.addParticipants(roomId, picking.map((p) => p.userId));
      toast('Added', 'success');
      setAddOpen(false); setPicking([]); setQ('');
      load();
    } catch (err: any) {
      Alert.alert('Failed', err?.response?.data?.message ?? 'Could not add.');
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <PageHeader title="Participants" subtitle={title ?? 'Chat members'} compact />
      <FlatList
        data={participants}
        keyExtractor={(p) => p.userId}
        contentContainerStyle={{ padding: spacing.base, gap: spacing.xs + 2 }}
        ListHeaderComponent={
          <Button title="Add participants" onPress={() => setAddOpen(true)} leftIcon="person-add-outline" variant="primary" size="md" fullWidth uppercase={false} style={{ marginBottom: spacing.sm }} />
        }
        renderItem={({ item: p }) => (
          <View style={[styles.row, { backgroundColor: theme.cardBg }]}>
            <Avatar name={p.userName} photoUrl={p.profilePhotoUrl} size={36} />
            <View style={{ flex: 1 }}>
              <Text style={[typography.bodyStrong, { color: theme.textPrimary }]}>{p.userName}</Text>
              {p.isAdmin && <Text style={[typography.caption, { color: theme.accent }]}>Admin</Text>}
            </View>
            <Pressable onPress={() => remove(p)} style={styles.removeBtn}>
              <Ionicons name="trash-outline" size={16} color={theme.dangerRed} />
            </Pressable>
          </View>
        )}
        ListEmptyComponent={<EmptyState icon="people-outline" title="No participants" />}
      />

      <BottomSheet visible={addOpen} onClose={() => setAddOpen(false)} title="Add participants" scrollable={false}>
        <SearchBar value={q} onChangeText={setQ} placeholder="Search users..." />
        <FlatList
          data={results}
          keyExtractor={(u) => u.userId}
          style={{ maxHeight: 280, marginTop: spacing.sm }}
          renderItem={({ item: u }) => {
            const isPicked = picking.some((x) => x.userId === u.userId);
            return (
              <Pressable
                onPress={() => setPicking((prev) => isPicked ? prev.filter((x) => x.userId !== u.userId) : [...prev, u])}
                style={[styles.row, { borderBottomColor: theme.divider }]}
              >
                <Avatar name={u.userName} photoUrl={u.profilePhotoUrl} size={32} />
                <Text style={[typography.body, { color: theme.textPrimary, flex: 1 }]}>{u.userName}</Text>
                <Ionicons name={isPicked ? 'checkmark-circle' : 'add-circle-outline'} size={20} color={isPicked ? theme.successGreen : theme.textMuted} />
              </Pressable>
            );
          }}
        />
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
          <Button title="Cancel" variant="ghost" onPress={() => { setAddOpen(false); setPicking([]); }} style={{ flex: 1 }} />
          <Button title={`Add (${picking.length})`} variant="primary" onPress={addPicked} disabled={picking.length === 0} style={{ flex: 1 }} />
        </View>
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
