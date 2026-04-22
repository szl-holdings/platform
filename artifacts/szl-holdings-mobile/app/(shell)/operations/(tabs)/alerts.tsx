import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useMemo, useState } from 'react';
import {
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
import { LYTE_COLORS } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { type LyteAction, useLyte } from '@/context/LyteContext';
import { useColors } from '@/hooks/useColors';

function timeAgo(iso?: string): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
}

function getPriorityColor(priority?: string) {
  const map: Record<string, string> = {
    critical: LYTE_COLORS.critical,
    high: LYTE_COLORS.high,
    medium: LYTE_COLORS.medium,
    low: LYTE_COLORS.low,
    urgent: LYTE_COLORS.critical,
  };
  return map[priority ?? ''] ?? LYTE_COLORS.low;
}

async function updateAction(
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
    throw new Error(`Action update failed for id=${id}: HTTP ${res.status}`);
  }
}

type StylesType = ReturnType<typeof makeStyles>;

function AlertCard({
  action,
  onUpdate,
  onRollback,
  authHeaders,
  styles,
}: {
  action: LyteAction;
  onUpdate: (state: string) => void;
  onRollback: (prevState: string) => void;
  authHeaders: Record<string, string>;
  styles: StylesType;
}) {
  const color = getPriorityColor(action.priority ?? action.urgency);
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (state: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const prevState = action.state;
    setLoading(state);
    onUpdate(state);
    try {
      await updateAction(action.id, state, authHeaders);
    } catch {
      onRollback(prevState);
      Alert.alert('Error', 'Could not update alert. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const handleSnooze = () => {
    Haptics.selectionAsync();
    Alert.alert('Snooze Alert', 'Snooze for how long?', [
      { text: '15 min', onPress: () => handleAction('snoozed') },
      { text: '1 hour', onPress: () => handleAction('snoozed') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View style={[styles.alertCard, { borderLeftColor: color, borderLeftWidth: 3 }]}>
      <View style={styles.alertTop}>
        <View
          style={[
            styles.priorityBadge,
            { backgroundColor: `${color}15`, borderColor: `${color}25` },
          ]}
        >
          <Text style={[styles.priorityText, { color }]}>
            {(action.priority ?? action.urgency ?? 'medium').toUpperCase()}
          </Text>
        </View>
        <Text style={styles.alertTime}>{timeAgo(action.dueAt)}</Text>
      </View>
      <Text style={styles.alertTitle}>{action.title}</Text>
      {action.description != null && (
        <Text style={styles.alertDesc} numberOfLines={2}>
          {action.description}
        </Text>
      )}
      {Array.isArray(action.escalationTimeline) && action.escalationTimeline.length > 0 && (
        <View style={styles.timelineSection}>
          <Text style={styles.timelineHeader}>ESCALATION TIMELINE</Text>
          {action.escalationTimeline.map((ev, i) => (
            <View key={i} style={styles.timelineRow}>
              <View style={styles.timelineDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.timelineActor}>
                  {ev.actor} · {ev.action}
                </Text>
                {ev.notes != null && <Text style={styles.timelineNotes}>{ev.notes}</Text>}
                <Text style={styles.timelineTime}>
                  {new Date(ev.timestamp).toLocaleTimeString()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
      <View style={styles.alertMeta}>
        {action.assignedTo && (
          <View style={styles.assignee}>
            <Feather name="user" size={10} color={styles.assigneeText.color as string} />
            <Text style={styles.assigneeText}>{action.assignedTo}</Text>
          </View>
        )}
        <View
          style={[
            styles.stateBadge,
            {
              backgroundColor:
                action.state === 'resolved'
                  ? LYTE_COLORS.neonGreenDim
                  : LYTE_COLORS.electricBlueDim,
            },
          ]}
        >
          <Text
            style={[
              styles.stateText,
              {
                color:
                  action.state === 'resolved' ? LYTE_COLORS.neonGreen : LYTE_COLORS.electricBlue,
              },
            ]}
          >
            {action.state}
          </Text>
        </View>
      </View>
      {!['resolved', 'dismissed'].includes(action.state) && (
        <View style={styles.alertActions}>
          <Pressable
            style={[
              styles.actionBtn,
              { borderColor: 'rgba(0,212,255,0.3)', backgroundColor: LYTE_COLORS.electricBlueDim },
            ]}
            onPress={() => handleAction('acknowledged')}
            disabled={!!loading}
          >
            <Feather name="check" size={13} color={LYTE_COLORS.electricBlue} />
            <Text style={[styles.actionText, { color: LYTE_COLORS.electricBlue }]}>Ack</Text>
          </Pressable>
          <Pressable
            style={[
              styles.actionBtn,
              { borderColor: 'rgba(255,210,61,0.3)', backgroundColor: LYTE_COLORS.mediumDim },
            ]}
            onPress={handleSnooze}
            disabled={!!loading}
          >
            <Feather name="clock" size={13} color={LYTE_COLORS.medium} />
            <Text style={[styles.actionText, { color: LYTE_COLORS.medium }]}>Snooze</Text>
          </Pressable>
          <Pressable
            style={[
              styles.actionBtn,
              { borderColor: LYTE_COLORS.highLight, backgroundColor: LYTE_COLORS.highDim },
            ]}
            onPress={() => handleAction('escalated')}
            disabled={!!loading}
          >
            <Feather name="arrow-up-circle" size={13} color={LYTE_COLORS.high} />
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
            onPress={() => handleAction('resolved')}
            disabled={!!loading}
          >
            <Feather name="check-circle" size={13} color={LYTE_COLORS.neonGreen} />
            <Text style={[styles.actionText, { color: LYTE_COLORS.neonGreen }]}>Resolve</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const ON_CALL_SCHEDULE: Array<{
  name: string;
  role: string;
  window: string;
  status: 'active' | 'standby' | 'upcoming';
}> = [];

export default function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { buildHeaders } = useAuth();
  const { actions, reload } = useLyte();
  const [refreshing, setRefreshing] = useState(false);
  const [localOverrides, setLocalOverrides] = useState<Record<number, string>>({});

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 + 84 : 90;

  const mergedActions = actions.map((a) =>
    localOverrides[a.id] ? { ...a, state: localOverrides[a.id] } : a,
  );

  const activeActions = mergedActions
    .filter((a) => !['resolved', 'dismissed'].includes(a.state))
    .sort((a, b) => {
      const order: Record<string, number> = { critical: 0, urgent: 0, high: 1, medium: 2, low: 3 };
      return (
        (order[a.priority ?? a.urgency ?? ''] ?? 3) - (order[b.priority ?? b.urgency ?? ''] ?? 3)
      );
    });

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    reload();
    await new Promise((r) => setTimeout(r, 1000));
    setRefreshing(false);
  }, [reload]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['rgba(255,59,92,0.04)', 'transparent']}
        style={[styles.headerGradient, { height: topPad + 120 }]}
      />
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
            tintColor={LYTE_COLORS.critical}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>ALERT MANAGEMENT</Text>
          <Text style={styles.headerTitle}>Active Alerts</Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: LYTE_COLORS.critical }]}>
              {
                activeActions.filter(
                  (a) =>
                    (a.priority ?? a.urgency) === 'critical' ||
                    (a.priority ?? a.urgency) === 'urgent',
                ).length
              }
            </Text>
            <Text style={styles.summaryLabel}>Critical</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: LYTE_COLORS.high }]}>
              {activeActions.filter((a) => (a.priority ?? a.urgency) === 'high').length}
            </Text>
            <Text style={styles.summaryLabel}>High</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
              {activeActions.length}
            </Text>
            <Text style={styles.summaryLabel}>Total Active</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: LYTE_COLORS.neonGreen }]}>
              {actions.filter((a) => a.state === 'resolved').length}
            </Text>
            <Text style={styles.summaryLabel}>Resolved</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>ON-CALL SCHEDULE</Text>
        <View style={styles.onCallList}>
          {ON_CALL_SCHEDULE.length === 0 ? (
            <View style={[styles.onCallCard, { borderColor: colors.border }]}>
              <Text
                style={{ color: colors.textTertiary, fontSize: 11, fontFamily: 'Inter_400Regular' }}
              >
                On-call schedule not configured
              </Text>
            </View>
          ) : (
            ON_CALL_SCHEDULE.map((person, i) => (
              <View
                key={i}
                style={[
                  styles.onCallCard,
                  {
                    borderColor:
                      person.status === 'active' ? LYTE_COLORS.neonGreenLight : colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.onCallDot,
                    {
                      backgroundColor:
                        person.status === 'active'
                          ? LYTE_COLORS.neonGreen
                          : person.status === 'standby'
                            ? LYTE_COLORS.medium
                            : LYTE_COLORS.low,
                    },
                  ]}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.onCallName}>{person.name}</Text>
                  <Text style={styles.onCallRole}>
                    {person.role} · {person.window}
                  </Text>
                </View>
                <View
                  style={[
                    styles.onCallStatus,
                    {
                      backgroundColor:
                        person.status === 'active'
                          ? LYTE_COLORS.neonGreenDim
                          : colors.surfaceElevated,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.onCallStatusText,
                      {
                        color:
                          person.status === 'active' ? LYTE_COLORS.neonGreen : colors.textTertiary,
                      },
                    ]}
                  >
                    {person.status}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        <Text style={styles.sectionLabel}>ACTIVE ALERTS</Text>
        {activeActions.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>✓</Text>
            <Text style={styles.emptyTitle}>No active alerts</Text>
            <Text style={styles.emptyText}>All alerts have been resolved</Text>
          </View>
        ) : (
          <View style={styles.alertList}>
            {activeActions.map((a) => (
              <AlertCard
                key={a.id}
                action={a}
                authHeaders={buildHeaders()}
                onUpdate={(state) => {
                  setLocalOverrides((prev) => ({ ...prev, [a.id]: state }));
                }}
                styles={styles}
                onRollback={(prevState) => {
                  setLocalOverrides((prev) => ({ ...prev, [a.id]: prevState }));
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
    header: { marginBottom: 20 },
    eyebrow: {
      fontSize: 9,
      fontFamily: 'Inter_500Medium',
      letterSpacing: 3,
      color: LYTE_COLORS.critical,
      marginBottom: 4,
    },
    headerTitle: { fontSize: 28, fontFamily: 'Inter_600SemiBold', color: c.textPrimary },
    summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
    summaryCard: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      padding: 12,
      alignItems: 'center',
    },
    summaryValue: { fontSize: 22, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
    summaryLabel: {
      fontSize: 9,
      fontFamily: 'Inter_400Regular',
      color: c.textTertiary,
      letterSpacing: 0.5,
    },
    sectionLabel: {
      fontSize: 9,
      fontFamily: 'Inter_500Medium',
      letterSpacing: 3,
      color: c.textTertiary,
      marginBottom: 10,
    },
    onCallList: { gap: 6, marginBottom: 24 },
    onCallCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: c.surface,
      borderRadius: 10,
      borderWidth: 1,
      padding: 12,
    },
    onCallDot: { width: 8, height: 8, borderRadius: 4 },
    onCallName: {
      fontSize: 13,
      fontFamily: 'Inter_500Medium',
      color: c.textPrimary,
      marginBottom: 2,
    },
    onCallRole: { fontSize: 10, fontFamily: 'Inter_400Regular', color: c.textSecondary },
    onCallStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    onCallStatusText: { fontSize: 9, fontFamily: 'Inter_500Medium' },
    alertList: { gap: 8 },
    alertCard: {
      backgroundColor: c.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      padding: 14,
      gap: 8,
    },
    alertTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    priorityBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4, borderWidth: 1 },
    priorityText: { fontSize: 8, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5 },
    alertTime: { fontSize: 10, fontFamily: 'Inter_400Regular', color: c.textTertiary },
    alertTitle: {
      fontSize: 13,
      fontFamily: 'Inter_500Medium',
      color: c.textPrimary,
      lineHeight: 18,
    },
    alertDesc: {
      fontSize: 11,
      fontFamily: 'Inter_400Regular',
      color: c.textSecondary,
      lineHeight: 16,
    },
    alertMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    assignee: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    assigneeText: { fontSize: 10, fontFamily: 'Inter_400Regular', color: c.textTertiary },
    stateBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    stateText: { fontSize: 9, fontFamily: 'Inter_500Medium' },
    alertActions: { flexDirection: 'row', gap: 6, marginTop: 4 },
    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: 7,
      borderRadius: 8,
      borderWidth: 1,
    },
    actionText: { fontSize: 10, fontFamily: 'Inter_500Medium' },
    timelineSection: { borderTopWidth: 1, borderTopColor: c.border, paddingTop: 8, gap: 8 },
    timelineHeader: {
      fontSize: 8,
      fontFamily: 'Inter_500Medium',
      color: c.textTertiary,
      letterSpacing: 1.5,
    },
    timelineRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
    timelineDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: LYTE_COLORS.electricBlue,
      marginTop: 4,
    },
    timelineActor: { fontSize: 11, fontFamily: 'Inter_500Medium', color: c.textPrimary },
    timelineNotes: { fontSize: 10, fontFamily: 'Inter_400Regular', color: c.textSecondary },
    timelineTime: { fontSize: 9, fontFamily: 'Inter_400Regular', color: c.textTertiary },
    empty: { paddingTop: 40, alignItems: 'center' },
    emptyIcon: { fontSize: 32, marginBottom: 10 },
    emptyTitle: {
      fontSize: 16,
      fontFamily: 'Inter_500Medium',
      color: c.textPrimary,
      marginBottom: 4,
    },
    emptyText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: c.textSecondary },
  });
}
