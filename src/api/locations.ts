import api from './client';

export const locationsApi = {
  countries: () => api.get<{ id: string; name: string }[]>('/locations/countries'),
  cities: (countryId: string) =>
    api.get<{ id: string; name: string }[]>(`/locations/cities/${countryId}`),
};
