import React from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useAuth } from "@/context/AuthContext";
import { CORTEX_COLORS } from "@/constants/colors";

const DEMO_METRICS: Record<string, { label: string; value: string; delta: string; up: boolean }[]> = {
  defense: [
    { label: "Threat Level", value: "ELEVATED", delta: "+2 events", up: true },
    { label: "Active Incidents", value: "7", delta: "-3 from avg", up: false },
    { label: "SOC Agents", value: "12 active", delta: "100% online", up: true },
    { label: "MITRE Coverage", value: "87%", delta: "+4% this week", up: true },
  ],
  fleet: [
    { label: "Active Vessels", value: "24", delta: "3 in port", up: true },
    { label: "Fuel Efficiency", value: "94.2%", delta: "+1.8% MTD", up: true },
    { label: "ETA Accuracy", value: "97.1%", delta: "-0.3%", up: false },
    { label: "Alerts", value: "5", delta: "2 critical", up: true },
  ],
  properties: [
    { label: "Active Deals", value: "18", delta: "+3 this month", up: true },
    { label: "Pipeline Value", value: "$142M", delta: "+$12M", up: true },
    { label: "Properties Tracked", value: "847", delta: "+26 new", up: true },
    { label: "Market Score", value: "78/100", delta: "+5 pts", up: true },
  ],
  operations: [
    { label: "Service Health", value: "99.7%", delta: "-0.1%", up: false },
    { label: "Active Signals", value: "14", delta: "3 critical", up: true },
    { label: "Deployments", value: "8 today", delta: "all green", up: true },
    { label: "Cost Efficiency", value: "92%", delta: "+4%", up: true },
  ],
  advisory: [
    { label: "Active Clients", value: "12", delta: "+2 this quarter", up: true },
    { label: "Sessions This Week", value: "8", delta: "+3 vs avg", up: true },
    { label: "Revenue MTD", value: "$84K", delta: "+18%", up: true },
    { label: "Satisfaction", value: "4.9/5", delta: "+0.2", up: true },
  ],
  portfolio: [
    { label: "Portfolio Value", value: "$2.4B", delta: "+3.2% QoQ", up: true },
    { label: "Active Entities", value: "23", delta: "all compliant", up: true },
    { label: "Capital Deployed", value: "$180M", delta: "YTD", up: true },
    { label: "ROI", value: "24.7%", delta: "+2.1%", up: true },
  ],
  founder: [
    { label: "Published Articles", value: "47", delta: "+3 this month", up: true },
    { label: "Active Ventures", value: "6", delta: "1 new seed", up: true },
    { label: "Speaking Events", value: "4 upcoming", delta: "2 confirmed", up: true },
    { label: "Network Reach", value: "12.4K", delta: "+840", up: true },
  ],
};

export default function CommandScreen() {
  const insets = useSafeAreaInsets();
  const { config, activeWorkspace } = useWorkspace();
  const { user } = useAuth();
  const metrics = DEMO_METRICS[activeWorkspace] ?? DEMO_METRICS.portfolio;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: insets.top + 60, paddingBottom: 120 }}>
      <View style={styles.heroSection}>
        <Text style={[styles.workspaceLabel, { color: config.accentColor }]}>
          {config.icon} {config.label.toUpperCase()}
        </Text>
        <Text style={styles.greeting}>
          Welcome back{user?.displayName ? `, ${user.displayName.split(" ")[0]}` : ""}
        </Text>
        <Text style={styles.timestamp}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </Text>
      </View>

      <View style={styles.metricsGrid}>
        {metrics.map((m, i) => (
          <View key={i} style={[styles.metricCard, { borderColor: `${config.accentColor}15` }]}>
            <Text style={styles.metricLabel}>{m.label}</Text>
            <Text style={[styles.metricValue, { color: config.accentColor }]}>{m.value}</Text>
            <Text style={[styles.metricDelta, { color: m.up ? CORTEX_COLORS.success : CORTEX_COLORS.warning }]}>
              {m.up ? "▲" : "▼"} {m.delta}
            </Text>
          </View>
        ))}
      </View>

      <Pressable style={[styles.switcherHint, { borderColor: `${config.accentColor}30` }]} onPress={() => router.push("/workspace-switcher")}>
        <Text style={styles.switcherHintText}>
          {config.icon}  Switch to another workspace
        </Text>
        <Text style={[styles.switcherArrow, { color: config.accentColor }]}>→</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CORTEX_COLORS.bg },
  heroSection: { paddingHorizontal: 20, marginBottom: 24 },
  workspaceLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 3, marginBottom: 8 },
  greeting: { fontSize: 28, fontWeight: "700", color: CORTEX_COLORS.text },
  timestamp: { fontSize: 13, color: CORTEX_COLORS.textMuted, marginTop: 4 },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 8 },
  metricCard: { width: "48%", flexGrow: 1, backgroundColor: CORTEX_COLORS.bgCard, borderRadius: 16, padding: 16, borderWidth: 1 },
  metricLabel: { fontSize: 12, color: CORTEX_COLORS.textMuted, marginBottom: 6 },
  metricValue: { fontSize: 22, fontWeight: "700" },
  metricDelta: { fontSize: 11, marginTop: 4 },
  switcherHint: { marginHorizontal: 20, marginTop: 24, flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderRadius: 12, borderWidth: 1, backgroundColor: CORTEX_COLORS.bgCard },
  switcherHintText: { fontSize: 14, color: CORTEX_COLORS.textSecondary },
  switcherArrow: { fontSize: 18, fontWeight: "700" },
});
