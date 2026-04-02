import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  TextInput, RefreshControl, ActivityIndicator, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useQuery } from "@tanstack/react-query";
import { VesselIcon, featherIcon } from "@/components/VesselIcon";
import { useColors } from "@/hooks/useColors";
import { api, type Vessel, CACHE_KEYS, cacheSet, cacheGetStale } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  at_sea: "#22c55e",
  in_port: "#0ea5e9",
  anchored: "#f59e0b",
  maintenance: "#ef4444",
  active: "#22c55e",
};
const STATUS_LABELS: Record<string, string> = {
  at_sea: "At Sea",
  in_port: "In Port",
  anchored: "Anchored",
  maintenance: "Maintenance",
  active: "Active",
};

interface VoyageMilestone {
  label: string;
  port: string;
  time: string;
  done: boolean;
  current?: boolean;
}

function VoyageTimeline({ vessel }: { vessel: Vessel }) {
  const colors = useColors();
  const milestones: VoyageMilestone[] = vessel.lastPort
    ? [
        { label: "Departed", port: vessel.lastPort, time: "Mar 29", done: true },
        { label: "Waypoint", port: "English Channel", time: "Apr 1", done: true, current: vessel.status === "at_sea" },
        { label: "Arrival", port: vessel.destination || "TBC", time: vessel.eta ? new Date(vessel.eta).toLocaleDateString([], { month: "short", day: "numeric" }) : "TBC", done: false },
      ]
    : [
        { label: "Origin", port: "Unknown", time: "—", done: true },
        { label: "En Route", port: "—", time: "—", done: true, current: true },
        { label: "Destination", port: vessel.destination || "TBC", time: vessel.eta ? new Date(vessel.eta).toLocaleDateString([], { month: "short", day: "numeric" }) : "TBC", done: false },
      ];

  return (
    <View style={[vtStyles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[vtStyles.vesselName, { color: colors.text }]}>{vessel.name}</Text>
      <View style={vtStyles.timeline}>
        {milestones.map((m, i) => (
          <View key={i} style={vtStyles.milestoneWrap}>
            <View style={[
              vtStyles.dot,
              {
                backgroundColor: m.done ? (m.current ? colors.primary : `${colors.primary}80`) : colors.border,
                borderColor: m.current ? colors.primary : "transparent",
              }
            ]}>
              {m.current && <View style={[vtStyles.dotInner, { backgroundColor: colors.primary }]} />}
            </View>
            <Text style={[vtStyles.milestoneLabel, { color: m.current ? colors.primary : colors.textFaint }]}>{m.label}</Text>
            <Text style={[vtStyles.milestonePort, { color: m.done ? colors.text : colors.textDim }]} numberOfLines={1}>{m.port}</Text>
            <Text style={[vtStyles.milestoneTime, { color: colors.textFaint }]}>{m.time}</Text>
            {i < milestones.length - 1 && (
              <View style={[vtStyles.connector, { backgroundColor: m.done ? `${colors.primary}40` : colors.border }]} />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

interface WatchlistAlert {
  id: string;
  vesselName: string;
  event: string;
  severity: "critical" | "warning" | "info";
  time: string;
}

const DEMO_WATCHLIST_ALERTS: WatchlistAlert[] = [
  { id: "wa-1", vesselName: "MV Atlantic Pioneer", event: "Entered exclusion zone — Gibraltar Strait", severity: "critical", time: new Date(Date.now() - 4 * 60000).toISOString() },
  { id: "wa-2", vesselName: "MV Pacific Trader", event: "AIS signal lost — last seen Bay of Biscay", severity: "warning", time: new Date(Date.now() - 18 * 60000).toISOString() },
];

const WATCHLIST_COLORS = { critical: "#ef4444", warning: "#f59e0b", info: "#0ea5e9" };

function WatchlistAlertBanner({ alerts, colors }: { alerts: WatchlistAlert[]; colors: ReturnType<typeof useColors> }) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const active = alerts.filter(a => !dismissed.includes(a.id));
  if (active.length === 0) return null;
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 8, gap: 6 }}>
      {active.map(alert => (
        <View key={alert.id} style={[watchStyles.banner, { backgroundColor: `${WATCHLIST_COLORS[alert.severity]}12`, borderColor: `${WATCHLIST_COLORS[alert.severity]}30` }]}>
          <View style={[watchStyles.bannerDot, { backgroundColor: WATCHLIST_COLORS[alert.severity] }]} />
          <View style={watchStyles.bannerBody}>
            <Text style={[watchStyles.bannerVessel, { color: WATCHLIST_COLORS[alert.severity] }]}>{alert.vesselName}</Text>
            <Text style={[watchStyles.bannerEvent, { color: colors.textDim }]}>{alert.event}</Text>
          </View>
          <TouchableOpacity onPress={() => { Haptics.selectionAsync(); setDismissed(prev => [...prev, alert.id]); }} style={watchStyles.bannerDismiss}>
            <VesselIcon name="x" size={12} color={colors.textFaint} />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const watchStyles = StyleSheet.create({
  banner: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  bannerDot: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  bannerBody: { flex: 1 },
  bannerVessel: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  bannerEvent: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 1 },
  bannerDismiss: { padding: 4 },
});

const vtStyles = StyleSheet.create({
  container: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8 },
  vesselName: { fontSize: 11, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold", marginBottom: 10 },
  timeline: { flexDirection: "row", alignItems: "flex-start" },
  milestoneWrap: { flex: 1, alignItems: "center", position: "relative" },
  dot: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, marginBottom: 4, alignItems: "center", justifyContent: "center" },
  dotInner: { width: 4, height: 4, borderRadius: 2 },
  milestoneLabel: { fontSize: 8, fontFamily: "Inter_500Medium", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 2 },
  milestonePort: { fontSize: 10, fontFamily: "Inter_600SemiBold", textAlign: "center", marginBottom: 1 },
  milestoneTime: { fontSize: 9, fontFamily: "Inter_400Regular" },
  connector: { position: "absolute", top: 4, left: "50%", right: "-50%", height: 2 },
});

function VesselRow({ vessel, onPress }: { vessel: Vessel; onPress: () => void }) {
  const colors = useColors();
  const sc = STATUS_COLORS[vessel.status] || colors.textFaint;
  const sl = STATUS_LABELS[vessel.status] || vessel.status;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.7}
    >
      <View style={[styles.rowIcon, { backgroundColor: `${sc}15` }]}>
        <VesselIcon name="anchor" size={14} color={sc} />
      </View>
      <View style={styles.rowBody}>
        <Text style={[styles.rowName, { color: colors.text }]} numberOfLines={1}>{vessel.name}</Text>
        <Text style={[styles.rowMeta, { color: colors.textDim }]}>
          {vessel.vesselType} · IMO {vessel.imo || "—"} · {vessel.flag || "—"}
        </Text>
        {vessel.destination && (
          <View style={styles.rowDestRow}>
            <VesselIcon name="navigation" size={9} color={colors.textFaint} />
            <Text style={[styles.rowDest, { color: colors.textFaint }]}>{vessel.destination}</Text>
          </View>
        )}
      </View>
      <View style={styles.rowRight}>
        <View style={[styles.statusPill, { backgroundColor: `${sc}15`, borderColor: `${sc}30` }]}>
          <View style={[styles.statusDot, { backgroundColor: sc }]} />
          <Text style={[styles.statusText, { color: sc }]}>{sl}</Text>
        </View>
        {vessel.speed && (
          <Text style={[styles.speedText, { color: colors.textFaint }]}>
            {parseFloat(vessel.speed).toFixed(1)} kn
          </Text>
        )}
        {(vessel.activeExceptions ?? 0) > 0 && (
          <View style={[styles.excBadge, { backgroundColor: colors.redDim }]}>
            <Text style={[styles.excText, { color: colors.red }]}>{vessel.activeExceptions} exc</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function FleetScreen() {
  const colors = useColors();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);

  const { data: vessels = [], isLoading, refetch } = useQuery({
    queryKey: ["vessels-roster"],
    queryFn: async () => {
      try {
        const data = await api.roster();
        await cacheSet(CACHE_KEYS.fleet, data);
        setLastFetchedAt(new Date());
        return data;
      } catch {
        return (await cacheGetStale<Vessel[]>(CACHE_KEYS.fleet)) ?? [];
      }
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const filtered = vessels.filter(v => {
    const matchStatus = statusFilter === "all" || v.status === statusFilter;
    const matchSearch = !search.trim() ||
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      (v.imo || "").toLowerCase().includes(search.toLowerCase()) ||
      (v.flag || "").toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const statusCounts = vessels.reduce<Record<string, number>>((acc, v) => {
    acc[v.status] = (acc[v.status] || 0) + 1;
    return acc;
  }, {});

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const filterOptions = [
    { id: "all", label: "All" },
    { id: "at_sea", label: "At Sea" },
    { id: "in_port", label: "In Port" },
    { id: "anchored", label: "Anchored" },
    { id: "maintenance", label: "Maint." },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Fleet</Text>
          <Text style={[styles.sub, { color: colors.textFaint }]}>{filtered.length} of {vessels.length} vessels</Text>
        </View>
        {vessels.length > 0 && (() => {
          const isLive = lastFetchedAt != null && (Date.now() - lastFetchedAt.getTime()) < 3 * 60_000;
          const minsAgo = lastFetchedAt ? Math.floor((Date.now() - lastFetchedAt.getTime()) / 60_000) : null;
          const label = isLive ? "LIVE" : minsAgo != null ? `${minsAgo}m ago` : "CACHED";
          const badgeColor = isLive ? colors.primary : "#94a3b8";
          const badgeBg = isLive ? (colors.greenDim ?? `${colors.primary}15`) : "rgba(148,163,184,0.1)";
          return (
            <View style={[styles.offlineBadge, { backgroundColor: badgeBg, borderColor: `${badgeColor}40` }]}>
              {isLive && <View style={[styles.offlineDot, { backgroundColor: badgeColor }]} />}
              <Text style={[styles.offlineBadgeText, { color: badgeColor }]}>{label}</Text>
            </View>
          );
        })()}
      </View>

      <WatchlistAlertBanner alerts={DEMO_WATCHLIST_ALERTS} colors={colors} />

      <View style={[styles.searchRow, { borderColor: colors.border }]}>
        <VesselIcon name="search" size={15} color={colors.textFaint} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search vessels, IMO, flag..."
          placeholderTextColor={colors.textFaint}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <VesselIcon name="x" size={14} color={colors.textFaint} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        horizontal
        data={filterOptions}
        keyExtractor={i => i.id}
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setStatusFilter(item.id)}
            style={[
              styles.filterBtn,
              {
                backgroundColor: statusFilter === item.id ? colors.primaryDim : "transparent",
                borderColor: statusFilter === item.id ? colors.primaryBorder : colors.border,
              },
            ]}
          >
            <Text style={[styles.filterText, { color: statusFilter === item.id ? colors.primary : colors.textDim }]}>
              {item.label}
              {item.id !== "all" && statusCounts[item.id] ? ` (${statusCounts[item.id]})` : ""}
            </Text>
          </TouchableOpacity>
        )}
      />

      {!isLoading && filtered.length > 0 && filtered.some(v => v.status === "at_sea") && (
        <View>
          <Text style={[styles.sectionLabel, { color: colors.textFaint, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 }]}>
            VOYAGE TIMELINE
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            {filtered.filter(v => v.status === "at_sea").slice(0, 4).map(v => (
              <View key={v.id} style={{ width: 260 }}>
                <VoyageTimeline vessel={v} />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={v => String(v.id)}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          renderItem={({ item }) => (
            <VesselRow vessel={item} onPress={() => router.push(`/vessel/${item.id}`)} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <VesselIcon name="anchor" size={32} color={colors.textFaint} />
              <Text style={[styles.emptyText, { color: colors.textFaint }]}>No vessels found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  title: { fontSize: 20, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  sub: { fontSize: 11, marginTop: 2, fontFamily: "Inter_400Regular" },
  searchRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginHorizontal: 16, marginTop: 12, paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1,
    backgroundColor: "rgba(14,165,233,0.04)",
  },
  searchInput: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  filterBar: { marginTop: 10 },
  filterContent: { paddingHorizontal: 16, gap: 8 },
  filterBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1,
  },
  filterText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  listContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 100 },
  row: {
    flexDirection: "row", alignItems: "center", padding: 12,
    borderRadius: 12, borderWidth: 1,
  },
  rowIcon: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: "center", alignItems: "center", marginRight: 10,
  },
  rowBody: { flex: 1 },
  rowName: { fontSize: 13, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  rowMeta: { fontSize: 10, marginTop: 2, fontFamily: "Inter_400Regular" },
  rowDestRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 3 },
  rowDest: { fontSize: 10, fontFamily: "Inter_400Regular" },
  rowRight: { alignItems: "flex-end", gap: 4 },
  statusPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1,
  },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  speedText: { fontSize: 10, fontFamily: "Inter_400Regular" },
  excBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  excText: { fontSize: 9, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  loadingState: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 8 },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  sectionLabel: { fontSize: 9, fontFamily: "Inter_500Medium", letterSpacing: 2, textTransform: "uppercase" as const },
  offlineBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, borderWidth: 1 },
  offlineDot: { width: 6, height: 6, borderRadius: 3 },
  offlineBadgeText: { fontSize: 9, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8 },
});
