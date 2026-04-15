import React from "react";
import { FlatList, StyleSheet, Text, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWorkspace } from "@/context/WorkspaceContext";
import { CORTEX_COLORS } from "@/constants/colors";
import { WORKSPACE_MAP, type WorkspaceId } from "@/constants/workspaces";

interface FeedItem {
  id: string;
  workspace: WorkspaceId;
  title: string;
  summary: string;
  priority: "critical" | "high" | "normal";
  time: string;
  type: "alert" | "insight" | "action" | "update";
}

const TYPE_ICONS: Record<FeedItem["type"], string> = {
  alert: "🚨",
  insight: "💡",
  action: "⚡",
  update: "📋",
};

const PRIORITY_COLORS: Record<FeedItem["priority"], string> = {
  critical: "#ef4444",
  high: "#f59e0b",
  normal: CORTEX_COLORS.textMuted,
};

const CORTEX_FEED: FeedItem[] = [
  { id: "cf1", workspace: "defense", title: "Critical: Active Intrusion Attempt", summary: "SSH brute-force detected across 3 gateways. SOC team notified. Sentinel recommends IP blocklist update.", priority: "critical", time: "2m ago", type: "alert" },
  { id: "cf2", workspace: "operations", title: "API Latency Spike — Payments", summary: "p99 latency exceeded 2s threshold on payments-service. Auto-scaling triggered. Root cause: DB connection pool exhaustion.", priority: "critical", time: "5m ago", type: "alert" },
  { id: "cf3", workspace: "fleet", title: "MV Oceanus Engine Warning", summary: "Starboard engine temperature 12% above normal. Maintenance window recommended at next port of call (ETA: 14h).", priority: "high", time: "18m ago", type: "alert" },
  { id: "cf4", workspace: "properties", title: "New Deal Match — Industrial Property", summary: "$4.2M industrial property at Harbor District matches pipeline criteria. Cap rate 7.8%, NOI $327K.", priority: "high", time: "30m ago", type: "insight" },
  { id: "cf5", workspace: "portfolio", title: "Q2 Board Meeting Prep", summary: "Board deck draft ready for review. Key metrics: portfolio +3.2% QoQ, 2 new acquisitions pending.", priority: "normal", time: "1h ago", type: "action" },
  { id: "cf6", workspace: "advisory", title: "Strategy Session — Meridian Capital", summary: "New engagement request from Meridian Capital. Initial scope: digital transformation advisory, $2.4M potential.", priority: "high", time: "2h ago", type: "insight" },
  { id: "cf7", workspace: "defense", title: "MITRE Coverage Improvement", summary: "4 new detection rules deployed covering T1566 (Phishing) and T1078 (Valid Accounts). Coverage now at 87%.", priority: "normal", time: "3h ago", type: "update" },
  { id: "cf8", workspace: "founder", title: "Article Published: AI in Maritime Logistics", summary: "New article received 840 views in first 2 hours. Trending on industry feeds.", priority: "normal", time: "4h ago", type: "update" },
  { id: "cf9", workspace: "operations", title: "Cost Optimization Opportunity", summary: "FinOps analysis identified $14K/mo savings potential through reserved instance conversion across 3 accounts.", priority: "normal", time: "6h ago", type: "insight" },
  { id: "cf10", workspace: "fleet", title: "Fleet Fuel Report — Weekly", summary: "Fleet avg consumption down 1.8% vs last week. Top performer: MV Prometheus (efficiency +4.2%).", priority: "normal", time: "8h ago", type: "update" },
];

function FeedCard({ item, onSwitchWorkspace }: { item: FeedItem; onSwitchWorkspace: (id: WorkspaceId) => void }) {
  const ws = WORKSPACE_MAP.get(item.workspace);
  if (!ws) return null;

  return (
    <Pressable style={styles.feedCard} onPress={() => onSwitchWorkspace(item.workspace)}>
      <View style={styles.feedCardHeader}>
        <View style={styles.feedMeta}>
          <Text style={styles.feedTypeIcon}>{TYPE_ICONS[item.type]}</Text>
          <View style={[styles.workspacePill, { backgroundColor: `${ws.accentColor}15`, borderColor: `${ws.accentColor}30` }]}>
            <Text style={{ fontSize: 10 }}>{ws.icon}</Text>
            <Text style={[styles.workspacePillText, { color: ws.accentColor }]}>{ws.shortLabel}</Text>
          </View>
          {item.priority !== "normal" && (
            <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[item.priority] }]} />
          )}
        </View>
        <Text style={styles.feedTime}>{item.time}</Text>
      </View>
      <Text style={styles.feedTitle}>{item.title}</Text>
      <Text style={styles.feedSummary} numberOfLines={2}>{item.summary}</Text>
    </Pressable>
  );
}

export default function CortexFeedScreen() {
  const insets = useSafeAreaInsets();
  const { setActiveWorkspace } = useWorkspace();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>CORTEX</Text>
          <Text style={styles.headerTitle}>Unified Feed</Text>
        </View>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{CORTEX_FEED.filter(f => f.priority === "critical").length} critical</Text>
        </View>
      </View>

      <FlatList
        data={CORTEX_FEED}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16 }}
        renderItem={({ item }) => (
          <FeedCard item={item} onSwitchWorkspace={setActiveWorkspace} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CORTEX_COLORS.bg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerLabel: { fontSize: 11, fontWeight: "700", color: CORTEX_COLORS.gold, letterSpacing: 3 },
  headerTitle: { fontSize: 24, fontWeight: "700", color: CORTEX_COLORS.text },
  headerBadge: { backgroundColor: "rgba(239,68,68,0.15)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: "rgba(239,68,68,0.3)" },
  headerBadgeText: { fontSize: 11, fontWeight: "700", color: "#ef4444" },
  feedCard: { marginBottom: 8, padding: 16, borderRadius: 14, backgroundColor: CORTEX_COLORS.bgCard, borderWidth: 1, borderColor: CORTEX_COLORS.borderLight },
  feedCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  feedMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  feedTypeIcon: { fontSize: 14 },
  workspacePill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  workspacePillText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  priorityDot: { width: 6, height: 6, borderRadius: 3 },
  feedTime: { fontSize: 11, color: CORTEX_COLORS.textMuted },
  feedTitle: { fontSize: 15, fontWeight: "600", color: CORTEX_COLORS.text, marginBottom: 4 },
  feedSummary: { fontSize: 13, color: CORTEX_COLORS.textSecondary, lineHeight: 18 },
});
