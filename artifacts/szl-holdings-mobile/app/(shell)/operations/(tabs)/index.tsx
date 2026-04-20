import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LYTE_COLORS } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { type LyteAction, type LyteSignal, type Severity, useLyte } from '@/context/LyteContext';
import { useColors } from '@/hooks/useColors';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

interface SevConfig {
  color: string;
  bg: string;
  border: string;
  dot: string;
}

function getSeverityConfig(sev: Severity): SevConfig {
  const map: Record<Severity, SevConfig> = {
    critical: {
      color: LYTE_COLORS.critical,
      bg: LYTE_COLORS.criticalDim,
      border: LYTE_COLORS.criticalLight,
      dot: LYTE_COLORS.critical,
    },
    high: {
      color: LYTE_COLORS.high,
      bg: LYTE_COLORS.highDim,
      border: LYTE_COLORS.highLight,
      dot: LYTE_COLORS.high,
    },
    medium: {
      color: LYTE_COLORS.medium,
      bg: LYTE_COLORS.mediumDim,
      border: LYTE_COLORS.mediumLight,
      dot: LYTE_COLORS.medium,
    },
    low: {
      color: LYTE_COLORS.low,
      bg: 'rgba(138,155,176,0.05)',
      border: LYTE_COLORS.lowLight,
      dot: LYTE_COLORS.low,
    },
    info: {
      color: LYTE_COLORS.electricBlue,
      bg: LYTE_COLORS.electricBlueDim,
      border: LYTE_COLORS.electricBlueLight,
      dot: LYTE_COLORS.electricBlue,
    },
  };
  return map[sev] ?? map.info;
}

interface InboxCard {
  id: string;
  severity: Severity;
  source: string;
  title: string;
  platform: string;
  time: string;
  status: string;
  signalId?: string;
  actionId?: number;
}

type StylesType = ReturnType<typeof makeStyles>;

function InboxCardView({
  card,
  onAcknowledge,
  onInvestigate,
  onEscalate,
  onResolve,
  styles,
  colors,
}: {
  card: InboxCard;
  onAcknowledge: () => void;
  onInvestigate: () => void;
  onEscalate: () => void;
  onResolve: () => void;
  styles: StylesType;
  colors: ReturnType<typeof useColors>;
}) {
  const sev = getSeverityConfig(card.severity);
  const scale = useRef(new Animated.Value(1)).current;
  const [expanded, setExpanded] = useState(false);

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, friction: 10 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 10 }).start();

  const handlePress = () => {
    Haptics.selectionAsync();
    setExpanded((e) => !e);
  };

  return (
    <Animated.View style={[styles.card, { borderColor: sev.border, transform: [{ scale }] }]}>
      <Pressable onPressIn={onPressIn} onPressOut={onPressOut} onPress={handlePress}>
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.sevDot,
              {
                backgroundColor: sev.dot,
                shadowColor: sev.dot,
                shadowOpacity: card.severity === 'critical' ? 0.8 : 0,
                shadowRadius: 4,
              },
            ]}
          />
          <View style={styles.cardMain}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={2}>
              {card.title}
            </Text>
            <View style={styles.cardMeta}>
              <View style={[styles.sevBadge, { backgroundColor: sev.bg, borderColor: sev.border }]}>
                <Text style={[styles.sevText, { color: sev.color }]}>
                  {card.severity.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.metaText}>{card.source}</Text>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.metaText}>{card.platform}</Text>
            </View>
          </View>
          <Text style={styles.cardTime}>{card.time}</Text>
        </View>
      </Pressable>

      {expanded && (
        <View style={styles.cardActions}>
          <Pressable
            style={[
              styles.actionBtn,
              { borderColor: 'rgba(0,212,255,0.3)', backgroundColor: LYTE_COLORS.electricBlueDim },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onAcknowledge();
            }}
          >
            <Feather name="check" size={14} color={LYTE_COLORS.electricBlue} />
            <Text style={[styles.actionText, { color: LYTE_COLORS.electricBlue }]}>
              Acknowledge
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.actionBtn,
              { borderColor: 'rgba(167,139,250,0.3)', backgroundColor: 'rgba(167,139,250,0.08)' },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onInvestigate();
            }}
          >
            <Feather name="search" size={14} color="#a78bfa" />
            <Text style={[styles.actionText, { color: '#a78bfa' }]}>Investigate</Text>
          </Pressable>
          <Pressable
            style={[
              styles.actionBtn,
              { borderColor: LYTE_COLORS.highLight, backgroundColor: LYTE_COLORS.highDim },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onEscalate();
            }}
          >
            <Feather name="arrow-up" size={14} color={LYTE_COLORS.high} />
            <Text style={[styles.actionText, { color: LYTE_COLORS.high }]}>Escalate</Text>
          </Pressable>
          <Pressable
            style={[
              styles.actionBtn,
              {
                borderColor: LYTE_COLORS.neonGreenLight,
                backgroundColor: LYTE_COLORS.neonGreenDim,
              },
            ]}
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onResolve();
            }}
          >
            <Feather name="check-circle" size={14} color={LYTE_COLORS.neonGreen} />
            <Text style={[styles.actionText, { color: LYTE_COLORS.neonGreen }]}>Resolve</Text>
          </Pressable>
        </View>
      )}
    </Animated.View>
  );
}

async function doSignalAction(
  id: string,
  action: 'acknowledge' | 'escalate' | 'resolve',
  headers: Record<string, string>,
): Promise<void> {
  const base = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : '';
  const res = await fetch(`${base}/api/lyte/signals/${id}/${action}`, {
    method: 'POST',
    headers,
  });
  if (!res.ok) {
    console.warn(`[Inbox] Signal action ${action} failed: HTTP ${res.status}`);
  }
}

async function doActionUpdate(
  id: number,
  state: string,
  headers: Record<string, string>,
): Promise<void> {
  const base = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : '';
  const res = await fetch(`${base}/api/lyte/actions/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ state }),
  });
  if (!res.ok) {
    console.warn(`[Inbox] Action update to state=${state} failed: HTTP ${res.status}`);
  }
}

async function bulkAcknowledgeSignals(
  signals: LyteSignal[],
  headers: Record<string, string>,
): Promise<void> {
  const newSignals = signals.filter((s) => s.status === 'new' || s.status === 'active');
  await Promise.allSettled(newSignals.map((s) => doSignalAction(s.id, 'acknowledge', headers)));
}

async function escalateCriticalSignals(
  signals: LyteSignal[],
  headers: Record<string, string>,
): Promise<void> {
  const criticals = signals.filter(
    (s) => s.severity === 'critical' && !['resolved', 'dismissed'].includes(s.status),
  );
  await Promise.allSettled(criticals.map((s) => doSignalAction(s.id, 'escalate', headers)));
}

async function checkSystemStatus(headers: Record<string, string>): Promise<string> {
  const base = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : '';
  const res = await fetch(`${base}/api/lyte/health`, { headers });
  if (!res.ok) return `status-check-failed (HTTP ${res.status})`;
  return 'ok';
}

export default function InboxScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { buildHeaders } = useAuth();
  const { signals, actions, criticalCount, activeAlertCount, reload } = useLyte();
  const [refreshing, setRefreshing] = useState(false);
  const [shakeDetected, setShakeDetected] = useState(false);
  const [shakeStatus, setShakeStatus] = useState<string | null>(null);
  const shakeMenuVisible = useRef(false);
  const lastAccel = useRef({ x: 0, y: 0, z: 0 });

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 + 84 : 90;

  const dismissShake = useCallback(() => {
    shakeMenuVisible.current = false;
    setShakeDetected(false);
    setShakeStatus(null);
  }, []);

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    reload();
    await new Promise((r) => setTimeout(r, 1000));
    setRefreshing(false);
  }, [reload]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    let cleanup: (() => void) | undefined;
    const setup = async () => {
      try {
        const { Accelerometer } = await import('expo-sensors');
        if (!Accelerometer) return;
        Accelerometer.setUpdateInterval(150);
        const sub = Accelerometer.addListener((data: { x: number; y: number; z: number }) => {
          const diff =
            Math.abs(data.x - lastAccel.current.x) +
            Math.abs(data.y - lastAccel.current.y) +
            Math.abs(data.z - lastAccel.current.z);
          lastAccel.current = data;
          if (diff > 3 && !shakeMenuVisible.current) {
            shakeMenuVisible.current = true;
            setShakeDetected(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            setTimeout(() => {
              shakeMenuVisible.current = false;
              setShakeDetected(false);
              setShakeStatus(null);
            }, 6000);
          }
        });
        cleanup = () => sub.remove();
      } catch {}
    };
    setup();
    return () => cleanup?.();
  }, []);

  const prioritySignals = [...signals]
    .filter((s) => !['resolved', 'dismissed'].includes(s.status))
    .sort((a, b) => {
      const order: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
      return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
    });

  const priorityActions = [...actions]
    .filter((a) => !['resolved', 'dismissed'].includes(a.state))
    .slice(0, 5);

  const actionSeverity = (a: LyteAction): Severity => {
    const p = a.priority ?? a.urgency ?? '';
    const valid: Severity[] = ['critical', 'high', 'medium', 'low', 'info'];
    return valid.includes(p as Severity) ? (p as Severity) : 'medium';
  };

  const inboxItems: InboxCard[] = [
    ...prioritySignals.slice(0, 15).map((s) => ({
      id: s.id,
      severity: s.severity,
      source: s.source,
      title: s.title,
      platform: (s.metadata?.platform as string | undefined) ?? 'Platform',
      time: timeAgo(s.receivedAt),
      status: s.status,
      signalId: s.id,
    })),
    ...priorityActions.map((a) => ({
      id: `action-${a.id}`,
      severity: actionSeverity(a),
      source: 'Action Queue',
      title: a.title,
      platform: 'Lyte',
      time: a.dueAt ? timeAgo(a.dueAt) : '—',
      status: a.state,
      actionId: a.id,
    })),
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['rgba(0,212,255,0.04)', 'transparent']}
        style={[styles.headerGradient, { height: topPad + 100 }]}
      />
      {shakeDetected && (
        <View style={[styles.shakeMenu, { top: topPad + 16 }]}>
          <Text style={styles.shakeTitle}>Quick Actions</Text>
          {shakeStatus && <Text style={styles.shakeStatusText}>{shakeStatus}</Text>}
          <View style={styles.shakeActions}>
            <Pressable
              style={styles.shakeAction}
              onPress={async () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShakeStatus('Restarting monitoring...');
                reload();
                await new Promise((r) => setTimeout(r, 800));
                setShakeStatus('Monitoring restarted ✓');
                setTimeout(dismissShake, 1500);
              }}
            >
              <Feather name="refresh-cw" size={16} color={LYTE_COLORS.electricBlue} />
              <Text style={styles.shakeActionText}>Restart Monitoring</Text>
            </Pressable>
            <Pressable
              style={styles.shakeAction}
              onPress={async () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShakeStatus('Acknowledging all alerts...');
                await bulkAcknowledgeSignals(signals, buildHeaders());
                reload();
                setShakeStatus('All alerts acknowledged ✓');
                setTimeout(dismissShake, 1500);
              }}
            >
              <Feather name="check-square" size={16} color={LYTE_COLORS.neonGreen} />
              <Text style={styles.shakeActionText}>Ack All Alerts</Text>
            </Pressable>
            <Pressable
              style={styles.shakeAction}
              onPress={async () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                setShakeStatus('Escalating to on-call...');
                await escalateCriticalSignals(signals, buildHeaders());
                reload();
                setShakeStatus(`${criticalCount} critical escalated to on-call`);
                setTimeout(dismissShake, 1800);
              }}
            >
              <Feather name="phone-call" size={16} color={LYTE_COLORS.high} />
              <Text style={styles.shakeActionText}>Escalate to On-Call</Text>
            </Pressable>
            <Pressable
              style={styles.shakeAction}
              onPress={async () => {
                Haptics.selectionAsync();
                setShakeStatus('Checking system status...');
                const status = await checkSystemStatus(buildHeaders());
                setShakeStatus(status === 'ok' ? 'System healthy ✓' : `Status: ${status}`);
                setTimeout(dismissShake, 2000);
              }}
            >
              <Feather name="activity" size={16} color={LYTE_COLORS.medium} />
              <Text style={styles.shakeActionText}>System Status</Text>
            </Pressable>
            <Pressable
              style={styles.shakeAction}
              onPress={() => {
                Haptics.selectionAsync();
                dismissShake();
              }}
            >
              <Feather name="x" size={16} color={colors.textSecondary} />
              <Text style={styles.shakeActionText}>Dismiss</Text>
            </Pressable>
          </View>
        </View>
      )}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingTop: topPad + 16,
          paddingBottom: bottomPad,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={LYTE_COLORS.electricBlue}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>COMMAND INBOX</Text>
            <Text style={styles.headerTitle}>Lyte</Text>
          </View>
          <View style={styles.headerBadges}>
            {criticalCount > 0 && (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: LYTE_COLORS.criticalDim,
                    borderColor: LYTE_COLORS.criticalLight,
                  },
                ]}
              >
                <View style={[styles.badgeDot, { backgroundColor: LYTE_COLORS.critical }]} />
                <Text style={[styles.badgeText, { color: LYTE_COLORS.critical }]}>
                  {criticalCount} critical
                </Text>
              </View>
            )}
            {activeAlertCount > 0 && (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: LYTE_COLORS.electricBlueDim,
                    borderColor: LYTE_COLORS.electricBlueLight,
                  },
                ]}
              >
                <Text style={[styles.badgeText, { color: LYTE_COLORS.electricBlue }]}>
                  {activeAlertCount} open
                </Text>
              </View>
            )}
          </View>
        </View>

        {inboxItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✓</Text>
            <Text style={styles.emptyTitle}>All clear</Text>
            <Text style={styles.emptyText}>No issues require your attention</Text>
          </View>
        ) : (
          <View style={styles.cardList}>
            {inboxItems.map((card) => (
              <InboxCardView
                key={card.id}
                card={card}
                styles={styles}
                colors={colors}
                onAcknowledge={() => {
                  const headers = buildHeaders();
                  if (card.signalId) {
                    doSignalAction(card.signalId, 'acknowledge', headers);
                  } else if (card.actionId !== undefined) {
                    doActionUpdate(card.actionId, 'acknowledged', headers);
                  }
                }}
                onInvestigate={() => {
                  const headers = buildHeaders();
                  if (card.signalId) {
                    doSignalAction(card.signalId, 'acknowledge', headers);
                  } else if (card.actionId !== undefined) {
                    doActionUpdate(card.actionId, 'investigating', headers);
                  }
                }}
                onEscalate={() => {
                  const headers = buildHeaders();
                  if (card.signalId) {
                    doSignalAction(card.signalId, 'escalate', headers);
                  } else if (card.actionId !== undefined) {
                    doActionUpdate(card.actionId, 'escalated', headers);
                  }
                }}
                onResolve={() => {
                  const headers = buildHeaders();
                  if (card.signalId) {
                    doSignalAction(card.signalId, 'resolve', headers);
                  } else if (card.actionId !== undefined) {
                    doActionUpdate(card.actionId, 'resolved', headers);
                  }
                }}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function makeStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1 },
    headerGradient: { position: 'absolute', top: 0, left: 0, right: 0 },
    scroll: { flex: 1 },
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
      color: LYTE_COLORS.electricBlue,
      marginBottom: 4,
    },
    headerTitle: { fontSize: 28, fontFamily: 'Inter_600SemiBold', color: c.textPrimary },
    headerBadges: { gap: 6, alignItems: 'flex-end' },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      borderWidth: 1,
    },
    badgeDot: { width: 6, height: 6, borderRadius: 3 },
    badgeText: { fontSize: 10, fontFamily: 'Inter_500Medium' },
    cardList: { gap: 8 },
    card: { borderRadius: 12, borderWidth: 1, backgroundColor: c.surface, overflow: 'hidden' },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 10 },
    sevDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginTop: 5,
      shadowOffset: { width: 0, height: 0 },
    },
    cardMain: { flex: 1, gap: 6 },
    cardTitle: { fontSize: 13, fontFamily: 'Inter_500Medium', lineHeight: 18 },
    cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
    sevBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
    sevText: { fontSize: 8, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5 },
    metaDot: { color: c.textMuted, fontSize: 10 },
    metaText: { fontSize: 10, fontFamily: 'Inter_400Regular', color: c.textSecondary },
    cardTime: { fontSize: 10, fontFamily: 'Inter_400Regular', color: c.textTertiary },
    cardActions: {
      flexDirection: 'row',
      gap: 6,
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
    },
    actionText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
    emptyState: { alignItems: 'center', paddingTop: 80 },
    emptyIcon: { fontSize: 40, marginBottom: 12 },
    emptyTitle: {
      fontSize: 18,
      fontFamily: 'Inter_600SemiBold',
      color: c.textPrimary,
      marginBottom: 6,
    },
    emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: c.textSecondary },
    shakeMenu: {
      position: 'absolute',
      left: 16,
      right: 16,
      zIndex: 100,
      backgroundColor: c.surfaceElevated,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: LYTE_COLORS.electricBlueLight,
      padding: 16,
    },
    shakeTitle: {
      fontSize: 11,
      fontFamily: 'Inter_500Medium',
      color: LYTE_COLORS.electricBlue,
      letterSpacing: 2,
      textTransform: 'uppercase',
      marginBottom: 6,
    },
    shakeStatusText: {
      fontSize: 11,
      fontFamily: 'Inter_400Regular',
      color: c.textSecondary,
      marginBottom: 10,
    },
    shakeActions: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    shakeAction: {
      flex: 1,
      minWidth: 56,
      alignItems: 'center',
      gap: 5,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: LYTE_COLORS.electricBlueDim,
    },
    shakeActionText: { fontSize: 9, fontFamily: 'Inter_500Medium', color: c.textSecondary },
  });
}
