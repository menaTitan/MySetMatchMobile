import Constants from 'expo-constants';

interface AppExtra {
  apiBaseUrl?: string;
  appEnv?: string;
}

const extra = (Constants.expoConfig?.extra ?? Constants.manifest?.extra ?? {}) as AppExtra;

/** Where all /api/* calls point. Configured in app.config.ts via env vars. */
export const API_BASE_URL =
  extra.apiBaseUrl ?? 'http://192.168.1.219:5195';

/** 'development' | 'staging' | 'production' (anything you set in APP_ENV) */
export const APP_ENV = extra.appEnv ?? 'development';

export const IS_DEV = APP_ENV === 'development';
