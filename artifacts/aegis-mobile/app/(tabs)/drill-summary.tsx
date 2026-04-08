import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface DrillResult {
  id: string;
  scenarioTitle: string;
  category: string;
  difficulty: "Intermediate" | "Advanced" | "Expert";
  score: number;
  maxScore: number;
  grade: string;
  gradeColor: string;
  completedAt: string;
  durationMin: number;
  steps: Array<{
    stepNum: number;
    prompt: string;
    selectedText: string;
    score: number;
    maxStepScore: number;
    correct: boolean;
    timeSpentSec: number;
  }>;
  recommendations: string[];
}

const MOCK_RESULTS: DrillResult[] = [
  {
    id: "dr-1",
    scenarioTitle: "Ransomware — Sacsayhuamán Crisis",
    category: "Ransomware / Data Integrity",
    difficulty: "Advanced",
    score: 68,
    maxScore: 75,
    grade: "Proficient",
    gradeColor: "#3b82f6",
    completedAt: "2025-04-07T10:22:00Z",
    durationMin: 14,
    steps: [
      { stepNum: 1, prompt: "Mass file encryption detected. First action?", selectedText: "Isolate all affected endpoints immediately", score: 25, maxStepScore: 25, correct: true, timeSpentSec: 28 },
      { stepNum: 2, prompt: "C2 beacon still active on missed host. Next?", selectedText: "Isolate host and collect forensic image", score: 25, maxStepScore: 25, correct: true, timeSpentSec: 45 },
      { stepNum: 3, prompt: "Client wants restore now. Backups untested. Decision?", selectedText: "Begin full restore — downtime costs money", score: 5, maxStepScore: 25, correct: false, timeSpentSec: 22 },
    ],
    recommendations: [
      "Never restore from untested backups — validate 3+ systems before committing to full restore.",
      "Review NIST SP 800-61 Section 3.3: Eradication and Recovery priorities.",
    ],
  },
  {
    id: "dr-2",
    scenarioTitle: "Supply Chain Compromise — Third-Party Library",
    category: "Supply Chain",
    difficulty: "Expert",
    score: 60,
    maxScore: 75,
    grade: "Developing",
    gradeColor: "#f59e0b",
    completedAt: "2025-04-05T14:15:00Z",
    durationMin: 22,
    steps: [
      { stepNum: 1, prompt: "Backdoored library in 14 microservices. First action?", selectedText: "Immediately patch all 14 services", score: 18, maxStepScore: 25, correct: false, timeSpentSec: 19 },
      { stepNum: 2, prompt: "EU customer PII affected. Regulatory trigger?", selectedText: "GDPR 72-hour notification threshold met", score: 25, maxStepScore: 25, correct: true, timeSpentSec: 56 },
      { stepNum: 3, prompt: "Backdoor invoked twice. Patching complete. Next?", selectedText: "Close incident — patching complete", score: 2, maxStepScore: 25, correct: false, timeSpentSec: 12 },
    ],
    recommendations: [
      "Patch after scope definition, not before — SBOM audit first identifies highest-risk systems.",
      "Confirmed backdoor invocations require forensic analysis. Patching does not close the incident.",
    ],
  },
  {
    id: "dr-3",
    scenarioTitle: "Insider Threat — Privileged Exfiltration",
    category: "Insider Risk",
    difficulty: "Advanced",
    score: 43,
    maxScore: 50,
    grade: "Proficient",
    gradeColor: "#3b82f6",
    completedAt: "2025-04-03T09:00:00Z",
    durationMin: 11,
    steps: [
      { stepNum: 1, prompt: "UEBA alert on departing employee. First action?", selectedText: "Covertly capture evidence, notify HR, Legal, CISO", score: 25, maxStepScore: 25, correct: true, timeSpentSec: 34 },
      { stepNum: 2, prompt: "Active VPN exfiltration. HR wants to terminate today.", selectedText: "Block VPN tunnel only, preserve employment for Legal", score: 25, maxStepScore: 25, correct: true, timeSpentSec: 61 },
    ],
    recommendations: [
      "Strong performance. Consider running APT-level drill to build on insider threat competency.",
    ],
  },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  Intermediate: "#f59e0b",
  Advanced: "#f97316",
  Expert: "#ef4444",
};

export default function DrillSummaryTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = MOCK_RESULTS.find(r => r.id === selectedId);
  const s = styles(colors);

  const teamAvgScore = Math.round(
    MOCK_RESULTS.reduce((acc, r) => acc + Math.round((r.score / r.maxScore) * 100), 0) / MOCK_RESULTS.length
  );

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Ionicons name="shield-checkmark" size={16} color={colors.amber} />
        <Text style={s.headerTitle}>Resilience Drill Summary</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 80 }}>

        {/* Team stats */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={[s.statValue, { color: teamAvgScore >= 80 ? "#10b981" : teamAvgScore >= 60 ? "#f59e0b" : "#ef4444" }]}>{teamAvgScore}%</Text>
            <Text style={s.statLabel}>Team Avg Score</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statValue}>{MOCK_RESULTS.length}</Text>
            <Text style={s.statLabel}>Drills Completed</Text>
          </View>
          <View style={s.statCard}>
            <Text style={[s.statValue, { color: "#3b82f6" }]}>{Math.round(MOCK_RESULTS.reduce((a, r) => a + r.durationMin, 0) / MOCK_RESULTS.length)}m</Text>
            <Text style={s.statLabel}>Avg Duration</Text>
          </View>
        </View>

        <Text style={s.sectionLabel}>Recent Drill Runs</Text>

        {!selected ? (
          <View style={s.drillList}>
            {MOCK_RESULTS.map(result => {
              const pct = Math.round((result.score / result.maxScore) * 100);
              return (
                <TouchableOpacity
                  key={result.id}
                  onPress={() => setSelectedId(result.id)}
                  style={s.drillCard}
                  activeOpacity={0.7}
                >
                  <View style={s.drillCardTop}>
                    <View style={s.drillCardLeft}>
                      <Text style={[s.difficultyBadge, { color: DIFFICULTY_COLORS[result.difficulty] ?? "#f59e0b" }]}>{result.difficulty.toUpperCase()}</Text>
                      <Text style={s.drillTitle} numberOfLines={2}>{result.scenarioTitle}</Text>
                      <Text style={s.drillCategory}>{result.category}</Text>
                    </View>
                    <View style={s.scoreBlock}>
                      <Text style={[s.scoreValue, { color: result.gradeColor }]}>{pct}%</Text>
                      <Text style={[s.gradeLabel, { color: result.gradeColor }]}>{result.grade}</Text>
                    </View>
                  </View>
                  <View style={s.drillMeta}>
                    <Text style={s.metaItem}>{result.durationMin}m</Text>
                    <Text style={s.metaDivider}>·</Text>
                    <Text style={s.metaItem}>{result.steps.length} decisions</Text>
                    <Text style={s.metaDivider}>·</Text>
                    <Text style={s.metaItem}>{new Date(result.completedAt).toLocaleDateString()}</Text>
                  </View>
                  <View style={s.progressBar}>
                    <View style={{ flex: pct / 100, height: 3, borderRadius: 2, backgroundColor: result.gradeColor }} />
                    <View style={{ flex: (100 - pct) / 100, height: 3 }} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View>
            <TouchableOpacity onPress={() => setSelectedId(null)} style={s.backButton} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={14} color="rgba(255,255,255,0.4)" />
              <Text style={s.backText}>All Drills</Text>
            </TouchableOpacity>

            <View style={s.detailHeader}>
              <Text style={[s.difficultyBadge, { color: DIFFICULTY_COLORS[selected!.difficulty] ?? "#f59e0b" }]}>
                {selected!.difficulty.toUpperCase()} · {selected!.category}
              </Text>
              <Text style={s.drillTitle}>{selected!.scenarioTitle}</Text>
              <View style={s.detailScoreRow}>
                <Text style={[s.bigScore, { color: selected!.gradeColor }]}>{Math.round((selected!.score / selected!.maxScore) * 100)}%</Text>
                <Text style={[s.bigGrade, { color: selected!.gradeColor }]}>{selected!.grade}</Text>
                <Text style={s.bigScoreSub}>{selected!.score}/{selected!.maxScore} pts · {selected!.durationMin}m</Text>
              </View>
            </View>

            <Text style={s.sectionLabel}>Decision Breakdown</Text>
            <View style={s.stepList}>
              {selected!.steps.map(step => (
                <View key={step.stepNum} style={[s.stepCard, step.correct ? s.stepCorrect : s.stepIncorrect]}>
                  <View style={s.stepTop}>
                    <Ionicons
                      name={step.correct ? "checkmark-circle" : "close-circle"}
                      size={16}
                      color={step.correct ? "#10b981" : "#ef4444"}
                    />
                    <Text style={s.stepNum}>Step {step.stepNum}</Text>
                    <Text style={[s.stepScore, { color: step.correct ? "#10b981" : "#ef4444" }]}>{step.score}/{step.maxStepScore} pts</Text>
                    <Text style={s.stepTime}>{step.timeSpentSec}s</Text>
                  </View>
                  <Text style={s.stepPrompt} numberOfLines={2}>{step.prompt}</Text>
                  <Text style={[s.stepAnswer, { color: step.correct ? "rgba(16,185,129,0.8)" : "rgba(239,68,68,0.8)" }]}>
                    → {step.selectedText}
                  </Text>
                </View>
              ))}
            </View>

            <Text style={s.sectionLabel}>Tradecraft Recommendations</Text>
            <View style={s.recList}>
              {selected!.recommendations.map((rec, i) => (
                <View key={i} style={s.recItem}>
                  <Ionicons name="bulb-outline" size={14} color="rgba(251,191,36,0.7)" style={{ marginTop: 2 }} />
                  <Text style={s.recText}>{rec}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function styles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.navy },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(255,255,255,0.05)",
    },
    headerTitle: { fontSize: 14, fontWeight: "700", color: "#e2e8f0" },
    scroll: { flex: 1 },
    statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
    statCard: {
      flex: 1,
      padding: 12,
      borderRadius: 12,
      backgroundColor: "rgba(255,255,255,0.025)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.05)",
      alignItems: "center",
    },
    statValue: { fontSize: 22, fontWeight: "800", fontFamily: "JetBrainsMono_400Regular", color: "#e2e8f0", marginBottom: 3 },
    statLabel: { fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: "JetBrainsMono_400Regular", letterSpacing: 0.5 },
    sectionLabel: { fontSize: 10, fontFamily: "JetBrainsMono_400Regular", color: "rgba(255,255,255,0.3)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 },
    drillList: { gap: 10 },
    drillCard: {
      padding: 14,
      borderRadius: 14,
      backgroundColor: "rgba(255,255,255,0.02)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.05)",
      gap: 10,
    },
    drillCardTop: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
    drillCardLeft: { flex: 1 },
    difficultyBadge: { fontSize: 9, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 0.5, marginBottom: 4 },
    drillTitle: { fontSize: 13, fontWeight: "700", color: "#e2e8f0", marginBottom: 3 },
    drillCategory: { fontSize: 10, color: "rgba(255,255,255,0.3)" },
    scoreBlock: { alignItems: "flex-end" },
    scoreValue: { fontSize: 24, fontWeight: "800", fontFamily: "JetBrainsMono_400Regular" },
    gradeLabel: { fontSize: 10, fontWeight: "600" },
    drillMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
    metaItem: { fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "JetBrainsMono_400Regular" },
    metaDivider: { fontSize: 10, color: "rgba(255,255,255,0.15)" },
    progressBar: { height: 3, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden", flexDirection: "row" },
    backButton: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 14 },
    backText: { fontSize: 12, color: "rgba(255,255,255,0.4)" },
    detailHeader: {
      padding: 14,
      borderRadius: 14,
      backgroundColor: "rgba(255,255,255,0.02)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.05)",
      marginBottom: 16,
    },
    detailScoreRow: { flexDirection: "row", alignItems: "baseline", gap: 10, marginTop: 10 },
    bigScore: { fontSize: 36, fontWeight: "900", fontFamily: "JetBrainsMono_400Regular" },
    bigGrade: { fontSize: 14, fontWeight: "700" },
    bigScoreSub: { fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "JetBrainsMono_400Regular" },
    stepList: { gap: 8, marginBottom: 20 },
    stepCard: {
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      gap: 6,
    },
    stepCorrect: { backgroundColor: "rgba(16,185,129,0.05)", borderColor: "rgba(16,185,129,0.2)" },
    stepIncorrect: { backgroundColor: "rgba(239,68,68,0.05)", borderColor: "rgba(239,68,68,0.15)" },
    stepTop: { flexDirection: "row", alignItems: "center", gap: 8 },
    stepNum: { fontSize: 10, fontFamily: "JetBrainsMono_400Regular", color: "rgba(255,255,255,0.3)", flex: 1 },
    stepScore: { fontSize: 10, fontWeight: "700", fontFamily: "JetBrainsMono_400Regular" },
    stepTime: { fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "JetBrainsMono_400Regular" },
    stepPrompt: { fontSize: 11, color: "rgba(255,255,255,0.65)", lineHeight: 16 },
    stepAnswer: { fontSize: 11, lineHeight: 16 },
    recList: { gap: 10 },
    recItem: {
      flexDirection: "row",
      gap: 10,
      alignItems: "flex-start",
      padding: 12,
      borderRadius: 10,
      backgroundColor: "rgba(251,191,36,0.04)",
      borderWidth: 1,
      borderColor: "rgba(251,191,36,0.12)",
    },
    recText: { flex: 1, fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 17 },
  });
}
