import api from './client';

export interface AIMessage { role: 'user' | 'assistant'; content: string; }

export const aiChatApi = {
  send: (messages: AIMessage[]) =>
    api.post<{ text: string }>('/aichat', { messages }, { timeout: 60000 } as any),
};
