import React, { useCallback } from "react";
import { View, StyleSheet, Text, TouchableOpacity, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { BriefingCard, useProactiveBriefing, useContextualAwareness, useAmbientBackground } from "@szl-holdings/mobile-ai";

const ACCENT = "#8b5cf6";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;
  return process.env.EXPO_PUBLIC_API_URL ?? "";
}

export default function BriefingScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();


  const { context } = useContextualAwareness([
    {
      domain: "advisory",
      morningBriefingEnabled: true,
      eveningDigestEnabled: true,
      proximityTriggers: [
        { label: "Client District", latRange: [25.7, 26.0], lonRange: [-80.3, -80.1], relevance: 0.85, reason: "Near client zone — meeting prep activated" },
      ],
    },
  ]);

  const { briefing, isLoading, refresh } = useProactiveBriefing({
    domain: "advisory",
    apiBaseUrl: getApiBase(),

    accentColor: ACCENT,
  });

  const { sendDomainAlert } = useAmbientBackground({ domain: "advisory", accentColor: ACCENT });

  const handleRefresh = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    refresh();
  }, [refresh]);

  const timeLabel = context.briefingWindow !== "none"
    ? context.briefingWindow === "morning" ? "Client Day Prep" : "Client Engagement Digest"
    : "Advisory Intelligence Brief";

  return (
    <View style={[styles.container, { backgroundColor: colors.background ?? "#0a0a0a" }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: ACCENT + "30" }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.accentDot, { backgroundColor: ACCENT }]} />
          <View>
            <Text style={[styles.screenTitle, { color: ACCENT }]}>{timeLabel}</Text>
            <Text style={styles.screenSubtitle}>
              Carlota Jo · Advisory Intelligence
              {context.activeSignals.length > 0 ? ` · Client zone` : ""}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleRefresh} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <Feather name="refresh-cw" size={18} color={ACCENT} />
        </TouchableOpacity>
      </View>

      {context.activeSignals.length > 0 && (
        <View style={[styles.contextBanner, { borderColor: ACCENT + "30", backgroundColor: ACCENT + "0a" }]}>
          <Feather name="briefcase" size={12} color={ACCENT} />
          <Text style={[styles.contextBannerText, { color: ACCENT }]}>{context.activeSignals[0]!.reason}</Text>
        </View>
      )}

      <BriefingCard
        briefing={briefing}
        isLoading={isLoading}
        accentColor={ACCENT}
        onRefresh={handleRefresh}
        onActionPress={(action) => { sendDomainAlert(action.label, action.description, "medium"); }}
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
  contextBanner: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1 },
  contextBannerText: { fontSize: 11, fontWeight: "500" },
});
