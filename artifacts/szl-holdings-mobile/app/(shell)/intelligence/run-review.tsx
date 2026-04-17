import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { apiFetch, getApiBase } from "@/lib/apiClient";

const ACCENT = "#c9a84c";

interface WorkflowRun {
  id: number;
  workflowId: number | null;
  state: "pending" | "running" | "completed" | "failed" | "cancelled" | string;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  retryCount: number;
  maxRetries: number;
  durationMs?: number | null;
  createdAt: string;
}

interface RunStep {
  id: number | string;
  name: string;
  state: "pending" | "running" | "completed" | "failed" | string;
  startedAt?: string | null;
  completedAt?: string | null;
  durationMs?: number | null;
  output?: Record<string, unknown> | null;
  error?: string | null;
}

interface RunStepsResponse {
  run: WorkflowRun;
  workflow?: { name?: string; id?: number };
  steps: RunStep[];
}

interface RunDetail extends WorkflowRun {
  steps?: RunStep[];
  workflowName?: string;
  triggeredBy?: string;
  inputSummary?: string;
  outputSummary?: string;
}

const STATE_COLORS: Record<string, string> = {
  completed: "#22c55e",
  running: ACCENT,
  pending: "#6b7280",
  failed: "#ef4444",
  cancelled: "#6b7280",
};

const STATE_ICONS: Record<string, React.ComponentProps<typeof Feather>["name"]> = {
  completed: "check-circle",
  running: "loader",
  pending: "clock",
  failed: "x-circle",
  cancelled: "slash",
};

function formatRelative(iso?: string | null): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatDuration(ms?: number | null): string {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  const secs = (ms / 1000).toFixed(1);
  if (ms < 60000) return `${secs}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function RunCard({
  run,
  colors,
  onPress,
}: {
  run: WorkflowRun;
  colors: ReturnType<typeof useColors>;
  onPress: (run: WorkflowRun) => void;
}) {
  const stateColor = STATE_COLORS[run.state] ?? "#6b7280";
  const stateIcon = STATE_ICONS[run.state] ?? "circle";

  return (
    <TouchableOpacity
      onPress={() => onPress(run)}
      style={[
        styles.runCard,
        { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: stateColor, borderLeftWidth: 3 },
      ]}
      activeOpacity={0.85}
    >
      <View style={styles.runCardHeader}>
        <Feather name={stateIcon} size={16} color={stateColor} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <View style={styles.runMeta}>
            <View style={[styles.statePill, { backgroundColor: stateColor + "18", borderColor: stateColor + "35" }]}>
              <Text style={[styles.statePillText, { color: stateColor }]}>{run.state.toUpperCase()}</Text>
            </View>
            <Text style={[styles.runTime, { color: colors.mutedForeground }]}>{formatRelative(run.startedAt ?? run.createdAt)}</Text>
          </View>
          <Text style={[styles.runId, { color: colors.foreground }]}>Run #{run.id}</Text>
          {run.workflowId && (
            <Text style={[styles.runWorkflow, { color: colors.mutedForeground }]}>Workflow {run.workflowId}</Text>
          )}
        </View>
        <View style={styles.runRightCol}>
          <Text style={[styles.runDuration, { color: run.state === "failed" ? "#ef4444" : colors.foreground }]}>
            {formatDuration(run.durationMs)}
          </Text>
          {run.retryCount > 0 && (
            <Text style={[styles.runRetry, { color: "#f59e0b" }]}>↺ {run.retryCount}</Text>
          )}
          <Feather name="chevron-right" size={14} color={colors.mutedForeground} style={{ marginTop: 4 }} />
        </View>
      </View>
      {run.errorMessage && (
        <Text style={styles.errorText} numberOfLines={1}>{run.errorMessage}</Text>
      )}
    </TouchableOpacity>
  );
}

function StepRow({ step, colors }: { step: RunStep; colors: ReturnType<typeof useColors> }) {
  const [expanded, setExpanded] = useState(false);
  const stateColor = STATE_COLORS[step.state] ?? "#6b7280";
  const stateIcon = STATE_ICONS[step.state] ?? "circle";

  return (
    <TouchableOpacity
      onPress={() => setExpanded((v) => !v)}
      style={[styles.stepRow, { borderColor: colors.border }]}
      activeOpacity={0.85}
    >
      <Feather name={stateIcon} size={13} color={stateColor} />
      <View style={{ flex: 1, marginLeft: 8 }}>
        <View style={styles.stepMeta}>
          <Text style={[styles.stepName, { color: colors.foreground }]}>{step.name}</Text>
          <Text style={[styles.stepDuration, { color: colors.mutedForeground }]}>{formatDuration(step.durationMs)}</Text>
        </View>
        {expanded && step.error && (
          <Text style={styles.stepError}>{step.error}</Text>
        )}
        {expanded && step.output && Object.keys(step.output).length > 0 && (
          <View style={[styles.stepOutput, { backgroundColor: colors.background, borderColor: colors.border }]}>
            {Object.entries(step.output).slice(0, 3).map(([k, v]) => (
              <Text key={k} style={[styles.stepOutputRow, { color: colors.foreground }]}>
                <Text style={{ color: colors.mutedForeground }}>{k}: </Text>
                {String(v).slice(0, 60)}
              </Text>
            ))}
          </View>
        )}
      </View>
      <Feather name={expanded ? "chevron-up" : "chevron-down"} size={12} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

function RunDetailPanel({
  run,
  colors,
  onClose,
}: {
  run: RunDetail;
  colors: ReturnType<typeof useColors>;
  onClose: () => void;
}) {
  const stateColor = STATE_COLORS[run.state] ?? "#6b7280";
  const stateIcon = STATE_ICONS[run.state] ?? "circle";

  const openReplay = () => {
    const base = getApiBase();
    const target = base
      ? `${base.replace(/\/api\/?$/, "")}/command/#run/${run.id}`
      : `/command/#run/${run.id}`;
    Linking.openURL(target);
  };

  const steps: RunStep[] = run.steps ?? [];

  return (
    <View style={[styles.detailPanel, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={onClose} style={styles.detailClose}>
          <Feather name="x" size={18} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.detailTitle, { color: colors.foreground }]}>Run #{run.id}</Text>
        <TouchableOpacity onPress={openReplay} style={[styles.replayBtn, { borderColor: ACCENT + "50", backgroundColor: ACCENT + "12" }]}>
          <Feather name="external-link" size={12} color={ACCENT} />
          <Text style={[styles.replayBtnText, { color: ACCENT }]}>Replay on Web</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.summaryRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>STATE</Text>
            <View style={styles.summaryStateRow}>
              <Feather name={stateIcon} size={12} color={stateColor} />
              <Text style={[styles.summaryStateText, { color: stateColor }]}>{run.state.toUpperCase()}</Text>
            </View>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>DURATION</Text>
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>{formatDuration(run.durationMs)}</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>RETRIES</Text>
            <Text style={[styles.summaryValue, { color: run.retryCount > 0 ? "#f59e0b" : colors.foreground }]}>
              {run.retryCount}/{run.maxRetries}
            </Text>
          </View>
        </View>

        <View style={styles.timelineBlock}>
          <Text style={[styles.blockLabel, { color: colors.mutedForeground }]}>TIMELINE</Text>
          <View style={[styles.timelineCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {[
              { label: "Created", value: formatRelative(run.createdAt) },
              { label: "Started", value: formatRelative(run.startedAt) },
              { label: "Completed", value: formatRelative(run.completedAt) },
            ].map(({ label, value }) => (
              <View key={label} style={[styles.timelineRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.timelineLabel, { color: colors.mutedForeground }]}>{label}</Text>
                <Text style={[styles.timelineValue, { color: colors.foreground }]}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        {run.workflowName && (
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>WORKFLOW</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>{run.workflowName}</Text>
          </View>
        )}

        {run.errorMessage && (
          <View style={[styles.errorCard, { borderColor: "#ef444435" }]}>
            <Text style={styles.errorCardLabel}>ERROR</Text>
            <Text style={styles.errorCardText}>{run.errorMessage}</Text>
          </View>
        )}

        {steps.length > 0 && (
          <>
            <Text style={[styles.blockLabel, { color: colors.mutedForeground }]}>COGNITIVE LOOP TRACE ({steps.length} steps)</Text>
            <View style={[styles.stepsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.loopLine, { backgroundColor: ACCENT + "30" }]} />
              {steps.map((step, i) => (
                <StepRow key={step.id ?? i} step={step} colors={colors} />
              ))}
            </View>
          </>
        )}

        {steps.length === 0 && (
          <View style={[styles.noStepsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="list" size={20} color={colors.mutedForeground} />
            <Text style={[styles.noStepsText, { color: colors.mutedForeground }]}>
              Step-level trace not available for this run. Open full replay on the web for complete details.
            </Text>
          </View>
        )}

        <TouchableOpacity onPress={openReplay} style={[styles.fullReplayBtn, { borderColor: ACCENT + "50", backgroundColor: ACCENT + "10" }]}>
          <Feather name="monitor" size={14} color={ACCENT} />
          <Text style={[styles.fullReplayBtnText, { color: ACCENT }]}>Open Full Replay in Command Portal</Text>
          <Feather name="external-link" size={12} color={ACCENT} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

type FilterState = "all" | "completed" | "failed" | "running";

export default function RunReviewScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState<FilterState>("all");
  const [selectedRun, setSelectedRun] = useState<RunDetail | null>(null);

  const runsQuery = useQuery<{ data: WorkflowRun[] } | WorkflowRun[]>({
    queryKey: ["run-review-list"],
    queryFn: () =>
      apiFetch<{ data: WorkflowRun[] } | WorkflowRun[]>("/api/alloy/runs?limit=30"),
    refetchInterval: 30000,
    staleTime: 15000,
  });

  const normalizeRuns = (raw: { data: WorkflowRun[] } | WorkflowRun[] | undefined): WorkflowRun[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    return (raw as { data: WorkflowRun[] }).data ?? [];
  };

  const allRuns = normalizeRuns(runsQuery.data);
  const filteredRuns = activeFilter === "all"
    ? allRuns
    : allRuns.filter((r) => r.state === activeFilter);

  const stats = {
    total: allRuns.length,
    running: allRuns.filter((r) => r.state === "running").length,
    failed: allRuns.filter((r) => r.state === "failed").length,
    completed: allRuns.filter((r) => r.state === "completed").length,
  };

  const handleRunPress = async (run: WorkflowRun) => {
    try {
      const [detailRaw, stepsRaw] = await Promise.allSettled([
        apiFetch<{ data: RunDetail } | RunDetail>(`/api/alloy/runs/${run.id}`),
        apiFetch<{ data: RunStepsResponse } | RunStepsResponse>(`/api/alloy/runs/${run.id}/steps`),
      ]);

      const baseRun: RunDetail =
        detailRaw.status === "fulfilled"
          ? ((detailRaw.value as { data: RunDetail })?.data ?? (detailRaw.value as RunDetail))
          : { ...run };

      let steps: RunStep[] | undefined;
      let workflowName: string | undefined;
      if (stepsRaw.status === "fulfilled") {
        const stepsData = (stepsRaw.value as { data: RunStepsResponse })?.data ?? (stepsRaw.value as RunStepsResponse);
        steps = Array.isArray(stepsData?.steps) ? stepsData.steps : undefined;
        workflowName = stepsData?.workflow?.name;
      }

      setSelectedRun({ ...baseRun, steps, workflowName: workflowName ?? baseRun.workflowName });
    } catch {
      setSelectedRun({ ...run });
    }
  };

  const FILTERS: Array<{ key: FilterState; label: string }> = [
    { key: "all", label: "All" },
    { key: "running", label: "Running" },
    { key: "failed", label: "Failed" },
    { key: "completed", label: "Completed" },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={18} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Run Review</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Cognitive loop traces · Alloy runtime
          </Text>
        </View>
        <TouchableOpacity onPress={() => runsQuery.refetch()} style={styles.refreshBtn}>
          <Feather name="refresh-cw" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {allRuns.length > 0 && (
        <View style={[styles.statsBar, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
          {[
            { label: "TOTAL", value: stats.total, color: colors.foreground },
            { label: "RUNNING", value: stats.running, color: ACCENT },
            { label: "FAILED", value: stats.failed, color: stats.failed > 0 ? "#ef4444" : colors.mutedForeground },
            { label: "OK", value: stats.completed, color: "#22c55e" },
          ].map(({ label, value, color }) => (
            <View key={label} style={styles.statItem}>
              <Text style={[styles.statValue, { color }]}>{value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={[styles.filterBar, { borderBottomColor: colors.border }]}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setActiveFilter(f.key)}
            style={[
              styles.filterChip,
              activeFilter === f.key
                ? { backgroundColor: ACCENT + "18", borderColor: ACCENT + "50" }
                : { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.filterChipText, { color: activeFilter === f.key ? ACCENT : colors.mutedForeground }]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={runsQuery.isRefetching}
            onRefresh={() => runsQuery.refetch()}
            tintColor={ACCENT}
          />
        }
      >
        {runsQuery.isLoading ? (
          <ActivityIndicator color={ACCENT} style={{ marginTop: 32 }} />
        ) : filteredRuns.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="activity" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {activeFilter === "all" ? "No runs recorded" : `No ${activeFilter} runs`}
            </Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Alloy cognitive runs will appear here
            </Text>
          </View>
        ) : (
          filteredRuns.map((run) => (
            <RunCard key={run.id} run={run} colors={colors} onPress={handleRunPress} />
          ))
        )}
      </ScrollView>

      {selectedRun && (
        <RunDetailPanel run={selectedRun} colors={colors} onClose={() => setSelectedRun(null)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  backBtn: { marginRight: 10, padding: 4 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: "700", letterSpacing: -0.3 },
  headerSub: { fontSize: 11, marginTop: 1 },
  refreshBtn: { padding: 8 },
  statsBar: {
    flexDirection: "row", paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1,
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 16, fontWeight: "700" },
  statLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5, marginTop: 2 },
  filterBar: {
    flexDirection: "row", paddingHorizontal: 16, paddingVertical: 10,
    gap: 8, borderBottomWidth: 1,
  },
  filterChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  filterChipText: { fontSize: 12, fontWeight: "600" },
  scroll: { flex: 1 },
  scrollContent: { padding: 14, gap: 10 },
  runCard: { borderRadius: 10, borderWidth: 1, padding: 14, overflow: "hidden" },
  runCardHeader: { flexDirection: "row", alignItems: "flex-start" },
  runMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  statePill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  statePillText: { fontSize: 10, fontWeight: "700" },
  runTime: { fontSize: 10 },
  runId: { fontSize: 13, fontWeight: "700" },
  runWorkflow: { fontSize: 11, marginTop: 2 },
  runRightCol: { alignItems: "flex-end" },
  runDuration: { fontSize: 13, fontWeight: "600" },
  runRetry: { fontSize: 10, marginTop: 2 },
  errorText: { fontSize: 11, color: "#ef4444", marginTop: 6, marginLeft: 26 },
  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 15, fontWeight: "500" },
  emptySub: { fontSize: 12 },
  detailPanel: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    height: "85%", borderTopWidth: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    elevation: 20, shadowColor: "#000", shadowOpacity: 0.5, shadowRadius: 20,
  },
  detailHeader: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#1e2433",
  },
  detailClose: { padding: 4 },
  detailTitle: { flex: 1, fontSize: 15, fontWeight: "700" },
  replayBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1,
  },
  replayBtnText: { fontSize: 11, fontWeight: "600" },
  summaryRow: { flexDirection: "row", borderRadius: 8, borderWidth: 1, padding: 12 },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryStateRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  summaryStateText: { fontSize: 11, fontWeight: "700" },
  summaryLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5 },
  summaryValue: { fontSize: 13, fontWeight: "700", marginTop: 3 },
  summaryDivider: { width: 1, marginVertical: 4 },
  timelineBlock: { gap: 8 },
  blockLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.8 },
  timelineCard: { borderRadius: 8, borderWidth: 1, overflow: "hidden" },
  timelineRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1,
  },
  timelineLabel: { fontSize: 11 },
  timelineValue: { fontSize: 11, fontWeight: "500" },
  infoCard: { borderRadius: 8, borderWidth: 1, padding: 12 },
  infoLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4 },
  infoValue: { fontSize: 13 },
  errorCard: {
    borderRadius: 8, borderWidth: 1, padding: 12,
    backgroundColor: "#ef444410",
  },
  errorCardLabel: { fontSize: 9, fontWeight: "700", color: "#ef4444", letterSpacing: 0.5, marginBottom: 4 },
  errorCardText: { fontSize: 12, color: "#ef4444", lineHeight: 17 },
  stepsCard: { borderRadius: 8, borderWidth: 1, padding: 12, position: "relative" },
  loopLine: { position: "absolute", left: 22, top: 20, bottom: 20, width: 2 },
  stepRow: {
    flexDirection: "row", alignItems: "flex-start",
    paddingVertical: 8, borderBottomWidth: 1, gap: 0,
  },
  stepMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  stepName: { fontSize: 12, fontWeight: "600", flex: 1 },
  stepDuration: { fontSize: 10 },
  stepError: { fontSize: 11, color: "#ef4444", marginTop: 3 },
  stepOutput: { borderRadius: 6, borderWidth: 1, padding: 8, marginTop: 5, gap: 2 },
  stepOutputRow: { fontSize: 10, lineHeight: 14 },
  noStepsCard: {
    borderRadius: 8, borderWidth: 1, padding: 16,
    alignItems: "center", gap: 8,
  },
  noStepsText: { fontSize: 12, textAlign: "center", lineHeight: 17 },
  fullReplayBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, padding: 12, borderRadius: 10, borderWidth: 1,
  },
  fullReplayBtnText: { fontSize: 13, fontWeight: "600", flex: 1, textAlign: "center" },
});
