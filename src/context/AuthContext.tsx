import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../api';
import type { Player } from '../types';

interface AuthState {
  player: Player | null;
  /** Identity user id (string GUID) decoded from the JWT — used by chat etc. */
  userId: string | null;
  /** Roles claimed by the current JWT (e.g. "Admin", "Organizer", "Player"). */
  roles: string[];
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isOrganizer: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updatePlayer: (player: Player) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

/** Minimal base64url-safe JWT payload decoder (no signature verification — client-only hint). */
function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    // atob is available on RN Hermes; fall back to manual decode if not.
    const json = typeof atob === 'function'
      ? atob(padded)
      : Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch { return null; }
}

function rolesFromToken(token: string | null | undefined): string[] {
  if (!token) return [];
  const payload = decodeJwt(token);
  if (!payload) return [];
  // .NET Identity emits role claims under the full URI name.
  const keys = [
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
    'role',
    'roles',
  ];
  for (const k of keys) {
    const v = (payload as any)[k];
    if (!v) continue;
    return Array.isArray(v) ? v.map(String) : [String(v)];
  }
  return [];
}

function userIdFromToken(token: string | null | undefined): string | null {
  if (!token) return null;
  const payload = decodeJwt(token);
  if (!payload) return null;
  // ASP.NET Identity stores the user id under the NameIdentifier claim URI,
  // or sometimes under "sub" / "nameid" depending on configuration.
  const keys = [
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
    'sub',
    'nameid',
    'nameIdentifier',
  ];
  for (const k of keys) {
    const v = (payload as any)[k];
    if (typeof v === 'string') return v;
  }
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    player: null,
    userId: null,
    roles: [],
    isLoading: true,
    isAuthenticated: false,
    isAdmin: false,
    isOrganizer: false,
  });

  useEffect(() => {
    restoreSession();
  }, []);

  function authedState(player: Player, token: string): AuthState {
    const roles = rolesFromToken(token);
    return {
      player,
      userId: userIdFromToken(token),
      roles,
      isLoading: false,
      isAuthenticated: true,
      isAdmin: roles.includes('Admin'),
      isOrganizer: roles.includes('Organizer') || roles.includes('Admin'),
    };
  }

  async function restoreSession() {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      const playerJson = await SecureStore.getItemAsync('player');
      if (token && playerJson) {
        setState(authedState(JSON.parse(playerJson), token));
      } else {
        setState({ player: null, userId: null, roles: [], isLoading: false, isAuthenticated: false, isAdmin: false, isOrganizer: false });
      }
    } catch {
      setState({ player: null, userId: null, roles: [], isLoading: false, isAuthenticated: false, isAdmin: false, isOrganizer: false });
    }
  }

  async function login(email: string, password: string) {
    const { data } = await authApi.login(email, password);
    await SecureStore.setItemAsync('accessToken', data.accessToken);
    await SecureStore.setItemAsync('refreshToken', data.refreshToken);
    await SecureStore.setItemAsync('player', JSON.stringify(data.player));
    setState(authedState(data.player, data.accessToken));
  }

  async function logout() {
    try { await authApi.logout(); } catch {}
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('player');
    setState({ player: null, userId: null, roles: [], isLoading: false, isAuthenticated: false, isAdmin: false, isOrganizer: false });
  }

  // Memoized so consumers can include this in useEffect/useCallback deps
  // without re-firing on every AuthProvider render. (Without this, the
  // dashboard's useFocusEffect → load → updatePlayer cycle loops forever.)
  const updatePlayer = useCallback((player: Player) => {
    setState((s) => ({ ...s, player }));
    SecureStore.setItemAsync('player', JSON.stringify(player));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updatePlayer }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
