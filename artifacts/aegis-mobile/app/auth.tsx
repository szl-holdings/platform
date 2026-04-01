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
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0), paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) }]}>
      <View style={styles.inner}>
        <View style={styles.iconWrap}>
          <View style={[styles.shieldOuter, { borderColor: colors.amberBorder }]}>
            <Ionicons name="shield-checkmark" size={48} color={colors.amber} />
          </View>
        </View>

        <Text style={[styles.wordmark, { color: colors.foreground, fontFamily: "SpaceGrotesk_700Bold" }]}>
          AEGIS
        </Text>
        <Text style={[styles.tagline, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          Unified Defense & Intelligence Command
        </Text>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          Sign in to access your SOC dashboard, incident feed, and threat intelligence.
        </Text>

        <TouchableOpacity
          style={[styles.loginBtn, { backgroundColor: colors.amber, opacity: signing || isLoading ? 0.7 : 1 }]}
          onPress={handleLogin}
          disabled={signing || isLoading}
          activeOpacity={0.8}
        >
          {signing || isLoading ? (
            <ActivityIndicator color={colors.background} size="small" />
          ) : (
            <>
              <Ionicons name="log-in-outline" size={18} color={colors.background} style={{ marginRight: 8 }} />
              <Text style={[styles.loginBtnText, { color: colors.background, fontFamily: "Inter_600SemiBold" }]}>
                Sign In with Replit
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.securityNote}>
          <Ionicons name="lock-closed" size={12} color={colors.mutedForeground} />
          <Text style={[styles.securityText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Biometric authentication available after sign-in
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginBottom: 24,
  },
  shieldOuter: {
    width: 96,
    height: 96,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(249,115,22,0.06)",
  },
  wordmark: {
    fontSize: 32,
    letterSpacing: 8,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 13,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  divider: {
    width: 48,
    height: 1,
    marginVertical: 28,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 32,
  },
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 52,
    borderRadius: 12,
    marginBottom: 16,
  },
  loginBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  securityText: {
    fontSize: 11,
  },
});
