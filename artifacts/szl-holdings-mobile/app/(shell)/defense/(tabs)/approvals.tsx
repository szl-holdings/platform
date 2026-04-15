import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { apiGet, apiPut } from "@/lib/apiClient";

interface Decision {
  id?: number;
  objectId?: string;
  decisionType?: string;
  summary?: string;
  recommendedAction?: string;
  issueStatement?: string;
  caseId?: string;
  incidentId?: string;
  impactLevel?: string;
  urgency?: string;
  approvalRequired?: boolean;
  approvalReason?: string;
  humanReviewRequired?: boolean;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  modelRoute?: string;
  createdAt?: string;
  status?: string;
}

function getReviewStatus(d: Decision): "pending" | "approved" | "rejected" {
  if (d.approvedAt) return "approved";
  if (d.rejectedAt) return "rejected";
  return "pending";
}

function needsReview(d: Decision): boolean {
  return (d.approvalRequired === true || d.humanReviewRequired === true) && !d.approvedAt && !d.rejectedAt;
}

function relativeTime(iso?: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function ApprovalCard({ item, onApprove, onReject, approving }: {
  item: Decision;
  onApprove: (objectId: string) => void;
  onReject: (objectId: string) => void;
  approving: string | null;
}) {
  const colors = useColors();
  const IMPACT_COLORS: Record<string, string> = {
    critical: "#ef4444",
    high: "#f97316",
    medium: "#f59e0b",
    low: "#3b82f6",
    negligible: "#6b7280",
  };
  const impact = item.impactLevel ?? "medium";
  const impactColor = IMPACT_COLORS[impact] ?? "#6b7280";
  const reviewStatus = getReviewStatus(item);
  const isPending = reviewStatus === "pending";
  const objectId = item.objectId ?? String(item.id ?? "");
  const isProcessing = approving === objectId;

  return (
    <View style={[styles.card, { backgroundColor: colors.navyLight, borderColor: isPending ? impactColor + "40" : colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <View style={[styles.badge, { backgroundColor: impactColor + "20" }]}>
            <Text style={[styles.badgeText, { color: impactColor }]}>{impact.toUpperCase()}</Text>
          </View>
          <Text style={[styles.approvalId, { color: colors.muted }]}>{objectId.slice(0, 12)}</Text>
          <View style={[styles.badge, { backgroundColor: reviewStatus === "approved" ? "#22c55e20" : reviewStatus === "rejected" ? "#ef444420" : "#f59e0b20" }]}>
            <Text style={[styles.badgeText, { color: reviewStatus === "approved" ? "#22c55e" : reviewStatus === "rejected" ? "#ef4444" : "#f59e0b" }]}>
              {reviewStatus.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={[styles.timeText, { color: colors.muted }]}>{relativeTime(item.createdAt)}</Text>
      </View>

      <Text style={[styles.actionTitle, { color: colors.foreground }]}>{item.recommendedAction ?? item.summary ?? "Decision pending review"}</Text>
      {item.decisionType && (
        <Text style={[styles.caseRef, { color: colors.amber }]}>{item.decisionType}</Text>
      )}
      {item.caseId && (
        <Text style={[styles.caseRef, { color: colors.muted }]}>Case: {item.caseId}</Text>
      )}

      {item.issueStatement && (
        <Text style={[styles.description, { color: colors.muted }]}>{item.issueStatement}</Text>
      )}

      {item.approvalReason && (
        <View style={[styles.riskBox, { backgroundColor: impactColor + "10", borderColor: impactColor + "30" }]}>
          <Ionicons name="warning-outline" size={12} color={impactColor} />
          <Text style={[styles.riskText, { color: impactColor }]}>{item.approvalReason}</Text>
        </View>
      )}

      {item.urgency && (
        <Text style={[styles.requestedBy, { color: colors.muted }]}>Urgency: {item.urgency}</Text>
      )}
      {item.modelRoute && (
        <Text style={[styles.requestedBy, { color: colors.muted }]}>Via: {item.modelRoute}</Text>
      )}
      {item.approvedAt && <Text style={[styles.requestedBy, { color: "#22c55e" }]}>Approved {relativeTime(item.approvedAt ?? undefined)} by {item.approvedBy ?? "operator"}</Text>}
      {item.rejectedAt && <Text style={[styles.requestedBy, { color: "#ef4444" }]}>Rejected {relativeTime(item.rejectedAt ?? undefined)}{item.rejectionReason ? ` — ${item.rejectionReason}` : ""}</Text>}

      {isPending && (needsReview(item)) && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.rejectBtn, { borderColor: "#ef4444" }]}
            onPress={() => onReject(objectId)}
            disabled={isProcessing}
          >
            <Ionicons name="close" size={14} color="#ef4444" />
            <Text style={styles.rejectText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.approveBtn, { backgroundColor: isProcessing ? "#22c55e80" : "#22c55e" }]}
            onPress={() => onApprove(objectId)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="checkmark" size={14} color="white" />
                <Text style={styles.approveBtnText}>Approve</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function ApprovalsTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [approving, setApproving] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("pending");
  const queryClient = useQueryClient();

  const { data: apiDecisions, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["tradecraft-decisions"],
    queryFn: () => apiGet<Decision[]>("/api/firestorm/tradecraft/decisions"),
  });

  const decisions: Decision[] = Array.isArray(apiDecisions) ? apiDecisions : [];
  const pendingCount = decisions.filter(d => needsReview(d)).length;

  async function handleApprove(objectId: string) {
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setApproving(objectId);
    try {
      await apiPut(`/api/firestorm/tradecraft/decisions/${objectId}`, { action: "approve" });
    } catch {
      Alert.alert("Approval failed", "Could not submit approval. Please try again or check your connection.");
    } finally {
      await queryClient.invalidateQueries({ queryKey: ["tradecraft-decisions"] });
      setApproving(null);
    }
  }

  async function handleReject(objectId: string) {
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Reject Action", "Are you sure you want to reject this action?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: async () => {
          try {
            await apiPut(`/api/firestorm/tradecraft/decisions/${objectId}`, { action: "reject" });
          } catch {
            Alert.alert("Rejection failed", "Could not submit rejection. Please try again or check your connection.");
          } finally {
            await queryClient.invalidateQueries({ queryKey: ["tradecraft-decisions"] });
          }
        },
      },
    ]);
  }

  const displayed = decisions.filter(d => {
    const rs = getReviewStatus(d);
    if (filter === "pending") return rs === "pending" && needsReview(d);
    if (filter === "approved") return rs === "approved" || rs === "rejected";
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.navy, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Approval Queue</Text>
          <Text style={[styles.headerSub, { color: colors.muted }]}>
            {pendingCount} pending · Tap to approve or reject
          </Text>
        </View>
        {pendingCount > 0 && (
          <View style={[styles.badge, { backgroundColor: "#ef4444" }]}>
            <Text style={[styles.badgeText, { color: "white" }]}>{pendingCount}</Text>
          </View>
        )}
      </View>

      <View style={[styles.filterRow, { borderBottomColor: colors.border }]}>
        {(["pending", "all", "approved"] as const).map(f => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[styles.filterBtn, filter === f && { borderBottomColor: colors.amber, borderBottomWidth: 2 }]}>
            <Text style={[styles.filterText, { color: filter === f ? colors.amber : colors.muted }]}>
              {f === "pending" ? "Pending" : f === "approved" ? "Resolved" : "All"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 80 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.amber} />}
      >
        {isLoading && (
          <View style={styles.emptyState}>
            <ActivityIndicator color={colors.amber} />
          </View>
        )}
        {!isLoading && displayed.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={40} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>No approvals in this queue</Text>
          </View>
        )}
        {displayed.map(item => (
          <ApprovalCard
            key={item.id ?? item.objectId}
            item={item}
            onApprove={handleApprove}
            onReject={handleReject}
            approving={approving}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerTitle: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold", letterSpacing: -0.5 },
  headerSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  filterRow: { flexDirection: "row", borderBottomWidth: 1, paddingHorizontal: 16 },
  filterBtn: { paddingVertical: 10, paddingHorizontal: 12, marginRight: 4 },
  filterText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  scroll: { flex: 1 },
  card: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 8 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  badgeText: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  approvalId: { fontSize: 11, fontFamily: "Inter_400Regular" },
  timeText: { fontSize: 10, fontFamily: "Inter_400Regular" },
  actionTitle: { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold", lineHeight: 20 },
  caseRef: { fontSize: 11, fontFamily: "Inter_500Medium" },
  description: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  riskBox: { borderRadius: 8, borderWidth: 1, padding: 10, flexDirection: "row", gap: 6, alignItems: "flex-start" },
  riskText: { fontSize: 11, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 16 },
  requestedBy: { fontSize: 11, fontFamily: "Inter_400Regular" },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  rejectBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 8, borderWidth: 1 },
  rejectText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#ef4444" },
  approveBtn: { flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 8 },
  approveBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "white" },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
