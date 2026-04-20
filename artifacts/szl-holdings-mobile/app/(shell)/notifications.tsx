import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { apiFetch } from '@/lib/apiClient';

const ACCENT = '#c9a84c';

async function apiGet<T>(path: string): Promise<T> {
  const raw = await apiFetch<{ data: T } | T>(path, { method: 'GET' });
  return (raw as { data: T })?.data ?? (raw as T);
}

async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  const raw = await apiFetch<{ data: T } | T>(path, {
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });
  if (raw === null) return null as T;
  return (raw as { data: T })?.data ?? (raw as T);
}

async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  const raw = await apiFetch<{ data: T } | T>(path, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
  if (raw === null) return null as T;
  return (raw as { data: T })?.data ?? (raw as T);
}

type Notification = {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
};

type NotifPrefs = {
  emailEnabled: boolean;
  smsEnabled: boolean;
  slackEnabled: boolean;
  inAppEnabled: boolean;
};

const TYPE_COLORS: Record<string, string> = {
  info: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  action_required: '#c9a84c',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'inbox' | 'preferences'>('inbox');
  const [prefsForm, setPrefsForm] = useState<Partial<NotifPrefs>>({});

  const notifQuery = useQuery<Notification[]>({
    queryKey: ['mobile-notifications'],
    queryFn: () => apiGet<Notification[]>('/api/notifications'),
  });

  const prefsQuery = useQuery<NotifPrefs>({
    queryKey: ['mobile-notif-prefs'],
    queryFn: () => apiGet<NotifPrefs>('/api/user/notification-preferences'),
    enabled: tab === 'preferences',
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => apiPatch(`/api/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mobile-notifications'] }),
  });

  const dismissAllMutation = useMutation({
    mutationFn: () => apiPatch('/api/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mobile-notifications'] }),
  });

  const updatePrefsMutation = useMutation({
    mutationFn: (data: Partial<NotifPrefs>) => apiPut('/api/user/notification-preferences', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mobile-notif-prefs'] });
      setPrefsForm({});
    },
  });

  const onRefresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['mobile-notifications'] });
  }, [qc]);

  const notifications = notifQuery.data ?? [];
  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={[styles.headerText, { color: colors.foreground }]}>Notifications</Text>
          {unread > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unread}</Text>
            </View>
          )}
        </View>
        {tab === 'inbox' && unread > 0 && (
          <TouchableOpacity
            onPress={() => dismissAllMutation.mutate()}
            disabled={dismissAllMutation.isPending}
          >
            <Text style={[styles.markAllBtn, { color: ACCENT }]}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabs}>
        {(['inbox', 'preferences'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, { color: tab === t ? ACCENT : colors.muted }]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'inbox' && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={notifQuery.isFetching}
              onRefresh={onRefresh}
              tintColor={ACCENT}
            />
          }
        >
          {notifQuery.isLoading ? (
            <ActivityIndicator color={ACCENT} style={{ marginTop: 40 }} />
          ) : notifications.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="bell-off" size={32} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>No notifications yet</Text>
            </View>
          ) : (
            notifications.map((n) => (
              <TouchableOpacity
                key={n.id}
                style={[
                  styles.card,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  !n.isRead && styles.cardUnread,
                ]}
                onPress={() => !n.isRead && markReadMutation.mutate(n.id)}
              >
                <View style={[styles.dot, { backgroundColor: TYPE_COLORS[n.type] ?? '#6366f1' }]} />
                <View style={styles.cardBody}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, { color: colors.foreground }]}>{n.title}</Text>
                    <Text style={[styles.cardTime, { color: colors.muted }]}>
                      {timeAgo(n.createdAt)}
                    </Text>
                  </View>
                  <Text style={[styles.cardMessage, { color: colors.muted }]} numberOfLines={2}>
                    {n.message}
                  </Text>
                  {!n.isRead && <View style={styles.unreadDot} />}
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {tab === 'preferences' && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {prefsQuery.isLoading ? (
            <ActivityIndicator color={ACCENT} style={{ marginTop: 40 }} />
          ) : (
            <>
              <Text style={[styles.sectionTitle, { color: colors.muted }]}>CHANNELS</Text>
              {[
                {
                  key: 'inAppEnabled',
                  label: 'In-App',
                  icon: 'bell' as const,
                  desc: 'Platform alerts',
                },
                {
                  key: 'emailEnabled',
                  label: 'Email',
                  icon: 'mail' as const,
                  desc: 'Digest and critical alerts',
                },
                {
                  key: 'smsEnabled',
                  label: 'SMS',
                  icon: 'smartphone' as const,
                  desc: 'Text message alerts',
                },
                {
                  key: 'slackEnabled',
                  label: 'Slack',
                  icon: 'message-square' as const,
                  desc: 'Workspace notifications',
                },
              ].map(({ key, label, icon, desc }) => {
                const current =
                  prefsForm[key as keyof NotifPrefs] ??
                  prefsQuery.data?.[key as keyof NotifPrefs] ??
                  false;
                return (
                  <View
                    key={key}
                    style={[
                      styles.prefRow,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                  >
                    <View style={styles.prefIcon}>
                      <Feather name={icon} size={16} color={colors.muted} />
                    </View>
                    <View style={styles.prefInfo}>
                      <Text style={[styles.prefLabel, { color: colors.foreground }]}>{label}</Text>
                      <Text style={[styles.prefDesc, { color: colors.muted }]}>{desc}</Text>
                    </View>
                    <Switch
                      value={current}
                      onValueChange={(v) => setPrefsForm((f) => ({ ...f, [key]: v }))}
                      trackColor={{ false: colors.border, true: `${ACCENT}80` }}
                      thumbColor={current ? ACCENT : colors.muted}
                    />
                  </View>
                );
              })}
              <TouchableOpacity
                style={[styles.saveBtn, !Object.keys(prefsForm).length && styles.saveBtnDisabled]}
                onPress={() => updatePrefsMutation.mutate(prefsForm)}
                disabled={!Object.keys(prefsForm).length || updatePrefsMutation.isPending}
              >
                {updatePrefsMutation.isPending ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Preferences</Text>
                )}
              </TouchableOpacity>
            </>
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
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerText: { fontSize: 17, fontWeight: '600' },
  badge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  markAllBtn: { fontSize: 12, fontWeight: '600' },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, gap: 4 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: `${ACCENT}15` },
  tabText: { fontSize: 13, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 8 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14 },
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardUnread: { borderColor: `${ACCENT}30` },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  cardBody: { flex: 1 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  cardTitle: { fontSize: 13, fontWeight: '600', flex: 1 },
  cardTime: { fontSize: 11, marginLeft: 8 },
  cardMessage: { fontSize: 12, lineHeight: 18 },
  unreadDot: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ACCENT,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  prefIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  prefInfo: { flex: 1 },
  prefLabel: { fontSize: 13, fontWeight: '600' },
  prefDesc: { fontSize: 11, marginTop: 1 },
  saveBtn: {
    marginTop: 8,
    backgroundColor: ACCENT,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: '#000', fontSize: 14, fontWeight: '700' },
});
