import api from './client';

export const pushApi = {
  register: (data: { token: string; platform: 'ios' | 'android' | 'web' | 'unknown'; deviceName?: string }) =>
    api.post('/push-tokens', data),
  unregister: (token: string) =>
    api.delete('/push-tokens', { data: { token } }),
};
