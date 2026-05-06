import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, KeyboardAvoidingView,
  Platform, Pressable, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { aiChatApi, type AIMessage } from '../../api';
import { useSport } from '../../context/SportContext';
import { radii, shadows, spacing, typography } from '../../theme';
import { useToast } from '../../components/ui';

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
    const next: AIMessage[] = [...messages, { role: 'user', content }];
    setMessages(next);
    setInput('');
    setBusy(true);
    try {
      const { data } = await aiChatApi.send(next);
      setMessages([...next, { role: 'assistant', content: data.text }]);
    } catch {
      toast("The assistant isn't available right now", 'error');
    } finally { setBusy(false); }
  }

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <LinearGradient colors={theme.heroGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View pointerEvents="none" style={[styles.orb, { backgroundColor: theme.accentLight }]} />
        <View style={styles.heroRow}>
          <View style={[styles.assistantIcon, { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: theme.accent }]}>
            <Ionicons name="sparkles" size={22} color={theme.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>AI Assistant</Text>
            <Text style={styles.subtitle}>Ask anything about MySetMatch</Text>
          </View>
        </View>
      </LinearGradient>

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
            data={busy ? ([...messages, { role: 'assistant', content: '…' }] as AIMessage[]) : messages}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item, index }) => (
              <Bubble msg={item} typing={busy && index === messages.length} />
            )}
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
  hero: {
    padding: spacing.lg,
    borderBottomLeftRadius: radii.xxl,
    borderBottomRightRadius: radii.xxl,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    width: 220, height: 220, borderRadius: 110,
    top: -80, right: -60, opacity: 0.7,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  assistantIcon: {
    width: 48, height: 48, borderRadius: radii.md,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  title: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },
  subtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },

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
