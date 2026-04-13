import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import type { DomainBriefing, BriefingAnomaly, BriefingAction } from "./useProactiveBriefing";

export interface BriefingCardProps {
  briefing: DomainBriefing | null;
  isLoading: boolean;
  accentColor: string;
  onRefresh?: () => void;
  onActionPress?: (action: BriefingAction) => void;
  onAnomalyPress?: (anomaly: BriefingAnomaly) => void;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#f59e0b",
  low: "#22c55e",
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "#ef4444",
  high: "#f59e0b",
  medium: "#3b82f6",
};

function MetricCard({ label, value, change, changeDirection, accent }: {
  label: string;
  value: string;
  change?: string;
  changeDirection?: "up" | "down" | "neutral";
  accent?: string;
}) {
  const color = accent ?? "rgba(255,255,255,0.85)";
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label.toUpperCase()}</Text>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      {change && (
        <View style={styles.metricChange}>
          {changeDirection === "up" && <Feather name="trending-up" size={10} color="#22c55e" />}
          {changeDirection === "down" && <Feather name="trending-down" size={10} color="#ef4444" />}
          <Text style={[
            styles.metricChangeText,
            { color: changeDirection === "up" ? "#22c55e" : changeDirection === "down" ? "#ef4444" : "rgba(255,255,255,0.4)" }
          ]}>{change}</Text>
        </View>
      )}
    </View>
  );
}

function AnomalyRow({ anomaly, onPress, accentColor }: {
  anomaly: BriefingAnomaly;
  onPress?: (a: BriefingAnomaly) => void;
  accentColor: string;
}) {
  const color = SEVERITY_COLORS[anomaly.severity] ?? "#f59e0b";
  return (
    <TouchableOpacity
      style={[styles.anomalyRow, { borderLeftColor: color }]}
      onPress={() => onPress?.(anomaly)}
      activeOpacity={0.75}
    >
      <View style={styles.anomalyHeader}>
        <View style={[styles.severityBadge, { backgroundColor: color + "22", borderColor: color + "44" }]}>
          <Text style={[styles.severityText, { color }]}>{anomaly.severity.toUpperCase()}</Text>
        </View>
        <Text style={styles.anomalyTime}>{new Date(anomaly.detectedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
      </View>
      <Text style={styles.anomalyTitle}>{anomaly.title}</Text>
      <Text style={styles.anomalyDesc} numberOfLines={2}>{anomaly.description}</Text>
    </TouchableOpacity>
  );
}

function ActionRow({ action, onPress }: {
  action: BriefingAction;
  onPress?: (a: BriefingAction) => void;
}) {
  const color = PRIORITY_COLORS[action.priority] ?? "#3b82f6";
  const handlePress = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => {});
    }
    onPress?.(action);
  }, [action, onPress]);

  return (
    <TouchableOpacity style={styles.actionRow} onPress={handlePress} activeOpacity={0.75}>
      <View style={[styles.actionDot, { backgroundColor: color }]} />
      <View style={styles.actionContent}>
        <Text style={styles.actionLabel}>{action.label}</Text>
        <Text style={styles.actionDesc} numberOfLines={1}>{action.description}</Text>
      </View>
      <Feather name="chevron-right" size={14} color="rgba(255,255,255,0.2)" />
    </TouchableOpacity>
  );
}

export function BriefingCard({
  briefing,
  isLoading,
  accentColor,
  onRefresh,
  onActionPress,
  onAnomalyPress,
}: BriefingCardProps) {
  const handleRefresh = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onRefresh?.();
  }, [onRefresh]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={accentColor} />
        <Text style={[styles.loadingText, { color: accentColor }]}>Generating briefing…</Text>
        <Text style={styles.loadingSubtext}>Analyzing domain signals</Text>
      </View>
    );
  }

  if (!briefing) {
    return (
      <View style={styles.emptyContainer}>
        <Feather name="sunrise" size={32} color={accentColor + "60"} />
        <Text style={[styles.emptyTitle, { color: accentColor }]}>No Briefing Yet</Text>
        <Text style={styles.emptySubtext}>Tap refresh to generate your intelligence briefing</Text>
        <TouchableOpacity style={[styles.refreshBtn, { borderColor: accentColor + "50" }]} onPress={handleRefresh}>
          <Feather name="refresh-cw" size={14} color={accentColor} />
          <Text style={[styles.refreshBtnText, { color: accentColor }]}>Generate Briefing</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerSection}>
        <View style={styles.headerTop}>
          <View style={[styles.typeBadge, { backgroundColor: briefing.type === "morning" ? accentColor + "22" : "#7c3aed22", borderColor: briefing.type === "morning" ? accentColor + "44" : "#7c3aed44" }]}>
            <Text style={[styles.typeBadgeText, { color: briefing.type === "morning" ? accentColor : "#a78bfa" }]}>
              {briefing.type === "morning" ? "☀ MORNING BRIEF" : "🌙 EVENING DIGEST"}
            </Text>
          </View>
          <TouchableOpacity onPress={handleRefresh} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <Feather name="refresh-cw" size={14} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>
        </View>
        <Text style={[styles.headline, { color: accentColor }]}>{briefing.headline}</Text>
        <Text style={styles.summary}>{briefing.summary}</Text>
        <View style={styles.freshnessRow}>
          <View style={[styles.freshnessDot, {
            backgroundColor: briefing.dataFreshness === "live" ? "#22c55e" : briefing.dataFreshness === "cached" ? "#f59e0b" : "#ef4444"
          }]} />
          <Text style={styles.freshnessText}>
            {briefing.dataFreshness === "live" ? "Live data" : briefing.dataFreshness === "cached" ? "Cached" : "Stale"} · {new Date(briefing.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
      </View>

      <View style={styles.metricsGrid}>
        {briefing.metrics.map((m, i) => (
          <MetricCard key={i} {...m} />
        ))}
      </View>

      {briefing.anomalies.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ANOMALIES DETECTED</Text>
          {briefing.anomalies.map(a => (
            <AnomalyRow key={a.id} anomaly={a} onPress={onAnomalyPress} accentColor={accentColor} />
          ))}
        </View>
      )}

      {briefing.recommendedActions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RECOMMENDED ACTIONS</Text>
          {briefing.recommendedActions.map(a => (
            <ActionRow key={a.id} action={a} onPress={onActionPress} />
          ))}
        </View>
      )}

      {briefing.anomalies.length === 0 && briefing.recommendedActions.length === 0 && (
        <View style={styles.allClearContainer}>
          <Feather name="check-circle" size={28} color="#22c55e80" />
          <Text style={styles.allClearText}>No anomalies detected</Text>
          <Text style={styles.allClearSubtext}>All systems operating within normal parameters</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 20, paddingBottom: 32 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingVertical: 60 },
  loadingText: { fontSize: 14, fontWeight: "600" },
  loadingSubtext: { fontSize: 12, color: "rgba(255,255,255,0.4)" },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptySubtext: { fontSize: 12, color: "rgba(255,255,255,0.4)", textAlign: "center", maxWidth: 260 },
  refreshBtn: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, marginTop: 8 },
  refreshBtnText: { fontSize: 13, fontWeight: "600" },
  headerSection: { gap: 10 },
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  typeBadge: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  typeBadgeText: { fontSize: 9, fontWeight: "700", letterSpacing: 1 },
  headline: { fontSize: 20, fontWeight: "700", lineHeight: 28 },
  summary: { fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 20 },
  freshnessRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  freshnessDot: { width: 6, height: 6, borderRadius: 3 },
  freshnessText: { fontSize: 10, color: "rgba(255,255,255,0.35)" },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metricCard: {
    width: "47%",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 14,
    gap: 6,
  },
  metricLabel: { fontSize: 9, color: "rgba(255,255,255,0.35)", fontWeight: "700", letterSpacing: 1 },
  metricValue: { fontSize: 22, fontWeight: "700" },
  metricChange: { flexDirection: "row", alignItems: "center", gap: 4 },
  metricChangeText: { fontSize: 10, fontWeight: "600" },
  section: { gap: 10 },
  sectionTitle: { fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: "700", letterSpacing: 1.2 },
  anomalyRow: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderLeftWidth: 3,
    padding: 12,
    gap: 6,
  },
  anomalyHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  severityBadge: { borderRadius: 4, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2 },
  severityText: { fontSize: 8, fontWeight: "700", letterSpacing: 0.8 },
  anomalyTime: { fontSize: 10, color: "rgba(255,255,255,0.3)", marginLeft: "auto" },
  anomalyTitle: { fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: "600" },
  anomalyDesc: { fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 16 },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    padding: 12,
  },
  actionDot: { width: 8, height: 8, borderRadius: 4 },
  actionContent: { flex: 1, gap: 2 },
  actionLabel: { fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: "600" },
  actionDesc: { fontSize: 11, color: "rgba(255,255,255,0.4)" },
  allClearContainer: { alignItems: "center", gap: 8, paddingVertical: 24 },
  allClearText: { fontSize: 14, color: "rgba(255,255,255,0.6)", fontWeight: "600" },
  allClearSubtext: { fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center", maxWidth: 260 },
});
