import React, { useCallback, useState } from 'react';
import { View, FlatList, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { feedApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useSport } from '../../context/SportContext';
import type { FeedPost } from '../../types';
import SportPickerBar from '../../components/SportPickerBar';
import PostCard from '../../components/PostCard';
import Composer from '../../components/Composer';
import CommentSheet from '../../components/CommentSheet';
import EditPostSheet from '../../components/EditPostSheet';
import { spacing } from '../../theme';
import { EmptyState, LoadingView, PageHeader } from '../../components/ui';

export default function FeedScreen({ navigation }: any) {
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
      setPosts(data.items);
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
    <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <PageHeader title="Feed" subtitle="Latest from the community" compact />
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
              isOwner={!!me && item.authorId === me.id}
              onReact={(k) => react(item.id, k)}
              onComment={() => setCommentPost(item)}
              onEdit={() => setEditingPost(item)}
              onDelete={() => deletePost(item.id)}
              onAuthorPress={item.authorId ? () => navigation.getParent()?.navigate('PlayerProfile', { playerId: item.authorId }) : undefined}
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
            <EmptyState icon="megaphone-outline" title="No posts yet" message="Be the first to share something!" />
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
