import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sportsApi } from '../api';
import type { Sport } from '../types';
import { getThemeForSlug, SportTheme, DEFAULT_THEME } from '../theme';

interface SportContextType {
  sports: Sport[];
  currentSport: Sport | null;
  setSport: (sport: Sport | null) => void;
  theme: SportTheme;
  isLoading: boolean;
}

const SportContext = createContext<SportContextType | null>(null);

export function SportProvider({ children }: { children: React.ReactNode }) {
  const [sports, setSports] = useState<Sport[]>([]);
  const [currentSport, setCurrentSport] = useState<Sport | null>(null);
  const [theme, setTheme] = useState<SportTheme>(DEFAULT_THEME);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSports();
  }, []);

  async function loadSports() {
    try {
      const [{ data }, savedId] = await Promise.all([
        sportsApi.list(),
        AsyncStorage.getItem('currentSportId'),
      ]);
      setSports(data);
      const found = savedId ? data.find((s) => s.id === savedId) : null;
      const initial = found ?? data[0] ?? null;
      setCurrentSport(initial);
      setTheme(getThemeForSlug(initial?.slug));
    } catch {
      // offline
    } finally {
      setIsLoading(false);
    }
  }

  async function setSport(sport: Sport | null) {
    setCurrentSport(sport);
    setTheme(getThemeForSlug(sport?.slug));
    if (sport) await AsyncStorage.setItem('currentSportId', sport.id);
    else await AsyncStorage.removeItem('currentSportId');
  }

  return (
    <SportContext.Provider value={{ sports, currentSport, setSport, theme, isLoading }}>
      {children}
    </SportContext.Provider>
  );
}

export function useSport() {
  const ctx = useContext(SportContext);
  if (!ctx) throw new Error('useSport must be inside SportProvider');
  return ctx;
}
