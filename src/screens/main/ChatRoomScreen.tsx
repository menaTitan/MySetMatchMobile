import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, KeyboardAvoidingView, Platform,
  TextInput, Pressable, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useSport } from '../../context/SportContext';
import { chatApi, type ChatMessageDto } from '../../api';
import { getHub } from '../../realtime/signalR';
import { radii, shadows, spacing, typography } from '../../theme';
import { Avatar, LoadingView } from '../../components/ui';

const POLL_FALLBACK_MS = 4000;
const TYPING_TIMEOUT_MS = 3500;
const TYPING_THROTTLE_MS = 2000;

export default function ChatRoomScreen({ route, navigation }: any) {
  const { roomId, title } = route.params ?? {};
  const { player, userId } = useAuth();
  const { theme } = useSport();

  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  // Map of userId → { name, lastSeenTypingAt } for users currently typing.
  const [typing, setTyping] = useState<Record<string, { name: string; until: number }>>({});
  // Map of userId → ISO date when they last read this room (others, not me).
  const [readMarks, setReadMarks] = useState<Record<string, string>>({});
  const listRef = useRef<FlatList<ChatMessageDto>>(null);
  const hubRef = useRef<Awaited<ReturnType<typeof getHub>> | null>(null);
  const lastTypingSentRef = useRef(0);
  const stopTypingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: title ?? 'Chat' });
  }, [navigation, title]);

  const load = useCallback(async () => {
    try {
      const { data } = await chatApi.messages(roomId, 0, 80);
      setMessages(data);
    } catch {}
    finally { setLoading(false); }
  }, [roomId]);

  useEffect(() => {
    load();
    chatApi.markRead(roomId).catch(() => {});

    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let cleanup: (() => void) | null = null;

    (async () => {
      try {
        const hub = await getHub('chat');
        hubRef.current = hub;
        await hub.invoke('JoinRoom', roomId).catch(() => {});
        // Tell server we've read up to now via SignalR (also broadcasts MessagesRead).
        hub.invoke('MarkAsRead', roomId).catch(() => {});

        const onMessage = (m: ChatMessageDto & { chatRoomId?: string; roomId?: string }) => {
          const mRoom = m.chatRoomId ?? m.roomId;
          if (mRoom && mRoom !== roomId) return;
          setMessages((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m]);
          // We're in the room — mark read immediately so others see our cursor advance.
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
        const onUserJoined = (_uid: string) => { /* could surface a system message; skip for now */ };
        const onUserLeft = (_uid: string) => { /* same */ };

        hub.on('ReceiveMessage', onMessage);
        hub.on('UserTyping', onTyping);
        hub.on('UserStoppedTyping', onStopTyping);
        hub.on('MessagesRead', onMessagesRead);
        hub.on('UserJoined', onUserJoined);
        hub.on('UserLeft', onUserLeft);

        cleanup = () => {
          hub.off('ReceiveMessage', onMessage);
          hub.off('UserTyping', onTyping);
          hub.off('UserStoppedTyping', onStopTyping);
          hub.off('MessagesRead', onMessagesRead);
          hub.off('UserJoined', onUserJoined);
          hub.off('UserLeft', onUserLeft);
          hub.invoke('StopTyping', roomId).catch(() => {});
          hub.invoke('LeaveRoom', roomId).catch(() => {});
        };
      } catch {
        pollTimer = setInterval(load, POLL_FALLBACK_MS);
      }
    })();

    return () => {
      if (pollTimer) clearInterval(pollTimer);
      if (stopTypingTimerRef.current) clearTimeout(stopTypingTimerRef.current);
      if (cleanup) cleanup();
      hubRef.current = null;
    };
  }, [roomId, load, userId]);

  // Sweep stale typing entries (e.g. if StopTyping never arrived).
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
    };
    setMessages((prev) => [...prev, optimistic]);
    setText('');
    // Stop typing as soon as we send.
    hubRef.current?.invoke('StopTyping', roomId).catch(() => {});
    if (stopTypingTimerRef.current) { clearTimeout(stopTypingTimerRef.current); stopTypingTimerRef.current = null; }
    lastTypingSentRef.current = 0;
    try {
      const { data } = await chatApi.send(roomId, content);
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? data : m)));
    } catch {
      // Interceptor shows error toast; remove optimistic
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally { setSending(false); }
  }

  if (loading) return <LoadingView />;

  const currentPlayerId = userId;
  const typingNames = Object.values(typing).map((t) => t.name);
  // For "seen" indicator, find the latest message I sent and check if anyone read past it.
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
            const showAuthor = !mine && (!prev || prev.senderId !== item.senderId);
            const isLastMine = mine && index === lastMineIdx;
            return (
              <MessageBubble
                msg={item}
                mine={mine}
                showAuthor={showAuthor}
                seenBy={isLastMine ? seenByCount : 0}
              />
            );
          }}
          contentContainerStyle={{ padding: spacing.base, gap: spacing.xs + 2 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListFooterComponent={
            typingNames.length > 0 ? <TypingIndicator names={typingNames} /> : null
          }
        />

        <View style={[styles.inputRow, { borderTopColor: theme.divider, backgroundColor: theme.cardBg }]}>
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
              { backgroundColor: text.trim() ? theme.primary : theme.divider },
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

function TypingIndicator({ names }: { names: string[] }) {
  const { theme } = useSport();
  const label =
    names.length === 1 ? `${names[0]} is typing…` :
    names.length === 2 ? `${names[0]} and ${names[1]} are typing…` :
    `${names.length} people are typing…`;
  return (
    <View style={{ paddingTop: spacing.xs, paddingHorizontal: spacing.xs }}>
      <Text style={[typography.caption, { color: theme.textMuted, fontStyle: 'italic' }]}>{label}</Text>
    </View>
  );
}

function MessageBubble({
  msg, mine, showAuthor, seenBy,
}: { msg: ChatMessageDto; mine: boolean; showAuthor: boolean; seenBy: number }) {
  const { theme } = useSport();
  return (
    <View style={[styles.bubbleRow, { justifyContent: mine ? 'flex-end' : 'flex-start' }]}>
      {!mine ? (
        <View style={{ width: 28 }}>
          {showAuthor ? (
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
        <View
          style={[
            styles.bubble,
            mine
              ? { backgroundColor: theme.primary, borderTopRightRadius: 4 }
              : { backgroundColor: theme.cardBg, borderTopLeftRadius: 4, ...shadows.sm },
          ]}
        >
          {!mine && showAuthor ? (
            <Text style={[typography.caption, { color: theme.secondary, fontWeight: '800', marginBottom: 2 }]}>
              {msg.senderName}
            </Text>
          ) : null}
          <Text style={[typography.body, { color: mine ? '#fff' : theme.textPrimary, fontSize: 14 }]}>
            {msg.content}
          </Text>
          <Text
            style={[
              typography.caption,
              { color: mine ? 'rgba(255,255,255,0.65)' : theme.textMuted, fontSize: 10, marginTop: 2, textAlign: 'right' },
            ]}
          >
            {new Date(msg.sentDate).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        {mine && seenBy > 0 ? (
          <Text style={[typography.caption, { color: theme.textMuted, fontSize: 10, marginTop: 2 }]}>
            {seenBy === 1 ? 'Seen' : `Seen by ${seenBy}`}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs + 2 },
  bubble: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: radii.lg,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm,
    padding: spacing.sm + 2,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderWidth: 1, borderRadius: radii.lg,
    paddingHorizontal: 12, paddingVertical: 10,
    minHeight: 42, maxHeight: 120,
    fontSize: 14,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
});
