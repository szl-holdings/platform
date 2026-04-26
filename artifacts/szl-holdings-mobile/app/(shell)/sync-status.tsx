import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import {
  getCacheStats,
  getConflicts,
  getLastSyncInfo,
  getSyncQueue,
  type ConflictRecord,
  type SyncQueueItem,
} from '@/lib/offline-sync';

const ACCENT = '#c9a84c';

export default function SyncStatusScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<{ totalEntities: number; byType: Record<string, number>; pendingSync: number; conflicts: number; cacheSize: number } | null>(null);
  const [lastSync, setLastSync] = useState<{ timestamp: number; synced: number; conflicts: number; errors: number } | null>(null);
  const [queue, setQueue] = useState<SyncQueueItem[]>([]);
  const [conflictRecords, setConflictRecords] = useState<ConflictRecord[]>([]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [s, ls, q, c] = await Promise.all([
        getCacheStats(),
        getLastSyncInfo(),
        getSyncQueue(),
        getConflicts(),
      ]);
      setStats(s);
      setLastSync(ls);
      setQueue(q);
      setConflictRecords(c);
    } catch {
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60_000) return 'Just now';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return new Date(ts).toLocaleDateString();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Offline Sync Status</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={ACCENT} />}
      >
        <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
          <View style={[styles.statusIcon, { backgroundColor: stats?.pendingSync ? '#f59e0b22' : '#22c55e22' }]}>
            <Feather
              name={stats?.pendingSync ? 'upload-cloud' : 'check-circle'}
              size={28}
              color={stats?.pendingSync ? '#f59e0b' : '#22c55e'}
            />
          </View>
          <Text style={[styles.statusTitle, { color: colors.text }]}>
            {stats?.pendingSync ? `${stats.pendingSync} Pending` : 'All Synced'}
          </Text>
          <Text style={[styles.statusSubtitle, { color: colors.secondaryText }]}>
            {lastSync ? `Last sync ${formatTime(lastSync.timestamp)}` : 'No sync history'}
          </Text>
        </View>

        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.metricValue, { color: ACCENT }]}>{stats?.totalEntities ?? 0}</Text>
            <Text style={[styles.metricLabel, { color: colors.secondaryText }]}>Cached</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.metricValue, { color: '#3b82f6' }]}>{stats?.pendingSync ?? 0}</Text>
            <Text style={[styles.metricLabel, { color: colors.secondaryText }]}>Pending</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.metricValue, { color: stats?.conflicts ? '#ef4444' : '#22c55e' }]}>
              {stats?.conflicts ?? 0}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.secondaryText }]}>Conflicts</Text>
          </View>
        </View>

        {lastSync && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Last Sync Summary</Text>
            <View style={styles.syncRow}>
              <Feather name="check" size={14} color="#22c55e" />
              <Text style={[styles.syncText, { color: colors.text }]}>{lastSync.synced} synced</Text>
            </View>
            {lastSync.conflicts > 0 && (
              <View style={styles.syncRow}>
                <Feather name="alert-triangle" size={14} color="#f59e0b" />
                <Text style={[styles.syncText, { color: colors.text }]}>{lastSync.conflicts} conflicts</Text>
              </View>
            )}
            {lastSync.errors > 0 && (
              <View style={styles.syncRow}>
                <Feather name="x-circle" size={14} color="#ef4444" />
                <Text style={[styles.syncText, { color: colors.text }]}>{lastSync.errors} errors</Text>
              </View>
            )}
          </View>
        )}

        {stats?.byType && Object.keys(stats.byType).length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Cache by Type</Text>
            {Object.entries(stats.byType).map(([type, count]) => (
              <View key={type} style={styles.typeRow}>
                <Text style={[styles.typeName, { color: colors.text }]}>{type}</Text>
                <Text style={[styles.typeCount, { color: colors.secondaryText }]}>{count}</Text>
              </View>
            ))}
          </View>
        )}

        {queue.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Sync Queue</Text>
            {queue.slice(0, 10).map((item) => (
              <View key={item.id} style={styles.queueItem}>
                <Feather
                  name={item.operation === 'create' ? 'plus-circle' : item.operation === 'delete' ? 'minus-circle' : 'edit-2'}
                  size={14}
                  color={ACCENT}
                />
                <View style={styles.queueItemInfo}>
                  <Text style={[styles.queueType, { color: colors.text }]}>
                    {item.operation} {item.entityType}
                  </Text>
                  <Text style={[styles.queueMeta, { color: colors.secondaryText }]}>
                    {formatTime(item.queuedAt)} · {item.retryCount} retries
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {conflictRecords.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: '#ef4444' }]}>Conflicts</Text>
            {conflictRecords.map((c) => (
              <View key={`${c.entityType}:${c.entityId}`} style={styles.conflictItem}>
                <Feather name="git-merge" size={14} color="#ef4444" />
                <View style={styles.conflictInfo}>
                  <Text style={[styles.conflictType, { color: colors.text }]}>
                    {c.entityType} — {c.entityId.slice(0, 8)}
                  </Text>
                  <Text style={[styles.conflictMeta, { color: colors.secondaryText }]}>
                    Client v{c.clientVersion} vs Server v{c.serverVersion}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  backBtn: { padding: 4 },
  title: { fontSize: 20, fontWeight: '700' },
  content: { paddingHorizontal: 16, paddingBottom: 100, gap: 16 },
  statusCard: { alignItems: 'center', padding: 28, borderRadius: 16, gap: 10 },
  statusIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  statusTitle: { fontSize: 20, fontWeight: '800' },
  statusSubtitle: { fontSize: 13 },
  metricsRow: { flexDirection: 'row', gap: 10 },
  metricCard: { flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: 12 },
  metricValue: { fontSize: 24, fontWeight: '800' },
  metricLabel: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  section: { borderRadius: 14, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  syncRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  syncText: { fontSize: 14 },
  typeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  typeName: { fontSize: 14, textTransform: 'capitalize' },
  typeCount: { fontSize: 14, fontWeight: '600' },
  queueItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  queueItemInfo: { flex: 1, gap: 2 },
  queueType: { fontSize: 14, textTransform: 'capitalize' },
  queueMeta: { fontSize: 11 },
  conflictItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  conflictInfo: { flex: 1, gap: 2 },
  conflictType: { fontSize: 14 },
  conflictMeta: { fontSize: 11 },
});
