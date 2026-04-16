import React, { useState, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, Alert,
  RefreshControl, Platform, ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useOptimisticMutation } from "@szl-holdings/mobile-shared/hooks";
import { useColors } from "@/hooks/useColors";
import { apiFetch, apiFetchRaw } from "@/lib/apiClient";
import { GestureHandlerRootView, Swipeable } from "react-native-gesture-handler";
import type { FeatherIconName } from "@/types/feather-icons";

interface WorkflowRunDetail {
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
  steps?: WorkflowStep[];
  approvals?: ApprovalItem[];
}

interface WorkflowStep {
  id: number;
  name: string;
  status: string;
  startedAt?: string | null;
  completedAt?: string | null;
  durationMs?: number | null;
  errorMessage?: string | null;
  outputSummary?: string | null;
}

interface ApprovalItem {
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

function formatMs(ms: number | null | undefined): string {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function formatRelative(ts: string | null): string {
  if (!ts) return "—";
  const ms = Date.now() - new Date(ts).getTime();
  if (ms < 60000) return "just now";
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
  return `${Math.floor(ms / 86400000)}d ago`;
}

export default function WorkflowDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [refreshing, setRefreshing] = useState(false);
  const qc = useQueryClient();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 16;

  const runQueryKey = ["alloy-run-detail", id];

  const { data: run, isLoading, isError, refetch } = useQuery<WorkflowRunDetail>({
    queryKey: runQueryKey,
    queryFn: async () => {
      const res = await apiFetchRaw(`/api/alloy/runs/${id}`);
      if (!res.ok) throw new Error("Failed to load run");
      const json = await res.json() as { data?: WorkflowRunDetail } | WorkflowRunDetail;
      return (json as { data?: WorkflowRunDetail }).data ?? json as WorkflowRunDetail;
    },
    enabled: !!id,
    refetchInterval: 15000,
  });

  const decideApproval = useOptimisticMutation<unknown, Error, { approvalId: number; decision: "approved" | "rejected"; note?: string }>({
    queryKey: runQueryKey,
    updater: (old, variables) => {
      if (!old || typeof old !== "object") return old;
      const run = old as WorkflowRunDetail;
      return {
        ...run,
        approvals: (run.approvals ?? []).map((a) =>
          a.id === variables.approvalId ? { ...a, status: variables.decision } : a
        ),
      };
    },
    mutationFn: async ({ approvalId, decision, note }) => {
      const body: { decision: string; note?: string } = { decision };
      if (note) body.note = note;
      const res = await apiFetchRaw(`/api/alloy/approvals/${approvalId}/decide`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to decide");
      return res.json();
    },
    onError: () => Alert.alert("Error", "Could not record decision. Try again."),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["alloy-approvals-pending"] });
      qc.invalidateQueries({ queryKey: ["alloy-runs"] });
    },
  });

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleDecide = useCallback((approvalId: number, decision: "approved" | "rejected", note?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    decideApproval.mutate({ approvalId, decision, note });
  }, [decideApproval]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.violet} />
      </View>
    );
  }

  if (isError || !run) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <Feather name="alert-triangle" size={32} color={colors.mutedForeground} style={{ opacity: 0.4 }} />
        <Text style={[styles.emptyTitle, { color: colors.creamDim, marginTop: 12 }]}>Run not found</Text>
        <Pressable onPress={() => router.back()} style={[styles.backLink, { borderColor: colors.border }]}>
          <Text style={{ color: colors.violet }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const cfg = STATE_CONFIG[run.state] ?? { color: "#6b7280", label: run.state, icon: "circle" };
  const pendingApprovals = (run.approvals ?? []).filter((a) => a.status === "pending");

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[`${cfg.color}10`, "transparent"]}
        style={[styles.headerGradient, { height: topPad + 140 }]}
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.violet} />}
      >
        <View style={styles.navRow}>
          <Pressable style={styles.backBtn} onPress={() => { Haptics.selectionAsync(); router.back(); }}>
            <Feather name="arrow-left" size={20} color={colors.creamDim} />
          </Pressable>
          <Text style={[styles.navTitle, { color: colors.cream }]}>Workflow Run</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={[styles.runHeader, { backgroundColor: colors.card, borderColor: colors.borderSubtle }]}>
          <View style={styles.runHeaderLeft}>
            <Feather name={cfg.icon} size={20} color={cfg.color} />
            <View>
              <Text style={[styles.runIdText, { color: colors.cream }]}>Run #{run.id}</Text>
              {run.workflowId && <Text style={[styles.wfId, { color: colors.mutedForeground }]}>Workflow #{run.workflowId}</Text>}
            </View>
          </View>
          <View style={[styles.stateBadge, { backgroundColor: `${cfg.color}15`, borderColor: `${cfg.color}30` }]}>
            <Text style={[styles.stateText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        <View style={styles.metaGrid}>
          {[
            { label: "Started", value: formatRelative(run.startedAt) },
            { label: "Duration", value: formatMs(run.durationMs) },
            { label: "Retries", value: `${run.retryCount}/${run.maxRetries}` },
            { label: "Workflow ID", value: run.workflowId ? `#${run.workflowId}` : "—" },
          ].map((m) => (
            <View key={m.label} style={[styles.metaCard, { backgroundColor: colors.card, borderColor: colors.borderSubtle }]}>
              <Text style={[styles.metaValue, { color: colors.cream }]}>{m.value}</Text>
              <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>{m.label}</Text>
            </View>
          ))}
        </View>

        {run.errorMessage && (
          <View style={[styles.errorBanner, { backgroundColor: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)" }]}>
            <Feather name="alert-circle" size={14} color="#ef4444" />
            <Text style={[styles.errorText, { color: "#ef4444" }]}>{run.errorMessage}</Text>
          </View>
        )}

        {pendingApprovals.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>PENDING APPROVALS</Text>
            <Text style={[styles.swipeHint, { color: colors.mutedForeground }]}>← Swipe to approve or reject →</Text>
            {pendingApprovals.map((approval) => (
              <SwipeableApproval
                key={approval.id}
                approval={approval}
                colors={colors}
                deciding={decideApproval.isPending && decideApproval.variables?.approvalId === approval.id}
                onDecide={handleDecide}
              />
            ))}
          </>
        )}

        {run.steps && run.steps.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>EXECUTION STEPS</Text>
            <View style={[styles.stepList, { borderColor: colors.borderSubtle }]}>
              {run.steps.map((step, i) => {
                const sc = STATE_CONFIG[step.status] ?? { color: "#6b7280", label: step.status, icon: "circle" };
                return (
                  <View key={step.id} style={[styles.stepRow, { borderTopWidth: i > 0 ? 1 : 0, borderColor: colors.borderSubtle }]}>
                    <View style={[styles.stepDot, { backgroundColor: sc.color }]} />
                    <View style={styles.stepContent}>
                      <View style={styles.stepTopRow}>
                        <Text style={[styles.stepName, { color: colors.cream }]}>{step.name}</Text>
                        <Text style={[styles.stepDuration, { color: colors.mutedForeground }]}>{formatMs(step.durationMs)}</Text>
                      </View>
                      <Text style={[styles.stepStatus, { color: sc.color }]}>{sc.label}</Text>
                      {step.outputSummary && <Text style={[styles.stepOutput, { color: colors.mutedForeground }]} numberOfLines={2}>{step.outputSummary}</Text>}
                      {step.errorMessage && <Text style={[styles.stepError, { color: "#ef4444" }]} numberOfLines={2}>{step.errorMessage}</Text>}
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function SwipeableApproval({
  approval,
  colors,
  deciding,
  onDecide,
}: {
  approval: ApprovalItem;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
  deciding: boolean;
  onDecide: (id: number, decision: "approved" | "rejected", note?: string) => void;
}) {
  const renderRightActions = () => (
    <Pressable
      style={[styles.swipeAction, { backgroundColor: "#ef4444" }]}
      onPress={() => onDecide(approval.id, "rejected")}
    >
      <Feather name="x" size={20} color="#fff" />
      <Text style={styles.swipeActionText}>Reject</Text>
    </Pressable>
  );

  const renderLeftActions = () => (
    <Pressable
      style={[styles.swipeAction, { backgroundColor: "#10b981" }]}
      onPress={() => onDecide(approval.id, "approved")}
    >
      <Feather name="check" size={20} color="#fff" />
      <Text style={styles.swipeActionText}>Approve</Text>
    </Pressable>
  );

  return (
    <Swipeable renderRightActions={renderRightActions} renderLeftActions={renderLeftActions} overshootFriction={8}>
      <View style={[styles.approvalCard, { backgroundColor: colors.card, borderColor: deciding ? "rgba(139,92,246,0.5)" : "rgba(139,92,246,0.2)" }]}>
        <View style={styles.approvalTop}>
          <View style={[styles.approvalBadge, { backgroundColor: "rgba(245,158,11,0.1)" }]}>
            <Feather name="clock" size={11} color="#f59e0b" />
            <Text style={[styles.approvalBadgeText, { color: "#f59e0b" }]}>PENDING</Text>
          </View>
          {deciding && <ActivityIndicator size="small" color={colors.violet} />}
        </View>
        <Text style={[styles.approvalRole, { color: colors.creamDim }]}>
          Requested from: <Text style={{ color: "#8b5cf6" }}>{approval.requestedFrom}</Text>
        </Text>
        {approval.description && (
          <Text style={[styles.approvalDesc, { color: colors.mutedForeground }]}>{approval.description}</Text>
        )}
        <View style={styles.approvalQuickActions}>
          <Pressable
            style={[styles.quickApprove, { borderColor: "rgba(16,185,129,0.3)" }]}
            onPress={() => onDecide(approval.id, "approved")}
            disabled={deciding}
          >
            <Feather name="check" size={13} color="#10b981" />
            <Text style={[styles.quickActionText, { color: "#10b981" }]}>Approve</Text>
          </Pressable>
          <Pressable
            style={[styles.quickReject, { borderColor: "rgba(239,68,68,0.3)" }]}
            onPress={() => onDecide(approval.id, "rejected")}
            disabled={deciding}
          >
            <Feather name="x" size={13} color="#ef4444" />
            <Text style={[styles.quickActionText, { color: "#ef4444" }]}>Reject</Text>
          </Pressable>
          <Pressable
            style={[styles.quickEscalate, { borderColor: "rgba(139,92,246,0.3)" }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert("Escalate", "This approval will be rejected and flagged for senior review.", [
                { text: "Cancel", style: "cancel" },
                { text: "Escalate", onPress: () => onDecide(approval.id, "rejected", "escalated_to_senior") },
              ]);
            }}
            disabled={deciding}
          >
            <Feather name="arrow-up-circle" size={13} color="#8b5cf6" />
            <Text style={[styles.quickActionText, { color: "#8b5cf6" }]}>Escalate</Text>
          </Pressable>
        </View>
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: "center", alignItems: "center" },
  headerGradient: { position: "absolute", top: 0, left: 0, right: 0 },
  content: { paddingHorizontal: 20 },
  navRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  navTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  runHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  runHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  runIdText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  wfId: { fontSize: 11, marginTop: 2 },
  stateBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  stateText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  metaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  metaCard: { width: "47%", borderRadius: 10, borderWidth: 1, padding: 12 },
  metaValue: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  metaLabel: { fontSize: 9, fontFamily: "Inter_500Medium", letterSpacing: 1 },
  errorBanner: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 16 },
  errorText: { fontSize: 12, lineHeight: 18, flex: 1 },
  sectionTitle: { fontSize: 9, fontFamily: "Inter_600SemiBold", letterSpacing: 2, marginBottom: 6, marginTop: 8 },
  swipeHint: { fontSize: 10, marginBottom: 10, textAlign: "center" },
  approvalCard: { borderRadius: 10, borderWidth: 1, padding: 14, marginBottom: 8 },
  approvalTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  approvalBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 6 },
  approvalBadgeText: { fontSize: 9, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  approvalRole: { fontSize: 13, marginBottom: 6 },
  approvalDesc: { fontSize: 12, lineHeight: 18, marginBottom: 8 },
  approvalQuickActions: { flexDirection: "row", gap: 6, marginTop: 4 },
  quickApprove: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  quickReject: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  quickEscalate: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  quickActionText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  swipeAction: { width: 80, justifyContent: "center", alignItems: "center", borderRadius: 10, marginBottom: 8, gap: 4 },
  swipeActionText: { color: "#fff", fontSize: 10, fontFamily: "Inter_600SemiBold" },
  stepList: { borderRadius: 10, borderWidth: 1, overflow: "hidden" },
  stepRow: { flexDirection: "row", padding: 12, gap: 10, alignItems: "flex-start" },
  stepDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  stepContent: { flex: 1 },
  stepTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  stepName: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  stepDuration: { fontSize: 11 },
  stepStatus: { fontSize: 10, fontFamily: "Inter_500Medium", marginTop: 2 },
  stepOutput: { fontSize: 11, marginTop: 4 },
  stepError: { fontSize: 11, marginTop: 4 },
  emptyTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  backLink: { marginTop: 16, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
});
