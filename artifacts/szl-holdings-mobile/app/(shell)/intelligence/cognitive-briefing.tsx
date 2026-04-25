import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
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
import { TAB_BAR_HEIGHT } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import { apiFetch } from '@/lib/apiClient';

const ACCENT = '#c9a84c';

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
  urgency: 'critical' | 'urgent' | 'moderate' | 'low' | string;
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

interface BottleneckOwner {
  owner: string;
  bottlenecks: number;
  var: number;
  ageHours: number;
  items: string[];
  escalationCount: number;
  urgencyScore: number;
  level: string;
}

interface BottlenecksResponse {
  totalBottlenecks: number;
  blockedItems: number;
  stalledActions: number;
  openEscalations: number;
  criticalSignals: number;
  totalVaR: number;
  rankedByOwner: BottleneckOwner[];
  byDomain: Record<string, { count: number; var: number; level: string }>;
  fetchedAt: string;
}

interface AccountabilityOwner {
  owner: string;
  ownerConfidence: 'owned' | 'contested' | 'gap';
  bottlenecks: Array<{ id: number; title: string; type: string; var: number }>;
  interventions: Array<{
    id: number;
    title: string;
    category: string;
    priority: string;
    state: string;
  }>;
  incidents: Array<{ id: number; title: string; severity: string }>;
  escalationPath: Array<{
    escalationId: number;
    title: string;
    severity: string;
    assignedTo: string | null;
  }>;
  totalVaR: number;
  urgencyScore: number;
}

interface AccountabilityResponse {
  ownerCount: number;
  ownershipGaps: { count: number; estimatedVaR: number };
  totalVaRMapped: number;
  accountabilityMap: AccountabilityOwner[];
  fetchedAt: string;
}

const DOMAIN_META: Record<string, { label: string; icon: string; color: string }> = {
  vessels: { label: 'Vessels', icon: '⚓', color: '#0ea5e9' },
  aegis: { label: 'Aegis', icon: '⬡', color: '#ef4444' },
  firestorm: { label: 'Aegis', icon: '⬡', color: '#ef4444' },
  terra: { label: 'Terra', icon: '⬢', color: '#22c55e' },
  lyte: { label: 'Lyte', icon: '⚡', color: '#f59e0b' },
  prism: { label: 'PRISM', icon: '⚖', color: '#a855f7' },
  szl: { label: 'Portfolio', icon: '◆', color: '#c9a84c' },
  operations: { label: 'Operations', icon: '◇', color: '#8b7ac8' },
  signals: { label: 'Signals', icon: '◈', color: '#6366f1' },
  compliance: { label: 'Compliance', icon: '⚖', color: '#a855f7' },
  finance: { label: 'Finance', icon: '$', color: '#10b981' },
};

function domainMeta(domain: string) {
  return DOMAIN_META[domain] ?? { label: domain, icon: '◆', color: '#6b7280' };
}

const URGENCY_COLOR: Record<string, string> = {
  critical: '#ef4444',
  urgent: '#f97316',
  moderate: '#f59e0b',
  low: '#3b82f6',
};

function urgencyColor(u: string): string {
  return URGENCY_COLOR[u] ?? '#6b7280';
}

function levelColor(level: string): string {
  return (
    URGENCY_COLOR[level] ??
    URGENCY_COLOR[level === 'high' ? 'urgent' : level === 'medium' ? 'moderate' : 'low'] ??
    '#6b7280'
  );
}

function confidenceColor(c: AccountabilityOwner['ownerConfidence']): string {
  if (c === 'owned') return '#22c55e';
  if (c === 'contested') return '#f59e0b';
  return '#ef4444';
}

function formatUsd(n: number): string {
  if (!n) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

function formatAge(hours: number): string {
  if (hours < 1) return '<1h';
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
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
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderLeftColor: uColor,
          borderLeftWidth: 3,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.rankBadge}>
          <Text style={[styles.rankBadgeText, { color: ACCENT }]}>#{rank}</Text>
        </View>
        <View
          style={[
            styles.domainPill,
            { backgroundColor: `${meta.color}18`, borderColor: `${meta.color}35` },
          ]}
        >
          <Text style={[styles.domainPillText, { color: meta.color }]}>
            {meta.icon} {meta.label}
          </Text>
        </View>
        <View
          style={[
            styles.urgencyChip,
            { backgroundColor: `${uColor}18`, borderColor: `${uColor}35` },
          ]}
        >
          <Text style={[styles.urgencyChipText, { color: uColor }]}>
            {item.urgency.toUpperCase()}
          </Text>
        </View>
        {approval && (
          <View
            style={[
              styles.approvalChip,
              { backgroundColor: `${ACCENT}18`, borderColor: `${ACCENT}35` },
            ]}
          >
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
          <Text style={[styles.statValue, { color: colors.foreground }]}>
            {item.sourceSignalCount}
          </Text>
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
        <View
          style={[
            styles.varDomainIcon,
            { backgroundColor: `${meta.color}18`, borderColor: `${meta.color}35` },
          ]}
        >
          <Text style={[styles.varDomainIconText, { color: meta.color }]}>{meta.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.varDomainLabel, { color: colors.foreground }]}>{meta.label}</Text>
          <Text style={[styles.varDomainSub, { color: colors.mutedForeground }]}>
            {data.count} item{data.count === 1 ? '' : 's'} · {pct.toFixed(0)}% of exposure
          </Text>
        </View>
        <Text style={[styles.varAmount, { color: meta.color }]}>{formatUsd(data.var)}</Text>
      </View>
      <View style={[styles.varBarTrack, { backgroundColor: `${colors.border}60` }]}>
        <View style={[styles.varBarFill, { width: `${pct}%`, backgroundColor: meta.color }]} />
      </View>
    </View>
  );
}

function BottleneckOwnerCard({
  item,
  rank,
  colors,
}: {
  item: BottleneckOwner;
  rank: number;
  colors: ReturnType<typeof useColors>;
}) {
  const lColor = levelColor(item.level);
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderLeftColor: lColor,
          borderLeftWidth: 3,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.rankBadge}>
          <Text style={[styles.rankBadgeText, { color: ACCENT }]}>#{rank}</Text>
        </View>
        <Text style={[styles.ownerName, { color: colors.foreground }]} numberOfLines={1}>
          {item.owner}
        </Text>
        <View
          style={[
            styles.urgencyChip,
            { backgroundColor: `${lColor}18`, borderColor: `${lColor}35` },
          ]}
        >
          <Text style={[styles.urgencyChipText, { color: lColor }]}>
            {item.level.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.cardStatsRow}>
        <View style={styles.statBlock}>
          <Text style={[styles.statValue, { color: lColor }]}>{formatUsd(item.var)}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>VALUE AT RISK</Text>
        </View>
        <View style={styles.statBlock}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>{item.bottlenecks}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>STALLED</Text>
        </View>
        <View style={styles.statBlock}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>
            {formatAge(item.ageHours)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>OLDEST AGE</Text>
        </View>
        <View style={styles.statBlock}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>
            {item.escalationCount}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>ESCALATIONS</Text>
        </View>
      </View>

      {item.items.length > 0 && (
        <View style={styles.itemsList}>
          {item.items.slice(0, 3).map((label, idx) => (
            <Text
              key={idx}
              style={[styles.itemLine, { color: colors.mutedForeground }]}
              numberOfLines={1}
            >
              • {label}
            </Text>
          ))}
          {item.items.length > 3 && (
            <Text style={[styles.itemLine, { color: colors.mutedForeground }]}>
              + {item.items.length - 3} more
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

function AccountabilityOwnerCard({
  item,
  rank,
  colors,
}: {
  item: AccountabilityOwner;
  rank: number;
  colors: ReturnType<typeof useColors>;
}) {
  const cColor = confidenceColor(item.ownerConfidence);
  const urgentInterventions = item.interventions.filter((i) => i.priority === 'urgent').length;
  const criticalIncidents = item.incidents.filter((i) => i.severity === 'critical').length;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderLeftColor: cColor,
          borderLeftWidth: 3,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.rankBadge}>
          <Text style={[styles.rankBadgeText, { color: ACCENT }]}>#{rank}</Text>
        </View>
        <Text style={[styles.ownerName, { color: colors.foreground }]} numberOfLines={1}>
          {item.owner}
        </Text>
        <View
          style={[
            styles.urgencyChip,
            { backgroundColor: `${cColor}18`, borderColor: `${cColor}35` },
          ]}
        >
          <Text style={[styles.urgencyChipText, { color: cColor }]}>
            {item.ownerConfidence.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.cardStatsRow}>
        <View style={styles.statBlock}>
          <Text style={[styles.statValue, { color: cColor }]}>{formatUsd(item.totalVaR)}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>VALUE AT RISK</Text>
        </View>
        <View style={styles.statBlock}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>
            {item.interventions.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>ACTIONS</Text>
        </View>
        <View style={styles.statBlock}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>
            {item.bottlenecks.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>BLOCKERS</Text>
        </View>
        <View style={styles.statBlock}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>
            {item.incidents.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>INCIDENTS</Text>
        </View>
      </View>

      {(urgentInterventions > 0 || criticalIncidents > 0) && (
        <View style={styles.alertChipRow}>
          {urgentInterventions > 0 && (
            <View
              style={[styles.alertChip, { backgroundColor: '#f9731618', borderColor: '#f9731635' }]}
            >
              <Text style={[styles.alertChipText, { color: '#f97316' }]}>
                {urgentInterventions} URGENT
              </Text>
            </View>
          )}
          {criticalIncidents > 0 && (
            <View
              style={[styles.alertChip, { backgroundColor: '#ef444418', borderColor: '#ef444435' }]}
            >
              <Text style={[styles.alertChipText, { color: '#ef4444' }]}>
                {criticalIncidents} CRITICAL
              </Text>
            </View>
          )}
        </View>
      )}

      {item.escalationPath.length > 0 && (
        <View style={styles.itemsList}>
          <Text style={[styles.itemSectionLabel, { color: colors.mutedForeground }]}>
            ESCALATION PATH
          </Text>
          {item.escalationPath.slice(0, 3).map((esc) => {
            const sColor = urgencyColor(esc.severity);
            return (
              <View key={esc.escalationId} style={styles.escalationRow}>
                <Feather name="arrow-up-right" size={11} color={sColor} />
                <Text
                  style={[styles.itemLine, { color: colors.foreground, flex: 1 }]}
                  numberOfLines={1}
                >
                  {esc.title}
                </Text>
                <Text style={[styles.itemLine, { color: sColor, fontWeight: '700' }]}>
                  {esc.severity.toUpperCase()}
                </Text>
              </View>
            );
          })}
          {item.escalationPath.length > 3 && (
            <Text style={[styles.itemLine, { color: colors.mutedForeground }]}>
              + {item.escalationPath.length - 3} more escalations
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

type Tab = 'overview' | 'bottlenecks' | 'accountability';

const TABS: Array<{ id: Tab; label: string; icon: keyof typeof Feather.glyphMap }> = [
  { id: 'overview', label: 'Overview', icon: 'trending-up' },
  { id: 'bottlenecks', label: 'Bottlenecks', icon: 'alert-octagon' },
  { id: 'accountability', label: 'Accountability', icon: 'users' },
];

export default function CognitiveBriefingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('overview');

  const interventionsQuery = useQuery<InterventionsResponse>({
    queryKey: ['cognitive-briefing-interventions'],
    queryFn: () => apiFetch<InterventionsResponse>('/api/lyte/cognitive/interventions?limit=5'),
    refetchInterval: 2 * 60 * 1000,
    staleTime: 60 * 1000,
    retry: 1,
  });

  const varQuery = useQuery<ValueAtRiskResponse>({
    queryKey: ['cognitive-briefing-var'],
    queryFn: () => apiFetch<ValueAtRiskResponse>('/api/lyte/cognitive/value-at-risk?days=30'),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  const bottlenecksQuery = useQuery<BottlenecksResponse>({
    queryKey: ['cognitive-briefing-bottlenecks'],
    queryFn: () => apiFetch<BottlenecksResponse>('/api/lyte/cognitive/bottlenecks'),
    refetchInterval: 2 * 60 * 1000,
    staleTime: 60 * 1000,
    retry: 1,
    enabled: tab === 'bottlenecks',
  });

  const accountabilityQuery = useQuery<AccountabilityResponse>({
    queryKey: ['cognitive-briefing-accountability'],
    queryFn: () => apiFetch<AccountabilityResponse>('/api/lyte/cognitive/accountability-map'),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
    retry: 1,
    enabled: tab === 'accountability',
  });

  const handleRefresh = () => {
    interventionsQuery.refetch();
    varQuery.refetch();
    if (tab === 'bottlenecks' || tab === 'overview') bottlenecksQuery.refetch();
    if (tab === 'accountability') accountabilityQuery.refetch();
  };

  const isRefetching =
    interventionsQuery.isRefetching ||
    varQuery.isRefetching ||
    bottlenecksQuery.isRefetching ||
    accountabilityQuery.isRefetching;

  const interventions = (interventionsQuery.data?.interventions ?? []).slice(0, 5);
  const varData = varQuery.data;
  const bottlenecks = bottlenecksQuery.data;
  const accountability = accountabilityQuery.data;

  const rankedDomains = varData
    ? Object.entries(varData.byDomain ?? {})
        .map(([domain, data]) => ({ domain, data }))
        .sort((a, b) => b.data.var - a.data.var)
    : [];

  const rankedDomainBottlenecks = bottlenecks
    ? Object.entries(bottlenecks.byDomain ?? {})
        .map(([domain, data]) => ({ domain, data }))
        .sort((a, b) => b.data.var - a.data.var)
    : [];

  const overviewLoading = interventionsQuery.isLoading && varQuery.isLoading;
  const bottlenecksLoading = bottlenecksQuery.isLoading;
  const accountabilityLoading = accountabilityQuery.isLoading;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={18} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerRow}>
            <View style={styles.liveIndicator} />
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              Cognitive Briefing
            </Text>
          </View>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Interventions · Bottlenecks · Accountability
          </Text>
        </View>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshBtn}>
          <Feather name="refresh-cw" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              style={[styles.tabBtn, active && { borderBottomColor: ACCENT }]}
              onPress={() => setTab(t.id)}
            >
              <Feather name={t.icon} size={13} color={active ? ACCENT : colors.mutedForeground} />
              <Text style={[styles.tabLabel, { color: active ? ACCENT : colors.mutedForeground }]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} tintColor={ACCENT} />
        }
      >
        {tab === 'overview' &&
          (overviewLoading ? (
            <ActivityIndicator color={ACCENT} style={{ marginTop: 32 }} />
          ) : (
            <>
              {varData && (
                <View
                  style={[
                    styles.summaryCard,
                    { backgroundColor: '#0a0a0a', borderColor: `${ACCENT}30` },
                  ]}
                >
                  <Text style={styles.summaryLabel}>
                    TOTAL VALUE AT RISK · {varData.periodDays}D
                  </Text>
                  <Text style={styles.summaryValue}>{formatUsd(varData.totalVaR)}</Text>
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryStat}>
                      <Text style={[styles.summaryStatValue, { color: '#ef4444' }]}>
                        {formatUsd(varData.criticalExposure)}
                      </Text>
                      <Text style={styles.summaryStatLabel}>CRITICAL</Text>
                    </View>
                    <View style={styles.summaryStat}>
                      <Text style={[styles.summaryStatValue, { color: '#f97316' }]}>
                        {formatUsd(varData.highExposure)}
                      </Text>
                      <Text style={styles.summaryStatLabel}>HIGH</Text>
                    </View>
                    <View style={styles.summaryStat}>
                      <Text style={[styles.summaryStatValue, { color: '#9ca3af' }]}>
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
                <View
                  style={[
                    styles.errorCard,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
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
                  <Text
                    style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 16 }]}
                  >
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
                  Updated{' '}
                  {new Date(
                    interventionsQuery.data?.evaluatedAt ??
                      varData?.fetchedAt ??
                      new Date().toISOString(),
                  ).toLocaleString()}
                </Text>
              )}
            </>
          ))}

        {tab === 'bottlenecks' &&
          (bottlenecksLoading ? (
            <ActivityIndicator color={ACCENT} style={{ marginTop: 32 }} />
          ) : bottlenecksQuery.isError ? (
            <View
              style={[
                styles.errorCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Feather name="alert-circle" size={14} color="#ef4444" />
              <Text style={[styles.errorText, { color: colors.mutedForeground }]}>
                Could not load bottlenecks. Pull to retry.
              </Text>
            </View>
          ) : bottlenecks ? (
            <>
              <View
                style={[
                  styles.summaryCard,
                  { backgroundColor: '#0a0a0a', borderColor: `${ACCENT}30` },
                ]}
              >
                <Text style={styles.summaryLabel}>STALLED VALUE AT RISK</Text>
                <Text style={styles.summaryValue}>{formatUsd(bottlenecks.totalVaR)}</Text>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryStat}>
                    <Text style={[styles.summaryStatValue, { color: '#ef4444' }]}>
                      {bottlenecks.totalBottlenecks}
                    </Text>
                    <Text style={styles.summaryStatLabel}>STALLED</Text>
                  </View>
                  <View style={styles.summaryStat}>
                    <Text style={[styles.summaryStatValue, { color: '#f97316' }]}>
                      {bottlenecks.openEscalations}
                    </Text>
                    <Text style={styles.summaryStatLabel}>ESCALATIONS</Text>
                  </View>
                  <View style={styles.summaryStat}>
                    <Text style={[styles.summaryStatValue, { color: '#9ca3af' }]}>
                      {bottlenecks.criticalSignals}
                    </Text>
                    <Text style={styles.summaryStatLabel}>CRITICAL</Text>
                  </View>
                </View>
              </View>

              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                TOP STALLED OWNERS
              </Text>
              {bottlenecks.rankedByOwner.length === 0 ? (
                <View style={[styles.empty, { borderColor: colors.border }]}>
                  <Text style={styles.emptyIcon}>◇</Text>
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                    No stalled owners detected. Everything is moving.
                  </Text>
                </View>
              ) : (
                bottlenecks.rankedByOwner
                  .slice(0, 8)
                  .map((owner, idx) => (
                    <BottleneckOwnerCard
                      key={owner.owner}
                      item={owner}
                      rank={idx + 1}
                      colors={colors}
                    />
                  ))
              )}

              {rankedDomainBottlenecks.length > 0 && (
                <>
                  <Text
                    style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 16 }]}
                  >
                    BOTTLENECKS BY DOMAIN
                  </Text>
                  {rankedDomainBottlenecks.map(({ domain, data }) => {
                    const meta = domainMeta(domain);
                    const lColor = levelColor(data.level);
                    return (
                      <View
                        key={domain}
                        style={[
                          styles.varRow,
                          { backgroundColor: colors.card, borderColor: colors.border },
                        ]}
                      >
                        <View style={styles.varRowHeader}>
                          <View
                            style={[
                              styles.varDomainIcon,
                              {
                                backgroundColor: `${meta.color}18`,
                                borderColor: `${meta.color}35`,
                              },
                            ]}
                          >
                            <Text style={[styles.varDomainIconText, { color: meta.color }]}>
                              {meta.icon}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.varDomainLabel, { color: colors.foreground }]}>
                              {meta.label}
                            </Text>
                            <Text style={[styles.varDomainSub, { color: colors.mutedForeground }]}>
                              {data.count} stalled · {data.level} severity
                            </Text>
                          </View>
                          <Text style={[styles.varAmount, { color: lColor }]}>
                            {formatUsd(data.var)}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </>
              )}

              <Text style={[styles.generatedAt, { color: colors.mutedForeground }]}>
                Updated {new Date(bottlenecks.fetchedAt).toLocaleString()}
              </Text>
            </>
          ) : (
            <View style={[styles.empty, { borderColor: colors.border }]}>
              <Text style={styles.emptyIcon}>◇</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No bottleneck data available
              </Text>
            </View>
          ))}

        {tab === 'accountability' &&
          (accountabilityLoading ? (
            <ActivityIndicator color={ACCENT} style={{ marginTop: 32 }} />
          ) : accountabilityQuery.isError ? (
            <View
              style={[
                styles.errorCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Feather name="alert-circle" size={14} color="#ef4444" />
              <Text style={[styles.errorText, { color: colors.mutedForeground }]}>
                Could not load accountability map. Pull to retry.
              </Text>
            </View>
          ) : accountability ? (
            <>
              <View
                style={[
                  styles.summaryCard,
                  { backgroundColor: '#0a0a0a', borderColor: `${ACCENT}30` },
                ]}
              >
                <Text style={styles.summaryLabel}>MAPPED VALUE AT RISK</Text>
                <Text style={styles.summaryValue}>{formatUsd(accountability.totalVaRMapped)}</Text>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryStat}>
                    <Text style={[styles.summaryStatValue, { color: '#22c55e' }]}>
                      {accountability.ownerCount}
                    </Text>
                    <Text style={styles.summaryStatLabel}>OWNERS</Text>
                  </View>
                  <View style={styles.summaryStat}>
                    <Text style={[styles.summaryStatValue, { color: '#ef4444' }]}>
                      {accountability.ownershipGaps.count}
                    </Text>
                    <Text style={styles.summaryStatLabel}>GAPS</Text>
                  </View>
                  <View style={styles.summaryStat}>
                    <Text style={[styles.summaryStatValue, { color: '#f97316' }]}>
                      {formatUsd(accountability.ownershipGaps.estimatedVaR)}
                    </Text>
                    <Text style={styles.summaryStatLabel}>UNOWNED VAR</Text>
                  </View>
                </View>
              </View>

              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                OWNER ACCOUNTABILITY MAP
              </Text>
              {accountability.accountabilityMap.length === 0 ? (
                <View style={[styles.empty, { borderColor: colors.border }]}>
                  <Text style={styles.emptyIcon}>◇</Text>
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                    No accountability records to display
                  </Text>
                </View>
              ) : (
                accountability.accountabilityMap
                  .slice(0, 10)
                  .map((owner, idx) => (
                    <AccountabilityOwnerCard
                      key={owner.owner}
                      item={owner}
                      rank={idx + 1}
                      colors={colors}
                    />
                  ))
              )}

              <Text style={[styles.generatedAt, { color: colors.mutedForeground }]}>
                Updated {new Date(accountability.fetchedAt).toLocaleString()}
              </Text>
            </>
          ) : (
            <View style={[styles.empty, { borderColor: colors.border }]}>
              <Text style={styles.emptyIcon}>◇</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No accountability data available
              </Text>
            </View>
          ))}
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
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveIndicator: { width: 7, height: 7, borderRadius: 4, backgroundColor: ACCENT },
  headerTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  headerSub: { fontSize: 11, marginTop: 1 },
  refreshBtn: { padding: 8 },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  scroll: { flex: 1 },
  scrollContent: { padding: 14, gap: 10 },
  summaryCard: { borderRadius: 10, borderWidth: 1, padding: 16 },
  summaryLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, color: `${ACCENT}cc` },
  summaryValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#e8edf8',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  summaryRow: { flexDirection: 'row', marginTop: 12, gap: 10 },
  summaryStat: { flex: 1 },
  summaryStatValue: { fontSize: 14, fontWeight: '700' },
  summaryStatLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#6b7280',
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 4,
    marginBottom: 2,
  },
  card: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  rankBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: `${ACCENT}15`,
    borderWidth: 1,
    borderColor: `${ACCENT}35`,
  },
  rankBadgeText: { fontSize: 10, fontWeight: '800' },
  domainPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  domainPillText: { fontSize: 10, fontWeight: '700' },
  urgencyChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  urgencyChipText: { fontSize: 10, fontWeight: '700' },
  approvalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  approvalChipText: { fontSize: 9, fontWeight: '700' },
  cardTitle: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  cardSummary: { fontSize: 12, lineHeight: 17 },
  cardStatsRow: { flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  statBlock: { flex: 1, minWidth: 70 },
  statValue: { fontSize: 14, fontWeight: '700' },
  statLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.4, marginTop: 2 },
  ownerName: { fontSize: 13, fontWeight: '700', flex: 1 },
  itemsList: { gap: 4, marginTop: 4 },
  itemSectionLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5, marginBottom: 2 },
  itemLine: { fontSize: 11, lineHeight: 15 },
  escalationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  alertChipRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  alertChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  alertChipText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.4 },
  varRow: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 8 },
  varRowHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  varDomainIcon: {
    width: 30,
    height: 30,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  varDomainIconText: { fontSize: 14 },
  varDomainLabel: { fontSize: 13, fontWeight: '600' },
  varDomainSub: { fontSize: 11, marginTop: 1 },
  varAmount: { fontSize: 14, fontWeight: '700' },
  varBarTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  varBarFill: { height: 4, borderRadius: 2 },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  errorText: { fontSize: 12, flex: 1 },
  empty: { alignItems: 'center', padding: 24, borderRadius: 10, borderWidth: 1, gap: 8 },
  emptyIcon: { fontSize: 28, color: '#6b7280' },
  emptyText: { fontSize: 12, textAlign: 'center' },
  generatedAt: { fontSize: 10, textAlign: 'center', marginTop: 8 },
});
