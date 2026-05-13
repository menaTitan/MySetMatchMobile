import api from './client';
import type { PrivateGroup, PrivatePost, PrivatePostsResponse } from '../types';
import { toReactionInt, type ReactionKind } from './feed';

export interface GroupMember {
  userId: string;
  userName: string;
  fullName?: string;
  profilePhotoUrl?: string;
  isAdmin: boolean;
  joinedDate: string;
}

export interface IncomingInvitation {
  id: string;
  groupId: string;
  groupName: string;
  invitedByUserId: string;
  invitedByName?: string;
  invitedByPhotoUrl?: string;
  message?: string;
  createdDate: string;
}

export interface OutgoingInvitation {
  id: string;
  userId: string;
  userName?: string;
  fullName?: string;
  profilePhotoUrl?: string;
  createdDate: string;
}

export const privateGroupsApi = {
  myGroups: () => api.get<PrivateGroup[]>('/privategroups/my'),
  createGroup: (data: { name: string; description?: string; sportId?: string }) =>
    api.post<PrivateGroup>('/privategroups', data),
  rename: (groupId: string, name: string) =>
    api.put(`/privategroups/${groupId}`, { name }),
  deleteGroup: (groupId: string) =>
    api.delete(`/privategroups/${groupId}`),

  members: (groupId: string) =>
    api.get<GroupMember[]>(`/privategroups/${groupId}/members`),
  removeMember: (groupId: string, userId: string) =>
    api.delete(`/privategroups/${groupId}/members/${userId}`),

  // ── Invitations ────────────────────────────────────────────────────────────
  invite: (groupId: string, userId: string, message?: string) =>
    api.post<{ id: string; invited?: boolean; alreadyPending?: boolean }>(
      `/privategroups/${groupId}/invitations`, { userId, message }),
  groupInvitations: (groupId: string) =>
    api.get<OutgoingInvitation[]>(`/privategroups/${groupId}/invitations`),
  cancelInvitation: (groupId: string, invitationId: string) =>
    api.delete(`/privategroups/${groupId}/invitations/${invitationId}`),
  myInvitations: () =>
    api.get<IncomingInvitation[]>('/privategroups/invitations/mine'),
  acceptInvitation: (invitationId: string) =>
    api.post<{ accepted: true; groupId: string }>(`/privategroups/invitations/${invitationId}/accept`),
  declineInvitation: (invitationId: string) =>
    api.post(`/privategroups/invitations/${invitationId}/decline`),

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
  addComment: (groupId: string, postId: string, content: string, parentCommentId?: string) =>
    api.post(`/privategroups/${groupId}/posts/${postId}/comment`, { content, parentCommentId }),
  editComment: (groupId: string, postId: string, commentId: string, content: string) =>
    api.patch(`/privategroups/${groupId}/posts/${postId}/comment/${commentId}`, { content }),
  deleteComment: (groupId: string, postId: string, commentId: string) =>
    api.delete(`/privategroups/${groupId}/posts/${postId}/comment/${commentId}`),
  join: (groupId: string) => api.post(`/privategroups/${groupId}/join`),
  leave: (groupId: string) => api.post(`/privategroups/${groupId}/leave`),
};
