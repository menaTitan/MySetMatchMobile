import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const ENABLED_KEY = 'biometricEnabled';
// Credentials stashed here so the LoginScreen's biometric button can
// retrieve and replay them after a passcode-less unlock. Stored in
// SecureStore (iOS Keychain / Android EncryptedSharedPreferences) — we
// gate reads on a successful biometric prompt to make sure a stolen
// unlocked device can't open the app silently.
const CRED_EMAIL_KEY    = 'biometricEmail';
const CRED_PASSWORD_KEY = 'biometricPassword';

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
 * Human label for the biometric the device offers — drives toggle copy
 * and the prompt. iOS uses Apple's marketing terms ("Face ID" /
 * "Touch ID"); Android uses generic system names ("Face Unlock" /
 * "Fingerprint") so users see the same wording the OS itself shows.
 */
export async function biometricLabel(): Promise<string> {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const ios = Platform.OS === 'ios';
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION))
      return ios ? 'Face ID' : 'Face Unlock';
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT))
      return ios ? 'Touch ID' : 'Fingerprint';
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

/**
 * Stash the email + password the LoginScreen's biometric button will
 * replay. Saved at enable-time (when we have the user's confirmation
 * via the toggle's password prompt) so a subsequent logout + biometric
 * sign-in works without forcing the user to type their password first.
 */
export async function saveBiometricCredentials(email: string, password: string): Promise<void> {
  await SecureStore.setItemAsync(CRED_EMAIL_KEY, email);
  await SecureStore.setItemAsync(CRED_PASSWORD_KEY, password);
}

export async function clearBiometricCredentials(): Promise<void> {
  await SecureStore.deleteItemAsync(CRED_EMAIL_KEY);
  await SecureStore.deleteItemAsync(CRED_PASSWORD_KEY);
}

/** True when we have credentials to feed a biometric sign-in. */
export async function hasBiometricCredentials(): Promise<boolean> {
  const e = await SecureStore.getItemAsync(CRED_EMAIL_KEY);
  const p = await SecureStore.getItemAsync(CRED_PASSWORD_KEY);
  return !!(e && p);
}

/**
 * Read the stored credentials AFTER a successful biometric prompt.
 * Returns null if biometric is unavailable, the user cancelled, or no
 * credentials are on file. Callers should fall back to the password
 * form on null.
 */
export async function unlockBiometricCredentials(reason: string): Promise<{ email: string; password: string } | null> {
  if (!(await hasBiometricCredentials())) return null;
  if (!(await promptBiometric(reason))) return null;
  const email    = await SecureStore.getItemAsync(CRED_EMAIL_KEY);
  const password = await SecureStore.getItemAsync(CRED_PASSWORD_KEY);
  if (!email || !password) return null;
  return { email, password };
}
