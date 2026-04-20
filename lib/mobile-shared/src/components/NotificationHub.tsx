import { useQueries } from '@tanstack/react-query';
import type React from 'react';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export interface NotificationItem {
  id: string;
  domain: 'aegis' | 'vessels' | 'terra' | 'lyte' | 'szl' | 'carlota' | 'stephen' | string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  body?: string;
  timestamp: string;
  read: boolean;
  deepLink?: string;
  action?: string;
}

export interface NotificationFetcher {
  domain: string;
  label: string;
  color: string;
  fetch: () => Promise<NotificationItem[]>;
}

const SEV_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#3b82f6',
  info: '#6b7280',
};

const SEV_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
}

interface NotificationHubProps {
  fetchers: NotificationFetcher[];
  accentColor?: string;
  backgroundColor?: string;
  surfaceColor?: string;
  textColor?: string;
  dimColor?: string;
  borderColor?: string;
  onDeepLink?: (link: string, domain: string) => void;
  trigger?: React.ReactNode;
}

export function NotificationHub({
  fetchers,
  accentColor = '#c9a84c',
  backgroundColor = '#0a0a0a',
  surfaceColor = '#111',
  textColor = '#fff',
  dimColor = '#6b7280',
  borderColor = 'rgba(255,255,255,0.08)',
  onDeepLink,
  trigger,
}: NotificationHubProps) {
  const [visible, setVisible] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [domainFilter, setDomainFilter] = useState<string>('All');

  const allQueries = useQueries({
    queries: fetchers.map((f) => ({
      queryKey: ['notification-hub', f.domain],
      queryFn: f.fetch,
      staleTime: 30_000,
      refetchInterval: 60_000,
    })),
  });

  const allItems = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = [];
    allQueries.forEach((q) => {
      if (q.data) items.push(...q.data);
    });
    return items.sort(
      (a, b) =>
        SEV_ORDER[a.severity] - SEV_ORDER[b.severity] ||
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    // allQueries reference is stable between renders (useQueries memoizes the array)
  }, [allQueries]);

  const filteredItems = useMemo(() => {
    const domainFiltered =
      domainFilter === 'All' ? allItems : allItems.filter((i) => i.domain === domainFilter);
    return domainFiltered.map((i) => ({ ...i, read: i.read || readIds.has(i.id) }));
  }, [allItems, domainFilter, readIds]);

  const unreadCount = filteredItems.filter((i) => !i.read).length;
  const isLoading = allQueries.some((q) => q.isLoading);

  const markAllRead = useCallback(() => {
    setReadIds((prev) => {
      const next = new Set(prev);
      allItems.forEach((i) => next.add(i.id));
      return next;
    });
  }, [allItems]);

  const markRead = useCallback((id: string) => {
    setReadIds((prev) => new Set([...prev, id]));
  }, []);

  const domainLabels = ['All', ...fetchers.map((f) => f.domain)];

  return (
    <>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        style={styles.triggerWrap}
        activeOpacity={0.7}
      >
        {trigger ?? (
          <View style={[styles.bellButton, { borderColor }]}>
            <Text style={{ fontSize: 18 }}>🔔</Text>
            {unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: accentColor }]}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </View>
        )}
        {!trigger && unreadCount > 0 && (
          <View style={[styles.externalBadge, { backgroundColor: accentColor }]}>
            <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setVisible(false)}
      >
        <View style={[styles.modal, { backgroundColor }]}>
          <View style={[styles.header, { borderBottomColor: borderColor }]}>
            <View style={styles.headerLeft}>
              <Text style={[styles.headerTitle, { color: textColor }]}>Notifications</Text>
              {unreadCount > 0 && (
                <View
                  style={[
                    styles.countBadge,
                    { backgroundColor: `${accentColor}20`, borderColor: `${accentColor}40` },
                  ]}
                >
                  <Text style={[styles.countBadgeText, { color: accentColor }]}>
                    {unreadCount} unread
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.headerActions}>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
                  <Text style={[styles.markAllText, { color: accentColor }]}>Mark all read</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setVisible(false)} style={styles.closeBtn}>
                <Text style={[styles.closeText, { color: dimColor }]}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            data={domainLabels}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(i) => i}
            style={[styles.filterBar, { borderBottomColor: borderColor }]}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
            renderItem={({ item }) => {
              const f = fetchers.find((f) => f.domain === item);
              const isActive = domainFilter === item;
              return (
                <Pressable
                  onPress={() => setDomainFilter(item)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isActive ? (f?.color ?? accentColor) + '20' : surfaceColor,
                      borderColor: isActive ? (f?.color ?? accentColor) + '50' : borderColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: isActive ? (f?.color ?? accentColor) : dimColor },
                    ]}
                  >
                    {f?.label ?? item}
                  </Text>
                </Pressable>
              );
            }}
          />

          {isLoading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={accentColor} />
              <Text style={[styles.loadingText, { color: dimColor }]}>Fetching alerts…</Text>
            </View>
          )}

          <FlatList
            data={filteredItems}
            keyExtractor={(i) => i.id}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: 40,
              paddingTop: 8,
              gap: 8,
            }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={{ fontSize: 32 }}>✓</Text>
                <Text style={[styles.emptyText, { color: dimColor }]}>All clear — no alerts</Text>
              </View>
            }
            renderItem={({ item }) => {
              const sevColor = SEV_COLORS[item.severity] ?? dimColor;
              const f = fetchers.find((f) => f.domain === item.domain);
              return (
                <Pressable
                  style={[
                    styles.notifCard,
                    {
                      backgroundColor: item.read ? surfaceColor : `${sevColor}08`,
                      borderColor: item.read ? borderColor : `${sevColor}25`,
                      opacity: item.read ? 0.65 : 1,
                    },
                  ]}
                  onPress={() => {
                    markRead(item.id);
                    if (item.deepLink && onDeepLink) {
                      onDeepLink(item.deepLink, item.domain);
                      setVisible(false);
                    }
                  }}
                >
                  <View style={styles.notifTop}>
                    <View style={styles.notifMeta}>
                      <View style={[styles.sevDot, { backgroundColor: sevColor }]} />
                      <View
                        style={[
                          styles.sevBadge,
                          { backgroundColor: `${sevColor}15`, borderColor: `${sevColor}30` },
                        ]}
                      >
                        <Text style={[styles.sevText, { color: sevColor }]}>
                          {item.severity.toUpperCase()}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.domainChip,
                          {
                            backgroundColor: `${f?.color ?? accentColor}15`,
                            borderColor: `${f?.color ?? accentColor}30`,
                          },
                        ]}
                      >
                        <Text style={[styles.domainText, { color: f?.color ?? accentColor }]}>
                          {f?.label ?? item.domain}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.timeText, { color: dimColor }]}>
                      {timeAgo(item.timestamp)}
                    </Text>
                  </View>
                  <Text style={[styles.notifTitle, { color: textColor }]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {item.body ? (
                    <Text style={[styles.notifBody, { color: dimColor }]} numberOfLines={2}>
                      {item.body}
                    </Text>
                  ) : null}
                  {item.deepLink && (
                    <Text style={[styles.deepLinkHint, { color: `${accentColor}80` }]}>
                      Tap to view →
                    </Text>
                  )}
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  triggerWrap: {
    position: 'relative',
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000',
  },
  externalBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  modal: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markAllBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    fontSize: 18,
    fontWeight: '600',
  },
  filterBar: {
    borderBottomWidth: 1,
    maxHeight: 56,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  loadingText: {
    fontSize: 13,
  },
  notifCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  notifTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notifMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  sevDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sevBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  sevText: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  domainChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  domainText: {
    fontSize: 9,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 11,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  notifBody: {
    fontSize: 11,
    lineHeight: 16,
  },
  deepLinkHint: {
    fontSize: 11,
    fontWeight: '500',
  },
  emptyState: {
    paddingTop: 60,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
});
