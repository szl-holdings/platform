import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { featherIcon, VesselIcon } from '@/components/VesselIcon';
import { useColors } from '@/hooks/useColors';
import { api, CACHE_KEYS, cacheGetStale, cacheSet, type VoyageEconomics } from '@/lib/fleet/api';

const STATUS_COLORS: Record<string, string> = {
  at_sea: '#22c55e',
  loading: '#0ea5e9',
  completed: '#8b5cf6',
  planned: '#64748b',
  cancelled: '#ef4444',
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function KpiCard({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
  icon: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <VesselIcon name={featherIcon(icon)} size={14} color={color} style={{ marginBottom: 6 }} />
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      <Text style={[styles.kpiLabel, { color: colors.textFaint }]}>{label}</Text>
      <Text style={[styles.kpiSub, { color: colors.textFaint }]}>{sub}</Text>
    </View>
  );
}

function MiniBarChart({ data, maxVal }: { data: number[]; maxVal: number }) {
  const colors = useColors();
  return (
    <View style={styles.miniChart}>
      {data.map((v, i) => (
        <View key={i} style={styles.miniBarWrap}>
          <View
            style={[
              styles.miniBar,
              {
                height: maxVal > 0 ? Math.max((v / maxVal) * 60, 2) : 2,
                backgroundColor: colors.primary,
              },
            ]}
          />
        </View>
      ))}
    </View>
  );
}

function VoyageCard({ voyage }: { voyage: VoyageEconomics }) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);
  const sc = STATUS_COLORS[voyage.status ?? ''] || colors.textFaint;
  const revenue = voyage.grossRevenue ?? 0;
  const costs = voyage.totalCostsUsd ?? 0;
  const margin = voyage.netMarginUsd ?? 0;
  const marginPct = (voyage.marginPct ?? 0) * 100;
  const tce = voyage.tcePerDay ?? 0;
  const fuel = voyage.fuelCostUsd ?? 0;
  const port = voyage.portCostsUsd ?? 0;
  const isPositive = margin >= 0;

  return (
    <TouchableOpacity
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.8}
      style={[styles.voyCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.voyHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.voyRef, { color: colors.text }]} numberOfLines={1}>
            {voyage.voyageRef || `Voyage #${voyage.voyageId}`}
          </Text>
          <Text style={[styles.voyRoute, { color: colors.textDim }]} numberOfLines={1}>
            {voyage.originPort || '—'} → {voyage.destination || '—'}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <View style={[styles.statusPill, { backgroundColor: `${sc}15`, borderColor: `${sc}30` }]}>
            <Text style={[styles.statusText, { color: sc }]}>
              {(voyage.status ?? '').replace('_', ' ')}
            </Text>
          </View>
          <Text style={[styles.voyRevenue, { color: colors.text }]}>
            {revenue > 0 ? fmt(revenue) : '—'}
          </Text>
        </View>
      </View>

      <View style={styles.voyMetrics}>
        {[
          { l: 'TCE/Day', v: tce > 0 ? fmt(tce) : '—', c: colors.primary },
          {
            l: 'Margin',
            v: marginPct !== 0 ? `${marginPct.toFixed(1)}%` : '—',
            c: isPositive ? colors.green : colors.red,
          },
          {
            l: 'Net',
            v: margin !== 0 ? fmt(Math.abs(margin)) : '—',
            c: isPositive ? colors.green : colors.red,
          },
          { l: 'Fuel', v: fuel > 0 ? fmt(fuel) : '—', c: colors.amber },
        ].map((m, i) => (
          <View key={i} style={[styles.metricItem, { backgroundColor: colors.surface }]}>
            <Text style={[styles.metricLabel, { color: colors.textFaint }]}>{m.l}</Text>
            <Text style={[styles.metricValue, { color: m.c }]}>{m.v}</Text>
          </View>
        ))}
      </View>

      {expanded && costs > 0 && (
        <View style={[styles.expanded, { borderTopColor: colors.border }]}>
          <Text style={[styles.expandTitle, { color: colors.textFaint }]}>COST BREAKDOWN</Text>
          {[
            { l: 'Fuel', v: fuel, c: colors.amber },
            { l: 'Port Costs', v: port, c: colors.primary },
            { l: 'Other OpEx', v: Math.max(costs - fuel - port, 0), c: colors.violet },
          ].map((item) => (
            <View key={item.l} style={styles.costRow}>
              <Text style={[styles.costLabel, { color: colors.textDim }]}>{item.l}</Text>
              <View style={styles.costBarWrap}>
                <View
                  style={[
                    styles.costBar,
                    {
                      width: `${costs > 0 ? Math.max((item.v / costs) * 100, 2) : 0}%`,
                      backgroundColor: item.c,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.costValue, { color: item.c }]}>{fmt(item.v)}</Text>
            </View>
          ))}
          {marginPct !== 0 && (
            <View style={styles.marginRow}>
              <View style={styles.marginBarWrap}>
                <View
                  style={[
                    styles.marginBar,
                    {
                      width: `${Math.min(Math.max(Math.abs(marginPct) * 2, 5), 95)}%`,
                      backgroundColor: isPositive ? colors.green : colors.red,
                    },
                  ]}
                />
              </View>
              <Text
                style={[styles.marginPctText, { color: isPositive ? colors.green : colors.red }]}
              >
                {isPositive ? '+' : ''}
                {marginPct.toFixed(1)}%
              </Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function EconomicsScreen() {
  const colors = useColors();
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'margin' | 'tce' | 'revenue'>('margin');
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: voyages = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['voyage-economics-mobile'],
    queryFn: async () => {
      try {
        const data = await api.voyageEconomics();
        await cacheSet(CACHE_KEYS.ECONOMICS, data);
        return data;
      } catch {
        return (await cacheGetStale<VoyageEconomics[]>(CACHE_KEYS.ECONOMICS)) ?? [];
      }
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const { data: analytics } = useQuery({
    queryKey: ['voyage-economics-analytics-mobile'],
    queryFn: () => api.economicsAnalytics(),
    staleTime: 300_000,
  });

  const filtered =
    statusFilter === 'all' ? voyages : voyages.filter((v) => v.status === statusFilter);
  const sorted = [...filtered].sort((a, b) => {
    const getVal = (v: VoyageEconomics) => {
      if (sortBy === 'margin') return v.netMarginUsd ?? 0;
      if (sortBy === 'tce') return v.tcePerDay ?? 0;
      return v.grossRevenue ?? 0;
    };
    return getVal(b) - getVal(a);
  });

  const totalRevenue = voyages.reduce((s, v) => s + (v.grossRevenue ?? 0), 0);
  const totalMargin = voyages.reduce((s, v) => s + (v.netMarginUsd ?? 0), 0);
  const tceVoyages = voyages.filter((v) => (v.tcePerDay ?? 0) > 0);
  const avgTce =
    tceVoyages.length > 0
      ? tceVoyages.reduce((s, v) => s + (v.tcePerDay ?? 0), 0) / tceVoyages.length
      : 0;
  const totalFuel = voyages.reduce((s, v) => s + (v.fuelCostUsd ?? 0), 0);

  const revenueData =
    (analytics?.revenueByMonth as Array<{ revenue: number }>)?.slice(-8)?.map((m) => m.revenue) ??
    [];
  const maxRev = Math.max(...revenueData, 1);

  const statusCounts = voyages.reduce<Record<string, number>>((acc, v) => {
    acc[v.status ?? 'unknown'] = (acc[v.status ?? 'unknown'] || 0) + 1;
    return acc;
  }, {});

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Voyage Economics</Text>
          <Text style={[styles.sub, { color: colors.textFaint }]}>{voyages.length} voyages</Text>
        </View>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(v) => String(v.id)}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <>
            <View style={styles.kpiGrid}>
              <KpiCard
                label="Fleet Revenue"
                value={fmt(totalRevenue)}
                sub={`${voyages.length} voyages`}
                color={colors.green}
                icon="dollar-sign"
              />
              <KpiCard
                label="Fleet Margin"
                value={fmt(totalMargin)}
                sub={
                  totalRevenue > 0 ? `${((totalMargin / totalRevenue) * 100).toFixed(1)}% avg` : '—'
                }
                color={colors.primary}
                icon="trending-up"
              />
              <KpiCard
                label="Avg Fleet TCE"
                value={avgTce > 0 ? fmt(avgTce) : '—'}
                sub="per day"
                color={colors.violet}
                icon="bar-chart-2"
              />
              <KpiCard
                label="Fuel Spend"
                value={fmt(totalFuel)}
                sub="total fleet"
                color={colors.amber}
                icon="zap"
              />
            </View>

            {revenueData.length > 0 && (
              <View
                style={[
                  styles.chartCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.chartTitle, { color: colors.textFaint }]}>
                  MONTHLY REVENUE (8-MONTH)
                </Text>
                <MiniBarChart data={revenueData} maxVal={maxRev} />
                <View style={styles.chartLegend}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                    <Text style={[styles.legendText, { color: colors.textFaint }]}>Revenue</Text>
                  </View>
                  <Text style={[styles.legendText, { color: colors.textFaint }]}>
                    {(analytics?.revenueByMonth as Array<unknown>)?.length} months
                  </Text>
                </View>
              </View>
            )}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterBar}
              contentContainerStyle={styles.filterContent}
            >
              {[
                { id: 'all', label: `All (${voyages.length})` },
                { id: 'at_sea', label: `At Sea (${statusCounts.at_sea || 0})` },
                { id: 'completed', label: `Completed (${statusCounts.completed || 0})` },
                { id: 'planned', label: `Planned (${statusCounts.planned || 0})` },
              ].map((f) => (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => setStatusFilter(f.id)}
                  style={[
                    styles.filterBtn,
                    {
                      backgroundColor: statusFilter === f.id ? colors.primaryDim : 'transparent',
                      borderColor: statusFilter === f.id ? colors.primaryBorder : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      { color: statusFilter === f.id ? colors.primary : colors.textDim },
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={[styles.filterBar, { marginTop: 6 }]}
              contentContainerStyle={styles.filterContent}
            >
              <Text style={[styles.sortLabel, { color: colors.textFaint }]}>Sort: </Text>
              {[
                { id: 'margin', l: 'Margin' },
                { id: 'tce', l: 'TCE' },
                { id: 'revenue', l: 'Revenue' },
              ].map((s) => (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => setSortBy(s.id as typeof sortBy)}
                  style={[
                    styles.filterBtn,
                    {
                      backgroundColor: sortBy === s.id ? colors.primaryDim : 'transparent',
                      borderColor: sortBy === s.id ? colors.primaryBorder : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      { color: sortBy === s.id ? colors.primary : colors.textDim },
                    ]}
                  >
                    {s.l}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {isLoading && (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
            )}
          </>
        }
        renderItem={({ item }) => <VoyageCard voyage={item} />}
        ListEmptyComponent={
          isLoading ? null : (
            <View style={styles.emptyState}>
              <VesselIcon name="dollar-sign" size={32} color={colors.textFaint} />
              <Text style={[styles.emptyText, { color: colors.textFaint }]}>No voyage data</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: { fontSize: 20, fontWeight: '700' as const, fontFamily: 'Inter_700Bold' },
  sub: { fontSize: 11, marginTop: 2, fontFamily: 'Inter_400Regular' },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  kpiCard: {
    width: '47%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  kpiValue: { fontSize: 18, fontWeight: '700' as const, fontFamily: 'Inter_700Bold' },
  kpiLabel: { fontSize: 10, marginTop: 2, fontFamily: 'Inter_500Medium' },
  kpiSub: { fontSize: 9, marginTop: 1, fontFamily: 'Inter_400Regular' },
  chartCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  chartTitle: { fontSize: 9, letterSpacing: 0.5, fontFamily: 'Inter_500Medium', marginBottom: 10 },
  miniChart: { flexDirection: 'row', alignItems: 'flex-end', height: 60, gap: 3 },
  miniBarWrap: { flex: 1, justifyContent: 'flex-end' },
  miniBar: { borderRadius: 3, opacity: 0.8, minHeight: 2 },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 9, fontFamily: 'Inter_400Regular' },
  filterBar: { marginTop: 10 },
  filterContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  sortLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', alignSelf: 'center' },
  listContent: { paddingHorizontal: 16, paddingBottom: 100, paddingTop: 10 },
  voyCard: { padding: 14, borderRadius: 12, borderWidth: 1 },
  voyHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  voyRef: { fontSize: 13, fontWeight: '600' as const, fontFamily: 'Inter_600SemiBold' },
  voyRoute: { fontSize: 11, marginTop: 2, fontFamily: 'Inter_400Regular' },
  voyRevenue: {
    fontSize: 14,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    marginTop: 4,
  },
  statusPill: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  statusText: { fontSize: 9, fontWeight: '600' as const, fontFamily: 'Inter_600SemiBold' },
  voyMetrics: { flexDirection: 'row', gap: 6 },
  metricItem: { flex: 1, padding: 8, borderRadius: 8, alignItems: 'center' },
  metricLabel: { fontSize: 9, fontFamily: 'Inter_400Regular' },
  metricValue: {
    fontSize: 12,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    marginTop: 2,
  },
  expanded: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, gap: 8 },
  expandTitle: { fontSize: 9, letterSpacing: 0.5, fontFamily: 'Inter_500Medium' },
  costRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  costLabel: { width: 60, fontSize: 10, fontFamily: 'Inter_400Regular' },
  costBarWrap: { flex: 1, height: 4, backgroundColor: 'rgba(14,165,233,0.1)', borderRadius: 2 },
  costBar: { height: 4, borderRadius: 2 },
  costValue: {
    width: 48,
    textAlign: 'right',
    fontSize: 10,
    fontWeight: '600' as const,
    fontFamily: 'Inter_600SemiBold',
  },
  marginRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  marginBarWrap: { flex: 1, height: 6, backgroundColor: 'rgba(14,165,233,0.1)', borderRadius: 3 },
  marginBar: { height: 6, borderRadius: 3 },
  marginPctText: { fontSize: 12, fontWeight: '700' as const, fontFamily: 'Inter_700Bold' },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
});
