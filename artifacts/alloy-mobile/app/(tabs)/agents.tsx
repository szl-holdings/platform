import React, { useState, useCallback, useEffect } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, RefreshControl,
  Platform, ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useAlloyWebSocket } from "@/hooks/useAlloyWebSocket";
import { apiFetch } from "@/lib/apiClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { FeatherIconName } from "@/types/feather-icons";

const AGENTS_CACHE_KEY = "alloy_agents_snapshot";

interface Agent {
  id: string | number;
  name: string;
  type: string;
  status: "running" | "idle" | "error" | "paused" | "completed";
  lastRunAt?: string | null;
  runCount?: number;
  successRate?: number;
  description?: string;
}

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: FeatherIconName }> = {
  running: { color: "#3b82f6", label: "Running", icon: "activity" },
  idle: { color: "#6b7280", label: "Idle", icon: "circle" },
  error: { color: "#ef4444", label: "Error", icon: "x-circle" },
  paused: { color: "#f59e0b", label: "Paused", icon: "pause-circle" },
  completed: { color: "#10b981", label: "Completed", icon: "check-circle" },
};

function useAgents() {
  return useQuery<Agent[]>({
    queryKey: ["alloy-agents"],
    queryFn: async () => {
      const res = await apiFetch("/api/alloy/agents");
      if (!res.ok) throw new Error("Failed to load agents");
      const json = await res.json() as { data?: Agent[] } | Agent[];
      const data = Array.isArray(json) ? json : ((json as { data?: Agent[] }).data ?? []);
      AsyncStorage.setItem(AGENTS_CACHE_KEY, JSON.stringify(data)).catch(() => null);
      return data;
    },
    refetchInterval: 15000,
    retry: 1,
  });
}

function formatRelative(ts: string | null | undefined) {
  if (!ts) return "—";
  const ms = Date.now() - new Date(ts).getTime();
  if (ms < 60000) return "just now";
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
  return `${Math.floor(ms / 86400000)}d ago`;
}

export default function AgentsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [cachedAgents, setCachedAgents] = useState<Agent[] | null>(null);
  const qc = useQueryClient();
  const { data: agents, isLoading, isError, refetch } = useAgents();
  const { status: wsStatus } = useAlloyWebSocket(true);

  useEffect(() => {
    if (isError) {
      AsyncStorage.getItem(AGENTS_CACHE_KEY).then((raw) => {
        if (raw) {
          try {
            setCachedAgents(JSON.parse(raw) as Agent[]);
          } catch {
            // Ignore corrupted cache
          }
        }
      }).catch(() => null);
    } else if (agents) {
      setCachedAgents(null);
    }
  }, [isError, agents]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : 90;

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const wsColor = wsStatus === "connected" ? "#10b981" : wsStatus === "connecting" ? "#f59e0b" : "#6b7280";
  const wsLabel = wsStatus === "connected" ? "Live" : wsStatus === "connecting" ? "Connecting…" : "Offline";

  const runningCount = agents?.filter((a) => a.status === "running").length ?? 0;
  const errorCount = agents?.filter((a) => a.status === "error").length ?? 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["rgba(59,130,246,0.06)", "transparent"]}
        style={[styles.headerGradient, { height: topPad + 120 }]}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: topPad + 16, paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.violet} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.eyebrow, { color: "rgba(59,130,246,0.6)" }]}>ALLOY · AGENT FABRIC</Text>
            <Text style={[styles.title, { color: colors.cream }]}>Active Agents</Text>
          </View>
          <View style={[styles.wsBadge, { backgroundColor: `${wsColor}12`, borderColor: `${wsColor}30` }]}>
            <View style={[styles.wsDot, { backgroundColor: wsColor }]} />
            <Text style={[styles.wsLabel, { color: wsColor }]}>{wsLabel}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          {[
            { label: "Running", value: runningCount, color: "#3b82f6" },
            { label: "Total", value: agents?.length ?? 0, color: colors.violet },
            { label: "Errors", value: errorCount, color: "#ef4444" },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.borderSubtle }]}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {isLoading ? (
          <View style={{ gap: 10 }}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={[styles.agentCard, { backgroundColor: colors.card, borderColor: colors.borderSubtle, opacity: 0.5 }]}>
                <View style={{ height: 60 }} />
              </View>
            ))}
          </View>
        ) : isError && !cachedAgents?.length ? (
          <View style={[styles.emptyState, { borderColor: colors.borderSubtle }]}>
            <Feather name="alert-triangle" size={28} color={colors.mutedForeground} style={{ opacity: 0.4 }} />
            <Text style={[styles.emptyTitle, { color: colors.creamDim }]}>Cannot reach Alloy</Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>Pull to retry</Text>
          </View>
        ) : !(agents ?? cachedAgents)?.length ? (
          <View style={[styles.emptyState, { borderColor: colors.borderSubtle }]}>
            <Feather name="cpu" size={28} color={colors.mutedForeground} style={{ opacity: 0.4 }} />
            <Text style={[styles.emptyTitle, { color: colors.creamDim }]}>No agents configured</Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>Deploy agents from the web platform to see them here</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {isError && cachedAgents?.length ? (
              <View style={[styles.staleBanner, { backgroundColor: "rgba(245,158,11,0.08)", borderColor: "rgba(245,158,11,0.2)" }]}>
                <Feather name="wifi-off" size={12} color="#f59e0b" />
                <Text style={[styles.staleText, { color: "#f59e0b" }]}>Offline — showing last known status</Text>
              </View>
            ) : null}
            {(agents ?? cachedAgents ?? []).map((agent) => {
              const cfg = STATUS_CONFIG[agent.status] ?? STATUS_CONFIG.idle;
              return (
                <Pressable
                  key={String(agent.id)}
                  style={[styles.agentCard, { backgroundColor: colors.card, borderColor: colors.borderSubtle }]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push({ pathname: "/agent/[id]", params: { id: String(agent.id) } });
                  }}
                >
                  <View style={styles.agentHeader}>
                    <View style={[styles.agentIcon, { backgroundColor: `${cfg.color}15` }]}>
                      <Feather name={cfg.icon} size={16} color={cfg.color} />
                    </View>
                    <View style={styles.agentInfo}>
                      <Text style={[styles.agentName, { color: colors.cream }]}>{agent.name}</Text>
                      <Text style={[styles.agentType, { color: colors.mutedForeground }]}>{agent.type}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: `${cfg.color}15`, borderColor: `${cfg.color}30` }]}>
                      <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                  </View>
                  {agent.description && (
                    <Text style={[styles.agentDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                      {agent.description}
                    </Text>
                  )}
                  <View style={styles.agentMeta}>
                    <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                      Last run: {formatRelative(agent.lastRunAt)}
                    </Text>
                    {agent.runCount != null && (
                      <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                        {agent.runCount} runs
                      </Text>
                    )}
                    {agent.successRate != null && (
                      <Text style={[styles.metaText, { color: "#10b981" }]}>
                        {Math.round(agent.successRate * 100)}% success
                      </Text>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { position: "absolute", top: 0, left: 0, right: 0 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 },
  eyebrow: { fontSize: 9, fontFamily: "Inter_500Medium", letterSpacing: 3, marginBottom: 6 },
  title: { fontSize: 24, fontFamily: "Inter_300Light" },
  wsBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 12, borderWidth: 1, marginTop: 4 },
  wsDot: { width: 6, height: 6, borderRadius: 3 },
  wsLabel: { fontSize: 10, fontFamily: "Inter_500Medium" },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 10, borderWidth: 1, padding: 12, alignItems: "center" },
  statValue: { fontSize: 22, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  statLabel: { fontSize: 9, fontFamily: "Inter_500Medium", letterSpacing: 1 },
  agentCard: { borderRadius: 10, borderWidth: 1, padding: 14 },
  agentHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  agentIcon: { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  agentInfo: { flex: 1 },
  agentName: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  agentType: { fontSize: 11, fontFamily: "Inter_400Regular" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  statusText: { fontSize: 10, fontFamily: "Inter_500Medium" },
  agentDesc: { fontSize: 12, lineHeight: 18, marginBottom: 8 },
  agentMeta: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  metaText: { fontSize: 11 },
  emptyState: { alignItems: "center", paddingVertical: 48, borderRadius: 12, borderWidth: 1, borderStyle: "dashed", gap: 8 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyBody: { fontSize: 13, textAlign: "center", paddingHorizontal: 24 },
  staleBanner: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, marginBottom: 12 },
  staleText: { fontSize: 11, fontFamily: "Inter_500Medium" },
});
