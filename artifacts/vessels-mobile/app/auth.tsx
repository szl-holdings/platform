import React from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect } from "expo-router";
import { VesselIcon, featherIcon } from "@/components/VesselIcon";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

const FEATURES: Array<{ icon: string; label: string }> = [
  { icon: "map", label: "Real-time fleet tracking with SVG map" },
  { icon: "shield", label: "Sanctions & compliance R/Y/G dashboard" },
  { icon: "eye-off", label: "Dark vessel AIS blackout detection" },
  { icon: "trending-up", label: "Voyage economics & TCE analytics" },
  { icon: "bell", label: "Live push notifications for critical alerts" },
  { icon: "wifi-off", label: "Offline mode for at-sea operations" },
];

export default function AuthScreen() {
  const colors = useColors();
  const { isAuthenticated, isLoading, login } = useAuth();

  if (isAuthenticated) return <Redirect href="/(tabs)" />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.content}>
        <View style={[styles.logoWrap, { backgroundColor: colors.primaryDim, borderColor: colors.primaryBorder }]}>
          <VesselIcon name="anchor" size={36} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Vessels</Text>
        <Text style={[styles.subtitle, { color: colors.primary }]}>Fleet Command on the Move</Text>
        <Text style={[styles.desc, { color: colors.textDim }]}>
          Maritime intelligence for fleet managers, captains, and operators. Track your vessels, monitor compliance, and command the seas.
        </Text>

        <View style={styles.features}>
          {FEATURES.map(f => (
            <View key={f.label} style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: colors.primaryDim }]}>
                <VesselIcon name={featherIcon(f.icon)} size={12} color={colors.primary} />
              </View>
              <Text style={[styles.featureLabel, { color: colors.textDim }]}>{f.label}</Text>
            </View>
          ))}
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <TouchableOpacity
            onPress={login}
            style={[styles.loginBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
          >
            <VesselIcon name="log-in" size={18} color={colors.bg} />
            <Text style={[styles.loginText, { color: colors.bg }]}>Sign In to Vessels</Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.footer, { color: colors.textFaint }]}>
          Vessels Maritime Intelligence · Powered by SZL Holdings
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1, justifyContent: "center", alignItems: "center",
    paddingHorizontal: 32, gap: 16,
  },
  logoWrap: {
    width: 80, height: 80, borderRadius: 24,
    justifyContent: "center", alignItems: "center",
    borderWidth: 1, marginBottom: 8,
  },
  title: { fontSize: 32, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 14, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  desc: {
    fontSize: 13, textAlign: "center", lineHeight: 20,
    fontFamily: "Inter_400Regular",
  },
  features: { alignSelf: "stretch", gap: 10, marginVertical: 8 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureIcon: { width: 28, height: 28, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  featureLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  loginBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16,
    alignSelf: "stretch", justifyContent: "center",
  },
  loginText: { fontSize: 16, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  footer: { fontSize: 11, textAlign: "center", fontFamily: "Inter_400Regular", marginTop: 8 },
});
