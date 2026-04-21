import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router, usePathname } from 'expo-router';
import type React from 'react';
import { useEffect, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OfflineQueueLauncher } from '@/components/OfflineQueueLauncher';
import { useNotificationCountContext } from '@/context/NotificationCountContext';
import { useWorkspace, type WorkspaceDomain } from '@/context/WorkspaceContext';
import { useColors } from '@/hooks/useColors';
import { apiFetch } from '@/lib/apiClient';

interface TabItem {
  id: WorkspaceDomain;
  label: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  accent: string;
  route: string;
}

const TABS: TabItem[] = [
  {
    id: 'command',
    label: 'Command',
    icon: 'grid',
    accent: '#c9a84c',
    route: '/(shell)/',
  },
  {
    id: 'intelligence',
    label: 'CORTEX',
    icon: 'cpu',
    accent: '#8b7ac8',
    route: '/(shell)/intelligence',
  },
  {
    id: 'defense',
    label: 'Defense',
    icon: 'shield',
    accent: '#ef4444',
    route: '/(shell)/defense',
  },
  {
    id: 'fleet',
    label: 'Fleet',
    icon: 'anchor',
    accent: '#0ea5e9',
    route: '/(shell)/fleet',
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    icon: 'briefcase',
    accent: '#94a3b8',
    route: '/(shell)/portfolio',
  },
  {
    id: 'properties',
    label: 'Terra',
    icon: 'home',
    accent: '#c87941',
    route: '/(shell)/properties',
  },
  {
    id: 'operations',
    label: 'Ops',
    icon: 'activity',
    accent: '#22d3ee',
    route: '/(shell)/operations',
  },
  {
    id: 'advisory',
    label: 'Advisory',
    icon: 'users',
    accent: '#d4b896',
    route: '/(shell)/advisory',
  },
];

const HIDDEN_ROUTES = ['/(shell)/notifications', '/(shell)/usage'];

function useCortexBadge() {
  const { setBadge } = useWorkspace();

  const feedQuery = useQuery<{ stats?: { critical?: number; active?: number } }>({
    queryKey: ['bottom-tab-cortex-feed'],
    queryFn: () =>
      apiFetch<{ stats?: { critical?: number; active?: number } }>('/api/cortex/intelligence-feed'),
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const draftsQuery = useQuery<{ pendingCount?: number }>({
    queryKey: ['bottom-tab-cortex-drafts'],
    queryFn: () => apiFetch<{ pendingCount?: number }>('/api/cortex/action-drafts?status=pending'),
    refetchInterval: 30000,
    staleTime: 15000,
  });

  const approvalsQuery = useQuery<
    { data?: Array<{ id: number }>; count?: number } | Array<{ id: number }>
  >({
    queryKey: ['bottom-tab-pending-approvals'],
    queryFn: () =>
      apiFetch<{ data?: Array<{ id: number }>; count?: number } | Array<{ id: number }>>(
        '/api/approvals?status=pending&limit=99',
      ),
    refetchInterval: 30000,
    staleTime: 15000,
  });

  useEffect(() => {
    const critical = feedQuery.data?.stats?.critical ?? 0;
    const pending = draftsQuery.data?.pendingCount ?? 0;
    const raw = approvalsQuery.data;
    const approvalCount = raw
      ? Array.isArray(raw)
        ? raw.length
        : ((raw as { data?: Array<{ id: number }>; count?: number }).count ??
          (raw as { data?: Array<{ id: number }> }).data?.length ??
          0)
      : 0;
    setBadge('intelligence', critical + pending + approvalCount);
  }, [feedQuery.data, draftsQuery.data, approvalsQuery.data, setBadge]);
}

export function BottomTabBar() {
  const { activeWorkspace, setActiveWorkspace, badges } = useWorkspace();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { unreadCount } = useNotificationCountContext();
  const scrollRef = useRef<ScrollView>(null);

  useCortexBadge();

  if (HIDDEN_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'))) {
    return null;
  }

  const handlePress = (tab: TabItem) => {
    setActiveWorkspace(tab.id);
    router.navigate(tab.route as never);
  };

  const isSettingsActive =
    pathname === '/(shell)/settings' || pathname.startsWith('/(shell)/settings/');
  const isCommandDeckActive = pathname === '/(shell)/quick-actions';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: insets.bottom || 8,
        },
      ]}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsScrollContent}
        style={styles.tabsScroll}
        scrollEventThrottle={16}
        bounces={false}
      >
        {TABS.map((tab) => {
          const isActive = !isSettingsActive && !isCommandDeckActive && activeWorkspace === tab.id;
          const badge = badges[tab.id] ?? 0;
          const color = isActive ? tab.accent : colors.mutedForeground;

          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => handlePress(tab)}
              style={styles.tab}
              activeOpacity={0.7}
              accessibilityLabel={tab.label}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <View style={styles.tabInner}>
                {isActive && (
                  <View style={[styles.activeIndicator, { backgroundColor: tab.accent }]} />
                )}
                <View style={styles.iconWrap}>
                  <Feather name={tab.icon} size={18} color={color} />
                  {badge > 0 && (
                    <View
                      style={[styles.badge, { backgroundColor: isActive ? tab.accent : '#ef4444' }]}
                    >
                      <Text style={styles.badgeText}>{badge > 99 ? '99+' : String(badge)}</Text>
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.label,
                    {
                      color,
                      fontFamily: isActive ? 'Inter_600SemiBold' : 'Inter_400Regular',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.utilityRow}>
        <TouchableOpacity
          onPress={() => router.navigate('/(shell)/quick-actions' as never)}
          style={styles.utilityTab}
          activeOpacity={0.7}
          accessibilityLabel="Quick Actions Deck"
          accessibilityRole="button"
        >
          <View style={styles.tabInner}>
            {isCommandDeckActive && (
              <View style={[styles.activeIndicator, { backgroundColor: '#c9a84c' }]} />
            )}
            <View style={styles.iconWrap}>
              <Feather
                name="zap"
                size={18}
                color={isCommandDeckActive ? '#c9a84c' : colors.mutedForeground}
              />
            </View>
            <Text
              style={[
                styles.label,
                {
                  color: isCommandDeckActive ? '#c9a84c' : colors.mutedForeground,
                  fontFamily: isCommandDeckActive ? 'Inter_600SemiBold' : 'Inter_400Regular',
                },
              ]}
            >
              Deck
            </Text>
          </View>
        </TouchableOpacity>

        <OfflineQueueLauncher />

        <TouchableOpacity
          onPress={() => router.navigate('/(shell)/settings' as never)}
          style={styles.utilityTab}
          activeOpacity={0.7}
          accessibilityLabel="Settings"
          accessibilityRole="button"
        >
          <View style={styles.tabInner}>
            {isSettingsActive && (
              <View style={[styles.activeIndicator, { backgroundColor: colors.mutedForeground }]} />
            )}
            <View style={styles.iconWrap}>
              <Feather
                name="settings"
                size={18}
                color={isSettingsActive ? colors.foreground : colors.mutedForeground}
              />
              {unreadCount > 0 && (
                <View style={[styles.badge, { backgroundColor: '#ef4444' }]}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : String(unreadCount)}
                  </Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.label,
                {
                  color: isSettingsActive ? colors.foreground : colors.mutedForeground,
                  fontFamily: isSettingsActive ? 'Inter_600SemiBold' : 'Inter_400Regular',
                },
              ]}
            >
              Settings
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingTop: 6,
  },
  tabsScroll: {
    flexGrow: 0,
  },
  tabsScrollContent: {
    paddingHorizontal: 4,
    gap: 0,
  },
  utilityRow: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.06)',
    marginTop: 6,
    paddingTop: 4,
  },
  tab: {
    minWidth: 64,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  utilityTab: {
    flex: 1,
    alignItems: 'center',
  },
  tabInner: {
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 4,
  },
  activeIndicator: {
    position: 'absolute',
    top: -7,
    width: 24,
    height: 2,
    borderRadius: 1,
  },
  iconWrap: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -8,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 8,
    fontFamily: 'Inter_600SemiBold',
  },
  label: {
    fontSize: 9,
    letterSpacing: 0.2,
  },
});
