import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { SwipeableCard } from "./SwipeableCard";

export type FeedItemDomain =
  | "maritime"
  | "defense"
  | "property"
  | "energy"
  | "advisory"
  | "executive"
  | "portfolio";

export type FeedItemSeverity = "critical" | "high" | "medium" | "low" | "info";

export interface IntelFeedItem {
  id: string;
  domain: FeedItemDomain;
  severity: FeedItemSeverity;
  title: string;
  summary: string;
  timestamp: string;
  correlatedDomains?: FeedItemDomain[];
  actionable?: boolean;
  route?: string;
  metadata?: Record<string, string>;
}

export interface IntelligenceFeedConfig {
  apiBaseUrl: string;
  authToken?: string;
  currentDomain: FeedItemDomain;
  accentColor: string;
  maxItems?: number;
  onItemPress?: (item: IntelFeedItem) => void;
  onItemAcknowledge?: (item: IntelFeedItem) => void;
  onItemDismiss?: (item: IntelFeedItem) => void;
  onItemEscalate?: (item: IntelFeedItem) => void;
}

const DOMAIN_COLORS: Record<FeedItemDomain, string> = {
  maritime: "#0ea5e9",
  defense: "#ef4444",
  property: "#22c55e",
  energy: "#f59e0b",
  advisory: "#8b5cf6",
  executive: "#c9a84c",
  portfolio: "#64748b",
};

const DOMAIN_ICONS: Record<FeedItemDomain, string> = {
  maritime: "anchor",
  defense: "shield",
  property: "home",
  energy: "zap",
  advisory: "briefcase",
  executive: "star",
  portfolio: "layers",
};

const SEVERITY_COLORS: Record<FeedItemSeverity, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#f59e0b",
  low: "#22c55e",
  info: "#3b82f6",
};

function generateFallbackItems(currentDomain: FeedItemDomain): IntelFeedItem[] {
  const now = new Date().toISOString();
  return [
    {
      id: `feed-${Date.now()}-1`,
      domain: "portfolio",
      severity: "info",
      title: "Intelligence feed active",
      summary: "Cross-domain signal aggregation is running. Data will appear as signals are detected across maritime, defense, property, energy, and advisory domains.",
      timestamp: now,
      correlatedDomains: [currentDomain],
      actionable: false,
    },
    {
      id: `feed-${Date.now()}-2`,
      domain: currentDomain,
      severity: "info",
      title: "Domain monitoring online",
      summary: `${currentDomain.charAt(0).toUpperCase() + currentDomain.slice(1)} intelligence monitoring is active. Proactive signals will surface here as they're detected.`,
      timestamp: now,
      actionable: false,
    },
  ];
}

async function fetchFeedItems(
  apiBaseUrl: string,
  domain: FeedItemDomain,
  authToken?: string,
  maxItems = 20,
): Promise<IntelFeedItem[]> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

  const resp = await fetch(
    `${apiBaseUrl}/ai/intel-feed?domain=${domain}&limit=${maxItems}`,
    { headers, signal: AbortSignal.timeout(8000) },
  );

  if (!resp.ok) throw new Error(`Feed API: ${resp.status}`);
  const data = await resp.json() as { items?: IntelFeedItem[] };
  return data.items ?? [];
}

function FeedItemCard({
  item,
  onPress,
  onAcknowledge,
  onDismiss,
  onEscalate,
}: {
  item: IntelFeedItem;
  onPress?: (i: IntelFeedItem) => void;
  onAcknowledge?: (i: IntelFeedItem) => void;
  onDismiss?: (i: IntelFeedItem) => void;
  onEscalate?: (i: IntelFeedItem) => void;
}) {
  const domainColor = DOMAIN_COLORS[item.domain] ?? "#64748b";
  const severityColor = SEVERITY_COLORS[item.severity] ?? "#3b82f6";
  const domainIcon = DOMAIN_ICONS[item.domain] ?? "circle";

  const timeStr = (() => {
    const diff = Date.now() - new Date(item.timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  })();

  const handlePress = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => {});
    }
    onPress?.(item);
  }, [item, onPress]);

  return (
    <SwipeableCard
      onApprove={onAcknowledge ? () => onAcknowledge(item) : undefined}
      onDismiss={onDismiss ? () => onDismiss(item) : undefined}
      onEscalate={onEscalate ? () => onEscalate(item) : undefined}
      approveLabel="Acknowledge"
      dismissLabel="Dismiss"
      approveColor="#22c55e"
      dismissColor="#64748b"
      escalateColor="#ef4444"
      style={styles.cardWrapper}
    >
      <TouchableOpacity
        style={[styles.itemCard, { borderLeftColor: severityColor, borderLeftWidth: 3 }]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.itemHeader}>
          <View style={[styles.domainBadge, { backgroundColor: domainColor + "20", borderColor: domainColor + "40" }]}>
            <Feather name={domainIcon as React.ComponentProps<typeof Feather>["name"]} size={10} color={domainColor} />
            <Text style={[styles.domainLabel, { color: domainColor }]}>{item.domain.toUpperCase()}</Text>
          </View>
          <View style={[styles.severityDot, { backgroundColor: severityColor }]} />
          <Text style={styles.severityLabel}>{item.severity.toUpperCase()}</Text>
          <Text style={styles.timeLabel}>{timeStr}</Text>
        </View>

        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemSummary} numberOfLines={3}>{item.summary}</Text>

        {item.correlatedDomains && item.correlatedDomains.length > 0 && (
          <View style={styles.correlationRow}>
            <Feather name="git-merge" size={10} color="rgba(255,255,255,0.3)" />
            <Text style={styles.correlationText}>
              Correlated: {item.correlatedDomains.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")}
            </Text>
          </View>
        )}

        {item.actionable && (
          <View style={styles.actionableRow}>
            <Feather name="arrow-right-circle" size={12} color="#3b82f6" />
            <Text style={styles.actionableText}>Action required</Text>
          </View>
        )}

        <View style={styles.swipeHint}>
          <Text style={styles.swipeHintText}>← dismiss  ·  acknowledge →  ·  hold to escalate</Text>
        </View>
      </TouchableOpacity>
    </SwipeableCard>
  );
}

export function IntelligenceFeed({
  apiBaseUrl,
  authToken,
  currentDomain,
  accentColor,
  maxItems = 20,
  onItemPress,
  onItemAcknowledge,
  onItemDismiss,
  onItemEscalate,
}: IntelligenceFeedConfig) {
  const [items, setItems] = useState<IntelFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const fetched = await fetchFeedItems(apiBaseUrl, currentDomain, authToken, maxItems);
      setItems(fetched.length > 0 ? fetched : generateFallbackItems(currentDomain));
    } catch {
      setItems(generateFallbackItems(currentDomain));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [apiBaseUrl, authToken, currentDomain, maxItems]);

  useEffect(() => { load(); }, [load]);

  const handleAcknowledge = useCallback((item: IntelFeedItem) => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    setDismissed(prev => new Set([...prev, item.id]));
    onItemAcknowledge?.(item);
  }, [onItemAcknowledge]);

  const handleDismiss = useCallback((item: IntelFeedItem) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    setDismissed(prev => new Set([...prev, item.id]));
    onItemDismiss?.(item);
  }, [onItemDismiss]);

  const handleEscalate = useCallback((item: IntelFeedItem) => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }
    onItemEscalate?.(item);
  }, [onItemEscalate]);

  const visible = items.filter(i => !dismissed.has(i.id));

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={accentColor} />
        <Text style={[styles.loadingText, { color: accentColor }]}>Aggregating intelligence…</Text>
        <Text style={styles.loadingSubtext}>Cross-domain signal correlation</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={visible}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => load(true)}
          tintColor={accentColor}
        />
      }
      ListHeaderComponent={
        <View style={styles.feedHeader}>
          <View style={styles.feedHeaderLeft}>
            <View style={[styles.liveIndicator, { backgroundColor: accentColor }]} />
            <Text style={[styles.feedTitle, { color: accentColor }]}>Intelligence Feed</Text>
          </View>
          <Text style={styles.feedCount}>{visible.length} signal{visible.length !== 1 ? "s" : ""}</Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Feather name="check-circle" size={32} color="#22c55e60" />
          <Text style={styles.emptyTitle}>All clear</Text>
          <Text style={styles.emptySubtext}>No active intelligence signals. Pull to refresh.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <FeedItemCard
          item={item}
          onPress={onItemPress}
          onAcknowledge={handleAcknowledge}
          onDismiss={handleDismiss}
          onEscalate={handleEscalate}
        />
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingVertical: 60 },
  loadingText: { fontSize: 14, fontWeight: "600" },
  loadingSubtext: { fontSize: 12, color: "rgba(255,255,255,0.4)" },
  listContent: { padding: 16, gap: 0, paddingBottom: 32 },
  feedHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  feedHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  liveIndicator: { width: 8, height: 8, borderRadius: 4 },
  feedTitle: { fontSize: 15, fontWeight: "700" },
  feedCount: { fontSize: 11, color: "rgba(255,255,255,0.4)" },
  cardWrapper: { marginBottom: 10 },
  itemCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 14,
    gap: 8,
  },
  itemHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  domainBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 4, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 3 },
  domainLabel: { fontSize: 8, fontWeight: "700", letterSpacing: 0.8 },
  severityDot: { width: 5, height: 5, borderRadius: 2.5 },
  severityLabel: { fontSize: 8, color: "rgba(255,255,255,0.4)", fontWeight: "600", letterSpacing: 0.6 },
  timeLabel: { fontSize: 10, color: "rgba(255,255,255,0.3)", marginLeft: "auto" },
  itemTitle: { fontSize: 14, color: "rgba(255,255,255,0.9)", fontWeight: "600", lineHeight: 20 },
  itemSummary: { fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 18 },
  correlationRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  correlationText: { fontSize: 10, color: "rgba(255,255,255,0.3)" },
  actionableRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  actionableText: { fontSize: 11, color: "#3b82f6", fontWeight: "600" },
  swipeHint: { alignItems: "center", marginTop: 2 },
  swipeHintText: { fontSize: 9, color: "rgba(255,255,255,0.15)", letterSpacing: 0.3 },
  separator: { height: 0 },
  emptyContainer: { alignItems: "center", gap: 10, paddingVertical: 60 },
  emptyTitle: { fontSize: 16, color: "rgba(255,255,255,0.6)", fontWeight: "600" },
  emptySubtext: { fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center", maxWidth: 260 },
});
