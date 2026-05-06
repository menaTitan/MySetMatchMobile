import api from './client';
import type { FeedPost, FeedResponse } from '../types';

// Matches the backend ReactionType enum (Data/Entities/PostReaction.cs).
export const REACTIONS = ['Like', 'Love', 'Celebrate'] as const;
export type ReactionKind = typeof REACTIONS[number];
const REACTION_INT: Record<ReactionKind, number> = { Like: 1, Love: 2, Celebrate: 3 };
export const toReactionInt = (r: ReactionKind | number) =>
  typeof r === 'number' ? r : REACTION_INT[r];

export const feedApi = {
  list: (params?: { sportId?: string; page?: number }) =>
    api.get<FeedResponse>('/feed', { params }),
  createPost: (data: { content: string; sportId?: string; imageUrl?: string }) =>
    api.post<FeedPost>('/feed', data),
  uploadImage: (uri: string) => {
    const form = new FormData();
    const ext = uri.split('.').pop() || 'jpg';
    form.append('image', {
      uri,
      name: `post.${ext}`,
      type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
    } as any);
    return api.post<{ url: string }>('/feed/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
  },
  react: (postId: string, reaction: ReactionKind | number = 'Like') =>
    api.post(`/feed/${postId}/react`, { reactionType: toReactionInt(reaction) }),
  editPost: (postId: string, content: string) =>
    api.patch(`/feed/${postId}`, { content }),
  deletePost: (postId: string) =>
    api.delete(`/feed/${postId}`),
  addComment: (postId: string, content: string) =>
    api.post(`/feed/${postId}/comment`, { content }),
  editComment: (postId: string, commentId: string, content: string) =>
    api.patch(`/feed/${postId}/comment/${commentId}`, { content }),
  deleteComment: (postId: string, commentId: string) =>
    api.delete(`/feed/${postId}/comment/${commentId}`),
};
