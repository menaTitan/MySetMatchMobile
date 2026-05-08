import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, KeyboardAvoidingView,
  Platform, Pressable, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { aiChatApi, type AIMessage } from '../../api';
import { useSport } from '../../context/SportContext';
import { radii, shadows, spacing, typography } from '../../theme';
import { HeroHeader, useToast } from '../../components/ui';

const SUGGESTIONS = [
  'How do tournaments work?',
  'Explain the rating system',
  'How do I enter my match scores?',
  'What are the table tennis rules?',
];

export default function AssistantScreen() {
  const { theme } = useSport();
  const toast = useToast();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const listRef = useRef<FlatList<AIMessage>>(null);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    const userMsg: AIMessage = { role: 'user', content };
    const conversation = [...messages, userMsg];
    // Optimistically add the user turn AND a placeholder assistant turn we
    // mutate as tokens stream in.
    setMessages([...conversation, { role: 'assistant', content: '' }]);
    setInput('');
    setBusy(true);
    let acc = '';
    try {
      await aiChatApi.stream(conversation, (delta) => {
        acc += delta;
        setMessages((prev) => {
          const out = prev.slice();
          // Replace the trailing assistant placeholder with the accumulating text.
          out[out.length - 1] = { role: 'assistant', content: acc };
          return out;
        });
      });
    } catch {
      // Strip the placeholder on hard failure.
      setMessages((prev) => prev.slice(0, -1));
      toast("The assistant isn't available right now", 'error');
    } finally { setBusy(false); }
  }

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <HeroHeader
        variant="compact"
        title="AI Assistant"
        subtitle="Ask anything about MySetMatch"
        right={
          <View style={[styles.assistantIcon, { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: theme.accent }]}>
            <Ionicons name="sparkles" size={22} color={theme.accent} />
          </View>
        }
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {messages.length === 0 ? (
          <View style={styles.intro}>
            <Text style={[typography.small, { color: theme.textMuted, marginBottom: spacing.md, textAlign: 'center' }]}>
              Try one of these:
            </Text>
            {SUGGESTIONS.map((s) => (
              <Pressable
                key={s}
                onPress={() => send(s)}
                style={({ pressed }) => [
                  styles.suggestion,
                  { backgroundColor: theme.cardBg, borderColor: theme.border },
                  pressed && { backgroundColor: theme.pageBgTint },
                ]}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={16} color={theme.secondary} />
                <Text style={[typography.bodyStrong, { color: theme.textPrimary, flex: 1 }]}>{s}</Text>
                <Ionicons name="arrow-forward" size={14} color={theme.textMuted} />
              </Pressable>
            ))}
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item, index }) => {
              const isLast = index === messages.length - 1;
              const empty = item.role === 'assistant' && item.content.length === 0;
              return <Bubble msg={item} typing={busy && isLast && empty} />;
            }}
            contentContainerStyle={{ padding: spacing.base, gap: spacing.sm }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        <View style={[styles.inputRow, { borderTopColor: theme.divider, backgroundColor: theme.cardBg }]}>
          <TextInput
            style={[styles.input, { borderColor: theme.border, backgroundColor: theme.pageBg, color: theme.textPrimary }]}
            placeholder="Ask a question…"
            placeholderTextColor={theme.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            editable={!busy}
          />
          <Pressable
            onPress={() => send(input)}
            disabled={!input.trim() || busy}
            style={({ pressed }) => [
              styles.sendBtn,
              { backgroundColor: input.trim() && !busy ? theme.primary : theme.divider },
              pressed && { opacity: 0.85 },
            ]}
          >
            {busy ? <ActivityIndicator size="small" color="#fff" /> : (
              <Ionicons name="send" size={18} color={input.trim() ? '#fff' : theme.textMuted} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Bubble({ msg, typing }: { msg: AIMessage; typing?: boolean }) {
  const { theme } = useSport();
  const mine = msg.role === 'user';
  return (
    <View style={{ flexDirection: 'row', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
      {!mine ? (
        <View style={[styles.aiBadge, { backgroundColor: theme.featureBg }]}>
          <Ionicons name="sparkles" size={12} color={theme.secondary} />
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
        {typing ? (
          <Text style={[typography.body, { color: theme.textMuted, fontStyle: 'italic' }]}>typing…</Text>
        ) : (
          <Text style={[typography.body, { color: mine ? '#fff' : theme.textPrimary, fontSize: 14.5 }]}>
            {msg.content}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  assistantIcon: {
    width: 44, height: 44, borderRadius: radii.md,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },

  intro: {
    padding: spacing.base, gap: spacing.sm,
  },
  suggestion: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.md, borderRadius: radii.md,
    borderWidth: 1,
  },
  aiBadge: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.xs + 2, alignSelf: 'flex-end',
  },

  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: radii.lg,
  },

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm,
    padding: spacing.sm + 2,
    borderTopWidth: 1,
  },
  input: {
    flex: 1, borderWidth: 1, borderRadius: radii.lg,
    paddingHorizontal: 12, paddingVertical: 10,
    minHeight: 42, maxHeight: 120, fontSize: 14,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
});
