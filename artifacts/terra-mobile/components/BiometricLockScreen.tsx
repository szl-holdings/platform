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
          <Feather name="map" size={40} color="#B8943C" />
        </View>

        <Text style={styles.title}>Terra</Text>
        <Text style={styles.subtitle}>
          Authenticate to access real estate intelligence
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
            <ActivityIndicator color="#0d0b08" size="small" />
          ) : (
            <>
              <Feather name="unlock" size={18} color="#0d0b08" />
              <Text style={styles.unlockText}>Unlock with Biometrics</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.secNote}>
          <Feather name="shield" size={11} color="rgba(245,240,232,0.3)" />
          <Text style={styles.secNoteText}>Terra · Real Estate Intelligence</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0b08",
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
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(184,148,60,0.3)",
    backgroundColor: "rgba(184,148,60,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_600SemiBold",
    color: "#F5F0E8",
    letterSpacing: 2,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(245,240,232,0.5)",
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
    backgroundColor: "#B8943C",
    marginBottom: 16,
  },
  unlockText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#0d0b08",
  },
  secNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  secNoteText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(245,240,232,0.3)",
  },
});
