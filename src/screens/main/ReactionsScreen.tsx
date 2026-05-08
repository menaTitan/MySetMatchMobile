import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { feedApi, type ReactionsBreakdown, REACTIONS, type ReactionUser } from '../../api';
import { useSport } from '../../context/SportContext';
import { radii, spacing, typography } from '../../theme';
import { Avatar, Chip, EmptyState, LoadingView, PageHeader } from '../../components/ui';

export default function ReactionsScreen({ route }: any) {
  const { postId } = route.params;
  const { theme } = useSport();
  const [data, setData] = useState<ReactionsBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<number | null>(null);

  useEffect(() => {
    feedApi.reactions(postId).then((r) => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [postId]);

  if (loading) return <LoadingView />;

  const users = data?.users ?? [];
  const filtered = filter == null ? users : users.filter((u) => u.reactionType === filter);

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <PageHeader title="Reactions" subtitle={`${data?.total ?? 0} total`} compact />

      <View style={styles.tabs}>
        <Chip
          label={`All ${data?.total ?? 0}`}
          color={filter == null ? 'primary' : 'muted'}
          variant={filter == null ? 'solid' : 'soft'}
          onPress={() => setFilter(null)}
        />
        {data?.byType.map((b) => (
          <Chip
            key={b.type}
            label={`${b.label} ${b.count}`}
            color={filter === b.type ? 'primary' : 'muted'}
            variant={filter === b.type ? 'solid' : 'soft'}
            onPress={() => setFilter(b.type)}
          />
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(u) => `${u.userId}-${u.reactionType}`}
        contentContainerStyle={{ padding: spacing.base, gap: spacing.xs + 2 }}
        renderItem={({ item }) => <ReactionRow user={item} />}
        ListEmptyComponent={<EmptyState icon="heart-outline" title="No reactions yet" />}
      />
    </View>
  );
}

function ReactionRow({ user }: { user: ReactionUser }) {
  const { theme } = useSport();
  const label = REACTIONS[user.reactionType - 1] ?? 'Like';
  const emoji = label === 'Like' ? '👍' : label === 'Love' ? '❤️' : '🎉';
  return (
    <View style={[styles.row, { backgroundColor: theme.cardBg }]}>
      <Avatar name={user.userName} photoUrl={user.profilePhotoUrl} size={36} />
      <View style={{ flex: 1 }}>
        <Text style={[typography.bodyStrong, { color: theme.textPrimary }]}>{user.fullName ?? user.userName}</Text>
        <Text style={[typography.caption, { color: theme.textMuted }]}>@{user.userName}</Text>
      </View>
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 6, padding: spacing.base, paddingBottom: spacing.sm, flexWrap: 'wrap' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.sm + 2,
    borderRadius: radii.md,
  },
});
