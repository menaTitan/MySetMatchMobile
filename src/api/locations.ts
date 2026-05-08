import api from './client';

export const locationsApi = {
  countries: () => api.get<{ id: string; name: string; code?: string }[]>('/locations/countries'),
  regions: (countryId: string) =>
    api.get<{ id: string; name: string }[]>(`/locations/regions/${countryId}`),
  cities: (regionOrCountryId: string) =>
    api.get<{ id: string; name: string }[]>(`/locations/cities/${regionOrCountryId}`),
};
