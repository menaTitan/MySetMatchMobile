import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, KeyboardAvoidingView, Platform,
  TextInput, Pressable, ActivityIndicator, Animated, Image, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { useSport } from '../../context/SportContext';
import { chatApi, type ChatMessageDto } from '../../api';
import { getHub } from '../../realtime/signalR';
import { radii, shadows, spacing, typography } from '../../theme';
import { Avatar, LoadingView } from '../../components/ui';

const PAGE_SIZE = 40;
const POLL_FALLBACK_MS = 4000;
const TYPING_TIMEOUT_MS = 3500;
const TYPING_THROTTLE_MS = 2000;

export default function ChatRoomScreen({ route, navigation }: any) {
  const { roomId, title } = route.params ?? {};
  const { player, userId } = useAuth();
  const { theme } = useSport();

  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [typing, setTyping] = useState<Record<string, { name: string; until: number }>>({});
  const [readMarks, setReadMarks] = useState<Record<string, string>>({});

  const listRef = useRef<FlatList<ChatMessageDto>>(null);
  const hubRef = useRef<Awaited<ReturnType<typeof getHub>> | null>(null);
  const lastTypingSentRef = useRef(0);
  const stopTypingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // True while the user is reading near the bottom — controls whether new
  // content auto-scrolls into view. Loading older pages must NOT autoscroll.
  const nearBottomRef = useRef(true);

  useEffect(() => {
    // Always render a back button. ChatRoom can be entered by deep links
    // and by "Create Tournament Chat" from ManageTournament — when those
    // paths push ChatRoom without ChatList in the stack, the native iOS
    // header omits its automatic back chevron and the user gets stuck.
    // headerLeft replaces it with our own chevron that pops if possible
    // and otherwise falls back to ChatList so there's always a way out.
    navigation.setOptions({
      title: title ?? 'Chat',
      headerLeft: () => (
        <Pressable
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('ChatList');
          }}
          hitSlop={16}
          style={{ paddingHorizontal: 6, paddingVertical: 6 }}
        >
          <Ionicons name="chevron-back" size={26} color="#FAFAFA" />
        </Pressable>
      ),
    });
  }, [navigation, title]);

  // Initial load — first PAGE_SIZE most-recent messages.
  const loadInitial = useCallback(async () => {
    try {
      const { data } = await chatApi.messages(roomId, 0, PAGE_SIZE);
      setMessages(data);
      setHasMore(data.length >= PAGE_SIZE);
    } catch {}
    finally { setLoading(false); }
  }, [roomId]);

  // Load older page when user scrolls to top.
  const loadOlder = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      // skip = how many we already have (server returns newest-first then sorts).
      const { data } = await chatApi.messages(roomId, messages.length, PAGE_SIZE);
      if (data.length === 0) { setHasMore(false); return; }
      // Dedup defensively in case of overlap with real-time inserts.
      const seen = new Set(messages.map((m) => m.id));
      const fresh = data.filter((m) => !seen.has(m.id));
      setMessages((prev) => [...fresh, ...prev]);
      if (data.length < PAGE_SIZE) setHasMore(false);
    } catch {}
    finally { setLoadingMore(false); }
  }, [roomId, messages, loadingMore, hasMore]);

  useEffect(() => {
    loadInitial();
    chatApi.markRead(roomId).catch(() => {});

    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let cleanup: (() => void) | null = null;

    (async () => {
      try {
        const hub = await getHub('chat');
        hubRef.current = hub;
        await hub.invoke('JoinRoom', roomId).catch(() => {});
        hub.invoke('MarkAsRead', roomId).catch(() => {});

        const onMessage = (m: ChatMessageDto & { chatRoomId?: string; roomId?: string }) => {
          const mRoom = m.chatRoomId ?? m.roomId;
          if (mRoom && mRoom !== roomId) return;
          setMessages((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m]);
          if (m.senderId !== userId) hub.invoke('MarkAsRead', roomId).catch(() => {});
        };
        const onTyping = ({ userId: uid, userName }: { userId: string; userName: string }) => {
          if (uid === userId) return;
          setTyping((prev) => ({ ...prev, [uid]: { name: userName, until: Date.now() + TYPING_TIMEOUT_MS } }));
        };
        const onStopTyping = (uid: string) => {
          setTyping((prev) => { const n = { ...prev }; delete n[uid]; return n; });
        };
        const onMessagesRead = ({ userId: uid, readDate, chatRoomId }: { userId: string; readDate: string; chatRoomId: string }) => {
          if (chatRoomId && chatRoomId !== roomId) return;
          if (uid === userId) return;
          setReadMarks((prev) => ({ ...prev, [uid]: readDate }));
        };

        hub.on('ReceiveMessage', onMessage);
        hub.on('UserTyping', onTyping);
        hub.on('UserStoppedTyping', onStopTyping);
        hub.on('MessagesRead', onMessagesRead);

        cleanup = () => {
          hub.off('ReceiveMessage', onMessage);
          hub.off('UserTyping', onTyping);
          hub.off('UserStoppedTyping', onStopTyping);
          hub.off('MessagesRead', onMessagesRead);
          hub.invoke('StopTyping', roomId).catch(() => {});
          hub.invoke('LeaveRoom', roomId).catch(() => {});
        };
      } catch {
        pollTimer = setInterval(loadInitial, POLL_FALLBACK_MS);
      }
    })();

    return () => {
      if (pollTimer) clearInterval(pollTimer);
      if (stopTypingTimerRef.current) clearTimeout(stopTypingTimerRef.current);
      if (cleanup) cleanup();
      hubRef.current = null;
    };
  }, [roomId, loadInitial, userId]);

  useEffect(() => {
    const t = setInterval(() => {
      const now = Date.now();
      setTyping((prev) => {
        let changed = false;
        const out: typeof prev = {};
        for (const [uid, v] of Object.entries(prev)) {
          if (v.until > now) out[uid] = v;
          else changed = true;
        }
        return changed ? out : prev;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  function handleTextChange(next: string) {
    setText(next);
    const hub = hubRef.current;
    if (!hub || !next.trim()) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current > TYPING_THROTTLE_MS) {
      lastTypingSentRef.current = now;
      hub.invoke('StartTyping', roomId).catch(() => {});
    }
    if (stopTypingTimerRef.current) clearTimeout(stopTypingTimerRef.current);
    stopTypingTimerRef.current = setTimeout(() => {
      hubRef.current?.invoke('StopTyping', roomId).catch(() => {});
      lastTypingSentRef.current = 0;
    }, TYPING_TIMEOUT_MS);
  }

  async function send() {
    const content = text.trim();
    if (!content) return;
    setSending(true);
    const optimistic: ChatMessageDto = {
      id: `tmp-${Date.now()}`,
      senderId: userId ?? '',
      senderName: player?.name ?? 'You',
      content,
      sentDate: new Date().toISOString(),
      pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setText('');
    hubRef.current?.invoke('StopTyping', roomId).catch(() => {});
    if (stopTypingTimerRef.current) { clearTimeout(stopTypingTimerRef.current); stopTypingTimerRef.current = null; }
    lastTypingSentRef.current = 0;
    try {
      const { data } = await chatApi.send(roomId, content);
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? data : m)));
    } catch {
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? { ...m, pending: false, failed: true } : m)));
    } finally { setSending(false); }
  }

  async function pickAndSendImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Photo library access is required to attach images.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: false,
    });
    if (res.canceled || !res.assets?.length) return;
    const asset = res.assets[0];
    const name = asset.fileName ?? `photo_${Date.now()}.jpg`;
    const type = asset.mimeType ?? 'image/jpeg';
    const optimistic: ChatMessageDto = {
      id: `tmp-${Date.now()}`,
      senderId: userId ?? '',
      senderName: player?.name ?? 'You',
      content: '',
      sentDate: new Date().toISOString(),
      attachmentUrl: asset.uri,
      attachmentType: 'image',
      pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setUploading(true);
    try {
      const { data } = await chatApi.sendAttachment(roomId, { uri: asset.uri, name, type });
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? data : m)));
    } catch {
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? { ...m, pending: false, failed: true } : m)));
    } finally { setUploading(false); }
  }

  if (loading) return <LoadingView />;

  const currentPlayerId = userId;
  const typingNames = Object.values(typing).map((t) => t.name);
  const lastMineIdx = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].senderId === currentPlayerId) return i;
    }
    return -1;
  })();
  const seenByCount = lastMineIdx >= 0
    ? Object.values(readMarks).filter((iso) => new Date(iso) >= new Date(messages[lastMineIdx].sentDate)).length
    : 0;

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item, index }) => {
            const mine = item.senderId === currentPlayerId;
            const prev = messages[index - 1];
            const next = messages[index + 1];
            const showAuthor = !mine && (!prev || prev.senderId !== item.senderId);
            const isLastInGroup = !next || next.senderId !== item.senderId;
            const isLastMine = mine && index === lastMineIdx;
            const showDaySep = !prev || !sameDay(prev.sentDate, item.sentDate);
            return (
              <>
                {showDaySep ? <DaySeparator iso={item.sentDate} /> : null}
                <MessageBubble
                  msg={item}
                  mine={mine}
                  showAuthor={showAuthor}
                  groupTail={isLastInGroup}
                  seenBy={isLastMine ? seenByCount : 0}
                />
              </>
            );
          }}
          contentContainerStyle={{ padding: spacing.base, gap: 3 }}
          onContentSizeChange={() => {
            if (nearBottomRef.current) listRef.current?.scrollToEnd({ animated: false });
          }}
          // Keep the user's scroll anchor stable when older pages are prepended.
          maintainVisibleContentPosition={{ minIndexForVisible: 0, autoscrollToTopThreshold: 0 }}
          onScroll={(e) => {
            const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
            nearBottomRef.current = (contentSize.height - (contentOffset.y + layoutMeasurement.height)) < 120;
            // Trigger older-page load when the user is within ~80px of the top.
            if (contentOffset.y < 80) loadOlder();
          }}
          scrollEventThrottle={200}
          ListHeaderComponent={
            loadingMore ? (
              <View style={{ paddingVertical: spacing.sm, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={theme.accent} />
              </View>
            ) : !hasMore && messages.length > 0 ? (
              <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'center', paddingVertical: spacing.sm }]}>
                Beginning of conversation
              </Text>
            ) : null
          }
          ListFooterComponent={
            typingNames.length > 0 ? <TypingIndicator names={typingNames} /> : null
          }
        />

        <View style={[styles.inputRow, { borderTopColor: theme.divider, backgroundColor: theme.cardBg }]}>
          <Pressable
            onPress={pickAndSendImage}
            disabled={uploading}
            style={({ pressed }) => [
              styles.attachBtn,
              { backgroundColor: 'transparent' },
              pressed && { opacity: 0.6 },
            ]}
            hitSlop={8}
          >
            {uploading
              ? <ActivityIndicator size="small" color={theme.accent} />
              : <Ionicons name="image-outline" size={22} color={theme.textMuted} />}
          </Pressable>
          <TextInput
            style={[styles.input, { borderColor: theme.border, backgroundColor: theme.pageBg, color: theme.textPrimary }]}
            placeholder="Type a message…"
            placeholderTextColor={theme.textMuted}
            value={text}
            onChangeText={handleTextChange}
            multiline
          />
          <Pressable
            onPress={send}
            disabled={!text.trim() || sending}
            style={({ pressed }) => [
              styles.sendBtn,
              { backgroundColor: text.trim() ? theme.accent : theme.divider },
              pressed && { opacity: 0.85 },
            ]}
          >
            {sending ? <ActivityIndicator size="small" color="#fff" /> : (
              <Ionicons name="send" size={18} color={text.trim() ? '#fff' : theme.textMuted} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function sameDay(a: string, b: string) {
  const da = new Date(a); const db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

function DaySeparator({ iso }: { iso: string }) {
  const { theme } = useSport();
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date(); yest.setDate(today.getDate() - 1);
  const label =
    sameDay(iso, today.toISOString()) ? 'Today' :
    sameDay(iso, yest.toISOString()) ? 'Yesterday' :
    d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  return (
    <View style={{ alignItems: 'center', marginVertical: spacing.sm }}>
      <View style={{ backgroundColor: theme.surfaceElevated, paddingHorizontal: 10, paddingVertical: 3, borderRadius: radii.pill }}>
        <Text style={[typography.caption, { color: theme.textMuted, fontWeight: '700', letterSpacing: 0.4 }]}>
          {label}
        </Text>
      </View>
    </View>
  );
}

function TypingIndicator({ names }: { names: string[] }) {
  const { theme } = useSport();
  // Three pulsing dots — Messenger-style.
  const dots = [useRef(new Animated.Value(0.2)).current, useRef(new Animated.Value(0.2)).current, useRef(new Animated.Value(0.2)).current];
  useEffect(() => {
    const loops = dots.map((d, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(d, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(d, { toValue: 0.2, duration: 350, useNativeDriver: true }),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, []);
  const label =
    names.length === 1 ? `${names[0]} is typing` :
    names.length === 2 ? `${names[0]} and ${names[1]} are typing` :
    `${names.length} people are typing`;
  return (
    <View style={{ paddingTop: spacing.xs, paddingHorizontal: spacing.base, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ flexDirection: 'row', gap: 3 }}>
        {dots.map((d, i) => (
          <Animated.View
            key={i}
            style={{
              width: 6, height: 6, borderRadius: 3,
              backgroundColor: theme.textMuted, opacity: d,
            }}
          />
        ))}
      </View>
      <Text style={[typography.caption, { color: theme.textMuted, fontStyle: 'italic' }]}>{label}</Text>
    </View>
  );
}

function MessageBubble({
  msg, mine, showAuthor, groupTail, seenBy,
}: { msg: ChatMessageDto; mine: boolean; showAuthor: boolean; groupTail: boolean; seenBy: number }) {
  const { theme } = useSport();
  // Fade + slight slide-up entrance — runs once on mount.
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(6)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();
  }, []);

  const isImage = msg.attachmentType === 'image' && !!msg.attachmentUrl;
  const isFile = msg.attachmentType === 'file' && !!msg.attachmentUrl;

  return (
    <Animated.View style={[styles.bubbleRow, { justifyContent: mine ? 'flex-end' : 'flex-start', opacity, transform: [{ translateY }] }]}>
      {!mine ? (
        <View style={{ width: 28 }}>
          {groupTail ? (
            <Avatar
              name={msg.senderName}
              photoUrl={msg.senderProfilePhotoUrl}
              size={28}
              playerId={msg.senderId}
            />
          ) : null}
        </View>
      ) : null}
      <View style={{ alignItems: mine ? 'flex-end' : 'flex-start', maxWidth: '78%' }}>
        {/* Image-only bubble: render image directly with no chrome. */}
        {isImage && !msg.content ? (
          <View style={[styles.imageWrap, mine ? { alignSelf: 'flex-end' } : null]}>
            <Image source={{ uri: msg.attachmentUrl! }} style={styles.imageThumb} resizeMode="cover" />
            {msg.pending ? <PendingOverlay /> : null}
          </View>
        ) : (
          <View
            style={[
              styles.bubble,
              mine
                ? {
                    backgroundColor: theme.accent,
                    borderTopRightRadius: radii.lg,
                    borderBottomRightRadius: groupTail ? 4 : radii.lg,
                  }
                : {
                    backgroundColor: theme.cardBg,
                    borderTopLeftRadius: radii.lg,
                    borderBottomLeftRadius: groupTail ? 4 : radii.lg,
                    ...shadows.sm,
                  },
              msg.failed ? { borderWidth: 1, borderColor: theme.danger } : null,
            ]}
          >
            {!mine && showAuthor ? (
              <Text style={[typography.caption, { color: theme.secondary, fontWeight: '800', marginBottom: 2 }]}>
                {msg.senderName}
              </Text>
            ) : null}
            {isImage ? (
              <Image source={{ uri: msg.attachmentUrl! }} style={styles.imageInBubble} resizeMode="cover" />
            ) : null}
            {isFile ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: msg.content ? 4 : 0 }}>
                <Ionicons name="document-outline" size={16} color={mine ? '#fff' : theme.textPrimary} />
                <Text style={[typography.small, { color: mine ? '#fff' : theme.textPrimary }]} numberOfLines={1}>
                  {msg.attachmentName ?? 'Attachment'}
                </Text>
              </View>
            ) : null}
            {msg.content ? (
              <Text style={[typography.body, { color: mine ? '#fff' : theme.textPrimary, fontSize: 14 }]}>
                {msg.content}
              </Text>
            ) : null}
            <Text
              style={[
                typography.caption,
                { color: mine ? 'rgba(255,255,255,0.7)' : theme.textMuted, fontSize: 10, marginTop: 2, textAlign: 'right' },
              ]}
            >
              {new Date(msg.sentDate).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {msg.pending ? <PendingOverlay /> : null}
          </View>
        )}
        {msg.failed ? (
          <Text style={[typography.caption, { color: theme.danger, fontSize: 10, marginTop: 2 }]}>
            Failed to send
          </Text>
        ) : null}
        {!msg.failed && mine && seenBy > 0 ? (
          <Text style={[typography.caption, { color: theme.textMuted, fontSize: 10, marginTop: 2 }]}>
            {seenBy === 1 ? 'Seen' : `Seen by ${seenBy}`}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

function PendingOverlay() {
  return (
    <View style={{ position: 'absolute', right: 4, bottom: 4 }}>
      <ActivityIndicator size="small" color="rgba(255,255,255,0.9)" />
    </View>
  );
}

const styles = StyleSheet.create({
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs + 2 },
  bubble: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: radii.lg,
    position: 'relative',
  },
  imageWrap: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  imageThumb: { width: 220, height: 220, backgroundColor: '#0008' },
  imageInBubble: { width: 200, height: 200, borderRadius: radii.md, marginBottom: 4 },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs + 2,
    padding: spacing.sm + 2,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderWidth: 1, borderRadius: radii.pill,
    paddingHorizontal: 14, paddingVertical: 10,
    minHeight: 42, maxHeight: 120,
    fontSize: 14,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
  },
  attachBtn: {
    width: 36, height: 42, alignItems: 'center', justifyContent: 'center',
  },
});
