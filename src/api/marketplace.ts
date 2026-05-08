import api from './client';
import type { MarketplaceListing, MarketplaceListingsResponse } from '../types';

export interface UpdateListingPayload {
  title?: string;
  description?: string;
  price?: number;
  category?: string;
  condition?: string;
  brand?: string;
  model?: string;
  imageUrls?: string[];
}

export const marketplaceApi = {
  list: (params?: {
    search?: string; category?: string; condition?: string;
    maxPrice?: number; sortBy?: string; page?: number;
  }) => api.get<MarketplaceListingsResponse>('/marketplace', { params }),
  myListings: (params?: { status?: 'active' | 'sold' | 'all'; page?: number }) =>
    api.get<MarketplaceListingsResponse>('/marketplace/mine', { params }),
  detail: (id: string) => api.get<MarketplaceListing>(`/marketplace/${id}`),
  create: (data: {
    title: string; description: string; price: number;
    category: string; condition: string;
    imageUrl?: string; imageUrls?: string[];
    brand?: string; model?: string;
  }) => api.post<MarketplaceListing>('/marketplace', data),
  update: (id: string, data: UpdateListingPayload) =>
    api.put<MarketplaceListing>(`/marketplace/${id}`, data),
  delete: (id: string) => api.delete(`/marketplace/${id}`),
  markSold: (id: string) => api.post(`/marketplace/${id}/sold`),
  relist: (id: string) => api.post(`/marketplace/${id}/relist`),
  uploadPhotos: (uris: string[]) => {
    const form = new FormData();
    uris.forEach((uri, i) => {
      const ext = uri.split('.').pop() || 'jpg';
      form.append('photos', {
        uri,
        name: `photo_${i}.${ext}`,
        type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
      } as any);
    });
    return api.post<{ urls: string[] }>('/marketplace/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
  },
};
