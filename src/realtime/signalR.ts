import * as SignalR from '@microsoft/signalr';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../config/env';

type HubName = 'liveScore' | 'chat';

const HUB_PATHS: Record<HubName, string> = {
  liveScore: '/hubs/livescore',
  chat: '/hubs/chat',
};

const connections = new Map<HubName, SignalR.HubConnection>();

export async function getHub(name: HubName): Promise<SignalR.HubConnection> {
  let conn = connections.get(name);
  if (conn && conn.state === SignalR.HubConnectionState.Connected) return conn;

  if (!conn) {
    conn = new SignalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}${HUB_PATHS[name]}`, {
        accessTokenFactory: async () => (await SecureStore.getItemAsync('accessToken')) ?? '',
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(SignalR.LogLevel.Warning)
      .build();
    connections.set(name, conn);
  }

  if (conn.state === SignalR.HubConnectionState.Disconnected) {
    try { await conn.start(); } catch (e) { /* swallow — caller handles fallback */ }
  }
  return conn;
}

export async function disconnectHub(name: HubName): Promise<void> {
  const conn = connections.get(name);
  if (conn) {
    try { await conn.stop(); } catch {}
    connections.delete(name);
  }
}

export async function disconnectAll(): Promise<void> {
  for (const [name] of connections) await disconnectHub(name);
}

export { SignalR };
