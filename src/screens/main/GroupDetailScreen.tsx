import React, { useCallback, useState } from 'react';
import { View, FlatList, RefreshControl, Alert, Pressable, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { privateGroupsApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useSport } from '../../context/SportContext';
import type { PrivatePost } from '../../types';
import PostCard from '../../components/PostCard';
import Composer from '../../components/Composer';
import CommentSheet from '../../components/CommentSheet';
import EditPostSheet from '../../components/EditPostSheet';
import { radii, spacing, typography } from '../../theme';
import { EmptyState, LoadingView, useToast } from '../../components/ui';

export default function GroupDetailScreen({ route, navigation }: any) {
  const { groupId, groupName } = route.params;
  const { theme } = useSport();
  const { player: me } = useAuth();
  const toast = useToast();
  const [posts, setPosts] = useState<PrivatePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const [commentPost, setCommentPost] = useState<PrivatePost | null>(null);
  const [editingPost, setEditingPost] = useState<PrivatePost | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await privateGroupsApi.posts(groupId);
      setPosts(data?.items ?? []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [groupId]);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  async function submitPost(content: string, imageUri?: string) {
    const text = content.trim();
    if (!text && !imageUri) return;
    setPosting(true);
    try {
      let imageUrl: string | undefined;
      if (imageUri) {
        // Reuse the feed uploader — both endpoints accept the same blob URL.
        const { feedApi } = await import('../../api/feed');
        const up = await feedApi.uploadImage(imageUri);
        imageUrl = up.data.url;
      }
      const { data } = await privateGroupsApi.createPost(groupId, { content: text, imageUrl });
      setPosts((prev) => [data, ...prev]);
      setNewPost('');
    } catch { Alert.alert('Error', 'Could not post. Please try again.'); }
    finally { setPosting(false); }
  }

  async function react(postId: string, kind: 'Like' | 'Love' | 'Celebrate') {
    try { await privateGroupsApi.react(groupId, postId, kind); load(); } catch {}
  }

  async function submitComment(text: string) {
    if (!commentPost) return;
    try {
      await privateGroupsApi.addComment(groupId, commentPost.id, text);
      setCommentPost(null);
      load();
    } catch { Alert.alert('Error', 'Could not post comment.'); }
  }

  async function saveEdit(text: string) {
    if (!editingPost) return;
    try { await privateGroupsApi.editPost(groupId, editingPost.id, text); load(); } catch {}
  }
  async function deletePost(id: string) {
    Alert.alert('Delete post', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await privateGroupsApi.deletePost(groupId, id); load(); } catch {}
      } },
    ]);
  }

  async function rename() {
    Alert.prompt?.('Rename group', 'New name', async (newName) => {
      if (!newName?.trim()) return;
      try { await privateGroupsApi.rename(groupId, newName.trim()); toast('Renamed', 'success'); navigation.setParams?.({ groupName: newName.trim() }); }
      catch {}
    });
  }

  async function deleteGroup() {
    Alert.alert('Delete group', 'This will remove all posts and members. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await privateGroupsApi.deleteGroup(groupId); toast('Deleted', 'success'); navigation.goBack(); }
        catch {}
      } },
    ]);
  }

  async function leave() {
    try { await privateGroupsApi.leave(groupId); navigation.goBack(); } catch {}
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <View style={[styles.toolRow, { borderBottomColor: theme.divider, backgroundColor: theme.cardBg }]}>
        <Pressable onPress={() => navigation.navigate('GroupMembers', { groupId, name: groupName })} style={styles.toolBtn}>
          <Ionicons name="people-outline" size={14} color={theme.primary} />
          <Text style={[typography.caption, { color: theme.primary, fontWeight: '700' }]}>MEMBERS</Text>
        </Pressable>
        <Pressable onPress={rename} style={styles.toolBtn}>
          <Ionicons name="create-outline" size={14} color={theme.primary} />
          <Text style={[typography.caption, { color: theme.primary, fontWeight: '700' }]}>RENAME</Text>
        </Pressable>
        <Pressable onPress={leave} style={styles.toolBtn}>
          <Ionicons name="exit-outline" size={14} color={theme.warning} />
          <Text style={[typography.caption, { color: theme.warning, fontWeight: '700' }]}>LEAVE</Text>
        </Pressable>
        <Pressable onPress={deleteGroup} style={styles.toolBtn}>
          <Ionicons name="trash-outline" size={14} color={theme.dangerRed} />
          <Text style={[typography.caption, { color: theme.dangerRed, fontWeight: '700' }]}>DELETE</Text>
        </Pressable>
      </View>

      <Composer
        value={newPost}
        onChange={setNewPost}
        onSubmit={(content, uri) => submitPost(content, uri)}
        loading={posting}
        placeholder={`Post to ${groupName}…`}
      />

      {loading ? <LoadingView /> : (
        <FlatList
          data={posts}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              isOwner={!!me && item.authorId === me.id}
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
            <EmptyState icon="chatbubbles-outline" title="No posts yet" message="Be the first to share something with the group." />
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

const styles = StyleSheet.create({
  toolRow: { flexDirection: 'row', borderBottomWidth: 1 },
  toolBtn: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4,
    paddingVertical: spacing.sm + 2,
  },
});
