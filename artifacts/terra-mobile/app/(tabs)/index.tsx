import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useState } from "react";
import {
  DimensionValue,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApiStatus } from "@szl-holdings/mobile-shared";
import { useQuery } from "@tanstack/react-query";

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? "https://" + process.env.EXPO_PUBLIC_DOMAIN + "/api"
  : "/api";

const STATUS_COLORS: Record<string, string> = {
  distress: "#c0503a",
  opportunity: "#b8943c",
  watchlist: "#3a7ad4",
  portfolio: "#40856a",
};

const STATUS_LABELS: Record<string, string> = {
  distress: "Distress",
  opportunity: "Opportunity",
  watchlist: "Watchlist",
  portfolio: "Portfolio",
};

type Marker = { id: string; address: string; status: "distress" | "opportunity" | "watchlist" | "portfolio"; score: number; price: string; lat: number; lng: number; borough: string };

function MarkerCard({ marker, onPress }: { marker: Marker; onPress: () => void }) {
  const colors = useColors();
  const statusColor = STATUS_COLORS[marker.status];

  return (
    <Pressable onPress={() => { Haptics.selectionAsync(); onPress(); }}>
      <View style={[styles.markerCard, { borderColor: statusColor + "30" }]}>
        <View style={[styles.markerDot, { backgroundColor: statusColor }]} />
        <View style={styles.markerInfo}>
          <Text style={[styles.markerAddress, { color: colors.cream }]} numberOfLines={1}>{marker.address}</Text>
          <Text style={[styles.markerSub, { color: colors.mutedForeground }]}>{marker.borough} · {marker.price}</Text>
        </View>
        <View style={[styles.scoreChip, { backgroundColor: statusColor + "15" }]}>
          <Text style={[styles.scoreText, { color: statusColor }]}>{marker.score}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function MapTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isOffline, isDegraded } = useApiStatus();
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<Marker | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [nearMeActive, setNearMeActive] = useState(false);
  const [apiMarkers, setApiMarkers] = useState<Marker[]>([]);
  const [mapApiError, setMapApiError] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : 90;

  useQuery({
    queryKey: ["terra-distress-map"],
    queryFn: async () => {
      try {
        const res = await fetch(API_BASE + "/terra/distress/search?limit=20");
        if (!res.ok) { setMapApiError(true); return null; }
        setMapApiError(false);
        const json = await res.json();
        const props = json.data?.properties ?? json.properties ?? [];
        if (props.length > 0) {
          const STATUS_MAP: Record<string, string> = {
            "pre-foreclosure": "distress",
            "tax-lien": "distress",
            "foreclosure": "distress",
            "reo": "distress",
            "probate": "opportunity",
            "divorce": "opportunity",
            "estate-sale": "opportunity",
          };
          const mapped = props.slice(0, 20).map((p: { id: string; distressType: string; opportunityScore: number; estimatedValue?: number; address: string; borough: string }, idx: number) => ({
            id: String(idx + 1),
            status: STATUS_MAP[p.distressType] ?? "distress",
            score: p.opportunityScore ?? 70,
            address: p.address,
            borough: p.borough,
            price: p.estimatedValue ? (p.estimatedValue >= 1e6 ? "$" + (p.estimatedValue / 1e6).toFixed(1) + "M" : "$" + Math.round(p.estimatedValue / 1000) + "K") : "Est. N/A",
            lat: 40.7128 + (Math.sin(idx * 1.3) * 0.08),
            lng: -73.9760 + (Math.cos(idx * 0.9) * 0.1),
          }));
          setApiMarkers(mapped);
        }
        return json;
      } catch { setMapApiError(true); return null; }
    },
    retry: 1,
  });

  const baseMarkers = apiMarkers;
  const displayMarkers = baseMarkers.filter(m =>
    !selectedStatus || m.status === selectedStatus
  );

  const handleNearMe = useCallback(async () => {
    if (nearMeActive) {
      setNearMeActive(false);
      setApiMarkers([]);
      return;
    }
    setLocationLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { setLocationLoading(false); return; }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setNearMeActive(true);
      const { latitude, longitude } = pos.coords;
      try {
        const res = await fetch(
          API_BASE + "/terra/distress/nearby?lat=" + latitude + "&lng=" + longitude + "&radiusMiles=2&limit=10"
        );
        if (res.ok) {
          const json = await res.json();
          const props = json.data?.properties ?? json.properties ?? [];
          if (props.length > 0) {
            const mapped = props.map((p: { id: string; distressType: string; opportunityScore: number; estimatedValue?: number; address: string; borough: string }, idx: number) => ({
              id: String(100 + idx),
              status: "distress",
              score: p.opportunityScore ?? 70,
              address: p.address,
              borough: p.borough,
              price: p.estimatedValue ? (p.estimatedValue >= 1e6 ? "$" + (p.estimatedValue / 1e6).toFixed(1) + "M" : "$" + Math.round(p.estimatedValue / 1000) + "K") : "Est. N/A",
              lat: latitude + (Math.sin(idx * 0.7) * 0.015),
              lng: longitude + (Math.cos(idx * 0.5) * 0.015),
            }));
            setApiMarkers(mapped);
          }
        }
      } catch {}
    } catch {}
    setLocationLoading(false);
  }, [nearMeActive]);

  const statuses = [
    { key: "distress", label: "Distress", color: "#c0503a" },
    { key: "opportunity", label: "Opportunity", color: "#b8943c" },
    { key: "watchlist", label: "Watchlist", color: "#3a7ad4" },
    { key: "portfolio", label: "Portfolio", color: "#40856a" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {(isOffline || isDegraded) && (
        <View style={{ backgroundColor: isOffline ? "#7f1d1d" : "#78350f", paddingHorizontal: 16, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ color: "#fca5a5", fontSize: 11, fontWeight: "600" }}>
            {isOffline ? "Offline — data may be stale" : "Connection degraded — retrying…"}
          </Text>
        </View>
      )}
      <LinearGradient
        colors={["rgba(184,148,60,0.06)", "transparent"]}
        style={[styles.headerGradient, { height: topPad + 120 }]}
      />
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.goldSubtle }]}>TERRA · MAP VIEW</Text>
          <Text style={[styles.title, { color: colors.cream }]}>Property Intelligence</Text>
        </View>
        <Pressable
          onPress={handleNearMe}
          style={[styles.nearMeBtn, { borderColor: nearMeActive ? colors.gold : colors.border, backgroundColor: nearMeActive ? colors.goldDim : "transparent" }]}
        >
          <Feather name={locationLoading ? "loader" : "navigation"} size={14} color={nearMeActive ? colors.gold : colors.mutedForeground} />
          <Text style={[styles.nearMeText, { color: nearMeActive ? colors.gold : colors.mutedForeground }]}>
            {locationLoading ? "Finding..." : "Near Me"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <Pressable
            onPress={() => setSelectedStatus(null)}
            style={[styles.filterChip, { borderColor: !selectedStatus ? colors.gold : colors.border, backgroundColor: !selectedStatus ? colors.goldDim : "transparent" }]}
          >
            <Text style={[styles.filterText, { color: !selectedStatus ? colors.gold : colors.mutedForeground }]}>All</Text>
          </Pressable>
          {statuses.map(s => (
            <Pressable
              key={s.key}
              onPress={() => { Haptics.selectionAsync(); setSelectedStatus(selectedStatus === s.key ? null : s.key); }}
              style={[styles.filterChip, { borderColor: selectedStatus === s.key ? s.color : colors.border, backgroundColor: selectedStatus === s.key ? s.color + "15" : "transparent" }]}
            >
              <View style={[styles.filterDot, { backgroundColor: s.color }]} />
              <Text style={[styles.filterText, { color: selectedStatus === s.key ? s.color : colors.mutedForeground }]}>{s.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={[styles.mapPlaceholder, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.mapGrid}>
          {displayMarkers.map((m, idx) => (
            <Pressable
              key={m.id}
              onPress={() => { Haptics.selectionAsync(); setSelectedMarker(m === selectedMarker ? null : m); }}
              style={[
                styles.mapPin,
                {
                  backgroundColor: STATUS_COLORS[m.status],
                  left: (10 + (idx * 13 + 7) % 65) as DimensionValue,
                  top: (10 + (idx * 17 + 11) % 60) as DimensionValue,
                  transform: [{ scale: selectedMarker?.id === m.id ? 1.4 : 1 }],
                }
              ]}
            >
              <Text style={styles.mapPinText}>{m.score}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.mapOverlay}>
          <Feather name="map" size={32} color="rgba(184,148,60,0.15)" />
          <Text style={[styles.mapNote, { color: mapApiError ? colors.rose : colors.mutedForeground }]}>
            {mapApiError
              ? "Cannot reach server · Check connection"
              : nearMeActive
                ? displayMarkers.length + " properties within 2mi of your location"
                : displayMarkers.length + " properties · Tap pins to inspect"}
          </Text>
        </View>
      </View>

      {selectedMarker && (
        <View style={[styles.markerDetail, { backgroundColor: colors.surfaceElevated, borderColor: STATUS_COLORS[selectedMarker.status] + "30" }]}>
          <View style={styles.markerDetailRow}>
            <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[selectedMarker.status] }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.markerDetailAddress, { color: colors.cream }]}>{selectedMarker.address}</Text>
              <Text style={[styles.markerDetailSub, { color: colors.mutedForeground }]}>
                {STATUS_LABELS[selectedMarker.status]} · Score {selectedMarker.score} · {selectedMarker.price}
              </Text>
            </View>
            <Pressable onPress={() => setSelectedMarker(null)}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </Pressable>
          </View>
          <View style={[styles.markerActions, { borderTopColor: colors.border }]}>
            <Pressable style={[styles.actionBtn, { backgroundColor: colors.goldDim, borderColor: colors.goldBorder }]}>
              <Text style={[styles.actionBtnText, { color: colors.gold }]}>Add to Watchlist</Text>
            </Pressable>
            <Pressable style={[styles.actionBtn, { backgroundColor: "rgba(192,80,58,0.1)", borderColor: "rgba(192,80,58,0.2)" }]}>
              <Text style={[styles.actionBtnText, { color: colors.rose }]}>Create Lead</Text>
            </Pressable>
          </View>
        </View>
      )}

      <View style={[styles.listHeader, { borderTopColor: colors.border }]}>
        <Text style={[styles.listTitle, { color: colors.goldSubtle }]}>NEARBY PROPERTIES</Text>
        <Text style={[styles.listCount, { color: colors.mutedForeground }]}>{displayMarkers.length} results</Text>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: bottomPad }} showsVerticalScrollIndicator={false}>
        {displayMarkers.map(m => (
          <MarkerCard key={m.id} marker={m} onPress={() => setSelectedMarker(m === selectedMarker ? null : m)} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { position: "absolute", top: 0, left: 0, right: 0 },
  header: { paddingHorizontal: 20, paddingBottom: 12, flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  eyebrow: { fontSize: 9, fontFamily: "Inter_500Medium", letterSpacing: 3, marginBottom: 4 },
  title: { fontSize: 20, fontFamily: "Inter_600SemiBold", letterSpacing: -0.3 },
  nearMeBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  nearMeText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  filterRow: { paddingBottom: 10 },
  filterScroll: { paddingHorizontal: 20, gap: 8 },
  filterChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, borderWidth: 1 },
  filterDot: { width: 6, height: 6, borderRadius: 3 },
  filterText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  mapPlaceholder: { height: 220, marginHorizontal: 20, borderRadius: 12, borderWidth: 1, overflow: "hidden", position: "relative", marginBottom: 12 },
  mapGrid: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  mapPin: { position: "absolute", width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  mapPinText: { fontSize: 9, fontFamily: "Inter_600SemiBold", color: "white" },
  mapOverlay: { position: "absolute", bottom: 12, left: 0, right: 0, alignItems: "center" },
  mapNote: { fontSize: 10, fontFamily: "Inter_300Light", marginTop: 4 },
  markerDetail: { marginHorizontal: 20, marginBottom: 8, borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  markerDetailRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  markerDetailAddress: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 3 },
  markerDetailSub: { fontSize: 10, fontFamily: "Inter_300Light" },
  markerActions: { flexDirection: "row", gap: 8, padding: 12, borderTopWidth: 1 },
  actionBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, alignItems: "center" },
  actionBtnText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  listHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 10, borderTopWidth: 1 },
  listTitle: { fontSize: 9, fontFamily: "Inter_500Medium", letterSpacing: 2 },
  listCount: { fontSize: 10, fontFamily: "Inter_300Light" },
  list: { flex: 1, paddingHorizontal: 20 },
  markerCard: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, marginBottom: 6, backgroundColor: "rgba(255,255,255,0.02)" },
  markerDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  markerInfo: { flex: 1 },
  markerAddress: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 2 },
  markerSub: { fontSize: 10, fontFamily: "Inter_300Light" },
  scoreChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  scoreText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
});
