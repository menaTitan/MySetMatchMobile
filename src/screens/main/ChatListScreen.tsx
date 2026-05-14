import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable, Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { chatApi, type ChatRoomDto } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useSport } from '../../context/SportContext';
import { useOnlinePresence } from '../../realtime/presence';
import { radii, spacing, typography } from '../../theme';
import { Avatar, Button, Card, EmptyState, LoadingView, PageHeader, useToast } from '../../components/ui';

export default function ChatListScreen({ navigation }: any) {
  const { theme } = useSport();
  const { userId } = useAuth();
  const toast = useToast();
  const [rooms, setRooms] = useState<ChatRoomDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // For each direct room, the "other" participant id we want presence on.
  const directOtherIds = rooms
    .filter((r) => r.type === 'Direct')
    .map((r) => r.participants.find((p) => p.userId !== userId)?.userId)
    .filter((x): x is string => !!x);
  const presence = useOnlinePresence(directOtherIds);

  async function openSupport() {
    try {
      const { data } = await chatApi.getOrCreateSupport();
      navigation.navigate('ChatRoom', { roomId: data.id, title: 'Support' });
    } catch {}
  }

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
          renderItem={({ item }) => {
            const otherId = item.type === 'Direct'
              ? item.participants.find((p) => p.userId !== userId)?.userId
              : undefined;
            const online = otherId ? !!presence[otherId] : false;
            return (
              <RoomRow
                room={item}
                online={online}
                myUserId={userId ?? undefined}
                onPress={() => navigation.navigate('ChatRoom', { roomId: item.id, title: item.name })}
              />
            );
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor={theme.accent}
            />
          }
          contentContainerStyle={{ padding: spacing.base, gap: spacing.sm }}
          ListHeaderComponent={
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm }}>
              <Button title="New group" onPress={() => navigation.navigate('NewGroupChat')} leftIcon="people-outline" variant="secondary" size="sm" uppercase={false} style={{ flex: 1 }} />
              <Button title="Support" onPress={openSupport} leftIcon="help-circle-outline" variant="ghost" size="sm" uppercase={false} style={{ flex: 1 }} />
            </View>
          }
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

function RoomRow({
  room, online, onPress, myUserId,
}: { room: ChatRoomDto; online?: boolean; onPress: () => void; myUserId?: string }) {
  const { theme } = useSport();
  const lastSenderIsMe = room.lastMessage?.senderId === myUserId;
  let preview = room.lastMessage?.content?.trim() || '';
  if (!preview && room.lastMessage) preview = '📷 Photo';
  if (!preview && !room.lastMessage) preview = 'No messages yet';
  if (lastSenderIsMe && room.lastMessage) preview = `You: ${preview}`;
  const sent = room.lastMessage?.sentDate ? timeAgoShort(room.lastMessage.sentDate) : '';
  const otherPhoto = room.type === 'Direct'
    ? (room.participants.find((p) => p.userId !== myUserId) ?? room.participants[0])?.profilePhotoUrl
    : undefined;
  const unread = room.unreadCount > 0;
  return (
    <Card padding={0} onPress={onPress}>
      <View style={styles.row}>
        <View>
          <Avatar name={room.name} photoUrl={otherPhoto} size={52} />
          {room.type === 'Direct' && online ? (
            <View style={[styles.onlineDot, { backgroundColor: theme.successGreen, borderColor: theme.cardBg }]} />
          ) : null}
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text
              style={[
                typography.bodyStrong,
                { color: theme.textPrimary, flex: 1, fontWeight: unread ? '800' : '600' },
              ]}
              numberOfLines={1}
            >
              {room.name}
            </Text>
            {sent ? (
              <Text style={[typography.caption, { color: unread ? theme.accent : theme.textMuted, fontWeight: unread ? '700' : '500' }]}>
                {sent}
              </Text>
            ) : null}
          </View>
          <View style={styles.previewRow}>
            <Text
              style={[
                typography.small,
                {
                  color: unread ? theme.textPrimary : theme.textMuted,
                  fontWeight: unread ? '600' : '400',
                  flex: 1,
                },
              ]}
              numberOfLines={1}
            >
              {preview}
            </Text>
            {unread ? (
              <View style={[styles.unreadBadge, { backgroundColor: theme.accent }]}>
                <Text style={[typography.caption, { color: '#fff', fontWeight: '800', fontSize: 10 }]}>
                  {room.unreadCount > 99 ? '99+' : room.unreadCount}
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
  const d = new Date(dateStr);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  // Same day → show time (e.g. "3:42 PM"), keeps the row scannable.
  const now = new Date();
  if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }
  if (diff < 86400 * 2) return 'Yesterday';
  if (diff < 86400 * 7) return d.toLocaleDateString(undefined, { weekday: 'short' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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
  onlineDot: {
    position: 'absolute', right: -1, bottom: -1,
    width: 14, height: 14, borderRadius: 7,
    borderWidth: 2,
  },
});
