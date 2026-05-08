import * as SecureStore from 'expo-secure-store';
import api from './client';
import { API_BASE_URL } from '../config/env';

export interface AIMessage { role: 'user' | 'assistant'; content: string; }

export const aiChatApi = {
  send: (messages: AIMessage[]) =>
    api.post<{ text: string }>('/aichat', { messages }, { timeout: 60000 } as any),

  /**
   * Streams the assistant's reply via SSE. Calls `onToken` for each text delta
   * and resolves with the full text once the server emits `[DONE]`.
   * Falls back to a single `onToken` call from the non-streaming endpoint if
   * streaming fails for any reason (e.g. older RN runtime without ReadableStream).
   */
  async stream(
    messages: AIMessage[],
    onToken: (delta: string) => void,
    signal?: AbortSignal,
  ): Promise<string> {
    const token = await SecureStore.getItemAsync('accessToken');
    let full = '';
    try {
      const res = await fetch(`${API_BASE_URL}/api/aichat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messages }),
        signal,
      });
      if (!res.ok || !res.body) throw new Error(`stream-failed-${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        // SSE frames are separated by "\n\n"; each frame's lines start with "data: ".
        let nl: number;
        while ((nl = buffer.indexOf('\n\n')) !== -1) {
          const frame = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 2);
          for (const line of frame.split('\n')) {
            if (!line.startsWith('data:')) continue;
            const payload = line.slice(5).trim();
            if (payload === '[DONE]') return full;
            try {
              const obj = JSON.parse(payload);
              if (obj.text) { full += obj.text; onToken(obj.text); }
            } catch { /* ignore malformed */ }
          }
        }
      }
      return full;
    } catch {
      // Fallback: non-streaming send so the screen still gets a reply.
      const { data } = await aiChatApi.send(messages);
      onToken(data.text);
      return data.text;
    }
  },
};
