import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { moderationApi, type BlockedUser } from '../../api';
import { useSport } from '../../context/SportContext';
import { radii, spacing, typography } from '../../theme';
import { Avatar, Button, EmptyState, LoadingView, PageHeader } from '../../components/ui';

/**
 * Lists users the current user has blocked, with an Unblock action. Their
 * posts return to the feed when unblocked.
 */
export default function BlockedUsersScreen() {
  const { theme } = useSport();
  const [items, setItems] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { const { data } = await moderationApi.blocks(); setItems(data); }
    catch {} finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function unblock(b: BlockedUser) {
    Alert.alert(
      `Unblock ${b.fullName ?? b.userName ?? 'this user'}?`,
      "You'll see their posts and messages again.",
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Unblock', onPress: async () => {
          setBusyId(b.userId);
          try {
            await moderationApi.unblock(b.userId);
            setItems((arr) => arr.filter((x) => x.userId !== b.userId));
          } catch (err: any) {
            Alert.alert('Failed', err?.response?.data?.message ?? 'Could not unblock.');
          } finally { setBusyId(null); }
        } },
      ],
    );
  }

  if (loading) return <LoadingView />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <PageHeader title="Blocked Users" subtitle="People whose content you've hidden" compact />
      <FlatList
        data={items}
        keyExtractor={(b) => b.userId}
        contentContainerStyle={{ padding: spacing.base, gap: spacing.xs + 2 }}
        renderItem={({ item }) => (
          <View style={[styles.row, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Avatar name={item.fullName ?? item.userName} photoUrl={item.profilePhotoUrl} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={[typography.bodyStrong, { color: theme.textPrimary }]} numberOfLines={1}>
                {item.fullName ?? item.userName ?? 'User'}
              </Text>
              <Text style={[typography.caption, { color: theme.textMuted }]}>
                Blocked {new Date(item.blockedDate).toLocaleDateString()}
              </Text>
            </View>
            <Button
              title="Unblock"
              variant="ghost"
              size="sm"
              uppercase={false}
              loading={busyId === item.userId}
              onPress={() => unblock(item)}
            />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="happy-outline"
            title="No blocked users"
            message="When you block someone, you can manage them here."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.sm + 2,
    borderRadius: radii.md,
    borderWidth: 1,
  },
});
