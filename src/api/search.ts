import api from './client';

export interface SearchResults {
  query: string;
  players: {
    id: string; name: string; clubName?: string; profilePhotoUrl?: string;
    country?: string; city?: string; globalRating: number;
  }[];
  tournaments: {
    id: string; name: string; startDate: string;
    city?: string; country?: string; sportName?: string;
  }[];
  groups: { id: string; name: string; memberCount: number; postCount: number }[];
  listings: { id: string; title: string; price: number; currency: string; imageUrl?: string }[];
}

export const searchApi = {
  search: (query: string, sportId?: string) =>
    api.get<SearchResults>('/search', { params: { q: query, sportId } }),
};
