import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Dimensions,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
  useAnimatedProps,
} from "react-native-reanimated";
import Svg, { Polyline, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import { useColors } from "@/hooks/useColors";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = SCREEN_W - 32;
const CHART_H = 56;
const CHART_W = CARD_W - 100;

interface Platform {
  key: string;
  name: string;
  role: string;
  status: "online" | "degraded";
  latencyMs: number;
}

interface EcosystemHealth {
  platforms: Platform[];
  summary: { total: number; online: number; degraded: number };
}

const PORTFOLIO = [
  { key: "aegis", name: "Aegis", color: "#6366f1", icon: "shield", subtitle: "Defense & Intel" },
  { key: "vessels", name: "Vessels", color: "#3b82f6", icon: "anchor", subtitle: "Maritime Intel" },
  { key: "terra", name: "Terra", color: "#4d7c0f", icon: "map", subtitle: "Real Estate Intel" },
  { key: "lyte", name: "Lyte", color: "#f59e0b", icon: "zap", subtitle: "Observability" },
  { key: "carlota-jo", name: "Carlota Jo", color: "#e879f9", icon: "briefcase", subtitle: "Advisory" },
  { key: "prism", name: "PRISM", color: "#f97316", icon: "book", subtitle: "Legal Matter" },
];

function generateHeartbeat(status: string, latencyMs: number, points = 20) {
  const base = 0.5;
  const amplitude = status === "online" ? 0.35 : status === "degraded" ? 0.2 : 0.02;
  const noise = latencyMs > 100 ? 0.12 : latencyMs > 50 ? 0.06 : 0.02;

  return Array.from({ length: points }, (_, i) => {
    const t = i / (points - 1);
    const spike = Math.sin(t * Math.PI * 6) * amplitude;
    const jitter = (Math.random() - 0.5) * noise;
    return Math.min(0.95, Math.max(0.05, base + spike + jitter));
  });
}

function HeartbeatLine({
  points,
  color,
  width,
  height,
  animated,
}: {
  points: number[];
  color: string;
  width: number;
  height: number;
  animated: boolean;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      progress.value = withRepeat(
        withTiming(1, { duration: 2000, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [animated]);

  const coords = points
    .map((v, i) => `${(i / (points.length - 1)) * width},${height - v * height}`)
    .join(" ");

  return (
    <Svg width={width} height={height}>
      <Polyline
        points={coords}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.9}
      />
    </Svg>
  );
}

export default function PulseScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const { data: health } = useQuery<EcosystemHealth>({
    queryKey: ["szl-ecosystem-health"],
    queryFn: () => apiFetch<EcosystemHealth>("/api/holdings/ecosystem-health"),
    refetchInterval: 15000,
    retry: 1,
  });

  const heartbeatData = PORTFOLIO.map((p) => {
    const platform = health?.platforms?.find(
      (pl) => pl.key === p.key || pl.name?.toLowerCase().includes(p.key)
    );
    const status = platform?.status ?? "online";
    const latency = platform?.latencyMs ?? 40;
    return {
      ...p,
      status,
      latency,
      points: generateHeartbeat(status, latency),
    };
  });

  const handleRefresh = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  return (
    <LinearGradient colors={["#090810", "#0d0b1a"]} style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#c9a84c" />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>SZL Holdings</Text>
            <Text style={styles.title}>Portfolio Pulse</Text>
            <Text style={styles.subtitle}>Live heartbeat — all platforms</Text>
          </View>
          <Pressable style={styles.refreshBtn} onPress={handleRefresh}>
            <Feather name="refresh-cw" size={14} color="#c9a84c" />
          </Pressable>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {health?.summary?.online ?? "—"}
            </Text>
            <Text style={styles.summaryLabel}>Online</Text>
          </View>
          <View style={[styles.summaryDivider]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: health?.summary?.degraded ? "#f59e0b" : "#22c55e" }]}>
              {health?.summary?.degraded ?? "0"}
            </Text>
            <Text style={styles.summaryLabel}>Degraded</Text>
          </View>
          <View style={[styles.summaryDivider]} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{health?.summary?.total ?? PORTFOLIO.length}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
        </View>

        <View style={styles.grid}>
          {heartbeatData.map((item) => (
            <View key={item.key} style={styles.card}>
              <View style={styles.cardLeft}>
                <View style={[styles.iconBox, { backgroundColor: `${item.color}20`, borderColor: `${item.color}40` }]}>
                  <Feather name={item.icon as any} size={14} color={item.color} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <Text style={styles.cardSub}>{item.subtitle}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: item.status === "online" ? "#22c55e20" : "#f59e0b20" }]}>
                    <View style={[styles.statusDot, { backgroundColor: item.status === "online" ? "#22c55e" : "#f59e0b" }]} />
                    <Text style={[styles.statusText, { color: item.status === "online" ? "#22c55e" : "#f59e0b" }]}>
                      {item.status === "online" ? "Online" : "Degraded"}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.chartArea}>
                <HeartbeatLine
                  key={`${item.key}-${refreshKey}`}
                  points={item.points}
                  color={item.color}
                  width={CHART_W / 2 + 20}
                  height={CHART_H}
                  animated={item.status === "online"}
                />
                <Text style={[styles.latency, { color: `${item.color}cc` }]}>
                  {item.latency}ms
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: "#22c55e" }]} />
            <Text style={styles.legendLabel}>Steady pulse = healthy</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: "#f59e0b" }]} />
            <Text style={styles.legendLabel}>Elevated = high activity</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: "#ef444460" }]} />
            <Text style={styles.legendLabel}>Flat line = down</Text>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  eyebrow: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    color: "#c9a84c",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_600SemiBold",
    color: "#f0eeff",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(240,238,255,0.4)",
    marginTop: 2,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(201,168,76,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.2)",
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    padding: 16,
    alignItems: "center",
    justifyContent: "space-around",
  },
  summaryItem: { alignItems: "center", gap: 4 },
  summaryValue: {
    fontSize: 24,
    fontFamily: "Inter_600SemiBold",
    color: "#22c55e",
  },
  summaryLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  grid: { gap: 10 },
  card: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: { gap: 3 },
  cardName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.9)",
  },
  cardSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.4)",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chartArea: {
    alignItems: "flex-end",
    gap: 2,
  },
  latency: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
  },
  legend: {
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  legendLine: {
    width: 24,
    height: 2,
    borderRadius: 1,
  },
  legendLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.4)",
  },
});
