import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { ComponentProps } from "react";
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

const DEMO_NOTE = "Simulated Data";

interface Milestone {
  id: string;
  label: string;
  daysUntil: number;
  status: "on_track" | "slipping" | "escalate" | "complete";
  riskNote?: string;
  owner?: string;
  isCriticalPath?: boolean;
}

interface PropertyCountdown {
  propertyId: string;
  propertyName: string;
  city: string;
  state: string;
  eventLabel: string;
  daysLeft: number;
  milestones: Milestone[];
}

const COUNTDOWNS: PropertyCountdown[] = [
  {
    propertyId: "prop-001",
    propertyName: "Meridian Tower",
    city: "Miami",
    state: "FL",
    eventLabel: "Acquisition Closing",
    daysLeft: 45,
    milestones: [
      { id: "cm-001", label: "Legal entity review", daysUntil: 5, status: "on_track", owner: "R. Adams", isCriticalPath: true },
      { id: "cm-002", label: "IC approval packet submitted", daysUntil: 10, status: "on_track", owner: "M. Park", isCriticalPath: true },
      { id: "cm-003", label: "Lender estoppel received", daysUntil: 14, status: "slipping", riskNote: "Buffer thinning — lender avg 9d", isCriticalPath: true },
      { id: "cm-004", label: "HVAC scope finalized", daysUntil: 12, status: "slipping", riskNote: "Engineering vendor not engaged" },
      { id: "cm-005", label: "Permit history cleared", daysUntil: 20, status: "on_track" },
      { id: "cm-006", label: "Closing docs prepared", daysUntil: 35, status: "on_track", isCriticalPath: true },
      { id: "cm-007", label: "Wire and closing", daysUntil: 45, status: "on_track", isCriticalPath: true },
    ],
  },
  {
    propertyId: "prop-005",
    propertyName: "The Atrium",
    city: "Nashville",
    state: "TN",
    eventLabel: "Debt Maturity",
    daysLeft: 120,
    milestones: [
      { id: "cm-010", label: "Appraisal ordered", daysUntil: 3, status: "escalate", riskNote: "Not yet ordered — costs time at close", isCriticalPath: true },
      { id: "cm-011", label: "Appraisal received", daysUntil: 24, status: "slipping", riskNote: "Depends on ordering — behind", isCriticalPath: true },
      { id: "cm-012", label: "Title search complete", daysUntil: 10, status: "escalate", riskNote: "Not started", isCriticalPath: true },
      { id: "cm-013", label: "Liens cleared", daysUntil: 18, status: "slipping", isCriticalPath: true },
      { id: "cm-014", label: "Lender extension request", daysUntil: 30, status: "slipping", isCriticalPath: true },
      { id: "cm-015", label: "Occupancy recovery to 82%", daysUntil: 90, status: "slipping", riskNote: "Currently 78.1% — needs 4 leases" },
      { id: "cm-016", label: "Debt maturity", daysUntil: 120, status: "escalate", riskNote: "Refi must close before this", isCriticalPath: true },
    ],
  },
  {
    propertyId: "prop-003",
    propertyName: "Riverside Commons",
    city: "Austin",
    state: "TX",
    eventLabel: "Refi Application Deadline",
    daysLeft: 60,
    milestones: [
      { id: "cm-020", label: "T12 audit complete", daysUntil: 5, status: "slipping", riskNote: "3 days past due", owner: "M. Park", isCriticalPath: true },
      { id: "cm-021", label: "Financials to lender", daysUntil: 8, status: "slipping", isCriticalPath: true },
      { id: "cm-022", label: "Legal review complete", daysUntil: 20, status: "on_track", isCriticalPath: true },
      { id: "cm-023", label: "Lender underwriting", daysUntil: 45, status: "on_track", isCriticalPath: true },
      { id: "cm-024", label: "Refi application deadline", daysUntil: 60, status: "on_track", isCriticalPath: true },
    ],
  },
];

type FeatherName = ComponentProps<typeof Feather>["name"];

const STATUS_ICON: Record<Milestone["status"], FeatherName> = {
  on_track: "check-circle",
  slipping: "clock",
  escalate: "alert-triangle",
  complete: "check-circle",
};

const STATUS_COLOR: Record<Milestone["status"], string> = {
  on_track: "#40856a",
  slipping: "#b8943c",
  escalate: "#c04a2a",
  complete: "rgba(255,255,255,0.2)",
};

const STATUS_LABEL: Record<Milestone["status"], string> = {
  on_track: "On Track",
  slipping: "Slipping",
  escalate: "Escalate",
  complete: "Complete",
};

function daysColor(days: number) {
  if (days < 0) return "#c04a2a";
  if (days <= 7) return "#b8943c";
  return "rgba(255,255,255,0.6)";
}

export default function CountdownScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const totalEscalate = COUNTDOWNS.reduce((s, c) => s + c.milestones.filter(m => m.status === "escalate").length, 0);
  const totalSlipping = COUNTDOWNS.reduce((s, c) => s + c.milestones.filter(m => m.status === "slipping").length, 0);
  const totalOnTrack = COUNTDOWNS.reduce((s, c) => s + c.milestones.filter(m => m.status === "on_track").length, 0);

  return (
    <View style={{ flex: 1, backgroundColor: "#080b0d" }}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color="rgba(255,255,255,0.5)" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Countdown Engine</Text>
          <Text style={styles.demoBadge}>{DEMO_NOTE}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.kpiRow}>
          {[
            { label: "Escalate", value: totalEscalate, color: "#c04a2a", pulse: totalEscalate > 0 },
            { label: "Slipping", value: totalSlipping, color: "#b8943c" },
            { label: "On Track", value: totalOnTrack, color: "#40856a" },
          ].map(m => (
            <View key={m.label} style={[styles.kpiCard, { borderColor: `${m.color}20` }]}>
              <Text style={[styles.kpiValue, { color: m.color }]}>{m.value}</Text>
              <Text style={styles.kpiLabel}>{m.label}</Text>
            </View>
          ))}
        </View>

        {COUNTDOWNS.map(countdown => {
          const escalateCount = countdown.milestones.filter(m => m.status === "escalate").length;
          const slippingCount = countdown.milestones.filter(m => m.status === "slipping").length;
          const cardBorderColor = escalateCount > 0 ? "rgba(192,74,42,0.25)" : slippingCount > 0 ? "rgba(184,148,60,0.15)" : "rgba(64,133,106,0.15)";

          const sortedMilestones = [...countdown.milestones].sort((a, b) => {
            const order = { escalate: 0, slipping: 1, on_track: 2, complete: 3 };
            return order[a.status] - order[b.status];
          });

          return (
            <View key={countdown.propertyId} style={[styles.card, { borderColor: cardBorderColor }]}>
              <View style={styles.cardHeader}>
                <View style={styles.countdownCircle}>
                  <Text style={[styles.daysNum, { color: countdown.daysLeft <= 14 ? "#c04a2a" : countdown.daysLeft <= 30 ? "#b8943c" : "#40856a" }]}>
                    {countdown.daysLeft}
                  </Text>
                  <Text style={styles.daysLabel}>DAYS</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.propName}>{countdown.propertyName}</Text>
                  <Text style={styles.propLocation}>{countdown.city}, {countdown.state}</Text>
                  <View style={styles.eventChip}>
                    <Feather name="flag" size={10} color="rgba(255,255,255,0.3)" />
                    <Text style={styles.eventLabel}>{countdown.eventLabel}</Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                    {escalateCount > 0 && (
                      <View style={[styles.statusPill, { backgroundColor: "rgba(192,74,42,0.12)", borderColor: "rgba(192,74,42,0.25)" }]}>
                        <Feather name="alert-triangle" size={9} color="#c04a2a" />
                        <Text style={[styles.statusPillText, { color: "#c04a2a" }]}>{escalateCount} escalate</Text>
                      </View>
                    )}
                    {slippingCount > 0 && (
                      <View style={[styles.statusPill, { backgroundColor: "rgba(184,148,60,0.12)", borderColor: "rgba(184,148,60,0.25)" }]}>
                        <Feather name="clock" size={9} color="#b8943c" />
                        <Text style={[styles.statusPillText, { color: "#b8943c" }]}>{slippingCount} slipping</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.milestoneList}>
                {sortedMilestones.map((m, i) => {
                  const statusColor = STATUS_COLOR[m.status];
                  return (
                    <View key={m.id} style={[styles.milestoneRow, { borderTopColor: i > 0 ? "rgba(255,255,255,0.04)" : "transparent" }]}>
                      <Feather name={STATUS_ICON[m.status]} size={13} color={statusColor} style={{ marginTop: 1 }} />
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <Text style={[styles.milestoneLabel, { color: m.status === "complete" ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.8)" }]}>
                            {m.label}
                          </Text>
                          {m.isCriticalPath && m.status !== "complete" && (
                            <View style={styles.criticalBadge}>
                              <Text style={styles.criticalBadgeText}>Critical</Text>
                            </View>
                          )}
                        </View>
                        {m.riskNote && (
                          <Text style={styles.riskNote}>{m.riskNote}</Text>
                        )}
                        {m.owner && (
                          <Text style={styles.milestoneOwner}>{m.owner}</Text>
                        )}
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={[styles.daysChip, { color: daysColor(m.daysUntil) }]}>
                          {m.daysUntil === 0 ? "Today" : `${m.daysUntil}d`}
                        </Text>
                        <Text style={[styles.statusBadge, { color: statusColor }]}>
                          {STATUS_LABEL[m.status]}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              {escalateCount > 0 && (
                <View style={styles.escalateBanner}>
                  <Feather name="zap" size={12} color="#c04a2a" />
                  <Text style={styles.escalateBannerText}>
                    {escalateCount} milestone{escalateCount > 1 ? "s" : ""} need immediate escalation before {countdown.eventLabel} deadline.
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
    fontFamily: "Inter_600SemiBold",
  },
  demoBadge: {
    fontSize: 9,
    color: "#b8943c",
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginTop: 2,
  },
  kpiRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.02)",
    padding: 12,
    alignItems: "center",
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
  },
  kpiLabel: {
    fontSize: 9,
    color: "rgba(255,255,255,0.3)",
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 2,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.02)",
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
    alignItems: "flex-start",
  },
  countdownCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "rgba(64,133,106,0.3)",
    backgroundColor: "rgba(64,133,106,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  daysNum: {
    fontSize: 20,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
    lineHeight: 22,
  },
  daysLabel: {
    fontSize: 7,
    color: "rgba(255,255,255,0.25)",
    fontFamily: "Inter_500Medium",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  propName: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
    fontFamily: "Inter_600SemiBold",
  },
  propLocation: {
    fontSize: 11,
    color: "rgba(255,255,255,0.35)",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  eventChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 5,
  },
  eventLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.35)",
    fontFamily: "Inter_400Regular",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
  milestoneList: {
    gap: 0,
  },
  milestoneRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 9,
    borderTopWidth: 1,
  },
  milestoneLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  criticalBadge: {
    backgroundColor: "rgba(192,74,42,0.12)",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  criticalBadgeText: {
    fontSize: 8,
    color: "#c04a2a",
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  riskNote: {
    fontSize: 10,
    color: "#b8943c",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  milestoneOwner: {
    fontSize: 9,
    color: "rgba(255,255,255,0.25)",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  daysChip: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  statusBadge: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 1,
  },
  escalateBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(192,74,42,0.06)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(192,74,42,0.2)",
    padding: 10,
    marginTop: 12,
  },
  escalateBannerText: {
    flex: 1,
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
});
