import React, { useState, useCallback, useEffect } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, RefreshControl,
  Platform, ActivityIndicator, Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useAlloyWebSocket } from "@/hooks/useAlloyWebSocket";
import { apiFetch } from "@/lib/apiClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { FeatherIconName } from "@/types/feather-icons";

const RUNS_CACHE_KEY = "alloy_runs_snapshot";
const APPROVALS_CACHE_KEY = "alloy_approvals_snapshot";

interface WorkflowRun {
  id: number;
  workflowId: number | null;
  state: string;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  durationMs?: number | null;
}

interface Approval {
  id: number;
  workflowRunId: number;
  requestedFrom: string;
  status: "pending" | "approved" | "rejected" | "expired";
  expiresAt: string | null;
  createdAt: string;
  description?: string;
}

const STATE_CONFIG: Record<string, { color: string; label: string; icon: FeatherIconName }> = {
  completed: { color: "#10b981", label: "Completed", icon: "check-circle" },
  failed: { color: "#ef4444", label: "Failed", icon: "x-circle" },
  running: { color: "#3b82f6", label: "Running", icon: "activity" },
  queued: { color: "#f59e0b", label: "Queued", icon: "clock" },
  waiting_approval: { color: "#8b5cf6", label: "Awaiting Approval", icon: "pause-circle" },
  canceled: { color: "#6b7280", label: "Canceled", icon: "slash" },
};

function formatRelative(ts: string | null) {
  if (!ts) return "—";
  const ms = Date.now() - new Date(ts).getTime();
  if (ms < 60000) return "just now";
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
  return `${Math.floor(ms / 86400000)}d ago`;
}

export default function WorkflowsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<"runs" | "approvals">("runs");
  const qc = useQueryClient();
  const [decidingId, setDecidingId] = useState<number | null>(null);
  const [recentIds, setRecentIds] = useState<Set<number>>(new Set());

  const [cachedRuns, setCachedRuns] = useState<WorkflowRun[] | null>(null);
  const [cachedApprovals, setCachedApprovals] = useState<Approval[] | null>(null);

  const { data: runsData, isLoading: runsLoading, isError: runsError, refetch: refetchRuns } = useQuery({
    queryKey: ["alloy-runs"],
    queryFn: async () => {
      const res = await apiFetch("/api/alloy/runs?limit=20");
      if (!res.ok) throw new Error("Failed");
      const json = await res.json() as { data?: WorkflowRun[] } | WorkflowRun[];
      const data = Array.isArray(json) ? json : ((json as { data?: WorkflowRun[] }).data ?? []);
      AsyncStorage.setItem(RUNS_CACHE_KEY, JSON.stringify(data)).catch(() => null);
      return data;
    },
    refetchInterval: 30000,
    retry: 1,
  });

  const { data: approvalsData, isLoading: approvalsLoading, isError: approvalsError, refetch: refetchApprovals } = useQuery({
    queryKey: ["alloy-approvals-pending"],
    queryFn: async () => {
      const res = await apiFetch("/api/alloy/approvals?status=pending&limit=20");
      if (!res.ok) throw new Error("Failed");
      const json = await res.json() as { data?: Approval[] } | Approval[];
      const data = Array.isArray(json) ? json : ((json as { data?: Approval[] }).data ?? []);
      AsyncStorage.setItem(APPROVALS_CACHE_KEY, JSON.stringify(data)).catch(() => null);
      return data;
    },
    refetchInterval: 15000,
    retry: 1,
  });

  useEffect(() => {
    if (runsError) {
      AsyncStorage.getItem(RUNS_CACHE_KEY).then((raw) => {
        if (raw) { try { setCachedRuns(JSON.parse(raw) as WorkflowRun[]); } catch { /* ignore */ } }
      }).catch(() => null);
    } else if (runsData) { setCachedRuns(null); }
  }, [runsError, runsData]);

  useEffect(() => {
    if (approvalsError) {
      AsyncStorage.getItem(APPROVALS_CACHE_KEY).then((raw) => {
        if (raw) { try { setCachedApprovals(JSON.parse(raw) as Approval[]); } catch { /* ignore */ } }
      }).catch(() => null);
    } else if (approvalsData) { setCachedApprovals(null); }
  }, [approvalsError, approvalsData]);

  const decideApproval = useMutation({
    mutationFn: async ({ id, decision }: { id: number; decision: string }) => {
      const res = await apiFetch(`/api/alloy/approvals/${id}/decide`, {
        method: "POST",
        body: JSON.stringify({ decision }),
      });
      if (!res.ok) throw new Error("Failed to decide");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alloy-approvals-pending"] });
      qc.invalidateQueries({ queryKey: ["alloy-runs"] });
    },
  });

  const { status: wsStatus, lastEvent } = useAlloyWebSocket(true);

  useEffect(() => {
    if (lastEvent) {
      setRecentIds((prev) => {
        const next = new Set(prev);
        next.add(lastEvent.id);
        return next;
      });
      const timer = setTimeout(() => {
        setRecentIds((prev) => {
          const next = new Set(prev);
          next.delete(lastEvent.id);
          return next;
        });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [lastEvent]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : 90;

  const isRunsStale = runsError && !!cachedRuns?.length;
  const isApprovalsStale = approvalsError && !!cachedApprovals?.length;
  const runs: WorkflowRun[] = runsData ?? cachedRuns ?? [];
  const approvals: Approval[] = approvalsData ?? cachedApprovals ?? [];
  const pendingApprovals = approvals.filter((a) => a.status === "pending");

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await Promise.all([refetchRuns(), refetchApprovals()]);
    setRefreshing(false);
  }, [refetchRuns, refetchApprovals]);

  const handleDecide = useCallback((id: number, decision: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDecidingId(id);
    decideApproval.mutate({ id, decision }, {
      onSettled: () => setDecidingId(null),
      onError: () => Alert.alert("Error", "Could not record decision. Please try again."),
    });
  }, [decideApproval]);

  const wsColor = wsStatus === "connected" ? "#10b981" : wsStatus === "connecting" ? "#f59e0b" : "#6b7280";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["rgba(139,92,246,0.06)", "transparent"]}
        style={[styles.headerGradient, { height: topPad + 120 }]}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: topPad + 16, paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.violet} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.eyebrow, { color: "rgba(139,92,246,0.6)" }]}>ALLOY · EXECUTION FABRIC</Text>
            <Text style={[styles.title, { color: colors.cream }]}>Workflow Monitor</Text>
          </View>
          <View style={[styles.wsBadge, { backgroundColor: `${wsColor}12`, borderColor: `${wsColor}30` }]}>
            <View style={[styles.wsDot, { backgroundColor: wsColor }]} />
            <Text style={[styles.wsLabel, { color: wsColor }]}>
              {wsStatus === "connected" ? "Live" : wsStatus === "connecting" ? "Connecting…" : "Offline"}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          {[
            { label: "Running", value: runs.filter((r) => r.state === "running").length, color: "#3b82f6" },
            { label: "Queued", value: runs.filter((r) => r.state === "queued").length, color: "#f59e0b" },
            { label: "Failed", value: runs.filter((r) => r.state === "failed").length, color: "#ef4444" },
            { label: "Done", value: runs.filter((r) => r.state === "completed").length, color: "#10b981" },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.borderSubtle }]}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.tabs}>
          {(["runs", "approvals"] as const).map((t) => (
            <Pressable
              key={t}
              style={[
                styles.tabBtn,
                {
                  backgroundColor: tab === t ? (t === "runs" ? "rgba(139,92,246,0.1)" : "rgba(245,158,11,0.1)") : "transparent",
                  borderColor: tab === t ? (t === "runs" ? "rgba(139,92,246,0.3)" : "rgba(245,158,11,0.3)") : colors.borderSubtle,
                },
              ]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabBtnText, { color: tab === t ? (t === "runs" ? "#8b5cf6" : "#f59e0b") : colors.mutedForeground }]}>
                {t === "runs" ? "Recent Runs" : `Approvals${pendingApprovals.length > 0 ? ` (${pendingApprovals.length})` : ""}`}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === "runs" && (
          runsLoading ? (
            <ActivityIndicator color={colors.violet} />
          ) : runsError && !isRunsStale ? (
            <EmptyState icon="alert-triangle" title="Cannot reach Alloy" body="Pull to retry" colors={colors} />
          ) : !runs.length ? (
            <EmptyState icon="git-merge" title="No workflow runs" body="No runs found recently" colors={colors} />
          ) : (
            <View style={[styles.runList, { borderColor: colors.borderSubtle }]}>
              {isRunsStale && (
                <View style={[styles.staleBanner, { backgroundColor: "rgba(245,158,11,0.08)", borderColor: "rgba(245,158,11,0.2)" }]}>
                  <Feather name="wifi-off" size={11} color="#f59e0b" />
                  <Text style={[styles.staleText, { color: "#f59e0b" }]}>Offline — showing last known status</Text>
                </View>
              )}
              {runs.slice(0, 15).map((run) => {
                const cfg = STATE_CONFIG[run.state] ?? { color: colors.mutedForeground, label: run.state, icon: "circle" as FeatherIconName };
                return (
                  <Pressable key={run.id} style={[styles.runRow, { borderColor: colors.borderSubtle }, recentIds.has(run.id) ? { backgroundColor: "rgba(139,92,246,0.04)" } : {}]} onPress={() => { Haptics.selectionAsync(); router.push({ pathname: "/workflow/[id]", params: { id: String(run.id) } }); }}>
                    <View style={[styles.runIcon, { backgroundColor: `${cfg.color}15` }]}>
                      <Feather name={cfg.icon} size={14} color={cfg.color} />
                    </View>
                    <View style={styles.runContent}>
                      <View style={styles.runTopRow}>
                        <Text style={[styles.runId, { color: colors.cream }]}>Run #{run.id}</Text>
                        {run.workflowId && <Text style={[styles.wfId, { color: colors.mutedForeground }]}>WF-{run.workflowId}</Text>}
                        {recentIds.has(run.id) && <View style={styles.liveBadge}><Text style={styles.liveBadgeText}>LIVE</Text></View>}
                      </View>
                      <View style={styles.runBottomRow}>
                        <Text style={[styles.runState, { color: cfg.color }]}>{cfg.label}</Text>
                        <Text style={[styles.runTime, { color: colors.mutedForeground }]}>{formatRelative(run.startedAt ?? run.createdAt)}</Text>
                      </View>
                      {run.errorMessage && <Text style={[styles.runError, { color: "#ef4444" }]} numberOfLines={1}>{run.errorMessage}</Text>}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )
        )}

        {tab === "approvals" && (
          <View style={{ gap: 10 }}>
            {approvalsLoading ? (
              <ActivityIndicator color={colors.violet} />
            ) : approvalsError && !isApprovalsStale ? (
              <EmptyState icon="alert-triangle" title="Approvals unavailable" body="Pull to retry" colors={colors} />
            ) : !pendingApprovals.length ? (
              <EmptyState icon="check-circle" title="No pending approvals" body="All workflows are proceeding without intervention" colors={colors} />
            ) : (
              <>
                {isApprovalsStale && (
                  <View style={[styles.staleBanner, { backgroundColor: "rgba(245,158,11,0.08)", borderColor: "rgba(245,158,11,0.2)" }]}>
                    <Feather name="wifi-off" size={11} color="#f59e0b" />
                    <Text style={[styles.staleText, { color: "#f59e0b" }]}>Offline — showing last known approvals</Text>
                  </View>
                )}
                {pendingApprovals.map((approval) => (
                  <View key={approval.id} style={[styles.approvalCard, { backgroundColor: colors.card, borderColor: "rgba(245,158,11,0.2)" }]}>
                    <View style={styles.approvalTop}>
                    <View style={[styles.approvalBadge, { backgroundColor: "rgba(245,158,11,0.1)" }]}>
                      <Feather name="clock" size={11} color="#f59e0b" />
                      <Text style={[styles.approvalBadgeText, { color: "#f59e0b" }]}>PENDING</Text>
                    </View>
                    <Text style={[styles.approvalId, { color: colors.mutedForeground }]}>#{approval.id} · Run #{approval.workflowRunId}</Text>
                  </View>
                  <Text style={[styles.approvalRole, { color: colors.creamDim }]}>
                    Requested from: <Text style={{ color: "#8b5cf6" }}>{approval.requestedFrom}</Text>
                  </Text>
                  {approval.description && (
                    <Text style={[styles.approvalDesc, { color: colors.mutedForeground }]}>{approval.description}</Text>
                  )}
                  {approval.expiresAt && (
                    <Text style={[styles.approvalExpiry, { color: colors.mutedForeground }]}>
                      Expires {new Date(approval.expiresAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </Text>
                  )}
                  {decidingId === approval.id ? (
                    <ActivityIndicator size="small" color={colors.violet} style={{ marginTop: 8 }} />
                  ) : (
                    <View style={styles.approvalActions}>
                      <Pressable style={[styles.approveBtn, { borderColor: "rgba(16,185,129,0.3)" }]} onPress={() => handleDecide(approval.id, "approved")}>
                        <Feather name="check" size={13} color="#10b981" />
                        <Text style={[styles.approveBtnText, { color: "#10b981" }]}>Approve</Text>
                      </Pressable>
                      <Pressable style={[styles.rejectBtn, { borderColor: "rgba(239,68,68,0.3)" }]} onPress={() => handleDecide(approval.id, "rejected")}>
                        <Feather name="x" size={13} color="#ef4444" />
                        <Text style={[styles.rejectBtnText, { color: "#ef4444" }]}>Reject</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              ))}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

type ColorsType = ReturnType<typeof useColors>;

function EmptyState({ icon, title, body, colors }: { icon: FeatherIconName; title: string; body: string; colors: ColorsType }) {
  return (
    <View style={[styles.emptyState, { borderColor: colors.borderSubtle }]}>
      <Feather name={icon} size={28} color={colors.mutedForeground} style={{ opacity: 0.4 }} />
      <Text style={[styles.emptyTitle, { color: colors.creamDim }]}>{title}</Text>
      <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>{body}</Text>
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
  tabs: { flexDirection: "row", gap: 8, marginBottom: 16 },
  tabBtn: { flex: 1, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, alignItems: "center" },
  tabBtnText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  runList: { borderRadius: 10, borderWidth: 1, overflow: "hidden" },
  runRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderBottomWidth: 1 },
  runIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  runContent: { flex: 1 },
  runTopRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  runId: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  wfId: { fontSize: 11 },
  liveBadge: { backgroundColor: "rgba(139,92,246,0.15)", borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  liveBadgeText: { fontSize: 8, fontFamily: "Inter_600SemiBold", color: "#8b5cf6", letterSpacing: 1 },
  runBottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  runState: { fontSize: 11, fontFamily: "Inter_500Medium" },
  runTime: { fontSize: 11 },
  runError: { fontSize: 11, marginTop: 2 },
  approvalCard: { borderRadius: 10, borderWidth: 1, padding: 14 },
  approvalTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  approvalBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 6 },
  approvalBadgeText: { fontSize: 9, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  approvalId: { fontSize: 11 },
  approvalRole: { fontSize: 13, marginBottom: 6 },
  approvalDesc: { fontSize: 12, lineHeight: 18, marginBottom: 6 },
  approvalExpiry: { fontSize: 11, marginBottom: 8 },
  approvalActions: { flexDirection: "row", gap: 8, marginTop: 8 },
  approveBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 9, borderRadius: 8, borderWidth: 1 },
  approveBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  rejectBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 9, borderRadius: 8, borderWidth: 1 },
  rejectBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  emptyState: { alignItems: "center", paddingVertical: 48, borderRadius: 12, borderWidth: 1, borderStyle: "dashed", gap: 8 },
  emptyTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  emptyBody: { fontSize: 13, textAlign: "center", paddingHorizontal: 24 },
  staleBanner: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, marginBottom: 4 },
  staleText: { fontSize: 11, fontFamily: "Inter_500Medium" },
});
