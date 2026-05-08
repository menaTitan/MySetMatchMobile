import api from './client';
import type { Dashboard, MatchSummary, Player, SportRating } from '../types';

export interface EquipmentItem {
  /** Human label — e.g. "Blade", "Forehand Rubber", "Racket". */
  label: string;
  brand?: string;
  model?: string;
  /** Free-text fallback when brand/model aren't separated. */
  description?: string;
  sportName?: string;
}

export interface PublicPlayerProfile {
  player: Player;
  displayRating: number;
  globalRank: number;
  countryRank: number;
  cityRank: number;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  sportRatings: SportRating[];
  recentMatches: MatchSummary[];
  /** Optional gear list — shape may be an array of items or a flat object dict. */
  equipment?: EquipmentItem[] | Record<string, unknown>;
}

export interface RatingHistoryPoint { date: string; rating: number; delta: number; }

export interface HeadToHead {
  playerId: string;
  opponentId: string;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  recentMatches: {
    id: string; date?: string; tournamentName?: string; sportName?: string;
    myWin: boolean; mySets: number; oppSets: number;
  }[];
}

export interface MatchHistoryResponse {
  total: number;
  page: number;
  pageSize: number;
  items: MatchSummary[];
}

export const playerApi = {
  me: () => api.get<Player>('/players/me'),
  dashboard: (sportId?: string) =>
    api.get<Dashboard>('/players/me/dashboard', { params: sportId ? { sportId } : {} }),
  getProfile: (id: string, sportId?: string) =>
    api.get<PublicPlayerProfile>(`/players/${id}`, { params: sportId ? { sportId } : {} }),
  ratingHistory: (id: string, days = 180) =>
    api.get<{ playerId: string; points: RatingHistoryPoint[] }>(`/players/${id}/rating-history`, { params: { days } }),
  headToHead: (id: string, opponentId: string) =>
    api.get<HeadToHead>(`/players/${id}/head-to-head/${opponentId}`),
  matches: (playerId: string, params?: { skip?: number; take?: number; sportId?: string }) =>
    api.get<MatchSummary[]>(`/players/${playerId}/matches`, { params }),
  matchHistory: (playerId: string, params?: { page?: number; pageSize?: number; sportId?: string }) =>
    api.get<MatchHistoryResponse>(`/players/${playerId}/match-history`, { params }),
  updateMe: (data: {
    name?: string;
    clubName?: string;
    handedness?: string;
    playStyle?: string;
    countryId?: string;
    cityId?: string;
  }) => api.patch<Player>('/players/me', data),
  uploadPhoto: (uri: string) => {
    const form = new FormData();
    const ext = uri.split('.').pop() || 'jpg';
    form.append('photo', {
      uri,
      name: `profile.${ext}`,
      type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
    } as any);
    return api.post<{ profilePhotoUrl: string }>('/players/me/photo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
