import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, LayoutAnimation, Platform, UIManager } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ACCENT = "#c9a84c";
const AMBER = "#f59e0b";
const RED = "#ef4444";

const CORTEX_QUEUE_KEY = "cortex:approval-offline-queue";
const TRADECRAFT_QUEUE_KEY = "defense:tradecraft-offline-queue";
const SHARED_QUEUE_KEY = "mobile-shared:offline-mutation-queue";

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

async function loadAllQueued(): Promise<UnifiedQueuedItem[]> {
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
              <TouchableOpacity
                onPress={() => handleDiscard(item)}
                style={[styles.discardBtn, { borderColor: RED + "40", backgroundColor: RED + "12" }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="trash-2" size={12} color={RED} />
                <Text style={[styles.discardText, { color: RED }]}>Discard</Text>
              </TouchableOpacity>
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
  discardBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  discardText: { fontSize: 10, fontWeight: "700" },
});

export default OfflineQueuePanel;
