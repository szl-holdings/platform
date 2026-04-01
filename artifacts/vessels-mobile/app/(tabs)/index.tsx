import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Dimensions,
} from "react-native";
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, {
  Circle,
  G,
  Line,
  Polyline,
  Rect,
  Text as SvgText,
} from "react-native-svg";
import { VesselIcon } from "@/components/VesselIcon";
import { useColors } from "@/hooks/useColors";
import { api, type Vessel, CACHE_KEYS, cacheSet, cacheGetStale } from "@/lib/api";
import { vesselsWs, type VesselPositionUpdate } from "@/lib/websocket";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const MAP_W = SCREEN_W;
const MAP_H = Math.round(SCREEN_H * 0.55);
const MIN_SCALE = 1;
const MAX_SCALE = 8;

const STATUS_COLORS: Record<string, string> = {
  at_sea: "#22c55e",
  in_port: "#0ea5e9",
  anchored: "#f59e0b",
  maintenance: "#ef4444",
  active: "#22c55e",
  delayed: "#f97316",
};

const STATUS_LABELS: Record<string, string> = {
  at_sea: "At Sea",
  in_port: "In Port",
  anchored: "Anchored",
  maintenance: "Maintenance",
  active: "Active",
  delayed: "Delayed",
};

function latLonToXY(lat: number, lon: number): { x: number; y: number } {
  const x = ((lon + 180) / 360) * MAP_W;
  const y = ((90 - lat) / 180) * MAP_H;
  return { x, y };
}

interface RoutePoint { lat: number; lon: number }

function WorldMapCanvas({
  vessels,
  selectedId,
  onSelectVessel,
  livePositions,
  routeHistory,
  flyToVessel,
  onFlyToHandled,
}: {
  vessels: Vessel[];
  selectedId: number | null;
  onSelectVessel: (v: Vessel) => void;
  livePositions: Map<number, VesselPositionUpdate>;
  routeHistory: RoutePoint[];
  flyToVessel: Vessel | null;
  onFlyToHandled: () => void;
}) {
  const colors = useColors();

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const clampTranslation = useCallback((tx: number, ty: number, sc: number) => {
    const maxX = (MAP_W * sc - MAP_W) / 2;
    const maxY = (MAP_H * sc - MAP_H) / 2;
    return {
      x: Math.min(Math.max(tx, -maxX), maxX),
      y: Math.min(Math.max(ty, -maxY), maxY),
    };
  }, []);

  useEffect(() => {
    if (!flyToVessel) return;
    const pos = livePositions.get(flyToVessel.id);
    const lat = pos ? parseFloat(pos.latitude) : parseFloat(flyToVessel.latitude ?? "0");
    const lon = pos ? parseFloat(pos.longitude) : parseFloat(flyToVessel.longitude ?? "0");
    if (isNaN(lat) || isNaN(lon)) {
      runOnJS(onFlyToHandled)();
      return;
    }
    const { x, y } = latLonToXY(lat, lon);
    const targetScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE + 2, scale.value));
    const sc = targetScale;
    const tx = -(x - MAP_W / 2) * (sc - 1);
    const ty = -(y - MAP_H / 2) * (sc - 1);
    const clamped = clampTranslation(tx, ty, sc);
    scale.value = withTiming(sc, { duration: 600 });
    savedScale.value = sc;
    translateX.value = withTiming(clamped.x, { duration: 600 });
    translateY.value = withTiming(clamped.y, { duration: 600 });
    savedTranslateX.value = clamped.x;
    savedTranslateY.value = clamped.y;
    runOnJS(onFlyToHandled)();
  }, [flyToVessel, livePositions, clampTranslation, scale, savedScale, translateX, translateY, savedTranslateX, savedTranslateY, onFlyToHandled]);

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((e) => {
      scale.value = Math.min(MAX_SCALE, Math.max(MIN_SCALE, savedScale.value * e.scale));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const panGesture = Gesture.Pan()
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((e) => {
      const sc = scale.value;
      const maxX = (MAP_W * sc - MAP_W) / 2;
      const maxY = (MAP_H * sc - MAP_H) / 2;
      translateX.value = Math.min(Math.max(savedTranslateX.value + e.translationX, -maxX), maxX);
      translateY.value = Math.min(Math.max(savedTranslateY.value + e.translationY, -maxY), maxY);
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const handleTap = useCallback((tapX: number, tapY: number) => {
    const sc = scale.value;
    const tx = translateX.value;
    const ty = translateY.value;
    const svgX = (tapX - MAP_W / 2 - tx) / sc + MAP_W / 2;
    const svgY = (tapY - MAP_H / 2 - ty) / sc + MAP_H / 2;

    let closest: Vessel | null = null;
    let minDist = 24 / sc;

    for (const v of vessels) {
      const pos = livePositions.get(v.id);
      const lat = pos ? parseFloat(pos.latitude) : parseFloat(v.latitude ?? "0");
      const lon = pos ? parseFloat(pos.longitude) : parseFloat(v.longitude ?? "0");
      if (isNaN(lat) || isNaN(lon)) continue;
      const { x, y } = latLonToXY(lat, lon);
      const dist = Math.sqrt((x - svgX) ** 2 + (y - svgY) ** 2);
      if (dist < minDist) {
        minDist = dist;
        closest = v;
      }
    }
    if (closest) onSelectVessel(closest);
  }, [vessels, livePositions, scale, translateX, translateY, onSelectVessel]);

  const tapGesture = Gesture.Tap()
    .maxDuration(200)
    .onEnd((e) => {
      runOnJS(handleTap)(e.x, e.y);
    });

  const composed = Gesture.Race(
    tapGesture,
    Gesture.Simultaneous(pinchGesture, panGesture),
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const mappable = vessels.filter(v => {
    const pos = livePositions.get(v.id);
    const lat = pos ? parseFloat(pos.latitude) : (v.latitude ? parseFloat(v.latitude) : null);
    const lon = pos ? parseFloat(pos.longitude) : (v.longitude ? parseFloat(v.longitude) : null);
    return lat !== null && lon !== null && !isNaN(lat) && !isNaN(lon);
  });

  const routePoints = routeHistory
    .map(p => latLonToXY(p.lat, p.lon))
    .map(pt => `${pt.x},${pt.y}`)
    .join(" ");

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.mapCanvas, { backgroundColor: colors.navyDeep, borderColor: colors.border, overflow: "hidden", flex: 1 }]}>
        <GestureDetector gesture={composed}>
          <Animated.View style={[{ width: MAP_W, height: MAP_H }, animatedStyle]}>
            <Svg width={MAP_W} height={MAP_H}>
              <Rect x={0} y={0} width={MAP_W} height={MAP_H} fill={colors.navyDeep} />
              <Line x1={0} y1={MAP_H / 2} x2={MAP_W} y2={MAP_H / 2} stroke={colors.border} strokeWidth={0.5} />
              <Line x1={MAP_W / 2} y1={0} x2={MAP_W / 2} y2={MAP_H} stroke={colors.border} strokeWidth={0.5} />
              {[30, 60, -30, -60].map(lat => {
                const { y } = latLonToXY(lat, 0);
                return <Line key={lat} x1={0} y1={y} x2={MAP_W} y2={y} stroke={colors.border} strokeWidth={0.3} strokeDasharray="4 4" />;
              })}
              {[-120, -60, 60, 120].map(lon => {
                const { x } = latLonToXY(0, lon);
                return <Line key={lon} x1={x} y1={0} x2={x} y2={MAP_H} stroke={colors.border} strokeWidth={0.3} strokeDasharray="4 4" />;
              })}

              {routeHistory.length >= 2 && routePoints && (
                <Polyline
                  points={routePoints}
                  fill="none"
                  stroke="#0ea5e9"
                  strokeWidth={1.5}
                  strokeOpacity={0.7}
                  strokeDasharray="5 3"
                />
              )}

              {mappable.map(v => {
                const pos = livePositions.get(v.id);
                const lat = pos ? parseFloat(pos.latitude) : parseFloat(v.latitude ?? "0");
                const lon = pos ? parseFloat(pos.longitude) : parseFloat(v.longitude ?? "0");
                const { x, y } = latLonToXY(lat, lon);
                const color = STATUS_COLORS[v.status] || colors.textFaint;
                const isSelected = selectedId === v.id;
                const isUnderway = v.status === "at_sea";
                const spd = pos ? parseFloat(pos.speed) : (v.speed ? parseFloat(v.speed) : 0);
                const hdg = pos ? pos.heading : (v.heading ?? 0);
                const radians = (hdg - 90) * (Math.PI / 180);
                const trailLen = Math.min(spd * 3, 20);
                const tx = x - Math.cos(radians) * trailLen;
                const ty = y - Math.sin(radians) * trailLen;

                return (
                  <G key={v.id}>
                    {isUnderway && spd > 0 && (
                      <Line
                        x1={tx} y1={ty} x2={x} y2={y}
                        stroke={color} strokeWidth={1.5} strokeOpacity={0.4}
                        strokeDasharray="3 2"
                      />
                    )}
                    {isSelected && (
                      <Circle cx={x} cy={y} r={12} fill="transparent" stroke={color} strokeWidth={2} strokeOpacity={0.9} />
                    )}
                    {isSelected && (
                      <Circle cx={x} cy={y} r={16} fill="transparent" stroke={color} strokeWidth={0.8} strokeOpacity={0.4} />
                    )}
                    <Circle cx={x} cy={y} r={isSelected ? 5 : 4} fill={color} />
                    {(v.activeExceptions ?? 0) > 0 && (
                      <Circle cx={x + 5} cy={y - 5} r={3} fill="#ef4444" />
                    )}
                  </G>
                );
              })}

              {mappable.length === 0 && (
                <SvgText
                  x={MAP_W / 2} y={MAP_H / 2}
                  fill={colors.textFaint}
                  fontSize={11}
                  textAnchor="middle"
                >
                  No position data available
                </SvgText>
              )}
            </Svg>
          </Animated.View>
        </GestureDetector>

        <View style={styles.mapLegend}>
          {Object.entries(STATUS_COLORS).slice(0, 4).map(([k, c]) => (
            <View key={k} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: c }]} />
              <Text style={[styles.legendLabel, { color: colors.textFaint }]}>{STATUS_LABELS[k]?.split(" ")[0] || k}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.mapBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.mapBadgeText, { color: colors.textFaint }]}>Global AIS</Text>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

function VesselCallout({ vessel, onPress, livePosition }: {
  vessel: Vessel;
  onPress: () => void;
  livePosition?: VesselPositionUpdate;
}) {
  const colors = useColors();
  const sc = STATUS_COLORS[vessel.status] || colors.textFaint;
  const sl = STATUS_LABELS[vessel.status] || vessel.status;
  const spd = livePosition ? parseFloat(livePosition.speed) : (vessel.speed ? parseFloat(vessel.speed) : null);
  const dest = vessel.destination;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.callout, { backgroundColor: colors.card, borderColor: `${sc}40` }]}
      activeOpacity={0.8}
    >
      <View style={styles.calloutHeader}>
        <View style={[styles.calloutIcon, { backgroundColor: `${sc}15` }]}>
          <VesselIcon name="anchor" size={14} color={sc} />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[styles.calloutName, { color: colors.text }]} numberOfLines={1}>{vessel.name}</Text>
          <Text style={[styles.calloutMeta, { color: colors.textDim }]}>{vessel.vesselType} · {vessel.flag}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: `${sc}15`, borderColor: `${sc}30` }]}>
          <View style={[styles.statusDot, { backgroundColor: sc }]} />
          <Text style={[styles.statusText, { color: sc }]}>{sl}</Text>
        </View>
      </View>
      <View style={styles.calloutFooter}>
        {spd !== null && (
          <Text style={[styles.calloutDetail, { color: colors.textFaint }]}>
            <VesselIcon name="navigation" size={10} color={colors.textFaint} /> {spd.toFixed(1)} kn
          </Text>
        )}
        {dest && (
          <Text style={[styles.calloutDetail, { color: colors.textFaint }]} numberOfLines={1}>
            → {dest}
          </Text>
        )}
        {livePosition && (
          <View style={[styles.liveDot, { backgroundColor: colors.green }]} />
        )}
        <VesselIcon name="chevron-right" size={14} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );
}

function FleetSummaryBar({ summary }: {
  summary: { totalVesselsTracked: number; underwayCount: number; anchoredCount: number; mooredCount: number; avgSpeedKnots: number; liveData: boolean } | null | undefined;
  wsConnected: boolean;
}) {
  const colors = useColors();
  if (!summary) return null;
  return (
    <View style={[styles.summaryBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {[
        { label: "TOTAL", value: summary.totalVesselsTracked, color: colors.primary },
        { label: "UNDERWAY", value: summary.underwayCount, color: colors.green },
        { label: "ANCHORED", value: summary.anchoredCount, color: colors.amber },
        { label: "AVG SPD", value: `${summary.avgSpeedKnots}kn`, color: colors.textDim },
      ].map((item, i) => (
        <View key={i} style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: item.color }]}>{item.value}</Text>
          <Text style={[styles.summaryLabel, { color: colors.textFaint }]}>{item.label}</Text>
        </View>
      ))}
      {summary.liveData && (
        <View style={[styles.liveBadge, { backgroundColor: colors.greenDim, borderColor: `${colors.green}30` }]}>
          <View style={[styles.liveDotSm, { backgroundColor: colors.green }]} />
          <Text style={[styles.liveText, { color: colors.green }]}>LIVE</Text>
        </View>
      )}
    </View>
  );
}

export default function FleetMapScreen() {
  const colors = useColors();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const livePositions = useRef(new Map<number, VesselPositionUpdate>()).current;
  const [positionVersion, setPositionVersion] = useState(0);
  const [routeHistory, setRouteHistory] = useState<RoutePoint[]>([]);
  const [flyToVessel, setFlyToVessel] = useState<Vessel | null>(null);
  const selectedIdRef = useRef<number | null>(null);

  const { data: vessels = [], isLoading, refetch } = useQuery({
    queryKey: ["vessels-roster-map"],
    queryFn: async () => {
      try {
        const data = await api.roster();
        await cacheSet(CACHE_KEYS.fleet, data);
        return data;
      } catch (e) {
        return (await cacheGetStale<Vessel[]>(CACHE_KEYS.fleet)) ?? [];
      }
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const { data: summary } = useQuery({
    queryKey: ["live-fleet-summary"],
    queryFn: () => api.liveFleetSummary(),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  useEffect(() => {
    vesselsWs.connect();
    const onConnect = () => setWsConnected(true);
    const onDisconnect = () => setWsConnected(false);
    const onPosition = (upd: VesselPositionUpdate) => {
      livePositions.set(upd.vesselId, upd);
      setPositionVersion(v => v + 1);
      if (upd.vesselId === selectedIdRef.current) {
        const lat = parseFloat(upd.latitude);
        const lon = parseFloat(upd.longitude);
        if (!isNaN(lat) && !isNaN(lon)) {
          setRouteHistory(prev => {
            const next = [...prev, { lat, lon }];
            return next.length > 50 ? next.slice(-50) : next;
          });
        }
      }
    };
    const onAlert = () => {
      queryClient.invalidateQueries({ queryKey: ["fleet-exceptions-mobile"] });
    };

    vesselsWs.on("connected", onConnect);
    vesselsWs.on("disconnected", onDisconnect);
    vesselsWs.on("vessel_position", onPosition);
    vesselsWs.on("alert_created", onAlert);

    return () => {
      vesselsWs.off("connected", onConnect);
      vesselsWs.off("disconnected", onDisconnect);
      vesselsWs.off("vessel_position", onPosition);
      vesselsWs.off("alert_created", onAlert);
    };
  }, [livePositions, queryClient]);

  const filtered = statusFilter === "all" ? vessels : vessels.filter(v => v.status === statusFilter);
  const statusCounts = vessels.reduce<Record<string, number>>((acc, v) => {
    acc[v.status] = (acc[v.status] || 0) + 1;
    return acc;
  }, {});

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const filters = [
    { id: "all", label: `All (${vessels.length})` },
    { id: "at_sea", label: `At Sea (${statusCounts.at_sea || 0})` },
    { id: "in_port", label: `Port (${statusCounts.in_port || 0})` },
    { id: "anchored", label: `Anchored (${statusCounts.anchored || 0})` },
    { id: "maintenance", label: `Maint. (${statusCounts.maintenance || 0})` },
  ];

  const handleVesselSelect = useCallback((v: Vessel) => {
    if (selectedVessel?.id !== v.id) setRouteHistory([]);
    selectedIdRef.current = v.id;
    setSelectedVessel(v);
    setFlyToVessel(v);
  }, [selectedVessel]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top"]}>
      <View style={styles.mapFullScreen}>
        <WorldMapCanvas
          vessels={filtered}
          selectedId={selectedVessel?.id ?? null}
          onSelectVessel={handleVesselSelect}
          livePositions={livePositions}
          routeHistory={routeHistory}
          flyToVessel={flyToVessel}
          onFlyToHandled={() => setFlyToVessel(null)}
        />

        <View style={[styles.mapHeaderOverlay]} pointerEvents="box-none">
          <View style={[styles.header, { borderBottomColor: "transparent", backgroundColor: `${colors.bg}cc` }]}>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Fleet Command</Text>
              <Text style={[styles.headerSub, { color: colors.textFaint }]}>
                {wsConnected ? "Live AIS" : "Polling"} · {vessels.length} vessels
              </Text>
            </View>
            <View style={styles.headerRight}>
              {wsConnected && <View style={[styles.wsIndicator, { backgroundColor: colors.green }]} />}
              <TouchableOpacity
                style={[styles.headerBtn, { backgroundColor: colors.primaryDim, borderColor: colors.primaryBorder }]}
                onPress={() => refetch()}
              >
                <VesselIcon name="refresh-cw" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <FleetSummaryBar summary={summary} wsConnected={wsConnected} />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContent}
          >
            {filters.map(f => (
              <TouchableOpacity
                key={f.id}
                onPress={() => setStatusFilter(f.id)}
                style={[
                  styles.filterBtn,
                  {
                    backgroundColor: statusFilter === f.id ? colors.primaryDim : `${colors.bg}bb`,
                    borderColor: statusFilter === f.id ? colors.primaryBorder : colors.border,
                  },
                ]}
              >
                <Text style={[styles.filterText, { color: statusFilter === f.id ? colors.primary : colors.textDim }]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {selectedVessel && (
          <View style={styles.calloutOverlay} pointerEvents="box-none">
            <VesselCallout
              vessel={selectedVessel}
              livePosition={livePositions.get(selectedVessel.id)}
              onPress={() => router.push(`/vessel/${selectedVessel.id}`)}
            />
          </View>
        )}
      </View>

      <ScrollView
        style={styles.vesselListScroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View style={styles.vesselListWrap}>
          {isLoading && vessels.length === 0 ? (
            [...Array(4)].map((_, i) => (
              <View key={i} style={[styles.skeleton, { backgroundColor: colors.card }]} />
            ))
          ) : filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <VesselIcon name="anchor" size={32} color={colors.textFaint} />
              <Text style={[styles.emptyText, { color: colors.textFaint }]}>No vessels</Text>
            </View>
          ) : (
            filtered.map(v => {
              const sc = STATUS_COLORS[v.status] || colors.textFaint;
              const sl = STATUS_LABELS[v.status] || v.status;
              const pos = livePositions.get(v.id);
              const spd = pos ? parseFloat(pos.speed) : (v.speed ? parseFloat(v.speed) : null);
              return (
                <TouchableOpacity
                  key={v.id}
                  style={[
                    styles.listCard,
                    {
                      borderColor: selectedVessel?.id === v.id ? `${sc}50` : colors.border,
                      backgroundColor: selectedVessel?.id === v.id ? `${sc}08` : colors.card,
                    },
                  ]}
                  onPress={() => handleVesselSelect(v)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.listCardDot, { backgroundColor: sc }]} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.listCardName, { color: colors.text }]} numberOfLines={1}>{v.name}</Text>
                    <Text style={[styles.listCardMeta, { color: colors.textDim }]}>{v.vesselType} · {v.flag}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[styles.listCardStatus, { color: sc }]}>{sl}</Text>
                    {spd !== null && (
                      <Text style={[styles.listCardSpeed, { color: colors.textFaint }]}>{spd.toFixed(1)} kn</Text>
                    )}
                    {pos && <View style={[styles.liveSmDot, { backgroundColor: colors.green }]} />}
                    {(v.activeExceptions ?? 0) > 0 && (
                      <View style={[styles.excBadge, { backgroundColor: colors.redDim }]}>
                        <Text style={[styles.excText, { color: colors.red }]}>{v.activeExceptions}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      <View style={[styles.coordinatesBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <VesselIcon name="radio" size={12} color={colors.textFaint} />
        <Text style={[styles.coordsText, { color: colors.textFaint }]}>
          AIS · {wsConnected ? "WebSocket live" : "REST polling"} · Digitraffic + BarentsWatch
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapFullScreen: {
    height: SCREEN_H * 0.55,
    position: "relative",
    overflow: "hidden",
  },
  mapHeaderOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  calloutOverlay: {
    position: "absolute",
    bottom: 8,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  vesselListScroll: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 11, marginTop: 2, fontFamily: "Inter_400Regular" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  wsIndicator: { width: 7, height: 7, borderRadius: 4 },
  headerBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center", borderWidth: 1 },
  scrollContent: { paddingBottom: 100 },
  summaryBar: {
    flexDirection: "row", alignItems: "center",
    marginHorizontal: 16, marginTop: 4, borderRadius: 12, borderWidth: 1, padding: 10, gap: 4,
  },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryValue: { fontSize: 16, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  summaryLabel: { fontSize: 9, marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "Inter_500Medium" },
  liveBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1,
  },
  liveDotSm: { width: 5, height: 5, borderRadius: 3 },
  liveText: { fontSize: 9, fontWeight: "700" as const, letterSpacing: 0.5 },
  mapWrapper: { borderRadius: 14, overflow: "hidden" },
  mapCanvas: { borderRadius: 14, borderWidth: 1, overflow: "hidden", position: "relative" },
  mapTapTarget: { position: "absolute" },
  mapLegend: {
    position: "absolute", bottom: 8, left: 8,
    flexDirection: "row", gap: 8, flexWrap: "wrap",
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendLabel: { fontSize: 8, fontFamily: "Inter_400Regular" },
  mapBadge: {
    position: "absolute", top: 8, right: 8,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, borderWidth: 1,
  },
  mapBadgeText: { fontSize: 9, fontFamily: "Inter_500Medium" },
  callout: {
    padding: 12, borderRadius: 12, borderWidth: 1,
  },
  calloutHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  calloutIcon: { width: 34, height: 34, borderRadius: 9, justifyContent: "center", alignItems: "center" },
  calloutName: { fontSize: 13, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  calloutMeta: { fontSize: 10, marginTop: 1, fontFamily: "Inter_400Regular" },
  calloutFooter: { flexDirection: "row", alignItems: "center", gap: 10 },
  calloutDetail: { fontSize: 11, fontFamily: "Inter_400Regular" },
  liveDot: { width: 7, height: 7, borderRadius: 4, marginLeft: "auto" },
  statusPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1,
  },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  filterScroll: { marginTop: 12 },
  filterContent: { paddingHorizontal: 16, gap: 8 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  vesselListWrap: { paddingHorizontal: 16, paddingTop: 10, gap: 8 },
  listCard: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, borderWidth: 1 },
  listCardDot: { width: 9, height: 9, borderRadius: 5 },
  listCardName: { fontSize: 13, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  listCardMeta: { fontSize: 10, marginTop: 1, fontFamily: "Inter_400Regular" },
  listCardStatus: { fontSize: 10, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  listCardSpeed: { fontSize: 10, marginTop: 2, fontFamily: "Inter_400Regular" },
  liveSmDot: { width: 6, height: 6, borderRadius: 3, marginTop: 2 },
  excBadge: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6, marginTop: 2 },
  excText: { fontSize: 9, fontWeight: "700" as const },
  skeleton: { height: 62, borderRadius: 12 },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  coordinatesBar: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1,
  },
  coordsText: { fontSize: 10, fontFamily: "Inter_400Regular" },
});
