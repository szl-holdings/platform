import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useBiometric } from "@/context/BiometricContext";

export function BiometricLockScreen() {
  const insets = useSafeAreaInsets();
  const { unlock } = useBiometric();
  const [unlocking, setUnlocking] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    handleUnlock();
  }, []);

  const handleUnlock = async () => {
    setUnlocking(true);
    setFailed(false);
    const success = await unlock();
    if (!success) {
      setFailed(true);
    }
    setUnlocking(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.inner}>
        <View style={styles.iconWrap}>
          <Feather name="user" size={40} color="#FFFFFF" />
        </View>

        <Text style={styles.title}>Stephen Lutar</Text>
        <Text style={styles.subtitle}>
          Authenticate to access this portfolio
        </Text>

        {failed && (
          <View style={styles.errorBanner}>
            <Feather name="alert-triangle" size={14} color="#EF4444" />
            <Text style={styles.errorText}>
              Authentication failed — try again
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.unlockBtn, unlocking && { opacity: 0.7 }]}
          onPress={handleUnlock}
          disabled={unlocking}
          activeOpacity={0.8}
        >
          {unlocking ? (
            <ActivityIndicator color="#0a0a0a" size="small" />
          ) : (
            <>
              <Feather name="unlock" size={18} color="#0a0a0a" />
              <Text style={styles.unlockText}>Unlock with Biometrics</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.secNote}>
          <Feather name="shield" size={11} color="rgba(255,255,255,0.3)" />
          <Text style={styles.secNoteText}>Stephen Lutar · Founder & Builder</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    alignItems: "center",
    justifyContent: "center",
  },
  inner: {
    width: "100%",
    maxWidth: 380,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.5)",
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 32,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
    backgroundColor: "rgba(239,68,68,0.1)",
    width: "100%",
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#EF4444",
    flex: 1,
  },
  unlockBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    height: 52,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    marginBottom: 16,
  },
  unlockText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#0a0a0a",
  },
  secNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  secNoteText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.3)",
  },
});
