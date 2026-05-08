import api from './client';
import type { BracketRound, MatchDetail } from '../types';

export interface PlayerForMatchRow {
  playerId: string;
  name: string;
  globalRating: number;
  hasPlayed?: boolean;
}

export interface LiveGameRow {
  id: string;
  player1Name: string;
  player2Name: string;
  player1Sets: number[];
  player2Sets: number[];
  currentSet: number;
  status: string;
  tournamentId?: string;
  tournamentName?: string;
}

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

  updateLiveScore: (
    id: string,
    setNumber: number,
    player1Score: number,
    player2Score: number,
    finishSet = false,
    finishMatch = false,
  ) =>
    api.post<{ completed: boolean; player1Sets: number; player2Sets: number }>(
      `/matches/${id}/live-score`,
      { setNumber, player1Score, player2Score, finishSet, finishMatch },
    ),

  brackets: (tournamentId: string) =>
    api.get<BracketRound[]>(`/tournaments/${tournamentId}/brackets`),
  live: (params?: { sportId?: string; tournamentId?: string }) =>
    api.get<MatchDetail[]>('/matches/live', { params }),

  createKnockout: (data: {
    player1Id: string;
    player2Id: string;
    round: string;
    tournamentId: string;
  }) => api.post<{ matchId: string }>('/matches/knockout', data),
  updateKnockoutPlayers: (matchId: string, data: {
    player1Id: string; player2Id: string; round: string;
  }) => api.put(`/matches/${matchId}/knockout-players`, data),
  createGroupMatch: (data: {
    player1Id: string; player2Id: string;
    skillLevel: string; groupLetter: string;
    tournamentId: string;
  }) => api.post<{ matchId: string }>('/matches/group', data),
  resyncBracket: (data: { tournamentId: string }) =>
    api.post('/matches/resync-bracket', data),

  playersForMatch: (params: {
    stage: string; group?: string; round?: string; tournamentId: string;
  }) => api.get<PlayerForMatchRow[]>('/matches/players-for-match', { params }),
  checkPlayersHavePlayed: (player1Id: string, player2Id: string, matchId: string) =>
    api.get<{ havePlayed: boolean }>('/matches/players-have-played', {
      params: { player1Id, player2Id, matchId },
    }),

  startNewGame: (data: {
    player1Id: string; player2Id: string;
    sportId: string;
    tournamentId?: string;
  }) => api.post<{ liveGameId: string }>('/matches/live-games', data),
  liveGames: (tournamentId?: string) =>
    api.get<LiveGameRow[]>('/matches/live-games', { params: { tournamentId } }),
  registerAsLiveGame: (matchId: string) =>
    api.post(`/matches/${matchId}/register-live`),
  broadcastLiveScore: (data: {
    matchId: string;
    player1Id: string;
    player2Id: string;
    stage: string;
    group: string;
    round: string;
    player1Scores: number[];
    player2Scores: number[];
  }) => api.post('/matches/broadcast-live-score', data),
};
