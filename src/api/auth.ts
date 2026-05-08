import api from './client';
import type { AuthResponse } from '../types';

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),
  register: (data: {
    email: string; password: string; name: string;
    countryId: string; cityId: string;
  }) => api.post<AuthResponse>('/auth/register', data),
  refresh: (refreshToken: string) =>
    api.post<AuthResponse>('/auth/refresh', { refreshToken }),
  logout: () => api.post('/auth/logout'),

  forgotPassword: (email: string) =>
    api.post<{ sent: boolean }>('/auth/forgot-password', { email }),
  resetPassword: (data: { email: string; token: string; password: string }) =>
    api.post<{ reset: boolean }>('/auth/reset-password', data),
  confirmEmail: (userId: string, token: string) =>
    api.post<{ confirmed: boolean }>('/auth/confirm-email', { userId, token }),
  checkEmailAvailability: (email: string) =>
    api.get<{ available: boolean }>('/auth/check-email', { params: { email } }),
  createProfile: (data: {
    name: string; countryId: string; cityId: string;
    skillLevel?: string; phoneNumber?: string;
  }) => api.post<{ playerId: string }>('/auth/create-profile', data),
};
