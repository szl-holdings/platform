import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, type Href } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useQuery } from "@tanstack/react-query";

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? "https://" + process.env.EXPO_PUBLIC_DOMAIN + "/api"
  : "/api";

const ACCENT = "#c87941";

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

interface TerraModule {
  id: string;
  label: string;
  description: string;
  icon: FeatherIconName;
  status?: string;
  statusColor?: string;
  route: Href;
  badge?: string;
  badgeColor?: string;
}

const MODULES: TerraModule[] = [
  {
    id: "rent-roll",
    label: "Rent Roll",
    description: "Tenant ledger, lease status & mark-to-market gap",
    icon: "file-text",
    route: "/(shell)/properties/rent-roll",
    status: "Live",
    statusColor: "#34d399",
  },
  {
    id: "construction-monitor",
    label: "Construction Monitor",
    description: "Project milestones, budget burn & inspection status",
    icon: "tool",
    route: "/(shell)/properties/construction-monitor",
    status: "Active",
    statusColor: "#60a5fa",
    badge: "2 flags",
    badgeColor: "#f59e0b",
  },
  {
    id: "tenant-screening",
    label: "Tenant Screening",
    description: "Credit, background & income verification pipeline",
    icon: "users",
    route: "/(shell)/properties/tenant-screening",
    status: "3 pending",
    statusColor: "#f59e0b",
  },
  {
    id: "lease-abstraction",
    label: "Lease Abstraction",
    description: "AI-extracted lease clauses, critical dates & obligations",
    icon: "clipboard",
    route: "/(shell)/properties/lease-abstraction",
    badge: "AI",
    badgeColor: "#8b5cf6",
  },
  {
    id: "pro-forma",
    label: "Pro Forma Builder",
    description: "IRR, equity multiple & cash-on-cash projections",
    icon: "trending-up",
    route: "/(shell)/properties/pro-forma",
    badge: "Pro",
    badgeColor: ACCENT,
  },
  {
    id: "exchange-1031",
    label: "1031 Exchange",
    description: "Relinquished & replacement property tracker with deadlines",
    icon: "refresh-cw",
    route: "/(shell)/properties/exchange-1031",
    badge: "Tax",
    badgeColor: "#10b981",
  },
  {
    id: "tax-appeal",
    label: "Tax Appeal",
    description: "Assessment history, comparables & appeal filing status",
    icon: "percent",
    route: "/(shell)/properties/tax-appeal",
    badge: "Active",
    badgeColor: "#ef4444",
  },
  {
    id: "waterfall",
    label: "Waterfall Calculator",
    description: "LP / GP distribution waterfalls and promote schedules",
    icon: "dollar-sign",
    route: "/(shell)/properties/waterfall",
    badge: "Finance",
    badgeColor: "#0ea5e9",
  },
];

function MetricPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.metricPill, { borderColor: color + "25", backgroundColor: color + "10" }]}>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function ModuleCard({ module }: { module: TerraModule }) {
  const colors = useColors();

  const handlePress = () => {
    Haptics.selectionAsync();
    router.push(module.route);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.moduleCard,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.75 : 1 },
      ]}
    >
      <View style={[styles.moduleIconWrap, { backgroundColor: ACCENT + "15", borderColor: ACCENT + "25" }]}>
        <Feather name={module.icon} size={18} color={ACCENT} />
      </View>
      <View style={styles.moduleBody}>
        <View style={styles.moduleHeader}>
          <Text style={[styles.moduleLabel, { color: colors.cream }]}>{module.label}</Text>
          {module.badge && (
            <View style={[styles.badge, { backgroundColor: (module.badgeColor ?? "#888") + "20" }]}>
              <Text style={[styles.badgeText, { color: module.badgeColor ?? "#888" }]}>{module.badge}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.moduleDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
          {module.description}
        </Text>
        {module.status && (
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: module.statusColor ?? "#888" }]} />
            <Text style={[styles.statusText, { color: module.statusColor ?? "#888" }]}>{module.status}</Text>
          </View>
        )}
      </View>
      <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
    </Pressable>
  );
}

export default function TerraModulesTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : 90;

  const { data: portfolioSummary } = useQuery({
    queryKey: ["terra-portfolio-summary"],
    queryFn: async () => {
      try {
        const res = await fetch(API_BASE + "/terra/portfolio?limit=5");
        if (!res.ok) return null;
        return res.json();
      } catch { return null; }
    },
    retry: 1,
  });

  const totalProperties = portfolioSummary?.data?.properties?.length ?? portfolioSummary?.properties?.length ?? 14;
  const avgOccupancy = "87%";
  const noi = "$2.1M";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["rgba(200,121,65,0.07)", "transparent"]}
        style={[styles.headerGradient, { height: topPad + 140 }]}
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingTop: topPad + 12 }]}>
          <View>
            <Text style={[styles.eyebrow, { color: ACCENT + "cc" }]}>TERRA · MODULES</Text>
            <Text style={[styles.title, { color: colors.cream }]}>Asset Intelligence</Text>
          </View>
          <View style={[styles.livePill, { borderColor: "#34d399" + "40" }]}>
            <View style={[styles.liveDot, { backgroundColor: "#34d399" }]} />
            <Text style={[styles.liveText, { color: "#34d399" }]}>Live</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.metricsRow}
        >
          <MetricPill label="Properties" value={String(totalProperties)} color={ACCENT} />
          <MetricPill label="Occupancy" value={avgOccupancy} color="#34d399" />
          <MetricPill label="Portfolio NOI" value={noi} color="#60a5fa" />
          <MetricPill label="Active Leases" value="38" color="#a855f7" />
          <MetricPill label="Under Construction" value="3" color="#f59e0b" />
        </ScrollView>

        <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ALL MODULES</Text>
          <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>{MODULES.length} available</Text>
        </View>

        <View style={styles.moduleList}>
          {MODULES.map((mod) => (
            <ModuleCard key={mod.id} module={mod} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { position: "absolute", top: 0, left: 0, right: 0 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  eyebrow: { fontSize: 9, fontFamily: "Inter_500Medium", letterSpacing: 3, marginBottom: 4 },
  title: { fontSize: 20, fontFamily: "Inter_600SemiBold", letterSpacing: -0.3 },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontSize: 10, fontFamily: "Inter_500Medium" },
  metricsRow: { paddingHorizontal: 20, gap: 8, marginBottom: 18 },
  metricPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 90,
    alignItems: "center",
  },
  metricValue: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  metricLabel: { fontSize: 9, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.35)", letterSpacing: 1 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  sectionLabel: { fontSize: 9, fontFamily: "Inter_500Medium", letterSpacing: 2 },
  sectionCount: { fontSize: 10, fontFamily: "Inter_300Light" },
  moduleList: { paddingHorizontal: 16, gap: 8 },
  moduleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  moduleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  moduleBody: { flex: 1 },
  moduleHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 },
  moduleLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 9, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  moduleDesc: { fontSize: 11, fontFamily: "Inter_300Light", lineHeight: 15, marginBottom: 4 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 10, fontFamily: "Inter_500Medium" },
});
