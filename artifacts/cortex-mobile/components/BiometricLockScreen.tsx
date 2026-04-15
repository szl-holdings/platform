import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBiometric } from "@/context/BiometricContext";
import { CORTEX_COLORS } from "@/constants/colors";

export function BiometricLockScreen() {
  const insets = useSafeAreaInsets();
  const { unlock } = useBiometric();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Text style={styles.logo}>CORTEX</Text>
      <Text style={styles.subtitle}>Locked</Text>
      <Pressable style={styles.button} onPress={unlock}>
        <Text style={styles.buttonText}>Unlock with Biometrics</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CORTEX_COLORS.bg, alignItems: "center", justifyContent: "center" },
  logo: { fontSize: 36, fontWeight: "800", color: CORTEX_COLORS.gold, letterSpacing: 8 },
  subtitle: { fontSize: 14, color: CORTEX_COLORS.textMuted, marginTop: 8, letterSpacing: 2, textTransform: "uppercase" },
  button: { marginTop: 48, backgroundColor: `${CORTEX_COLORS.gold}20`, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: CORTEX_COLORS.gold },
  buttonText: { fontSize: 16, fontWeight: "600", color: CORTEX_COLORS.gold },
});
