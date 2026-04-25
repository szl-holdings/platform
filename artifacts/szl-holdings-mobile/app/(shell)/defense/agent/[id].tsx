import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { apiFetchRaw } from '@/lib/apiClient';
import { giColors, palette } from '@/lib/gi-bridge';

interface AgentDetail {
  id: string | number;
  name: string;
  type: string;
  status: 'running' | 'idle' | 'error' | 'paused' | 'completed';
  description?: string;
  lastRunAt?: string | null;
  runCount?: number;
  successRate?: number;
  errorCount?: number;
  avgDurationMs?: number | null;
  configuration?: Record<string, unknown>;
}

interface AgentRun {
  id: number;
  state: string;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  errorMessage: string | null;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  running: { color: palette.low, label: 'Running' },
  idle: { color: giColors.text.muted, label: 'Idle' },
  error: { color: palette.critical, label: 'Error' },
  paused: { color: palette.high, label: 'Paused' },
  completed: { color: palette.success, label: 'Completed' },
};

function formatMs(ms: number | null): string {
  if (!ms) return '—';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function formatRelative(ts: string | null): string {
  if (!ts) return '—';
  const ms = Date.now() - new Date(ts).getTime();
  if (ms < 60000) return 'just now';
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
  return `${Math.floor(ms / 86400000)}d ago`;
}

export default function AgentDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [refreshing, setRefreshing] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom + 16;

  const {
    data: agent,
    isLoading: agentLoading,
    isError: agentError,
    refetch: refetchAgent,
  } = useQuery<AgentDetail>({
    queryKey: ['alloy-agent', id],
    queryFn: async () => {
      const res = await apiFetchRaw(`/api/alloy/agents/${id}`);
      if (!res.ok) throw new Error('Failed to load agent');
      const json = (await res.json()) as { data?: AgentDetail } | AgentDetail;
      return (json as { data?: AgentDetail }).data ?? (json as AgentDetail);
    },
    enabled: !!id,
    refetchInterval: 10000,
  });

  const {
    data: runs,
    isLoading: runsLoading,
    refetch: refetchRuns,
  } = useQuery<AgentRun[]>({
    queryKey: ['alloy-agent-runs', id],
    queryFn: async () => {
      const res = await apiFetchRaw(`/api/alloy/agents/${id}/runs?limit=10`);
      if (!res.ok) throw new Error('Failed to load runs');
      const json = (await res.json()) as { data?: AgentRun[] } | AgentRun[];
      return Array.isArray(json) ? json : ((json as { data?: AgentRun[] }).data ?? []);
    },
    enabled: !!id,
    refetchInterval: 15000,
  });

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await Promise.all([refetchAgent(), refetchRuns()]);
    setRefreshing(false);
  }, [refetchAgent, refetchRuns]);

  const cfg = agent
    ? (STATUS_CONFIG[agent.status] ?? { color: giColors.text.muted, label: agent.status })
    : null;

  if (agentLoading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.violet} />
      </View>
    );
  }

  if (agentError || !agent) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <Feather
          name="alert-triangle"
          size={32}
          color={colors.mutedForeground}
          style={{ opacity: 0.4 }}
        />
        <Text style={[styles.emptyTitle, { color: colors.creamDim, marginTop: 12 }]}>
          Agent not found
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backLink, { borderColor: colors.border }]}
        >
          <Text style={[{ color: colors.violet }]}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[`${cfg?.color}10`, 'transparent']}
        style={[styles.headerGradient, { height: topPad + 140 }]}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad + 16, paddingBottom: bottomPad },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.violet} />
        }
      >
        <View style={styles.navRow}>
          <Pressable
            style={styles.backBtn}
            onPress={() => {
              Haptics.selectionAsync();
              router.back();
            }}
          >
            <Feather name="arrow-left" size={20} color={colors.creamDim} />
          </Pressable>
          <Text style={[styles.navTitle, { color: colors.cream }]}>Agent Detail</Text>
          <View style={{ width: 36 }} />
        </View>

        <View
          style={[
            styles.agentHeader,
            { backgroundColor: colors.card, borderColor: colors.borderSubtle },
          ]}
        >
          <View style={[styles.agentIconLarge, { backgroundColor: `${cfg?.color}15` }]}>
            <Feather name="cpu" size={28} color={cfg?.color} />
          </View>
          <View style={styles.agentHeaderText}>
            <Text style={[styles.agentName, { color: colors.cream }]}>{agent.name}</Text>
            <Text style={[styles.agentType, { color: colors.mutedForeground }]}>{agent.type}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${cfg?.color}15`, borderColor: `${cfg?.color}30` },
            ]}
          >
            <View style={[styles.statusDot, { backgroundColor: cfg?.color }]} />
            <Text style={[styles.statusText, { color: cfg?.color }]}>{cfg?.label}</Text>
          </View>
        </View>

        {agent.description && (
          <Text style={[styles.description, { color: colors.creamDim }]}>{agent.description}</Text>
        )}

        <View style={styles.statsGrid}>
          {[
            { label: 'Total Runs', value: String(agent.runCount ?? '—'), color: colors.cream },
            {
              label: 'Success Rate',
              value: agent.successRate != null ? `${Math.round(agent.successRate * 100)}%` : '—',
              color: palette.success,
            },
            {
              label: 'Errors',
              value: String(agent.errorCount ?? '—'),
              color: agent.errorCount ? palette.critical : colors.mutedForeground,
            },
            {
              label: 'Avg Duration',
              value: formatMs(agent.avgDurationMs ?? null),
              color: colors.violet,
            },
          ].map((s) => (
            <View
              key={s.label}
              style={[
                styles.statCard,
                { backgroundColor: colors.card, borderColor: colors.borderSubtle },
              ]}
            >
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>RECENT RUNS</Text>
        {runsLoading ? (
          <ActivityIndicator color={colors.violet} style={{ marginTop: 16 }} />
        ) : !runs?.length ? (
          <View style={[styles.emptyState, { borderColor: colors.borderSubtle }]}>
            <Text style={[styles.emptyTitle, { color: colors.creamDim }]}>No recent runs</Text>
          </View>
        ) : (
          <View style={[styles.runList, { borderColor: colors.borderSubtle }]}>
            {runs.map((run, i) => {
              const rc = STATUS_CONFIG[run.state] ?? { color: giColors.text.muted, label: run.state };
              return (
                <View
                  key={run.id}
                  style={[
                    styles.runRow,
                    { borderTopWidth: i > 0 ? 1 : 0, borderColor: colors.borderSubtle },
                  ]}
                >
                  <View>
                    <View style={styles.runTopRow}>
                      <Text style={[styles.runId, { color: colors.cream }]}>Run #{run.id}</Text>
                      <View style={[styles.runStateBadge, { backgroundColor: `${rc.color}15` }]}>
                        <Text style={[styles.runStateText, { color: rc.color }]}>{rc.label}</Text>
                      </View>
                    </View>
                    <View style={styles.runMetaRow}>
                      <Text style={[styles.runMeta, { color: colors.mutedForeground }]}>
                        {formatRelative(run.startedAt ?? run.createdAt)}
                      </Text>
                      <Text style={[styles.runMeta, { color: colors.mutedForeground }]}>·</Text>
                      <Text style={[styles.runMeta, { color: colors.mutedForeground }]}>
                        {formatMs(run.durationMs)}
                      </Text>
                    </View>
                    {run.errorMessage && (
                      <Text style={[styles.runError, { color: palette.critical }]} numberOfLines={2}>
                        {run.errorMessage}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  headerGradient: { position: 'absolute', top: 0, left: 0, right: 0 },
  content: { paddingHorizontal: 20 },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  agentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  agentIconLarge: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentHeaderText: { flex: 1 },
  agentName: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  agentType: { fontSize: 12 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  description: { fontSize: 13, lineHeight: 20, marginBottom: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  statCard: { width: '47%', borderRadius: 10, borderWidth: 1, padding: 12 },
  statValue: { fontSize: 20, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  statLabel: { fontSize: 9, fontFamily: 'Inter_500Medium', letterSpacing: 1 },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 2,
    marginBottom: 10,
  },
  runList: { borderRadius: 10, borderWidth: 1, overflow: 'hidden' },
  runRow: { padding: 12 },
  runTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  runId: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  runStateBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  runStateText: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  runMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  runMeta: { fontSize: 11 },
  runError: { fontSize: 11, marginTop: 4 },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  backLink: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
});
