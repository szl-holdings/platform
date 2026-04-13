import React from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { IntelligenceFeed } from "@szl-holdings/mobile-ai";

const ACCENT = "#c9a84c";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;
  return process.env.EXPO_PUBLIC_API_URL ?? "";
}

export default function IntelFeedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: ACCENT + "30" }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <Feather name="arrow-left" size={20} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={[styles.accentDot, { backgroundColor: ACCENT }]} />
          <Text style={[styles.screenTitle, { color: ACCENT }]}>Unified Intel Feed</Text>
        </View>
        <View style={{ width: 20 }} />
      </View>
      <IntelligenceFeed
        apiBaseUrl={getApiBase()}
        currentDomain="executive"
        accentColor={ACCENT}
        maxItems={40}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 8 },
  accentDot: { width: 8, height: 8, borderRadius: 4 },
  screenTitle: { fontSize: 16, fontWeight: "700" },
});
