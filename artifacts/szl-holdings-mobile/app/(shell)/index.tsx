import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace, WORKSPACES, type WorkspaceDomain } from "@/context/WorkspaceContext";
import { WorkspaceTrigger } from "@/components/WorkspaceSwitcher";
import { useApiStatus } from "@szl-holdings/mobile-shared";
import { VoiceCommandModal } from "@/components/VoiceCommandModal";

const ACCENT = "#c9a84c";

interface CommandSignal {
  id: string;
  domain: WorkspaceDomain | string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  source: string;
  time: string;
}

interface DomainSummary {
  domain: WorkspaceDomain | string;
  label: string;
  icon: string;
  accent: string;
  activeCount: number;
  criticalCount: number;
  status: "operational" | "degraded" | "critical" | "unknown";
  route: string;
}

const SERVER_TO_WORKSPACE: Record<string, WorkspaceDomain> = {
  vessels: "fleet",
  firestorm: "defense",
  aegis: "defense",
  terra: "properties",
  lyte: "operations",
  msp: "operations",
  inca: "intelligence",
  cortex: "intelligence",
  prism: "advisory",
  carlota: "advisory",
  szl: "portfolio",
  founder: "founder",
  command: "command",
};

function mapServerDomain(d: string): WorkspaceDomain | null {
  if ((SERVER_TO_WORKSPACE as Record<string, WorkspaceDomain>)[d]) {
    return SERVER_TO_WORKSPACE[d];
  }
  const known: WorkspaceDomain[] = [
    "command", "defense", "fleet", "properties", "operations",
    "advisory", "portfolio", "founder", "intelligence",
  ];
  return (known as string[]).includes(d) ? (d as WorkspaceDomain) : null;
}

function getApiBase(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? `https://${domain}` : "";
}

async function fetchCommandFeed(headers: Record<string, string>): Promise<{
  signals: CommandSignal[];
  summaries: DomainSummary[];
}> {
  try {
    const res = await fetch(`${getApiBase()}/api/cortex/command-feed`, { headers });
    if (!res.ok) throw new Error("feed unavailable");
    return res.json();
  } catch {
    return { signals: [], summaries: [] };
  }
}

function severityColor(sev: string, colors: ReturnType<typeof useColors>) {
  switch (sev) {
    case "critical": return colors.red;
    case "high": return colors.amber;
    case "medium": return "#f59e0b";
    case "low": return colors.blue;
    default: return colors.mutedForeground;
  }
}

function SignalRow({
  signal,
  colors,
}: {
  signal: CommandSignal;
  colors: ReturnType<typeof useColors>;
}) {
  const ws = WORKSPACES.find((w) => w.id === signal.domain);
  const accent = ws?.accent ?? ACCENT;
  const sevColor = severityColor(signal.severity, colors);

  return (
    <TouchableOpacity
      onPress={() => router.navigate(ws?.route as never ?? "/(shell)/")}
      style={[styles.signalRow, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.8}
    >
      <View style={[styles.sevDot, { backgroundColor: sevColor }]} />
      <View style={styles.signalContent}>
        <Text style={[styles.signalTitle, { color: colors.foreground }]} numberOfLines={1}>
          {signal.title}
        </Text>
        <Text style={[styles.signalMeta, { color: colors.mutedForeground }]}>
          {ws?.icon} {ws?.label} · {signal.source} · {signal.time}
        </Text>
      </View>
      <View style={[styles.sevBadge, { backgroundColor: `${sevColor}18`, borderColor: `${sevColor}30` }]}>
        <Text style={[styles.sevText, { color: sevColor }]}>{signal.severity.toUpperCase()}</Text>
      </View>
    </TouchableOpacity>
  );
}

function DomainCard({
  summary,
  colors,
}: {
  summary: DomainSummary;
  colors: ReturnType<typeof useColors>;
}) {
  const statusColor =
    summary.status === "critical"
      ? colors.red
      : summary.status === "degraded"
      ? colors.amber
      : colors.green;

  return (
    <TouchableOpacity
      onPress={() => router.navigate(summary.route as never)}
      style={[styles.domainCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.8}
    >
      <View style={[styles.domainIcon, { backgroundColor: `${summary.accent}18` }]}>
        <Text style={styles.domainIconText}>{summary.icon}</Text>
      </View>
      <Text style={[styles.domainLabel, { color: colors.foreground }]}>{summary.label}</Text>
      <View style={styles.domainStats}>
        {summary.criticalCount > 0 && (
          <View style={[styles.criticalBadge, { backgroundColor: `${colors.red}18` }]}>
            <Text style={[styles.criticalText, { color: colors.red }]}>
              {summary.criticalCount} crit
            </Text>
          </View>
        )}
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
      </View>
    </TouchableOpacity>
  );
}

export default function CommandFeedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, buildHeaders, isAuthenticated } = useAuth();
  const { setActiveWorkspace, setBadge } = useWorkspace();
  const apiStatus = useApiStatus();
  const [voiceVisible, setVoiceVisible] = useState(false);

  useEffect(() => {
    setActiveWorkspace("command");
  }, [setActiveWorkspace]);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["cortex-command-feed", isAuthenticated],
    queryFn: () => fetchCommandFeed(buildHeaders()),
    enabled: isAuthenticated,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  const signals = data?.signals ?? [];
  const summaries = data?.summaries ?? [];

  useEffect(() => {
    if (isAuthenticated) return;
    const allDomains: WorkspaceDomain[] = [
      "command", "defense", "fleet", "properties", "operations",
      "advisory", "portfolio", "founder", "intelligence",
    ];
    for (const d of allDomains) setBadge(d, 0);
  }, [isAuthenticated, setBadge]);

  useEffect(() => {
    if (!data) return;
    const counts: Partial<Record<WorkspaceDomain, number>> = {};
    for (const s of summaries) {
      const ws = mapServerDomain(String(s.domain));
      if (!ws) continue;
      counts[ws] = (counts[ws] ?? 0) + (s.activeCount ?? 0);
    }
    for (const s of signals) {
      const ws = mapServerDomain(String(s.domain));
      if (!ws) continue;
      if (counts[ws] === undefined) {
        counts[ws] = (counts[ws] ?? 0) + 1;
      }
    }
    const allDomains: WorkspaceDomain[] = [
      "command", "defense", "fleet", "properties", "operations",
      "advisory", "portfolio", "founder", "intelligence",
    ];
    for (const d of allDomains) {
      setBadge(d, counts[d] ?? 0);
    }
  }, [data, setBadge, signals, summaries]);

  const criticalCount = signals.filter((s) => s.severity === "critical").length;

  const { data: briefingData } = useQuery({
    queryKey: ["morning-brief"],
    queryFn: async () => {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      try {
        const res = await fetch(`${getApiBase()}/api/briefing/today`, { headers });
        if (!res.ok) return null;
        const body = await res.json();
        return body.data ?? body ?? null;
      } catch {
        return null;
      }
    },
    staleTime: 300000,
    refetchInterval: 600000,
  });

  const brief = briefingData ?? {
    headline: "3 critical signals across 2 domains require immediate attention",
    executiveSummary: "As of today UTC, the SZL ecosystem is operating at DEGRADED status. 3 intelligence signals identified across 4 domains. APT-41 campaign and Shanghai port delay are the highest-priority items.",
    overallHealth: "degraded",
    criticalCount: 3,
    highCount: 5,
    totalAlerts: 8,
    signals: [
      { domain: "firestorm", level: "critical", title: "APT-41 Lateral Movement", summary: "Nation-state threat actor active across 3 subsidiaries. Legal hold triggered.", count: 1 },
      { domain: "vessels", level: "high", title: "Shanghai Port Delay +32h", summary: "12 Terra properties and 8 PRISM contracts flagged via signal chain.", count: 2 },
      { domain: "szl-holdings", level: "medium", title: "Market Volatility Index 0.72", summary: "Portfolio rebalance signal chain triggered across Terra, Vessels, and fund ops.", count: 5 },
    ],
  };

  const healthColor = brief.overallHealth === "critical" ? colors.red : brief.overallHealth === "degraded" ? colors.amber : colors.green;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 12,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <WorkspaceTrigger accentColor={ACCENT} size={36} />
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Command Feed</Text>
          {criticalCount > 0 && (
            <View style={[styles.criticalPill, { backgroundColor: `${colors.red}18`, borderColor: `${colors.red}30` }]}>
              <Text style={[styles.criticalPillText, { color: colors.red }]}>
                {criticalCount} CRITICAL
              </Text>
            </View>
          )}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setVoiceVisible(true)}
            style={[styles.headerIconBtn, { backgroundColor: `${ACCENT}12`, borderColor: `${ACCENT}25` }]}
          >
            <Feather name="mic" size={16} color={ACCENT} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.navigate("/(shell)/quick-actions" as never)}
            style={[styles.headerIconBtn, { borderColor: colors.border }]}
          >
            <Feather name="layers" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.navigate("/(shell)/settings" as never)}
            style={[styles.headerIconBtn, { borderColor: colors.border }]}
          >
            <Feather name="settings" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>

      <VoiceCommandModal visible={voiceVisible} onClose={() => setVoiceVisible(false)} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={ACCENT}
          />
        }
      >
        {user && (
          <View style={styles.greeting}>
            <Text style={[styles.greetingText, { color: colors.mutedForeground }]}>
              Good day, {user.displayName ?? "Commander"}
            </Text>
          </View>
        )}

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>MORNING BRIEF</Text>
        <View style={[styles.briefCard, { backgroundColor: colors.card, borderColor: healthColor + "40" }]}>
          <View style={styles.briefHeader}>
            <View style={[styles.briefHealthBadge, { backgroundColor: healthColor + "20", borderColor: healthColor + "40" }]}>
              <Text style={[styles.briefHealthText, { color: healthColor }]}>
                {(brief.overallHealth ?? "nominal").toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.briefDate, { color: colors.mutedForeground }]}>
              {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </Text>
          </View>
          <Text style={[styles.briefHeadline, { color: colors.foreground }]} numberOfLines={3}>
            {brief.headline}
          </Text>
          <Text style={[styles.briefSummary, { color: colors.mutedForeground }]} numberOfLines={3}>
            {brief.executiveSummary}
          </Text>
          <View style={styles.briefStats}>
            <View style={[styles.briefStat, { backgroundColor: colors.red + "15", borderColor: colors.red + "30" }]}>
              <Text style={[styles.briefStatNum, { color: colors.red }]}>{brief.criticalCount ?? 0}</Text>
              <Text style={[styles.briefStatLabel, { color: colors.mutedForeground }]}>Critical</Text>
            </View>
            <View style={[styles.briefStat, { backgroundColor: colors.amber + "15", borderColor: colors.amber + "30" }]}>
              <Text style={[styles.briefStatNum, { color: colors.amber }]}>{brief.highCount ?? 0}</Text>
              <Text style={[styles.briefStatLabel, { color: colors.mutedForeground }]}>High</Text>
            </View>
            <View style={[styles.briefStat, { backgroundColor: colors.border, borderColor: colors.border }]}>
              <Text style={[styles.briefStatNum, { color: colors.foreground }]}>{brief.totalAlerts ?? 0}</Text>
              <Text style={[styles.briefStatLabel, { color: colors.mutedForeground }]}>Total</Text>
            </View>
          </View>
          {Array.isArray(brief.signals) && brief.signals.slice(0, 3).map((sig: any, i: number) => {
            const sigColor = sig.level === "critical" ? colors.red : sig.level === "high" ? colors.amber : colors.blue;
            return (
              <View key={i} style={[styles.briefSignalRow, { borderTopColor: colors.border }]}>
                <View style={[styles.sevDot, { backgroundColor: sigColor }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.briefSignalTitle, { color: colors.foreground }]} numberOfLines={1}>{sig.title}</Text>
                  <Text style={[styles.briefSignalSummary, { color: colors.mutedForeground }]} numberOfLines={2}>{sig.summary}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>DOMAINS</Text>
        {summaries.length === 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.domainRow}>
            {WORKSPACES.filter((w) => w.id !== "command").map((ws) => (
              <TouchableOpacity
                key={ws.id}
                onPress={() => {
                  setActiveWorkspace(ws.id as WorkspaceDomain);
                  router.navigate(ws.route as never);
                }}
                style={[styles.domainCard, { backgroundColor: colors.card, borderColor: `${ws.accent}25` }]}
                activeOpacity={0.8}
              >
                <View style={[styles.domainIcon, { backgroundColor: `${ws.accent}18` }]}>
                  <Text style={styles.domainIconText}>{ws.icon}</Text>
                </View>
                <Text style={[styles.domainLabel, { color: colors.foreground }]}>{ws.label}</Text>
                <View style={[styles.statusDot, { backgroundColor: colors.mutedForeground }]} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.domainRow}>
            {summaries.map((s) => (
              <DomainCard key={s.domain} summary={s} colors={colors} />
            ))}
          </ScrollView>
        )}

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>LIVE SIGNALS</Text>

        {isLoading ? (
          <ActivityIndicator color={ACCENT} style={{ marginTop: 40 }} />
        ) : signals.length === 0 ? (
          <View style={[styles.emptyState, { borderColor: colors.border }]}>
            <Text style={{ fontSize: 32, textAlign: "center" }}>⬡</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              All domains nominal
            </Text>
            <Text style={[styles.emptySubText, { color: colors.mutedForeground }]}>
              No active signals across the ecosystem
            </Text>
          </View>
        ) : (
          signals.map((signal) => (
            <SignalRow key={signal.id} signal={signal} colors={colors} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerCenter: {
    flex: 1,
    gap: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: -0.3,
  },
  criticalPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  criticalPillText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
  },
  refreshBtn: { padding: 4 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 8 },
  greeting: { marginBottom: 8 },
  greetingText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.3,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
    marginTop: 8,
    marginBottom: 4,
  },
  domainRow: {
    gap: 10,
    paddingBottom: 8,
  },
  domainCard: {
    width: 90,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    gap: 6,
  },
  domainIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  domainIconText: { fontSize: 18 },
  domainLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  domainStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  criticalBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  criticalText: { fontSize: 9, fontFamily: "Inter_600SemiBold" },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  signalRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  sevDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  signalContent: { flex: 1, gap: 3 },
  signalTitle: { fontSize: 13, fontFamily: "Inter_500Medium" },
  signalMeta: { fontSize: 11, fontFamily: "Inter_400Regular" },
  sevBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
  },
  sevText: { fontSize: 9, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  emptyState: {
    alignItems: "center",
    padding: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: 8,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  emptySubText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  briefCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
    marginBottom: 4,
  },
  briefHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  briefHealthBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  briefHealthText: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  briefDate: { fontSize: 11, fontFamily: "Inter_400Regular" },
  briefHeadline: { fontSize: 14, fontFamily: "Inter_600SemiBold", lineHeight: 20 },
  briefSummary: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  briefStats: { flexDirection: "row", gap: 8 },
  briefStat: {
    flex: 1,
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 2,
  },
  briefStatNum: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  briefStatLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  briefSignalRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  briefSignalTitle: { fontSize: 12, fontFamily: "Inter_500Medium" },
  briefSignalSummary: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
});
