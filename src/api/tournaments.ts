import api from './client';
import type { TournamentDetail, TournamentSummary } from '../types';

export interface CreateTournamentPayload {
  name: string;
  description?: string;
  venue?: string;
  startDate: string;
  endDate: string;
  registrationDeadline?: string;
  type?: 'Local' | 'Regional' | 'National' | 'International';
  format?: 'SingleElimination' | 'RoundRobin' | 'Mixed';
  sportId: string;
  countryId?: string;
  cityId?: string;
  maxParticipants?: number;
  ratingFloor?: number;
  ratingCeiling?: number;
  entryFee?: number;
  currency?: string;
  isDoubles?: boolean;
}

export interface RegistrationRow {
  registrationId: string;
  playerId: string;
  playerName: string;
  profilePhotoUrl?: string;
  city?: string;
  country?: string;
  globalRating: number;
  status: 'Pending' | 'Confirmed' | 'Withdrawn' | string;
  registrationDate: string;
  paymentCompleted: boolean;
}

export interface PlayerSearchRow {
  playerId: string;
  name: string;
  city?: string;
  country?: string;
  globalRating: number;
  profilePhotoUrl?: string;
}

export interface TournamentPaymentRow {
  paymentId: string;
  playerId: string;
  playerName: string;
  profilePhotoUrl?: string;
  amount: number;
  currency: string;
  status: string;
  refundedAmount?: number;
  refundReason?: string;
  createdAt: string;
  completedAt?: string;
}

export interface TournamentWinner {
  rank: number;
  playerId: string;
  playerName: string;
  prizeAmount?: number;
}

export const tournamentsApi = {
  list: (params?: { sportId?: string; status?: string; page?: number; location?: string; type?: string }) =>
    api.get<{ total: number; items: TournamentSummary[] }>('/tournaments', { params }),
  archive: (params?: { sportId?: string; location?: string; page?: number; pageSize?: number }) =>
    api.get<{ total: number; items: TournamentSummary[] }>('/tournaments/archive', { params }),
  detail: (id: string) => api.get<TournamentDetail>(`/tournaments/${id}`),
  search: (q: string) =>
    api.get<TournamentSummary[]>('/tournaments/search', { params: { q } }),

  register: (id: string) => api.post(`/tournaments/${id}/register`),
  unregister: (id: string) => api.delete(`/tournaments/${id}/register`),
  withdraw: (id: string) => api.post(`/tournaments/${id}/withdraw`),

  create: (data: CreateTournamentPayload) =>
    api.post<{ id: string }>('/tournaments', data),
  update: (id: string, data: Partial<CreateTournamentPayload>) =>
    api.put(`/tournaments/${id}`, data),
  delete: (id: string) => api.delete(`/tournaments/${id}`),

  start: (id: string) => api.post(`/tournaments/${id}/start`),
  cancel: (id: string) => api.post(`/tournaments/${id}/cancel`),
  finish: (id: string) => api.post(`/tournaments/${id}/finish`),
  extendDeadline: (id: string, newDeadline: string) =>
    api.post(`/tournaments/${id}/extend-deadline`, { newDeadline }),

  registrations: (id: string) =>
    api.get<RegistrationRow[]>(`/tournaments/${id}/registrations`),
  approveRegistration: (tournamentId: string, registrationId: string) =>
    api.post(`/tournaments/${tournamentId}/registrations/${registrationId}/approve`),
  rejectRegistration: (tournamentId: string, registrationId: string) =>
    api.post(`/tournaments/${tournamentId}/registrations/${registrationId}/reject`),
  removeRegistration: (registrationId: string) =>
    api.delete(`/tournaments/registrations/${registrationId}`),

  searchPlayers: (query: string, excludeTournamentId?: string) =>
    api.get<PlayerSearchRow[]>('/tournaments/players/search', {
      params: { query, excludeTournamentId },
    }),
  searchPartners: (query: string, tournamentId: string) =>
    api.get<PlayerSearchRow[]>('/tournaments/partners/search', {
      params: { query, tournamentId },
    }),
  addPlayer: (tournamentId: string, playerId: string) =>
    api.post(`/tournaments/${tournamentId}/add-player`, { playerId }),
  removePlayer: (tournamentId: string, playerId: string) =>
    api.delete(`/tournaments/${tournamentId}/players/${playerId}`),

  payments: (id: string) =>
    api.get<TournamentPaymentRow[]>(`/tournaments/${id}/payments`),
  processRefund: (paymentId: string, tournamentId: string, reason: string) =>
    api.post(`/tournaments/${tournamentId}/payments/${paymentId}/refund`, { reason }),

  generateGroups: (id: string) =>
    api.post(`/tournaments/${id}/generate-groups`),
  generateKnockout: (id: string) =>
    api.post(`/tournaments/${id}/generate-knockout`),
  regenerateKnockout: (id: string) =>
    api.post(`/tournaments/${id}/regenerate-knockout`),
  /**
   * Full re-shuffle of the bracket — clears matches/groups, optionally shuffles
   * the player order, then regenerates the group stage with `numberOfGroups`.
   * Mirrors the website's resync-bracket modal.
   */
  resyncShuffleBracket: (id: string, opts: { shuffleGroups?: boolean; numberOfGroups?: number | null }) =>
    api.post<{
      success: boolean; playersProcessed: number;
      matchesCreated: number; groupsCreated: number; shuffled: boolean;
    }>(`/tournaments/${id}/resync-shuffle-bracket`, {
      shuffleGroups: !!opts.shuffleGroups,
      numberOfGroups: opts.numberOfGroups ?? null,
    }),
  sendResultsEmail: (id: string) =>
    api.post(`/tournaments/${id}/send-results-email`),
  winners: (id: string) =>
    api.get<TournamentWinner[]>(`/tournaments/${id}/winners`),

  participants: (id: string) =>
    api.get<RegistrationRow[]>(`/tournaments/${id}/participants`),

  registrationDetail: (registrationId: string) =>
    api.get<RegistrationRow & { firstName?: string; lastName?: string; phone?: string; email?: string }>(
      `/tournaments/registrations/${registrationId}`,
    ),
  updateRegistration: (registrationId: string, data: Partial<RegistrationRow>) =>
    api.put(`/tournaments/registrations/${registrationId}`, data),
  deleteParticipant: (registrationId: string) =>
    api.delete(`/tournaments/registrations/${registrationId}/participant`),

  resultsPdfUrl: (id: string) => `/tournaments/${id}/results.pdf`,

  publicRegister: (data: {
    tournamentId?: string;
    firstName: string; lastName: string;
    email: string; phone?: string;
    countryId?: string; cityId?: string;
    skillLevel?: string; ratingEstimate?: number;
  }) => api.post<{ registrationId: string }>('/tournaments/public-register', data),
};
