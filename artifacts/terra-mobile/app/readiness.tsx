import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState, ComponentProps } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
const DEMO_NOTE = "Simulated Data";

type FeatherName = ComponentProps<typeof Feather>["name"];

type GoalId = "buy" | "sell" | "lease" | "occupy" | "service";

const GOAL_OPTIONS: Array<{ id: GoalId; label: string; icon: FeatherName; color: string }> = [
  { id: "buy", label: "Acquire", icon: "home", color: "#3a7ad4" },
  { id: "sell", label: "Sell", icon: "dollar-sign", color: "#b8943c" },
  { id: "lease", label: "Lease", icon: "file-text", color: "#40856a" },
  { id: "occupy", label: "Occupy", icon: "users", color: "#8b5cf6" },
  { id: "service", label: "Service", icon: "tool", color: "rgba(255,255,255,0.4)" },
];

interface PropertyReadiness {
  id: string;
  name: string;
  city: string;
  state: string;
  scores: Record<GoalId, number>;
  criticalBlockers: Record<GoalId, string[]>;
  criticalPathDays: Record<GoalId, number>;
}

const PROPERTIES: PropertyReadiness[] = [
  {
    id: "prop-001",
    name: "Meridian Tower",
    city: "Miami",
    state: "FL",
    scores: { buy: 71, sell: 88, lease: 79, occupy: 82, service: 95 },
    criticalBlockers: {
      buy: ["Legal entity review", "IC approval packet", "Lender estoppel"],
      sell: ["HVAC/MEP assessment"],
      lease: ["HVAC assessment", "Open permit history"],
      occupy: ["HVAC assessment"],
      service: [],
    },
    criticalPathDays: { buy: 15, sell: 10, lease: 14, occupy: 10, service: 0 },
  },
  {
    id: "prop-005",
    name: "The Atrium",
    city: "Nashville",
    state: "TN",
    scores: { buy: 8, sell: 14, lease: 52, occupy: 22, service: 40 },
    criticalBlockers: {
      buy: ["Current appraisal", "Debt maturity refinance plan", "Occupancy recovery"],
      sell: ["Current appraisal", "Title search", "Lien & encumbrance review"],
      lease: ["Occupancy recovery plan"],
      occupy: ["Appraisal", "Lien review"],
      service: ["Environmental review"],
    },
    criticalPathDays: { buy: 90, sell: 33, lease: 60, occupy: 28, service: 14 },
  },
  {
    id: "prop-003",
    name: "Riverside Commons",
    city: "Austin",
    state: "TX",
    scores: { buy: 48, sell: 55, lease: 78, occupy: 65, service: 88 },
    criticalBlockers: {
      buy: ["T12 financial audit", "Legal review", "T12 document delivery"],
      sell: ["T12 financial audit", "Legal review"],
      lease: ["Occupancy decline root cause"],
      occupy: [],
      service: [],
    },
    criticalPathDays: { buy: 17, sell: 15, lease: 7, occupy: 0, service: 0 },
  },
];

function scoreColor(score: number) {
  if (score >= 80) return "#40856a";
  if (score >= 55) return "#b8943c";
  return "#c04a2a";
}

function scoreLabel(score: number) {
  if (score >= 80) return "Ready";
  if (score >= 55) return "Needs Work";
  return "Not Ready";
}

export default function ReadinessScreen() {
  const insets = useSafeAreaInsets();
  const [activeGoal, setActiveGoal] = useState<GoalId>("buy");
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const goalOption = GOAL_OPTIONS.find(g => g.id === activeGoal)!;

  return (
    <View style={{ flex: 1, backgroundColor: "#080b0d" }}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color="rgba(255,255,255,0.5)" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Readiness Graph</Text>
          <Text style={styles.demoBadge}>{DEMO_NOTE}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.goalSection}>
          <Text style={styles.sectionLabel}>GOAL — FLIP TO RECALCULATE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            <View style={{ flexDirection: "row", gap: 8, paddingRight: 16 }}>
              {GOAL_OPTIONS.map(g => (
                <Pressable
                  key={g.id}
                  onPress={() => setActiveGoal(g.id)}
                  style={[
                    styles.goalChip,
                    {
                      borderColor: activeGoal === g.id ? g.color + "60" : "rgba(255,255,255,0.08)",
                      backgroundColor: activeGoal === g.id ? g.color + "18" : "rgba(255,255,255,0.04)",
                    },
                  ]}
                >
                  <Feather name={g.icon} size={13} color={activeGoal === g.id ? g.color : "rgba(255,255,255,0.3)"} />
                  <Text style={[styles.goalChipText, { color: activeGoal === g.id ? g.color : "rgba(255,255,255,0.4)" }]}>
                    {g.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {PROPERTIES.map(prop => {
          const score = prop.scores[activeGoal];
          const blockers = prop.criticalBlockers[activeGoal];
          const daysToResolve = prop.criticalPathDays[activeGoal];
          const color = scoreColor(score);

          return (
            <View key={prop.id} style={[styles.card, { borderColor: color + "25" }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.scoreCircle, { borderColor: color + "40", backgroundColor: color + "12" }]}>
                    <Text style={[styles.scoreNum, { color }]}>{score}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.propName}>{prop.name}</Text>
                    <Text style={styles.propLocation}>{prop.city}, {prop.state}</Text>
                    <View style={[styles.statusChip, { backgroundColor: color + "15" }]}>
                      <Text style={[styles.statusText, { color }]}>{scoreLabel(score)}</Text>
                      {daysToResolve > 0 && (
                        <Text style={[styles.statusText, { color: "rgba(255,255,255,0.3)" }]}> · {daysToResolve}d critical path</Text>
                      )}
                    </View>
                  </View>
                </View>
              </View>

              {blockers.length > 0 ? (
                <View style={styles.blockersSection}>
                  <Text style={styles.blockersLabel}>BLOCKERS FOR {goalOption.label.toUpperCase()}</Text>
                  {blockers.map((b, i) => (
                    <View key={i} style={styles.blockerRow}>
                      <View style={[styles.blockerDot, { backgroundColor: score < 55 ? "#c04a2a" : "#b8943c" }]} />
                      <Text style={styles.blockerText}>{b}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={[styles.readyBanner, { backgroundColor: "#40856a10", borderColor: "#40856a25" }]}>
                  <Feather name="check-circle" size={13} color="#40856a" />
                  <Text style={{ color: "#40856a", fontSize: 11, marginLeft: 6 }}>No blockers — ready to proceed</Text>
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
  goalSection: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 9,
    color: "rgba(255,255,255,0.25)",
    fontFamily: "Inter_500Medium",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  goalChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  goalChipText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.02)",
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  scoreCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreNum: {
    fontSize: 18,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
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
  statusChip: {
    flexDirection: "row",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
  },
  statusText: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
  blockersSection: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.04)",
    paddingTop: 12,
    gap: 7,
  },
  blockersLabel: {
    fontSize: 9,
    color: "rgba(255,255,255,0.25)",
    fontFamily: "Inter_500Medium",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  blockerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  blockerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  blockerText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  readyBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
});
