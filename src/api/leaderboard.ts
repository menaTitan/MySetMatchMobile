import api from './client';
import type { LeaderboardEntry } from '../types';

export const leaderboardApi = {
  get: (params?: { sportId?: string; scope?: string; locationId?: string; count?: number }) =>
    api.get<LeaderboardEntry[]>('/leaderboard', { params }),
};
