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
          <Feather name="anchor" size={40} color="#0EA5E9" />
        </View>

        <Text style={styles.title}>Vessels</Text>
        <Text style={styles.subtitle}>
          Authenticate to access maritime intelligence
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
            <ActivityIndicator color="#020d18" size="small" />
          ) : (
            <>
              <Feather name="unlock" size={18} color="#020d18" />
              <Text style={styles.unlockText}>Unlock with Biometrics</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.secNote}>
          <Feather name="shield" size={11} color="rgba(224,242,254,0.3)" />
          <Text style={styles.secNoteText}>Vessels · Maritime Intelligence</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020d18",
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
    borderColor: "rgba(14,165,233,0.3)",
    backgroundColor: "rgba(14,165,233,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: "#E0F2FE",
    letterSpacing: 2,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(224,242,254,0.5)",
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
    backgroundColor: "#0EA5E9",
    marginBottom: 16,
  },
  unlockText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#020d18",
  },
  secNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  secNoteText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(224,242,254,0.3)",
  },
});
