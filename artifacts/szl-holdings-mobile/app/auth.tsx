import React, { useEffect } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function AuthScreen() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["rgba(201,168,76,0.08)", "transparent"]}
        style={[styles.gradient, { height: 300 }]}
      />

      <View style={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]}>
        <View style={styles.brand}>
          <View style={styles.logoMark}>
            <Text style={[styles.logoText, { color: colors.gold }]}>SZL</Text>
          </View>
          <Text style={[styles.companyName, { color: colors.cream }]}>SZL Holdings</Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
            Executive Command Center
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.features}>
          {[
            "Portfolio performance at a glance",
            "Alloy workflow orchestration",
            "Investor relations & documents",
            "Trust center & compliance",
          ].map((f) => (
            <View key={f} style={styles.featureRow}>
              <View style={[styles.featureDot, { backgroundColor: colors.gold }]} />
              <Text style={[styles.featureText, { color: colors.creamDim }]}>{f}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          {isLoading ? (
            <ActivityIndicator color={colors.gold} />
          ) : (
            <Pressable
              onPress={login}
              style={({ pressed }) => [
                styles.loginBtn,
                {
                  backgroundColor: pressed ? "rgba(201,168,76,0.15)" : "rgba(201,168,76,0.1)",
                  borderColor: colors.goldBorder,
                },
              ]}
            >
              <Text style={[styles.loginBtnText, { color: colors.gold }]}>Sign In</Text>
            </Pressable>
          )}
          <Text style={[styles.disclaimer, { color: "rgba(240,238,255,0.2)" }]}>
            Restricted access · SZL Holdings principals only
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "space-between",
  },
  brand: {
    alignItems: "center",
    gap: 12,
  },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "rgba(201,168,76,0.08)",
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  logoText: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 3,
  },
  companyName: {
    fontSize: 28,
    fontFamily: "Inter_300Light",
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(201,168,76,0.1)",
    marginVertical: 8,
  },
  features: {
    gap: 14,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  featureText: {
    fontSize: 14,
    fontFamily: "Inter_300Light",
    letterSpacing: 0.2,
  },
  footer: {
    gap: 16,
    alignItems: "center",
  },
  loginBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  loginBtnText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  disclaimer: {
    fontSize: 11,
    fontFamily: "Inter_300Light",
    textAlign: "center",
  },
});
