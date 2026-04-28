import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WorkspaceTrigger } from '@/components/WorkspaceSwitcher';
import { useWorkspace } from '@/context/WorkspaceContext';
import { TAB_BAR_HEIGHT } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import { apiFetch } from '@/lib/apiClient';

const ACCENT = '#c9a84c';
type Tab = 'feed' | 'entities' | 'drafts' | 'whatif';

interface FusionSignal {
  id: string;
  type: string;
  title: string;
  summary: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  confidence: number;
  affectedDomains: string[];
  affectedEntities?: Array<{ id: string; name: string; domain: string; type: string }>;
  recommendedActions?: string[];
  timestamp: string;
  status: string;
  hasActionDrafts?: boolean;
}

interface FeedStats {
  total: number;
  active: number;
  critical: number;
  high: number;
}

interface ActionDraft {
  id: string;
  alertId: string;
  alertTitle: string;
  domain: string;
  type: string;
  title: string;
  content: string;
  recipient?: string;
  priority: 'urgent' | 'high' | 'normal';
  status: 'pending' | 'approved' | 'dismissed';
  generatedAt: string;
}

interface WhatIfCascade {
  domain: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  estimatedExposure: string;
  affectedEntities: string[];
  mitigationOptions: string[];
}

interface WhatIfResult {
  scenarioId: string;
  query: string;
  summary: string;
  affectedDomains: string[];
  cascades: WhatIfCascade[];
  timeHorizon: string;
  overallRisk: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  source?: 'llm' | 'pattern';
}

const SEV_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#3b82f6',
  info: '#6b7280',
};

const DOMAIN_META: Record<string, { label: string; icon: string; color: string }> = {
  vessels: { label: 'SEXTANT', icon: '⚓', color: '#4d8fcc' },
  firestorm: { label: 'PARAGON', icon: '⬡', color: '#ef4444' },
  aegis: { label: 'PARAGON', icon: '⬡', color: '#ef4444' },
  terra: { label: 'DOMAINE', icon: '⬢', color: '#22c55e' },
  lyte: { label: 'KORA', icon: '⚡', color: '#f59e0b' },
  prism: { label: 'PRISM', icon: '⚖', color: '#a855f7' },
  szl: { label: 'Portfolio', icon: '◆', color: '#c9a84c' },
};

const IMPACT_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#3b82f6',
};

const STARTER_QUERIES = [
  'What if Port of Rotterdam closes?',
  'What if a sanctioned entity appears in our supply chain?',
  'What if oil prices spike 30%?',
  'What if a vessel is seized?',
];

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function SignalCard({
  signal,
  colors,
  onGenerateDrafts,
}: {
  signal: FusionSignal;
  colors: ReturnType<typeof useColors>;
  onGenerateDrafts: (signal: FusionSignal) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const sevColor = SEV_COLORS[signal.severity] ?? '#6b7280';

  return (
    <TouchableOpacity
      onPress={() => setExpanded((v) => !v)}
      style={[
        styles.signalCard,
        { backgroundColor: colors.card, borderColor: expanded ? `${sevColor}40` : colors.border },
        { borderLeftColor: sevColor, borderLeftWidth: 3 },
      ]}
      activeOpacity={0.85}
    >
      <View style={styles.signalHeader}>
        <View style={[styles.sevDot, { backgroundColor: sevColor }]} />
        <View style={styles.signalInfo}>
          <View style={styles.signalMeta}>
            <Text style={[styles.sevLabel, { color: sevColor }]}>
              {signal.severity.toUpperCase()}
            </Text>
            {signal.hasActionDrafts && (
              <View
                style={[
                  styles.draftsBadge,
                  { borderColor: `${ACCENT}50`, backgroundColor: `${ACCENT}15` },
                ]}
              >
                <Text style={[styles.draftsBadgeText, { color: ACCENT }]}>DRAFTS</Text>
              </View>
            )}
            <Text style={[styles.signalTime, { color: colors.mutedForeground }]}>
              {formatRelative(signal.timestamp)}
            </Text>
          </View>
          <Text
            style={[styles.signalTitle, { color: colors.foreground }]}
            numberOfLines={expanded ? undefined : 2}
          >
            {signal.title}
          </Text>
          {!expanded && (
            <Text
              style={[styles.signalSummary, { color: colors.mutedForeground }]}
              numberOfLines={1}
            >
              {signal.summary}
            </Text>
          )}
          <View style={styles.domainPills}>
            {signal.affectedDomains.slice(0, 3).map((d) => {
              const meta = DOMAIN_META[d] ?? { label: d, icon: '◆', color: '#6b7280' };
              return (
                <View
                  key={d}
                  style={[
                    styles.domainPill,
                    { backgroundColor: `${meta.color}18`, borderColor: `${meta.color}30` },
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
        <View style={styles.signalExpanded}>
          <Text style={[styles.signalSummaryFull, { color: colors.foreground }]}>
            {signal.summary}
          </Text>

          {signal.recommendedActions && signal.recommendedActions.length > 0 && (
            <View style={styles.actionsBlock}>
              <Text style={[styles.blockLabel, { color: colors.mutedForeground }]}>
                RECOMMENDED ACTIONS
              </Text>
              {signal.recommendedActions.map((a, i) => (
                <Text key={i} style={[styles.actionItem, { color: colors.foreground }]}>
                  • {a}
                </Text>
              ))}
            </View>
          )}

          {!signal.hasActionDrafts && signal.status === 'active' && (
            <TouchableOpacity
              onPress={() => onGenerateDrafts(signal)}
              style={[
                styles.generateBtn,
                { borderColor: `${ACCENT}50`, backgroundColor: `${ACCENT}15` },
              ]}
            >
              <Text style={[styles.generateBtnText, { color: ACCENT }]}>
                Generate Autonomous Action Drafts
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

function DraftCard({
  draft,
  colors,
  onApprove,
  onDismiss,
}: {
  draft: ActionDraft;
  colors: ReturnType<typeof useColors>;
  onApprove: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const prioColor =
    draft.priority === 'urgent' ? '#ef4444' : draft.priority === 'high' ? '#f97316' : '#6b7280';
  const statusColor =
    draft.status === 'approved' ? '#22c55e' : draft.status === 'dismissed' ? '#6b7280' : prioColor;

  return (
    <TouchableOpacity
      onPress={() => setExpanded((v) => !v)}
      style={[
        styles.draftCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderLeftColor: statusColor,
          borderLeftWidth: 3,
        },
        draft.status !== 'pending' && { opacity: 0.6 },
      ]}
      activeOpacity={0.85}
    >
      <View style={styles.draftHeader}>
        <View style={styles.draftInfo}>
          <View style={styles.draftMeta}>
            <Text style={[styles.draftPriority, { color: prioColor }]}>
              {draft.priority.toUpperCase()}
            </Text>
            {draft.status !== 'pending' && (
              <Text
                style={[
                  styles.draftStatus,
                  { color: draft.status === 'approved' ? '#22c55e' : '#6b7280' },
                ]}
              >
                {draft.status.toUpperCase()}
              </Text>
            )}
          </View>
          <Text style={[styles.draftTitle, { color: colors.foreground }]}>{draft.title}</Text>
          <Text style={[styles.draftDomain, { color: colors.mutedForeground }]}>
            {DOMAIN_META[draft.domain]?.icon ?? '◆'}{' '}
            {DOMAIN_META[draft.domain]?.label ?? draft.domain}
            {draft.recipient ? ` → ${draft.recipient}` : ''}
          </Text>
        </View>
        <Feather
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={colors.mutedForeground}
        />
      </View>

      {expanded && (
        <View style={styles.draftExpanded}>
          <Text
            style={[
              styles.draftContent,
              { color: colors.foreground, backgroundColor: colors.background },
            ]}
          >
            {draft.content}
          </Text>
          {draft.status === 'pending' && (
            <View style={styles.draftActions}>
              <TouchableOpacity onPress={() => onApprove(draft.id)} style={styles.approveBtn}>
                <Text style={styles.approveBtnText}>Approve & Queue</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onDismiss(draft.id)}
                style={[styles.dismissBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.dismissBtnText, { color: colors.mutedForeground }]}>
                  Dismiss
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

function CascadeCard({
  cascade,
  colors,
}: {
  cascade: WhatIfCascade;
  colors: ReturnType<typeof useColors>;
}) {
  const [expanded, setExpanded] = useState(false);
  const color = IMPACT_COLORS[cascade.impact] ?? '#6b7280';
  const domMeta = DOMAIN_META[cascade.domain] ?? {
    label: cascade.domain,
    icon: '◆',
    color: '#6b7280',
  };

  return (
    <TouchableOpacity
      onPress={() => setExpanded((v) => !v)}
      style={[
        styles.cascadeCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderLeftColor: color,
          borderLeftWidth: 3,
        },
      ]}
      activeOpacity={0.85}
    >
      <View style={styles.cascadeHeader}>
        <View
          style={[
            styles.cascadeIcon,
            { backgroundColor: `${domMeta.color}20`, borderColor: `${domMeta.color}40` },
          ]}
        >
          <Text style={styles.cascadeIconText}>{domMeta.icon}</Text>
        </View>
        <View style={styles.cascadeInfo}>
          <View style={styles.cascadeMeta}>
            <Text style={[styles.cascadeDomain, { color: domMeta.color }]}>{domMeta.label}</Text>
            <View
              style={[
                styles.impactBadge,
                { backgroundColor: `${color}20`, borderColor: `${color}40` },
              ]}
            >
              <Text style={[styles.impactBadgeText, { color }]}>
                {cascade.impact.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text
            style={[styles.cascadeDesc, { color: colors.foreground }]}
            numberOfLines={expanded ? undefined : 2}
          >
            {cascade.description}
          </Text>
          <Text style={[styles.cascadeExposure, { color }]}>{cascade.estimatedExposure}</Text>
        </View>
        <Feather
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={colors.mutedForeground}
        />
      </View>

      {expanded && cascade.mitigationOptions.length > 0 && (
        <View style={styles.mitigationBlock}>
          <Text style={[styles.blockLabel, { color: colors.mutedForeground }]}>
            MITIGATION OPTIONS
          </Text>
          {cascade.mitigationOptions.map((opt, i) => (
            <Text key={i} style={[styles.actionItem, { color: colors.foreground }]}>
              • {opt}
            </Text>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function APEXIntelligenceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setActiveWorkspace } = useWorkspace();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('feed');
  const [whatIfQuery, setWhatIfQuery] = useState('');
  const [whatIfResult, setWhatIfResult] = useState<WhatIfResult | null>(null);
  const [whatIfLoading, setWhatIfLoading] = useState(false);

  useEffect(() => {
    setActiveWorkspace('intelligence');
  }, [setActiveWorkspace]);

  const feedQuery = useQuery<{ signals: FusionSignal[]; stats: FeedStats }>({
    queryKey: ['cortex-intelligence-feed'],
    queryFn: () =>
      apiFetch<{ signals: FusionSignal[]; stats: FeedStats }>('/api/cortex/intelligence-feed'),
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const draftsQuery = useQuery<{ drafts: ActionDraft[]; pendingCount: number }>({
    queryKey: ['cortex-action-drafts'],
    queryFn: () =>
      apiFetch<{ drafts: ActionDraft[]; pendingCount: number }>(
        '/api/cortex/action-drafts?status=pending',
      ),
    refetchInterval: 30000,
  });

  const generateDraftsMutation = useMutation({
    mutationFn: async (signal: FusionSignal) => {
      return apiFetch('/api/cortex/action-drafts/generate', {
        method: 'POST',
        body: JSON.stringify({
          alertId: signal.id,
          alertTitle: signal.title,
          severity: signal.severity,
          affectedDomains: signal.affectedDomains,
        }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cortex-action-drafts'] });
      qc.invalidateQueries({ queryKey: ['cortex-intelligence-feed'] });
      Alert.alert(
        'Drafts Generated',
        'Autonomous action drafts have been created and queued for your review in the Drafts tab.',
      );
      setActiveTab('drafts');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to generate action drafts. Please try again.');
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/cortex/action-drafts/${id}/approve`, { method: 'POST', body: '{}' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cortex-action-drafts'] }),
  });

  const dismissMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/cortex/action-drafts/${id}/dismiss`, { method: 'POST', body: '{}' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cortex-action-drafts'] }),
  });

  const handleWhatIf = async (q?: string) => {
    const finalQuery = (q ?? whatIfQuery).trim();
    if (!finalQuery) return;
    setWhatIfLoading(true);
    setWhatIfResult(null);
    try {
      const res = await apiFetch<WhatIfResult>('/api/cortex/whatif', {
        method: 'POST',
        body: JSON.stringify({ query: finalQuery }),
      });
      setWhatIfResult(res);
    } catch {
      Alert.alert('Error', 'APEX scenario engine unavailable. Please try again.');
    } finally {
      setWhatIfLoading(false);
    }
  };

  const signals = feedQuery.data?.signals ?? [];
  const stats = feedQuery.data?.stats;
  const drafts = draftsQuery.data?.drafts ?? [];
  const pendingCount = draftsQuery.data?.pendingCount ?? 0;

  const TABS: Array<{ key: Tab; label: string; badge?: number }> = [
    { key: 'feed', label: 'Feed', badge: stats?.active ?? 0 },
    { key: 'drafts', label: 'Drafts', badge: pendingCount },
    { key: 'whatif', label: 'What-If' },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}
      >
        <WorkspaceTrigger accentColor={ACCENT} size={36} />
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            APEX Intelligence
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Cross-domain fusion engine
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            feedQuery.refetch();
            draftsQuery.refetch();
          }}
          style={styles.refreshBtn}
        >
          <Feather name="refresh-cw" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[
              styles.tabItem,
              activeTab === tab.key && [styles.tabItemActive, { borderBottomColor: ACCENT }],
            ]}
            activeOpacity={0.7}
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
                <View
                  style={[
                    styles.tabBadge,
                    {
                      backgroundColor:
                        activeTab === tab.key ? ACCENT : `${colors.mutedForeground}80`,
                    },
                  ]}
                >
                  <Text style={styles.tabBadgeText}>{tab.badge}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'feed' && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 24 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={feedQuery.isRefetching}
              onRefresh={() => feedQuery.refetch()}
              tintColor={ACCENT}
            />
          }
        >
          <TouchableOpacity
            onPress={() => router.navigate('/(shell)/intelligence/pulse')}
            activeOpacity={0.85}
            style={[styles.pulseCard, { backgroundColor: '#0a0a0a', borderColor: '#c9a84c' }]}
          >
            <View style={styles.pulseCardInner}>
              <View>
                <Text style={styles.pulseCardLabel}>AI EXECUTIVE BRIEFING</Text>
                <Text style={styles.pulseCardTitle}>Pulse Intelligence Brief</Text>
                <Text style={[styles.pulseCardSub, { color: '#9ca3af' }]}>
                  Today's strategic summary · Agent-attributed · Confidence-scored
                </Text>
              </View>
              <View
                style={[
                  styles.pulseCardBadge,
                  { backgroundColor: '#c9a84c22', borderColor: '#c9a84c' },
                ]}
              >
                <Text style={[styles.pulseCardBadgeText, { color: '#c9a84c' }]}>OPEN →</Text>
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.runtimeSection}>
            <Text style={[styles.runtimeSectionLabel, { color: colors.mutedForeground }]}>
              COGNITIVE RUNTIME
            </Text>
            <View style={styles.runtimeGrid}>
              {[
                {
                  route: '/(shell)/intelligence/cognitive-briefing',
                  label: 'Cognitive Briefing',
                  icon: 'cpu' as const,
                  color: '#8b7ac8',
                  sub: 'Top interventions · VaR by domain',
                },
                {
                  route: '/(shell)/intelligence/decisions',
                  label: 'Decision Center',
                  icon: 'layers' as const,
                  color: '#c9a84c',
                  sub: 'Decisions, with receipts',
                },
                {
                  route: '/(shell)/intelligence/approval-inbox',
                  label: 'Approval Inbox',
                  icon: 'inbox' as const,
                  color: '#f97316',
                  sub: 'Guardian-routed decisions',
                },
                {
                  route: '/(shell)/intelligence/alert-center',
                  label: 'Alert Center',
                  icon: 'alert-triangle' as const,
                  color: '#ef4444',
                  sub: 'Escalations & world-model',
                },
                {
                  route: '/(shell)/intelligence/executive-brief',
                  label: 'Executive Brief',
                  icon: 'file-text' as const,
                  color: ACCENT,
                  sub: 'Daily · Weekly · Live snapshot',
                },
                {
                  route: '/(shell)/intelligence/secure-quick-actions',
                  label: 'Quick Actions',
                  icon: 'shield' as const,
                  color: '#6366f1',
                  sub: 'Guardian-scoped · Rollback',
                },
                {
                  route: '/(shell)/intelligence/run-review',
                  label: 'Run Review',
                  icon: 'activity' as const,
                  color: '#22c55e',
                  sub: 'Cognitive loop traces',
                },
                {
                  route: '/(shell)/intelligence/proof-envelope',
                  label: 'Proof Envelope',
                  icon: 'shield' as const,
                  color: '#4d8fcc',
                  sub: 'Governed Intelligence cockpit',
                },
              ].map(({ route, label, icon, color, sub }) => (
                <TouchableOpacity
                  key={route}
                  onPress={() => router.navigate(route as Parameters<typeof router.navigate>[0])}
                  activeOpacity={0.8}
                  style={[
                    styles.runtimeCard,
                    { backgroundColor: `${color}0d`, borderColor: `${color}30` },
                  ]}
                >
                  <View
                    style={[
                      styles.runtimeIcon,
                      { backgroundColor: `${color}18`, borderColor: `${color}35` },
                    ]}
                  >
                    <Feather name={icon} size={16} color={color} />
                  </View>
                  <Text style={[styles.runtimeLabel, { color: '#e8edf8' }]}>{label}</Text>
                  <Text style={[styles.runtimeSub, { color: '#6b7280' }]} numberOfLines={1}>
                    {sub}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {stats && (
            <View style={styles.statsRow}>
              {[
                { label: 'Active', value: stats.active, color: '#ffffff' },
                { label: 'Critical', value: stats.critical, color: '#ef4444' },
                { label: 'High', value: stats.high, color: '#f97316' },
                { label: 'Total', value: stats.total, color: colors.mutedForeground },
              ].map(({ label, value, color }) => (
                <View
                  key={label}
                  style={[
                    styles.statCard,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.statValue, { color }]}>{value}</Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                    {label.toUpperCase()}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {feedQuery.isLoading ? (
            <ActivityIndicator color={ACCENT} style={{ marginTop: 32 }} />
          ) : signals.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>◈</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No active intelligence signals
              </Text>
            </View>
          ) : (
            signals.map((signal) => (
              <SignalCard
                key={signal.id}
                signal={signal}
                colors={colors}
                onGenerateDrafts={(s) => generateDraftsMutation.mutate(s)}
              />
            ))
          )}
        </ScrollView>
      )}

      {activeTab === 'drafts' && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 24 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={draftsQuery.isRefetching}
              onRefresh={() => draftsQuery.refetch()}
              tintColor={ACCENT}
            />
          }
        >
          {pendingCount > 0 && (
            <View
              style={[
                styles.pendingBanner,
                { backgroundColor: '#ef444415', borderColor: '#ef444440' },
              ]}
            >
              <Feather name="alert-circle" size={14} color="#ef4444" />
              <Text style={[styles.pendingBannerText, { color: '#ef4444' }]}>
                {pendingCount} action draft{pendingCount !== 1 ? 's' : ''} awaiting your approval
              </Text>
            </View>
          )}

          {draftsQuery.isLoading ? (
            <ActivityIndicator color={ACCENT} style={{ marginTop: 32 }} />
          ) : drafts.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>◈</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No pending action drafts
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
                Generate drafts from signals in the Feed tab
              </Text>
            </View>
          ) : (
            drafts.map((draft) => (
              <DraftCard
                key={draft.id}
                draft={draft}
                colors={colors}
                onApprove={(id) => approveMutation.mutate(id)}
                onDismiss={(id) => dismissMutation.mutate(id)}
              />
            ))
          )}
        </ScrollView>
      )}

      {activeTab === 'whatif' && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              styles.scenarioInput,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.scenarioLabel, { color: colors.mutedForeground }]}>
              WHAT-IF SCENARIO ENGINE
            </Text>
            <TextInput
              value={whatIfQuery}
              onChangeText={setWhatIfQuery}
              placeholder={'Describe a hypothetical event — e.g., "What if Port X closes?"'}
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={3}
              style={[
                styles.scenarioTextInput,
                { color: colors.foreground, borderColor: colors.border },
              ]}
            />
            <TouchableOpacity
              onPress={() => handleWhatIf()}
              disabled={whatIfLoading || !whatIfQuery.trim()}
              style={[
                styles.scenarioBtn,
                {
                  backgroundColor: whatIfLoading || !whatIfQuery.trim() ? colors.muted : ACCENT,
                  opacity: whatIfLoading || !whatIfQuery.trim() ? 0.5 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.scenarioBtnText,
                  {
                    color:
                      whatIfLoading || !whatIfQuery.trim() ? colors.mutedForeground : '#000000',
                  },
                ]}
              >
                {whatIfLoading ? 'Simulating…' : 'Run Simulation ▶'}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.starterLabel, { color: colors.mutedForeground }]}>
              Quick scenarios:
            </Text>
            <View style={styles.starters}>
              {STARTER_QUERIES.map((q) => (
                <TouchableOpacity
                  key={q}
                  onPress={() => {
                    setWhatIfQuery(q);
                    handleWhatIf(q);
                  }}
                  style={[styles.starterChip, { borderColor: colors.border }]}
                >
                  <Text
                    style={[styles.starterChipText, { color: colors.mutedForeground }]}
                    numberOfLines={2}
                  >
                    {q}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {whatIfLoading && (
            <View style={styles.scenarioLoading}>
              <ActivityIndicator color={ACCENT} size="large" />
              <Text style={[styles.scenarioLoadingText, { color: colors.mutedForeground }]}>
                APEX is tracing cascades across all domains…
              </Text>
            </View>
          )}

          {whatIfResult && !whatIfLoading && (
            <View>
              <View
                style={[
                  styles.resultHeader,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={styles.resultMeta}>
                  <View
                    style={[
                      styles.riskBadge,
                      {
                        backgroundColor:
                          `${IMPACT_COLORS[whatIfResult.overallRisk] ?? '#6b7280'}20`,
                        borderColor: `${IMPACT_COLORS[whatIfResult.overallRisk] ?? '#6b7280'}40`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.riskBadgeText,
                        { color: IMPACT_COLORS[whatIfResult.overallRisk] ?? '#6b7280' },
                      ]}
                    >
                      Overall Risk: {whatIfResult.overallRisk.toUpperCase()}
                    </Text>
                  </View>
                  {whatIfResult.source === 'llm' && (
                    <View
                      style={{
                        backgroundColor: '#6366f118',
                        borderColor: '#6366f130',
                        borderWidth: 1,
                        borderRadius: 4,
                        paddingHorizontal: 7,
                        paddingVertical: 2,
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#818cf8', letterSpacing: 0.5 }}>
                        ✦ AI-Generated
                      </Text>
                    </View>
                  )}
                  {whatIfResult.source === 'pattern' && (
                    <View
                      style={{
                        backgroundColor: '#ffffff0a',
                        borderColor: '#ffffff18',
                        borderWidth: 1,
                        borderRadius: 4,
                        paddingHorizontal: 7,
                        paddingVertical: 2,
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#ffffff60', letterSpacing: 0.5 }}>
                        ◈ Template
                      </Text>
                    </View>
                  )}
                  <Text style={[styles.resultMeta2, { color: colors.mutedForeground }]}>
                    Horizon: {whatIfResult.timeHorizon} · Confidence:{' '}
                    {Math.round(whatIfResult.confidence * 100)}%
                  </Text>
                </View>
                <Text style={[styles.resultSummary, { color: colors.foreground }]}>
                  {whatIfResult.summary}
                </Text>
                {whatIfResult.source === 'pattern' && (
                  <Text
                    style={{
                      fontSize: 11,
                      color: '#f59e0b99',
                      marginTop: 6,
                      lineHeight: 16,
                    }}
                  >
                    ⚠ AI analysis was temporarily unavailable. This result is based on a pre-defined
                    scenario template and may not reflect current portfolio positions.
                  </Text>
                )}
                <View style={styles.affectedDomains}>
                  {whatIfResult.affectedDomains.map((d) => {
                    const meta = DOMAIN_META[d] ?? { label: d, icon: '◆', color: '#6b7280' };
                    return (
                      <View
                        key={d}
                        style={[
                          styles.domainPill,
                          { backgroundColor: `${meta.color}18`, borderColor: `${meta.color}30` },
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

              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
                IMPACT CASCADES
              </Text>

              {whatIfResult.cascades.map((cascade, i) => (
                <CascadeCard key={i} cascade={cascade} colors={colors} />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  headerSub: { fontSize: 11, marginTop: 1 },
  refreshBtn: { padding: 6 },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 8,
  },
  tabItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: { borderBottomWidth: 2 },
  tabLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  tabLabel: { fontSize: 13, fontWeight: '600' },
  tabBadge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: { fontSize: 10, fontWeight: '700', color: '#000000' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 8 },
  pulseCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },
  pulseCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pulseCardLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#c9a84c',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  pulseCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  pulseCardSub: {
    fontSize: 11,
    lineHeight: 15,
  },
  pulseCardBadge: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pulseCardBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  runtimeSection: { marginBottom: 4 },
  runtimeSectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 },
  runtimeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  runtimeCard: {
    width: '47%',
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  runtimeIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  runtimeLabel: { fontSize: 12, fontWeight: '700' },
  runtimeSub: { fontSize: 10, lineHeight: 14 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  statCard: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
  },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 0.5, marginTop: 2 },
  signalCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginBottom: 6,
  },
  signalHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  sevDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4, flexShrink: 0 },
  signalInfo: { flex: 1 },
  signalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
    flexWrap: 'wrap',
  },
  sevLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  draftsBadge: {
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  draftsBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  signalTime: { fontSize: 10, marginLeft: 'auto' },
  signalTitle: { fontSize: 13, fontWeight: '600', lineHeight: 18, marginBottom: 3 },
  signalSummary: { fontSize: 12, lineHeight: 16, marginBottom: 4 },
  domainPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  domainPill: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  domainPillText: { fontSize: 10, fontWeight: '600' },
  signalExpanded: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#ffffff10' },
  signalSummaryFull: { fontSize: 13, lineHeight: 19, marginBottom: 10 },
  actionsBlock: { marginBottom: 10 },
  blockLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  actionItem: { fontSize: 12, lineHeight: 18, marginBottom: 2 },
  generateBtn: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  generateBtnText: { fontSize: 12, fontWeight: '600' },
  draftCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginBottom: 6,
  },
  draftHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  draftInfo: { flex: 1 },
  draftMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  draftPriority: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  draftStatus: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  draftTitle: { fontSize: 13, fontWeight: '600', lineHeight: 18, marginBottom: 2 },
  draftDomain: { fontSize: 11 },
  draftExpanded: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#ffffff10' },
  draftContent: {
    fontSize: 11,
    lineHeight: 17,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  draftActions: { flexDirection: 'row', gap: 8 },
  approveBtn: {
    flex: 1,
    backgroundColor: '#22c55e',
    borderRadius: 6,
    paddingVertical: 9,
    alignItems: 'center',
  },
  approveBtnText: { fontSize: 13, fontWeight: '700', color: '#000000' },
  dismissBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 9,
    alignItems: 'center',
  },
  dismissBtnText: { fontSize: 13, fontWeight: '600' },
  cascadeCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginBottom: 6,
  },
  cascadeHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cascadeIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cascadeIconText: { fontSize: 14 },
  cascadeInfo: { flex: 1 },
  cascadeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  cascadeDomain: { fontSize: 12, fontWeight: '600' },
  impactBadge: { borderWidth: 1, borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1 },
  impactBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  cascadeDesc: { fontSize: 12, lineHeight: 17, marginBottom: 4 },
  cascadeExposure: { fontSize: 12, fontWeight: '700' },
  mitigationBlock: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ffffff10',
  },
  empty: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyText: { fontSize: 14, textAlign: 'center' },
  emptySubtext: { fontSize: 12, textAlign: 'center', marginTop: 4 },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  pendingBannerText: { fontSize: 13, fontWeight: '600' },
  scenarioInput: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    gap: 10,
  },
  scenarioLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  scenarioTextInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    lineHeight: 19,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  scenarioBtn: {
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
  },
  scenarioBtnText: { fontSize: 14, fontWeight: '700' },
  starterLabel: { fontSize: 11, fontWeight: '500' },
  starters: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  starterChip: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    maxWidth: '48%',
  },
  starterChipText: { fontSize: 11, lineHeight: 15 },
  scenarioLoading: { alignItems: 'center', padding: 40, gap: 12 },
  scenarioLoadingText: { fontSize: 13, textAlign: 'center' },
  resultHeader: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    gap: 8,
  },
  resultMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  riskBadge: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  riskBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  resultMeta2: { fontSize: 11 },
  resultSummary: { fontSize: 13, lineHeight: 19 },
  affectedDomains: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
});
