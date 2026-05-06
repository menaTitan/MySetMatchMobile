import api from './client';
import type { Sport } from '../types';

export const sportsApi = {
  list: () => api.get<Sport[]>('/sports'),
};
