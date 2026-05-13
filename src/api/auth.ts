import api from './client';
import type { AuthResponse } from '../types';

/**
 * Register response. The backend issues auth tokens immediately so the user
 * isn't blocked on email delivery — verification is a follow-up step the
 * user can complete from VerifyEmail or skip and verify later from Profile.
 */
export interface RegisterResponse extends AuthResponse {
  userId: string;
  needsVerification: true;
  resent?: boolean;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),
  /**
   * Step 1 of the new flow: create the auth user (email unconfirmed) and
   * email a 6-digit verification code. The response carries the userId
   * which the client passes to verifyEmail.
   */
  register: (data: { email: string; password: string; name: string }) =>
    api.post<RegisterResponse>('/auth/register', data),
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
  }) => api.post<{ playerId: string }>('/auth/create-profile', data),
  /**
   * Permanently delete the signed-in user's account. Backend anonymizes
   * the Player record (kept for opponent match history), scrubs derived
   * state, then removes the Identity user.
   */
  deleteAccount: (password: string) =>
    api.delete<{ deleted: boolean }>('/auth/me', { data: { password } }),
};
