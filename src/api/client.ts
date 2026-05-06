import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../config/env';
import { emitToast } from '../components/ui/Toast';

export { API_BASE_URL };

const api: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT on every request
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401, surface user-facing errors via toast on other failures.
// Opt-out of the toast for a specific request by setting `config.silent = true`,
// or by calling an /auth/* endpoint (screens there show inline errors).
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config ?? {};
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        const res = await axios.post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = res.data;
        await SecureStore.setItemAsync('accessToken', accessToken);
        await SecureStore.setItemAsync('refreshToken', newRefresh);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
      }
    }

    const url: string = original.url ?? '';
    const silent = original?.silent === true;
    const isAuthRoute = url.startsWith('/auth/') || url.startsWith('auth/');
    if (!silent && !isAuthRoute) {
      const msg = extractErrorMessage(error);
      if (msg) emitToast(msg, 'error');
    }
    return Promise.reject(error);
  }
);

function extractErrorMessage(error: any): string | null {
  if (!error) return null;
  if (error.code === 'ERR_NETWORK') return "Can't reach the server. Check your connection.";
  if (error.code === 'ECONNABORTED') return 'Request timed out. Please try again.';
  const data = error.response?.data;
  if (typeof data === 'string') return data;
  if (data?.message) return String(data.message);
  if (Array.isArray(data?.errors) && data.errors.length) return String(data.errors[0]);
  const status = error.response?.status;
  if (status === 401) return 'Please sign in again.';
  if (status === 403) return "You don't have access to this.";
  if (status === 404) return 'Not found.';
  if (status && status >= 500) return 'Server error. Please try again.';
  return null;
}

export default api;
