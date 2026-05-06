import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { chatApi, type ChatRoomDto } from '../../api';
import { useSport } from '../../context/SportContext';
import { radii, spacing, typography } from '../../theme';
import { Avatar, Card, EmptyState, LoadingView, PageHeader } from '../../components/ui';

export default function ChatListScreen({ navigation }: any) {
  const { theme } = useSport();
  const [rooms, setRooms] = useState<ChatRoomDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await chatApi.rooms();
      setRooms(data);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <PageHeader
        title="Messages"
        subtitle="Stay in touch with players & groups"
        compact
        right={
          <Pressable
            onPress={() => navigation.navigate('NewChat')}
            style={({ pressed }) => [styles.newBtn, { backgroundColor: theme.accent }, pressed && { opacity: 0.85 }]}
          >
            <Ionicons name="create-outline" size={18} color={theme.primary} />
          </Pressable>
        }
      />

      {loading ? <LoadingView /> : (
        <FlatList
          data={rooms}
          keyExtractor={(r) => r.id}
          renderItem={({ item }) => <RoomRow room={item} onPress={() => navigation.navigate('ChatRoom', { roomId: item.id, title: item.name })} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor={theme.accent}
            />
          }
          contentContainerStyle={{ padding: spacing.base, gap: spacing.sm }}
          ListEmptyComponent={
            <EmptyState
              icon="chatbubbles-outline"
              title="No conversations yet"
              message="Start a conversation with another player to see it here."
            />
          }
        />
      )}
    </View>
  );
}

function RoomRow({ room, onPress }: { room: ChatRoomDto; onPress: () => void }) {
  const { theme } = useSport();
  const preview = room.lastMessage?.content ?? 'No messages yet';
  const sent = room.lastMessage?.sentDate ? timeAgoShort(room.lastMessage.sentDate) : '';
  const otherPhoto = room.type === 'Direct'
    ? room.participants.find(() => true)?.profilePhotoUrl
    : undefined;
  return (
    <Card padding={0} onPress={onPress}>
      <View style={styles.row}>
        <Avatar name={room.name} photoUrl={otherPhoto} size={48} />
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={[typography.bodyStrong, { color: theme.textPrimary, flex: 1 }]} numberOfLines={1}>
              {room.name}
            </Text>
            {sent ? (
              <Text style={[typography.caption, { color: theme.textMuted }]}>{sent}</Text>
            ) : null}
          </View>
          <View style={styles.previewRow}>
            <Text
              style={[typography.small, { color: room.unreadCount > 0 ? theme.textPrimary : theme.textMuted, flex: 1 }]}
              numberOfLines={1}
            >
              {preview}
            </Text>
            {room.unreadCount > 0 ? (
              <View style={[styles.unreadBadge, { backgroundColor: theme.accent }]}>
                <Text style={[typography.caption, { color: theme.primary, fontWeight: '800', fontSize: 10 }]}>
                  {room.unreadCount}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Card>
  );
}

function timeAgoShort(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(dateStr).toLocaleDateString();
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2, padding: spacing.base },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  unreadBadge: {
    minWidth: 20, height: 20, borderRadius: 10,
    paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center',
  },
  newBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
});
