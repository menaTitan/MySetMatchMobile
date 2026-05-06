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

export const adminApi = {
  stats: () => api.get<AdminStats>('/admin/stats'),

  users: (params?: { search?: string; role?: string; page?: number; pageSize?: number }) =>
    api.get<{ total: number; page: number; pageSize: number; items: AdminUser[] }>('/admin/users', { params }),

  toggleRole: (userId: string, role: 'Admin' | 'Organizer' | 'Player', assign: boolean) =>
    api.post<{ roles: string[] }>(`/admin/users/${userId}/role`, { role, assign }),

  suspend: (userId: string, durationHours?: number, reason?: string) =>
    api.post<{ suspended: boolean; until?: string }>(`/admin/users/${userId}/suspend`, { durationHours, reason }),

  payments: (params?: { status?: string; page?: number; pageSize?: number }) =>
    api.get<{ total: number; page: number; pageSize: number; items: AdminPayment[] }>('/admin/payments', { params }),

  refund: (paymentId: string, reason: string, amount?: number) =>
    api.post(`/admin/payments/${paymentId}/refund`, { reason, amount }),
};
