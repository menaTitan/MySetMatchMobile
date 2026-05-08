// Lightweight global online-presence store fed by the chat hub's
// UserCameOnline / UserWentOffline broadcasts. Components subscribe to know
// whether a given userId is currently online.

import { useEffect, useState } from 'react';
import { getHub } from './signalR';

const online = new Set<string>();
const listeners = new Set<() => void>();

function emit() { listeners.forEach((l) => l()); }

let wired = false;
async function ensureWired() {
  if (wired) return;
  wired = true;
  try {
    const hub = await getHub('chat');
    hub.on('UserCameOnline', (userId: string) => {
      if (!online.has(userId)) { online.add(userId); emit(); }
    });
    hub.on('UserWentOffline', (userId: string) => {
      if (online.delete(userId)) emit();
    });
  } catch {
    wired = false; // allow retry
  }
}

export function isOnline(userId: string): boolean {
  return online.has(userId);
}

export function useOnlinePresence(userIds: string[]): Record<string, boolean> {
  const [, force] = useState(0);
  useEffect(() => {
    ensureWired();
    const cb = () => force((n) => n + 1);
    listeners.add(cb);
    return () => { listeners.delete(cb); };
  }, []);
  const map: Record<string, boolean> = {};
  for (const id of userIds) map[id] = online.has(id);
  return map;
}
