import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, Alert,
  Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { feedApi, privateGroupsApi } from '../../api';
import { useSport } from '../../context/SportContext';
import type { FeedPost, PrivateGroup, PrivatePost } from '../../types';
import SportPickerBar from '../../components/SportPickerBar';
import PostCard from '../../components/PostCard';
import Composer from '../../components/Composer';
import CommentSheet from '../../components/CommentSheet';
import EditPostSheet from '../../components/EditPostSheet';
import { useAuth } from '../../context/AuthContext';
import { radii, shadows, spacing, typography } from '../../theme';
import { Avatar, BottomSheet, Button, Card, Chip, EmptyState, HeroHeader, Input, LoadingView, SegmentedTabs } from '../../components/ui';

type Tab = 'public' | 'private';

export default function CommunityScreen({ navigation }: any) {
  const { theme } = useSport();
  const [tab, setTab] = useState<Tab>('public');
  const [groupsOpen, setGroupsOpen] = useState(false);
  const [inviteCount, setInviteCount] = useState(0);

  // Poll pending invitations every time the screen regains focus so the
  // badge stays current after the user accepts/declines elsewhere.
  useFocusEffect(useCallback(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await privateGroupsApi.myInvitations();
        if (!cancelled) setInviteCount(data.length);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []));

  return (
    <View style={[styles.root, { backgroundColor: theme.pageBg }]}>
      <HeroHeader
        variant="compact"
        title="Community"
        subtitle="Connect with players & share updates"
        right={
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              onPress={() => navigation.navigate('Invitations')}
              style={({ pressed }) => [
                styles.iconBtn,
                { backgroundColor: 'rgba(255,255,255,0.10)', borderColor: 'rgba(255,255,255,0.22)' },
                pressed && { opacity: 0.8 },
              ]}
              hitSlop={6}
            >
              <Ionicons name="mail-outline" size={16} color="#fff" />
              {inviteCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{inviteCount > 9 ? '9+' : inviteCount}</Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable
              onPress={() => setGroupsOpen(true)}
              style={({ pressed }) => [
                styles.iconBtn,
                { backgroundColor: 'rgba(255,255,255,0.10)', borderColor: 'rgba(255,255,255,0.22)' },
                pressed && { opacity: 0.8 },
              ]}
              hitSlop={6}
            >
              <Ionicons name="people-outline" size={16} color="#fff" />
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('ChatList')}
              style={({ pressed }) => [
                styles.iconBtn,
                { backgroundColor: 'rgba(255,255,255,0.10)', borderColor: 'rgba(255,255,255,0.22)' },
                pressed && { opacity: 0.8 },
              ]}
              hitSlop={6}
            >
              <Ionicons name="chatbubbles-outline" size={16} color="#fff" />
            </Pressable>
          </View>
        }
      />

      <SegmentedTabs
        variant="underline"
        scrollable={false}
        value={tab}
        onChange={(k) => setTab(k as Tab)}
        tabs={[
          { key: 'public',  label: 'Public',  icon: 'globe-outline' },
          { key: 'private', label: 'Private', icon: 'lock-closed-outline' },
        ]}
      />

      {tab === 'public'
        ? <PublicFeed />
        : <PrivateFeed navigation={navigation} onManageGroups={() => setGroupsOpen(true)} />}

      <ManageGroupsSheet
        visible={groupsOpen}
        onClose={() => setGroupsOpen(false)}
        navigation={navigation}
      />
    </View>
  );
}

// ── Public Feed ────────────────────────────────────────────────────────────────

function PublicFeed() {
  const { currentSport, theme } = useSport();
  const { player: me } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const [commentPost, setCommentPost] = useState<FeedPost | null>(null);
  const [editingPost, setEditingPost] = useState<FeedPost | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await feedApi.list({ sportId: currentSport?.id });
      setPosts(data?.items ?? []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [currentSport?.id]);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  async function submitPost(content: string, imageUri?: string) {
    const text = content.trim();
    if (!text && !imageUri) return;
    setPosting(true);
    try {
      let imageUrl: string | undefined;
      if (imageUri) {
        const up = await feedApi.uploadImage(imageUri);
        imageUrl = up.data.url;
      }
      const { data } = await feedApi.createPost({ content: text, sportId: currentSport?.id, imageUrl });
      setPosts((prev) => [data, ...prev]);
      setNewPost('');
    } catch { Alert.alert('Error', 'Could not post. Please try again.'); }
    finally { setPosting(false); }
  }

  async function react(postId: string, kind: 'Like' | 'Love' | 'Celebrate') {
    try { await feedApi.react(postId, kind); load(); } catch {}
  }

  async function submitComment(text: string) {
    if (!commentPost) return;
    try {
      await feedApi.addComment(commentPost.id, text);
      setCommentPost(null);
      load();
    } catch { Alert.alert('Error', 'Could not post comment.'); }
  }

  async function saveEdit(text: string) {
    if (!editingPost) return;
    try { await feedApi.editPost(editingPost.id, text); load(); } catch {}
  }
  async function deletePost(id: string) {
    Alert.alert('Delete post', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await feedApi.deletePost(id); load(); } catch {}
      } },
    ]);
  }

  return (
    <View style={{ flex: 1 }}>
      <SportPickerBar />
      <Composer
        value={newPost}
        onChange={setNewPost}
        onSubmit={(content, uri) => submitPost(content, uri)}
        loading={posting}
        placeholder={`Share something about ${currentSport?.name ?? 'your sport'}…`}
      />

      {loading ? <LoadingView /> : (
        <FlatList
          data={posts}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              isOwner={!!me && (item as any).authorId === me.id}
              onReact={(k) => react(item.id, k)}
              onComment={() => setCommentPost(item)}
              onEdit={() => setEditingPost(item)}
              onDelete={() => deletePost(item.id)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor={theme.accent}
            />
          }
          contentContainerStyle={{ padding: spacing.base }}
          ListEmptyComponent={
            <EmptyState
              icon="megaphone-outline"
              title="No posts yet"
              message="Be the first to share something with the community!"
            />
          }
        />
      )}

      <CommentSheet
        visible={!!commentPost}
        onClose={() => setCommentPost(null)}
        comments={commentPost?.comments ?? []}
        onSubmit={submitComment}
      />

      <EditPostSheet
        visible={!!editingPost}
        initialText={editingPost?.content ?? ''}
        onClose={() => setEditingPost(null)}
        onSave={saveEdit}
      />
    </View>
  );
}

// ── Private Feed (aggregates posts from all groups the user belongs to) ──────

interface PrivateFeedItem {
  groupId: string;
  groupName: string;
  post: PrivatePost;
}

function PrivateFeed({ navigation, onManageGroups }: { navigation: any; onManageGroups: () => void }) {
  const { theme } = useSport();
  const { player: me } = useAuth();
  const [items, setItems] = useState<PrivateFeedItem[]>([]);
  const [groupCount, setGroupCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data: groups } = await privateGroupsApi.myGroups();
      setGroupCount(groups.length);
      // Fetch first page of posts from each group in parallel.
      const results = await Promise.all(
        groups.map((g) =>
          privateGroupsApi.posts(g.id)
            .then((r) => ({ group: g, items: r.data.items }))
            .catch(() => null),
        ),
      );
      const all: PrivateFeedItem[] = [];
      for (const r of results) {
        if (!r) continue;
        for (const post of r.items) {
          all.push({ groupId: r.group.id, groupName: r.group.name, post });
        }
      }
      all.sort((a, b) =>
        new Date(b.post.createdDate).getTime() - new Date(a.post.createdDate).getTime(),
      );
      setItems(all);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  async function react(it: PrivateFeedItem, kind: 'Like' | 'Love' | 'Celebrate') {
    try { await privateGroupsApi.react(it.groupId, it.post.id, kind); load(); } catch {}
  }

  if (loading) return <LoadingView />;

  if (items.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <EmptyState
          icon="lock-closed-outline"
          title={groupCount === 0 ? 'No private groups yet' : 'No posts in your groups yet'}
          message={
            groupCount === 0
              ? 'Create or join a private group to share with teammates or your club.'
              : 'Posts from your groups will appear here.'
          }
          action={
            <Button
              title={groupCount === 0 ? 'Manage Groups' : 'Open Groups'}
              variant="primary"
              size="md"
              leftIcon="people-outline"
              onPress={onManageGroups}
            />
          }
        />
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(e) => `${e.groupId}-${e.post.id}`}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          tintColor={theme.accent}
        />
      }
      contentContainerStyle={{ padding: spacing.base }}
      ListHeaderComponent={
        <View style={[
          styles.privateBanner,
          { backgroundColor: theme.featureBg, borderColor: theme.border },
        ]}>
          <Ionicons name="lock-closed" size={14} color={theme.accent} />
          <Text style={[typography.smallStrong, { color: theme.textPrimary, flex: 1 }]}>
            Posts from your private groups
          </Text>
          <Pressable onPress={onManageGroups} hitSlop={6}>
            <Text style={[typography.overline, { color: theme.accent, fontSize: 10 }]}>
              MANAGE
            </Text>
          </Pressable>
        </View>
      }
      renderItem={({ item }) => (
        <View style={{ marginBottom: spacing.sm }}>
          <Pressable
            onPress={() =>
              navigation.navigate('GroupDetail', {
                groupId: item.groupId, groupName: item.groupName,
              })
            }
            hitSlop={4}
            style={({ pressed }) => [
              styles.privateGroupTag,
              { borderColor: `${theme.accent}40` },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons name="lock-closed" size={10} color={theme.accent} />
            <Text style={[typography.overline, { color: theme.accent, fontSize: 10 }]}>
              {item.groupName.toUpperCase()}
            </Text>
            <Ionicons name="chevron-forward" size={10} color={theme.accent} />
          </Pressable>
          <PostCard
            post={item.post}
            isOwner={!!me && item.post.authorId === me.id}
            onReact={(k) => react(item, k)}
            onComment={() =>
              navigation.navigate('GroupDetail', {
                groupId: item.groupId, groupName: item.groupName,
              })
            }
          />
        </View>
      )}
    />
  );
}

// ── Manage Groups bottom sheet (lists groups, lets user create one) ──────────

function ManageGroupsSheet({
  visible, onClose, navigation,
}: { visible: boolean; onClose: () => void; navigation: any }) {
  const { theme } = useSport();
  const [groups, setGroups] = useState<PrivateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [createMode, setCreateMode] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await privateGroupsApi.myGroups();
      setGroups(data ?? []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  React.useEffect(() => {
    if (visible) load();
    if (!visible) {
      setCreateMode(false);
      setGroupName('');
      setGroupDesc('');
    }
  }, [visible, load]);

  async function createGroup() {
    if (!groupName.trim()) { Alert.alert('Error', 'Group name is required'); return; }
    setCreating(true);
    try {
      await privateGroupsApi.createGroup({ name: groupName.trim(), description: groupDesc.trim() || undefined });
      setGroupName(''); setGroupDesc(''); setCreateMode(false);
      load();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Could not create group');
    } finally { setCreating(false); }
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={createMode ? 'New Group' : 'My Groups'}
      tall
    >
      {createMode ? (
        <>
          <Input
            label="Group name *"
            leftIcon="people-outline"
            placeholder="e.g. Brentwood TT Club"
            value={groupName}
            onChangeText={setGroupName}
          />
          <Input
            label="Description (optional)"
            placeholder="What is this group about?"
            value={groupDesc}
            onChangeText={setGroupDesc}
            multiline
            numberOfLines={3}
          />
          <Button
            title="Create Group"
            variant="primary"
            size="lg"
            fullWidth
            loading={creating}
            leftIcon="add-circle-outline"
            onPress={createGroup}
            style={{ marginTop: spacing.sm }}
          />
          <Button
            title="Cancel"
            variant="ghost"
            size="md"
            fullWidth
            uppercase={false}
            onPress={() => setCreateMode(false)}
            style={{ marginTop: spacing.xs }}
          />
        </>
      ) : (
        <>
          <Button
            title="New Group"
            variant="primary"
            size="md"
            fullWidth
            leftIcon="add-outline"
            onPress={() => setCreateMode(true)}
            style={{ marginBottom: spacing.base }}
          />

          {loading ? (
            <Text style={[typography.small, { color: theme.textMuted, textAlign: 'center', paddingVertical: spacing.lg }]}>
              Loading…
            </Text>
          ) : groups.length === 0 ? (
            <EmptyState icon="people-outline" title="No groups yet" message="Create one to start sharing privately." />
          ) : (
            <View style={{ gap: spacing.sm }}>
              {groups.map((g) => (
                <Card
                  key={g.id}
                  padding={0}
                  onPress={() => {
                    onClose();
                    navigation.navigate('GroupDetail', { groupId: g.id, groupName: g.name });
                  }}
                >
                  <View style={styles.groupRow}>
                    <View style={[styles.groupIcon, { backgroundColor: theme.featureBg, borderColor: theme.border }]}>
                      <Ionicons name="people" size={20} color={theme.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[typography.bodyStrong, { color: theme.textPrimary, flex: 1 }]} numberOfLines={1}>
                          {g.name}
                        </Text>
                        {g.isAdmin && <Chip label="Admin" color="accent" variant="soft" size="sm" />}
                      </View>
                      <View style={styles.groupMeta}>
                        <View style={styles.metaItem}>
                          <Ionicons name="people-outline" size={11} color={theme.textMuted} />
                          <Text style={[typography.caption, { color: theme.textMuted }]}>
                            {g.memberCount}
                          </Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Ionicons name="document-text-outline" size={11} color={theme.textMuted} />
                          <Text style={[typography.caption, { color: theme.textMuted }]}>
                            {g.postCount}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                  </View>
                </Card>
              ))}
            </View>
          )}
        </>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  iconBtn: {
    width: 36, height: 36, borderRadius: radii.sm,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    position: 'absolute', top: -2, right: -2,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: '#EF4444', // dangerRed — visible on accent header
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  privateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: radii.sm,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },

  privateGroupTag: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.xs,
    borderWidth: 1,
    marginBottom: 6,
  },

  groupRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.md, padding: spacing.base,
  },
  groupIcon: {
    width: 44, height: 44, borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  groupMeta: { flexDirection: 'row', gap: spacing.md, marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
});
