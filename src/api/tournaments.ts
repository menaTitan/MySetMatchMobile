import api from './client';
import type { TournamentDetail, TournamentSummary } from '../types';

export interface CreateTournamentPayload {
  name: string;
  description?: string;
  venue?: string;
  startDate: string;   // ISO
  endDate: string;     // ISO
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
  city?: string;
  country?: string;
  globalRating: number;
  status: 'Pending' | 'Confirmed' | 'Withdrawn' | string;
  registrationDate: string;
  paymentCompleted: boolean;
}

export const tournamentsApi = {
  list: (params?: { sportId?: string; status?: string; page?: number }) =>
    api.get<{ total: number; items: TournamentSummary[] }>('/tournaments', { params }),
  detail: (id: string) => api.get<TournamentDetail>(`/tournaments/${id}`),
  register: (id: string) => api.post(`/tournaments/${id}/register`),
  unregister: (id: string) => api.delete(`/tournaments/${id}/register`),
  create: (data: CreateTournamentPayload) =>
    api.post<{ id: string }>('/tournaments', data),
  registrations: (id: string) =>
    api.get<RegistrationRow[]>(`/tournaments/${id}/registrations`),
  approveRegistration: (tournamentId: string, registrationId: string) =>
    api.post(`/tournaments/${tournamentId}/registrations/${registrationId}/approve`),
  rejectRegistration: (tournamentId: string, registrationId: string) =>
    api.post(`/tournaments/${tournamentId}/registrations/${registrationId}/reject`),
};
