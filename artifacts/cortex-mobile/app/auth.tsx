import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Redirect } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { CORTEX_COLORS } from "@/constants/colors";

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { login, isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <Text style={styles.logo}>CORTEX</Text>
        <Text style={styles.tagline}>Unified Command</Text>
        <Text style={styles.subtitle}>
          Seven verticals. One app.{"\n"}Defense · Fleet · Properties · Operations{"\n"}Advisory · Portfolio · Founder
        </Text>

        <Pressable style={styles.loginButton} onPress={login}>
          <Text style={styles.loginText}>Sign In</Text>
        </Pressable>

        <Text style={styles.footer}>SZL Holdings Ecosystem</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CORTEX_COLORS.bg },
  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  logo: { fontSize: 44, fontWeight: "800", color: CORTEX_COLORS.gold, letterSpacing: 12, marginBottom: 8 },
  tagline: { fontSize: 14, fontWeight: "600", color: CORTEX_COLORS.textSecondary, letterSpacing: 4, textTransform: "uppercase", marginBottom: 24 },
  subtitle: { fontSize: 14, color: CORTEX_COLORS.textMuted, textAlign: "center", lineHeight: 22 },
  loginButton: { marginTop: 48, backgroundColor: CORTEX_COLORS.gold, paddingHorizontal: 48, paddingVertical: 16, borderRadius: 12 },
  loginText: { fontSize: 16, fontWeight: "700", color: "#080B12" },
  footer: { position: "absolute", bottom: 32, fontSize: 11, color: CORTEX_COLORS.textMuted, letterSpacing: 2, textTransform: "uppercase" },
});
