import { getApiBase } from '@/lib/apiClient';
import { useRouter } from 'expo-router';
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle,
  ChevronRight,
  ExternalLink,
  Globe,
  Info,
  RefreshCw,
  Shield,
} from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const ACCENT = '#8b7ac8';

const DOMAIN_COLORS: Record<string, string> = {
  aegis: '#ef4444',
  sentra: '#22c55e',
  vessels: '#4d8fcc',
  terra: '#22c55e',
  counsel: '#8b5cf6',
  command: '#8b7ac8',
  a11oy: '#c9b787',
  holdings: '#c9b787',
  pulse: '#f59e0b',
  lyte: '#3b82f6',
};

const LEVEL_META = {
  critical: { color: '#ef4444', label: 'CRITICAL', icon: AlertTriangle },
  warning: { color: '#f59e0b', label: 'WARNING', icon: AlertTriangle },
  info: { color: '#3b82f6', label: 'INFO', icon: Info },
  success: { color: '#22c55e', label: 'SUCCESS', icon: CheckCircle },
};

interface OmniaNotification {
  id: string;
  artifactId: string;
  artifactName: string;
  title: string;
  message: string;
  level: 'critical' | 'warning' | 'info' | 'success';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  entityRef?: string;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return `${Math.floor(diff / 3_600_000)}h ago`;
}

const SEED: OmniaNotification[] = [
  {
    id: 'n-001',
    artifactId: 'aegis',
    artifactName: 'PARAGON',
    title: 'APT-41 threat cluster elevated',
    message: 'Cluster upgraded to HIGH confidence (0.92). Two DOMAINE assets affected.',
    level: 'critical',
    timestamp: new Date(Date.now() - 45_000).toISOString(),
    read: false,
    actionUrl: '/aegis',
    entityRef: 'e-apt41',
  },
  {
    id: 'n-002',
    artifactId: 'vessels',
    artifactName: 'SEXTANT',
    title: 'MV Stellarwind route deviation',
    message: '14 nm off planned route. Insurance tier breach probability 82%.',
    level: 'warning',
    timestamp: new Date(Date.now() - 3 * 60_000).toISOString(),
    read: false,
    actionUrl: '/vessels',
    entityRef: 'e-stellarwind',
  },
  {
    id: 'n-003',
    artifactId: 'counsel',
    artifactName: 'Counsel',
    title: 'Matter CJL-2291 deadline',
    message: '48-hour response deadline approaching. Assigned counsel M. Okafor.',
    level: 'warning',
    timestamp: new Date(Date.now() - 60 * 60_000).toISOString(),
    read: true,
    actionUrl: '/counsel',
    entityRef: 'matter-cjl2291',
  },
  {
    id: 'n-004',
    artifactId: 'a11oy',
    artifactName: 'A11oy',
    title: '3 HITL approvals pending',
    message: 'Three governance approvals awaiting human-in-the-loop decision.',
    level: 'info',
    timestamp: new Date(Date.now() - 15 * 60_000).toISOString(),
    read: false,
    actionUrl: '/a11oy',
  },
  {
    id: 'n-005',
    artifactId: 'terra',
    artifactName: 'DOMAINE',
    title: 'TER-8821 restored to compliance',
    message: 'Property returned to full covenant compliance after governance action.',
    level: 'success',
    timestamp: new Date(Date.now() - 2 * 3600_000).toISOString(),
    read: true,
    actionUrl: '/terra',
  },
  {
    id: 'n-006',
    artifactId: 'command',
    artifactName: 'Command',
    title: 'World model refreshed',
    message: '312 entities across 12 domains updated. 2 new causal links discovered.',
    level: 'info',
    timestamp: new Date(Date.now() - 45_000).toISOString(),
    read: true,
    actionUrl: '/command/omnia/world-model',
  },
];

function NotificationRow({
  item,
  onMarkRead,
}: {
  item: OmniaNotification;
  onMarkRead: (id: string) => void;
}) {
  const domainColor = DOMAIN_COLORS[item.artifactId] ?? ACCENT;
  const levelMeta = LEVEL_META[item.level];
  const LevelIcon = levelMeta.icon;

  return (
    <Pressable
      onPress={() => onMarkRead(item.id)}
      style={({ pressed }) => [
        styles.notifRow,
        !item.read && styles.notifRowUnread,
        pressed && styles.notifRowPressed,
      ]}
    >
      <View style={styles.notifIconCol}>
        <View style={[styles.notifDot, { backgroundColor: domainColor }]} />
      </View>
      <View style={styles.notifContent}>
        <View style={styles.notifHeader}>
          <View style={[styles.levelBadge, { backgroundColor: `${levelMeta.color}20`, borderColor: `${levelMeta.color}40` }]}>
            <LevelIcon size={9} color={levelMeta.color} />
            <Text style={[styles.levelText, { color: levelMeta.color }]}>
              {levelMeta.label}
            </Text>
          </View>
          <Text style={[styles.artifactTag, { color: domainColor }]}>
            {item.artifactName.toUpperCase()}
          </Text>
          <Text style={styles.timeText}>{relativeTime(item.timestamp)}</Text>
        </View>
        <Text style={[styles.notifTitle, !item.read && styles.notifTitleUnread]}>
          {item.title}
        </Text>
        <Text style={styles.notifMessage} numberOfLines={2}>
          {item.message}
        </Text>
      </View>
      {!item.read && <View style={[styles.unreadIndicator, { backgroundColor: ACCENT }]} />}
    </Pressable>
  );
}

export default function OmniaNotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<OmniaNotification[]>(SEED);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/api/omnia/notifications`);
      if (res.ok) {
        const data = await res.json();
        if (data.notifications?.length > 0) {
          setNotifications(data.notifications);
        }
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const displayedNotifications =
    filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Globe size={18} color={ACCENT} />
          <View>
            <Text style={styles.headerTitle}>OMNIA Notifications</Text>
            <Text style={styles.headerSubtitle}>
              {unreadCount > 0 ? `${unreadCount} unread across portfolio` : 'All caught up'}
            </Text>
          </View>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterRow}>
        {(['all', 'unread'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
          >
            <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
              {f === 'all' ? 'All' : `Unread (${unreadCount})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={displayedNotifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationRow item={item} onMarkRead={markRead} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
            tintColor={ACCENT}
          />
        }
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Bell size={32} color="rgba(255,255,255,0.2)" />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'unread' ? 'All caught up.' : 'No portfolio signals yet.'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060b12',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: 'rgba(235,230,220,0.95)',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 1,
  },
  markAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: `${ACCENT}15`,
    borderWidth: 1,
    borderColor: `${ACCENT}30`,
    borderRadius: 8,
  },
  markAllText: {
    fontSize: 11,
    color: ACCENT,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  filterTabActive: {
    backgroundColor: `${ACCENT}18`,
    borderColor: `${ACCENT}40`,
  },
  filterTabText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: ACCENT,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 40,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    position: 'relative',
  },
  notifRowUnread: {
    backgroundColor: 'rgba(139,122,200,0.04)',
  },
  notifRowPressed: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  notifIconCol: {
    width: 20,
    alignItems: 'center',
    paddingTop: 4,
    marginRight: 10,
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notifContent: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
    flexWrap: 'wrap',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
  },
  levelText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  artifactTag: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  timeText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
    marginLeft: 'auto',
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(235,230,220,0.7)',
    marginBottom: 3,
  },
  notifTitleUnread: {
    color: 'rgba(235,230,220,0.95)',
    fontWeight: '600',
  },
  notifMessage: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    lineHeight: 17,
  },
  unreadIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.3)',
  },
  emptySubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.2)',
  },
});
