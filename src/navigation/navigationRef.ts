import { createNavigationContainerRef } from '@react-navigation/native';

// Top-level ref so non-screen code (push handlers, deep links) can navigate
// without prop-drilling. Plug this into <NavigationContainer ref={...}>.
export const navigationRef = createNavigationContainerRef<any>();

export function navigate(name: string, params?: any) {
  if (navigationRef.isReady()) {
    (navigationRef as any).navigate(name, params);
  }
}
