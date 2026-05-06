import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Generic fetch helper shared by list/detail screens.
 * - Runs `fetcher` on mount and each time the screen re-focuses.
 * - Exposes `loading`, `refreshing`, `error`, `data`, `refresh()`, `reload()`.
 *
 * Screens can show pull-to-refresh, an error view, and a loading view using the same shape.
 */
export function useFetchData<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const run = useCallback(async (refreshMode: boolean) => {
    if (!refreshMode) setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      if (mounted.current) setData(result);
    } catch (e) {
      if (mounted.current) setError(e);
    } finally {
      if (mounted.current) { setLoading(false); setRefreshing(false); }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useFocusEffect(useCallback(() => { run(false); }, [run]));

  const refresh = useCallback(() => { setRefreshing(true); run(true); }, [run]);
  const reload  = useCallback(() => { run(false); }, [run]);

  return { data, loading, refreshing, error, refresh, reload, setData } as const;
}
