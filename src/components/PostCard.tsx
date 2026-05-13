import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSport } from '../context/SportContext';
import { radii, shadows, spacing, typography } from '../theme';
import Avatar from './ui/Avatar';
import LinkPreview from './LinkPreview';
import { firstLinkPreview } from '../utils/linkPreview';
import { REACTIONS, type ReactionKind } from '../api';

export interface PostLike {
  id: string;
  authorId?: string;
  authorName: string;
  profilePhotoUrl?: string;
  content: string;
  imageUrl?: string;
  createdDate: string;
  likeCount: number;
  commentCount: number;
  myReaction?: string;
  sportName?: string;
  comments?: { id: string; authorName: string; content: string }[];
}

interface Props {
  post: PostLike;
  /** When set, an owner kebab appears with Edit / Delete actions. */
  isOwner?: boolean;
  onReact?: (reaction: ReactionKind) => void;
  onComment?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onAuthorPress?: () => void;
  /** Apple Guideline 1.2: non-owners can report or block. */
  onReport?: () => void;
  onBlockAuthor?: () => void;
}

const REACTION_META: Record<ReactionKind, { emoji: string; color: string; label: string }> = {
  Like:      { emoji: '👍', color: '#2563eb', label: 'Like' },
  Love:      { emoji: '❤️', color: '#dc2626', label: 'Love' },
  Celebrate: { emoji: '🎉', color: '#f59e0b', label: 'Celebrate' },
};

export default function PostCard({
  post, isOwner, onReact, onComment, onEdit, onDelete, onAuthorPress, onReport, onBlockAuthor,
}: Props) {
  const { theme } = useSport();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const active = post.myReaction && REACTIONS.includes(post.myReaction as ReactionKind)
    ? (post.myReaction as ReactionKind) : undefined;
  const meta = active ? REACTION_META[active] : null;
  const link = useMemo(() => firstLinkPreview(post.content), [post.content]);
  return (
    <View style={[styles.card, { backgroundColor: theme.pageBg, borderBottomColor: theme.border }]}>
      <View style={styles.header}>
        <Avatar
          name={post.authorName}
          photoUrl={post.profilePhotoUrl}
          size={40}
          playerId={post.authorId}
          onPress={onAuthorPress}
        />
        <View style={{ flex: 1 }}>
          <Text
            style={[typography.bodyStrong, { color: theme.textPrimary, fontSize: 14 }]}
            onPress={onAuthorPress}
          >
            {post.authorName}
          </Text>
          <Text style={[typography.caption, { color: theme.textMuted }]}>{timeAgo(post.createdDate)}</Text>
        </View>
        {post.sportName ? (
          <View style={[styles.sportTag, { backgroundColor: theme.featureBg, borderColor: `${theme.accent}40` }]}>
            <Text style={[
              typography.overline,
              { color: theme.accent, fontSize: 10 },
            ]}>
              {post.sportName.toUpperCase()}
            </Text>
          </View>
        ) : null}
        {/* Kebab is always present — owners get Edit/Delete, everyone else
            gets Report/Block so Apple Guideline 1.2 surfaces are reachable
            from every post. */}
        <View style={{ position: 'relative' }}>
          <Pressable onPress={() => setMenuOpen((x) => !x)} hitSlop={8} style={{ padding: 4 }}>
            <Ionicons name="ellipsis-horizontal" size={18} color={theme.textMuted} />
          </Pressable>
          {menuOpen ? (
            isOwner ? (
              <OwnerMenu
                onEdit={() => { setMenuOpen(false); onEdit?.(); }}
                onDelete={() => { setMenuOpen(false); onDelete?.(); }}
                onClose={() => setMenuOpen(false)}
              />
            ) : (
              <ViewerMenu
                onReport={() => { setMenuOpen(false); onReport?.(); }}
                onBlock={() => { setMenuOpen(false); onBlockAuthor?.(); }}
                onClose={() => setMenuOpen(false)}
              />
            )
          ) : null}
        </View>
      </View>

      <Text style={[typography.body, { color: theme.textPrimary, marginTop: spacing.sm }]}>
        {post.content}
      </Text>

      {post.imageUrl ? (
        <Image source={{ uri: post.imageUrl }} style={styles.image} resizeMode="cover" />
      ) : null}

      {link ? (
        <View style={{ marginTop: spacing.sm }}>
          <LinkPreview url={link.url} />
        </View>
      ) : null}



      <View style={[styles.actions, { borderTopColor: theme.divider }]}>
        <View style={{ position: 'relative' }}>
          <Pressable
            onPress={() => onReact?.(active ?? 'Like')}
            onLongPress={() => setPickerOpen(true)}
            delayLongPress={250}
            style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.6 }]}
          >
            {meta ? (
              <Text style={{ fontSize: 17 }}>{meta.emoji}</Text>
            ) : (
              <Ionicons name="heart-outline" size={18} color={theme.textSecondary} />
            )}
            <Text style={[typography.smallStrong, { color: meta ? meta.color : theme.textSecondary }]}>
              {meta ? meta.label : 'React'} · {post.likeCount}
            </Text>
          </Pressable>

          {pickerOpen ? (
            <ReactionPicker
              onPick={(k) => { setPickerOpen(false); onReact?.(k); }}
              onClose={() => setPickerOpen(false)}
            />
          ) : null}
        </View>

        <Pressable
          onPress={onComment}
          style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="chatbubble-outline" size={16} color={theme.textSecondary} />
          <Text style={[typography.smallStrong, { color: theme.textSecondary }]}>
            {post.commentCount}
          </Text>
        </Pressable>
      </View>

      {post.comments?.slice(0, 2).map((c) => (
        <View key={c.id} style={[styles.commentPreview, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Text style={[typography.smallStrong, { color: theme.accent }]}>{c.authorName}</Text>
          <Text style={[typography.small, { color: theme.textSecondary, flex: 1 }]} numberOfLines={2}>
            {c.content}
          </Text>
        </View>
      ))}
    </View>
  );
}

function OwnerMenu({
  onEdit, onDelete, onClose,
}: { onEdit: () => void; onDelete: () => void; onClose: () => void }) {
  const { theme } = useSport();
  return (
    <>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={[ownerStyles.tray, { backgroundColor: theme.cardBg }, shadows.lg]}>
        <Pressable style={ownerStyles.item} onPress={onEdit}>
          <Ionicons name="create-outline" size={16} color={theme.textPrimary} />
          <Text style={[typography.smallStrong, { color: theme.textPrimary }]}>Edit</Text>
        </Pressable>
        <View style={[ownerStyles.divider, { backgroundColor: theme.divider }]} />
        <Pressable style={ownerStyles.item} onPress={onDelete}>
          <Ionicons name="trash-outline" size={16} color={theme.dangerRed} />
          <Text style={[typography.smallStrong, { color: theme.dangerRed }]}>Delete</Text>
        </Pressable>
      </View>
    </>
  );
}

function ViewerMenu({
  onReport, onBlock, onClose,
}: { onReport: () => void; onBlock: () => void; onClose: () => void }) {
  const { theme } = useSport();
  return (
    <>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={[ownerStyles.tray, { backgroundColor: theme.cardBg }, shadows.lg]}>
        <Pressable style={ownerStyles.item} onPress={onReport}>
          <Ionicons name="flag-outline" size={16} color={theme.textPrimary} />
          <Text style={[typography.smallStrong, { color: theme.textPrimary }]}>Report post</Text>
        </Pressable>
        <View style={[ownerStyles.divider, { backgroundColor: theme.divider }]} />
        <Pressable style={ownerStyles.item} onPress={onBlock}>
          <Ionicons name="ban-outline" size={16} color={theme.dangerRed} />
          <Text style={[typography.smallStrong, { color: theme.dangerRed }]}>Block user</Text>
        </Pressable>
      </View>
    </>
  );
}

const ownerStyles = StyleSheet.create({
  tray: {
    position: 'absolute', top: 24, right: 0,
    minWidth: 140,
    borderRadius: radii.md,
    paddingVertical: 4,
    zIndex: 10,
  },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  divider: { height: 1, marginHorizontal: 8 },
});

function ReactionPicker({
  onPick, onClose,
}: { onPick: (k: ReactionKind) => void; onClose: () => void }) {
  const { theme } = useSport();
  const anim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 6 }).start();
  }, []);
  return (
    <>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <Animated.View
        style={[
          pickerStyles.tray,
          { backgroundColor: theme.cardBg, opacity: anim, transform: [{ scale: anim }] },
          shadows.lg,
        ]}
      >
        {REACTIONS.map((r) => (
          <Pressable
            key={r}
            onPress={() => onPick(r)}
            style={({ pressed }) => [pickerStyles.item, pressed && { transform: [{ scale: 1.25 }] }]}
          >
            <Text style={pickerStyles.emoji}>{REACTION_META[r].emoji}</Text>
          </Pressable>
        ))}
      </Animated.View>
    </>
  );
}

const pickerStyles = StyleSheet.create({
  tray: {
    position: 'absolute',
    bottom: 30, left: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.sm + 2, paddingVertical: spacing.xs + 2,
    borderRadius: radii.pill,
    gap: spacing.sm,
  },
  item: { padding: 6 },
  emoji: { fontSize: 26 },
});

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    borderBottomWidth: 1,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sportTag: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radii.xs,
    borderWidth: 1,
  },
  image: {
    height: 240,
    marginTop: spacing.sm,
    marginHorizontal: -spacing.base, // edge-to-edge with sharp corners per spec
  },
  actions: {
    flexDirection: 'row', gap: spacing.xl,
    paddingTop: spacing.sm, marginTop: spacing.sm,
    borderTopWidth: 1,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  commentPreview: {
    flexDirection: 'row', gap: 6, flexWrap: 'wrap',
    padding: 10, borderRadius: radii.xs, marginTop: 6,
    borderWidth: 1,
  },
});
