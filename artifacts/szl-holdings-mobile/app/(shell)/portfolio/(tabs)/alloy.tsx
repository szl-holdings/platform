import { Feather } from '@expo/vector-icons';
import { SkeletonLoader } from '@szl-holdings/mobile-shared';
import { useOptimisticMutation } from '@szl-holdings/mobile-shared/hooks';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { promptBiometric } from '@/context/BiometricLockContext';
import { useAlloyWebSocket } from '@/hooks/useAlloyWebSocket';
import { useColors } from '@/hooks/useColors';
import { apiFetch as sharedApiFetch } from '@/lib/apiClient';

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

interface WorkflowRun {
  id: number;
  workflowId: number | null;
  state: string;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  durationMs?: number | null;
}

interface Approval {
  id: number;
  workflowRunId: number;
  requestedFrom: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  expiresAt: string | null;
  createdAt: string;
}

function useRuns() {
  return useQuery<{ data: WorkflowRun[] } | WorkflowRun[]>({
    queryKey: ['szl-alloy-runs'],
    queryFn: () =>
      sharedApiFetch<{ data: WorkflowRun[] } | WorkflowRun[]>('/api/alloy/runs?limit=20'),
    refetchInterval: 60000,
    retry: 1,
  });
}

function useApprovals() {
  return useQuery<{ data: Approval[] } | Approval[]>({
    queryKey: ['szl-alloy-approvals-pending'],
    queryFn: () =>
      sharedApiFetch<{ data: Approval[] } | Approval[]>(
        '/api/alloy/approvals?status=pending&limit=20',
      ),
    refetchInterval: 60000,
    retry: 1,
  });
}

function useDecideApproval() {
  const qc = useQueryClient();
  return useOptimisticMutation<unknown, Error, { id: number; decision: string }>({
    queryKey: ['szl-alloy-approvals-pending'],
    updater: (old, variables) => {
      if (!old) return old;
      const list = Array.isArray(old) ? old : (old as { data?: Approval[] }).data;
      if (!Array.isArray(list)) return old;
      const updated = list.map((a: Approval) =>
        a.id === variables.id ? { ...a, status: variables.decision } : a,
      );
      return Array.isArray(old) ? updated : { ...(old as object), data: updated };
    },
    mutationFn: async ({ id, decision }) => {
      return sharedApiFetch(`/api/alloy/approvals/${id}/decide`, {
        method: 'POST',
        body: JSON.stringify({ decision }),
      });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['szl-alloy-runs'] });
    },
  });
}

const STATE_CONFIG: Record<string, { color: string; label: string; icon: FeatherIconName }> = {
  completed: { color: '#10b981', label: 'Completed', icon: 'check-circle' },
  failed: { color: '#ef4444', label: 'Failed', icon: 'x-circle' },
  running: { color: '#3b82f6', label: 'Running', icon: 'activity' },
  queued: { color: '#f59e0b', label: 'Queued', icon: 'clock' },
  waiting_approval: { color: '#8b5cf6', label: 'Awaiting Approval', icon: 'pause-circle' },
  canceled: { color: '#6b7280', label: 'Canceled', icon: 'slash' },
};

function formatRelative(ts: string | null) {
  if (!ts) return '—';
  const ms = Date.now() - new Date(ts).getTime();
  if (ms < 60000) return 'just now';
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
  return `${Math.floor(ms / 86400000)}d ago`;
}

function RunRow({ run, isNew }: { run: WorkflowRun; isNew?: boolean }) {
  const colors = useColors();
  const cfg = STATE_CONFIG[run.state] ?? {
    color: colors.mutedForeground,
    label: run.state,
    icon: 'circle' as FeatherIconName,
  };

  return (
    <View
      style={[
        styles.runRow,
        { borderColor: colors.borderSubtle },
        isNew ? { backgroundColor: 'rgba(201,168,76,0.04)' } : undefined,
      ]}
    >
      <View style={[styles.runIcon, { backgroundColor: `${cfg.color}15` }]}>
        <Feather name={cfg.icon} size={14} color={cfg.color} />
      </View>
      <View style={styles.runContent}>
        <View style={styles.runTopRow}>
          <Text style={[styles.runId, { color: colors.cream }]}>Run #{run.id}</Text>
          {run.workflowId && (
            <Text style={[styles.wfId, { color: colors.mutedForeground }]}>
              WF-{run.workflowId}
            </Text>
          )}
          {isNew && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>LIVE</Text>
            </View>
          )}
        </View>
        <View style={styles.runBottomRow}>
          <Text style={[styles.runState, { color: cfg.color }]}>{cfg.label}</Text>
          <Text style={[styles.runTime, { color: colors.mutedForeground }]}>
            {formatRelative(run.startedAt ?? run.createdAt)}
          </Text>
        </View>
        {run.errorMessage && (
          <Text style={[styles.runError, { color: '#ef4444' }]} numberOfLines={1}>
            {run.errorMessage}
          </Text>
        )}
      </View>
    </View>
  );
}

function ApprovalCard({
  approval,
  onDecide,
  isDeciding,
}: {
  approval: Approval;
  onDecide: (id: number, decision: string) => void;
  isDeciding: boolean;
}) {
  const colors = useColors();
  const expires = approval.expiresAt
    ? new Date(approval.expiresAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
    : null;

  return (
    <View
      style={[
        styles.approvalCard,
        { backgroundColor: colors.card, borderColor: 'rgba(245,158,11,0.2)' },
      ]}
    >
      <View style={styles.approvalTop}>
        <View style={[styles.approvalBadge, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
          <Feather name="clock" size={11} color="#f59e0b" />
          <Text style={[styles.approvalBadgeText, { color: '#f59e0b' }]}>PENDING</Text>
        </View>
        <Text style={[styles.approvalId, { color: colors.mutedForeground }]}>
          #{approval.id} · Run #{approval.workflowRunId}
        </Text>
      </View>
      <Text style={[styles.approvalRole, { color: colors.creamDim }]}>
        Requested from: <Text style={{ color: '#8b5cf6' }}>{approval.requestedFrom}</Text>
      </Text>
      {expires && (
        <Text style={[styles.approvalExpiry, { color: colors.mutedForeground }]}>
          Expires {expires}
        </Text>
      )}
      {isDeciding ? (
        <ActivityIndicator size="small" color={colors.gold} style={{ marginTop: 8 }} />
      ) : (
        <View style={styles.approvalActions}>
          <Pressable
            style={[styles.approveBtn, { borderColor: 'rgba(16,185,129,0.3)' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onDecide(approval.id, 'approved');
            }}
          >
            <Feather name="check" size={13} color="#10b981" />
            <Text style={[styles.approveBtnText, { color: '#10b981' }]}>Approve</Text>
          </Pressable>
          <Pressable
            style={[styles.rejectBtn, { borderColor: 'rgba(239,68,68,0.3)' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onDecide(approval.id, 'rejected');
            }}
          >
            <Feather name="x" size={13} color="#ef4444" />
            <Text style={[styles.rejectBtnText, { color: '#ef4444' }]}>Reject</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default function AlloyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'runs' | 'approvals'>('runs');
  const _qc = useQueryClient();
  const decideApproval = useDecideApproval();
  const [recentlyUpdatedIds, setRecentlyUpdatedIds] = useState<Set<number>>(new Set());

  const {
    data: runsData,
    isLoading: runsLoading,
    isError: runsError,
    refetch: refetchRuns,
  } = useRuns();
  const {
    data: approvalsData,
    isLoading: approvalsLoading,
    isError: approvalsError,
    refetch: refetchApprovals,
  } = useApprovals();

  const { status: wsStatus, lastEvent } = useAlloyWebSocket(true);

  useEffect(() => {
    if (lastEvent) {
      setRecentlyUpdatedIds((prev) => {
        const next = new Set(prev);
        next.add(lastEvent.id);
        return next;
      });
      const timer = setTimeout(() => {
        setRecentlyUpdatedIds((prev) => {
          const next = new Set(prev);
          next.delete(lastEvent.id);
          return next;
        });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [lastEvent]);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 + 84 : 90;

  const rawRuns: WorkflowRun[] =
    !runsError && runsData
      ? Array.isArray(runsData)
        ? runsData
        : ((runsData as { data: WorkflowRun[] }).data ?? [])
      : [];

  const rawApprovals: Approval[] =
    !approvalsError && approvalsData
      ? Array.isArray(approvalsData)
        ? approvalsData
        : ((approvalsData as { data: Approval[] }).data ?? [])
      : [];

  const pendingApprovals = rawApprovals.filter((a) => a.status === 'pending');

  const runningCount = rawRuns.filter((r) => r.state === 'running').length;
  const queuedCount = rawRuns.filter((r) => r.state === 'queued').length;
  const failedCount = rawRuns.filter((r) => r.state === 'failed').length;
  const completedCount = rawRuns.filter((r) => r.state === 'completed').length;

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await Promise.all([refetchRuns(), refetchApprovals()]);
    setRefreshing(false);
  }, [refetchRuns, refetchApprovals]);

  const handleDecide = useCallback(
    async (id: number, decision: string) => {
      const ok = await promptBiometric('Authenticate to submit workflow decision');
      if (!ok) {
        Alert.alert(
          'Authentication Required',
          'Biometric authentication is required to approve or reject workflow actions.',
        );
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      decideApproval.mutate(
        { id, decision },
        {
          onError: () => {
            Alert.alert('Error', 'Could not record decision. Please try again.');
          },
        },
      );
    },
    [decideApproval],
  );

  const wsColor =
    wsStatus === 'connected' ? '#10b981' : wsStatus === 'connecting' ? '#f59e0b' : '#6b7280';
  const wsLabel =
    wsStatus === 'connected' ? 'Live' : wsStatus === 'connecting' ? 'Connecting…' : 'Offline';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['rgba(139,92,246,0.05)', 'transparent']}
        style={[styles.headerGradient, { height: topPad + 120 }]}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topPad + 16, paddingBottom: bottomPad },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.eyebrow, { color: 'rgba(139,92,246,0.6)' }]}>
              FORGE · EXECUTION FABRIC
            </Text>
            <Text style={[styles.title, { color: colors.cream }]}>Workflow Monitor</Text>
          </View>
          <View
            style={[
              styles.wsBadge,
              { backgroundColor: `${wsColor}12`, borderColor: `${wsColor}30` },
            ]}
          >
            <View style={[styles.wsDot, { backgroundColor: wsColor }]} />
            <Text style={[styles.wsLabel, { color: wsColor }]}>{wsLabel}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          {[
            { label: 'Running', value: runningCount, color: '#3b82f6' },
            { label: 'Queued', value: queuedCount, color: '#f59e0b' },
            { label: 'Failed', value: failedCount, color: '#ef4444' },
            { label: 'Done', value: completedCount, color: '#10b981' },
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

        <View style={styles.tabs}>
          <Pressable
            style={[
              styles.tabBtn,
              {
                backgroundColor: tab === 'runs' ? 'rgba(139,92,246,0.1)' : 'transparent',
                borderColor: tab === 'runs' ? 'rgba(139,92,246,0.3)' : colors.borderSubtle,
              },
            ]}
            onPress={() => setTab('runs')}
          >
            <Text
              style={[
                styles.tabBtnText,
                { color: tab === 'runs' ? '#8b5cf6' : colors.mutedForeground },
              ]}
            >
              Recent Runs
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.tabBtn,
              {
                backgroundColor: tab === 'approvals' ? 'rgba(245,158,11,0.1)' : 'transparent',
                borderColor: tab === 'approvals' ? 'rgba(245,158,11,0.3)' : colors.borderSubtle,
              },
            ]}
            onPress={() => setTab('approvals')}
          >
            <Text
              style={[
                styles.tabBtnText,
                { color: tab === 'approvals' ? '#f59e0b' : colors.mutedForeground },
              ]}
            >
              Approvals
              {pendingApprovals.length > 0 && (
                <Text style={{ color: '#f59e0b' }}> {pendingApprovals.length}</Text>
              )}
            </Text>
          </Pressable>
        </View>

        {tab === 'runs' && (
          <View>
            {runsLoading ? (
              <View style={{ gap: 8 }}>
                {[1, 2, 3].map((i) => (
                  <SkeletonLoader key={i} width="100%" height={60} borderRadius={8} />
                ))}
              </View>
            ) : runsError ? (
              <View style={[styles.emptyState, { borderColor: colors.borderSubtle }]}>
                <ActivityIndicator
                  size="small"
                  color={colors.mutedForeground}
                  style={{ opacity: 0.4 }}
                />
                <Text style={[styles.emptyTitle, { color: colors.creamDim }]}>
                  Cannot reach FORGE
                </Text>
                <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
                  Server appears to be offline. Pull to retry.
                </Text>
              </View>
            ) : rawRuns.length === 0 ? (
              <View style={[styles.emptyState, { borderColor: colors.borderSubtle }]}>
                <Feather
                  name="git-merge"
                  size={28}
                  color={colors.mutedForeground}
                  style={{ opacity: 0.4 }}
                />
                <Text style={[styles.emptyTitle, { color: colors.creamDim }]}>
                  No workflow runs
                </Text>
                <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
                  No runs found in the last 24 hours.
                </Text>
              </View>
            ) : (
              <View style={[styles.runList, { borderColor: colors.borderSubtle }]}>
                {rawRuns.slice(0, 12).map((run) => (
                  <RunRow key={run.id} run={run} isNew={recentlyUpdatedIds.has(run.id)} />
                ))}
              </View>
            )}
          </View>
        )}

        {tab === 'approvals' && (
          <View style={{ gap: 10 }}>
            {approvalsLoading ? (
              <View style={{ gap: 8 }}>
                {[1, 2].map((i) => (
                  <SkeletonLoader key={i} width="100%" height={100} borderRadius={8} />
                ))}
              </View>
            ) : approvalsError ? (
              <View style={[styles.emptyState, { borderColor: colors.borderSubtle }]}>
                <ActivityIndicator
                  size="small"
                  color={colors.mutedForeground}
                  style={{ opacity: 0.4 }}
                />
                <Text style={[styles.emptyTitle, { color: colors.creamDim }]}>
                  Approvals unavailable
                </Text>
                <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
                  Cannot reach server. Pull down to retry.
                </Text>
              </View>
            ) : pendingApprovals.length === 0 ? (
              <View style={[styles.emptyState, { borderColor: colors.borderSubtle }]}>
                <Feather name="check-circle" size={28} color="#10b981" style={{ opacity: 0.4 }} />
                <Text style={[styles.emptyTitle, { color: colors.creamDim }]}>
                  No pending approvals
                </Text>
                <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
                  All workflow runs are proceeding without human-in-the-loop intervention.
                </Text>
              </View>
            ) : (
              pendingApprovals.map((approval) => (
                <ApprovalCard
                  key={approval.id}
                  approval={approval}
                  onDecide={handleDecide}
                  isDeciding={
                    decideApproval.isPending && decideApproval.variables?.id === approval.id
                  }
                />
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { position: 'absolute', top: 0, left: 0, right: 0 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  eyebrow: {
    fontSize: 9,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 3,
    marginBottom: 6,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_300Light',
  },
  wsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  wsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  wsLabel: {
    fontSize: 9,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    gap: 3,
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Inter_500Medium',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 8,
    fontFamily: 'Inter_300Light',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  tabBtnText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  runList: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  runRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    gap: 10,
    borderBottomWidth: 1,
  },
  runIcon: {
    width: 30,
    height: 30,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  runContent: { flex: 1, gap: 3 },
  runTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  runId: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  wfId: {
    fontSize: 10,
    fontFamily: 'Inter_300Light',
  },
  newBadge: {
    backgroundColor: 'rgba(201,168,76,0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  newBadgeText: {
    fontSize: 7,
    fontFamily: 'Inter_600SemiBold',
    color: '#c9a84c',
    letterSpacing: 1,
  },
  runBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  runState: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
  },
  runTime: {
    fontSize: 10,
    fontFamily: 'Inter_300Light',
  },
  runError: {
    fontSize: 10,
    fontFamily: 'Inter_300Light',
    marginTop: 2,
  },
  approvalCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  approvalTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  approvalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  approvalBadgeText: {
    fontSize: 8,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
  },
  approvalId: {
    fontSize: 11,
    fontFamily: 'Inter_300Light',
  },
  approvalRole: {
    fontSize: 12,
    fontFamily: 'Inter_300Light',
  },
  approvalExpiry: {
    fontSize: 10,
    fontFamily: 'Inter_300Light',
  },
  approvalActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(16,185,129,0.06)',
  },
  approveBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(239,68,68,0.06)',
  },
  rejectBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  emptyState: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    marginTop: 4,
  },
  emptyBody: {
    fontSize: 12,
    fontFamily: 'Inter_300Light',
    textAlign: 'center',
    lineHeight: 18,
  },
});
