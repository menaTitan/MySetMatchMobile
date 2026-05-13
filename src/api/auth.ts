import api from './client';
import type { AuthResponse } from '../types';

/** Response from the new two-step register: account is created but email
 *  is unconfirmed. Client must call verifyEmail next. */
export interface RegisterResponse {
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
};
