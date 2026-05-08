import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { chatApi, type ChatParticipantDto } from '../../api';
import { useSport } from '../../context/SportContext';
import { radii, spacing, typography } from '../../theme';
import { Avatar, Button, Chip, EmptyState, Input, KeyboardAware, PageHeader, SearchBar, useToast } from '../../components/ui';

export default function NewGroupChatScreen({ navigation }: any) {
  const { theme } = useSport();
  const toast = useToast();
  const [name, setName] = useState('');
  const [q, setQ] = useState('');
  const [results, setResults] = useState<ChatParticipantDto[]>([]);
  const [picked, setPicked] = useState<ChatParticipantDto[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (q.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      try { const { data } = await chatApi.searchUsers(q.trim()); setResults(data); } catch {}
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  function toggle(u: ChatParticipantDto) {
    setPicked((prev) => prev.some((x) => x.userId === u.userId)
      ? prev.filter((x) => x.userId !== u.userId)
      : [...prev, u]);
  }

  async function create() {
    if (!name.trim()) { Alert.alert('Name required', 'Enter a group name.'); return; }
    if (picked.length < 2) { Alert.alert('Pick members', 'Choose at least 2 members.'); return; }
    setBusy(true);
    try {
      const { data } = await chatApi.createGroup({
        name: name.trim(),
        participantUserIds: picked.map((p) => p.userId),
      });
      toast('Group created', 'success');
      navigation.replace('ChatRoom', { roomId: data.id, title: name.trim() });
    } catch (err: any) {
      Alert.alert('Failed', err?.response?.data?.message ?? 'Could not create group.');
    } finally { setBusy(false); }
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <PageHeader title="New Group Chat" subtitle="Pick members" compact />
      <KeyboardAware contentContainerStyle={{ padding: spacing.base, gap: spacing.sm }}>
        <Input label="Group name" value={name} onChangeText={setName} placeholder="e.g. Tuesday Doubles" leftIcon="people-outline" />
        {picked.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {picked.map((p) => (
              <Chip
                key={p.userId}
                label={p.userName}
                color="primary"
                variant="solid"
                onPress={() => toggle(p)}
              />
            ))}
          </View>
        )}
        <SearchBar value={q} onChangeText={setQ} placeholder="Search users..." />
        <FlatList
          data={results}
          keyExtractor={(u) => u.userId}
          scrollEnabled={false}
          renderItem={({ item }) => {
            const isPicked = picked.some((x) => x.userId === item.userId);
            return (
              <Pressable
                onPress={() => toggle(item)}
                style={[styles.row, { backgroundColor: isPicked ? theme.featureBg : 'transparent' }]}
              >
                <Avatar name={item.userName} photoUrl={item.profilePhotoUrl} size={36} />
                <Text style={[typography.body, { color: theme.textPrimary, flex: 1 }]}>{item.userName}</Text>
                <Ionicons
                  name={isPicked ? 'checkmark-circle' : 'add-circle-outline'}
                  size={22}
                  color={isPicked ? theme.successGreen : theme.textMuted}
                />
              </Pressable>
            );
          }}
          ListEmptyComponent={q.length < 2 ? null : <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'center', padding: spacing.md }]}>No matches</Text>}
        />
        <Button title="Create group" onPress={create} loading={busy} variant="primary" size="lg" fullWidth leftIcon="checkmark-outline" />
      </KeyboardAware>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.sm + 2,
    borderRadius: radii.md,
  },
});
