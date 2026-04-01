import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Pressable,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { apiFetch } from "@/lib/apiClient";

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

interface EcosystemHealth {
  checkedAt: string;
  summary: { total: number; online: number; degraded: number };
  platforms: Array<{
    key: string;
    name: string;
    role: string;
    status: "online" | "degraded";
    latencyMs: number;
    checkedAt: string;
  }>;
}

interface KPIs {
  checkedAt: string;
  aggregate: {
    totalWorkflowRuns: number;
    activeIncidents: number;
    distressProperties: number;
    fleetVessels: number;
    activeDeals: number;
    securityFindings: number;
  };
}

function useEcosystemHealth() {
  return useQuery<EcosystemHealth>({
    queryKey: ["szl-ecosystem-health"],
    queryFn: () => apiFetch<EcosystemHealth>("/api/holdings/ecosystem-health"),
    refetchInterval: 30000,
    retry: 2,
  });
}

function useAlerts() {
  return useQuery<Alert[]>({
    queryKey: ["szl-alerts"],
    queryFn: () => apiFetch<Alert[]>("/api/holdings/alerts"),
    refetchInterval: 30000,
    retry: 1,
    placeholderData: DEMO_ALERTS,
  });
}

function useKPIs() {
  return useQuery<KPIs>({
    queryKey: ["szl-kpis"],
    queryFn: () => apiFetch<KPIs>("/api/holdings/kpis"),
    refetchInterval: 60000,
    retry: 1,
  });
}

const PLATFORM_COLORS: Record<string, string> = {
  aegis: "#6366f1",
  terra: "#4d7c0f",
  vessels: "#3b82f6",
  lyte: "#f59e0b",
  alloy: "#8b5cf6",
  carlotaJo: "#f472b6",
};

const DEMO_ALERTS: Alert[] = [
  {
    id: "1",
    severity: "critical",
    platform: "Aegis",
    message: "Threat feed ingestion latency exceeding SLA threshold",
    time: new Date(Date.now() - 8 * 60000).toISOString(),
  },
  {
    id: "2",
    severity: "warning",
    platform: "Vessels",
    message: "AIS provider response time degraded — failover active",
    time: new Date(Date.now() - 22 * 60000).toISOString(),
  },
  {
    id: "3",
    severity: "info",
    platform: "Alloy",
    message: "Workflow run #1042 requires principal approval",
    time: new Date(Date.now() - 35 * 60000).toISOString(),
  },
  {
    id: "4",
    severity: "resolved",
    platform: "Lyte",
    message: "Signal pipeline latency normalized — all checks passing",
    time: new Date(Date.now() - 60 * 60000).toISOString(),
  },
];

interface Alert {
  id: string;
  severity: "critical" | "warning" | "info" | "resolved";
  platform: string;
  message: string;
  time: string;
}

const SEVERITY_CONFIG: Record<Alert["severity"], { color: string; icon: FeatherIconName; label: string }> = {
  critical: { color: "#ef4444", icon: "alert-octagon", label: "Critical" },
  warning: { color: "#f59e0b", icon: "alert-triangle", label: "Warning" },
  info: { color: "#3b82f6", icon: "info", label: "Info" },
  resolved: { color: "#10b981", icon: "check-circle", label: "Resolved" },
};

function AlertRow({ alert }: { alert: Alert }) {
  const colors = useColors();
  const cfg = SEVERITY_CONFIG[alert.severity];
  const ms = Date.now() - new Date(alert.time).getTime();
  const relTime =
    ms < 60000
      ? "just now"
      : ms < 3600000
      ? `${Math.floor(ms / 60000)}m ago`
      : `${Math.floor(ms / 3600000)}h ago`;

  return (
    <View style={[styles.alertRow, { borderColor: colors.borderSubtle }]}>
      <View style={[styles.alertIcon, { backgroundColor: `${cfg.color}12` }]}>
        <Feather name={cfg.icon} size={13} color={cfg.color} />
      </View>
      <View style={styles.alertContent}>
        <View style={styles.alertTopRow}>
          <Text style={[styles.alertPlatform, { color: colors.cream }]}>
            {alert.platform}
          </Text>
          <Text style={[styles.alertTime, { color: colors.mutedForeground }]}>
            {relTime}
          </Text>
        </View>
        <Text style={[styles.alertMessage, { color: colors.mutedForeground }]} numberOfLines={2}>
          {alert.message}
        </Text>
      </View>
    </View>
  );
}

function PlatformStatusCard({
  platform,
}: {
  platform: EcosystemHealth["platforms"][0];
}) {
  const colors = useColors();
  const isOnline = platform.status === "online";

  return (
    <View
      style={[
        styles.platformCard,
        {
          backgroundColor: colors.card,
          borderColor: isOnline ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
        },
      ]}
    >
      <View style={styles.platformCardTop}>
        <View style={[styles.platformDot, { backgroundColor: isOnline ? "#10b981" : "#ef4444" }]} />
        <Text style={[styles.platformName, { color: colors.cream }]}>{platform.name}</Text>
      </View>
      <Text style={[styles.platformRole, { color: colors.mutedForeground }]}>{platform.role}</Text>
      <Text style={[styles.platformLatency, { color: isOnline ? "#10b981" : "#ef4444" }]}>
        {isOnline ? `${platform.latencyMs}ms` : "Degraded"}
      </Text>
    </View>
  );
}

function KpiRow({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: FeatherIconName;
  color: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.kpiRow, { borderColor: colors.borderSubtle }]}>
      <View style={[styles.kpiIcon, { backgroundColor: `${color}18` }]}>
        <Feather name={icon} size={14} color={color} />
      </View>
      <Text style={[styles.kpiLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.kpiValue, { color: colors.cream }]}>{value}</Text>
    </View>
  );
}

export default function CommandScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: health,
    isLoading: healthLoading,
    refetch: refetchHealth,
  } = useEcosystemHealth();
  const { data: kpis, isLoading: kpisLoading, refetch: refetchKpis } = useKPIs();
  const { data: alerts = DEMO_ALERTS, refetch: refetchAlerts } = useAlerts();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : 90;

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await Promise.all([refetchHealth(), refetchKpis(), refetchAlerts()]);
    setRefreshing(false);
  }, [refetchHealth, refetchKpis, refetchAlerts]);

  const allOnline = health
    ? health.summary.online === health.summary.total
    : null;

  const criticalAlertCount = alerts.filter(
    (a) => a.severity === "critical" || a.severity === "warning"
  ).length;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["rgba(201,168,76,0.06)", "transparent"]}
        style={[styles.headerGradient, { height: topPad + 140 }]}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topPad + 16, paddingBottom: bottomPad },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.gold}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.goldSubtle }]}>
              COMMAND CENTER
            </Text>
            <Text style={[styles.greeting, { color: colors.cream }]}>
              {greeting}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  allOnline === null
                    ? "rgba(240,238,255,0.04)"
                    : allOnline
                    ? "rgba(16,185,129,0.08)"
                    : "rgba(239,68,68,0.08)",
                borderColor:
                  allOnline === null
                    ? "rgba(240,238,255,0.08)"
                    : allOnline
                    ? "rgba(16,185,129,0.2)"
                    : "rgba(239,68,68,0.2)",
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    allOnline === null
                      ? colors.mutedForeground
                      : allOnline
                      ? "#10b981"
                      : "#ef4444",
                },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                {
                  color:
                    allOnline === null
                      ? colors.mutedForeground
                      : allOnline
                      ? "#10b981"
                      : "#ef4444",
                },
              ]}
            >
              {allOnline === null
                ? "Checking…"
                : allOnline
                ? "All Systems"
                : `${health?.summary.degraded} Degraded`}
            </Text>
          </View>
        </View>

        <View style={[styles.section, { borderTopColor: colors.borderSubtle }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: colors.goldSubtle }]}>
              CRITICAL ALERTS
            </Text>
            {criticalAlertCount > 0 && (
              <View style={[styles.alertCountBadge, { backgroundColor: "rgba(239,68,68,0.12)", borderColor: "rgba(239,68,68,0.2)" }]}>
                <Text style={[styles.alertCountText, { color: "#ef4444" }]}>
                  {criticalAlertCount} active
                </Text>
              </View>
            )}
          </View>
          <View style={[styles.alertList, { borderColor: colors.borderSubtle }]}>
            {alerts.map((alert) => (
              <AlertRow key={alert.id} alert={alert} />
            ))}
          </View>
        </View>

        <View style={[styles.section, { borderTopColor: colors.borderSubtle }]}>
          <Text style={[styles.sectionLabel, { color: colors.goldSubtle }]}>
            ECOSYSTEM HEALTH
          </Text>
          {healthLoading ? (
            <View style={styles.platformGrid}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <SkeletonLoader key={i} width="48%" height={80} borderRadius={8} />
              ))}
            </View>
          ) : (
            <View style={styles.platformGrid}>
              {(health?.platforms ?? []).map((p) => (
                <PlatformStatusCard key={p.key} platform={p} />
              ))}
            </View>
          )}
        </View>

        <View style={[styles.section, { borderTopColor: colors.borderSubtle }]}>
          <Text style={[styles.sectionLabel, { color: colors.goldSubtle }]}>
            AGGREGATE KPIs
          </Text>
          {kpisLoading ? (
            <View style={{ gap: 8 }}>
              {[1, 2, 3, 4].map((i) => (
                <SkeletonLoader key={i} width="100%" height={44} borderRadius={8} />
              ))}
            </View>
          ) : kpis ? (
            <View style={[styles.kpiList, { borderColor: colors.borderSubtle }]}>
              <KpiRow label="Workflow Runs" value={kpis.aggregate.totalWorkflowRuns} icon="git-merge" color={colors.violet} />
              <KpiRow label="Active Incidents" value={kpis.aggregate.activeIncidents} icon="alert-triangle" color={colors.amber} />
              <KpiRow label="Distress Properties" value={kpis.aggregate.distressProperties} icon="home" color="#4d7c0f" />
              <KpiRow label="Fleet Vessels" value={kpis.aggregate.fleetVessels} icon="anchor" color={colors.blue} />
              <KpiRow label="Active Deals" value={kpis.aggregate.activeDeals} icon="briefcase" color={colors.green} />
              <KpiRow label="Security Findings" value={kpis.aggregate.securityFindings} icon="shield" color={colors.red} />
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              KPIs unavailable. Pull to refresh.
            </Text>
          )}
        </View>

        {health && (
          <View style={[styles.section, { borderTopColor: colors.borderSubtle }]}>
            <Text style={[styles.sectionLabel, { color: colors.goldSubtle }]}>
              PORTFOLIO SUMMARY
            </Text>
            <View style={styles.summaryGrid}>
              {[
                { label: "Portfolio ARR", value: "$35M+", color: colors.gold },
                { label: "Platforms Live", value: `${health.summary.online}/${health.summary.total}`, color: "#10b981" },
                { label: "Continents Active", value: "3", color: colors.blue },
                { label: "Daily AI Inferences", value: "18M+", color: colors.violet },
              ].map((item) => (
                <View
                  key={item.label}
                  style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.borderSubtle }]}
                >
                  <Text style={[styles.summaryValue, { color: item.color }]}>{item.value}</Text>
                  <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.lastChecked}>
          <Feather name="refresh-cw" size={10} color={colors.mutedForeground} />
          <Text style={[styles.lastCheckedText, { color: colors.mutedForeground }]}>
            {health
              ? `Updated ${new Date(health.checkedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
              : "Pull to refresh"}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { position: "absolute", top: 0, left: 0, right: 0 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  eyebrow: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    letterSpacing: 3,
    marginBottom: 6,
  },
  greeting: {
    fontSize: 24,
    fontFamily: "Inter_300Light",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
  section: {
    borderTopWidth: 1,
    paddingTop: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    letterSpacing: 3,
  },
  alertCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  alertCountText: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
  },
  alertList: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  alertRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    gap: 10,
    borderBottomWidth: 1,
  },
  alertIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  alertContent: { flex: 1, gap: 3 },
  alertTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  alertPlatform: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  alertTime: {
    fontSize: 9,
    fontFamily: "Inter_300Light",
  },
  alertMessage: {
    fontSize: 11,
    fontFamily: "Inter_300Light",
    lineHeight: 16,
  },
  platformGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  platformCard: {
    width: "48%",
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  platformCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  platformDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  platformName: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  platformRole: {
    fontSize: 9,
    fontFamily: "Inter_300Light",
    letterSpacing: 0.3,
  },
  platformLatency: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    fontVariant: ["tabular-nums"],
  },
  kpiList: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  kpiRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
  },
  kpiIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  kpiLabel: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_300Light",
  },
  kpiValue: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    fontVariant: ["tabular-nums"],
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  summaryCard: {
    width: "48%",
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontFamily: "Inter_500Medium",
  },
  summaryLabel: {
    fontSize: 10,
    fontFamily: "Inter_300Light",
  },
  emptyText: {
    fontSize: 12,
    fontFamily: "Inter_300Light",
    textAlign: "center",
    paddingVertical: 20,
  },
  lastChecked: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingBottom: 8,
  },
  lastCheckedText: {
    fontSize: 10,
    fontFamily: "Inter_300Light",
  },
});
