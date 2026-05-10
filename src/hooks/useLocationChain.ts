import { useCallback, useEffect, useState } from 'react';
import { locationsApi } from '../api';

interface PickerItem { id: string; name: string; }

interface UseLocationChainOptions {
  /** Pre-fill the chain (e.g. when editing an existing profile/tournament). */
  initialCountryId?: string;
  initialRegionId?: string;
  initialCityId?: string;
  initialCountryName?: string;
  initialRegionName?: string;
  initialCityName?: string;
}

/**
 * Loads Country → Region → City dropdown options on demand.
 *
 * - Countries load on mount.
 * - When `countryId` changes, regions reload. Cities reset.
 * - When `regionId` changes, cities reload for that region. If the chosen
 *   country has no regions, cities load directly from the country instead.
 *
 * The caller owns selection state and just calls `setCountryId(id, name)`
 * etc. The hook exposes the loaded option lists and a `hasRegions` flag so
 * the form can hide the region picker when the country doesn't have any.
 */
export function useLocationChain(opts: UseLocationChainOptions = {}) {
  const [countries, setCountries] = useState<PickerItem[]>([]);
  const [regions, setRegions] = useState<PickerItem[]>([]);
  const [cities, setCities] = useState<PickerItem[]>([]);

  const [countryId, setCountryIdState] = useState(opts.initialCountryId ?? '');
  const [regionId, setRegionIdState] = useState(opts.initialRegionId ?? '');
  const [cityId, setCityIdState] = useState(opts.initialCityId ?? '');

  const [countryName, setCountryName] = useState(opts.initialCountryName ?? '');
  const [regionName, setRegionName] = useState(opts.initialRegionName ?? '');
  const [cityName, setCityName] = useState(opts.initialCityName ?? '');

  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // Load countries once on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await locationsApi.countries();
        if (!cancelled) setCountries(data);
      } catch {}
      finally {
        if (!cancelled) setLoadingCountries(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // When country changes, reload regions and reset city. Cities load lazily
  // once a region is picked (or directly from country if no regions exist).
  useEffect(() => {
    if (!countryId) {
      setRegions([]);
      setCities([]);
      return;
    }
    let cancelled = false;
    setLoadingRegions(true);
    (async () => {
      try {
        const { data } = await locationsApi.regions(countryId);
        if (cancelled) return;
        setRegions(data);
        // If the country has no regions, load cities for the country directly.
        if (data.length === 0) {
          setLoadingCities(true);
          try {
            const { data: c } = await locationsApi.cities(countryId);
            if (!cancelled) setCities(c);
          } finally {
            if (!cancelled) setLoadingCities(false);
          }
        } else {
          setCities([]);
        }
      } catch {}
      finally {
        if (!cancelled) setLoadingRegions(false);
      }
    })();
    return () => { cancelled = true; };
  }, [countryId]);

  // When region changes, load cities for it.
  useEffect(() => {
    if (!regionId) return;
    let cancelled = false;
    setLoadingCities(true);
    (async () => {
      try {
        const { data } = await locationsApi.cities(regionId);
        if (!cancelled) setCities(data);
      } catch {}
      finally {
        if (!cancelled) setLoadingCities(false);
      }
    })();
    return () => { cancelled = true; };
  }, [regionId]);

  // ── Setters that also update the cached display name and clear downstream ──

  const setCountry = useCallback((item: PickerItem | null) => {
    setCountryIdState(item?.id ?? '');
    setCountryName(item?.name ?? '');
    setRegionIdState('');
    setRegionName('');
    setCityIdState('');
    setCityName('');
  }, []);

  const setRegion = useCallback((item: PickerItem | null) => {
    setRegionIdState(item?.id ?? '');
    setRegionName(item?.name ?? '');
    setCityIdState('');
    setCityName('');
  }, []);

  const setCity = useCallback((item: PickerItem | null) => {
    setCityIdState(item?.id ?? '');
    setCityName(item?.name ?? '');
  }, []);

  return {
    countries,
    regions,
    cities,
    countryId,
    regionId,
    cityId,
    countryName,
    regionName,
    cityName,
    /** True when the currently-selected country has regions to choose from. */
    hasRegions: regions.length > 0,
    loadingCountries,
    loadingRegions,
    loadingCities,
    setCountry,
    setRegion,
    setCity,
  };
}
