import api from './client';

export const contactApi = {
  send: (data: { name: string; email: string; subject?: string; message: string }) =>
    api.post<{ sent: boolean }>('/contact', data),
};
