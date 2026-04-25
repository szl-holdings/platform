import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

export const BIOMETRIC_SIGNIN_TOKEN_KEY = 'szl_biometric_signin_token';
export const BIOMETRIC_SIGNIN_ENROLLED_AT_KEY = 'szl_biometric_signin_enrolled_at';
export const BIOMETRIC_SIGNIN_DEVICE_ID_KEY = 'szl_biometric_signin_device_id';
export const BIOMETRIC_SIGNIN_ENABLED_KEY = 'szl_biometric_signin_enabled';

export const ALL_BIOMETRIC_SIGNIN_KEYS = [
  BIOMETRIC_SIGNIN_TOKEN_KEY,
  BIOMETRIC_SIGNIN_ENROLLED_AT_KEY,
  BIOMETRIC_SIGNIN_DEVICE_ID_KEY,
  BIOMETRIC_SIGNIN_ENABLED_KEY,
] as const;

export interface BiometricSignInStatus {
  isEnrolled: boolean;
  enrolledAt: string | null;
  deviceId: string | null;
  platform: string | null;
}

export interface StepUpResult {
  stepUpToken: string;
  expiresAt: string;
  validForSeconds: number;
}

export interface BiometricSignInContextValue {
  status: BiometricSignInStatus;
  isAvailable: boolean;
  checkEnrollment: () => Promise<void>;
  enroll: (sessionToken: string, apiBaseUrl: string) => Promise<boolean>;
  signIn: (
    apiBaseUrl: string,
  ) => Promise<{
    token: string;
    refreshToken: string;
    expiresAt: string;
    refreshTokenExpiresAt: string;
  } | null>;
  revoke: (sessionToken: string, apiBaseUrl: string) => Promise<void>;
  revokeLocal: () => Promise<void>;
  performStepUp: (
    sessionToken: string,
    apiBaseUrl: string,
  ) => Promise<StepUpResult | null>;
}

const BiometricSignInContext = createContext<BiometricSignInContextValue>({
  status: { isEnrolled: false, enrolledAt: null, deviceId: null, platform: null },
  isAvailable: false,
  checkEnrollment: async () => {},
  enroll: async () => false,
  signIn: async () => null,
  revoke: async () => {},
  revokeLocal: async () => {},
  performStepUp: async () => null,
});

async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  return SecureStore.getItemAsync(key).catch(() => null);
}

async function secureSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') return;
  return SecureStore.setItemAsync(key, value).catch(() => {});
}

async function secureDel(key: string): Promise<void> {
  if (Platform.OS === 'web') return;
  return SecureStore.deleteItemAsync(key).catch(() => {});
}

async function getOrCreateDeviceId(): Promise<string> {
  const stored = await secureGet(BIOMETRIC_SIGNIN_DEVICE_ID_KEY);
  if (stored) return stored;
  const modelId = Device.modelId ?? 'unknown';
  const osName = Device.osName ?? Platform.OS;
  const rand = Math.random().toString(36).slice(2);
  const deviceId = `${osName}-${modelId}-${rand}`.replace(/\s+/g, '_').slice(0, 128);
  await secureSet(BIOMETRIC_SIGNIN_DEVICE_ID_KEY, deviceId);
  return deviceId;
}

/**
 * Compute proof-of-possession: SHA-256(bindingToken + ":" + nonce)
 * Must match the server-side computeProof() in mobile-biometric.ts.
 */
async function computeProof(bindingToken: string, nonce: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${bindingToken}:${nonce}`,
  );
}

interface ChallengeResponse {
  challengeId: string;
  nonce: string;
  expiresAt: string;
}

async function requestChallenge(
  apiBaseUrl: string,
  deviceId: string,
): Promise<ChallengeResponse | null> {
  try {
    const resp = await fetch(`${apiBaseUrl}/api/mobile-biometric/challenge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId }),
    });
    if (!resp.ok) return null;
    return resp.json() as Promise<ChallengeResponse>;
  } catch {
    return null;
  }
}

export function BiometricSignInProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<BiometricSignInStatus>({
    isEnrolled: false,
    enrolledAt: null,
    deviceId: null,
    platform: null,
  });
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    LocalAuthentication.hasHardwareAsync().then(async (has) => {
      setIsAvailable(has);
    });
  }, []);

  const checkEnrollment = useCallback(async () => {
    if (Platform.OS === 'web') return;
    const [enabled, enrolledAt, deviceId] = await Promise.all([
      secureGet(BIOMETRIC_SIGNIN_ENABLED_KEY),
      secureGet(BIOMETRIC_SIGNIN_ENROLLED_AT_KEY),
      secureGet(BIOMETRIC_SIGNIN_DEVICE_ID_KEY),
    ]);
    setStatus({
      isEnrolled: enabled === 'true',
      enrolledAt: enrolledAt ?? null,
      deviceId: deviceId ?? null,
      platform: Platform.OS,
    });
  }, []);

  useEffect(() => {
    checkEnrollment();
  }, [checkEnrollment]);

  const enroll = useCallback(
    async (sessionToken: string, apiBaseUrl: string): Promise<boolean> => {
      if (Platform.OS === 'web') return false;

      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (!hasHardware || !isEnrolled) return false;

        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate to enable Face ID / Touch ID sign-in',
          fallbackLabel: 'Use Passcode',
          cancelLabel: 'Cancel',
          disableDeviceFallback: false,
        });
        if (!result.success) return false;

        const deviceId = await getOrCreateDeviceId();
        const deviceName = `${Device.deviceName ?? Device.modelName ?? 'Device'}`;

        const resp = await fetch(`${apiBaseUrl}/api/mobile-biometric/enroll`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({
            deviceId,
            deviceName,
            platform: Platform.OS,
          }),
        });

        if (!resp.ok) return false;

        const data = await resp.json();
        const bindingToken: string = data.bindingToken;
        if (!bindingToken) return false;

        const now = new Date().toISOString();
        await Promise.all([
          secureSet(BIOMETRIC_SIGNIN_TOKEN_KEY, bindingToken),
          secureSet(BIOMETRIC_SIGNIN_ENROLLED_AT_KEY, now),
          secureSet(BIOMETRIC_SIGNIN_ENABLED_KEY, 'true'),
        ]);

        setStatus({ isEnrolled: true, enrolledAt: now, deviceId, platform: Platform.OS });
        return true;
      } catch {
        return false;
      }
    },
    [],
  );

  const signIn = useCallback(async (apiBaseUrl: string) => {
    if (Platform.OS === 'web') return null;

    try {
      const [bindingToken, deviceId] = await Promise.all([
        secureGet(BIOMETRIC_SIGNIN_TOKEN_KEY),
        secureGet(BIOMETRIC_SIGNIN_DEVICE_ID_KEY),
      ]);
      if (!bindingToken || !deviceId) return null;

      const challenge = await requestChallenge(apiBaseUrl, deviceId);
      if (!challenge) return null;

      const biometricResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Sign in to SZL Holdings',
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      if (!biometricResult.success) return null;

      const proof = await computeProof(bindingToken, challenge.nonce);

      const resp = await fetch(`${apiBaseUrl}/api/mobile-biometric/authenticate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: challenge.challengeId, deviceId, proof }),
      });
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        if (errData?.code === 'BINDING_INVALID') {
          await Promise.all([
            secureDel(BIOMETRIC_SIGNIN_TOKEN_KEY),
            secureDel(BIOMETRIC_SIGNIN_ENROLLED_AT_KEY),
            secureDel(BIOMETRIC_SIGNIN_ENABLED_KEY),
          ]);
          setStatus({ isEnrolled: false, enrolledAt: null, deviceId, platform: Platform.OS });
        }
        return null;
      }

      const data = await resp.json();
      return {
        token: data.token,
        refreshToken: data.refreshToken,
        expiresAt: data.expiresAt,
        refreshTokenExpiresAt: data.refreshTokenExpiresAt,
      };
    } catch {
      return null;
    }
  }, []);

  const revokeLocal = useCallback(async () => {
    await Promise.all([
      secureDel(BIOMETRIC_SIGNIN_TOKEN_KEY),
      secureDel(BIOMETRIC_SIGNIN_ENROLLED_AT_KEY),
      secureDel(BIOMETRIC_SIGNIN_ENABLED_KEY),
    ]);
    const deviceId = await secureGet(BIOMETRIC_SIGNIN_DEVICE_ID_KEY);
    setStatus({ isEnrolled: false, enrolledAt: null, deviceId: deviceId ?? null, platform: Platform.OS });
  }, []);

  const revoke = useCallback(async (sessionToken: string, apiBaseUrl: string) => {
    if (Platform.OS === 'web') return;

    const deviceId = await secureGet(BIOMETRIC_SIGNIN_DEVICE_ID_KEY);

    try {
      await fetch(`${apiBaseUrl}/api/mobile-biometric/binding`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ deviceId }),
      });
    } catch {}

    await revokeLocal();
  }, [revokeLocal]);

  const performStepUp = useCallback(
    async (sessionToken: string, apiBaseUrl: string): Promise<StepUpResult | null> => {
      if (Platform.OS === 'web') return null;

      try {
        const [bindingToken, deviceId] = await Promise.all([
          secureGet(BIOMETRIC_SIGNIN_TOKEN_KEY),
          secureGet(BIOMETRIC_SIGNIN_DEVICE_ID_KEY),
        ]);
        if (!bindingToken || !deviceId) return null;

        const challenge = await requestChallenge(apiBaseUrl, deviceId);
        if (!challenge) return null;

        const biometricResult = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Confirm this action with biometrics',
          fallbackLabel: 'Use Passcode',
          cancelLabel: 'Cancel',
          disableDeviceFallback: false,
        });
        if (!biometricResult.success) return null;

        const proof = await computeProof(bindingToken, challenge.nonce);

        const resp = await fetch(`${apiBaseUrl}/api/mobile-biometric/step-up`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({ challengeId: challenge.challengeId, deviceId, proof }),
        });

        if (!resp.ok) return null;
        return resp.json() as Promise<StepUpResult>;
      } catch {
        return null;
      }
    },
    [],
  );

  return (
    <BiometricSignInContext.Provider
      value={{ status, isAvailable, checkEnrollment, enroll, signIn, revoke, revokeLocal, performStepUp }}
    >
      {children}
    </BiometricSignInContext.Provider>
  );
}

export function useBiometricSignIn(): BiometricSignInContextValue {
  return useContext(BiometricSignInContext);
}
