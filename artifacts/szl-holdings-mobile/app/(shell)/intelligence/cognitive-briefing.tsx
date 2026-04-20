import React from "react";
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
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { apiFetch } from "@/lib/apiClient";

const ACCENT = "#c9a84c";

interface InterventionEvidence {
  label: string;
  value: string;
  source?: string;
}

interface Intervention {
  id: string;
  domain: string;
  title: string;
  summary: string;
  urgency: "critical" | "urgent" | "moderate" | "low" | string;
  confidence: number;
  valueAtRisk: number;
  sourceSignalCount: number;
  evidence?: InterventionEvidence[];
  plannerAssessment?: {
    riskLevel: string;
    requiredApproval: boolean;
    approvalReason?: string | null;
  } | null;
}

interface InterventionsResponse {
  count: number;
  totalSignalsEvaluated: number;
  totalVaR: number;
  interventions: Intervention[];
  evaluatedAt: string;
}

interface ValueAtRiskResponse {
  periodDays: number;
  totalVaR: number;
  actionVaR: number;
  signalVaR: number;
  criticalExposure: number;
  highExposure: number;
  byDomain: Record<string, { var: number; count: number; items: number }>;
  fetchedAt: string;
}

const DOMAIN_META: Record<string, { label: string; icon: string; color: string }> = {
  vessels: { label: "Vessels", icon: "⚓", color: "#0ea5e9" },
  aegis: { label: "Aegis", icon: "⬡", color: "#ef4444" },
  firestorm: { label: "Aegis", icon: "⬡", color: "#ef4444" },
  terra: { label: "Terra", icon: "⬢", color: "#22c55e" },
  lyte: { label: "Lyte", icon: "⚡", color: "#f59e0b" },
  prism: { label: "PRISM", icon: "⚖", color: "#a855f7" },
  szl: { label: "Portfolio", icon: "◆", color: "#c9a84c" },
  operations: { label: "Operations", icon: "◇", color: "#8b7ac8" },
  signals: { label: "Signals", icon: "◈", color: "#6366f1" },
  compliance: { label: "Compliance", icon: "⚖", color: "#a855f7" },
  finance: { label: "Finance", icon: "$", color: "#10b981" },
};

function domainMeta(domain: string) {
  return DOMAIN_META[domain] ?? { label: domain, icon: "◆", color: "#6b7280" };
}

const URGENCY_COLOR: Record<string, string> = {
  critical: "#ef4444",
  urgent: "#f97316",
  moderate: "#f59e0b",
  low: "#3b82f6",
};

function urgencyColor(u: string): string {
  return URGENCY_COLOR[u] ?? "#6b7280";
}

function formatUsd(n: number): string {
  if (!n) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

function InterventionCard({
  item,
  rank,
  colors,
}: {
  item: Intervention;
  rank: number;
  colors: ReturnType<typeof useColors>;
}) {
  const meta = domainMeta(item.domain);
  const uColor = urgencyColor(item.urgency);
  const approval = item.plannerAssessment?.requiredApproval;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: uColor, borderLeftWidth: 3 },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.rankBadge}>
          <Text style={[styles.rankBadgeText, { color: ACCENT }]}>#{rank}</Text>
        </View>
        <View style={[styles.domainPill, { backgroundColor: meta.color + "18", borderColor: meta.color + "35" }]}>
          <Text style={[styles.domainPillText, { color: meta.color }]}>
            {meta.icon} {meta.label}
          </Text>
        </View>
        <View style={[styles.urgencyChip, { backgroundColor: uColor + "18", borderColor: uColor + "35" }]}>
          <Text style={[styles.urgencyChipText, { color: uColor }]}>
            {item.urgency.toUpperCase()}
          </Text>
        </View>
        {approval && (
          <View style={[styles.approvalChip, { backgroundColor: ACCENT + "18", borderColor: ACCENT + "35" }]}>
            <Feather name="shield" size={9} color={ACCENT} />
            <Text style={[styles.approvalChipText, { color: ACCENT }]}>APPROVAL</Text>
          </View>
        )}
      </View>

      <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={3}>
        {item.title}
      </Text>
      <Text style={[styles.cardSummary, { color: colors.mutedForeground }]} numberOfLines={3}>
        {item.summary}
      </Text>

      <View style={styles.cardStatsRow}>
        <View style={styles.statBlock}>
          <Text style={[styles.statValue, { color: uColor }]}>{formatUsd(item.valueAtRisk)}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>VALUE AT RISK</Text>
        </View>
        <View style={styles.statBlock}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>
            {Math.round(item.confidence * 100)}%
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>CONFIDENCE</Text>
        </View>
        <View style={styles.statBlock}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>{item.sourceSignalCount}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>SIGNALS</Text>
        </View>
      </View>
    </View>
  );
}

function DomainVarRow({
  domain,
  data,
  totalVaR,
  colors,
}: {
  domain: string;
  data: { var: number; count: number; items: number };
  totalVaR: number;
  colors: ReturnType<typeof useColors>;
}) {
  const meta = domainMeta(domain);
  const pct = totalVaR > 0 ? Math.min(100, (data.var / totalVaR) * 100) : 0;

  return (
    <View style={[styles.varRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.varRowHeader}>
        <View style={[styles.varDomainIcon, { backgroundColor: meta.color + "18", borderColor: meta.color + "35" }]}>
          <Text style={[styles.varDomainIconText, { color: meta.color }]}>{meta.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.varDomainLabel, { color: colors.foreground }]}>{meta.label}</Text>
          <Text style={[styles.varDomainSub, { color: colors.mutedForeground }]}>
            {data.count} item{data.count === 1 ? "" : "s"} · {pct.toFixed(0)}% of exposure
          </Text>
        </View>
        <Text style={[styles.varAmount, { color: meta.color }]}>{formatUsd(data.var)}</Text>
      </View>
      <View style={[styles.varBarTrack, { backgroundColor: colors.border + "60" }]}>
        <View style={[styles.varBarFill, { width: `${pct}%`, backgroundColor: meta.color }]} />
      </View>
    </View>
  );
}

export default function CognitiveBriefingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const interventionsQuery = useQuery<InterventionsResponse>({
    queryKey: ["cognitive-briefing-interventions"],
    queryFn: () =>
      apiFetch<InterventionsResponse>("/api/lyte/cognitive/interventions?limit=5"),
    refetchInterval: 2 * 60 * 1000,
    staleTime: 60 * 1000,
    retry: 1,
  });

  const varQuery = useQuery<ValueAtRiskResponse>({
    queryKey: ["cognitive-briefing-var"],
    queryFn: () => apiFetch<ValueAtRiskResponse>("/api/lyte/cognitive/value-at-risk?days=30"),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  const handleRefresh = () => {
    interventionsQuery.refetch();
    varQuery.refetch();
  };

  const isRefetching = interventionsQuery.isRefetching || varQuery.isRefetching;
  const isLoading = interventionsQuery.isLoading && varQuery.isLoading;

  const interventions = (interventionsQuery.data?.interventions ?? []).slice(0, 5);
  const varData = varQuery.data;

  const rankedDomains = varData
    ? Object.entries(varData.byDomain ?? {})
        .map(([domain, data]) => ({ domain, data }))
        .sort((a, b) => b.data.var - a.data.var)
    : [];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={18} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerRow}>
            <View style={styles.liveIndicator} />
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Cognitive Briefing</Text>
          </View>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Top interventions · Value at risk · Bottlenecks
          </Text>
        </View>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshBtn}>
          <Feather name="refresh-cw" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} tintColor={ACCENT} />}
      >
        {isLoading ? (
          <ActivityIndicator color={ACCENT} style={{ marginTop: 32 }} />
        ) : (
          <>
            {varData && (
              <View style={[styles.summaryCard, { backgroundColor: "#0a0a0a", borderColor: ACCENT + "30" }]}>
                <Text style={styles.summaryLabel}>TOTAL VALUE AT RISK · {varData.periodDays}D</Text>
                <Text style={styles.summaryValue}>{formatUsd(varData.totalVaR)}</Text>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryStat}>
                    <Text style={[styles.summaryStatValue, { color: "#ef4444" }]}>
                      {formatUsd(varData.criticalExposure)}
                    </Text>
                    <Text style={styles.summaryStatLabel}>CRITICAL</Text>
                  </View>
                  <View style={styles.summaryStat}>
                    <Text style={[styles.summaryStatValue, { color: "#f97316" }]}>
                      {formatUsd(varData.highExposure)}
                    </Text>
                    <Text style={styles.summaryStatLabel}>HIGH</Text>
                  </View>
                  <View style={styles.summaryStat}>
                    <Text style={[styles.summaryStatValue, { color: "#9ca3af" }]}>
                      {formatUsd(varData.actionVaR)}
                    </Text>
                    <Text style={styles.summaryStatLabel}>ACTIONS</Text>
                  </View>
                </View>
              </View>
            )}

            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              TOP INTERVENTIONS
            </Text>
            {interventionsQuery.isError ? (
              <View style={[styles.errorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="alert-circle" size={14} color="#ef4444" />
                <Text style={[styles.errorText, { color: colors.mutedForeground }]}>
                  Cognitive runtime unavailable. Pull to retry.
                </Text>
              </View>
            ) : interventions.length === 0 ? (
              <View style={[styles.empty, { borderColor: colors.border }]}>
                <Text style={styles.emptyIcon}>◈</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  No active interventions ranked by the cognitive runtime
                </Text>
              </View>
            ) : (
              interventions.map((it, idx) => (
                <InterventionCard key={it.id} item={it} rank={idx + 1} colors={colors} />
              ))
            )}

            {rankedDomains.length > 0 && varData && (
              <>
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 16 }]}>
                  VALUE AT RISK BY DOMAIN
                </Text>
                {rankedDomains.map(({ domain, data }) => (
                  <DomainVarRow
                    key={domain}
                    domain={domain}
                    data={data}
                    totalVaR={varData.totalVaR}
                    colors={colors}
                  />
                ))}
              </>
            )}

            {(interventionsQuery.data || varData) && (
              <Text style={[styles.generatedAt, { color: colors.mutedForeground }]}>
                Updated{" "}
                {new Date(
                  interventionsQuery.data?.evaluatedAt ?? varData?.fetchedAt ?? new Date().toISOString(),
                ).toLocaleString()}
              </Text>
            )}
          </>
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
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { marginRight: 10, padding: 4 },
  headerCenter: { flex: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  liveIndicator: { width: 7, height: 7, borderRadius: 4, backgroundColor: ACCENT },
  headerTitle: { fontSize: 17, fontWeight: "700", letterSpacing: -0.3 },
  headerSub: { fontSize: 11, marginTop: 1 },
  refreshBtn: { padding: 8 },
  scroll: { flex: 1 },
  scrollContent: { padding: 14, gap: 10 },
  summaryCard: { borderRadius: 10, borderWidth: 1, padding: 16 },
  summaryLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.8, color: ACCENT + "cc" },
  summaryValue: { fontSize: 28, fontWeight: "800", color: "#e8edf8", marginTop: 4, letterSpacing: -0.5 },
  summaryRow: { flexDirection: "row", marginTop: 12, gap: 10 },
  summaryStat: { flex: 1 },
  summaryStatValue: { fontSize: 14, fontWeight: "700" },
  summaryStatLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5, color: "#6b7280", marginTop: 2 },
  sectionLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.8, marginTop: 4, marginBottom: 2 },
  card: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 8 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  rankBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: ACCENT + "15",
    borderWidth: 1,
    borderColor: ACCENT + "35",
  },
  rankBadgeText: { fontSize: 10, fontWeight: "800" },
  domainPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  domainPillText: { fontSize: 10, fontWeight: "700" },
  urgencyChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  urgencyChipText: { fontSize: 10, fontWeight: "700" },
  approvalChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  approvalChipText: { fontSize: 9, fontWeight: "700" },
  cardTitle: { fontSize: 13, fontWeight: "600", lineHeight: 18 },
  cardSummary: { fontSize: 12, lineHeight: 17 },
  cardStatsRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  statBlock: { flex: 1 },
  statValue: { fontSize: 14, fontWeight: "700" },
  statLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 0.4, marginTop: 2 },
  varRow: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 8 },
  varRowHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  varDomainIcon: {
    width: 30,
    height: 30,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  varDomainIconText: { fontSize: 14 },
  varDomainLabel: { fontSize: 13, fontWeight: "600" },
  varDomainSub: { fontSize: 11, marginTop: 1 },
  varAmount: { fontSize: 14, fontWeight: "700" },
  varBarTrack: { height: 4, borderRadius: 2, overflow: "hidden" },
  varBarFill: { height: 4, borderRadius: 2 },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  errorText: { fontSize: 12, flex: 1 },
  empty: { alignItems: "center", padding: 24, borderRadius: 10, borderWidth: 1, gap: 8 },
  emptyIcon: { fontSize: 28, color: "#6b7280" },
  emptyText: { fontSize: 12, textAlign: "center" },
  generatedAt: { fontSize: 10, textAlign: "center", marginTop: 8 },
});
