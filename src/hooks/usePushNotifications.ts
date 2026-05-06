import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../context/AuthContext';
import { pushApi } from '../api';

/**
 * Registers the device's Expo push token with the backend whenever the user
 * authenticates. Safe to call once near the root; it short-circuits when
 * running in an environment without the permission or the native module.
 */
export function usePushNotifications() {
  const { isAuthenticated, player } = useAuth();
  const registered = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    (async () => {
      try {
        if (!Device.isDevice) return; // emulators can't receive push anyway
        const settings = await Notifications.getPermissionsAsync();
        let status = settings.status;
        if (status !== 'granted') {
          const req = await Notifications.requestPermissionsAsync();
          status = req.status;
        }
        if (status !== 'granted') return;

        // Some projects require a projectId — let expo-notifications resolve it.
        const tokenResponse = await Notifications.getExpoPushTokenAsync();
        const token = tokenResponse.data;
        if (cancelled || !token || token === registered.current) return;

        await pushApi.register({
          token,
          platform: (Platform.OS === 'ios' || Platform.OS === 'android') ? Platform.OS : 'unknown',
          deviceName: Device.modelName ?? undefined,
        });
        registered.current = token;
      } catch {
        // silent — push is best-effort
      }
    })();

    return () => { cancelled = true; };
  }, [isAuthenticated, player?.id]);
}
