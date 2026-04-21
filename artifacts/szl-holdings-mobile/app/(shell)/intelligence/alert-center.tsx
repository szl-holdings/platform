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
import {
  ENDPOINTS as ALERT_ENDPOINTS,
  computeTabBadges,
  filterCriticalSignals,
  normalizeApprovals,
  SEV_COLORS,
  type Severity,
  synthesizeStaleDomainAlerts,
} from './alert-center.logic';

const ACCENT = '#c9a84c';

interface FusionSignal {
  id: string;
  type: string;
  title: string;
  summary: string;
  severity: Severity;
  category: string;
  confidence: number;
  affectedDomains: string[];
  recommendedActions?: string[];
  timestamp: string;
  status: string;
}

interface Approval {
  id: number;
  title: string;
  description?: string;
  resourceType: string;
  status: string;
  priority: string;
  createdAt: string;
  expiresAt?: string;
}

interface DomainSnapshot {
  domain: string;
  entityCount: number;
  activeCount: number;
  healthScore: number;
  staleFraction: number;
  alerts?: Array<{ domain: string; message: string; severity: 'info' | 'warning' | 'critical' }>;
  summary: string;
}

interface BriefingResponse {
  generatedAt: string;
  overallHealthScore: number;
  domains: DomainSnapshot[];
  alerts: Array<{ domain: string; message: string; severity: 'info' | 'warning' | 'critical' }>;
}

const BRIEF_SEV_COLORS: Record<string, string> = {
  critical: '#ef4444',
  warning: '#f59e0b',
  info: '#6b7280',
};

const DOMAIN_META: Record<string, { label: string; icon: string; color: string }> = {
  vessels: { label: 'SEXTANT', icon: '⚓', color: '#0ea5e9' },
  aegis: { label: 'PARAGON', icon: '⬡', color: '#ef4444' },
  terra: { label: 'DOMAINE', icon: '⬢', color: '#22c55e' },
  lyte: { label: 'KORA', icon: '⚡', color: '#f59e0b' },
  prism: { label: 'PRISM', icon: '⚖', color: '#a855f7' },
  szl: { label: 'Portfolio', icon: '◆', color: '#c9a84c' },
  imperium: { label: 'Imperium', icon: '⬟', color: '#8b5cf6' },
  'carlota-jo': { label: 'Carlota', icon: '◇', color: '#ec4899' },
  platform: { label: 'Platform', icon: '◈', color: '#6b7280' },
};

function formatRelative(iso?: string): string {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function SignalAlertCard({
  signal,
  colors,
}: {
  signal: FusionSignal;
  colors: ReturnType<typeof useColors>;
}) {
  const [expanded, setExpanded] = useState(false);
  const sevColor = SEV_COLORS[signal.severity] ?? '#6b7280';

  return (
    <TouchableOpacity
      onPress={() => setExpanded((v) => !v)}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderLeftColor: sevColor,
          borderLeftWidth: 3,
        },
      ]}
      activeOpacity={0.85}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.sevDot, { backgroundColor: sevColor }]} />
        <View style={{ flex: 1, marginLeft: 8 }}>
          <View style={styles.cardMeta}>
            <View
              style={[
                styles.pill,
                { backgroundColor: sevColor + '18', borderColor: sevColor + '35' },
              ]}
            >
              <Text style={[styles.pillText, { color: sevColor }]}>
                {signal.severity.toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.cardTime, { color: colors.mutedForeground }]}>
              {formatRelative(signal.timestamp)}
            </Text>
          </View>
          <Text
            style={[styles.cardTitle, { color: colors.foreground }]}
            numberOfLines={expanded ? undefined : 2}
          >
            {signal.title}
          </Text>
          {!expanded && (
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]} numberOfLines={1}>
              {signal.summary}
            </Text>
          )}
          <View style={styles.domainRow}>
            {signal.affectedDomains.slice(0, 3).map((d) => {
              const meta = DOMAIN_META[d] ?? { label: d, icon: '◆', color: '#6b7280' };
              return (
                <View
                  key={d}
                  style={[
                    styles.domainPill,
                    { backgroundColor: meta.color + '15', borderColor: meta.color + '30' },
                  ]}
                >
                  <Text style={[styles.domainPillText, { color: meta.color }]}>
                    {meta.icon} {meta.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
        <Feather
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={colors.mutedForeground}
        />
      </View>

      {expanded && (
        <View style={styles.cardBody}>
          <Text style={[styles.summaryText, { color: colors.foreground }]}>{signal.summary}</Text>
          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>CATEGORY</Text>
            <Text style={[styles.metaValue, { color: colors.foreground }]}>{signal.category}</Text>
            <Text style={[styles.metaLabel, { color: colors.mutedForeground, marginLeft: 16 }]}>
              CONFIDENCE
            </Text>
            <Text style={[styles.metaValue, { color: colors.foreground }]}>
              {Math.round(signal.confidence * 100)}%
            </Text>
          </View>
          {signal.recommendedActions && signal.recommendedActions.length > 0 && (
            <View
              style={[
                styles.actionsBox,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.actionsLabel, { color: colors.mutedForeground }]}>
                RECOMMENDED ACTIONS
              </Text>
              {signal.recommendedActions.map((a, i) => (
                <Text key={i} style={[styles.actionItem, { color: colors.foreground }]}>
                  • {a}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

function EscalationCard({
  approval,
  colors,
}: {
  approval: Approval;
  colors: ReturnType<typeof useColors>;
}) {
  const prioColors: Record<string, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#f59e0b',
    low: '#6b7280',
  };
  const prioColor = prioColors[approval.priority] ?? '#6b7280';
  const expiringMs = approval.expiresAt
    ? new Date(approval.expiresAt).getTime() - Date.now()
    : null;
  const expiringSoon = expiringMs !== null && expiringMs < 2 * 3600 * 1000 && expiringMs > 0;

  return (
    <TouchableOpacity
      onPress={() => router.navigate('/(shell)/intelligence/approval-inbox' as '/')}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderLeftColor: prioColor,
          borderLeftWidth: 3,
        },
      ]}
      activeOpacity={0.85}
    >
      <View style={styles.cardHeader}>
        <Feather name="alert-triangle" size={14} color={prioColor} style={{ marginTop: 2 }} />
        <View style={{ flex: 1, marginLeft: 8 }}>
          <View style={styles.cardMeta}>
            <View style={[styles.pill, { backgroundColor: '#ef444418', borderColor: '#ef444435' }]}>
              <Text style={[styles.pillText, { color: '#ef4444' }]}>ESCALATED</Text>
            </View>
            <View
              style={[
                styles.pill,
                { backgroundColor: prioColor + '18', borderColor: prioColor + '35' },
              ]}
            >
              <Text style={[styles.pillText, { color: prioColor }]}>
                {approval.priority.toUpperCase()}
              </Text>
            </View>
            {expiringSoon && (
              <View
                style={[styles.pill, { backgroundColor: '#ef444415', borderColor: '#ef444435' }]}
              >
                <Text style={[styles.pillText, { color: '#ef4444' }]}>EXPIRING SOON</Text>
              </View>
            )}
          </View>
          <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>
            {approval.title}
          </Text>
          <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
            {approval.resourceType} · {formatRelative(approval.createdAt)}
          </Text>
        </View>
        <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
      </View>
    </TouchableOpacity>
  );
}

function WorldModelAlert({
  alert: a,
  colors,
}: {
  alert: { domain: string; message: string; severity: 'info' | 'warning' | 'critical' };
  colors: ReturnType<typeof useColors>;
}) {
  const sevColor = BRIEF_SEV_COLORS[a.severity] ?? '#6b7280';
  const domMeta = DOMAIN_META[a.domain] ?? { label: a.domain, icon: '◆', color: '#6b7280' };

  return (
    <View
      style={[
        styles.wmAlert,
        {
          backgroundColor: sevColor + '10',
          borderColor: sevColor + '30',
          borderLeftColor: sevColor,
          borderLeftWidth: 3,
        },
      ]}
    >
      <View style={styles.wmAlertHeader}>
        <Text style={[styles.wmDomain, { color: domMeta.color }]}>
          {domMeta.icon} {domMeta.label}
        </Text>
        <View
          style={[styles.pill, { backgroundColor: sevColor + '18', borderColor: sevColor + '35' }]}
        >
          <Text style={[styles.pillText, { color: sevColor }]}>{a.severity.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={[styles.wmMessage, { color: colors.foreground }]}>{a.message}</Text>
    </View>
  );
}

type TabKey = 'signals' | 'escalations' | 'world-model';

export default function AlertCenterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('signals');

  const signalsQuery = useQuery<{ signals: FusionSignal[]; stats: Record<string, number> }>({
    queryKey: ['alert-center-signals'],
    queryFn: () =>
      apiFetch<{ signals: FusionSignal[]; stats: Record<string, number> }>(ALERT_ENDPOINTS.signals),
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const escalationsQuery = useQuery<{ data: Approval[] } | Approval[]>({
    queryKey: ['alert-center-escalations'],
    queryFn: () => apiFetch<{ data: Approval[] } | Approval[]>(ALERT_ENDPOINTS.escalations),
    refetchInterval: 30000,
  });

  const briefingQuery = useQuery<BriefingResponse>({
    queryKey: ['alert-center-briefing'],
    queryFn: () => apiFetch<BriefingResponse>(ALERT_ENDPOINTS.briefing),
    refetchInterval: 120000,
    staleTime: 60000,
  });

  const signals = signalsQuery.data?.signals ?? [];
  const criticalSignals = filterCriticalSignals(signals);
  const escalations = normalizeApprovals<Approval>(escalationsQuery.data);
  const briefing = briefingQuery.data;
  const worldModelAlerts = briefing?.alerts ?? [];
  const staleDomainAlerts = synthesizeStaleDomainAlerts(briefing);
  // Note: local-push fallback for newly-escalated approvals is emitted by the
  // app-level `useEscalatedApprovalNotifier` hook in `app/_layout.tsx` so it
  // fires even when this screen is not mounted.

  const handleRefresh = () => {
    signalsQuery.refetch();
    escalationsQuery.refetch();
    briefingQuery.refetch();
  };

  const badges = computeTabBadges(criticalSignals, escalations, worldModelAlerts);
  const TABS: Array<{ key: TabKey; label: string; badge?: number }> = [
    { key: 'signals', label: 'Signals', badge: badges.signals },
    { key: 'escalations', label: 'Escalations', badge: badges.escalations },
    { key: 'world-model', label: 'World Model', badge: badges.worldModel },
  ];

  const isLoading = signalsQuery.isLoading && escalationsQuery.isLoading && briefingQuery.isLoading;
  const isRefetching =
    signalsQuery.isRefetching || escalationsQuery.isRefetching || briefingQuery.isRefetching;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={18} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Alert Center</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Verifier escalations &amp; world-model changes
          </Text>
        </View>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshBtn}>
          <Feather name="refresh-cw" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {briefing && (
        <View
          style={[
            styles.healthBar,
            { borderBottomColor: colors.border, backgroundColor: colors.card },
          ]}
        >
          <View style={styles.healthItem}>
            <Text style={[styles.healthLabel, { color: colors.mutedForeground }]}>HEALTH</Text>
            <Text
              style={[
                styles.healthValue,
                {
                  color:
                    briefing.overallHealthScore >= 0.8
                      ? '#22c55e'
                      : briefing.overallHealthScore >= 0.5
                        ? '#f59e0b'
                        : '#ef4444',
                },
              ]}
            >
              {Math.round(briefing.overallHealthScore * 100)}%
            </Text>
          </View>
          <View style={[styles.healthDivider, { backgroundColor: colors.border }]} />
          <View style={styles.healthItem}>
            <Text style={[styles.healthLabel, { color: colors.mutedForeground }]}>SIGNALS</Text>
            <Text
              style={[
                styles.healthValue,
                { color: criticalSignals.length > 0 ? '#ef4444' : '#22c55e' },
              ]}
            >
              {criticalSignals.length} crit
            </Text>
          </View>
          <View style={[styles.healthDivider, { backgroundColor: colors.border }]} />
          <View style={styles.healthItem}>
            <Text style={[styles.healthLabel, { color: colors.mutedForeground }]}>PENDING</Text>
            <Text
              style={[
                styles.healthValue,
                { color: escalations.length > 0 ? '#f59e0b' : colors.foreground },
              ]}
            >
              {escalations.length} approvals
            </Text>
          </View>
          <View style={[styles.healthDivider, { backgroundColor: colors.border }]} />
          <View style={styles.healthItem}>
            <Text style={[styles.healthLabel, { color: colors.mutedForeground }]}>DOMAINS</Text>
            <Text style={[styles.healthValue, { color: colors.foreground }]}>
              {briefing.domains.length}
            </Text>
          </View>
        </View>
      )}

      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[
              styles.tabItem,
              activeTab === tab.key && [styles.tabItemActive, { borderBottomColor: ACCENT }],
            ]}
          >
            <View style={styles.tabLabelRow}>
              <Text
                style={[
                  styles.tabLabel,
                  { color: activeTab === tab.key ? ACCENT : colors.mutedForeground },
                ]}
              >
                {tab.label}
              </Text>
              {(tab.badge ?? 0) > 0 && (
                <View style={[styles.tabBadge, { backgroundColor: '#ef4444' }]}>
                  <Text style={styles.tabBadgeText}>{tab.badge}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} tintColor={ACCENT} />
        }
      >
        {isLoading ? (
          <ActivityIndicator color={ACCENT} style={{ marginTop: 32 }} />
        ) : activeTab === 'signals' ? (
          criticalSignals.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="check-circle" size={32} color="#22c55e" />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No critical or high signals
              </Text>
              <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                All systems nominal
              </Text>
            </View>
          ) : (
            criticalSignals.map((signal) => (
              <SignalAlertCard key={signal.id} signal={signal} colors={colors} />
            ))
          )
        ) : activeTab === 'escalations' ? (
          escalations.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="inbox" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No escalated approvals
              </Text>
              <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                All clear — verifier queue is empty
              </Text>
            </View>
          ) : (
            escalations.map((approval) => (
              <EscalationCard key={approval.id} approval={approval} colors={colors} />
            ))
          )
        ) : worldModelAlerts.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="globe" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No world-model alerts
            </Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Constellation is healthy across all domains
            </Text>
          </View>
        ) : (
          <>
            {briefing && (
              <Text style={[styles.wmGeneratedAt, { color: colors.mutedForeground }]}>
                World-model snapshot · {new Date(briefing.generatedAt).toLocaleTimeString()}
              </Text>
            )}
            {worldModelAlerts.map((a, i) => (
              <WorldModelAlert key={i} alert={a} colors={colors} />
            ))}
            {staleDomainAlerts.map((a) => (
              <WorldModelAlert key={`stale-${a.domain}`} alert={a} colors={colors} />
            ))}
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
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { marginRight: 10, padding: 4 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  headerSub: { fontSize: 11, marginTop: 1 },
  refreshBtn: { padding: 8 },
  healthBar: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  healthItem: { flex: 1, alignItems: 'center' },
  healthLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5, marginBottom: 2 },
  healthValue: { fontSize: 12, fontWeight: '700' },
  healthDivider: { width: 1, marginVertical: 2 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tabItem: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabItemActive: { borderBottomWidth: 2 },
  tabLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  tabLabel: { fontSize: 12, fontWeight: '600' },
  tabBadge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: { fontSize: 9, fontWeight: '700', color: '#ffffff' },
  scroll: { flex: 1 },
  scrollContent: { padding: 14, gap: 10 },
  card: { borderRadius: 10, borderWidth: 1, padding: 14, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  sevDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  cardMeta: { flexDirection: 'row', gap: 6, marginBottom: 5, flexWrap: 'wrap' },
  pill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  cardTime: { fontSize: 10, marginTop: 1 },
  cardTitle: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  cardSub: { fontSize: 11, marginTop: 3 },
  domainRow: { flexDirection: 'row', gap: 5, marginTop: 6, flexWrap: 'wrap' },
  domainPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  domainPillText: { fontSize: 10 },
  cardBody: { marginTop: 12, gap: 10 },
  summaryText: { fontSize: 13, lineHeight: 19 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  metaValue: { fontSize: 12, fontWeight: '500', marginLeft: 5 },
  actionsBox: { borderRadius: 8, borderWidth: 1, padding: 10, gap: 4 },
  actionsLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  actionItem: { fontSize: 11, lineHeight: 16 },
  wmAlert: { borderRadius: 8, borderWidth: 1, padding: 12, marginBottom: 0 },
  wmAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  wmDomain: { fontSize: 12, fontWeight: '700' },
  wmMessage: { fontSize: 13, lineHeight: 18 },
  wmGeneratedAt: { fontSize: 11, marginBottom: 8 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 15, fontWeight: '500' },
  emptySub: { fontSize: 12 },
});
