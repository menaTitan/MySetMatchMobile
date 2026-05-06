import api from './client';
import type { PrivateGroup, PrivatePost, PrivatePostsResponse } from '../types';
import { toReactionInt, type ReactionKind } from './feed';

export const privateGroupsApi = {
  myGroups: () => api.get<PrivateGroup[]>('/privategroups/my'),
  createGroup: (data: { name: string; description?: string }) =>
    api.post<PrivateGroup>('/privategroups', data),
  posts: (groupId: string, params?: { page?: number }) =>
    api.get<PrivatePostsResponse>(`/privategroups/${groupId}/posts`, { params }),
  createPost: (groupId: string, data: { content: string; imageUrl?: string }) =>
    api.post<PrivatePost>(`/privategroups/${groupId}/posts`, data),
  react: (groupId: string, postId: string, reaction: ReactionKind | number = 'Like') =>
    api.post(`/privategroups/${groupId}/posts/${postId}/react`, { reactionType: toReactionInt(reaction) }),
  editPost: (groupId: string, postId: string, content: string) =>
    api.patch(`/privategroups/${groupId}/posts/${postId}`, { content }),
  deletePost: (groupId: string, postId: string) =>
    api.delete(`/privategroups/${groupId}/posts/${postId}`),
  addComment: (groupId: string, postId: string, content: string) =>
    api.post(`/privategroups/${groupId}/posts/${postId}/comment`, { content }),
  editComment: (groupId: string, postId: string, commentId: string, content: string) =>
    api.patch(`/privategroups/${groupId}/posts/${postId}/comment/${commentId}`, { content }),
  deleteComment: (groupId: string, postId: string, commentId: string) =>
    api.delete(`/privategroups/${groupId}/posts/${postId}/comment/${commentId}`),
  join: (groupId: string) => api.post(`/privategroups/${groupId}/join`),
  leave: (groupId: string) => api.post(`/privategroups/${groupId}/leave`),
};
