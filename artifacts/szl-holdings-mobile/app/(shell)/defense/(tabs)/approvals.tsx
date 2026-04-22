import { Feather, Ionicons } from '@expo/vector-icons';
import { useSyncEngine } from '@szl-holdings/mobile-shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OfflineQueuePanel } from '@/components/OfflineQueuePanel';
import { useColors } from '@/hooks/useColors';
import { apiGet, apiPut } from '@/lib/apiClient';
import { cacheGetStale, cacheSet } from '@/lib/cache';

const TRADECRAFT_QUEUE_KEY = 'defense:tradecraft-offline-queue';

interface QueuedAction {
  objectId: string;
  decisionSummary: string;
  action: 'approve' | 'reject';
  queuedAt: string;
}

async function loadTradecraftQueue(): Promise<QueuedAction[]> {
  try {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const raw = await AsyncStorage.getItem(TRADECRAFT_QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedAction[]) : [];
  } catch {
    return [];
  }
}

async function saveTradecraftQueue(items: QueuedAction[]): Promise<void> {
  try {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    await AsyncStorage.setItem(TRADECRAFT_QUEUE_KEY, JSON.stringify(items));
  } catch {}
}

function QueuedActionCard({
  item,
  colors,
  onRetry,
  onDiscard,
}: {
  item: QueuedAction;
  colors: ReturnType<typeof useColors>;
  onRetry: (item: QueuedAction) => void;
  onDiscard: (objectId: string) => void;
}) {
  const actionColor = item.action === 'approve' ? '#22c55e' : '#ef4444';
  return (
    <View
      style={[styles.queuedCard, { backgroundColor: colors.navyLight, borderColor: '#f59e0b40' }]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 7,
            paddingVertical: 3,
            borderRadius: 8,
            backgroundColor: '#f59e0b15',
            borderWidth: 1,
            borderColor: '#f59e0b40',
          }}
        >
          <Feather name="clock" size={9} color="#f59e0b" />
          <Text style={{ fontSize: 9, fontWeight: '700', color: '#f59e0b', letterSpacing: 0.5 }}>
            QUEUED OFFLINE
          </Text>
        </View>
        <View
          style={{
            paddingHorizontal: 7,
            paddingVertical: 3,
            borderRadius: 8,
            backgroundColor: `${actionColor}18`,
            borderWidth: 1,
            borderColor: `${actionColor}35`,
          }}
        >
          <Text style={{ fontSize: 9, fontWeight: '700', color: actionColor, letterSpacing: 0.5 }}>
            {item.action.toUpperCase()}
          </Text>
        </View>
      </View>
      <Text
        style={{
          fontSize: 13,
          fontFamily: 'SpaceGrotesk_600SemiBold',
          color: colors.foreground,
          marginBottom: 4,
        }}
        numberOfLines={2}
      >
        {item.decisionSummary}
      </Text>
      <Text style={{ fontSize: 10, color: colors.muted, marginBottom: 10 }}>
        {item.objectId.slice(0, 12)}
      </Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity
          onPress={() => onRetry(item)}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: '#c9a84c18',
            borderWidth: 1,
            borderColor: '#c9a84c40',
          }}
        >
          <Feather name="upload-cloud" size={11} color="#c9a84c" />
          <Text style={{ fontSize: 11, fontWeight: '600', color: '#c9a84c' }}>Retry Now</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onDiscard(item.objectId)}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: '#ef444418',
            borderWidth: 1,
            borderColor: '#ef444440',
          }}
        >
          <Feather name="trash-2" size={11} color="#ef4444" />
          <Text style={{ fontSize: 11, fontWeight: '600', color: '#ef4444' }}>Discard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface Decision {
  id?: number;
  objectId?: string;
  decisionType?: string;
  summary?: string;
  recommendedAction?: string;
  issueStatement?: string;
  caseId?: string;
  incidentId?: string;
  impactLevel?: string;
  urgency?: string;
  approvalRequired?: boolean;
  approvalReason?: string;
  humanReviewRequired?: boolean;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  modelRoute?: string;
  createdAt?: string;
  status?: string;
}

function getReviewStatus(d: Decision): 'pending' | 'approved' | 'rejected' {
  if (d.approvedAt) return 'approved';
  if (d.rejectedAt) return 'rejected';
  return 'pending';
}

function needsReview(d: Decision): boolean {
  return (
    (d.approvalRequired === true || d.humanReviewRequired === true) &&
    !d.approvedAt &&
    !d.rejectedAt
  );
}

function relativeTime(iso?: string): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function ApprovalCard({
  item,
  onApprove,
  onReject,
  approving,
}: {
  item: Decision;
  onApprove: (objectId: string) => void;
  onReject: (objectId: string) => void;
  approving: string | null;
}) {
  const colors = useColors();
  const IMPACT_COLORS: Record<string, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#f59e0b',
    low: '#3b82f6',
    negligible: '#6b7280',
  };
  const impact = item.impactLevel ?? 'medium';
  const impactColor = IMPACT_COLORS[impact] ?? '#6b7280';
  const reviewStatus = getReviewStatus(item);
  const isPending = reviewStatus === 'pending';
  const objectId = item.objectId ?? String(item.id ?? '');
  const isProcessing = approving === objectId;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.navyLight,
          borderColor: isPending ? `${impactColor}40` : colors.border,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <View style={[styles.badge, { backgroundColor: `${impactColor}20` }]}>
            <Text style={[styles.badgeText, { color: impactColor }]}>{impact.toUpperCase()}</Text>
          </View>
          <Text style={[styles.approvalId, { color: colors.muted }]}>{objectId.slice(0, 12)}</Text>
          <View
            style={[
              styles.badge,
              {
                backgroundColor:
                  reviewStatus === 'approved'
                    ? '#22c55e20'
                    : reviewStatus === 'rejected'
                      ? '#ef444420'
                      : '#f59e0b20',
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                {
                  color:
                    reviewStatus === 'approved'
                      ? '#22c55e'
                      : reviewStatus === 'rejected'
                        ? '#ef4444'
                        : '#f59e0b',
                },
              ]}
            >
              {reviewStatus.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={[styles.timeText, { color: colors.muted }]}>
          {relativeTime(item.createdAt)}
        </Text>
      </View>

      <Text style={[styles.actionTitle, { color: colors.foreground }]}>
        {item.recommendedAction ?? item.summary ?? 'Decision pending review'}
      </Text>
      {item.decisionType && (
        <Text style={[styles.caseRef, { color: colors.amber }]}>{item.decisionType}</Text>
      )}
      {item.caseId && (
        <Text style={[styles.caseRef, { color: colors.muted }]}>Case: {item.caseId}</Text>
      )}

      {item.issueStatement && (
        <Text style={[styles.description, { color: colors.muted }]}>{item.issueStatement}</Text>
      )}

      {item.approvalReason && (
        <View
          style={[
            styles.riskBox,
            { backgroundColor: `${impactColor}10`, borderColor: `${impactColor}30` },
          ]}
        >
          <Ionicons name="warning-outline" size={12} color={impactColor} />
          <Text style={[styles.riskText, { color: impactColor }]}>{item.approvalReason}</Text>
        </View>
      )}

      {item.urgency && (
        <Text style={[styles.requestedBy, { color: colors.muted }]}>Urgency: {item.urgency}</Text>
      )}
      {item.modelRoute && (
        <Text style={[styles.requestedBy, { color: colors.muted }]}>Via: {item.modelRoute}</Text>
      )}
      {item.approvedAt && (
        <Text style={[styles.requestedBy, { color: '#22c55e' }]}>
          Approved {relativeTime(item.approvedAt ?? undefined)} by {item.approvedBy ?? 'operator'}
        </Text>
      )}
      {item.rejectedAt && (
        <Text style={[styles.requestedBy, { color: '#ef4444' }]}>
          Rejected {relativeTime(item.rejectedAt ?? undefined)}
          {item.rejectionReason ? ` — ${item.rejectionReason}` : ''}
        </Text>
      )}

      {isPending && needsReview(item) && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.rejectBtn, { borderColor: '#ef4444' }]}
            onPress={() => onReject(objectId)}
            disabled={isProcessing}
          >
            <Ionicons name="close" size={14} color="#ef4444" />
            <Text style={styles.rejectText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.approveBtn, { backgroundColor: isProcessing ? '#22c55e80' : '#22c55e' }]}
            onPress={() => onApprove(objectId)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="checkmark" size={14} color="white" />
                <Text style={styles.approveBtnText}>Approve</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function ApprovalsTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [approving, setApproving] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending');
  const [offlineQueue, setOfflineQueue] = useState<QueuedAction[]>([]);
  const [queueLoaded, setQueueLoaded] = useState(false);
  const queryClient = useQueryClient();
  const syncEngine = useSyncEngine();
  const isOffline = !syncEngine.isOnline;

  const CACHE_KEY = 'cache_tradecraft_decisions';

  useEffect(() => {
    loadTradecraftQueue().then((items) => {
      setOfflineQueue(items);
      setQueueLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!queueLoaded) return;
    saveTradecraftQueue(offlineQueue);
  }, [offlineQueue, queueLoaded]);

  const flushTradecraftQueue = useCallback(async () => {
    const queue = await loadTradecraftQueue();
    if (queue.length === 0) return;
    const remaining: QueuedAction[] = [];
    for (const item of queue) {
      try {
        await apiPut(`/api/aegis/tradecraft/decisions/${item.objectId}`, { action: item.action });
      } catch {
        remaining.push(item);
      }
    }
    setOfflineQueue(remaining);
    if (remaining.length < queue.length) {
      queryClient.invalidateQueries({ queryKey: ['tradecraft-decisions'] });
    }
  }, [queryClient]);

  useEffect(() => {
    if (!queueLoaded) return;
    if (!isOffline && offlineQueue.length > 0) {
      flushTradecraftQueue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOffline, queueLoaded]);

  const {
    data: apiDecisions,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['tradecraft-decisions'],
    queryFn: async () => {
      try {
        const data = await apiGet<Decision[]>('/api/aegis/tradecraft/decisions');
        await cacheSet(CACHE_KEY, data);
        return data;
      } catch {
        const cached = await cacheGetStale<Decision[]>(CACHE_KEY);
        if (cached) return cached;
        return [] as Decision[];
      }
    },
    refetchInterval: isOffline ? false : 30000,
  });

  const decisions: Decision[] = Array.isArray(apiDecisions) ? apiDecisions : [];
  const queuedIds = new Set(offlineQueue.map((q) => q.objectId));
  const pendingCount = decisions.filter(
    (d) => needsReview(d) && !queuedIds.has(d.objectId ?? String(d.id ?? '')),
  ).length;

  async function handleApprove(objectId: string, item: Decision) {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isOffline) {
      const entry: QueuedAction = {
        objectId,
        decisionSummary: item.recommendedAction ?? item.summary ?? objectId,
        action: 'approve',
        queuedAt: new Date().toISOString(),
      };
      setOfflineQueue((prev) => [...prev.filter((q) => q.objectId !== objectId), entry]);
      return;
    }
    setApproving(objectId);
    try {
      await apiPut(`/api/aegis/tradecraft/decisions/${objectId}`, { action: 'approve' });
    } catch {
      Alert.alert(
        'Approval failed',
        'Could not submit approval. Please try again or check your connection.',
      );
    } finally {
      await queryClient.invalidateQueries({ queryKey: ['tradecraft-decisions'] });
      setApproving(null);
    }
  }

  async function handleReject(objectId: string, item: Decision) {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Reject Action', 'Are you sure you want to reject this action?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          if (isOffline) {
            const entry: QueuedAction = {
              objectId,
              decisionSummary: item.recommendedAction ?? item.summary ?? objectId,
              action: 'reject',
              queuedAt: new Date().toISOString(),
            };
            setOfflineQueue((prev) => [...prev.filter((q) => q.objectId !== objectId), entry]);
            return;
          }
          try {
            await apiPut(`/api/aegis/tradecraft/decisions/${objectId}`, { action: 'reject' });
          } catch {
            Alert.alert(
              'Rejection failed',
              'Could not submit rejection. Please try again or check your connection.',
            );
          } finally {
            await queryClient.invalidateQueries({ queryKey: ['tradecraft-decisions'] });
          }
        },
      },
    ]);
  }

  const retryQueuedItem = useCallback(
    async (item: QueuedAction) => {
      try {
        await apiPut(`/api/aegis/tradecraft/decisions/${item.objectId}`, { action: item.action });
        setOfflineQueue((prev) => prev.filter((q) => q.objectId !== item.objectId));
        queryClient.invalidateQueries({ queryKey: ['tradecraft-decisions'] });
        Alert.alert('Synced', 'Queued action submitted successfully.');
      } catch {
        Alert.alert('Still offline', 'Cannot reach the server. Action remains queued.');
      }
    },
    [queryClient],
  );

  const discardQueuedItem = useCallback((objectId: string) => {
    Alert.alert('Discard Action', 'Remove this queued decision? It will not be submitted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => setOfflineQueue((prev) => prev.filter((q) => q.objectId !== objectId)),
      },
    ]);
  }, []);

  const displayed = decisions.filter((d) => {
    if (queuedIds.has(d.objectId ?? String(d.id ?? ''))) return false;
    const rs = getReviewStatus(d);
    if (filter === 'pending') return rs === 'pending' && needsReview(d);
    if (filter === 'approved') return rs === 'approved' || rs === 'rejected';
    return true;
  });

  const showQueue = offlineQueue.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.navy, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Approval Queue</Text>
          <Text style={[styles.headerSub, { color: colors.muted }]}>
            {pendingCount} pending
            {offlineQueue.length > 0 ? ` · ${offlineQueue.length} queued` : ''} · Tap to act
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          {isOffline && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 10,
                backgroundColor: '#f59e0b15',
                borderWidth: 1,
                borderColor: '#f59e0b30',
              }}
            >
              <Feather name="wifi-off" size={10} color="#f59e0b" />
              <Text
                style={{ fontSize: 9, fontWeight: '700', color: '#f59e0b', letterSpacing: 0.5 }}
              >
                OFFLINE
              </Text>
            </View>
          )}
          {pendingCount > 0 && (
            <View style={[styles.badge, { backgroundColor: '#ef4444' }]}>
              <Text style={[styles.badgeText, { color: 'white' }]}>{pendingCount}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={[styles.filterRow, { borderBottomColor: colors.border }]}>
        {(['pending', 'all', 'approved'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[
              styles.filterBtn,
              filter === f && { borderBottomColor: colors.amber, borderBottomWidth: 2 },
            ]}
          >
            <Text
              style={[styles.filterText, { color: filter === f ? colors.amber : colors.muted }]}
            >
              {f === 'pending' ? 'Pending' : f === 'approved' ? 'Resolved' : 'All'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 80 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.amber} />
        }
      >
        <OfflineQueuePanel
          isOffline={isOffline}
          refreshKey={offlineQueue.length}
          onChanged={() => {
            loadTradecraftQueue().then(setOfflineQueue);
            queryClient.invalidateQueries({ queryKey: ['tradecraft-decisions'] });
          }}
        />
        {showQueue && (
          <View style={{ marginBottom: 4 }}>
            <Text
              style={{
                fontSize: 10,
                fontWeight: '700',
                color: '#f59e0b',
                letterSpacing: 1,
                marginBottom: 8,
              }}
            >
              PENDING SYNC ({offlineQueue.length})
            </Text>
            {offlineQueue.map((q) => (
              <QueuedActionCard
                key={q.objectId}
                item={q}
                colors={colors}
                onRetry={retryQueuedItem}
                onDiscard={discardQueuedItem}
              />
            ))}
          </View>
        )}
        {isLoading && (
          <View style={styles.emptyState}>
            <ActivityIndicator color={colors.amber} />
          </View>
        )}
        {!isLoading && displayed.length === 0 && !showQueue && (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={40} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              No approvals in this queue
            </Text>
          </View>
        )}
        {displayed.map((item) => (
          <ApprovalCard
            key={item.id ?? item.objectId}
            item={item}
            onApprove={(id) => handleApprove(id, item)}
            onReject={(id) => handleReject(id, item)}
            approving={approving}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 18, fontFamily: 'SpaceGrotesk_700Bold', letterSpacing: -0.5 },
  headerSub: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  filterRow: { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 16 },
  filterBtn: { paddingVertical: 10, paddingHorizontal: 12, marginRight: 4 },
  filterText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  scroll: { flex: 1 },
  card: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  badgeText: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  approvalId: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  timeText: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  actionTitle: { fontSize: 14, fontFamily: 'SpaceGrotesk_600SemiBold', lineHeight: 20 },
  caseRef: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  description: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  riskBox: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
  },
  riskText: { fontSize: 11, fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 16 },
  requestedBy: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  rejectText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#ef4444' },
  approveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  approveBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: 'white' },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  queuedCard: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 10 },
});
