import { Feather } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { apiFetch } from '@/lib/apiClient';

const ACCENT = '#c9a84c';

async function apiGet<T>(path: string): Promise<T> {
  const raw = await apiFetch<{ data: T } | T>(path, { method: 'GET' });
  return (raw as { data: T })?.data ?? (raw as T);
}

type MeResponse = { orgs?: { slug: string; name: string; role: string }[] };

type UsageSummary = {
  org: { id: number; name: string; slug: string; plan: string };
  period: { from: string; to: string };
  summary: {
    totalMembers: number;
    activeUsers: number;
    apiCalls: number;
    storageBytes: number;
    storageMB: number;
  };
  featureUtilization: { feature: string; quantity: number; events: number }[];
};

const PERIOD_OPTIONS = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
];

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtBytes(bytes: number) {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

export default function UsageScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [days, setDays] = useState(30);

  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const to = new Date().toISOString();

  const defaultOrgQuery = useQuery<{ orgs: { slug: string }[] }>({
    queryKey: ['mobile-user-orgs'],
    queryFn: () => apiGet<MeResponse>('/api/auth/me').then((user) => ({ orgs: user.orgs ?? [] })),
  });

  const orgSlug = defaultOrgQuery.data?.orgs?.[0]?.slug ?? '';

  const usageQuery = useQuery<UsageSummary>({
    queryKey: ['mobile-usage', orgSlug, days],
    queryFn: () => apiGet<UsageSummary>(`/api/orgs/${orgSlug}/usage?from=${from}&to=${to}`),
    enabled: !!orgSlug,
    staleTime: 60_000,
  });

  const summary = usageQuery.data?.summary;
  const features = usageQuery.data?.featureUtilization ?? [];

  const STAT_CARDS = [
    {
      label: 'Active Users',
      value: summary ? fmt(summary.activeUsers) : '—',
      icon: 'users' as const,
      color: '#6366f1',
      sub: `of ${summary ? fmt(summary.totalMembers) : '—'}`,
    },
    {
      label: 'API Calls',
      value: summary ? fmt(summary.apiCalls) : '—',
      icon: 'activity' as const,
      color: ACCENT,
      sub: `last ${days} days`,
    },
    {
      label: 'Storage',
      value: summary ? fmtBytes(summary.storageBytes) : '—',
      icon: 'hard-drive' as const,
      color: '#10b981',
      sub: 'used',
    },
    {
      label: 'Features',
      value: String(features.length),
      icon: 'zap' as const,
      color: '#f59e0b',
      sub: 'active',
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerText, { color: colors.foreground }]}>Usage Dashboard</Text>
          {usageQuery.data?.org?.name && (
            <Text style={[styles.orgName, { color: colors.muted }]}>
              {usageQuery.data.org.name}
            </Text>
          )}
        </View>
        <View style={styles.periodPicker}>
          {PERIOD_OPTIONS.map((p) => (
            <TouchableOpacity
              key={p.days}
              style={[styles.periodBtn, days === p.days && styles.periodBtnActive]}
              onPress={() => setDays(p.days)}
            >
              <Text
                style={[styles.periodBtnText, { color: days === p.days ? '#000' : colors.muted }]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={usageQuery.isFetching}
            onRefresh={() => qc.invalidateQueries({ queryKey: ['mobile-usage', orgSlug, days] })}
            tintColor={ACCENT}
          />
        }
      >
        {usageQuery.isLoading || defaultOrgQuery.isLoading ? (
          <ActivityIndicator color={ACCENT} style={{ marginTop: 40 }} />
        ) : !orgSlug ? (
          <View style={styles.empty}>
            <Feather name="bar-chart-2" size={32} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>No organization found</Text>
          </View>
        ) : (
          <>
            <View style={styles.statsGrid}>
              {STAT_CARDS.map((card) => (
                <View
                  key={card.label}
                  style={[
                    styles.statCard,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <View style={[styles.statIcon, { backgroundColor: `${card.color}20` }]}>
                    <Feather name={card.icon} size={16} color={card.color} />
                  </View>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>{card.value}</Text>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>{card.label}</Text>
                  <Text style={[styles.statSub, { color: colors.muted }]}>{card.sub}</Text>
                </View>
              ))}
            </View>

            {features.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.muted }]}>
                  FEATURE UTILIZATION
                </Text>
                {features.slice(0, 10).map((f) => {
                  const max = Math.max(...features.map((x) => x.quantity), 1);
                  const pct = (f.quantity / max) * 100;
                  return (
                    <View
                      key={f.feature}
                      style={[
                        styles.featureRow,
                        { backgroundColor: colors.card, borderColor: colors.border },
                      ]}
                    >
                      <View style={styles.featureInfo}>
                        <Text
                          style={[styles.featureName, { color: colors.foreground }]}
                          numberOfLines={1}
                        >
                          {f.feature}
                        </Text>
                        <View style={styles.featureBar}>
                          <View
                            style={[
                              styles.featureBarFill,
                              { width: `${pct}%`, backgroundColor: ACCENT },
                            ]}
                          />
                        </View>
                      </View>
                      <Text style={[styles.featureCount, { color: ACCENT }]}>
                        {fmt(f.quantity)}
                      </Text>
                    </View>
                  );
                })}
              </>
            )}

            {features.length === 0 && (
              <View style={styles.empty}>
                <Feather name="activity" size={32} color={colors.muted} />
                <Text style={[styles.emptyText, { color: colors.muted }]}>No usage data yet</Text>
                <Text style={[styles.emptySub, { color: colors.muted }]}>
                  Usage events will appear as your team works
                </Text>
              </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 4 },
  headerText: { fontSize: 17, fontWeight: '600' },
  orgName: { fontSize: 11, marginTop: 1 },
  periodPicker: { flexDirection: 'row', gap: 4 },
  periodBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  periodBtnActive: { backgroundColor: ACCENT },
  periodBtnText: { fontSize: 11, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  statCard: {
    width: '47%',
    padding: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: { fontSize: 22, fontWeight: '700', fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  statSub: { fontSize: 10, marginTop: 1 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 4,
    marginBottom: 4,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 6,
  },
  featureInfo: { flex: 1 },
  featureName: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  featureBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  featureBarFill: { height: '100%', borderRadius: 2 },
  featureCount: { fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  empty: { alignItems: 'center', paddingTop: 50, gap: 10 },
  emptyText: { fontSize: 14, fontWeight: '600' },
  emptySub: { fontSize: 12, textAlign: 'center' },
});
