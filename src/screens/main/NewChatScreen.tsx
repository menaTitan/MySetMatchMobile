import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { chatApi, type ChatParticipantDto } from '../../api';
import { useSport } from '../../context/SportContext';
import { radii, spacing, typography } from '../../theme';
import { Avatar, EmptyState, useToast } from '../../components/ui';

export default function NewChatScreen({ navigation }: any) {
  const { theme } = useSport();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ChatParticipantDto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await chatApi.searchUsers(query);
        setResults(data);
      } catch {}
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  async function openWith(u: ChatParticipantDto) {
    try {
      const { data } = await chatApi.createDirect(u.userId);
      navigation.replace('ChatRoom', { roomId: data.id, title: u.userName });
    } catch {
      toast("Couldn't start conversation", 'error');
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg, padding: spacing.base }}>
      <View style={[styles.searchBox, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <Ionicons name="search" size={18} color={theme.textMuted} />
        <TextInput
          autoFocus
          placeholder="Search players by name…"
          placeholderTextColor={theme.textMuted}
          value={query}
          onChangeText={setQuery}
          style={{ flex: 1, fontSize: 15, color: theme.textPrimary }}
        />
      </View>

      <FlatList
        data={results}
        keyExtractor={(r) => r.userId}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openWith(item)}
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.pageBgTint }]}
          >
            <Avatar name={item.userName} photoUrl={item.profilePhotoUrl} size={40} />
            <Text style={[typography.bodyStrong, { color: theme.textPrimary, flex: 1 }]}>{item.userName}</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </Pressable>
        )}
        contentContainerStyle={{ paddingVertical: spacing.md, gap: spacing.xs }}
        ListEmptyComponent={
          query.length < 2 ? (
            <EmptyState icon="search-outline" title="Find someone to chat with" message="Type at least 2 characters to search." />
          ) : loading ? null : (
            <EmptyState icon="person-outline" title="No players found" message="Try a different name." />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: radii.md, borderWidth: 1.5,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2,
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm + 2,
    borderRadius: radii.md,
  },
});
