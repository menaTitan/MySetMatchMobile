import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { chatApi, type ChatParticipantDto, type SuggestedUser } from '../../api';
import { useSport } from '../../context/SportContext';
import { radii, spacing, typography } from '../../theme';
import { Avatar, EmptyState, SearchBar, useToast } from '../../components/ui';

export default function NewChatScreen({ navigation }: any) {
  const { theme } = useSport();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ChatParticipantDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggested, setSuggested] = useState<SuggestedUser[]>([]);

  // Suggestions: most-active partners. Loaded once on mount.
  useEffect(() => {
    let cancelled = false;
    chatApi.topUsers().then((r) => { if (!cancelled) setSuggested(r.data); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

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

  const showSuggested = query.length < 2;
  const displayed: (ChatParticipantDto | SuggestedUser)[] = showSuggested ? suggested : results;

  async function openWith(u: { userId: string; userName: string }) {
    try {
      const { data } = await chatApi.createDirect(u.userId);
      navigation.replace('ChatRoom', { roomId: data.id, title: u.userName });
    } catch {
      toast("Couldn't start conversation", 'error');
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg, padding: spacing.base }}>
      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="Search players by name…"
        autoFocus
      />

      <FlatList
        data={displayed}
        keyExtractor={(r) => r.userId}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openWith(item)}
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.pageBgTint }]}
          >
            <Avatar name={item.userName} photoUrl={item.profilePhotoUrl} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={[typography.bodyStrong, { color: theme.textPrimary }]}>
                {(item as SuggestedUser).fullName ?? item.userName}
              </Text>
              {(item as SuggestedUser).fullName ? (
                <Text style={[typography.caption, { color: theme.textMuted }]}>@{item.userName}</Text>
              ) : null}
            </View>
            {(item as SuggestedUser).isOnline ? (
              <View style={[styles.onlineDot, { backgroundColor: theme.successGreen }]} />
            ) : null}
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </Pressable>
        )}
        contentContainerStyle={{ paddingVertical: spacing.md, gap: spacing.xs }}
        ListHeaderComponent={
          showSuggested && suggested.length > 0 ? (
            <Text style={[typography.smallStrong, { color: theme.textSecondary, paddingHorizontal: spacing.base, marginBottom: 4 }]}>
              SUGGESTED
            </Text>
          ) : null
        }
        ListEmptyComponent={
          showSuggested ? (
            <EmptyState icon="search-outline" title="Find someone to chat with" message="Type at least 2 characters to search, or wait for suggestions." />
          ) : loading ? null : (
            <EmptyState icon="person-outline" title="No players found" message="Try a different name." />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2,
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm + 2,
    borderRadius: radii.md,
  },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
});
