import api from './client';

export interface ChatParticipantDto {
  userId: string;
  userName: string;
  profilePhotoUrl?: string;
  isAdmin?: boolean;
}
export interface ChatRoomDto {
  id: string;
  name: string;
  type: 'Direct' | 'Group' | 'Tournament' | 'Support';
  tournamentId?: string;
  tournamentName?: string;
  participants: ChatParticipantDto[];
  lastMessage?: { content: string; sentDate: string; senderId: string } | null;
  unreadCount: number;
}
export interface ChatMessageDto {
  id: string;
  senderId: string;
  senderName: string;
  senderProfilePhotoUrl?: string;
  content: string;
  sentDate: string;
  isEdited?: boolean;
  editedDate?: string;
  attachmentUrl?: string | null;
  attachmentType?: 'image' | 'file' | null;
  attachmentName?: string | null;
  // Client-only state used for optimistic sends — never present on server payloads.
  pending?: boolean;
  failed?: boolean;
}
export interface SuggestedUser {
  userId: string;
  userName: string;
  fullName?: string;
  profilePhotoUrl?: string;
  isOnline?: boolean;
}

export const chatApi = {
  rooms: () => api.get<ChatRoomDto[]>('/mobile/chat/rooms'),
  messages: (roomId: string, skip = 0, take = 50) =>
    api.get<ChatMessageDto[]>(`/mobile/chat/${roomId}/messages`, { params: { skip, take } }),
  send: (roomId: string, content: string) =>
    api.post<ChatMessageDto>(`/mobile/chat/${roomId}/messages`, { content }),
  sendAttachment: (
    roomId: string,
    file: { uri: string; name: string; type: string },
    content?: string,
  ) => {
    const form = new FormData();
    // React Native FormData accepts {uri,name,type}
    form.append('file', file as any);
    if (content && content.trim()) form.append('content', content.trim());
    return api.post<ChatMessageDto>(
      `/mobile/chat/${roomId}/attachment`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },
  markRead: (roomId: string) => api.post(`/mobile/chat/${roomId}/read`),
  createDirect: (otherUserId: string) =>
    api.post<{ id: string; created: boolean }>('/mobile/chat/direct', { otherUserId }),
  createGroup: (data: { name: string; participantUserIds: string[] }) =>
    api.post<{ id: string }>('/mobile/chat/group', data),
  createTournamentChat: (tournamentId: string) =>
    api.post<{ id: string }>(`/mobile/chat/tournament/${tournamentId}`),
  getOrCreateSupport: () =>
    api.post<{ id: string }>('/mobile/chat/support'),
  addParticipants: (roomId: string, userIds: string[]) =>
    api.post(`/mobile/chat/${roomId}/participants`, { userIds }),
  removeParticipant: (roomId: string, userId: string) =>
    api.delete(`/mobile/chat/${roomId}/participants/${userId}`),
  searchUsers: (query: string) =>
    api.get<ChatParticipantDto[]>('/mobile/chat/users/search', { params: { query } }),
  topUsers: () =>
    api.get<SuggestedUser[]>('/mobile/chat/users/top'),
  unreadCount: () =>
    api.get<{ count: number }>('/mobile/chat/unread-count'),
};
