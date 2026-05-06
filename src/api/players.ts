import api from './client';
import type { Dashboard, MatchSummary, Player, SportRating } from '../types';

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
