import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useBiometric } from "@/context/BiometricContext";

export function BiometricLockScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { unlock } = useBiometric();
  const [unlocking, setUnlocking] = useState(false);
  const [failed, setFailed] = useState(false);

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
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.inner}>
        <View style={[styles.iconWrap, { borderColor: colors.amberBorder, backgroundColor: colors.amberDim }]}>
          <Ionicons name="finger-print" size={48} color={colors.amber} />
        </View>

        <Text style={[styles.title, { color: colors.foreground, fontFamily: "SpaceGrotesk_700Bold" }]}>
          AEGIS Locked
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          Authenticate to access the SOC command center
        </Text>

        {failed && (
          <View style={[styles.errorBanner, { backgroundColor: colors.redDim, borderColor: colors.redBorder }]}>
            <Ionicons name="warning" size={14} color={colors.red} />
            <Text style={[styles.errorText, { color: colors.red, fontFamily: "Inter_400Regular" }]}>
              Authentication failed — try again
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.unlockBtn, { backgroundColor: colors.amber, opacity: unlocking ? 0.7 : 1 }]}
          onPress={handleUnlock}
          disabled={unlocking}
          activeOpacity={0.8}
        >
          {unlocking ? (
            <ActivityIndicator color={colors.background} size="small" />
          ) : (
            <>
              <Ionicons name="finger-print" size={20} color={colors.background} />
              <Text style={[styles.unlockText, { color: colors.background, fontFamily: "Inter_600SemiBold" }]}>
                Unlock with Biometrics
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.secNote}>
          <Ionicons name="shield-checkmark" size={12} color={colors.mutedForeground} />
          <Text style={[styles.secNoteText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            AEGIS · SOC Command Center
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  inner: { width: "100%", maxWidth: 380, paddingHorizontal: 32, alignItems: "center" },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: { fontSize: 24, letterSpacing: 4, marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 22, textAlign: "center", marginBottom: 28 },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    width: "100%",
    marginBottom: 16,
  },
  errorText: { fontSize: 12, flex: 1 },
  unlockBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    height: 52,
    borderRadius: 12,
    marginBottom: 16,
  },
  unlockText: { fontSize: 15 },
  secNote: { flexDirection: "row", alignItems: "center", gap: 6 },
  secNoteText: { fontSize: 11 },
});
