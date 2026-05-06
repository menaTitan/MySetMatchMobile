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
};
