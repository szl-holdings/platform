import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { WORKSPACES } from "@/context/WorkspaceContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const CARD_WIDTH = SCREEN_WIDTH - 48;
const ACCENT = "#c9a84c";

export type QuickActionType =
  | "approve"
  | "deny"
  | "acknowledge"
  | "schedule"
  | "authorize"
  | "escalate";

export interface QuickAction {
  id: string;
  domain: string;
  title: string;
  description: string;
  type: QuickActionType;
  amount?: string;
  urgency: "critical" | "high" | "medium" | "low";
  requester?: string;
  dueBy?: string;
  approveLabel?: string;
  denyLabel?: string;
}

const MOCK_ACTIONS: QuickAction[] = [
  {
    id: "1",
    domain: "portfolio",
    title: "Wire Transfer Authorization",
    description: "Authorize $2.4M wire transfer to Alloy Capital fund for Q2 close.",
    type: "authorize",
    amount: "$2,400,000",
    urgency: "critical",
    requester: "CFO Office",
    dueBy: "Today 5:00 PM",
    approveLabel: "Authorize",
    denyLabel: "Hold",
  },
  {
    id: "2",
    domain: "defense",
    title: "Critical CVE Patch",
    description: "Emergency patch for CVE-2024-3891 on 3 production systems — requires exec sign-off.",
    type: "approve",
    urgency: "critical",
    requester: "Aegis SOC",
    dueBy: "Within 2 hours",
    approveLabel: "Approve Patch",
    denyLabel: "Defer",
  },
  {
    id: "3",
    domain: "properties",
    title: "LOI for 1400 Brickell Ave",
    description: "Sign Letter of Intent for $18.5M acquisition in Miami Brickell corridor.",
    type: "approve",
    amount: "$18,500,000",
    urgency: "high",
    requester: "Terra Team",
    dueBy: "Tomorrow 12 PM",
    approveLabel: "Sign LOI",
    denyLabel: "Decline",
  },
  {
    id: "4",
    domain: "fleet",
    title: "Port Diversion — MV Atlantis",
    description: "Approve emergency diversion of MV Atlantis to Port of Antwerp due to weather advisory.",
    type: "approve",
    urgency: "high",
    requester: "Fleet Ops",
    dueBy: "Within 4 hours",
    approveLabel: "Approve Diversion",
    denyLabel: "Hold Route",
  },
  {
    id: "5",
    domain: "advisory",
    title: "New Client Engagement",
    description: "Carlota Jo requests approval to onboard BlackRock as advisory client. Fee: $240K/yr.",
    type: "approve",
    amount: "$240,000/yr",
    urgency: "medium",
    requester: "Carlota Jo",
    dueBy: "3 Days",
    approveLabel: "Approve",
    denyLabel: "Decline",
  },
  {
    id: "6",
    domain: "operations",
    title: "Acknowledge Latency Alert",
    description: "API latency exceeded threshold for 18 minutes. Lyte agent has isolated cause.",
    type: "acknowledge",
    urgency: "medium",
    requester: "Lyte AIOps",
    dueBy: "Pending",
    approveLabel: "Acknowledge",
    denyLabel: "Escalate",
  },
];

function urgencyColor(urgency: string, colors: ReturnType<typeof useColors>) {
  switch (urgency) {
    case "critical": return colors.red;
    case "high": return colors.amber;
    case "medium": return "#f59e0b";
    default: return colors.blue;
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
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSwipeLeft(action.id);
  }, [onSwipeLeft, action.id]);

  const handleSwipeRight = useCallback(() => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
          Extrapolation.CLAMP
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
    opacity: interpolate(translateX.value, [0, -SWIPE_THRESHOLD * 0.5], [0, 1], Extrapolation.CLAMP),
  }));

  if (!isTop) {
    return (
      <Animated.View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, animatedStyle]}>
        <View style={[styles.cardAccentBar, { backgroundColor: accent }]} />
      </Animated.View>
    );
  }

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, animatedStyle]}>
        <View style={[styles.cardAccentBar, { backgroundColor: accent }]} />

        <Animated.View style={[styles.swipeLabel, styles.approveLabelPos, approveOpacity]}>
          <Text style={[styles.swipeLabelText, { color: colors.green }]}>
            ✓ {action.approveLabel ?? "APPROVE"}
          </Text>
        </Animated.View>
        <Animated.View style={[styles.swipeLabel, styles.denyLabelPos, denyOpacity]}>
          <Text style={[styles.swipeLabelText, { color: colors.red }]}>
            ✗ {action.denyLabel ?? "DENY"}
          </Text>
        </Animated.View>

        <View style={styles.cardTop}>
          <View style={styles.cardDomainRow}>
            <Text style={styles.cardDomainIcon}>{urg?.icon ?? "◉"}</Text>
            <Text style={[styles.cardDomain, { color: colors.mutedForeground }]}>{urg?.label ?? action.domain}</Text>
            <View style={[styles.urgencyBadge, { backgroundColor: `${urgColor}18`, borderColor: `${urgColor}30` }]}>
              <Text style={[styles.urgencyText, { color: urgColor }]}>{action.urgency.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>{action.title}</Text>
          <Text style={[styles.cardDesc, { color: colors.mutedForeground }]}>{action.description}</Text>
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
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{action.requester}</Text>
            </View>
          )}
          {action.dueBy && (
            <View style={styles.metaItem}>
              <Feather name="clock" size={12} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{action.dueBy}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.denyBtn, { borderColor: `${colors.red}40` }]}
            onPress={handleSwipeLeft}
          >
            <Feather name="x" size={16} color={colors.red} />
            <Text style={[styles.actionBtnText, { color: colors.red }]}>{action.denyLabel ?? "Deny"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.approveBtn, { backgroundColor: colors.green }]}
            onPress={handleSwipeRight}
          >
            <Feather name="check" size={16} color="#fff" />
            <Text style={[styles.actionBtnText, { color: "#fff" }]}>{action.approveLabel ?? "Approve"}</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.swipeHint, { color: colors.mutedForeground }]}>
          ← Swipe to deny · Swipe to approve →
        </Text>
      </Animated.View>
    </GestureDetector>
  );
}

export function QuickActionDeck() {
  const colors = useColors();
  const [actions, setActions] = useState<QuickAction[]>(MOCK_ACTIONS);
  const [resolved, setResolved] = useState<{ id: string; decision: "approved" | "denied" }[]>([]);

  const handleSwipeRight = useCallback((id: string) => {
    setResolved((prev) => [...prev, { id, decision: "approved" }]);
    setActions((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handleSwipeLeft = useCallback((id: string) => {
    setResolved((prev) => [...prev, { id, decision: "denied" }]);
    setActions((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handleReset = useCallback(() => {
    setActions(MOCK_ACTIONS);
    setResolved([]);
  }, []);

  if (actions.length === 0) {
    return (
      <View style={styles.emptyDeck}>
        <Text style={styles.emptyIcon}>✓</Text>
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>All Clear</Text>
        <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
          You've actioned all {resolved.length} pending decisions.
        </Text>
        <View style={styles.resolvedStats}>
          <View style={[styles.resolvedStat, { borderColor: `${colors.green}40` }]}>
            <Text style={[styles.resolvedNum, { color: colors.green }]}>
              {resolved.filter((r) => r.decision === "approved").length}
            </Text>
            <Text style={[styles.resolvedLabel, { color: colors.mutedForeground }]}>Approved</Text>
          </View>
          <View style={[styles.resolvedStat, { borderColor: `${colors.red}40` }]}>
            <Text style={[styles.resolvedNum, { color: colors.red }]}>
              {resolved.filter((r) => r.decision === "denied").length}
            </Text>
            <Text style={[styles.resolvedLabel, { color: colors.mutedForeground }]}>Denied</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.resetBtn, { borderColor: "rgba(201,168,76,0.3)" }]}
          onPress={handleReset}
        >
          <Text style={styles.resetBtnText}>Review Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const visibleCards = actions.slice(0, 3);

  return (
    <View style={styles.deckContainer}>
      <View style={styles.deckHeader}>
        <Text style={[styles.deckCount, { color: colors.mutedForeground }]}>
          {actions.length} actions pending
        </Text>
        <View style={styles.deckProgress}>
          {MOCK_ACTIONS.map((a) => (
            <View
              key={a.id}
              style={[
                styles.progressDot,
                {
                  backgroundColor: resolved.find((r) => r.id === a.id)
                    ? resolved.find((r) => r.id === a.id)!.decision === "approved"
                      ? colors.green
                      : colors.red
                    : colors.border,
                },
              ]}
            />
          ))}
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
  deckContainer: { flex: 1, alignItems: "center" },
  deckHeader: {
    width: CARD_WIDTH,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  deckCount: { fontSize: 12, fontFamily: "Inter_500Medium" },
  deckProgress: { flexDirection: "row", gap: 4 },
  progressDot: { width: 8, height: 8, borderRadius: 4 },
  deckStack: {
    width: CARD_WIDTH,
    height: 380,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    position: "absolute",
    width: CARD_WIDTH,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  cardAccentBar: { height: 3, width: "100%" },
  swipeLabel: {
    position: "absolute",
    top: 20,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  approveLabelPos: { left: 16, borderColor: "#22c55e" },
  denyLabelPos: { right: 16, borderColor: "#ef4444" },
  swipeLabelText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  cardTop: { padding: 16, gap: 8 },
  cardDomainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardDomainIcon: { fontSize: 14 },
  cardDomain: { fontSize: 11, fontFamily: "Inter_400Regular", flex: 1 },
  urgencyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  urgencyText: { fontSize: 9, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  cardTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  cardDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  cardMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  cardActions: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    paddingTop: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
  },
  denyBtn: { borderWidth: 1 },
  approveBtn: {},
  actionBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  swipeHint: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingBottom: 10,
    letterSpacing: 0.3,
  },
  emptyDeck: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 32,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_600SemiBold" },
  emptySubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  resolvedStats: { flexDirection: "row", gap: 16, marginTop: 8 },
  resolvedStat: {
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 100,
  },
  resolvedNum: { fontSize: 24, fontFamily: "Inter_600SemiBold" },
  resolvedLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  resetBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  resetBtnText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "#c9a84c",
  },
});
