import React, { useState, useCallback, useEffect } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, RefreshControl,
  Platform, ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import { apiFetch } from "@/lib/apiClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { FeatherIconName } from "@/types/feather-icons";

interface Notification {
  id: string | number;
  type: "approval_request" | "agent_complete" | "workflow_failed" | "signal" | "system";
  title: string;
  body: string;
  read: boolean;
  timestamp: string;
  priority?: "critical" | "high" | "medium" | "low";
  data?: Record<string, unknown>;
}

const NOTIFICATION_ICONS: Record<string, FeatherIconName> = {
  approval_request: "pause-circle",
  agent_complete: "check-circle",
  workflow_failed: "x-circle",
  signal: "zap",
  system: "bell",
};

const NOTIFICATION_COLORS: Record<string, string> = {
  approval_request: "#f59e0b",
  agent_complete: "#10b981",
  workflow_failed: "#ef4444",
  signal: "#8b5cf6",
  system: "#6b7280",
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f59e0b",
  medium: "#3b82f6",
  low: "#6b7280",
};

function formatRelative(ts: string) {
  const ms = Date.now() - new Date(ts).getTime();
  if (ms < 60000) return "just now";
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
  return `${Math.floor(ms / 86400000)}d ago`;
}

const NOTIFICATIONS_KEY = "alloy_notifications_read_ids";

function useNotifications() {
  return useQuery<Notification[]>({
    queryKey: ["alloy-notifications"],
    queryFn: async () => {
      const res = await apiFetch("/api/alloy/notifications");
      if (!res.ok) throw new Error("Failed to load notifications");
      const json = await res.json() as { data?: Notification[] } | Notification[];
      return Array.isArray(json) ? json : ((json as { data?: Notification[] }).data ?? []);
    },
    refetchInterval: 30000,
    retry: 1,
  });
}

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [localReadIds, setLocalReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    AsyncStorage.getItem(NOTIFICATIONS_KEY).then((raw) => {
      if (raw) {
        try {
          const ids = JSON.parse(raw) as string[];
          setLocalReadIds(new Set(ids));
        } catch { /* ignore */ }
      }
    }).catch(() => null);
  }, []);

  const { data: serverNotifs, isLoading, isError, refetch } = useNotifications();

  const markAllRead = useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/api/alloy/notifications/read-all", { method: "POST" });
      if (!res.ok) throw new Error("Failed to mark all as read");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alloy-notifications"] }),
    onError: () => {
      const ids = new Set((serverNotifs ?? []).map((n) => String(n.id)));
      setLocalReadIds((prev) => new Set([...prev, ...ids]));
      AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([...ids])).catch(() => null);
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string | number) => {
      const res = await apiFetch(`/api/alloy/notifications/${id}/read`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to mark as read");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alloy-notifications"] }),
    onError: (_err, id) => {
      setLocalReadIds((prev) => new Set([...prev, String(id)]));
      AsyncStorage.getItem(NOTIFICATIONS_KEY).then((raw) => {
        const existing: string[] = raw ? (JSON.parse(raw) as string[]) : [];
        AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([...new Set([...existing, String(id)])])).catch(() => null);
      }).catch(() => null);
    },
  });

  const notifications: Notification[] = (serverNotifs ?? []).map((n) =>
    localReadIds.has(String(n.id)) ? { ...n, read: true } : n
  );

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : 90;

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const markAllReadHandler = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    markAllRead.mutate();
  }, [markAllRead]);

  const markRead = useCallback((id: string | number) => {
    markReadMutation.mutate(id);
  }, [markReadMutation]);

  const filtered = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;
  const unreadCount = notifications.filter((n) => !n.read).length;

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
            <Text style={[styles.eyebrow, { color: "rgba(139,92,246,0.6)" }]}>ALLOY · SIGNALS</Text>
            <Text style={[styles.title, { color: colors.cream }]}>Notification Center</Text>
          </View>
          {unreadCount > 0 && (
            <Pressable style={[styles.markAllBtn, { borderColor: colors.border }]} onPress={markAllReadHandler}>
              <Text style={[styles.markAllText, { color: colors.violet }]}>Mark all read</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.filters}>
          {(["all", "unread"] as const).map((f) => (
            <Pressable
              key={f}
              style={[styles.filterBtn, { backgroundColor: filter === f ? "rgba(139,92,246,0.12)" : "transparent", borderColor: filter === f ? "rgba(139,92,246,0.3)" : colors.borderSubtle }]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, { color: filter === f ? colors.violet : colors.mutedForeground }]}>
                {f === "all" ? "All" : `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}`}
              </Text>
            </Pressable>
          ))}
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.violet} style={{ marginTop: 40 }} />
        ) : isError ? (
          <View style={[styles.emptyState, { borderColor: colors.borderSubtle }]}>
            <Feather name="alert-triangle" size={28} color={colors.mutedForeground} style={{ opacity: 0.4 }} />
            <Text style={[styles.emptyTitle, { color: colors.creamDim }]}>Cannot reach Alloy</Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>Pull to retry</Text>
          </View>
        ) : !filtered.length ? (
          <View style={[styles.emptyState, { borderColor: colors.borderSubtle }]}>
            <Feather name="bell" size={28} color={colors.mutedForeground} style={{ opacity: 0.4 }} />
            <Text style={[styles.emptyTitle, { color: colors.creamDim }]}>All caught up</Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>No notifications to show</Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {filtered.map((notif) => {
              const icon: FeatherIconName = NOTIFICATION_ICONS[notif.type] ?? "bell";
              const accentColor = NOTIFICATION_COLORS[notif.type] ?? "#6b7280";
              const priorityColor = notif.priority ? PRIORITY_COLORS[notif.priority] : undefined;

              return (
                <Pressable
                  key={String(notif.id)}
                  style={[
                    styles.notifCard,
                    {
                      backgroundColor: notif.read ? colors.card : `${accentColor}08`,
                      borderColor: notif.read ? colors.borderSubtle : `${accentColor}25`,
                    },
                  ]}
                  onPress={() => markRead(notif.id)}
                >
                  {!notif.read && <View style={[styles.unreadDot, { backgroundColor: accentColor }]} />}
                  <View style={[styles.notifIcon, { backgroundColor: `${accentColor}15` }]}>
                    <Feather name={icon} size={16} color={accentColor} />
                  </View>
                  <View style={styles.notifContent}>
                    <View style={styles.notifTopRow}>
                      <Text style={[styles.notifTitle, { color: colors.cream, opacity: notif.read ? 0.7 : 1 }]}>{notif.title}</Text>
                      {priorityColor && notif.priority && (
                        <View style={[styles.priorityBadge, { backgroundColor: `${priorityColor}15`, borderColor: `${priorityColor}30` }]}>
                          <Text style={[styles.priorityText, { color: priorityColor }]}>{notif.priority.toUpperCase()}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.notifBody, { color: colors.mutedForeground }]} numberOfLines={2}>{notif.body}</Text>
                    <Text style={[styles.notifTime, { color: colors.mutedForeground }]}>{formatRelative(notif.timestamp)}</Text>
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
  markAllBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, marginTop: 4 },
  markAllText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  filters: { flexDirection: "row", gap: 8, marginBottom: 16 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  filterText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  notifCard: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14, borderRadius: 10, borderWidth: 1 },
  unreadDot: { position: "absolute", top: 14, right: 14, width: 6, height: 6, borderRadius: 3 },
  notifIcon: { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  notifContent: { flex: 1 },
  notifTopRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" },
  notifTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1 },
  priorityBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  priorityText: { fontSize: 8, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  notifBody: { fontSize: 13, lineHeight: 18, marginBottom: 6 },
  notifTime: { fontSize: 11 },
  emptyState: { alignItems: "center", paddingVertical: 48, borderRadius: 12, borderWidth: 1, borderStyle: "dashed", gap: 8, marginTop: 20 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyBody: { fontSize: 13 },
});
