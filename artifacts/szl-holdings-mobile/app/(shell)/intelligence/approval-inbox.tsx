import React, { useState, useCallback, useEffect } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, TextInput, Alert, Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { apiFetch } from "@/lib/apiClient";
import { useSyncEngine } from "@szl-holdings/mobile-shared";
import { cacheSet, cacheGetStale, CACHE_KEYS } from "@/lib/cache";

const ACCENT = "#c9a84c";

type Priority = "low" | "medium" | "high" | "critical";
type Decision = "approved" | "rejected" | "revised";

interface Approval {
  id: number;
  title: string;
  description?: string;
  resourceType: string;
  resourceId: string;
  actionClass: string;
  priority: Priority;
  status: string;
  requestedByRole?: string;
  requiredApproverRole?: string;
  expiresAt?: string;
  createdAt: string;
  payload?: Record<string, unknown>;
}

interface AuditEntry {
  id: number;
  action: string;
  actorRole?: string;
  note?: string;
  createdAt: string;
}

interface QueuedDecision {
  approvalId: number;
  approvalTitle: string;
  decision: Decision;
  note: string;
  queuedAt: string;
}

const PRIORITY_COLORS: Record<Priority, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#f59e0b",
  low: "#6b7280",
};

const ACTION_CLASS_ICONS: Record<string, string> = {
  financial: "dollar-sign",
  compliance: "shield",
  deployment: "upload-cloud",
  data_access: "database",
  general: "check-square",
};

function formatRelative(iso?: string): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function timeUntil(iso?: string): string {
  if (!iso) return "No expiry";
  const ms = new Date(iso).getTime() - Date.now();
  if (ms < 0) return "Expired";
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `Expires in ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Expires in ${hrs}h`;
  return `Expires in ${Math.floor(hrs / 24)}d`;
}

function ApprovalCard({
  approval,
  colors,
  onReview,
}: {
  approval: Approval;
  colors: ReturnType<typeof useColors>;
  onReview: (approval: Approval) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const prioColor = PRIORITY_COLORS[approval.priority] ?? "#6b7280";
  const iconName = (ACTION_CLASS_ICONS[approval.actionClass] ?? "check-square") as React.ComponentProps<typeof Feather>["name"];
  const expiring = approval.expiresAt && (new Date(approval.expiresAt).getTime() - Date.now()) < 2 * 3600 * 1000;

  return (
    <TouchableOpacity
      onPress={() => setExpanded((v) => !v)}
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: prioColor, borderLeftWidth: 3 },
      ]}
      activeOpacity={0.85}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconBadge, { backgroundColor: prioColor + "18", borderColor: prioColor + "35" }]}>
          <Feather name={iconName} size={14} color={prioColor} />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <View style={styles.cardMeta}>
            <View style={[styles.pill, { backgroundColor: prioColor + "18", borderColor: prioColor + "35" }]}>
              <Text style={[styles.pillText, { color: prioColor }]}>{approval.priority.toUpperCase()}</Text>
            </View>
            <View style={[styles.pill, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.pillText, { color: colors.mutedForeground }]}>{approval.actionClass}</Text>
            </View>
            {expiring && (
              <View style={[styles.pill, { backgroundColor: "#ef444418", borderColor: "#ef444440" }]}>
                <Feather name="clock" size={9} color="#ef4444" />
                <Text style={[styles.pillText, { color: "#ef4444", marginLeft: 3 }]}>EXPIRING</Text>
              </View>
            )}
          </View>
          <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={expanded ? undefined : 2}>
            {approval.title}
          </Text>
          <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
            {approval.resourceType}/{approval.resourceId} · {formatRelative(approval.createdAt)}
          </Text>
          {!expanded && approval.expiresAt && (
            <Text style={[styles.expiry, { color: expiring ? "#ef4444" : colors.mutedForeground }]}>
              {timeUntil(approval.expiresAt)}
            </Text>
          )}
        </View>
        <Feather name={expanded ? "chevron-up" : "chevron-down"} size={14} color={colors.mutedForeground} />
      </View>

      {expanded && (
        <View style={styles.cardBody}>
          {approval.description && (
            <Text style={[styles.cardDesc, { color: colors.foreground }]}>{approval.description}</Text>
          )}
          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>REQUESTER ROLE</Text>
              <Text style={[styles.metaValue, { color: colors.foreground }]}>{approval.requestedByRole ?? "—"}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>REQUIRED APPROVER</Text>
              <Text style={[styles.metaValue, { color: colors.foreground }]}>{approval.requiredApproverRole ?? "any"}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>EXPIRES</Text>
              <Text style={[styles.metaValue, { color: expiring ? "#ef4444" : colors.foreground }]}>
                {timeUntil(approval.expiresAt)}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>STATUS</Text>
              <Text style={[styles.metaValue, { color: colors.foreground }]}>{approval.status}</Text>
            </View>
          </View>

          {approval.payload && Object.keys(approval.payload).length > 0 && (
            <View style={[styles.evidenceBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.evidenceLabel, { color: colors.mutedForeground }]}>EVIDENCE / CONTEXT</Text>
              {Object.entries(approval.payload).slice(0, 4).map(([k, v]) => (
                <Text key={k} style={[styles.evidenceRow, { color: colors.foreground }]}>
                  <Text style={{ color: colors.mutedForeground }}>{k}: </Text>
                  {String(v)}
                </Text>
              ))}
            </View>
          )}

          <TouchableOpacity
            onPress={() => onReview(approval)}
            style={[styles.reviewBtn, { backgroundColor: ACCENT + "18", borderColor: ACCENT + "50" }]}
          >
            <Feather name="check-circle" size={14} color={ACCENT} />
            <Text style={[styles.reviewBtnText, { color: ACCENT }]}>Review &amp; Decide</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

function QueuedDecisionCard({
  item,
  colors,
  onRetry,
  onDiscard,
}: {
  item: QueuedDecision;
  colors: ReturnType<typeof useColors>;
  onRetry: (item: QueuedDecision) => void;
  onDiscard: (approvalId: number) => void;
}) {
  const decisionColor =
    item.decision === "approved" ? "#22c55e" : item.decision === "rejected" ? "#ef4444" : "#f59e0b";
  return (
    <View style={[styles.queuedCard, { backgroundColor: colors.card, borderColor: "#f59e0b40" }]}>
      <View style={styles.queuedHeader}>
        <View style={[styles.queuedBadge, { backgroundColor: "#f59e0b15", borderColor: "#f59e0b40" }]}>
          <Feather name="clock" size={10} color="#f59e0b" />
          <Text style={[styles.queuedBadgeText, { color: "#f59e0b" }]}>QUEUED OFFLINE</Text>
        </View>
        <Text style={[styles.queuedTime, { color: colors.mutedForeground }]}>
          {formatRelative(item.queuedAt)}
        </Text>
      </View>
      <Text style={[styles.queuedTitle, { color: colors.foreground }]} numberOfLines={2}>
        {item.approvalTitle}
      </Text>
      <View style={styles.queuedDecisionRow}>
        <View style={[styles.pill, { backgroundColor: decisionColor + "18", borderColor: decisionColor + "35" }]}>
          <Text style={[styles.pillText, { color: decisionColor }]}>{item.decision.toUpperCase()}</Text>
        </View>
        {item.note ? (
          <Text style={[styles.queuedNote, { color: colors.mutedForeground }]} numberOfLines={1}>
            "{item.note}"
          </Text>
        ) : null}
      </View>
      <View style={styles.queuedActions}>
        <TouchableOpacity
          onPress={() => onRetry(item)}
          style={[styles.queuedActionBtn, { backgroundColor: ACCENT + "18", borderColor: ACCENT + "40" }]}
        >
          <Feather name="upload-cloud" size={12} color={ACCENT} />
          <Text style={[styles.queuedActionText, { color: ACCENT }]}>Retry Now</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onDiscard(item.approvalId)}
          style={[styles.queuedActionBtn, { backgroundColor: "#ef444418", borderColor: "#ef444440" }]}
        >
          <Feather name="trash-2" size={12} color="#ef4444" />
          <Text style={[styles.queuedActionText, { color: "#ef4444" }]}>Discard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ReviewModal({
  approval,
  visible,
  onClose,
  onSubmit,
  isPending,
  isOffline,
}: {
  approval: Approval | null;
  visible: boolean;
  onClose: () => void;
  onSubmit: (decision: Decision, note: string) => void;
  isPending: boolean;
  isOffline: boolean;
}) {
  const [decision, setDecision] = useState<Decision | null>(null);
  const [note, setNote] = useState("");

  const DECISIONS: Array<{ key: Decision; label: string; color: string; icon: React.ComponentProps<typeof Feather>["name"] }> = [
    { key: "approved", label: "Approve", color: "#22c55e", icon: "check" },
    { key: "rejected", label: "Reject", color: "#ef4444", icon: "x" },
    { key: "revised", label: "Request Revision", color: "#f59e0b", icon: "edit-2" },
  ];

  const handleSubmit = () => {
    if (!decision) {
      Alert.alert("Select a decision", "Please choose Approve, Reject, or Request Revision.");
      return;
    }
    onSubmit(decision, note);
  };

  const reset = () => {
    setDecision(null);
    setNote("");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={reset}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: "#0d1220" }]}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Review Approval</Text>
            <TouchableOpacity onPress={reset}>
              <Feather name="x" size={18} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {isOffline && (
            <View style={styles.offlineNotice}>
              <Feather name="wifi-off" size={12} color="#f59e0b" />
              <Text style={styles.offlineNoticeText}>
                You're offline — this decision will be queued and synced when connectivity returns.
              </Text>
            </View>
          )}

          {approval && (
            <>
              <Text style={styles.modalApprovalTitle} numberOfLines={2}>{approval.title}</Text>
              <Text style={styles.modalApprovalSub}>
                {approval.resourceType} · {approval.actionClass} · {(PRIORITY_COLORS[approval.priority] ? approval.priority.toUpperCase() : approval.priority)}
              </Text>

              <Text style={styles.modalSectionLabel}>DECISION</Text>
              <View style={styles.decisionRow}>
                {DECISIONS.map((d) => (
                  <TouchableOpacity
                    key={d.key}
                    onPress={() => setDecision(d.key)}
                    style={[
                      styles.decisionBtn,
                      { borderColor: decision === d.key ? d.color : "#1e2433" },
                      decision === d.key && { backgroundColor: d.color + "18" },
                    ]}
                  >
                    <Feather name={d.icon} size={14} color={decision === d.key ? d.color : "#6b7280"} />
                    <Text style={[styles.decisionBtnText, { color: decision === d.key ? d.color : "#6b7280" }]}>
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalSectionLabel}>NOTE (optional)</Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Reason, condition, or revision request..."
                placeholderTextColor="#4b5563"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                style={styles.noteInput}
              />

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isPending || !decision}
                style={[
                  styles.submitBtn,
                  { backgroundColor: decision ? ACCENT + "18" : "#1e2433", borderColor: decision ? ACCENT + "50" : "#1e2433" },
                  isPending && { opacity: 0.6 },
                ]}
              >
                {isPending ? (
                  <ActivityIndicator size="small" color={ACCENT} />
                ) : (
                  <Text style={[styles.submitBtnText, { color: decision ? ACCENT : "#6b7280" }]}>
                    {isOffline ? "Queue Decision" : "Submit Decision"}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

type StatusFilter = "pending" | "all" | "approved" | "rejected";

const QUEUE_STORAGE_KEY = "cortex:approval-offline-queue";

async function loadQueuedDecisions(): Promise<QueuedDecision[]> {
  try {
    const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
    const raw = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QueuedDecision[]) : [];
  } catch {
    return [];
  }
}

async function saveQueuedDecisions(items: QueuedDecision[]): Promise<void> {
  try {
    const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export default function ApprovalInboxScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [reviewTarget, setReviewTarget] = useState<Approval | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<QueuedDecision[]>([]);
  const [queueLoaded, setQueueLoaded] = useState(false);

  const syncEngine = useSyncEngine();
  const isOffline = !syncEngine.isOnline;

  useEffect(() => {
    loadQueuedDecisions().then((items) => {
      setOfflineQueue(items);
      setQueueLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!queueLoaded) return;
    saveQueuedDecisions(offlineQueue);
  }, [offlineQueue, queueLoaded]);

  useEffect(() => {
    if (!queueLoaded) return;
    if (!isOffline && offlineQueue.length > 0) {
      flushOfflineQueue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOffline, queueLoaded]);

  const approvalsQuery = useQuery<Approval[]>({
    queryKey: ["cognitive-approvals", statusFilter],
    queryFn: async () => {
      try {
        const raw = await apiFetch<{ data: Approval[] } | Approval[]>(
          `/api/approvals?status=${statusFilter === "pending" ? "pending" : statusFilter}`
        );
        const arr = Array.isArray(raw) ? raw : ((raw as { data: Approval[] }).data ?? []);
        if (statusFilter === "pending") {
          await cacheSet(CACHE_KEYS.APPROVALS, arr);
        }
        return arr;
      } catch {
        if (statusFilter === "pending") {
          const cached = await cacheGetStale<Approval[]>(CACHE_KEYS.APPROVALS);
          if (cached) return cached;
        }
        return [];
      }
    },
    refetchInterval: isOffline ? false : 30000,
    staleTime: 15000,
  });

  const approvals = approvalsQuery.data ?? [];

  const reviewMutation = useMutation({
    mutationFn: async ({ id, decision, note }: { id: number; decision: Decision; note: string }) => {
      return apiFetch(`/api/approvals/${id}/review`, {
        method: "POST",
        body: JSON.stringify({ decision, note: note || undefined }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cognitive-approvals"] });
      setModalVisible(false);
      setReviewTarget(null);
      Alert.alert("Decision recorded", "The approval decision has been submitted and logged.");
    },
    onError: () => {
      Alert.alert("Error", "Failed to submit decision. Please try again.");
    },
  });

  const enqueueDecisionOffline = useCallback(
    async (approval: Approval, decision: Decision, note: string) => {
      const entry: QueuedDecision = {
        approvalId: approval.id,
        approvalTitle: approval.title,
        decision,
        note,
        queuedAt: new Date().toISOString(),
      };
      setOfflineQueue((prev) => {
        const filtered = prev.filter((q) => q.approvalId !== approval.id);
        return [...filtered, entry];
      });
    },
    []
  );

  const flushOfflineQueue = useCallback(async () => {
    const queue = await loadQueuedDecisions();
    if (queue.length === 0) return;
    const remaining: QueuedDecision[] = [];
    for (const item of queue) {
      try {
        await apiFetch(`/api/approvals/${item.approvalId}/review`, {
          method: "POST",
          body: JSON.stringify({ decision: item.decision, note: item.note || undefined }),
        });
      } catch {
        remaining.push(item);
      }
    }
    setOfflineQueue(remaining);
    if (remaining.length < queue.length) {
      qc.invalidateQueries({ queryKey: ["cognitive-approvals"] });
    }
  }, [qc]);

  const retryQueuedItem = useCallback(
    async (item: QueuedDecision) => {
      try {
        await apiFetch(`/api/approvals/${item.approvalId}/review`, {
          method: "POST",
          body: JSON.stringify({ decision: item.decision, note: item.note || undefined }),
        });
        setOfflineQueue((prev) => prev.filter((q) => q.approvalId !== item.approvalId));
        qc.invalidateQueries({ queryKey: ["cognitive-approvals"] });
        Alert.alert("Synced", "Queued decision submitted successfully.");
      } catch {
        Alert.alert("Still offline", "Cannot reach the server. Decision remains queued.");
      }
    },
    [qc]
  );

  const discardQueuedItem = useCallback((approvalId: number) => {
    Alert.alert("Discard Decision", "Remove this queued decision? It will not be submitted.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Discard",
        style: "destructive",
        onPress: () =>
          setOfflineQueue((prev) => prev.filter((q) => q.approvalId !== approvalId)),
      },
    ]);
  }, []);

  const openReview = useCallback((approval: Approval) => {
    setReviewTarget(approval);
    setModalVisible(true);
  }, []);

  const handleSubmitDecision = useCallback(
    async (decision: Decision, note: string) => {
      if (!reviewTarget) return;
      if (isOffline) {
        await enqueueDecisionOffline(reviewTarget, decision, note);
        setModalVisible(false);
        setReviewTarget(null);
        Alert.alert(
          "Decision Queued",
          "You're offline. Your decision has been saved locally and will sync automatically when connectivity returns."
        );
        return;
      }
      reviewMutation.mutate({ id: reviewTarget.id, decision, note });
    },
    [reviewTarget, reviewMutation, isOffline, enqueueDecisionOffline]
  );

  const STATUS_FILTERS: Array<{ key: StatusFilter; label: string }> = [
    { key: "pending", label: "Pending" },
    { key: "all", label: "All" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ];

  const queuedIdsForFilter = statusFilter === "pending"
    ? new Set(offlineQueue.map((q) => q.approvalId))
    : new Set<number>();
  const pendingApprovals = approvals.filter((a) => !queuedIdsForFilter.has(a.id));

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={18} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Approval Inbox</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Guardian-routed · {approvals.length} item{approvals.length !== 1 ? "s" : ""}
            {offlineQueue.length > 0 ? ` · ${offlineQueue.length} queued` : ""}
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
          {isOffline && (
            <View style={[styles.offlinePill, { backgroundColor: "#f59e0b15", borderColor: "#f59e0b30" }]}>
              <Feather name="wifi-off" size={11} color="#f59e0b" />
              <Text style={[styles.offlinePillText, { color: "#f59e0b" }]}>OFFLINE</Text>
            </View>
          )}
          <TouchableOpacity onPress={() => approvalsQuery.refetch()} style={styles.refreshBtn}>
            <Feather name="refresh-cw" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>

      {offlineQueue.length > 0 && (
        <View style={[styles.queueBanner, { backgroundColor: "#f59e0b10", borderBottomColor: "#f59e0b25" }]}>
          <Feather name="clock" size={13} color="#f59e0b" />
          <Text style={styles.queueBannerText}>
            {offlineQueue.length} decision{offlineQueue.length !== 1 ? "s" : ""} queued offline
            {!isOffline ? " — tap Retry Now to sync" : ""}
          </Text>
          {!isOffline && (
            <TouchableOpacity onPress={flushOfflineQueue} style={styles.queueBannerBtn}>
              <Text style={styles.queueBannerBtnText}>Sync All</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={[styles.filterBar, { borderBottomColor: colors.border }]}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setStatusFilter(f.key)}
            style={[
              styles.filterChip,
              statusFilter === f.key && { backgroundColor: ACCENT + "18", borderColor: ACCENT + "50" },
              statusFilter !== f.key && { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.filterChipText, { color: statusFilter === f.key ? ACCENT : colors.mutedForeground }]}>
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
            refreshing={approvalsQuery.isRefetching}
            onRefresh={() => approvalsQuery.refetch()}
            tintColor={ACCENT}
          />
        }
      >
        {offlineQueue.length > 0 && (
          <View style={styles.queuedSection}>
            <Text style={[styles.sectionLabel, { color: "#f59e0b" }]}>QUEUED OFFLINE</Text>
            {offlineQueue.map((item) => (
              <QueuedDecisionCard
                key={item.approvalId}
                item={item}
                colors={colors}
                onRetry={retryQueuedItem}
                onDiscard={discardQueuedItem}
              />
            ))}
          </View>
        )}

        {approvalsQuery.isLoading ? (
          <ActivityIndicator color={ACCENT} style={{ marginTop: 32 }} />
        ) : pendingApprovals.length === 0 && offlineQueue.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="inbox" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {statusFilter === "pending" ? "No pending approvals" : "No approvals found"}
            </Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              {isOffline ? "Showing cached data — connect to refresh" : "Guardian-routed items will appear here"}
            </Text>
          </View>
        ) : (
          pendingApprovals.map((approval) => (
            <ApprovalCard
              key={approval.id}
              approval={approval}
              colors={colors}
              onReview={openReview}
            />
          ))
        )}
      </ScrollView>

      <ReviewModal
        key={reviewTarget?.id ?? "empty"}
        approval={reviewTarget}
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setReviewTarget(null); }}
        onSubmit={handleSubmitDecision}
        isPending={reviewMutation.isPending}
        isOffline={isOffline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { marginRight: 10, padding: 4 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: "700", letterSpacing: -0.3 },
  headerSub: { fontSize: 11, marginTop: 1 },
  refreshBtn: { padding: 8 },
  offlinePill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 12, borderWidth: 1,
  },
  offlinePillText: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5 },
  queueBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1,
  },
  queueBannerText: { flex: 1, fontSize: 12, color: "#f59e0b", fontWeight: "500" },
  queueBannerBtn: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 6, backgroundColor: "#f59e0b18",
  },
  queueBannerBtnText: { fontSize: 11, color: "#f59e0b", fontWeight: "600" },
  filterBar: {
    flexDirection: "row", paddingHorizontal: 16, paddingVertical: 10,
    gap: 8, borderBottomWidth: 1,
  },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
  },
  filterChipText: { fontSize: 12, fontWeight: "600" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 10 },
  sectionLabel: {
    fontSize: 9, fontWeight: "700", letterSpacing: 1.5,
    textTransform: "uppercase", marginBottom: 8,
  },
  queuedSection: { marginBottom: 4, gap: 8 },
  queuedCard: {
    borderRadius: 10, borderWidth: 1, padding: 12,
    gap: 8,
  },
  queuedHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  queuedBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 6, borderWidth: 1,
  },
  queuedBadgeText: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5 },
  queuedTime: { fontSize: 10 },
  queuedTitle: { fontSize: 13, fontWeight: "600", lineHeight: 18 },
  queuedDecisionRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  queuedNote: { flex: 1, fontSize: 11, fontStyle: "italic" },
  queuedActions: { flexDirection: "row", gap: 8 },
  queuedActionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, paddingVertical: 8, borderRadius: 8, borderWidth: 1,
  },
  queuedActionText: { fontSize: 11, fontWeight: "600" },
  card: {
    borderRadius: 10, borderWidth: 1, padding: 14,
    overflow: "hidden",
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start" },
  iconBadge: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, marginTop: 2,
  },
  cardMeta: { flexDirection: "row", gap: 6, marginBottom: 5, flexWrap: "wrap" },
  pill: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4, borderWidth: 1,
  },
  pillText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.3 },
  cardTitle: { fontSize: 13, fontWeight: "600", lineHeight: 18 },
  cardSub: { fontSize: 11, marginTop: 3 },
  expiry: { fontSize: 11, marginTop: 2 },
  cardBody: { marginTop: 12, gap: 10 },
  cardDesc: { fontSize: 13, lineHeight: 19 },
  metaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metaItem: { minWidth: "45%", flex: 1 },
  metaLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5, marginBottom: 2 },
  metaValue: { fontSize: 12, fontWeight: "500" },
  evidenceBox: { borderRadius: 8, borderWidth: 1, padding: 10, gap: 4 },
  evidenceLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4 },
  evidenceRow: { fontSize: 11, lineHeight: 16 },
  reviewBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 10, borderRadius: 8, borderWidth: 1,
  },
  reviewBtnText: { fontSize: 13, fontWeight: "600" },
  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 15, fontWeight: "500" },
  emptySub: { fontSize: 12, textAlign: "center" },
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 36,
    borderWidth: 1, borderColor: "#1e2433",
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: "#2d3748", alignSelf: "center", marginBottom: 16,
  },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#e8edf8" },
  offlineNotice: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "#f59e0b10", borderRadius: 8, padding: 10,
    borderWidth: 1, borderColor: "#f59e0b30", marginBottom: 14,
  },
  offlineNoticeText: { flex: 1, fontSize: 12, color: "#f59e0b", lineHeight: 18 },
  modalApprovalTitle: { fontSize: 14, fontWeight: "600", color: "#e8edf8", lineHeight: 20 },
  modalApprovalSub: { fontSize: 11, color: "#6b7280", marginTop: 3, marginBottom: 16 },
  modalSectionLabel: { fontSize: 10, fontWeight: "700", color: "#6b7280", letterSpacing: 0.8, marginBottom: 8 },
  decisionRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  decisionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, paddingVertical: 10, borderRadius: 8, borderWidth: 1,
  },
  decisionBtnText: { fontSize: 11, fontWeight: "600" },
  noteInput: {
    borderWidth: 1, borderColor: "#1e2433", backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
    color: "#e8edf8", fontSize: 13, minHeight: 80, marginBottom: 16,
  },
  submitBtn: {
    paddingVertical: 12, borderRadius: 10, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  submitBtnText: { fontSize: 14, fontWeight: "700" },
});
