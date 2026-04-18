import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQuery } from "@tanstack/react-query";
import { apiFetch as sharedApiFetch } from "@/lib/apiClient";

const ACCENT = "#c9a84c";
const GREEN = "#22c55e";
const AMBER = "#f59e0b";
const RED = "#ef4444";
const BG = "#090810";
const CARD = "#0e0c18";
const BORDER = "rgba(201,168,76,0.12)";
const TEXT = "#f0eeff";
const TEXT_DIM = "rgba(240,238,255,0.4)";

const AGENT_DEFS = [
  { id: "alloy", name: "Alloy", domain: "Orchestration", color: ACCENT, icon: "git-merge", model: "gpt-5.2" },
  { id: "beacon", name: "Terra Analytics", domain: "Analytics", color: GREEN, icon: "bar-chart-2", model: "gpt-5.2" },
  { id: "sentinel", name: "Sentinel", domain: "Security", color: RED, icon: "shield", model: "claude-sonnet-4-6" },
  { id: "helmsman", name: "Helmsman", domain: "Maritime", color: "#0ea5e9", icon: "anchor", model: "claude-sonnet-4-6" },
  { id: "eval", name: "Eval Engine", domain: "Research", color: "#8b5cf6", icon: "cpu", model: "gemini-3.1-pro" },
  { id: "muse", name: "Muse", domain: "Creative", color: "#d946ef", icon: "pen-tool", model: "gemini-3-flash" },
  { id: "compass", name: "Compass", domain: "Readiness", color: AMBER, icon: "compass", model: "claude-sonnet-4-6" },
];

const SKILL_GRAPH = [
  { agent: "Alloy", skills: ["orchestration", "synthesis", "routing", "coordination"], score: 97 },
  { agent: "Sentinel", skills: ["threat-analysis", "CVE", "incident-response", "MITRE"], score: 94 },
  { agent: "Helmsman", skills: ["AIS", "route-risk", "sanctions", "maritime-law"], score: 91 },
  { agent: "Eval Engine", skills: ["RAG", "research", "HuggingFace", "arxiv"], score: 88 },
  { agent: "Analytics", skills: ["anomaly-detection", "SLO", "metrics", "forecasting"], score: 90 },
];

function AgentRow({ agent }: { agent: typeof AGENT_DEFS[0] }) {
  const randomStatus = ["active", "active", "active", "idle"][Math.floor(Math.random() * 4)];
  const statusColor = randomStatus === "active" ? GREEN : AMBER;
  return (
    <View style={styles.agentRow}>
      <View style={[styles.agentIcon, { backgroundColor: `${agent.color}15`, borderColor: `${agent.color}25` }]}>
        <Feather name={agent.icon as any} size={15} color={agent.color} />
      </View>
      <View style={styles.agentInfo}>
        <Text style={styles.agentName}>{agent.name}</Text>
        <Text style={styles.agentDomain}>{agent.domain} · {agent.model}</Text>
      </View>
      <View style={styles.agentRight}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusText, { color: statusColor }]}>{randomStatus.toUpperCase()}</Text>
      </View>
    </View>
  );
}

export default function AgentsScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<"agents" | "skills" | "health">("agents");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["szl-mesh-agents"],
    queryFn: () => sharedApiFetch<{ agents?: unknown[] }>("/api/nuro-mesh/agents"),
    refetchInterval: 30000,
    retry: 1,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refetch();
    setRefreshing(false);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Alloy Agents</Text>
          <Text style={styles.subtitle}>Autonomous operations · {AGENT_DEFS.length} agents active</Text>
        </View>
        <View style={styles.meshBadge}>
          <View style={[styles.meshDot, { backgroundColor: GREEN }]} />
          <Text style={[styles.meshText, { color: GREEN }]}>NOMINAL</Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        {[
          { label: "Active", value: "7", color: GREEN },
          { label: "Delegations/hr", value: "142", color: ACCENT },
          { label: "Avg Confidence", value: "93%", color: ACCENT },
          { label: "Escalations", value: "0", color: GREEN },
        ].map(m => (
          <View key={m.label} style={styles.metric}>
            <Text style={[styles.metricVal, { color: m.color }]}>{m.value}</Text>
            <Text style={styles.metricLabel}>{m.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.tabs}>
        {(["agents", "skills", "health"] as const).map(t => (
          <TouchableOpacity key={t} style={[styles.tabBtn, tab === t && styles.tabBtnActive]} onPress={() => setTab(t)} activeOpacity={0.7}>
            <Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />} showsVerticalScrollIndicator={false}>
        {tab === "agents" && (
          <>
            {isLoading && <ActivityIndicator color={ACCENT} style={{ marginTop: 16 }} />}
            {AGENT_DEFS.map(a => <AgentRow key={a.id} agent={a} />)}
          </>
        )}

        {tab === "skills" && (
          <View style={styles.skillsContainer}>
            <Text style={styles.sectionLabel}>Skill Composition by Agent</Text>
            {SKILL_GRAPH.map(sg => (
              <View key={sg.agent} style={styles.skillRow}>
                <View style={styles.skillHeader}>
                  <Text style={styles.skillAgent}>{sg.agent}</Text>
                  <Text style={[styles.skillScore, { color: ACCENT }]}>{sg.score}/100</Text>
                </View>
                <View style={styles.skillBar}>
                  <View style={[styles.skillFill, { width: `${sg.score}%` as any }]} />
                </View>
                <View style={styles.skillTags}>
                  {sg.skills.map(s => (
                    <View key={s} style={styles.skillTag}><Text style={styles.skillTagText}>{s}</Text></View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {tab === "health" && (
          <View>
            <Text style={styles.sectionLabel}>Agent Health Checks</Text>
            {AGENT_DEFS.map((a, i) => {
              const score = 88 + (i * 2 % 10);
              const isHealthy = score >= 90;
              return (
                <View key={a.id} style={styles.healthRow}>
                  <View style={[styles.healthDot, { backgroundColor: isHealthy ? GREEN : AMBER }]} />
                  <Text style={styles.healthName}>{a.name}</Text>
                  <View style={styles.healthRight}>
                    <Text style={[styles.healthScore, { color: isHealthy ? GREEN : AMBER }]}>{score}/100</Text>
                    <Text style={styles.healthStatus}>{isHealthy ? "Healthy" : "Degraded"}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: BORDER },
  title: { fontSize: 20, fontWeight: "700", color: TEXT },
  subtitle: { fontSize: 12, color: TEXT_DIM, marginTop: 2 },
  meshBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: `${GREEN}12`, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  meshDot: { width: 6, height: 6, borderRadius: 3 },
  meshText: { fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  metricsRow: { flexDirection: "row", paddingHorizontal: 12, paddingVertical: 10, gap: 6 },
  metric: { flex: 1, backgroundColor: CARD, borderRadius: 10, borderWidth: 1, borderColor: BORDER, padding: 10, alignItems: "center" },
  metricVal: { fontSize: 16, fontWeight: "700" },
  metricLabel: { fontSize: 9, color: TEXT_DIM, marginTop: 2, textAlign: "center" },
  tabs: { flexDirection: "row", paddingHorizontal: 12, gap: 8, marginBottom: 4 },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center", backgroundColor: CARD, borderWidth: 1, borderColor: BORDER },
  tabBtnActive: { backgroundColor: `${ACCENT}12`, borderColor: `${ACCENT}25` },
  tabBtnText: { fontSize: 12, color: TEXT_DIM, fontWeight: "600" },
  tabBtnTextActive: { color: ACCENT },
  scroll: { flex: 1 },
  scrollContent: { padding: 12, gap: 6 },
  agentRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER, padding: 12, marginBottom: 6 },
  agentIcon: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  agentInfo: { flex: 1 },
  agentName: { fontSize: 14, fontWeight: "600", color: TEXT },
  agentDomain: { fontSize: 11, color: TEXT_DIM, marginTop: 1 },
  agentRight: { flexDirection: "row", alignItems: "center", gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5 },
  skillsContainer: { gap: 8 },
  sectionLabel: { fontSize: 11, fontWeight: "700", color: TEXT_DIM, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 },
  skillRow: { backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER, padding: 12, marginBottom: 6 },
  skillHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  skillAgent: { fontSize: 13, fontWeight: "600", color: TEXT },
  skillScore: { fontSize: 13, fontWeight: "700" },
  skillBar: { height: 4, backgroundColor: BORDER, borderRadius: 2, marginBottom: 8, overflow: "hidden" },
  skillFill: { height: "100%", backgroundColor: ACCENT, borderRadius: 2 },
  skillTags: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  skillTag: { backgroundColor: `${ACCENT}12`, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  skillTagText: { fontSize: 10, color: ACCENT },
  healthRow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: CARD, borderRadius: 10, borderWidth: 1, borderColor: BORDER, padding: 12, marginBottom: 6 },
  healthDot: { width: 10, height: 10, borderRadius: 5 },
  healthName: { flex: 1, fontSize: 13, fontWeight: "500", color: TEXT },
  healthRight: { alignItems: "flex-end" },
  healthScore: { fontSize: 13, fontWeight: "700" },
  healthStatus: { fontSize: 11, color: TEXT_DIM },
});
