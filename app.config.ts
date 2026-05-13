import type { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * Dynamic Expo config. The API base URL is selected by APP_ENV:
 *   - development  → local LAN dev server (default)
 *   - staging      → staging Azure slot (override via API_BASE_URL)
 *   - production   → live Azure deployment
 *
 * Examples:
 *   npm start                                       # development
 *   APP_ENV=production npm start                    # builds against the Azure URL below
 *   API_BASE_URL=https://example.com npm start      # one-off override (any profile)
 */
const API_URLS_BY_ENV: Record<string, string> = {
  development: 'http://192.168.1.219:5195',
  staging:     'https://mysetmatchweb-h9gva0aagrc5fjh6.centralus-01.azurewebsites.net',
  production:  'https://mysetmatchweb-h9gva0aagrc5fjh6.centralus-01.azurewebsites.net',
};

export default ({ config }: ConfigContext): ExpoConfig => {
  const profile = process.env.APP_ENV ?? 'development';
  const apiBaseUrl =
    process.env.API_BASE_URL ??
    API_URLS_BY_ENV[profile] ??
    API_URLS_BY_ENV.development;

  return {
    ...config,
    name: 'MySetMatch',
    slug: 'MySetMatchMobile',
    version: '1.0.6',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: false,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#1A365D',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.mysetmatch.app',
      infoPlist: {
        // Declares the app uses only standard/exempt encryption so App Store
        // submission skips the annual export-compliance prompt.
        ITSAppUsesNonExemptEncryption: false,
        // Apple Guideline 5.1.1(ii) requires purpose strings to clearly
        // describe each use of the resource and give concrete examples.
        NSPhotoLibraryUsageDescription:
          'MySetMatch needs access to your photo library so you can pick a picture to set as your profile photo, attach an image to a community post, or showcase paddles and other equipment you list in the marketplace.',
      },
    },
    android: {
      package: 'com.mysetmatch.app',
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#1A365D',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      // Make the focused input slide above the keyboard on Android
      // (default "resize" shrinks the viewport and hides fields).
      softwareKeyboardLayoutMode: 'pan',
    },
    web: { favicon: './assets/favicon.png' },
    plugins: ['expo-font', 'expo-secure-store', 'expo-web-browser', '@react-native-community/datetimepicker'],
    // Injected into the running app via `Constants.expoConfig.extra`.
    extra: {
      apiBaseUrl,
      appEnv: profile,
      eas: {
        projectId: '379855ab-bc56-4a02-9be3-9fbfb558c5eb',
      },
    },
  };
};
