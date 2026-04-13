import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function AuthScreen() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [signing, setSigning] = useState(false);

  if (isAuthenticated) return <Redirect href="/(tabs)" />;

  const handleLogin = async () => {
    setSigning(true);
    try {
      await login();
    } finally {
      setSigning(false);
    }
  };

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: colors.background,
        paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0),
        paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0),
      },
    ]}>
      <LinearGradient
        colors={["rgba(139,92,246,0.08)", "transparent"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.inner}>
        <View style={[styles.iconWrap, { borderColor: "rgba(139,92,246,0.3)", backgroundColor: "rgba(139,92,246,0.08)" }]}>
          <Ionicons name="flash" size={48} color={colors.violet} />
        </View>

        <Text style={[styles.wordmark, { color: colors.violet, fontFamily: "SpaceGrotesk_700Bold" }]}>
          ALLOY
        </Text>
        <Text style={[styles.tagline, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          Cross-Domain Intelligence Platform
        </Text>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          Sign in to access your AI assistant, agent fabric, workflow monitor, and intelligence dashboard.
        </Text>

        <TouchableOpacity
          style={[styles.loginBtn, { backgroundColor: colors.violet, opacity: signing || isLoading ? 0.7 : 1 }]}
          onPress={handleLogin}
          disabled={signing || isLoading}
          activeOpacity={0.8}
        >
          {signing || isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="log-in-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={[styles.loginBtnText, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>
                Sign In with Replit
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.securityNote}>
          <Ionicons name="shield-checkmark" size={12} color={colors.mutedForeground} />
          <Text style={[styles.securityText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Biometric authentication available after sign-in
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  inner: { width: "100%", maxWidth: 380, paddingHorizontal: 32, alignItems: "center" },
  iconWrap: { width: 96, height: 96, borderRadius: 24, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  wordmark: { fontSize: 32, letterSpacing: 8, marginBottom: 8 },
  tagline: { fontSize: 13, letterSpacing: 0.5, textAlign: "center" },
  divider: { width: 48, height: 1, marginVertical: 28 },
  subtitle: { fontSize: 14, lineHeight: 22, textAlign: "center", marginBottom: 32 },
  loginBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", width: "100%", height: 52, borderRadius: 12, marginBottom: 16 },
  loginBtnText: { fontSize: 15 },
  securityNote: { flexDirection: "row", alignItems: "center", gap: 6 },
  securityText: { fontSize: 11 },
});
