import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, Alert,
  Modal, KeyboardAvoidingView, Platform, Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { feedApi, privateGroupsApi } from '../../api';
import { useSport } from '../../context/SportContext';
import type { FeedPost, PrivateGroup } from '../../types';
import SportPickerBar from '../../components/SportPickerBar';
import PostCard from '../../components/PostCard';
import Composer from '../../components/Composer';
import CommentSheet from '../../components/CommentSheet';
import EditPostSheet from '../../components/EditPostSheet';
import { useAuth } from '../../context/AuthContext';
import { radii, shadows, spacing, typography } from '../../theme';
import { Avatar, Button, Card, Chip, EmptyState, Input, LoadingView, PageHeader } from '../../components/ui';

type Tab = 'public' | 'groups';

export default function CommunityScreen({ navigation }: any) {
  const { theme } = useSport();
  const [tab, setTab] = useState<Tab>('public');

  return (
    <View style={[styles.root, { backgroundColor: theme.pageBg }]}>
      <PageHeader
        title="Community"
        subtitle="Connect with players & share updates"
        compact
        right={
          <Pressable
            onPress={() => navigation.navigate('ChatList')}
            style={({ pressed }) => [
              styles.chatBtn,
              { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)' },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Ionicons name="chatbubbles" size={16} color="#fff" />
            <Text style={[typography.smallStrong, { color: '#fff' }]}>Chats</Text>
          </Pressable>
        }
      />

      <View style={[styles.tabBar, { backgroundColor: theme.cardBg, borderBottomColor: theme.divider }]}>
        <TabBtn icon="globe-outline" label="Public" active={tab === 'public'} onPress={() => setTab('public')} />
        <TabBtn icon="lock-closed-outline" label="My Groups" active={tab === 'groups'} onPress={() => setTab('groups')} />
      </View>

      {tab === 'public' ? <PublicFeed /> : <MyGroups navigation={navigation} />}
    </View>
  );
}

function TabBtn({
  icon, label, active, onPress,
}: { icon: any; label: string; active: boolean; onPress: () => void }) {
  const { theme } = useSport();
  return (
    <Pressable style={styles.tabBtn} onPress={onPress}>
      <View style={[
        styles.tabInner,
        active && { backgroundColor: theme.featureBg },
      ]}>
        <Ionicons name={icon} size={15} color={active ? theme.primary : theme.textMuted} />
        <Text style={[
          typography.smallStrong,
          { color: active ? theme.primary : theme.textMuted },
        ]}>{label}</Text>
      </View>
    </Pressable>
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

// ── My Groups ─────────────────────────────────────────────────────────────────

function MyGroups({ navigation }: any) {
  const { theme } = useSport();
  const [groups, setGroups] = useState<PrivateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await privateGroupsApi.myGroups();
      setGroups(data ?? []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  async function createGroup() {
    if (!groupName.trim()) { Alert.alert('Error', 'Group name is required'); return; }
    setCreating(true);
    try {
      await privateGroupsApi.createGroup({ name: groupName.trim(), description: groupDesc.trim() || undefined });
      setGroupName(''); setGroupDesc(''); setCreateModal(false);
      load();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Could not create group');
    } finally { setCreating(false); }
  }

  const renderGroup = ({ item }: { item: PrivateGroup }) => (
    <Card
      style={{ padding: 0 }}
      onPress={() => navigation.navigate('GroupDetail', { groupId: item.id, groupName: item.name })}
    >
      <View style={styles.groupRow}>
        <View style={[styles.groupIcon, { backgroundColor: theme.featureBg }]}>
          <Ionicons name="people" size={22} color={theme.secondary} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[typography.h3, { color: theme.textPrimary, flex: 1 }]} numberOfLines={1}>
              {item.name}
            </Text>
            {item.isAdmin && <Chip label="Admin" color="accent" variant="soft" size="sm" />}
          </View>
          {item.description ? (
            <Text style={[typography.small, { color: theme.textMuted }]} numberOfLines={1}>
              {item.description}
            </Text>
          ) : null}
          <View style={styles.groupMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={11} color={theme.textMuted} />
              <Text style={[typography.caption, { color: theme.textMuted }]}>
                {item.memberCount}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="document-text-outline" size={11} color={theme.textMuted} />
              <Text style={[typography.caption, { color: theme.textMuted }]}>
                {item.postCount}
              </Text>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
      </View>
    </Card>
  );

  return (
    <View style={{ flex: 1 }}>
      {loading ? <LoadingView /> : (
        <FlatList
          data={groups}
          keyExtractor={(g) => g.id}
          renderItem={renderGroup}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor={theme.accent}
            />
          }
          contentContainerStyle={{ padding: spacing.base, paddingBottom: 100 }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title="No groups yet"
              message="Create a private group to share with teammates or your club."
            />
          }
        />
      )}

      <Pressable
        onPress={() => setCreateModal(true)}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: theme.accent, shadowColor: theme.accent },
          pressed && { transform: [{ scale: 0.96 }] },
        ]}
      >
        <Ionicons name="add" size={22} color={theme.primary} />
        <Text style={[typography.smallStrong, { color: theme.primary, fontWeight: '800' }]}>New Group</Text>
      </Pressable>

      <Modal visible={createModal} animationType="slide" transparent onRequestClose={() => setCreateModal(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalOverlay}>
            <View style={[styles.sheet, { backgroundColor: theme.cardBg }]}>
              <View style={styles.handle} />
              <View style={styles.sheetHeader}>
                <Text style={[typography.h2, { color: theme.primary }]}>Create Group</Text>
                <Pressable onPress={() => setCreateModal(false)} style={[styles.closeBtn, { backgroundColor: theme.divider }]}>
                  <Ionicons name="close" size={18} color={theme.textSecondary} />
                </Pressable>
              </View>
              <View style={{ padding: spacing.lg }}>
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
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    padding: spacing.xs + 2,
    gap: spacing.xs,
    borderBottomWidth: 1,
  },
  tabBtn: { flex: 1 },
  tabInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10,
    borderRadius: radii.md,
  },

  groupRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.md, padding: spacing.base,
  },
  groupIcon: {
    width: 48, height: 48, borderRadius: radii.md,
    alignItems: 'center', justifyContent: 'center',
  },
  groupMeta: { flexDirection: 'row', gap: spacing.md, marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },

  fab: {
    position: 'absolute', bottom: 20, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 18, paddingVertical: 12,
    borderRadius: radii.pill,
    shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: radii.xxl, borderTopRightRadius: radii.xxl,
    maxHeight: '75%', paddingBottom: spacing.lg,
  },
  handle: {
    alignSelf: 'center', width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#E2E8F0', marginTop: 8,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  chatBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: radii.pill, borderWidth: 1,
  },
});
