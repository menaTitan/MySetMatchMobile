import React, { useMemo, useState } from 'react';
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
  parentCommentId?: string | null;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  comments: CommentItem[];
  onSubmit: (text: string, parentCommentId?: string) => Promise<void> | void;
}

interface ThreadNode {
  comment: CommentItem;
  replies: CommentItem[];
}

export default function CommentSheet({ visible, onClose, comments, onSubmit }: Props) {
  const { theme } = useSport();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string } | null>(null);

  // Group: top-level comments → their replies. Anything with a parent that
  // doesn't resolve gets surfaced as a top-level comment so nothing is lost.
  const threads: ThreadNode[] = useMemo(() => {
    const byId = new Map(comments.map((c) => [c.id, c]));
    const roots: CommentItem[] = [];
    const childrenOf = new Map<string, CommentItem[]>();
    for (const c of comments) {
      if (c.parentCommentId && byId.has(c.parentCommentId)) {
        const arr = childrenOf.get(c.parentCommentId) ?? [];
        arr.push(c);
        childrenOf.set(c.parentCommentId, arr);
      } else {
        roots.push(c);
      }
    }
    return roots.map((r) => ({ comment: r, replies: childrenOf.get(r.id) ?? [] }));
  }, [comments]);

  async function submit() {
    if (!text.trim()) return;
    setSending(true);
    try {
      await onSubmit(text.trim(), replyingTo?.id);
      setText('');
      setReplyingTo(null);
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
        data={threads}
        keyExtractor={(t) => t.comment.id}
        style={{ maxHeight: 360 }}
        renderItem={({ item: thread }) => (
          <View style={{ gap: spacing.xs }}>
            <CommentRow
              c={thread.comment}
              onReply={() => setReplyingTo({ id: thread.comment.id, authorName: thread.comment.authorName })}
            />
            {thread.replies.map((r) => (
              <View key={r.id} style={{ marginLeft: 32 }}>
                <CommentRow c={r} />
              </View>
            ))}
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

      {replyingTo ? (
        <View style={[styles.replyBanner, { backgroundColor: theme.featureBg }]}>
          <Ionicons name="return-down-forward-outline" size={14} color={theme.secondary} />
          <Text style={[typography.caption, { color: theme.textSecondary, flex: 1 }]} numberOfLines={1}>
            Replying to {replyingTo.authorName}
          </Text>
          <Pressable onPress={() => setReplyingTo(null)} hitSlop={8}>
            <Ionicons name="close" size={14} color={theme.textMuted} />
          </Pressable>
        </View>
      ) : null}

      <View style={[styles.inputRow, { borderTopColor: theme.divider }]}>
        <TextInput
          style={[styles.input, { borderColor: theme.border, backgroundColor: theme.pageBg, color: theme.textPrimary }]}
          placeholder={replyingTo ? `Reply to ${replyingTo.authorName}…` : 'Write a comment…'}
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

function CommentRow({ c, onReply }: { c: CommentItem; onReply?: () => void }) {
  const { theme } = useSport();
  return (
    <View style={styles.commentRow}>
      <Avatar name={c.authorName} size={28} />
      <View style={{ flex: 1 }}>
        <View style={[styles.commentBubble, { backgroundColor: theme.pageBg }]}>
          <Text style={[typography.smallStrong, { color: theme.primary }]}>{c.authorName}</Text>
          <Text style={[typography.small, { color: theme.textPrimary, marginTop: 2 }]}>
            {c.content}
          </Text>
        </View>
        <View style={styles.commentMeta}>
          <Text style={[typography.caption, { color: theme.textMuted }]}>
            {timeAgo(c.createdDate)}
          </Text>
          {onReply ? (
            <Pressable onPress={onReply} hitSlop={6}>
              <Text style={[typography.caption, { color: theme.secondary, fontWeight: '700' }]}>Reply</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
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
  commentMeta: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginTop: 4, marginLeft: 4,
  },
  empty: { alignItems: 'center', paddingVertical: spacing.xl },
  replyBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.base, paddingVertical: 6,
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
    minHeight: 42, maxHeight: 100,
    fontSize: 14,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
  },
});
