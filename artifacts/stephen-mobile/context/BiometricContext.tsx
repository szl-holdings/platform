import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { AppState, type AppStateStatus, Platform } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const BIOMETRIC_ENABLED_KEY = "stephen_biometric_enabled";
const LOCK_TIMEOUT_MS = 5 * 60 * 1000;

interface BiometricContextValue {
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
  if (Platform.OS === "web") {
    return typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
  }
  return SecureStore.getItemAsync(key);
}

async function secureSet(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") window.localStorage.setItem(key, value);
    return;
  }
  return SecureStore.setItemAsync(key, value);
}

async function secureDel(key: string): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") window.localStorage.removeItem(key);
    return;
  }
  return SecureStore.deleteItemAsync(key);
}

export function BiometricProvider({ children }: { children: ReactNode }) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const lastActiveRef = React.useRef<number>(Date.now());

  useEffect(() => {
    if (Platform.OS === "web") return;
    LocalAuthentication.hasHardwareAsync().then((has) => {
      setIsAvailable(has);
    });
    (async () => {
      const enabled = await secureGet(BIOMETRIC_ENABLED_KEY);
      if (enabled === "true") {
        setIsEnabled(true);
        setIsLocked(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (Platform.OS === "web") return;
    const handleChange = (nextState: AppStateStatus) => {
      if (nextState === "active") {
        const elapsed = Date.now() - lastActiveRef.current;
        if (isEnabled && elapsed > LOCK_TIMEOUT_MS) {
          setIsLocked(true);
        }
      } else if (nextState === "background" || nextState === "inactive") {
        lastActiveRef.current = Date.now();
      }
    };
    const sub = AppState.addEventListener("change", handleChange);
    return () => sub.remove();
  }, [isEnabled]);

  const unlock = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === "web") {
      setIsLocked(false);
      return true;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Authenticate to access Stephen Lutar",
      fallbackLabel: "Use passcode",
      cancelLabel: "Cancel",
    });
    if (result.success) {
      setIsLocked(false);
      lastActiveRef.current = Date.now();
      return true;
    }
    return false;
  }, []);

  const enableBiometric = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === "web") return false;
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Confirm identity to enable biometric lock",
      fallbackLabel: "Use passcode",
    });
    if (result.success) {
      await secureSet(BIOMETRIC_ENABLED_KEY, "true");
      setIsEnabled(true);
      setIsLocked(false);
      lastActiveRef.current = Date.now();
      return true;
    }
    return false;
  }, []);

  const disableBiometric = useCallback(async (): Promise<void> => {
    await secureDel(BIOMETRIC_ENABLED_KEY);
    setIsEnabled(false);
    setIsLocked(false);
  }, []);

  return (
    <BiometricContext.Provider value={{ isEnabled, isLocked, isAvailable, enableBiometric, disableBiometric, unlock }}>
      {children}
    </BiometricContext.Provider>
  );
}

export function useBiometric(): BiometricContextValue {
  return useContext(BiometricContext);
}
