import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, TextInput, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSport } from '../context/SportContext';
import { radii, spacing, typography } from '../theme';
import Avatar from './ui/Avatar';
import { BottomSheet } from './ui';

export interface CommentItem {
  id: string;
  authorName: string;
  content: string;
  createdDate: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  comments: CommentItem[];
  onSubmit: (text: string) => Promise<void> | void;
}

export default function CommentSheet({ visible, onClose, comments, onSubmit }: Props) {
  const { theme } = useSport();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  async function submit() {
    if (!text.trim()) return;
    setSending(true);
    try {
      await onSubmit(text.trim());
      setText('');
    } finally { setSending(false); }
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Comments"
      tall
      scrollable={false}
      contentStyle={{ paddingHorizontal: 0, paddingBottom: 0 }}
    >
      <FlatList
        data={comments}
        keyExtractor={(c) => c.id}
        style={{ maxHeight: 360 }}
        renderItem={({ item: c }) => (
          <View style={styles.commentRow}>
            <Avatar name={c.authorName} size={32} />
            <View style={{ flex: 1 }}>
              <View style={[styles.commentBubble, { backgroundColor: theme.pageBg }]}>
                <Text style={[typography.smallStrong, { color: theme.primary }]}>{c.authorName}</Text>
                <Text style={[typography.small, { color: theme.textPrimary, marginTop: 2 }]}>
                  {c.content}
                </Text>
              </View>
              <Text style={[typography.caption, { color: theme.textMuted, marginTop: 4, marginLeft: 4 }]}>
                {timeAgo(c.createdDate)}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={28} color={theme.textMuted} />
            <Text style={[typography.small, { color: theme.textMuted, marginTop: 8 }]}>
              No comments yet. Be the first!
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.sm }}
        keyboardShouldPersistTaps="handled"
      />

      <View style={[styles.inputRow, { borderTopColor: theme.divider }]}>
        <TextInput
          style={[styles.input, { borderColor: theme.border, backgroundColor: theme.pageBg, color: theme.textPrimary }]}
          placeholder="Write a comment…"
          placeholderTextColor={theme.textMuted}
          value={text}
          onChangeText={setText}
          multiline
        />
        <Pressable
          onPress={submit}
          disabled={!text.trim() || sending}
          style={({ pressed }) => [
            styles.sendBtn,
            { backgroundColor: text.trim() ? theme.primary : theme.divider },
            pressed && { opacity: 0.85 },
          ]}
        >
          {sending ? <ActivityIndicator size="small" color="#fff" /> : (
            <Ionicons name="send" size={16} color={text.trim() ? '#fff' : theme.textMuted} />
          )}
        </Pressable>
      </View>
    </BottomSheet>
  );
}

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const styles = StyleSheet.create({
  commentRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  commentBubble: {
    padding: 10, borderRadius: radii.md,
    borderTopLeftRadius: 4,
  },
  empty: { alignItems: 'center', paddingVertical: spacing.xl },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm,
    padding: spacing.sm + 2,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderWidth: 1, borderRadius: radii.lg,
    paddingHorizontal: 12, paddingVertical: 10,
    minHeight: 42, maxHeight: 100,
    fontSize: 14,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
  },
});
