import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AppState,
  AppStateStatus,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

export const BIOMETRIC_PREF_KEY = "szl_biometric_enabled";

interface BiometricLockContextValue {
  biometricEnabled: boolean;
  setBiometricPreference: (enabled: boolean) => Promise<void>;
}

const BiometricLockContext = createContext<BiometricLockContextValue>({
  biometricEnabled: false,
  setBiometricPreference: async () => {},
});

export async function promptBiometric(reason: string): Promise<boolean> {
  if (Platform.OS === "web") return true;
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: reason,
    fallbackLabel: "Use Passcode",
    cancelLabel: "Cancel",
    disableDeviceFallback: false,
  });
  return result.success;
}

function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [unlocking, setUnlocking] = useState(false);

  const handleUnlock = useCallback(async () => {
    if (unlocking) return;
    setUnlocking(true);
    const success = await promptBiometric("Authenticate to access SZL Holdings");
    if (success) onUnlock();
    setUnlocking(false);
  }, [unlocking, onUnlock]);

  useEffect(() => {
    handleUnlock();
  }, []);

  return (
    <View style={styles.lockScreen}>
      <View style={styles.lockCard}>
        <View style={styles.lockIcon}>
          <Feather name="lock" size={28} color="#c9a84c" />
        </View>
        <Text style={styles.lockTitle}>SZL Holdings</Text>
        <Text style={styles.lockSubtitle}>
          Authenticate to access your executive dashboard
        </Text>
        <Pressable
          style={[styles.unlockBtn, unlocking && { opacity: 0.6 }]}
          onPress={handleUnlock}
          disabled={unlocking}
        >
          <Feather name="unlock" size={16} color="#090810" />
          <Text style={styles.unlockBtnText}>
            {unlocking ? "Authenticating…" : "Authenticate"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export function BiometricLockProvider({ children }: { children: ReactNode }) {
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [locked, setLocked] = useState(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    if (Platform.OS === "web") return;
    SecureStore.getItemAsync(BIOMETRIC_PREF_KEY).then((val) => {
      if (val === "true") {
        setBiometricEnabled(true);
        setLocked(true);
      }
    });
  }, []);

  useEffect(() => {
    if (Platform.OS === "web") return;
    const sub = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      const wasBackground =
        appStateRef.current === "background" ||
        appStateRef.current === "inactive";
      if (wasBackground && nextState === "active" && biometricEnabled) {
        setLocked(true);
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, [biometricEnabled]);

  const handleUnlock = useCallback(() => {
    setLocked(false);
  }, []);

  const setBiometricPreference = useCallback(async (enabled: boolean) => {
    if (enabled) {
      if (Platform.OS === "web") {
        setBiometricEnabled(true);
        await SecureStore.setItemAsync(BIOMETRIC_PREF_KEY, "true").catch(() => {});
        return;
      }
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) throw new Error("biometric_unavailable");
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to enable biometric lock",
        fallbackLabel: "Use Passcode",
      });
      if (!result.success) throw new Error("biometric_failed");
      setBiometricEnabled(true);
      await SecureStore.setItemAsync(BIOMETRIC_PREF_KEY, "true").catch(() => {});
    } else {
      setBiometricEnabled(false);
      setLocked(false);
      await SecureStore.deleteItemAsync(BIOMETRIC_PREF_KEY).catch(() => {});
    }
  }, []);

  return (
    <BiometricLockContext.Provider value={{ biometricEnabled, setBiometricPreference }}>
      {children}
      {locked && <LockScreen onUnlock={handleUnlock} />}
    </BiometricLockContext.Provider>
  );
}

export function useBiometricLock(): BiometricLockContextValue {
  return useContext(BiometricLockContext);
}

const styles = StyleSheet.create({
  lockScreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#090810",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  lockCard: {
    width: 300,
    padding: 32,
    borderRadius: 16,
    backgroundColor: "#111018",
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.15)",
    alignItems: "center",
    gap: 12,
  },
  lockIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(201,168,76,0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  lockTitle: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    color: "#f0eeff",
    letterSpacing: 0.5,
  },
  lockSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(240,238,255,0.5)",
    textAlign: "center",
    lineHeight: 19,
  },
  unlockBtn: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#c9a84c",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  unlockBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#090810",
  },
});
