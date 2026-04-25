import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { WORKSPACES } from '@/context/WorkspaceContext';
import { useColors } from '@/hooks/useColors';
import { giProductAccent, giColors, palette } from '@/lib/gi-bridge';
import { apiGet, apiPost } from '@/lib/apiClient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const CARD_WIDTH = SCREEN_WIDTH - 48;
const ACCENT = giProductAccent.lyte;

export type QuickActionType =
  | 'approve'
  | 'deny'
  | 'acknowledge'
  | 'schedule'
  | 'authorize'
  | 'escalate';

export interface QuickAction {
  id: string;
  domain: string;
  title: string;
  description: string;
  type: QuickActionType;
  amount?: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  requester?: string;
  dueBy?: string;
  approveLabel?: string;
  denyLabel?: string;
}

interface QuickActionsResponse {
  items: QuickAction[];
  total: number;
}

interface ActionResponse {
  id: string;
  decision: string;
  updatedStatus: string;
}

function urgencyColor(urgency: string, colors: ReturnType<typeof useColors>) {
  switch (urgency) {
    case 'critical':
      return colors.red;
    case 'high':
      return colors.amber;
    case 'medium':
      return colors.amber;
    default:
      return colors.blue;
  }
}

interface ActionCardProps {
  action: QuickAction;
  isTop: boolean;
  index: number;
  onSwipeLeft: (id: string) => void;
  onSwipeRight: (id: string) => void;
  colors: ReturnType<typeof useColors>;
}

function ActionCard({ action, isTop, index, onSwipeLeft, onSwipeRight, colors }: ActionCardProps) {
  const translateX = useSharedValue(0);
  const urg = WORKSPACES.find((w) => w.id === action.domain);
  const accent = urg?.accent ?? ACCENT;
  const urgColor = urgencyColor(action.urgency, colors);

  const handleSwipeLeft = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSwipeLeft(action.id);
  }, [onSwipeLeft, action.id]);

  const handleSwipeRight = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSwipeRight(action.id);
  }, [onSwipeRight, action.id]);

  const panGesture = Gesture.Pan()
    .enabled(isTop)
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        translateX.value = withTiming(SCREEN_WIDTH * 1.5, { duration: 300 });
        runOnJS(handleSwipeRight)();
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-SCREEN_WIDTH * 1.5, { duration: 300 });
        runOnJS(handleSwipeLeft)();
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: index * -4 },
      {
        rotate: `${interpolate(
          translateX.value,
          [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
          [-12, 0, 12],
          Extrapolation.CLAMP,
        )}deg`,
      },
    ],
    opacity: isTop ? 1 : interpolate(index, [1, 3], [0.85, 0.6], Extrapolation.CLAMP),
    zIndex: 10 - index,
  }));

  const approveOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD * 0.5], [0, 1], Extrapolation.CLAMP),
  }));
  const denyOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, -SWIPE_THRESHOLD * 0.5],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  if (!isTop) {
    return (
      <Animated.View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
          animatedStyle,
        ]}
      >
        <View style={[styles.cardAccentBar, { backgroundColor: accent }]} />
      </Animated.View>
    );
  }

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
          animatedStyle,
        ]}
      >
        <View style={[styles.cardAccentBar, { backgroundColor: accent }]} />

        <Animated.View style={[styles.swipeLabel, styles.approveLabelPos, approveOpacity]}>
          <Text style={[styles.swipeLabelText, { color: colors.green }]}>
            ✓ {action.approveLabel ?? 'APPROVE'}
          </Text>
        </Animated.View>
        <Animated.View style={[styles.swipeLabel, styles.denyLabelPos, denyOpacity]}>
          <Text style={[styles.swipeLabelText, { color: colors.red }]}>
            ✗ {action.denyLabel ?? 'DENY'}
          </Text>
        </Animated.View>

        <View style={styles.cardTop}>
          <View style={styles.cardDomainRow}>
            <Text style={styles.cardDomainIcon}>{urg?.icon ?? '◉'}</Text>
            <Text style={[styles.cardDomain, { color: colors.mutedForeground }]}>
              {urg?.label ?? action.domain}
            </Text>
            <View
              style={[
                styles.urgencyBadge,
                { backgroundColor: `${urgColor}18`, borderColor: `${urgColor}30` },
              ]}
            >
              <Text style={[styles.urgencyText, { color: urgColor }]}>
                {action.urgency.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>{action.title}</Text>
          <Text style={[styles.cardDesc, { color: colors.mutedForeground }]}>
            {action.description}
          </Text>
        </View>

        <View style={[styles.cardMeta, { borderTopColor: colors.border }]}>
          {action.amount && (
            <View style={styles.metaItem}>
              <Feather name="dollar-sign" size={12} color={ACCENT} />
              <Text style={[styles.metaText, { color: colors.foreground }]}>{action.amount}</Text>
            </View>
          )}
          {action.requester && (
            <View style={styles.metaItem}>
              <Feather name="user" size={12} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                {action.requester}
              </Text>
            </View>
          )}
          {action.dueBy && (
            <View style={styles.metaItem}>
              <Feather name="clock" size={12} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                {action.dueBy}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.denyBtn, { borderColor: `${colors.red}40` }]}
            onPress={handleSwipeLeft}
          >
            <Feather name="x" size={16} color={colors.red} />
            <Text style={[styles.actionBtnText, { color: colors.red }]}>
              {action.denyLabel ?? 'Deny'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.approveBtn, { backgroundColor: colors.green }]}
            onPress={handleSwipeRight}
          >
            <Feather name="check" size={16} color={palette.onAccent} />
            <Text style={[styles.actionBtnText, { color: palette.onAccent }]}>
              {action.approveLabel ?? 'Approve'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.swipeHint, { color: colors.mutedForeground }]}>
          ← Swipe to deny · Swipe to approve →
        </Text>

        <TouchableOpacity
          style={styles.auditTrailBtn}
          onPress={() => {
            const domain = process.env.EXPO_PUBLIC_DOMAIN;
            const base = domain ? `https://${domain}` : '';
            Linking.openURL(`${base}/command/operations/policy-approvals?requestId=${encodeURIComponent(action.id)}`).catch(() => {});
          }}
        >
          <Feather name="file-text" size={10} color={colors.mutedForeground} />
          <Text style={[styles.auditTrailText, { color: colors.mutedForeground }]}>
            View Audit Trail
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  );
}

export function QuickActionDeck() {
  const colors = useColors();
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['cortex', 'quick-actions'],
    queryFn: () => apiGet<QuickActionsResponse>('/api/cortex/quick-actions'),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const actions: QuickAction[] = data?.items ?? [];

  const [resolved, setResolved] = React.useState<{ id: string; decision: 'approved' | 'denied' }[]>(
    [],
  );
  const [dismissed, setDismissed] = React.useState<Set<string>>(new Set());

  const mutation = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: 'approved' | 'denied' }) =>
      apiPost<ActionResponse>(`/api/cortex/quick-actions/${id}/action`, { decision }),
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: ['cortex', 'quick-actions'] });
      setResolved((prev) => [...prev, { id: variables.id, decision: variables.decision }]);
      setDismissed((prev) => new Set([...prev, variables.id]));
    },
    onError: (_err, variables) => {
      setDismissed((prev) => {
        const next = new Set(prev);
        next.delete(variables.id);
        return next;
      });
      setResolved((prev) => prev.filter((r) => r.id !== variables.id));
    },
  });

  const handleSwipeRight = useCallback(
    (id: string) => {
      setDismissed((prev) => new Set([...prev, id]));
      mutation.mutate({ id, decision: 'approved' });
    },
    [mutation],
  );

  const handleSwipeLeft = useCallback(
    (id: string) => {
      setDismissed((prev) => new Set([...prev, id]));
      mutation.mutate({ id, decision: 'denied' });
    },
    [mutation],
  );

  const handleReset = useCallback(() => {
    setResolved([]);
    setDismissed(new Set());
    refetch();
  }, [refetch]);

  if (isLoading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color={ACCENT} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          Loading pending decisions…
        </Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.emptyIcon}>⚠</Text>
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Unable to Load</Text>
        <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
          Could not fetch pending approvals. Check your connection.
        </Text>
        <TouchableOpacity
          style={[styles.resetBtn, { borderColor: 'rgba(201,168,76,0.3)' }]}
          onPress={() => refetch()}
        >
          <Text style={styles.resetBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const visibleActions = actions.filter((a) => !dismissed.has(a.id));

  if (visibleActions.length === 0) {
    return (
      <View style={styles.emptyDeck}>
        <Text style={styles.emptyIcon}>✓</Text>
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>All Clear</Text>
        <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
          {resolved.length > 0
            ? `You've actioned all ${resolved.length} pending decision${resolved.length !== 1 ? 's' : ''}.`
            : 'No pending approvals at this time.'}
        </Text>
        {resolved.length > 0 && (
          <View style={styles.resolvedStats}>
            <View style={[styles.resolvedStat, { borderColor: `${colors.green}40` }]}>
              <Text style={[styles.resolvedNum, { color: colors.green }]}>
                {resolved.filter((r) => r.decision === 'approved').length}
              </Text>
              <Text style={[styles.resolvedLabel, { color: colors.mutedForeground }]}>
                Approved
              </Text>
            </View>
            <View style={[styles.resolvedStat, { borderColor: `${colors.red}40` }]}>
              <Text style={[styles.resolvedNum, { color: colors.red }]}>
                {resolved.filter((r) => r.decision === 'denied').length}
              </Text>
              <Text style={[styles.resolvedLabel, { color: colors.mutedForeground }]}>Denied</Text>
            </View>
          </View>
        )}
        <View style={styles.emptyActionsRow}>
          <TouchableOpacity
            style={[styles.resetBtn, { borderColor: 'rgba(201,168,76,0.3)' }]}
            onPress={handleReset}
            accessibilityRole="button"
            accessibilityLabel="Refresh pending decisions"
          >
            <Text style={styles.resetBtnText}>Refresh</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.historyBtn, { borderColor: colors.border }]}
            onPress={() => router.push('/(shell)/quick-actions-history')}
            accessibilityRole="button"
            accessibilityLabel="View decision history"
          >
            <Feather name="clock" size={12} color={colors.mutedForeground} />
            <Text style={[styles.historyBtnText, { color: colors.mutedForeground }]}>
              View Decision History
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const allForProgress = [
    ...actions,
    ...resolved.filter((r) => !actions.find((a) => a.id === r.id)),
  ];
  const visibleCards = visibleActions.slice(0, 3);

  return (
    <View style={styles.deckContainer}>
      <View style={styles.deckHeader}>
        <Text style={[styles.deckCount, { color: colors.mutedForeground }]}>
          {visibleActions.length} action{visibleActions.length !== 1 ? 's' : ''} pending
        </Text>
        <View style={styles.deckProgress}>
          {allForProgress.map((a) => {
            const r = resolved.find((rv) => rv.id === a.id);
            return (
              <View
                key={a.id}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor: r
                      ? r.decision === 'approved'
                        ? colors.green
                        : colors.red
                      : colors.border,
                  },
                ]}
              />
            );
          })}
        </View>
      </View>

      <View style={styles.deckStack}>
        {[...visibleCards].reverse().map((action, reversedIndex) => {
          const index = visibleCards.length - 1 - reversedIndex;
          return (
            <ActionCard
              key={action.id}
              action={action}
              isTop={index === 0}
              index={index}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
              colors={colors}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginTop: 8,
  },
  deckContainer: { flex: 1, alignItems: 'center' },
  deckHeader: {
    width: CARD_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  deckCount: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  deckProgress: { flexDirection: 'row', gap: 4 },
  progressDot: { width: 8, height: 8, borderRadius: 4 },
  deckStack: {
    width: CARD_WIDTH,
    height: 380,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  cardAccentBar: { height: 3, width: '100%' },
  swipeLabel: {
    position: 'absolute',
    top: 20,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  approveLabelPos: { left: 16, borderColor: giColors.accent.green },
  denyLabelPos: { right: 16, borderColor: giColors.accent.red },
  swipeLabelText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  cardTop: { padding: 16, gap: 8 },
  cardDomainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardDomainIcon: { fontSize: 14 },
  cardDomain: { fontSize: 11, fontFamily: 'Inter_400Regular', flex: 1 },
  urgencyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  urgencyText: { fontSize: 9, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5 },
  cardTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  cardDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19 },
  cardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    paddingTop: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
  },
  denyBtn: { borderWidth: 1 },
  approveBtn: {},
  actionBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  swipeHint: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    paddingBottom: 6,
    letterSpacing: 0.3,
  },
  auditTrailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingBottom: 10,
  },
  auditTrailText: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 0.2,
    textDecorationLine: 'underline',
  },
  emptyDeck: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_600SemiBold' },
  emptySubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  resolvedStats: { flexDirection: 'row', gap: 16, marginTop: 8 },
  resolvedStat: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 100,
  },
  resolvedNum: { fontSize: 24, fontFamily: 'Inter_600SemiBold' },
  resolvedLabel: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  resetBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  resetBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: ACCENT,
  },
  emptyActionsRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  historyBtnText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.2,
  },
});
