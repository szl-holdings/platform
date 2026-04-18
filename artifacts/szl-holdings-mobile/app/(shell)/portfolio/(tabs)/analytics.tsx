import React, { useCallback, useState, useEffect } from "react";
import { trackEvent } from "@/lib/analytics";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { apiFetch } from "@/lib/apiClient";
import { SkeletonLoader } from "@szl-holdings/mobile-shared";

const ACCENT = "#c9a84c";

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

interface MetricsSummary {
  mrr: number;
  arr: number;
  mrrGrowth: number;
  totalCustomers: number;
  customerGrowth: number;
  churnRate: number;
  nrr: number;
  ltvCacRatio: number | null;
  cacPayback: number | null;
  activeUsers30d: number;
  activeUsers7d: number;
}

interface InvestorMetrics {
  summary: MetricsSummary;
  timeSeries: Array<{
    month: string;
    mrr: number;
    revenue: number;
    customers: number;
    newCustomers: number;
    churnRate: number;
    canceledSubs: number;
  }>;
  activeSubscriptions: number;
  planDistribution: Array<{ plan: string; count: number }>;
}

interface ApiEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

function useInvestorMetrics() {
  return useQuery<InvestorMetrics>({
    queryKey: ["investor-analytics-metrics"],
    queryFn: async (): Promise<InvestorMetrics> => {
      const envelope = await apiFetch<ApiEnvelope<InvestorMetrics>>("/api/investor-analytics/metrics");
      return envelope.data;
    },
    refetchInterval: 300000,
    retry: 2,
  });
}

function fmt(n: number | undefined | null, opts?: { currency?: boolean; compact?: boolean }): string {
  if (n == null || isNaN(n)) return "—";
  if (opts?.currency) {
    if (opts?.compact) {
      if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
      if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
      return `$${n.toFixed(0)}`;
    }
    return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  if (opts?.compact) {
    if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return `${n.toFixed(0)}`;
  }
  return n.toLocaleString("en-US");
}

function growthColor(val: number | undefined | null): string {
  if (val == null) return "#94a3b8";
  if (val > 0) return "#10b981";
  if (val < 0) return "#ef4444";
  return "#94a3b8";
}

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  subColor?: string;
  icon: FeatherIconName;
  iconColor?: string;
}

function KpiCard({ label, value, sub, subColor, icon, iconColor = ACCENT }: KpiCardProps) {
  const colors = useColors();
  return (
    <View style={[kpiCardStyles.card, { backgroundColor: colors.card, borderColor: colors.borderSubtle }]}>
      <View style={[kpiCardStyles.iconWrap, { backgroundColor: `${iconColor}15` }]}>
        <Feather name={icon} size={14} color={iconColor} />
      </View>
      <Text style={[kpiCardStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[kpiCardStyles.value, { color: colors.cream }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {sub != null && (
        <Text style={[kpiCardStyles.sub, { color: subColor ?? colors.mutedForeground }]}>{sub}</Text>
      )}
    </View>
  );
}

const kpiCardStyles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 4,
    minWidth: 100,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  label: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  value: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 22,
  },
  sub: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
});

interface FunnelBarProps {
  name: string;
  count: number;
  conversionToNext: number | null;
  maxCount: number;
}

function FunnelBar({ name, count, conversionToNext, maxCount }: FunnelBarProps) {
  const colors = useColors();
  const fillFraction = maxCount > 0 ? Math.min(count / maxCount, 1) : 0;

  return (
    <View style={funnelStyles.row}>
      <View style={funnelStyles.labelRow}>
        <Text style={[funnelStyles.stageName, { color: colors.cream }]}>{name}</Text>
        <Text style={[funnelStyles.stageCount, { color: ACCENT }]}>{fmt(count, { compact: true })}</Text>
      </View>
      <View style={[funnelStyles.track, { backgroundColor: colors.borderSubtle }]}>
        <View
          style={[
            funnelStyles.fill,
            {
              width: `${Math.max(Math.round(fillFraction * 100), 2)}%`,
              backgroundColor: ACCENT,
              opacity: 0.5 + fillFraction * 0.5,
            },
          ]}
        />
      </View>
      {conversionToNext != null && (
        <Text style={[funnelStyles.convRate, { color: colors.mutedForeground }]}>
          {conversionToNext.toFixed(1)}% convert to next stage
        </Text>
      )}
    </View>
  );
}

const funnelStyles = StyleSheet.create({
  row: { gap: 4, marginBottom: 12 },
  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  stageName: { fontSize: 12, fontFamily: "Inter_500Medium" },
  stageCount: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  track: { height: 6, borderRadius: 3, overflow: "hidden" },
  fill: { height: 6, borderRadius: 3 },
  convRate: { fontSize: 9, fontFamily: "Inter_400Regular" },
});

function SectionHeader({ label, icon }: { label: string; icon: FeatherIconName }) {
  const colors = useColors();
  return (
    <View style={sectionHeaderStyles.row}>
      <Feather name={icon} size={12} color={ACCENT} />
      <Text style={[sectionHeaderStyles.label, { color: colors.goldSubtle ?? ACCENT }]}>{label}</Text>
    </View>
  );
}

const sectionHeaderStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  label: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});

function MetricRow({ label, value, color }: { label: string; value: string; color?: string }) {
  const colors = useColors();
  return (
    <View style={[metricRowStyles.row, { borderBottomColor: colors.borderSubtle }]}>
      <Text style={[metricRowStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[metricRowStyles.value, { color: color ?? colors.cream }]}>{value}</Text>
    </View>
  );
}

const metricRowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: { fontSize: 12, fontFamily: "Inter_400Regular" },
  value: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const colors = useColors();
  return (
    <View style={errorStyles.wrap}>
      <Feather name="wifi-off" size={20} color={colors.mutedForeground} />
      <Text style={[errorStyles.msg, { color: colors.mutedForeground }]}>{message}</Text>
      <Text style={[errorStyles.retry, { color: ACCENT }]} onPress={onRetry}>
        Retry
      </Text>
    </View>
  );
}

const errorStyles = StyleSheet.create({
  wrap: { alignItems: "center", paddingVertical: 24, gap: 8 },
  msg: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center" },
  retry: { fontSize: 12, fontFamily: "Inter_500Medium" },
});

function buildFunnelStages(
  metrics: InvestorMetrics
): Array<{ name: string; count: number; conversionToNext: number | null }> {
  const counts: Array<{ name: string; count: number }> = [
    { name: "Monthly Active Users", count: metrics.summary.activeUsers30d },
    { name: "Customers", count: metrics.summary.totalCustomers },
    { name: "Active Subscriptions", count: metrics.activeSubscriptions ?? 0 },
  ];

  return counts.map((stage, i) => {
    const next = counts[i + 1];
    const conversionToNext =
      next != null && stage.count > 0
        ? parseFloat(((next.count / stage.count) * 100).toFixed(1))
        : null;
    return { ...stage, conversionToNext };
  });
}

export default function AnalyticsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    trackEvent("page_view", { page: "analytics", product: "szl-holdings-mobile" });
  }, []);

  const {
    data: metrics,
    isLoading: metricsLoading,
    isError: metricsError,
    refetch: refetchMetrics,
  } = useInvestorMetrics();

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await refetchMetrics();
    setRefreshing(false);
  }, [refetchMetrics]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : 90;

  const s = metrics?.summary;
  const mrrGrowthColor = growthColor(s?.mrrGrowth);
  const custGrowthColor = growthColor(s?.customerGrowth);
  const nrrColor = s == null ? "#94a3b8" : s.nrr >= 100 ? "#10b981" : "#ef4444";
  const churnColor =
    s == null
      ? "#94a3b8"
      : s.churnRate < 3
      ? "#10b981"
      : s.churnRate < 7
      ? "#f59e0b"
      : "#ef4444";

  const funnelStages = metrics != null ? buildFunnelStages(metrics) : [];
  const maxFunnelCount = funnelStages[0]?.count ?? 1;

  const recentTimeSeries = (metrics?.timeSeries ?? []).slice(-6);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["rgba(201,168,76,0.06)", "transparent"]}
        style={[styles.headerGradient, { height: topPad + 140 }]}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: topPad + 16, paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: colors.goldSubtle ?? ACCENT }]}>INVESTOR ANALYTICS</Text>
          <Text style={[styles.title, { color: colors.cream }]}>Business Metrics</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Live SaaS performance · platform data
          </Text>
        </View>

        <View style={[styles.section, { borderTopColor: colors.borderSubtle }]}>
          <SectionHeader label="Key Performance Indicators" icon="bar-chart-2" />

          {metricsLoading ? (
            <View style={styles.skeletonGrid}>
              {[...Array(6)].map((_, i) => (
                <SkeletonLoader key={i} width="48%" height={90} borderRadius={12} />
              ))}
            </View>
          ) : metricsError ? (
            <ErrorState
              message="Could not load metrics — server may be offline"
              onRetry={refetchMetrics}
            />
          ) : (
            <View style={styles.kpiGrid}>
              <View style={styles.kpiRow}>
                <KpiCard
                  label="MRR"
                  icon="trending-up"
                  value={fmt(s?.mrr, { currency: true, compact: true })}
                  sub={
                    s?.mrrGrowth != null
                      ? `${s.mrrGrowth >= 0 ? "+" : ""}${s.mrrGrowth.toFixed(1)}% MoM`
                      : undefined
                  }
                  subColor={mrrGrowthColor}
                />
                <KpiCard
                  label="ARR"
                  icon="dollar-sign"
                  value={fmt(s?.arr, { currency: true, compact: true })}
                />
              </View>
              <View style={styles.kpiRow}>
                <KpiCard
                  label="Churn Rate"
                  icon="user-minus"
                  value={s?.churnRate != null ? `${s.churnRate.toFixed(1)}%` : "—"}
                  iconColor={churnColor}
                  subColor={churnColor}
                  sub={
                    s?.churnRate != null
                      ? s.churnRate < 3
                        ? "Healthy"
                        : s.churnRate < 7
                        ? "Elevated"
                        : "High"
                      : undefined
                  }
                />
                <KpiCard
                  label="NRR"
                  icon="repeat"
                  value={s?.nrr != null ? `${s.nrr.toFixed(0)}%` : "—"}
                  iconColor={nrrColor}
                  sub={s?.nrr != null ? (s.nrr >= 100 ? "Expanding" : "Contracting") : undefined}
                  subColor={nrrColor}
                />
              </View>
              <View style={styles.kpiRow}>
                <KpiCard
                  label="Customers"
                  icon="users"
                  value={fmt(s?.totalCustomers, { compact: true })}
                  sub={
                    s?.customerGrowth != null
                      ? `${s.customerGrowth >= 0 ? "+" : ""}${s.customerGrowth.toFixed(1)}% MoM`
                      : undefined
                  }
                  subColor={custGrowthColor}
                />
                <KpiCard
                  label="MAU"
                  icon="activity"
                  value={fmt(s?.activeUsers30d, { compact: true })}
                  sub={
                    s?.activeUsers7d != null
                      ? `${fmt(s.activeUsers7d, { compact: true })} WAU`
                      : undefined
                  }
                />
              </View>
            </View>
          )}
        </View>

        {!metricsError && !metricsLoading && s != null && (
          <View style={[styles.section, { borderTopColor: colors.borderSubtle }]}>
            <SectionHeader label="Unit Economics" icon="zap" />
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderSubtle }]}>
              <MetricRow
                label="LTV / CAC Ratio"
                value={s.ltvCacRatio != null ? `${s.ltvCacRatio.toFixed(1)}×` : "—"}
                color={
                  s.ltvCacRatio == null
                    ? undefined
                    : s.ltvCacRatio >= 3
                    ? "#10b981"
                    : s.ltvCacRatio >= 1
                    ? "#f59e0b"
                    : "#ef4444"
                }
              />
              <MetricRow
                label="CAC Payback"
                value={s.cacPayback != null ? `${s.cacPayback.toFixed(0)} mo` : "—"}
                color={
                  s.cacPayback == null
                    ? undefined
                    : s.cacPayback <= 12
                    ? "#10b981"
                    : s.cacPayback <= 24
                    ? "#f59e0b"
                    : "#ef4444"
                }
              />
              <MetricRow
                label="7-Day Active Users"
                value={fmt(s.activeUsers7d, { compact: true })}
              />
            </View>
          </View>
        )}

        {!metricsError && !metricsLoading && metrics != null && funnelStages.length > 0 && (
          <View style={[styles.section, { borderTopColor: colors.borderSubtle }]}>
            <SectionHeader label="Funnel Summary" icon="filter" />
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderSubtle }]}>
              {funnelStages.map((stage) => (
                <FunnelBar
                  key={stage.name}
                  name={stage.name}
                  count={stage.count}
                  conversionToNext={stage.conversionToNext}
                  maxCount={maxFunnelCount}
                />
              ))}
            </View>
          </View>
        )}

        {!metricsError && !metricsLoading && recentTimeSeries.length > 0 && (
          <View style={[styles.section, { borderTopColor: colors.borderSubtle }]}>
            <SectionHeader label="Monthly Trend" icon="calendar" />
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderSubtle }]}>
              <View style={[monthlyStyles.header, { borderBottomColor: colors.borderSubtle }]}>
                <Text style={[monthlyStyles.col, monthlyStyles.colLabel, { color: colors.mutedForeground }]}>
                  Month
                </Text>
                <Text style={[monthlyStyles.col, monthlyStyles.colRight, { color: colors.mutedForeground }]}>
                  MRR
                </Text>
                <Text style={[monthlyStyles.col, monthlyStyles.colRight, { color: colors.mutedForeground }]}>
                  Customers
                </Text>
                <Text style={[monthlyStyles.col, monthlyStyles.colRight, { color: colors.mutedForeground }]}>
                  Churn
                </Text>
              </View>
              {recentTimeSeries.map((row) => (
                <View key={row.month} style={[monthlyStyles.row, { borderBottomColor: colors.borderSubtle }]}>
                  <Text style={[monthlyStyles.col, monthlyStyles.colLabel, { color: colors.mutedForeground, fontSize: 10 }]}>
                    {row.month}
                  </Text>
                  <Text style={[monthlyStyles.col, monthlyStyles.colRight, { color: ACCENT }]}>
                    {fmt(row.mrr, { currency: true, compact: true })}
                  </Text>
                  <Text style={[monthlyStyles.col, monthlyStyles.colRight, { color: colors.cream }]}>
                    {row.customers}
                  </Text>
                  <Text
                    style={[
                      monthlyStyles.col,
                      monthlyStyles.colRight,
                      {
                        color:
                          row.churnRate < 3
                            ? "#10b981"
                            : row.churnRate < 7
                            ? "#f59e0b"
                            : "#ef4444",
                      },
                    ]}
                  >
                    {row.churnRate.toFixed(1)}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {metricsLoading && (
          <View style={[styles.section, { borderTopColor: colors.borderSubtle }]}>
            <SkeletonLoader width="40%" height={14} borderRadius={4} />
            <View style={{ height: 8 }} />
            <SkeletonLoader width="100%" height={180} borderRadius={12} />
          </View>
        )}

        <Text style={[styles.footerNote, { color: colors.mutedForeground }]}>
          Data refreshes every 5 minutes · Pull to refresh
        </Text>
      </ScrollView>
    </View>
  );
}

const monthlyStyles = StyleSheet.create({
  header: {
    flexDirection: "row",
    paddingBottom: 8,
    marginBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  col: {
    flex: 1,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  colLabel: {
    flex: 1.2,
  },
  colRight: {
    textAlign: "right",
    fontFamily: "Inter_500Medium",
  },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  header: { marginBottom: 24, gap: 2 },
  eyebrow: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  section: {
    paddingTop: 20,
    marginBottom: 4,
  },
  kpiGrid: { gap: 8 },
  kpiRow: { flexDirection: "row", gap: 8 },
  skeletonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  footerNote: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 8,
  },
});
