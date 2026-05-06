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
  type: 'Direct' | 'Group' | 'Tournament';
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
}

export const chatApi = {
  rooms: () => api.get<ChatRoomDto[]>('/mobile/chat/rooms'),
  messages: (roomId: string, skip = 0, take = 50) =>
    api.get<ChatMessageDto[]>(`/mobile/chat/${roomId}/messages`, { params: { skip, take } }),
  send: (roomId: string, content: string) =>
    api.post<ChatMessageDto>(`/mobile/chat/${roomId}/messages`, { content }),
  markRead: (roomId: string) => api.post(`/mobile/chat/${roomId}/read`),
  createDirect: (otherUserId: string) =>
    api.post<{ id: string; created: boolean }>('/mobile/chat/direct', { otherUserId }),
  searchUsers: (query: string) =>
    api.get<ChatParticipantDto[]>('/mobile/chat/users/search', { params: { query } }),
};
