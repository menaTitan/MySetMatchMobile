import api from './client';
import type { BracketRound, MatchDetail } from '../types';

export const matchesApi = {
  my: (params?: { sportId?: string; status?: string }) =>
    api.get<MatchDetail[]>('/matches/my', { params }),
  get: (id: string) => api.get<MatchDetail>(`/matches/${id}`),
  submitScore: (
    id: string,
    sets: { setNumber: number; player1Score: number; player2Score: number }[],
  ) =>
    api.post<{ completed: boolean; player1Sets: number; player2Sets: number }>(
      `/matches/${id}/score`,
      { sets },
    ),
  brackets: (tournamentId: string) =>
    api.get<BracketRound[]>(`/tournaments/${tournamentId}/brackets`),
  live: (params?: { sportId?: string; tournamentId?: string }) =>
    api.get<MatchDetail[]>('/matches/live', { params }),
};
