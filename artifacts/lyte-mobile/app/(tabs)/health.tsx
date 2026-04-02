import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useState, useEffect, useRef } from "react";
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
} from "react-native";
import Svg, { Circle, Polyline } from "react-native-svg";
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

const ON_CALL_SCHEDULE = [
  { name: "Alex Kim", role: "Platform Lead", shift: "Apr 2 — Apr 7", color: LYTE_COLORS.electricBlue, initials: "AK", primary: true },
  { name: "Jordan Lee", role: "Infra On-Call", shift: "Apr 2 — Apr 4", color: LYTE_COLORS.neonGreen, initials: "JL", primary: false },
  { name: "Sam Rivera", role: "Security On-Call", shift: "Apr 2 — Apr 9", color: LYTE_COLORS.high, initials: "SR", primary: false },
];

const RUNBOOKS = [
  { id: "rb-001", title: "P0 Incident Response", category: "Incident", steps: 7 },
  { id: "rb-002", title: "Database Failover Procedure", category: "Infra", steps: 12 },
  { id: "rb-003", title: "CDN Purge & Rollback", category: "Platform", steps: 5 },
];

function OnCallCard() {
  const [runbookExpanded, setRunbookExpanded] = useState(false);
  const [pagedPersons, setPagedPersons] = useState<Set<string>>(new Set());
  const [activeRunbook, setActiveRunbook] = useState<string | null>(null);
  const [completedRunbooks, setCompletedRunbooks] = useState<Set<string>>(new Set());

  const handlePage = (person: typeof ON_CALL_SCHEDULE[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Page On-Call Engineer",
      `Send urgent page to ${person.name} (${person.role})?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Page Now",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setPagedPersons(prev => new Set([...prev, person.name]));
          },
        },
      ],
    );
  };

  const handleRunbook = (rb: typeof RUNBOOKS[0]) => {
    if (completedRunbooks.has(rb.id)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Launch Runbook",
      `Execute "${rb.title}"?\n${rb.steps} steps will be tracked in real time.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Launch",
          onPress: () => {
            setActiveRunbook(rb.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setTimeout(() => {
              setActiveRunbook(null);
              setCompletedRunbooks(prev => new Set([...prev, rb.id]));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }, 3000);
          },
        },
      ],
    );
  };

  return (
    <View style={[onCallStyles.card, { backgroundColor: LYTE_COLORS.surface, borderColor: LYTE_COLORS.border }]}>
      <View style={onCallStyles.header}>
        <View style={[onCallStyles.dot, { backgroundColor: LYTE_COLORS.neonGreen }]} />
        <Text style={onCallStyles.title}>On-Call Now</Text>
        <Text style={onCallStyles.shift}>Apr 2–7</Text>
      </View>

      {ON_CALL_SCHEDULE.map((person) => {
        const paged = pagedPersons.has(person.name);
        return (
          <View key={person.name} style={[onCallStyles.personRow, { borderColor: LYTE_COLORS.border }]}>
            <View style={[onCallStyles.avatar, { backgroundColor: `${person.color}18`, borderColor: `${person.color}30` }]}>
              <Text style={[onCallStyles.avatarText, { color: person.color }]}>{person.initials}</Text>
            </View>
            <View style={onCallStyles.personInfo}>
              <Text style={onCallStyles.personName}>{person.name}</Text>
              <Text style={onCallStyles.personRole}>{person.role}</Text>
            </View>
            {person.primary && !paged && (
              <View style={[onCallStyles.primaryBadge, { backgroundColor: `${LYTE_COLORS.electricBlue}15`, borderColor: `${LYTE_COLORS.electricBlue}30` }]}>
                <Text style={[onCallStyles.primaryText, { color: LYTE_COLORS.electricBlue }]}>PRIMARY</Text>
              </View>
            )}
            {paged && (
              <View style={[onCallStyles.primaryBadge, { backgroundColor: `${LYTE_COLORS.neonGreen}15`, borderColor: `${LYTE_COLORS.neonGreen}30` }]}>
                <Text style={[onCallStyles.primaryText, { color: LYTE_COLORS.neonGreen }]}>PAGED</Text>
              </View>
            )}
            <Pressable
              onPress={() => handlePage(person)}
              disabled={paged}
              style={[onCallStyles.pageBtn, { borderColor: paged ? `${LYTE_COLORS.neonGreen}40` : `${person.color}40`, opacity: paged ? 0.5 : 1 }]}
            >
              <Feather name={paged ? "check" : "phone"} size={11} color={paged ? LYTE_COLORS.neonGreen : person.color} />
            </Pressable>
          </View>
        );
      })}

      <Pressable
        onPress={() => { Haptics.selectionAsync(); setRunbookExpanded(e => !e); }}
        style={onCallStyles.runbookToggle}
      >
        <Feather name="book-open" size={11} color={LYTE_COLORS.textSecondary} />
        <Text style={onCallStyles.runbookToggleText}>Quick Runbooks ({RUNBOOKS.length})</Text>
        <Feather name={runbookExpanded ? "chevron-up" : "chevron-down"} size={11} color={LYTE_COLORS.textTertiary} />
      </Pressable>

      {runbookExpanded && (
        <View style={onCallStyles.runbooks}>
          {RUNBOOKS.map((rb) => {
            const isActive = activeRunbook === rb.id;
            const isDone = completedRunbooks.has(rb.id);
            return (
              <Pressable
                key={rb.id}
                onPress={() => handleRunbook(rb)}
                disabled={isActive || isDone}
                style={[onCallStyles.runbookRow, { borderColor: LYTE_COLORS.border, opacity: isActive ? 0.7 : 1 }]}
              >
                <View style={[onCallStyles.runbookIcon, { backgroundColor: isDone ? `${LYTE_COLORS.neonGreen}10` : `${LYTE_COLORS.electricBlue}10` }]}>
                  <Feather
                    name={isDone ? "check-circle" : isActive ? "loader" : "zap"}
                    size={10}
                    color={isDone ? LYTE_COLORS.neonGreen : LYTE_COLORS.electricBlue}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={onCallStyles.runbookTitle}>{rb.title}</Text>
                  <Text style={onCallStyles.runbookMeta}>
                    {rb.category} · {rb.steps} steps{isActive ? " · Running…" : isDone ? " · Completed" : ""}
                  </Text>
                </View>
                {!isDone && !isActive && <Feather name="chevron-right" size={12} color={LYTE_COLORS.textTertiary} />}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const onCallStyles = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, shadowColor: LYTE_COLORS.neonGreen, shadowOpacity: 0.8, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } },
  title: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: LYTE_COLORS.textPrimary, flex: 1 },
  shift: { fontSize: 10, fontFamily: "Inter_400Regular", color: LYTE_COLORS.textTertiary },
  personRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderTopWidth: 1 },
  avatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  personInfo: { flex: 1 },
  personName: { fontSize: 12, fontFamily: "Inter_500Medium", color: LYTE_COLORS.textPrimary },
  personRole: { fontSize: 10, fontFamily: "Inter_400Regular", color: LYTE_COLORS.textSecondary },
  primaryBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  primaryText: { fontSize: 8, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  pageBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  runbookToggle: { flexDirection: "row", alignItems: "center", gap: 6, paddingTop: 10, marginTop: 2 },
  runbookToggleText: { flex: 1, fontSize: 10, fontFamily: "Inter_500Medium", color: LYTE_COLORS.textSecondary },
  runbooks: { marginTop: 8, gap: 6 },
  runbookRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 8, borderWidth: 1, backgroundColor: LYTE_COLORS.surfaceElevated },
  runbookIcon: { width: 24, height: 24, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  runbookTitle: { fontSize: 11, fontFamily: "Inter_500Medium", color: LYTE_COLORS.textPrimary },
  runbookMeta: { fontSize: 9, fontFamily: "Inter_400Regular", color: LYTE_COLORS.textTertiary },
});

function MetricSparkline({ data, color, width = 60, height = 24 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 0.001);
  const min = Math.min(...data, 0);
  const range = max - min || 0.001;
  const pad = 2;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * w;
    const y = pad + h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");
  return (
    <Svg width={width} height={height}>
      <Polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function generateSparkline(base: number, length = 12, variance = 0.05): number[] {
  const result: number[] = [];
  let val = base;
  for (let i = 0; i < length; i++) {
    val = Math.max(0, Math.min(100, val + (Math.random() - 0.5) * variance * 100));
    result.push(val);
  }
  return result;
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
  const uptimeSparkline = useRef(generateSparkline(platform.uptime, 12, 0.02)).current;
  const latencySparkline = useRef(generateSparkline(Math.min(100, (platform.p95Latency / 500) * 100), 12, 0.08)).current;
  const errSparkline = useRef(generateSparkline(Math.min(100, platform.errorRate * 10), 12, 0.1)).current;

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
            <View style={styles.sparklineRow}>
              <View style={styles.sparklineItem}>
                <Text style={styles.sparklineLabel}>UPTIME 12H</Text>
                <MetricSparkline data={uptimeSparkline} color={LYTE_COLORS.neonGreen} width={72} height={24} />
              </View>
              <View style={styles.sparklineItem}>
                <Text style={styles.sparklineLabel}>LATENCY 12H</Text>
                <MetricSparkline data={latencySparkline} color={platform.p95Latency > 400 ? LYTE_COLORS.high : LYTE_COLORS.electricBlue} width={72} height={24} />
              </View>
              <View style={styles.sparklineItem}>
                <Text style={styles.sparklineLabel}>ERROR RATE 12H</Text>
                <MetricSparkline data={errSparkline} color={platform.errorRate > 1 ? LYTE_COLORS.critical : `${LYTE_COLORS.neonGreen}80`} width={72} height={24} />
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

        <Text style={styles.sectionLabel}>ON-CALL SCHEDULE</Text>
        <OnCallCard />

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
  sparklineRow: { flexDirection: "row", gap: 8, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: LYTE_COLORS.border },
  sparklineItem: { flex: 1, alignItems: "center", gap: 4 },
  sparklineLabel: { fontSize: 7, fontFamily: "Inter_500Medium", color: LYTE_COLORS.textTertiary, letterSpacing: 0.8 },
});
