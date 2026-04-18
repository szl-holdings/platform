import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Ionicons, Feather } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import Svg, { Circle, Polyline } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useApiStatus } from "@szl-holdings/mobile-shared";

import { apiGet } from "@/lib/apiClient";

type IonIconName = ComponentProps<typeof Ionicons>["name"];

interface Incident {
  id: number;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  status: string;
  assignedAnalyst?: string;
  attackTechnique?: string;
  detectedAt?: string;
}

interface Finding {
  id: number;
  severity: "critical" | "high" | "medium" | "low" | "info";
  status: "open" | "confirmed" | "mitigated" | "accepted" | "false_positive";
}

interface ThreatSummary {
  meanTimeToDetect?: string;
  meanTimeToRespond?: string;
  dailyCounts?: number[];
}

interface HardeningSummary {
  overallScore: number;
  total: number;
  implemented: number;
  partial: number;
  notImplemented: number;
  criticalGaps: number;
}

const MITRE_PHASES = [
  { phase: "Recon", icon: "eye-outline" as IonIconName, color: "#64748b", techniques: ["T1595", "T1589"] },
  { phase: "Weaponize", icon: "construct-outline" as IonIconName, color: "#7c3aed", techniques: ["T1587", "T1584"] },
  { phase: "Delivery", icon: "mail-outline" as IonIconName, color: "#2563eb", techniques: ["T1566", "T1534"] },
  { phase: "Exploit", icon: "flash-outline" as IonIconName, color: "#d97706", techniques: ["T1203", "T1190"] },
  { phase: "Install", icon: "download-outline" as IonIconName, color: "#f59e0b", techniques: ["T1548", "T1543"] },
  { phase: "C2", icon: "radio-outline" as IonIconName, color: "#dc2626", techniques: ["T1071", "T1573"] },
  { phase: "Actions", icon: "skull-outline" as IonIconName, color: "#ef4444", techniques: ["T1485", "T1486"] },
];

const TECHNIQUE_TO_PHASE: Record<string, number> = {
  T1595: 0, T1589: 0,
  T1587: 1, T1584: 1,
  T1566: 2, T1534: 2,
  T1203: 3, T1190: 3,
  T1548: 4, T1543: 4,
  T1071: 5, T1573: 5,
  T1485: 6, T1486: 6,
};

function techniqueToPhase(technique?: string | null): number {
  if (!technique) return -1;
  const id = technique.split(".")[0];
  return TECHNIQUE_TO_PHASE[id] ?? -1;
}

function MitreKillChain({ incident }: { incident?: Incident | null }) {
  const colors = useColors();
  const activePhaseIdx = techniqueToPhase(incident?.attackTechnique);

  return (
    <View style={[styles.mitreCard, { backgroundColor: colors.navyLight, borderColor: colors.border }]}>
      <View style={styles.mitreHeader}>
        <Text style={[styles.mitreTitle, { color: colors.foreground, fontFamily: "SpaceGrotesk_600SemiBold" }]}>
          MITRE ATT&CK Kill Chain
        </Text>
        {incident && (
          <View style={[styles.mitreTechniqueBadge, { backgroundColor: `${colors.amber}20`, borderColor: `${colors.amber}40` }]}>
            <Text style={[styles.mitreTechText, { color: colors.amber }]}>
              {incident.attackTechnique ?? "T1566"}
            </Text>
          </View>
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.mitreScroll}
      >
        {MITRE_PHASES.map((phase, i) => {
          const isActive = i === activePhaseIdx;
          const isPast = i < activePhaseIdx;
          const opacity = isPast ? 0.5 : isActive ? 1 : 0.35;
          return (
            <View key={phase.phase} style={styles.mitrePhaseWrap}>
              <View style={[
                styles.mitrePhaseCard,
                {
                  backgroundColor: isActive ? `${phase.color}18` : "transparent",
                  borderColor: isActive ? `${phase.color}60` : colors.border,
                  opacity,
                }
              ]}>
                <Ionicons name={phase.icon} size={18} color={phase.color} />
                <Text style={[styles.miterPhaseName, { color: isActive ? colors.foreground : colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                  {phase.phase}
                </Text>
                {phase.techniques.slice(0, 1).map(t => (
                  <Text key={t} style={[styles.mitreTech, { color: phase.color, fontFamily: "Inter_400Regular" }]}>{t}</Text>
                ))}
                {isActive && (
                  <View style={[styles.mitreActiveDot, { backgroundColor: phase.color }]} />
                )}
              </View>
              {i < MITRE_PHASES.length - 1 && (
                <View style={[styles.mitreArrow, { opacity: isPast || isActive ? 0.7 : 0.2 }]}>
                  <Feather name="chevron-right" size={12} color={colors.mutedForeground} />
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function SkeletonBlock({ width, height, style }: { width: number | `${number}%`; height: number; style?: object }) {
  const colors = useColors();
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 800 }), withTiming(0.4, { duration: 800 })),
      -1
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: 8, backgroundColor: colors.navyLight },
        animStyle,
        style,
      ]}
    />
  );
}

async function fetchIncidents(): Promise<Incident[]> {
  return apiGet<Incident[]>("/api/firestorm/incidents");
}

async function fetchFindings(): Promise<Finding[]> {
  return apiGet<Finding[]>("/api/firestorm/findings");
}

async function fetchThreatSummary(): Promise<ThreatSummary> {
  try {
    return await apiGet<ThreatSummary>("/api/firestorm/live/threat-summary");
  } catch (err) {
    console.warn("[Dashboard] Threat summary unavailable:", err);
    return {};
  }
}

async function fetchHardeningSummary(): Promise<HardeningSummary> {
  try {
    return await apiGet<HardeningSummary>("/api/firestorm/hardening-summary");
  } catch (err) {
    console.warn("[Dashboard] Hardening summary unavailable:", err);
    return { overallScore: 0, total: 0, implemented: 0, partial: 0, notImplemented: 0, criticalGaps: 0 };
  }
}

interface KPICardProps {
  label: string;
  value: string | number;
  subtext?: string;
  color: string;
  icon: IonIconName;
  alert?: boolean;
}

function KPICard({ label, value, subtext, color, icon, alert }: KPICardProps) {
  const colors = useColors();
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 14 });
    opacity.value = withTiming(1, { duration: 400 });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[animStyle, styles.kpiCard, { backgroundColor: colors.navyLight, borderColor: alert ? `${color}40` : colors.border }]}>
      <View style={[styles.kpiIconWrap, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.kpiValue, { color: alert ? color : colors.foreground, fontFamily: "SpaceGrotesk_700Bold" }]}>{value}</Text>
      <Text style={[styles.kpiLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{label}</Text>
      {subtext && <Text style={[styles.kpiSub, { color: `${color}99`, fontFamily: "Inter_400Regular" }]}>{subtext}</Text>}
    </Animated.View>
  );
}

interface SeverityRingProps {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

function SeverityRing({ critical, high, medium, low, total }: SeverityRingProps) {
  const colors = useColors();
  const size = 120;
  const cx = size / 2;
  const cy = size / 2;
  const r = 46;
  const stroke = 10;
  const circumference = 2 * Math.PI * r;

  const segments = [
    { value: critical, color: colors.red },
    { value: high, color: "#F97316" },
    { value: medium, color: "#F59E0B" },
    { value: low, color: colors.blue },
  ];

  let offset = 0;
  const arcs = segments.map((seg) => {
    const pct = total > 0 ? seg.value / total : 0;
    const dash = pct * circumference;
    const start = offset;
    offset += dash;
    return { ...seg, dash, start };
  });

  return (
    <View style={styles.ringContainer}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={cx} cy={cy} r={r} strokeWidth={stroke} stroke={colors.border} fill="none" />
        {arcs.map((arc, i) => (
          <Circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            strokeWidth={stroke}
            stroke={arc.color}
            fill="none"
            strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
            strokeDashoffset={-arc.start + circumference * 0.25}
            strokeLinecap="round"
            rotation={-90}
            origin={`${cx}, ${cy}`}
          />
        ))}
      </Svg>
      <View style={styles.ringCenter}>
        <Text style={[styles.ringTotal, { color: colors.foreground, fontFamily: "SpaceGrotesk_700Bold" }]}>{total}</Text>
        <Text style={[styles.ringLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>total</Text>
      </View>
    </View>
  );
}

interface TrendBarProps {
  label: string;
  count: number;
  max: number;
  color: string;
}

function TrendBar({ label, count, max, color }: TrendBarProps) {
  const colors = useColors();
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(max > 0 ? (count / max) * 100 : 0, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [count, max]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View style={styles.trendRow}>
      <Text style={[styles.trendLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{label}</Text>
      <View style={[styles.trendTrack, { backgroundColor: colors.border }]}>
        <Animated.View style={[styles.trendFill, barStyle, { backgroundColor: color }]} />
      </View>
      <Text style={[styles.trendCount, { color: colors.foreground, fontFamily: "SpaceGrotesk_600SemiBold" }]}>{count}</Text>
    </View>
  );
}

interface SparklineProps {
  data: number[];
  color: string;
  width: number;
  height: number;
}

function Sparkline({ data, color, width, height }: SparklineProps) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pad = 2;
  const w = width - pad * 2;
  const h = height - pad * 2;

  const points = data
    .map((v, i) => {
      const x = pad + (i / (data.length - 1)) * w;
      const y = pad + h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function generateDailyCounts(incidents: Incident[]): number[] {
  const days = 7;
  const counts = new Array(days).fill(0);
  const now = Date.now();
  const dayMs = 86400000;

  for (const inc of incidents) {
    if (!inc.detectedAt) continue;
    const age = now - new Date(inc.detectedAt).getTime();
    const dayIdx = Math.floor(age / dayMs);
    if (dayIdx >= 0 && dayIdx < days) {
      counts[days - 1 - dayIdx]++;
    }
  }
  return counts;
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { isOffline, isDegraded } = useApiStatus();
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  const { data: incidents = [], refetch: refetchIncidents, isLoading: incLoading } = useQuery<Incident[]>({
    queryKey: ["aegis-incidents"],
    queryFn: async () => {
      const result = await fetchIncidents();
      setLastRefreshedAt(new Date());
      return result;
    },
  });

  const { data: findings = [], refetch: refetchFindings, isLoading: findLoading } = useQuery<Finding[]>({
    queryKey: ["aegis-findings"],
    queryFn: fetchFindings,
  });

  const { data: threatSummary = {}, refetch: refetchSummary } = useQuery<ThreatSummary>({
    queryKey: ["aegis-threat-summary"],
    queryFn: fetchThreatSummary,
  });

  const { data: hardeningSummary, refetch: refetchHardening } = useQuery<HardeningSummary>({
    queryKey: ["aegis-hardening-summary"],
    queryFn: fetchHardeningSummary,
  });

  const isLoading = incLoading || findLoading;

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchIncidents(), refetchFindings(), refetchSummary(), refetchHardening()]);
    setRefreshing(false);
  };

  const activeIncidents = incidents.filter((i) => i.status !== "closed");
  const criticalCount = incidents.filter((i) => i.severity === "critical").length;
  const highCount = incidents.filter((i) => i.severity === "high").length;
  const mediumCount = incidents.filter((i) => i.severity === "medium").length;
  const lowCount = incidents.filter((i) => i.severity === "low").length;
  const openFindings = findings.filter((f) => f.status === "open" || f.status === "confirmed").length;
  const criticalFindings = findings.filter((f) => f.severity === "critical").length;
  const mttd = threatSummary?.meanTimeToDetect ?? "—";
  const mttr = threatSummary?.meanTimeToRespond ?? "—";
  const complianceScore = hardeningSummary?.overallScore ?? null;
  const complianceCriticalGaps = hardeningSummary?.criticalGaps ?? 0;
  const totalIncidents = incidents.length;

  const maxSev = Math.max(criticalCount, highCount, mediumCount, lowCount, 1);

  const dailyCounts = threatSummary?.dailyCounts ?? generateDailyCounts(incidents);
  const sparklineMax = Math.max(...dailyCounts, 1);
  const dayLabels = ["6d", "5d", "4d", "3d", "2d", "1d", "Today"];

  const topInsets = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomInsets = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {(isOffline || isDegraded) && (
        <View style={{ backgroundColor: isOffline ? "#7f1d1d" : "#78350f", paddingHorizontal: 16, paddingVertical: 8 }}>
          <Text style={{ color: "#fca5a5", fontSize: 11, fontWeight: "600" }}>
            {isOffline ? "Offline — threat data may be stale" : "Connection degraded — retrying…"}
          </Text>
        </View>
      )}
      <View style={[styles.header, { paddingTop: topInsets + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerEyebrow, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
            AEGIS SOC
          </Text>
          <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "SpaceGrotesk_700Bold" }]}>
            Threat Dashboard
          </Text>
        </View>
        <View style={{ alignItems: "flex-end", gap: 4 }}>
          <View style={[styles.statusDot, { backgroundColor: colors.emeraldDim, borderColor: colors.emerald }]}>
            <View style={[styles.statusPulse, { backgroundColor: colors.emerald }]} />
            <Text style={[styles.statusText, { color: colors.emerald, fontFamily: "Inter_500Medium" }]}>LIVE</Text>
          </View>
          {!isLoading && (
            <Text style={{ fontSize: 9, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>
              {(() => {
                const ms = Date.now() - lastRefreshedAt.getTime();
                if (ms < 60000) return "Just now";
                if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
                return `${Math.floor(ms / 3600000)}h ago`;
              })()}
            </Text>
          )}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: bottomInsets + 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.amber} />
        }
      >
        {isLoading ? (
          <View style={styles.section}>
            <View style={{ gap: 12 }}>
              <View style={styles.kpiGrid}>
                {[1, 2, 3, 4].map(i => <SkeletonBlock key={i} width="47%" height={90} />)}
              </View>
              <SkeletonBlock width="100%" height={120} />
              <SkeletonBlock width="100%" height={80} />
            </View>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                KEY METRICS
              </Text>
              <View style={styles.kpiGrid}>
                <KPICard
                  label="Active Incidents"
                  value={activeIncidents.length}
                  color={activeIncidents.length > 0 ? colors.red : colors.emerald}
                  icon={activeIncidents.length > 0 ? "warning" : "shield-checkmark"}
                  alert={criticalCount > 0}
                  subtext={criticalCount > 0 ? `${criticalCount} critical` : undefined}
                />
                <KPICard
                  label="Open Findings"
                  value={openFindings}
                  color={openFindings > 0 ? colors.amber : colors.emerald}
                  icon="bug"
                  subtext={criticalFindings > 0 ? `${criticalFindings} critical` : undefined}
                />
                <KPICard
                  label="MTTD"
                  value={mttd}
                  color={colors.blue}
                  icon="time-outline"
                  subtext="mean detect"
                />
                <KPICard
                  label="MTTR"
                  value={mttr}
                  color={colors.amber}
                  icon="refresh-circle-outline"
                  subtext="mean respond"
                />
                <KPICard
                  label="Compliance"
                  value={complianceScore !== null ? `${complianceScore}%` : "—"}
                  color={
                    complianceScore === null ? colors.mutedForeground
                    : complianceScore >= 80 ? colors.emerald
                    : complianceScore >= 60 ? colors.amber
                    : colors.red
                  }
                  icon="shield-checkmark-outline"
                  alert={complianceCriticalGaps > 0}
                  subtext={complianceCriticalGaps > 0 ? `${complianceCriticalGaps} critical gaps` : "hardening score"}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                7-DAY INCIDENT TREND
              </Text>
              <View style={[styles.sparkCard, { backgroundColor: colors.navyLight, borderColor: colors.border }]}>
                <View style={styles.sparkHeader}>
                  <Text style={[styles.sparkTitle, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                    Incidents per day
                  </Text>
                  <Text style={[styles.sparkTotal, { color: colors.amber, fontFamily: "SpaceGrotesk_600SemiBold" }]}>
                    {dailyCounts.reduce((a, b) => a + b, 0)} this week
                  </Text>
                </View>
                <Sparkline
                  data={dailyCounts}
                  color={colors.amber}
                  width={280}
                  height={60}
                />
                <View style={styles.sparkLabels}>
                  {dayLabels.map((label, i) => (
                    <Text key={label} style={[styles.sparkDayLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      {label}
                    </Text>
                  ))}
                </View>
                <View style={styles.sparkBars}>
                  {dailyCounts.map((count, i) => (
                    <View key={i} style={styles.sparkBarWrap}>
                      <View style={[styles.sparkBarFill, {
                        height: sparklineMax > 0 ? Math.max(4, (count / sparklineMax) * 40) : 4,
                        backgroundColor: count > 0 ? (i === dailyCounts.length - 1 ? colors.amber : `${colors.amber}60`) : colors.border,
                      }]} />
                      <Text style={[styles.sparkBarCount, { color: count > 0 ? colors.foreground : colors.mutedForeground, fontFamily: "SpaceGrotesk_600SemiBold" }]}>
                        {count}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <MitreKillChain incident={incidents?.[0]} />
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                SEVERITY DISTRIBUTION
              </Text>
              <View style={[styles.distCard, { backgroundColor: colors.navyLight, borderColor: colors.border }]}>
                <SeverityRing
                  critical={criticalCount}
                  high={highCount}
                  medium={mediumCount}
                  low={lowCount}
                  total={totalIncidents}
                />
                <View style={styles.distLegend}>
                  <TrendBar label="Critical" count={criticalCount} max={maxSev} color={colors.red} />
                  <TrendBar label="High" count={highCount} max={maxSev} color="#F97316" />
                  <TrendBar label="Medium" count={mediumCount} max={maxSev} color="#F59E0B" />
                  <TrendBar label="Low" count={lowCount} max={maxSev} color={colors.blue} />
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                RECENT INCIDENTS
              </Text>
              {incidents.slice(0, 5).map((incident) => (
                <View key={incident.id} style={[styles.incidentRow, { backgroundColor: colors.navyLight, borderColor: incident.severity === "critical" ? colors.redBorder : colors.border }]}>
                  <View style={[styles.severityDot, { backgroundColor: incident.severity === "critical" ? colors.red : incident.severity === "high" ? "#F97316" : incident.severity === "medium" ? "#F59E0B" : colors.blue }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.incTitle, { color: colors.foreground, fontFamily: "Inter_500Medium" }]} numberOfLines={1}>
                      {incident.title}
                    </Text>
                    <Text style={[styles.incMeta, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      {incident.status} · {incident.severity}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
                </View>
              ))}
              {incidents.length === 0 && (
                <View style={[styles.emptyRow, { borderColor: colors.border }]}>
                  <Ionicons name="shield-checkmark" size={24} color={colors.emerald} />
                  <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    No active incidents
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <View style={[styles.complianceCard, { backgroundColor: colors.navyLight, borderColor: colors.border }]}>
                <View style={styles.complianceHeader}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.emerald} />
                  <Text style={[styles.complianceTitle, { color: colors.foreground, fontFamily: "SpaceGrotesk_600SemiBold" }]}>
                    Compliance Overview
                  </Text>
                </View>
                {[
                  { name: "SOC 2", pct: 78, color: colors.emerald },
                  { name: "ISO 27001", pct: 65, color: colors.blue },
                  { name: "NIST CSF", pct: 82, color: colors.amber },
                ].map((fw) => (
                  <View key={fw.name} style={styles.fwRow}>
                    <Text style={[styles.fwName, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      {fw.name}
                    </Text>
                    <View style={[styles.fwTrack, { backgroundColor: colors.border }]}>
                      <View style={[styles.fwFill, { width: `${fw.pct}%` as `${number}%`, backgroundColor: fw.color }]} />
                    </View>
                    <Text style={[styles.fwPct, { color: fw.color, fontFamily: "SpaceGrotesk_600SemiBold" }]}>
                      {fw.pct}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerEyebrow: { fontSize: 10, letterSpacing: 2, textTransform: "uppercase", marginBottom: 2 },
  headerTitle: { fontSize: 22 },
  statusDot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusPulse: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: "600", letterSpacing: 1 },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionLabel: { fontSize: 10, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  kpiCard: {
    width: "47%",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  kpiIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  kpiValue: { fontSize: 26, lineHeight: 30 },
  kpiLabel: { fontSize: 11, marginTop: 2 },
  kpiSub: { fontSize: 10, marginTop: 4 },
  sparkCard: { padding: 16, borderRadius: 12, borderWidth: 1 },
  sparkHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sparkTitle: { fontSize: 13 },
  sparkTotal: { fontSize: 13 },
  sparkLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  sparkDayLabel: { fontSize: 9, flex: 1, textAlign: "center" },
  sparkBars: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 4 },
  sparkBarWrap: { flex: 1, alignItems: "center", gap: 2 },
  sparkBarFill: { width: "70%", borderRadius: 2, minHeight: 4 },
  sparkBarCount: { fontSize: 9 },
  distCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
  },
  ringContainer: { position: "relative", alignItems: "center", justifyContent: "center" },
  ringCenter: { position: "absolute", alignItems: "center" },
  ringTotal: { fontSize: 22, lineHeight: 26 },
  ringLabel: { fontSize: 10 },
  distLegend: { flex: 1, gap: 8 },
  trendRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  trendLabel: { fontSize: 11, width: 52 },
  trendTrack: { flex: 1, height: 4, borderRadius: 2, overflow: "hidden" },
  trendFill: { height: "100%", borderRadius: 2 },
  trendCount: { fontSize: 12, width: 24, textAlign: "right" },
  loadingWrap: { flex: 1, paddingTop: 80, alignItems: "center" },
  incidentRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    gap: 10,
  },
  severityDot: { width: 8, height: 8, borderRadius: 4 },
  incTitle: { fontSize: 13 },
  incMeta: { fontSize: 11, marginTop: 2, textTransform: "capitalize" },
  emptyRow: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: 8,
  },
  emptyText: { fontSize: 13 },
  complianceCard: { padding: 16, borderRadius: 12, borderWidth: 1 },
  complianceHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  complianceTitle: { fontSize: 14 },
  fwRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  fwName: { fontSize: 11, width: 64 },
  fwTrack: { flex: 1, height: 4, borderRadius: 2, overflow: "hidden" },
  fwFill: { height: "100%", borderRadius: 2 },
  fwPct: { fontSize: 12, width: 34, textAlign: "right" },
  mitreCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 0 },
  mitreHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  mitreTitle: { fontSize: 13 },
  mitreTechniqueBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  mitreTechText: { fontSize: 10, fontFamily: "Inter_500Medium", letterSpacing: 0.5 },
  mitreScroll: { gap: 4, paddingBottom: 4 },
  mitrePhaseWrap: { flexDirection: "row", alignItems: "center" },
  mitrePhaseCard: { width: 70, padding: 8, borderRadius: 10, borderWidth: 1, alignItems: "center", gap: 4 },
  miterPhaseName: { fontSize: 9, textAlign: "center", letterSpacing: 0.5 },
  mitreTech: { fontSize: 8, letterSpacing: 0.3 },
  mitreActiveDot: { width: 5, height: 5, borderRadius: 3, marginTop: 2 },
  mitreArrow: { paddingHorizontal: 2 },
});
