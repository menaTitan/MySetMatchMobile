import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../context/AuthContext';
import { pushApi } from '../api';
import { navigate } from '../navigation/navigationRef';

// Show a banner + play a sound for pushes that arrive while the app is open.
// Set once at module load so it sticks across hook re-runs.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    // Older expo-notifications expected `shouldShowAlert`; new builds expect
    // `shouldShowBanner`/`shouldShowList`. Returning both is harmless.
    shouldShowAlert: true,
  } as any),
});

// Map a notification's `data` payload to an app route. The server can send
// any of these `type` values; unknown types are ignored.
function routeFor(data: Record<string, unknown> | undefined) {
  if (!data) return null;
  const type = String(data.type ?? data.kind ?? '').toLowerCase();
  switch (type) {
    case 'chat':
    case 'message':
      if (data.roomId) {
        return { stack: 'Community', screen: 'ChatRoom', params: { roomId: String(data.roomId), title: data.title ? String(data.title) : undefined } };
      }
      return null;
    case 'tournament':
    case 'tournament_update':
      if (data.tournamentId) {
        return { stack: 'Play', screen: 'TournamentDetail', params: { id: String(data.tournamentId) } };
      }
      return null;
    case 'match':
    case 'match_score':
      if (data.matchId) {
        return { stack: 'Play', screen: 'ScoreEntry', params: { matchId: String(data.matchId) } };
      }
      return null;
    case 'feed':
    case 'reaction':
    case 'comment':
      return { stack: 'Home', screen: 'HomeFeed' };
    case 'listing':
    case 'marketplace':
      if (data.listingId) {
        return { stack: 'Market', screen: 'ListingDetail', params: { id: String(data.listingId) } };
      }
      return null;
    default:
      return null;
  }
}

function handleTap(response: Notifications.NotificationResponse) {
  const data = response.notification.request.content.data as Record<string, unknown> | undefined;
  const route = routeFor(data);
  if (!route) return;
  navigate(route.stack, { screen: route.screen, params: route.params });
}

/**
 * Registers the device's Expo push token with the backend whenever the user
 * authenticates, sets the foreground handler, and routes notification taps.
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

  // Tap routing: cold-start (app launched from a notification) and warm taps.
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    (async () => {
      const initial = await Notifications.getLastNotificationResponseAsync();
      if (!cancelled && initial) handleTap(initial);
    })();
    const sub = Notifications.addNotificationResponseReceivedListener(handleTap);
    return () => { cancelled = true; sub.remove(); };
  }, [isAuthenticated]);
}
