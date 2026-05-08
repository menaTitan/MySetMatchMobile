import api from './client';

export interface AdminStats {
  totalUsers: number;
  totalPlayers: number;
  totalTournaments: number;
  activeTournaments: number;
  totalMatches: number;
  completedMatches: number;
  totalRevenue: number;
}

export interface AdminUser {
  id: string;
  userName?: string;
  email?: string;
  fullName?: string;
  playerId?: string;
  playerName?: string;
  profilePhotoUrl?: string;
  roles: string[];
  isSuspended: boolean;
  lockoutEnd?: string;
  createdDate: string;
  lastLoginDate?: string;
}

export interface AdminUserDetail extends AdminUser {
  phoneNumber?: string;
  city?: string;
  country?: string;
  countryId?: string;
  cityId?: string;
  emailConfirmed?: boolean;
  globalRating?: number;
  isActive?: boolean;
}

export interface AdminPayment {
  paymentId: string;
  tournamentId: string;
  tournamentName?: string;
  playerId: string;
  playerName?: string;
  amount: number;
  currency: string;
  status: 'Pending' | 'Processing' | 'Succeeded' | 'Failed' | 'Canceled' | 'Refunded' | 'PartiallyRefunded';
  refundedAmount?: number;
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface AnalyticsResponse {
  days: number;
  newUsersByDay: { date: string; count: number }[];
  newTournamentsByDay: { date: string; count: number }[];
  matchesByDay: { date: string; count: number }[];
  revenueByDay: { date: string; amount: number }[];
  totalNewUsers: number;
  totalNewTournaments: number;
  totalMatches: number;
  totalRevenue: number;
}

export interface AdminTournamentRow {
  id: string;
  name: string;
  organizerId: string;
  organizerName?: string;
  status: string;
  startDate: string;
  registeredCount: number;
  maxPlayers?: number;
  sportName?: string;
}

export interface CountryRow { id: string; name: string; code?: string }
export interface RegionRow { id: string; name: string; countryId: string }
export interface CityRow { id: string; name: string; regionId: string }

export const adminApi = {
  stats: () => api.get<AdminStats>('/admin/stats'),

  users: (params?: { search?: string; role?: string; page?: number; pageSize?: number }) =>
    api.get<{ total: number; page: number; pageSize: number; items: AdminUser[] }>('/admin/users', { params }),

  userDetail: (userId: string) =>
    api.get<AdminUserDetail>(`/admin/users/${userId}`),

  updateUser: (userId: string, data: Partial<AdminUserDetail> & { password?: string }) =>
    api.put(`/admin/users/${userId}`, data),

  deleteUser: (userId: string) =>
    api.delete(`/admin/users/${userId}`),

  toggleRole: (userId: string, role: 'Admin' | 'Organizer' | 'Player', assign: boolean) =>
    api.post<{ roles: string[] }>(`/admin/users/${userId}/role`, { role, assign }),

  suspend: (userId: string, durationHours?: number, reason?: string) =>
    api.post<{ suspended: boolean; until?: string }>(`/admin/users/${userId}/suspend`, { durationHours, reason }),

  payments: (params?: { status?: string; tournamentId?: string; startDate?: string; endDate?: string; page?: number; pageSize?: number }) =>
    api.get<{ total: number; page: number; pageSize: number; items: AdminPayment[] }>('/admin/payments', { params }),

  refund: (paymentId: string, reason: string, amount?: number) =>
    api.post(`/admin/payments/${paymentId}/refund`, { reason, amount }),

  analytics: (days = 30) =>
    api.get<AnalyticsResponse>('/admin/analytics', { params: { days } }),

  tournaments: () =>
    api.get<AdminTournamentRow[]>('/admin/tournaments'),

  recalculateRatings: () =>
    api.post<{ updated: number }>('/admin/recalculate-ratings'),

  // Locations CRUD
  countries: () => api.get<CountryRow[]>('/admin/locations/countries'),
  addCountry: (name: string, code: string) =>
    api.post<CountryRow>('/admin/locations/countries', { name, code }),
  editCountry: (id: string, name: string, code: string) =>
    api.put(`/admin/locations/countries/${id}`, { name, code }),
  deleteCountry: (id: string) =>
    api.delete(`/admin/locations/countries/${id}`),

  regions: (countryId?: string) =>
    api.get<RegionRow[]>('/admin/locations/regions', { params: { countryId } }),
  addRegion: (name: string, countryId: string) =>
    api.post<RegionRow>('/admin/locations/regions', { name, countryId }),
  editRegion: (id: string, name: string, countryId: string) =>
    api.put(`/admin/locations/regions/${id}`, { name, countryId }),
  deleteRegion: (id: string) =>
    api.delete(`/admin/locations/regions/${id}`),

  cities: (regionId?: string) =>
    api.get<CityRow[]>('/admin/locations/cities', { params: { regionId } }),
  addCity: (name: string, regionId: string) =>
    api.post<CityRow>('/admin/locations/cities', { name, regionId }),
  editCity: (id: string, name: string, regionId: string) =>
    api.put(`/admin/locations/cities/${id}`, { name, regionId }),
  deleteCity: (id: string) =>
    api.delete(`/admin/locations/cities/${id}`),

  // Debug / QA tooling
  seedTestData: () => api.post<{ ok: boolean }>('/admin/debug/seed-test-data'),
  clearTestData: () => api.post<{ ok: boolean }>('/admin/debug/clear-test-data'),
  reloadAllData: () => api.post<{ ok: boolean }>('/admin/debug/reload-data'),
  runFullTournamentTest: () =>
    api.post<{ tournamentId: string; report: string }>('/admin/debug/run-full-tournament-test'),
  testReport: () => api.get<{ html: string }>('/admin/debug/test-report'),
  createTournamentWith15Players: () =>
    api.post<{ tournamentId: string }>('/admin/debug/create-15-player-tournament'),
  downloadBackup: (fileName: string) =>
    api.get<Blob>(`/admin/debug/backup/${fileName}`, { responseType: 'blob' }),
  saveJsonFile: (fileName: string, jsonContent: string) =>
    api.post('/admin/debug/save-json', { fileName, jsonContent }),
};
