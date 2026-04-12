import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { VaultMode } from "@/components/VaultMode";
import { VoiceCommandOverlay } from "@/components/VoiceCommandOverlay";
import { CommandPalette } from "@/components/CommandPalette";
import { useShakeGesture } from "@/hooks/useShakeGesture";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useApiStatus } from "@/hooks/useApiStatus";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { NotificationBell } from "@/components/NotificationCenter";

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";

type EngagementStage = { phase: string; status: "complete" | "active" | "upcoming"; dates: string };
type KpiCard = { label: string; value: string; sub: string };
type ActivityItem = { id: number | string; type: string; title: string; time: string; icon: string };

function KpiCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, friction: 10 }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 10 }).start();
  };

  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={() => Haptics.selectionAsync()}
    >
      <Animated.View
        style={[
          styles.kpiCard,
          { borderColor: colors.goldBorder, transform: [{ scale }] },
        ]}
      >
        <Text style={[styles.kpiLabel, { color: colors.creamDim }]}>{label}</Text>
        <Text style={[styles.kpiValue, { color: colors.cream }]}>{value}</Text>
        <Text style={[styles.kpiSub, { color: colors.mutedForeground }]}>{sub}</Text>
      </Animated.View>
    </Pressable>
  );
}

function TimelineItem({
  phase,
  status,
  dates,
  isLast,
}: {
  phase: string;
  status: "complete" | "active" | "upcoming";
  dates: string;
  isLast: boolean;
}) {
  const colors = useColors();

  const dotColor =
    status === "complete"
      ? "rgba(200,169,106,0.25)"
      : status === "active"
      ? "rgba(200,169,106,0.4)"
      : "rgba(245,240,232,0.05)";

  const iconName = status === "complete" ? "check" : status === "active" ? "arrow-right" : "clock";
  const iconColor =
    status === "complete" || status === "active" ? colors.gold : "rgba(245,240,232,0.2)";

  const textColor =
    status === "active"
      ? "rgba(245,240,232,0.9)"
      : status === "complete"
      ? "rgba(245,240,232,0.45)"
      : "rgba(245,240,232,0.2)";

  return (
    <View style={styles.timelineItem}>
      <View style={styles.timelineLeft}>
        <View
          style={[
            styles.timelineDot,
            {
              backgroundColor: dotColor,
              borderColor: status === "active" ? colors.goldBorder : "transparent",
              borderWidth: status === "active" ? 1 : 0,
            },
          ]}
        >
          <Feather name={iconName as any} size={10} color={iconColor} />
        </View>
        {!isLast && (
          <View
            style={[
              styles.timelineLine,
              {
                backgroundColor:
                  status === "complete"
                    ? "rgba(200,169,106,0.15)"
                    : "rgba(245,240,232,0.04)",
              },
            ]}
          />
        )}
      </View>
      <View style={styles.timelineContent}>
        <Text style={[styles.timelinePhase, { color: textColor }]}>{phase}</Text>
        <Text style={[styles.timelineDates, { color: colors.mutedForeground }]}>{dates}</Text>
      </View>
    </View>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      onPressIn={() =>
        Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, friction: 10 }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 10 }).start()
      }
    >
      <Animated.View
        style={[
          styles.activityRow,
          { borderBottomColor: colors.creamFaint, transform: [{ scale }] },
        ]}
      >
        <View style={[styles.activityIcon, { backgroundColor: colors.goldDim }]}>
          <Feather name={item.icon as any} size={14} color={colors.gold} />
        </View>
        <View style={styles.activityText}>
          <Text style={[styles.activityTitle, { color: colors.cream }]}>{item.title}</Text>
          <Text style={[styles.activityTime, { color: colors.mutedForeground }]}>{item.time}</Text>
        </View>
        <Feather name="chevron-right" size={14} color="rgba(245,240,232,0.15)" />
      </Animated.View>
    </Pressable>
  );
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, isLoading: authLoading } = useAuth();
  const { isOffline, isDegraded } = useApiStatus();
  const [refreshing, setRefreshing] = useState(false);
  const [vaultVisible, setVaultVisible] = useState(false);
  const [voiceVisible, setVoiceVisible] = useState(false);
  const [paletteVisible, setPaletteVisible] = useState(false);

  useShakeGesture({ onShake: () => setPaletteVisible(true) });

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const displayName = user?.displayName ?? "Client";

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : 90;

  const { data: dashboardData, isLoading: dashLoading, isError: dashError, refetch } = useQuery({
    queryKey: ["carlota-dashboard"],
    queryFn: async () => {
      const res = await fetch(API_BASE + "/carlotajo/dashboard");
      if (!res.ok) throw new Error("fetch failed");
      const json = await res.json();
      return json.data ?? json;
    },
    retry: 1,
  });

  const kpiCards: KpiCard[] = dashboardData?.kpis ?? [];
  const engagementStages: EngagementStage[] = dashboardData?.engagementStages ?? [];
  const recentActivity: ActivityItem[] = dashboardData?.recentActivity ?? [];
  const engagementPhase: string = dashboardData?.currentPhase ?? "Onboarding";

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {(isOffline || isDegraded) && (
        <View style={{ backgroundColor: isOffline ? "#7f1d1d" : "#78350f", paddingHorizontal: 16, paddingVertical: 8 }}>
          <Text style={{ color: "#fca5a5", fontSize: 11, fontWeight: "600" }}>
            {isOffline ? "Offline — advisory data may be stale" : "Connection degraded — retrying…"}
          </Text>
        </View>
      )}
      <LinearGradient
        colors={["rgba(200,169,106,0.05)", "transparent"]}
        style={[styles.headerGradient, { height: topPad + 120 }]}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topPad + 16, paddingBottom: bottomPad },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.gold}
          />
        }
      >
        <View style={styles.greeting}>
          <View style={styles.greetingHeaderRow}>
            <Text style={[styles.greetingEyebrow, { color: colors.goldSubtle }]}>
              CLIENT PORTAL
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Pressable
                style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(232,121,249,0.1)", borderWidth: 1, borderColor: "rgba(232,121,249,0.3)", borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5 }}
                onPress={() => setVaultVisible(true)}
              >
                <Feather name="lock" size={12} color="#e879f9" />
                <Text style={{ fontSize: 11, color: "#e879f9", fontFamily: "Inter_600SemiBold" }}>Vault</Text>
              </Pressable>
              <Pressable
                style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: "rgba(232,121,249,0.08)", borderWidth: 1, borderColor: "rgba(232,121,249,0.25)", alignItems: "center", justifyContent: "center" }}
                onPress={() => setVoiceVisible(true)}
              >
                <Feather name="mic" size={13} color="#e879f9" />
              </Pressable>
              <NotificationBell size={18} />
            </View>
          </View>
          {authLoading ? (
            <View style={{ gap: 8 }}>
              <SkeletonLoader width="60%" height={20} />
              <SkeletonLoader width="80%" height={30} />
            </View>
          ) : (
            <Text style={[styles.greetingName, { color: colors.cream }]}>
              {greeting},{"\n"}{displayName}
            </Text>
          )}
          <Text style={[styles.greetingStatus, { color: colors.mutedForeground }]}>
            Active engagement · {engagementPhase}
          </Text>
        </View>

        {dashLoading ? (
          <View style={{ paddingVertical: 24, alignItems: "center" }}>
            <ActivityIndicator color={colors.gold} />
          </View>
        ) : (
          <>
            {kpiCards.length > 0 && (
              <View style={styles.kpiGrid}>
                {kpiCards.map((kpi) => (
                  <View key={kpi.label} style={styles.kpiCol}>
                    <KpiCard {...kpi} />
                  </View>
                ))}
              </View>
            )}

            {engagementStages.length > 0 && (
              <View style={[styles.section, { borderTopColor: colors.creamFaint }]}>
                <Text style={[styles.sectionLabel, { color: colors.goldSubtle }]}>
                  ENGAGEMENT TIMELINE
                </Text>
                <View style={styles.timeline}>
                  {engagementStages.map((stage, i) => (
                    <TimelineItem
                      key={stage.phase}
                      {...stage}
                      isLast={i === engagementStages.length - 1}
                    />
                  ))}
                </View>
              </View>
            )}

            {recentActivity.length > 0 && (
              <View style={[styles.section, { borderTopColor: colors.creamFaint }]}>
                <Text style={[styles.sectionLabel, { color: colors.goldSubtle }]}>
                  RECENT ACTIVITY
                </Text>
                <View style={[styles.activityList, { borderColor: colors.creamFaint }]}>
                  {recentActivity.map((item) => (
                    <ActivityRow key={item.id} item={item} />
                  ))}
                </View>
              </View>
            )}

            {dashError ? (
              <View style={{ paddingVertical: 32, alignItems: "center", gap: 8 }}>
                <Feather name="wifi-off" size={24} color={colors.mutedForeground} />
                <Text style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: "Inter_300Light", marginTop: 4 }}>
                  Could not reach server
                </Text>
                <Pressable onPress={() => refetch()} style={{ marginTop: 4 }}>
                  <Text style={{ color: colors.gold, fontSize: 12, fontFamily: "Inter_400Regular" }}>Tap to retry</Text>
                </Pressable>
              </View>
            ) : kpiCards.length === 0 && engagementStages.length === 0 && recentActivity.length === 0 && (
              <View style={{ paddingVertical: 32, alignItems: "center" }}>
                <Feather name="inbox" size={24} color={colors.mutedForeground} />
                <Text style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: "Inter_300Light", marginTop: 8 }}>
                  No engagement data yet
                </Text>
              </View>
            )}
          </>
        )}

        {(dashboardData?.properties ?? []).length > 0 && (
          <View style={[styles.section, { borderTopColor: colors.creamFaint }]}>
            <Text style={[styles.sectionLabel, { color: colors.goldSubtle }]}>
              YOUR PROPERTIES
            </Text>
            {(dashboardData.properties as Array<{ name: string; location: string; status: string }>).map((prop) => (
              <Pressable key={prop.name}>
                <View style={[styles.propertyCard, { borderColor: colors.creamFaint }]}>
                  <Text style={[styles.propertyName, { color: "rgba(245,240,232,0.75)" }]}>
                    {prop.name}
                  </Text>
                  <Text style={[styles.propertyLocation, { color: colors.goldSubtle }]}>
                    {prop.location}
                  </Text>
                  <Text style={[styles.propertyStatus, { color: colors.mutedForeground }]}>
                    {prop.status}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <VaultMode
        visible={vaultVisible}
        onExit={() => setVaultVisible(false)}
      />

      <VoiceCommandOverlay
        visible={voiceVisible}
        onClose={() => setVoiceVisible(false)}
        onCommand={(text) => {
          const lower = text.toLowerCase();
          if (lower.includes("vault")) setVaultVisible(true);
        }}
        appName="Carlota Jo"
        accentColor="#e879f9"
        suggestions={["Open Vault Mode", "Show my engagements"]}
      />

      <CommandPalette
        visible={paletteVisible}
        onClose={() => setPaletteVisible(false)}
        commands={[
          { id: "vault", label: "Vault Mode", subtitle: "Secure client notes & NDA documents", icon: "lock", tags: ["vault", "secure"], action: () => setVaultVisible(true) },
          { id: "voice", label: "Voice Command", subtitle: "Speak to navigate", icon: "mic", tags: ["voice"], action: () => setVoiceVisible(true) },
        ]}
        accentColor="#e879f9"
        placeholder="Search Carlota Jo commands…"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  greeting: { marginBottom: 28 },
  greetingHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  greetingEyebrow: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    letterSpacing: 3,
  },
  greetingName: {
    fontSize: 28,
    fontFamily: "CormorantGaramond_400Regular",
    lineHeight: 36,
    marginBottom: 6,
  },
  greetingStatus: {
    fontSize: 12,
    fontFamily: "Inter_300Light",
    letterSpacing: 0.3,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  kpiCol: { width: "48.5%" },
  kpiCard: {
    borderWidth: 1,
    padding: 16,
  },
  kpiLabel: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  kpiValue: {
    fontSize: 22,
    fontFamily: "CormorantGaramond_400Regular",
    marginBottom: 4,
  },
  kpiSub: {
    fontSize: 10,
    fontFamily: "Inter_300Light",
  },
  section: {
    borderTopWidth: 1,
    paddingTop: 20,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    letterSpacing: 3,
    marginBottom: 16,
  },
  timeline: { gap: 0 },
  timelineItem: {
    flexDirection: "row",
    gap: 12,
  },
  timelineLeft: {
    alignItems: "center",
    width: 20,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  timelineLine: {
    width: 1,
    flex: 1,
    minHeight: 32,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 12,
    paddingTop: 2,
  },
  timelinePhase: {
    fontSize: 13,
    fontFamily: "Inter_300Light",
    marginBottom: 2,
  },
  timelineDates: {
    fontSize: 10,
    fontFamily: "Inter_300Light",
  },
  activityList: {
    borderWidth: 1,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
  },
  activityIcon: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  activityText: { flex: 1 },
  activityTitle: {
    fontSize: 13,
    fontFamily: "Inter_300Light",
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 10,
    fontFamily: "Inter_300Light",
  },
  propertyCard: {
    borderWidth: 1,
    padding: 16,
    marginBottom: 8,
  },
  propertyName: {
    fontSize: 14,
    fontFamily: "Inter_300Light",
    marginBottom: 4,
  },
  propertyLocation: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  propertyStatus: {
    fontSize: 10,
    fontFamily: "Inter_300Light",
  },
});
