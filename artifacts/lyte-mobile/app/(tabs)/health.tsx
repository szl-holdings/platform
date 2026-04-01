import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useState } from "react";
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LYTE_COLORS } from "@/constants/colors";
import { useLyte, PlatformHealth } from "@/context/LyteContext";

function getStatusColor(status: PlatformHealth["status"]) {
  const map = {
    healthy: LYTE_COLORS.neonGreen,
    degraded: LYTE_COLORS.high,
    down: LYTE_COLORS.critical,
    unknown: LYTE_COLORS.low,
  };
  return map[status] ?? LYTE_COLORS.low;
}

function getStatusLabel(status: PlatformHealth["status"]) {
  const map = { healthy: "Healthy", degraded: "Degraded", down: "Down", unknown: "Unknown" };
  return map[status] ?? "Unknown";
}

function RingChart({ pct, color, size = 60 }: { pct: number; color: string; size?: number }) {
  const r = size / 2 - 6;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={`${color}20`} strokeWidth={5} fill="none" />
      <Circle
        cx={size / 2} cy={size / 2} r={r}
        stroke={color} strokeWidth={5} fill="none"
        strokeDasharray={`${circ}`}
        strokeDashoffset={`${offset}`}
        strokeLinecap="round"
        rotation="-90"
        origin={`${size / 2}, ${size / 2}`}
      />
    </Svg>
  );
}

function PlatformCard({ platform }: { platform: PlatformHealth }) {
  const [expanded, setExpanded] = useState(false);
  const statusColor = getStatusColor(platform.status);

  return (
    <Pressable onPress={() => { Haptics.selectionAsync(); setExpanded(e => !e); }}>
      <View style={[styles.platformCard, { borderColor: platform.status === "degraded" ? LYTE_COLORS.highLight : LYTE_COLORS.border }]}>
        <View style={styles.platformHeader}>
          <View style={[styles.statusDot, { backgroundColor: statusColor, shadowColor: statusColor, shadowOpacity: platform.status === "healthy" ? 0.6 : 0, shadowRadius: 4 }]} />
          <View style={styles.platformInfo}>
            <Text style={styles.platformName}>{platform.name}</Text>
            <Text style={[styles.platformStatus, { color: statusColor }]}>{getStatusLabel(platform.status)}</Text>
          </View>
          <View style={styles.platformMetrics}>
            <Text style={styles.metricValue}>{platform.uptime.toFixed(1)}%</Text>
            <Text style={styles.metricLabel}>uptime</Text>
          </View>
          <View style={styles.ringWrap}>
            <RingChart pct={platform.slaCompliance} color={statusColor} size={44} />
            <Text style={[styles.ringLabel, { color: statusColor }]}>{platform.slaCompliance}%</Text>
          </View>
        </View>

        {expanded && (
          <View style={styles.platformDetail}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>ERROR RATE</Text>
                <Text style={[styles.detailValue, { color: platform.errorRate > 1 ? LYTE_COLORS.critical : LYTE_COLORS.neonGreen }]}>{platform.errorRate.toFixed(1)}%</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>P95 LATENCY</Text>
                <Text style={[styles.detailValue, { color: platform.p95Latency > 400 ? LYTE_COLORS.high : LYTE_COLORS.textPrimary }]}>{platform.p95Latency}ms</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>ALERTS</Text>
                <Text style={[styles.detailValue, { color: platform.alertCount > 0 ? LYTE_COLORS.high : LYTE_COLORS.neonGreen }]}>{platform.alertCount}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>SLA</Text>
                <Text style={[styles.detailValue, { color: platform.slaCompliance >= 99 ? LYTE_COLORS.neonGreen : LYTE_COLORS.medium }]}>{platform.slaCompliance}%</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function HealthScreen() {
  const insets = useSafeAreaInsets();
  const { platforms, reload } = useLyte();
  const [refreshing, setRefreshing] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : 90;

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    reload();
    await new Promise(r => setTimeout(r, 1000));
    setRefreshing(false);
  }, [reload]);

  const healthyCount = platforms.filter(p => p.status === "healthy").length;
  const degradedCount = platforms.filter(p => p.status === "degraded").length;
  const downCount = platforms.filter(p => p.status === "down").length;
  const avgUptime = platforms.length > 0 ? platforms.reduce((s, p) => s + p.uptime, 0) / platforms.length : 0;
  const avgSla = platforms.length > 0 ? platforms.reduce((s, p) => s + p.slaCompliance, 0) / platforms.length : 0;
  const overallStatus = downCount > 0 ? "down" : degradedCount > 0 ? "degraded" : "healthy";
  const overallColor = getStatusColor(overallStatus as PlatformHealth["status"]);

  return (
    <View style={[styles.container, { backgroundColor: LYTE_COLORS.background }]}>
      <LinearGradient
        colors={["rgba(0,255,136,0.04)", "transparent"]}
        style={[styles.headerGradient, { height: topPad + 120 }]}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: bottomPad, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={LYTE_COLORS.neonGreen} />}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>HEALTH DASHBOARD</Text>
          <Text style={styles.headerTitle}>Platform Status</Text>
        </View>

        <View style={styles.overallCard}>
          <View style={styles.overallLeft}>
            <RingChart pct={avgSla} color={overallColor} size={80} />
            <Text style={[styles.overallPct, { color: overallColor }]}>{avgSla.toFixed(1)}%</Text>
          </View>
          <View style={styles.overallStats}>
            <View style={styles.overallStat}>
              <Text style={styles.overallStatValue}>{avgUptime.toFixed(2)}%</Text>
              <Text style={styles.overallStatLabel}>Avg Uptime</Text>
            </View>
            <View style={styles.overallRow}>
              <View style={styles.statusPill}>
                <View style={[styles.statusDot, { backgroundColor: LYTE_COLORS.neonGreen }]} />
                <Text style={styles.statusPillText}>{healthyCount} healthy</Text>
              </View>
              {degradedCount > 0 && (
                <View style={styles.statusPill}>
                  <View style={[styles.statusDot, { backgroundColor: LYTE_COLORS.high }]} />
                  <Text style={styles.statusPillText}>{degradedCount} degraded</Text>
                </View>
              )}
              {downCount > 0 && (
                <View style={styles.statusPill}>
                  <View style={[styles.statusDot, { backgroundColor: LYTE_COLORS.critical }]} />
                  <Text style={styles.statusPillText}>{downCount} down</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>ALL PLATFORMS</Text>
        <View style={styles.platformList}>
          {platforms.map(p => <PlatformCard key={p.slug} platform={p} />)}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { position: "absolute", top: 0, left: 0, right: 0 },
  scroll: { flex: 1 },
  header: { marginBottom: 20 },
  eyebrow: { fontSize: 9, fontFamily: "Inter_500Medium", letterSpacing: 3, color: LYTE_COLORS.neonGreen, marginBottom: 4 },
  headerTitle: { fontSize: 28, fontFamily: "Inter_600SemiBold", color: LYTE_COLORS.textPrimary },
  overallCard: { flexDirection: "row", gap: 16, alignItems: "center", backgroundColor: LYTE_COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: LYTE_COLORS.border, padding: 16, marginBottom: 24 },
  overallLeft: { position: "relative", alignItems: "center", justifyContent: "center" },
  overallPct: { position: "absolute", fontSize: 11, fontFamily: "Inter_600SemiBold" },
  overallStats: { flex: 1, gap: 10 },
  overallStat: {},
  overallStatValue: { fontSize: 22, fontFamily: "Inter_600SemiBold", color: LYTE_COLORS.textPrimary },
  overallStatLabel: { fontSize: 10, fontFamily: "Inter_400Regular", color: LYTE_COLORS.textSecondary },
  overallRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: LYTE_COLORS.surfaceElevated },
  statusPillText: { fontSize: 10, fontFamily: "Inter_400Regular", color: LYTE_COLORS.textSecondary },
  statusDot: { width: 6, height: 6, borderRadius: 3, shadowOffset: { width: 0, height: 0 } },
  sectionLabel: { fontSize: 9, fontFamily: "Inter_500Medium", letterSpacing: 3, color: LYTE_COLORS.textTertiary, marginBottom: 10 },
  platformList: { gap: 8 },
  platformCard: { backgroundColor: LYTE_COLORS.surface, borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  platformHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 10 },
  platformInfo: { flex: 1 },
  platformName: { fontSize: 13, fontFamily: "Inter_500Medium", color: LYTE_COLORS.textPrimary, marginBottom: 2 },
  platformStatus: { fontSize: 10, fontFamily: "Inter_400Regular" },
  platformMetrics: { alignItems: "flex-end" },
  metricValue: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: LYTE_COLORS.textPrimary },
  metricLabel: { fontSize: 9, fontFamily: "Inter_400Regular", color: LYTE_COLORS.textTertiary },
  ringWrap: { alignItems: "center", justifyContent: "center", position: "relative" },
  ringLabel: { position: "absolute", fontSize: 9, fontFamily: "Inter_600SemiBold" },
  platformDetail: { borderTopWidth: 1, borderTopColor: LYTE_COLORS.border, padding: 12 },
  detailRow: { flexDirection: "row", gap: 8 },
  detailItem: { flex: 1, alignItems: "center" },
  detailLabel: { fontSize: 8, fontFamily: "Inter_500Medium", color: LYTE_COLORS.textTertiary, letterSpacing: 1, marginBottom: 4 },
  detailValue: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
