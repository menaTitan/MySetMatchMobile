import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const ENABLED_KEY = 'biometricEnabled';

/** True when the user has flipped the Account Settings toggle on. */
export async function isBiometricEnabled(): Promise<boolean> {
  return (await SecureStore.getItemAsync(ENABLED_KEY)) === '1';
}

export async function setBiometricEnabled(on: boolean): Promise<void> {
  if (on) await SecureStore.setItemAsync(ENABLED_KEY, '1');
  else await SecureStore.deleteItemAsync(ENABLED_KEY);
}

/**
 * True if the device has biometric hardware AND the user has enrolled at
 * least one fingerprint / face. Both conditions must hold — devices with
 * a sensor but no enrolled biometric will silently fail the prompt.
 */
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    if (!(await LocalAuthentication.hasHardwareAsync())) return false;
    return await LocalAuthentication.isEnrolledAsync();
  } catch {
    return false;
  }
}

/**
 * Human label for the biometric the device offers — used in toggle copy
 * and prompts so iPhone users see "Face ID" and Android users see
 * "Fingerprint" instead of a generic word.
 */
export async function biometricLabel(): Promise<string> {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'Face ID';
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'Touch ID';
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) return 'Iris';
  } catch {}
  return 'Biometric';
}

/**
 * Prompt the user and return whether they passed. Cancelling, repeated
 * failures, and missing enrollment all resolve to false so callers can
 * fall back to password sign-in. The device passcode is allowed as a
 * fallback (disableDeviceFallback: false) — losing fingerprint enrollment
 * shouldn't lock anyone out of their own phone.
 */
export async function promptBiometric(reason: string): Promise<boolean> {
  try {
    const r = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      cancelLabel: 'Cancel',
      fallbackLabel: 'Use Device Passcode',
      disableDeviceFallback: false,
    });
    return r.success;
  } catch {
    return false;
  }
}
