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
import { radii, shadows, spacing, typography } from '../../theme';
import { Avatar, LoadingView } from '../../components/ui';

const POLL_MS = 4000;

export default function ChatRoomScreen({ route, navigation }: any) {
  const { roomId, title } = route.params ?? {};
  const { player, userId } = useAuth();
  const { theme } = useSport();

  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<ChatMessageDto>>(null);

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
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [roomId, load]);

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
            return <MessageBubble msg={item} mine={mine} showAuthor={showAuthor} />;
          }}
          contentContainerStyle={{ padding: spacing.base, gap: spacing.xs + 2 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        />

        <View style={[styles.inputRow, { borderTopColor: theme.divider, backgroundColor: theme.cardBg }]}>
          <TextInput
            style={[styles.input, { borderColor: theme.border, backgroundColor: theme.pageBg, color: theme.textPrimary }]}
            placeholder="Type a message…"
            placeholderTextColor={theme.textMuted}
            value={text}
            onChangeText={setText}
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

function MessageBubble({
  msg, mine, showAuthor,
}: { msg: ChatMessageDto; mine: boolean; showAuthor: boolean }) {
  const { theme } = useSport();
  return (
    <View style={[styles.bubbleRow, { justifyContent: mine ? 'flex-end' : 'flex-start' }]}>
      {!mine ? (
        <View style={{ width: 28 }}>
          {showAuthor ? <Avatar name={msg.senderName} photoUrl={msg.senderProfilePhotoUrl} size={28} /> : null}
        </View>
      ) : null}
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
    </View>
  );
}

const styles = StyleSheet.create({
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs + 2 },
  bubble: {
    maxWidth: '78%',
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
