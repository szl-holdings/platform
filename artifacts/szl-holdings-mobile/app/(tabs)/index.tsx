import React, { useCallback, useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Pressable,
  Platform,
  Alert,
  Animated as RNAnimated,
  PanResponder,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useApiStatus } from "@/hooks/useApiStatus";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { apiFetch } from "@/lib/apiClient";
import { VoiceCommandOverlay } from "@/components/VoiceCommandOverlay";
import { CommandPalette, type CommandItem } from "@/components/CommandPalette";
import { useShakeGesture } from "@/hooks/useShakeGesture";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useRouter, type Href } from "expo-router";

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
  return useQuery<HoldingAlert[]>({
    queryKey: ["szl-alerts"],
    queryFn: async () => {
      const raw = await apiFetch<unknown>("/api/observability/alerts");
      const arr = Array.isArray(raw) ? raw : ((raw as { data?: HoldingAlert[] })?.data ?? []);
      return arr as HoldingAlert[];
    },
    refetchInterval: 30000,
    retry: 1,
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

function usePendingApprovals() {
  return useQuery<PendingApproval[]>({
    queryKey: ["szl-pending-approvals"],
    queryFn: async () => {
      const raw = await apiFetch<unknown>("/api/approvals?status=pending");
      const arr = Array.isArray(raw) ? raw : ((raw as { data?: unknown[] })?.data ?? []);
      return (arr as Array<{
        id?: number | string; title?: string; actionClass?: string;
        requestedFrom?: string; status?: string; createdAt?: string; expiresAt?: string;
        metadata?: Record<string, unknown>;
      }>).map(r => ({
        id: String(r.id ?? ""),
        title: (r.title ?? r.actionClass ?? r.metadata?.["title"] ?? "Approval required") as string,
        platform: (r.requestedFrom ?? r.metadata?.["platform"] ?? "Holdings") as string,
        amount: r.metadata?.["amount"] as string | undefined,
        priority: (r.metadata?.["priority"] ?? "normal") as "critical" | "high" | "normal",
        requestedBy: (r.requestedFrom ?? "System") as string,
        requestedAt: r.createdAt ?? new Date().toISOString(),
      }));
    },
    refetchInterval: 30000,
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

interface PendingApproval {
  id: string;
  title: string;
  platform: string;
  amount?: string;
  priority: "critical" | "high" | "normal";
  requestedBy: string;
  requestedAt: string;
  retryRequired?: boolean;
}


const PRIORITY_CONFIG = {
  critical: { color: "#ef4444", label: "CRITICAL" },
  high: { color: "#f59e0b", label: "HIGH" },
  normal: { color: "#10b981", label: "NORMAL" },
};

function SwipeApprovalCard({ approval, onApprove, onDefer }: { approval: PendingApproval; onApprove: () => void; onDefer: () => void }) {
  const colors = useColors();
  const translateX = useRef(new RNAnimated.Value(0)).current;
  const cfg = PRIORITY_CONFIG[approval.priority];

  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 8,
    onPanResponderMove: (_, gs) => {
      translateX.setValue(gs.dx);
    },
    onPanResponderRelease: (_, gs) => {
      if (gs.dx > 80) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        RNAnimated.timing(translateX, { toValue: 400, duration: 250, useNativeDriver: true }).start(onApprove);
      } else if (gs.dx < -80) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        RNAnimated.timing(translateX, { toValue: -400, duration: 250, useNativeDriver: true }).start(onDefer);
      } else {
        RNAnimated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
      }
    },
  })).current;

  const ms = Date.now() - new Date(approval.requestedAt).getTime();
  const relTime = ms < 60000 ? "just now" : ms < 3600000 ? `${Math.floor(ms / 60000)}m ago` : `${Math.floor(ms / 3600000)}h ago`;

  const approveOpacity = translateX.interpolate({ inputRange: [0, 60], outputRange: [0, 1], extrapolate: "clamp" });
  const deferOpacity = translateX.interpolate({ inputRange: [-60, 0], outputRange: [1, 0], extrapolate: "clamp" });

  return (
    <View style={approvalStyles.wrapper}>
      <RNAnimated.View style={[approvalStyles.actionBg, { opacity: approveOpacity, left: 0, backgroundColor: "#10b981" }]}>
        <Feather name="check" size={18} color="#fff" />
        <Text style={approvalStyles.actionLabel}>APPROVE</Text>
      </RNAnimated.View>
      <RNAnimated.View style={[approvalStyles.actionBg, { opacity: deferOpacity, right: 0, backgroundColor: "#64748b" }]}>
        <Text style={approvalStyles.actionLabel}>DEFER</Text>
        <Feather name="clock" size={18} color="#fff" />
      </RNAnimated.View>
      <RNAnimated.View
        style={[approvalStyles.card, { backgroundColor: colors.card, borderColor: `${cfg.color}30`, transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <View style={approvalStyles.topRow}>
          <View style={[approvalStyles.priorityBadge, { backgroundColor: `${cfg.color}15`, borderColor: `${cfg.color}30` }]}>
            <Text style={[approvalStyles.priorityText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
          <Text style={[approvalStyles.platform, { color: colors.mutedForeground }]}>{approval.platform}</Text>
          <Text style={[approvalStyles.time, { color: colors.mutedForeground }]}>{relTime}</Text>
        </View>
        <Text style={[approvalStyles.title, { color: colors.cream }]} numberOfLines={2}>{approval.title}</Text>
        <View style={approvalStyles.bottomRow}>
          <Text style={[approvalStyles.requestedBy, { color: colors.mutedForeground }]}>req. {approval.requestedBy}</Text>
          {approval.amount && <Text style={[approvalStyles.amount, { color: colors.gold }]}>{approval.amount}</Text>}
        </View>
        <View style={approvalStyles.swipeHint}>
          <Feather name="chevron-right" size={10} color={`${cfg.color}60`} />
          <Text style={[approvalStyles.swipeHintText, { color: colors.mutedForeground }]}>swipe to approve · swipe left to defer</Text>
          <Feather name="chevron-left" size={10} color={`${colors.mutedForeground}60`} />
        </View>
      </RNAnimated.View>
    </View>
  );
}

const approvalStyles = StyleSheet.create({
  wrapper: { position: "relative", marginBottom: 8, overflow: "hidden", borderRadius: 10 },
  actionBg: { position: "absolute", top: 0, bottom: 0, width: 120, justifyContent: "center", alignItems: "center", flexDirection: "row", gap: 6, paddingHorizontal: 16 },
  actionLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: "#fff", letterSpacing: 1 },
  card: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 6 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  priorityBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  priorityText: { fontSize: 8, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  platform: { flex: 1, fontSize: 10, fontFamily: "Inter_500Medium" },
  time: { fontSize: 9, fontFamily: "Inter_300Light" },
  title: { fontSize: 13, fontFamily: "Inter_500Medium", lineHeight: 18 },
  bottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  requestedBy: { fontSize: 10, fontFamily: "Inter_300Light" },
  amount: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  swipeHint: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  swipeHintText: { flex: 1, fontSize: 8, fontFamily: "Inter_400Regular", textAlign: "center" },
});


interface HoldingAlert {
  id: string;
  severity: "critical" | "warning" | "info" | "resolved";
  platform: string;
  message: string;
  time: string;
}

const SEVERITY_CONFIG: Record<HoldingAlert["severity"], { color: string; icon: FeatherIconName; label: string }> = {
  critical: { color: "#ef4444", icon: "alert-octagon", label: "Critical" },
  warning: { color: "#f59e0b", icon: "alert-triangle", label: "Warning" },
  info: { color: "#3b82f6", icon: "info", label: "Info" },
  resolved: { color: "#10b981", icon: "check-circle", label: "Resolved" },
};

function AlertRow({ alert }: { alert: HoldingAlert }) {
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

function useAnimatedCounter(target: number, duration = 1200) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!target) return;
    let start = 0;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) {
        frameRef.current = setTimeout(tick, 16);
      }
    };
    tick();
    return () => { if (frameRef.current) clearTimeout(frameRef.current); };
  }, [target, duration]);

  return display;
}

function AnimatedKpiRow({
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
  const numVal = typeof value === "number" ? value : null;
  const animated = useAnimatedCounter(numVal ?? 0);

  return (
    <View style={[styles.kpiRow, { borderColor: colors.borderSubtle }]}>
      <View style={[styles.kpiIcon, { backgroundColor: `${color}18` }]}>
        <Feather name={icon} size={14} color={color} />
      </View>
      <Text style={[styles.kpiLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.kpiValue, { color: colors.cream }]}>
        {numVal !== null ? animated : value}
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
  return <AnimatedKpiRow label={label} value={value} icon={icon} color={color} />;
}

export default function CommandScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { isOffline, isDegraded } = useApiStatus();
  const [refreshing, setRefreshing] = useState(false);
  const qc = useQueryClient();
  const router = useRouter();
  const [voiceVisible, setVoiceVisible] = useState(false);
  const [paletteVisible, setPaletteVisible] = useState(false);

  useShakeGesture({
    onShake: () => setPaletteVisible(true),
    enabled: true,
  });

  const { status: syncStatus, pendingCount } = useOfflineSync({
    namespace: "szl-command",
  });

  const handleVoiceCommand = useCallback((text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes("pulse") || lower.includes("heartbeat")) {
      router.push({ pathname: "/(tabs)/pulse" } as Href);
    } else if (lower.includes("portfolio")) {
      router.push({ pathname: "/(tabs)/portfolio" } as Href);
    } else if (lower.includes("alloy")) {
      router.push({ pathname: "/(tabs)/alloy" } as Href);
    } else if (lower.includes("alert") || lower.includes("critical")) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, [router]);

  const paletteCommands: CommandItem[] = [
    { id: "pulse", label: "Portfolio Pulse", subtitle: "Live heartbeat for all platforms", icon: "heart", tags: ["pulse", "health", "status"], action: () => router.push({ pathname: "/(tabs)/pulse" } as Href) },
    { id: "portfolio", label: "Portfolio", subtitle: "View all ventures", icon: "briefcase", tags: ["ventures", "portfolio"], action: () => router.push({ pathname: "/(tabs)/portfolio" } as Href) },
    { id: "alloy", label: "Alloy AI", subtitle: "AI intelligence assistant", icon: "zap", tags: ["ai", "alloy"], action: () => router.push({ pathname: "/(tabs)/alloy" } as Href) },
    { id: "investor", label: "Investor Deck", subtitle: "Fundraising materials", icon: "trending-up", tags: ["investor", "fundraise"], action: () => router.push({ pathname: "/(tabs)/investor" } as Href) },
    { id: "voice", label: "Voice Command", subtitle: "Say a command", icon: "mic", tags: ["voice"], action: () => setVoiceVisible(true) },
    { id: "refresh", label: "Refresh All", subtitle: "Sync latest data", icon: "refresh-cw", tags: ["sync", "refresh"], action: () => onRefresh() },
  ];

  const {
    data: health,
    isLoading: healthLoading,
    refetch: refetchHealth,
  } = useEcosystemHealth();
  const { data: kpis, isLoading: kpisLoading, refetch: refetchKpis } = useKPIs();
  const { data: alerts = [], isLoading: alertsLoading, isError: alertsError, refetch: refetchAlerts } = useAlerts();
  const { data: approvalsData = [], isLoading: approvalsLoading, isError: approvalsError, refetch: refetchApprovals } = usePendingApprovals();
  const [locallyDismissed, setLocallyDismissed] = useState<Set<string>>(new Set());
  const pendingApprovals: PendingApproval[] = (approvalsData as PendingApproval[]).filter(a => !locallyDismissed.has(a.id));

  const approveMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "approve" | "defer" }) => {
      await apiFetch(`/api/approvals/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: action === "approve" ? "approved" : "rejected", note: action === "defer" ? "Deferred via mobile" : undefined }),
      });
    },
    onSuccess: (_data, variables) => {
      const ap = pendingApprovals.find(a => a.id === variables.id);
      setLocallyDismissed(prev => new Set([...prev, variables.id]));
      qc.invalidateQueries({ queryKey: ["szl-pending-approvals"] });
      if (variables.action === "approve" && ap) {
        Alert.alert("Approved", `"${ap.title}" approved successfully.`);
      }
    },
    onError: (_err, variables) => {
      const ap = pendingApprovals.find(a => a.id === variables.id);
      if (ap) {
        Alert.alert("Sync Failed", `"${ap.title}" could not be submitted. Tap to retry.`);
      }
    },
  });

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : 90;

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await Promise.all([refetchHealth(), refetchKpis(), refetchAlerts(), refetchApprovals()]);
    setRefreshing(false);
  }, [refetchHealth, refetchKpis, refetchAlerts, refetchApprovals]);

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
      {(isOffline || isDegraded) && (
        <View style={{ backgroundColor: isOffline ? "#7f1d1d" : "#78350f", paddingHorizontal: 16, paddingVertical: 8 }}>
          <Text style={{ color: "#fca5a5", fontSize: 11, fontWeight: "600" }}>
            {isOffline ? "Offline — portfolio data may be stale" : "Connection degraded — retrying…"}
          </Text>
        </View>
      )}
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
            {alertsLoading ? (
              <View style={{ padding: 16, alignItems: "center" }}>
                <Text style={{ color: colors.mutedForeground, fontSize: 11, fontFamily: "Inter_400Regular" }}>
                  Loading alerts…
                </Text>
              </View>
            ) : alertsError ? (
              <View style={{ padding: 16, alignItems: "center", gap: 4 }}>
                <Feather name="wifi-off" size={16} color={colors.mutedForeground} />
                <Text style={{ color: colors.mutedForeground, fontSize: 11, fontFamily: "Inter_400Regular" }}>
                  Alerts unavailable — server offline
                </Text>
              </View>
            ) : alerts.length === 0 ? (
              <View style={{ padding: 16, alignItems: "center", gap: 4 }}>
                <Feather name="check-circle" size={16} color="#10b981" />
                <Text style={{ color: colors.mutedForeground, fontSize: 11, fontFamily: "Inter_400Regular" }}>
                  No active alerts
                </Text>
              </View>
            ) : (
              alerts.map((alert) => (
                <AlertRow key={alert.id} alert={alert} />
              ))
            )}
          </View>
        </View>

        <View style={[styles.section, { borderTopColor: colors.borderSubtle }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: colors.goldSubtle }]}>
              PENDING APPROVALS
            </Text>
            {!approvalsError && !approvalsLoading && pendingApprovals.length > 0 && (
              <View style={[styles.alertCountBadge, { backgroundColor: "rgba(239,68,68,0.12)", borderColor: "rgba(239,68,68,0.2)" }]}>
                <Text style={[styles.alertCountText, { color: "#ef4444" }]}>
                  {pendingApprovals.length} required
                </Text>
              </View>
            )}
          </View>
          {approvalsLoading ? (
            <SkeletonLoader width="100%" height={64} borderRadius={8} />
          ) : approvalsError ? (
            <View style={{ paddingVertical: 16, alignItems: "center", gap: 6 }}>
              <Feather name="wifi-off" size={20} color={colors.mutedForeground} />
              <Text style={{ color: colors.mutedForeground, fontSize: 12, fontFamily: "Inter_300Light" }}>Cannot reach server</Text>
              <Pressable onPress={() => refetchApprovals()}>
                <Text style={{ color: colors.gold, fontSize: 12, fontFamily: "Inter_400Regular" }}>Tap to retry</Text>
              </Pressable>
            </View>
          ) : pendingApprovals.length === 0 ? (
            <View style={{ paddingVertical: 16, alignItems: "center" }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 12, fontFamily: "Inter_300Light" }}>No pending approvals</Text>
            </View>
          ) : (
            pendingApprovals.map((ap) => (
              <SwipeApprovalCard
                key={ap.id}
                approval={ap}
                onApprove={() => approveMutation.mutate({ id: ap.id, action: "approve" })}
                onDefer={() => approveMutation.mutate({ id: ap.id, action: "defer" })}
              />
            ))
          )}
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

      <View style={styles.floatingActions}>
        <Pressable
          style={[styles.fab, { backgroundColor: "#c9a84c" }]}
          onPress={() => setVoiceVisible(true)}
        >
          <Feather name="mic" size={20} color="#090810" />
        </Pressable>
        <Pressable
          style={[styles.fab, { backgroundColor: "rgba(201,168,76,0.15)", borderWidth: 1, borderColor: "rgba(201,168,76,0.3)" }]}
          onPress={() => setPaletteVisible(true)}
        >
          <Feather name="command" size={20} color="#c9a84c" />
        </Pressable>
      </View>

      {pendingCount > 0 && (
        <View style={styles.syncBanner}>
          <Feather name="cloud-off" size={12} color="#f59e0b" />
          <Text style={styles.syncBannerText}>{pendingCount} pending sync{pendingCount > 1 ? "s" : ""}</Text>
        </View>
      )}

      <VoiceCommandOverlay
        visible={voiceVisible}
        onClose={() => setVoiceVisible(false)}
        onCommand={handleVoiceCommand}
        appName="Alloy"
        accentColor="#c9a84c"
        suggestions={[
          "Show portfolio pulse",
          "Show critical alerts",
          "Open Alloy AI",
          "Go to portfolio",
        ]}
      />

      <CommandPalette
        visible={paletteVisible}
        onClose={() => setPaletteVisible(false)}
        commands={paletteCommands}
        accentColor="#c9a84c"
        placeholder="Search SZL command palette…"
      />
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
  floatingActions: {
    position: "absolute",
    bottom: 100,
    right: 20,
    gap: 10,
    alignItems: "center",
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  syncBanner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#78350f",
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  syncBannerText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "#fbbf24",
  },
});
