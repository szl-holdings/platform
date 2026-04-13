import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { IntelligenceFeed } from "@szl-holdings/mobile-ai";

const ACCENT = "#f59e0b";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;
  return process.env.EXPO_PUBLIC_API_URL ?? "";
}

export default function IntelFeedScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  return (
    <View style={[styles.container, { backgroundColor: colors.background ?? "#0a0a0a" }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: ACCENT + "30" }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.accentDot, { backgroundColor: ACCENT }]} />
          <View>
            <Text style={[styles.screenTitle, { color: ACCENT }]}>Unified Intel</Text>
            <Text style={styles.screenSubtitle}>Cross-domain signal aggregation · Lyte</Text>
          </View>
        </View>
      </View>
      <IntelligenceFeed
        apiBaseUrl={getApiBase()}

        currentDomain="energy"
        accentColor={ACCENT}
        maxItems={30}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  accentDot: { width: 8, height: 8, borderRadius: 4 },
  screenTitle: { fontSize: 16, fontWeight: "700" },
  screenSubtitle: { fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 2 },
});
