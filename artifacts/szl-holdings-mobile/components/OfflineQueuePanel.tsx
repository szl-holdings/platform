import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, LayoutAnimation, Platform, UIManager, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { apiFetchRaw } from "@/lib/apiClient";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ACCENT = "#c9a84c";
const AMBER = "#f59e0b";
const RED = "#ef4444";

const CORTEX_QUEUE_KEY = "cortex:approval-offline-queue";
const TRADECRAFT_QUEUE_KEY = "defense:tradecraft-offline-queue";
const SHARED_QUEUE_KEY = "mobile-shared:offline-mutation-queue";
const SHARED_CONFLICTS_KEY = "mobile-shared:offline-conflicts";
const SHARED_MAX_RETRIES = 3;

export interface UnifiedQueuedItem {
  id: string;
  source: "cortex" | "defense" | "shared";
  sourceLabel: string;
  actionType: string;
  targetId: string;
  timestamp: number;
}

interface CortexQueued {
  approvalId: number;
  approvalTitle: string;
  decision: "approved" | "rejected" | "revised";
  note: string;
  queuedAt: string;
}

interface DefenseQueued {
  objectId: string;
  decisionSummary: string;
  action: "approve" | "reject";
  queuedAt: string;
}

interface SharedQueued {
  id: string;
  domain: string;
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  url: string;
  body?: unknown;
  timestamp: number;
  retries: number;
}

async function getStorage() {
  try {
    return (await import("@react-native-async-storage/async-storage")).default;
  } catch {
    return null;
  }
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const storage = await getStorage();
    if (!storage) return fallback;
    const raw = await storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    const storage = await getStorage();
    if (!storage) return;
    await storage.setItem(key, JSON.stringify(value));
  } catch {}
}

function shortTargetFromUrl(url: string): string {
  try {
    const parts = url.split("?")[0].split("/").filter(Boolean);
    const tail = parts.slice(-2).join("/");
    return tail.length > 28 ? tail.slice(-28) : tail;
  } catch {
    return url.slice(-24);
  }
}

function relative(ts: number): string {
  const ms = Date.now() - ts;
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export async function loadAllQueued(): Promise<UnifiedQueuedItem[]> {
  const [cortex, defense, shared] = await Promise.all([
    readJson<CortexQueued[]>(CORTEX_QUEUE_KEY, []),
    readJson<DefenseQueued[]>(TRADECRAFT_QUEUE_KEY, []),
    readJson<SharedQueued[]>(SHARED_QUEUE_KEY, []),
  ]);

  const items: UnifiedQueuedItem[] = [];

  for (const c of cortex) {
    items.push({
      id: `cortex:${c.approvalId}`,
      source: "cortex",
      sourceLabel: "CORTEX Approval",
      actionType: c.decision === "approved" ? "Approve" : c.decision === "rejected" ? "Reject" : "Revise",
      targetId: `#${c.approvalId} · ${c.approvalTitle.slice(0, 32)}`,
      timestamp: new Date(c.queuedAt).getTime() || Date.now(),
    });
  }

  for (const d of defense) {
    items.push({
      id: `defense:${d.objectId}`,
      source: "defense",
      sourceLabel: "Defense Decision",
      actionType: d.action === "approve" ? "Approve" : "Reject",
      targetId: `${d.objectId.slice(0, 14)} · ${d.decisionSummary.slice(0, 28)}`,
      timestamp: new Date(d.queuedAt).getTime() || Date.now(),
    });
  }

  for (const s of shared) {
    items.push({
      id: `shared:${s.id}`,
      source: "shared",
      sourceLabel: s.domain.toUpperCase(),
      actionType: s.method,
      targetId: shortTargetFromUrl(s.url),
      timestamp: s.timestamp,
    });
  }

  items.sort((a, b) => b.timestamp - a.timestamp);
  return items;
}

async function bumpSharedRetry(sharedId: string): Promise<boolean> {
  const queue = await readJson<SharedQueued[]>(SHARED_QUEUE_KEY, []);
  const entry = queue.find((q) => q.id === sharedId);
  if (!entry) return false;
  const nextRetries = (entry.retries ?? 0) + 1;
  if (nextRetries > SHARED_MAX_RETRIES) {
    await writeJson(SHARED_QUEUE_KEY, queue.filter((q) => q.id !== sharedId));
    return true;
  }
  await writeJson(
    SHARED_QUEUE_KEY,
    queue.map((q) => (q.id === sharedId ? { ...q, retries: nextRetries } : q))
  );
  return false;
}

async function retryItem(item: UnifiedQueuedItem): Promise<{ ok: boolean; reason?: string }> {
  if (item.source === "cortex") {
    const approvalId = Number(item.id.split(":")[1]);
    const queue = await readJson<CortexQueued[]>(CORTEX_QUEUE_KEY, []);
    const entry = queue.find((q) => q.approvalId === approvalId);
    if (!entry) return { ok: false, reason: "Queued entry not found." };
    try {
      const res = await apiFetchRaw(`/api/approvals/${entry.approvalId}/review`, {
        method: "POST",
        body: JSON.stringify({ decision: entry.decision, note: entry.note || undefined }),
      });
      if (!res.ok) return { ok: false, reason: `Server returned ${res.status}` };
      await writeJson(CORTEX_QUEUE_KEY, queue.filter((q) => q.approvalId !== approvalId));
      return { ok: true };
    } catch {
      return { ok: false, reason: "Network error — still offline?" };
    }
  }

  if (item.source === "defense") {
    const objectId = item.id.split(":").slice(1).join(":");
    const queue = await readJson<DefenseQueued[]>(TRADECRAFT_QUEUE_KEY, []);
    const entry = queue.find((q) => q.objectId === objectId);
    if (!entry) return { ok: false, reason: "Queued entry not found." };
    try {
      const res = await apiFetchRaw(`/api/aegis/tradecraft/decisions/${entry.objectId}`, {
        method: "PUT",
        body: JSON.stringify({ action: entry.action }),
      });
      if (!res.ok) return { ok: false, reason: `Server returned ${res.status}` };
      await writeJson(TRADECRAFT_QUEUE_KEY, queue.filter((q) => q.objectId !== objectId));
      return { ok: true };
    } catch {
      return { ok: false, reason: "Network error — still offline?" };
    }
  }

  // shared — mirror useOfflineQueue.replayMutations semantics:
  //   2xx → dequeue
  //   409 → record a conflict, dequeue
  //   other failure or thrown network error → bump retries, drop after MAX_RETRIES
  const sharedId = item.id.split(":").slice(1).join(":");
  const queue = await readJson<SharedQueued[]>(SHARED_QUEUE_KEY, []);
  const entry = queue.find((q) => q.id === sharedId);
  if (!entry) return { ok: false, reason: "Queued entry not found." };

  // Shared mutations carry an absolute URL captured at enqueue time, so they
  // bypass apiFetchRaw (which prepends getApiBase()). We still apply the same
  // auth handling here.
  const { getAuthToken } = await import("@/lib/apiClient");
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  try {
    const res = await fetch(entry.url, {
      method: entry.method,
      headers,
      body: entry.body !== undefined ? JSON.stringify(entry.body) : undefined,
    });
    if (res.ok) {
      await writeJson(SHARED_QUEUE_KEY, queue.filter((q) => q.id !== sharedId));
      return { ok: true };
    }
    if (res.status === 409) {
      let serverResponse: unknown = null;
      try { serverResponse = await res.json(); } catch {}
      const conflict = {
        id: `conflict-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        domain: entry.domain,
        mutationId: entry.id,
        url: entry.url,
        localBody: entry.body,
        serverResponse,
        timestamp: Date.now(),
        resolved: false,
      };
      const existingConflicts = await readJson<unknown[]>(SHARED_CONFLICTS_KEY, []);
      await writeJson(SHARED_CONFLICTS_KEY, [...existingConflicts, conflict]);
      await writeJson(SHARED_QUEUE_KEY, queue.filter((q) => q.id !== sharedId));
      return { ok: false, reason: "Server reports a conflict — your change was not applied." };
    }
    const dropped = await bumpSharedRetry(sharedId);
    return {
      ok: false,
      reason: dropped
        ? `Server returned ${res.status}. Giving up after ${SHARED_MAX_RETRIES} attempts.`
        : `Server returned ${res.status}`,
    };
  } catch {
    const dropped = await bumpSharedRetry(sharedId);
    return {
      ok: false,
      reason: dropped
        ? `Network error. Giving up after ${SHARED_MAX_RETRIES} attempts.`
        : "Network error — still offline?",
    };
  }
}

async function discardItem(item: UnifiedQueuedItem): Promise<void> {
  if (item.source === "cortex") {
    const approvalId = Number(item.id.split(":")[1]);
    const queue = await readJson<CortexQueued[]>(CORTEX_QUEUE_KEY, []);
    await writeJson(CORTEX_QUEUE_KEY, queue.filter((q) => q.approvalId !== approvalId));
  } else if (item.source === "defense") {
    const objectId = item.id.split(":").slice(1).join(":");
    const queue = await readJson<DefenseQueued[]>(TRADECRAFT_QUEUE_KEY, []);
    await writeJson(TRADECRAFT_QUEUE_KEY, queue.filter((q) => q.objectId !== objectId));
  } else {
    const sharedId = item.id.split(":").slice(1).join(":");
    const queue = await readJson<SharedQueued[]>(SHARED_QUEUE_KEY, []);
    await writeJson(SHARED_QUEUE_KEY, queue.filter((q) => q.id !== sharedId));
  }
}

interface OfflineQueuePanelProps {
  isOffline: boolean;
  refreshKey?: number;
  onChanged?: () => void;
  defaultExpanded?: boolean;
}

export function OfflineQueuePanel({
  isOffline,
  refreshKey = 0,
  onChanged,
  defaultExpanded = false,
}: OfflineQueuePanelProps) {
  const colors = useColors();
  const [items, setItems] = useState<UnifiedQueuedItem[]>([]);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [loaded, setLoaded] = useState(false);
  const [recentlyClearedAt, setRecentlyClearedAt] = useState<number | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState<null | "retry" | "discard">(null);

  const suppressSyncedBannerRef = React.useRef(false);

  const refresh = useCallback(async () => {
    const next = await loadAllQueued();
    setItems((prev) => {
      // Only show "All synced" when items disappeared while online and the
      // change was NOT caused by a manual discard from this panel.
      if (prev.length > 0 && next.length === 0 && !isOffline && !suppressSyncedBannerRef.current) {
        setRecentlyClearedAt(Date.now());
      }
      suppressSyncedBannerRef.current = false;
      return next;
    });
    setLoaded(true);
  }, [isOffline]);

  useEffect(() => {
    refresh();
  }, [refresh, refreshKey]);

  // Poll every 5s to catch background flushes (e.g. when connectivity returns)
  useEffect(() => {
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  // Auto-clear "All synced" banner after 8s
  useEffect(() => {
    if (!recentlyClearedAt) return;
    const t = setTimeout(() => setRecentlyClearedAt(null), 8000);
    return () => clearTimeout(t);
  }, [recentlyClearedAt]);

  const handleToggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  }, []);

  const handleRetry = useCallback(
    async (item: UnifiedQueuedItem) => {
      if (retryingId) return;
      setRetryingId(item.id);
      const result = await retryItem(item);
      setRetryingId(null);
      if (result.ok) {
        suppressSyncedBannerRef.current = true;
        await refresh();
        onChanged?.();
      } else {
        Alert.alert("Retry failed", result.reason ?? "The action remains queued. Please try again.");
      }
    },
    [refresh, onChanged, retryingId]
  );

  const handleRetryAll = useCallback(async () => {
    if (bulkBusy || retryingId) return;
    const snapshot = items.slice();
    if (snapshot.length === 0) return;
    setBulkBusy("retry");
    let succeeded = 0;
    let failed = 0;
    for (const item of snapshot) {
      const result = await retryItem(item);
      if (result.ok) succeeded += 1;
      else failed += 1;
    }
    setBulkBusy(null);
    suppressSyncedBannerRef.current = failed > 0;
    await refresh();
    if (succeeded > 0) onChanged?.();
    Alert.alert(
      "Retry all",
      `${succeeded} of ${snapshot.length} action${snapshot.length !== 1 ? "s" : ""} synced.${
        failed > 0 ? ` ${failed} still queued.` : ""
      }`
    );
  }, [items, bulkBusy, retryingId, refresh, onChanged]);

  const handleDiscardAll = useCallback(() => {
    if (bulkBusy || retryingId) return;
    const snapshot = items.slice();
    if (snapshot.length === 0) return;
    Alert.alert(
      "Discard all queued actions",
      `Remove all ${snapshot.length} queued actions? They will not be submitted.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Discard all",
          style: "destructive",
          onPress: async () => {
            setBulkBusy("discard");
            for (const item of snapshot) {
              await discardItem(item);
            }
            setBulkBusy(null);
            suppressSyncedBannerRef.current = true;
            await refresh();
            onChanged?.();
          },
        },
      ]
    );
  }, [items, bulkBusy, retryingId, refresh, onChanged]);

  const handleDiscard = useCallback(
    (item: UnifiedQueuedItem) => {
      Alert.alert(
        "Discard Queued Action",
        `Remove this queued ${item.actionType.toLowerCase()} for ${item.sourceLabel}? It will not be submitted.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: async () => {
              await discardItem(item);
              suppressSyncedBannerRef.current = true;
              await refresh();
              onChanged?.();
            },
          },
        ]
      );
    },
    [refresh, onChanged]
  );

  if (!loaded) return null;

  // Nothing queued and nothing recently cleared → render nothing
  if (items.length === 0 && !recentlyClearedAt) return null;

  // Empty + just synced → "All synced" banner
  if (items.length === 0 && recentlyClearedAt) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card ?? "#0d1220", borderColor: "#22c55e40" }]}>
        <View style={styles.header}>
          <View style={[styles.statusDot, { backgroundColor: "#22c55e" }]} />
          <Feather name="check-circle" size={13} color="#22c55e" />
          <Text style={[styles.headerTitle, { color: "#22c55e" }]}>All offline actions synced</Text>
        </View>
      </View>
    );
  }

  const accentColor = isOffline ? AMBER : ACCENT;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card ?? "#0d1220",
          borderColor: accentColor + "55",
        },
      ]}
    >
      <TouchableOpacity onPress={handleToggle} activeOpacity={0.8} style={styles.header}>
        <View style={[styles.statusDot, { backgroundColor: accentColor }]} />
        <Feather name={isOffline ? "wifi-off" : "upload-cloud"} size={13} color={accentColor} />
        <Text style={[styles.headerTitle, { color: accentColor }]}>
          {items.length} action{items.length !== 1 ? "s" : ""} pending sync
        </Text>
        <View style={{ flex: 1 }} />
        <Text style={[styles.headerHint, { color: colors.mutedForeground ?? "#6b7280" }]}>
          {isOffline ? "OFFLINE" : "WILL SYNC"}
        </Text>
        <Feather
          name={expanded ? "chevron-up" : "chevron-down"}
          size={14}
          color={colors.mutedForeground ?? "#6b7280"}
          style={{ marginLeft: 6 }}
        />
      </TouchableOpacity>

      {expanded && items.length >= 2 && (
        <View
          style={[
            styles.bulkBar,
            { borderColor: colors.border ?? "#1e2433", backgroundColor: (colors.background ?? "#070a14") + "60" },
          ]}
        >
          <TouchableOpacity
            onPress={handleRetryAll}
            disabled={bulkBusy !== null || retryingId !== null}
            style={[
              styles.bulkBtn,
              { borderColor: ACCENT + "55", backgroundColor: ACCENT + "18" },
              (bulkBusy !== null || retryingId !== null) && { opacity: 0.5 },
            ]}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            {bulkBusy === "retry" ? (
              <ActivityIndicator size="small" color={ACCENT} />
            ) : (
              <>
                <Feather name="upload-cloud" size={12} color={ACCENT} />
                <Text style={[styles.bulkBtnText, { color: ACCENT }]}>Retry all ({items.length})</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDiscardAll}
            disabled={bulkBusy !== null || retryingId !== null}
            style={[
              styles.bulkBtn,
              { borderColor: RED + "55", backgroundColor: RED + "18" },
              (bulkBusy !== null || retryingId !== null) && { opacity: 0.5 },
            ]}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            {bulkBusy === "discard" ? (
              <ActivityIndicator size="small" color={RED} />
            ) : (
              <>
                <Feather name="trash-2" size={12} color={RED} />
                <Text style={[styles.bulkBtnText, { color: RED }]}>Discard all</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {expanded && (
        <View style={styles.list}>
          {items.map((item) => (
            <View
              key={item.id}
              style={[
                styles.itemRow,
                { borderColor: colors.border ?? "#1e2433", backgroundColor: (colors.background ?? "#070a14") + "80" },
              ]}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.itemMetaRow}>
                  <View style={[styles.tag, { backgroundColor: accentColor + "18", borderColor: accentColor + "40" }]}>
                    <Text style={[styles.tagText, { color: accentColor }]}>{item.actionType.toUpperCase()}</Text>
                  </View>
                  <Text style={[styles.sourceLabel, { color: colors.mutedForeground ?? "#6b7280" }]}>
                    {item.sourceLabel}
                  </Text>
                </View>
                <Text style={[styles.targetId, { color: colors.foreground ?? "#e5e7eb" }]} numberOfLines={1}>
                  {item.targetId}
                </Text>
                <Text style={[styles.timestamp, { color: colors.mutedForeground ?? "#6b7280" }]}>
                  Queued {relative(item.timestamp)}
                </Text>
              </View>
              <View style={styles.actionsCol}>
                <TouchableOpacity
                  onPress={() => handleRetry(item)}
                  disabled={retryingId !== null}
                  style={[
                    styles.retryBtn,
                    { borderColor: ACCENT + "40", backgroundColor: ACCENT + "12" },
                    retryingId !== null && retryingId !== item.id && { opacity: 0.4 },
                  ]}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {retryingId === item.id ? (
                    <ActivityIndicator size="small" color={ACCENT} />
                  ) : (
                    <>
                      <Feather name="upload-cloud" size={12} color={ACCENT} />
                      <Text style={[styles.retryText, { color: ACCENT }]}>Retry now</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDiscard(item)}
                  disabled={retryingId === item.id}
                  style={[styles.discardBtn, { borderColor: RED + "40", backgroundColor: RED + "12" }]}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name="trash-2" size={12} color={RED} />
                  <Text style={[styles.discardText, { color: RED }]}>Discard</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 12,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  headerTitle: { fontSize: 12, fontWeight: "700", letterSpacing: 0.3 },
  headerHint: { fontSize: 9, fontWeight: "700", letterSpacing: 0.6 },
  list: { paddingHorizontal: 10, paddingBottom: 10, gap: 8 },
  bulkBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginHorizontal: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 8,
  },
  bulkBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    minHeight: 30,
  },
  bulkBtnText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
  },
  itemMetaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  tag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  tagText: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5 },
  sourceLabel: { fontSize: 10, fontWeight: "600", letterSpacing: 0.4 },
  targetId: { fontSize: 12, fontWeight: "600" },
  timestamp: { fontSize: 10, marginTop: 2 },
  actionsCol: { flexDirection: "column", gap: 6, alignItems: "stretch" },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    minHeight: 26,
    minWidth: 76,
  },
  retryText: { fontSize: 10, fontWeight: "700" },
  discardBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    minWidth: 76,
  },
  discardText: { fontSize: 10, fontWeight: "700" },
});

export default OfflineQueuePanel;
