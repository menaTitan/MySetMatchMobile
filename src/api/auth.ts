import api from './client';
import type { AuthResponse } from '../types';

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),
  /**
   * Create the auth user and receive tokens directly. Email verification
   * is temporarily disabled server-side; the client goes straight to
   * CreateProfile after a successful register.
   */
  register: (data: { email: string; password: string; name: string }) =>
    api.post<AuthResponse>('/auth/register', data),
  /** Step 2: confirm the code emailed during register. Returns auth tokens. */
  verifyEmail: (data: { userId: string; code: string }) =>
    api.post<AuthResponse>('/auth/verify-email', data),
  resendVerification: (userId: string) =>
    api.post<{ sent?: boolean; alreadyVerified?: boolean }>('/auth/resend-verification', { userId }),
  refresh: (refreshToken: string) =>
    api.post<AuthResponse>('/auth/refresh', { refreshToken }),
  logout: () => api.post('/auth/logout'),

  forgotPassword: (email: string) =>
    api.post<{ sent: boolean }>('/auth/forgot-password', { email }),
  resetPassword: (data: { email: string; token: string; password: string }) =>
    api.post<{ reset: boolean }>('/auth/reset-password', data),
  checkEmailAvailability: (email: string) =>
    api.get<{ available: boolean }>('/auth/check-email', { params: { email } }),
  /** Legacy link-based confirmation kept for any deep links still in flight. */
  confirmEmail: (userId: string, token: string) =>
    api.post<{ confirmed: boolean }>('/auth/confirm-email', { userId, token }),
  /** Step 3: create the Player row (country/city/etc.) for the just-verified user. */
  createProfile: (data: {
    name: string; countryId: string; cityId: string;
    skillLevel?: string; phoneNumber?: string;
    /** Sports the user is interested in. Each creates a PlayerSport row. */
    sportIds?: string[];
  }) => api.post<{ playerId: string }>('/auth/create-profile', data),
  /**
   * Permanently delete the signed-in user's account. Backend anonymizes
   * the Player record (kept for opponent match history), scrubs derived
   * state, then removes the Identity user.
   */
  deleteAccount: (password: string) =>
    api.delete<{ deleted: boolean }>('/auth/me', { data: { password } }),
};
