import React, { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { AppState, type AppStateStatus, Platform } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const BIOMETRIC_ENABLED_KEY = "cortex_biometric_enabled";
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
  isEnabled: false, isLocked: false, isAvailable: false,
  enableBiometric: async () => false, disableBiometric: async () => {}, unlock: async () => true,
});

async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === "web") return typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
  return SecureStore.getItemAsync(key);
}

async function secureSet(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") { if (typeof window !== "undefined") window.localStorage.setItem(key, value); return; }
  return SecureStore.setItemAsync(key, value);
}

export function BiometricProvider({ children }: { children: ReactNode }) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [lastActive, setLastActive] = useState(Date.now());

  useEffect(() => {
    (async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsAvailable(hasHardware && enrolled);
      const storedEnabled = await secureGet(BIOMETRIC_ENABLED_KEY);
      if (storedEnabled === "true" && hasHardware && enrolled) { setIsEnabled(true); setIsLocked(true); }
    })();
  }, []);

  useEffect(() => {
    if (!isEnabled) return;
    const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "background") setLastActive(Date.now());
      else if (state === "active" && Date.now() - lastActive > LOCK_TIMEOUT_MS) setIsLocked(true);
    });
    return () => sub.remove();
  }, [isEnabled, lastActive]);

  const unlock = useCallback(async () => {
    const result = await LocalAuthentication.authenticateAsync({ promptMessage: "Unlock CORTEX", cancelLabel: "Cancel", disableDeviceFallback: false });
    if (result.success) { setIsLocked(false); setLastActive(Date.now()); }
    return result.success;
  }, []);

  const enableBiometric = useCallback(async () => {
    const result = await LocalAuthentication.authenticateAsync({ promptMessage: "Enable biometric lock", cancelLabel: "Cancel" });
    if (result.success) { setIsEnabled(true); setIsLocked(false); await secureSet(BIOMETRIC_ENABLED_KEY, "true"); }
    return result.success;
  }, []);

  const disableBiometric = useCallback(async () => {
    setIsEnabled(false); setIsLocked(false);
    await secureSet(BIOMETRIC_ENABLED_KEY, "false");
  }, []);

  return (
    <BiometricContext.Provider value={{ isEnabled, isLocked, isAvailable, enableBiometric, disableBiometric, unlock }}>
      {children}
    </BiometricContext.Provider>
  );
}

export function useBiometric() {
  return useContext(BiometricContext);
}
