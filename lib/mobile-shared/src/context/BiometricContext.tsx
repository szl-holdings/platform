import React, {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { AppState, type AppStateStatus, Platform } from 'react-native';

let LocalAuthentication: typeof import('expo-local-authentication') | null = null;
let SecureStore: typeof import('expo-secure-store') | null = null;

try {
  LocalAuthentication = require('expo-local-authentication');
} catch {}
try {
  SecureStore = require('expo-secure-store');
} catch {}

export interface BiometricConfig {
  storagePrefix: string;
  appName: string;
  lockTimeoutMs?: number;
  promptMessage?: string;
}

export interface BiometricContextValue {
  isEnabled: boolean;
  isLocked: boolean;
  isAvailable: boolean;
  enableBiometric: () => Promise<boolean>;
  disableBiometric: () => Promise<void>;
  unlock: () => Promise<boolean>;
}

const BiometricContext = createContext<BiometricContextValue>({
  isEnabled: false,
  isLocked: false,
  isAvailable: false,
  enableBiometric: async () => false,
  disableBiometric: async () => {},
  unlock: async () => true,
});

async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
  }
  if (!SecureStore) return null;
  return SecureStore.getItemAsync(key);
}

async function secureSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
    return;
  }
  if (!SecureStore) return;
  return SecureStore.setItemAsync(key, value);
}

async function secureDel(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.localStorage.removeItem(key);
    return;
  }
  if (!SecureStore) return;
  return SecureStore.deleteItemAsync(key);
}

export function BiometricProvider({
  children,
  config,
}: {
  children: ReactNode;
  config: BiometricConfig;
}) {
  const { storagePrefix, appName, lockTimeoutMs = 5 * 60 * 1000, promptMessage } = config;

  const enabledKey = `${storagePrefix}_biometric_enabled`;
  const defaultPrompt = promptMessage ?? `Authenticate to access ${appName}`;

  const [isEnabled, setIsEnabled] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const lastActiveRef = React.useRef<number>(Date.now());

  useEffect(() => {
    if (Platform.OS === 'web' || !LocalAuthentication) return;

    LocalAuthentication.hasHardwareAsync().then((has) => {
      setIsAvailable(has);
    });

    (async () => {
      const enabled = await secureGet(enabledKey);
      if (enabled === 'true') {
        setIsEnabled(true);
        setIsLocked(true);
      }
    })();
  }, [enabledKey]);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const handleChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        const elapsed = Date.now() - lastActiveRef.current;
        if (isEnabled && elapsed > lockTimeoutMs) {
          setIsLocked(true);
        }
      } else if (nextState === 'background' || nextState === 'inactive') {
        lastActiveRef.current = Date.now();
      }
    };

    const sub = AppState.addEventListener('change', handleChange);
    return () => sub.remove();
  }, [isEnabled, lockTimeoutMs]);

  const unlock = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'web' || !LocalAuthentication) {
      setIsLocked(false);
      return true;
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: defaultPrompt,
        fallbackLabel: 'Use passcode',
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        setIsLocked(false);
        lastActiveRef.current = Date.now();
        return true;
      }
      return false;
    } catch (_err) {
      return false;
    }
  }, [defaultPrompt]);

  const enableBiometric = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'web' || !LocalAuthentication) return false;

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirm identity to enable biometric lock',
        fallbackLabel: 'Use passcode',
      });

      if (result.success) {
        await secureSet(enabledKey, 'true');
        setIsEnabled(true);
        setIsLocked(false);
        lastActiveRef.current = Date.now();
        return true;
      }
      return false;
    } catch (_err) {
      return false;
    }
  }, [enabledKey]);

  const disableBiometric = useCallback(async (): Promise<void> => {
    await secureDel(enabledKey);
    setIsEnabled(false);
    setIsLocked(false);
  }, [enabledKey]);

  return (
    <BiometricContext.Provider
      value={{ isEnabled, isLocked, isAvailable, enableBiometric, disableBiometric, unlock }}
    >
      {children}
    </BiometricContext.Provider>
  );
}

export function useBiometric(): BiometricContextValue {
  return useContext(BiometricContext);
}

export async function promptBiometric(reason: string): Promise<boolean> {
  if (Platform.OS === 'web' || !LocalAuthentication) return true;
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: 'Use passcode',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    return false;
  }
}
