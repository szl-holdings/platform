import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { SkeletonLoader } from "@/components/SkeletonLoader";

const ENGAGEMENT_STAGES = [
  { phase: "Discovery Call", status: "complete" as const, dates: "Feb 15, 2026" },
  { phase: "Needs Assessment", status: "complete" as const, dates: "Feb 22 – Mar 5, 2026" },
  { phase: "Service Plan", status: "complete" as const, dates: "Mar 8, 2026" },
  { phase: "Onboarding", status: "active" as const, dates: "Mar 10 – Apr 4, 2026" },
  { phase: "Active Management", status: "upcoming" as const, dates: "From Apr 7, 2026" },
];

const KPI_CARDS = [
  { label: "Documents", value: "11", sub: "3 awaiting review" },
  { label: "Unread updates", value: "2", sub: "Last: 3 days ago" },
  { label: "Messages", value: "1", sub: "From Rosa, Mar 31" },
  { label: "Next review", value: "Apr 7", sub: "10:00 AM · London" },
];

const RECENT_ACTIVITY = [
  { id: 1, type: "document", title: "Monthly Operations Summary shared", time: "Today, 9:41 AM", icon: "file-text" },
  { id: 2, type: "message", title: "Message from Rosa", time: "Yesterday, 4:12 PM", icon: "message-circle" },
  { id: 3, type: "update", title: "Oxfordshire Estate condition report ready", time: "Mar 28", icon: "bell" },
  { id: 4, type: "session", title: "Q2 Review scheduled — Apr 7", time: "Mar 25", icon: "calendar" },
];

function KpiCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, friction: 10 }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 10 }).start();
  };

  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={() => Haptics.selectionAsync()}
    >
      <Animated.View
        style={[
          styles.kpiCard,
          { borderColor: colors.goldBorder, transform: [{ scale }] },
        ]}
      >
        <Text style={[styles.kpiLabel, { color: colors.creamDim }]}>{label}</Text>
        <Text style={[styles.kpiValue, { color: colors.cream }]}>{value}</Text>
        <Text style={[styles.kpiSub, { color: colors.mutedForeground }]}>{sub}</Text>
      </Animated.View>
    </Pressable>
  );
}

function TimelineItem({
  phase,
  status,
  dates,
  isLast,
}: {
  phase: string;
  status: "complete" | "active" | "upcoming";
  dates: string;
  isLast: boolean;
}) {
  const colors = useColors();

  const dotColor =
    status === "complete"
      ? "rgba(200,169,106,0.25)"
      : status === "active"
      ? "rgba(200,169,106,0.4)"
      : "rgba(245,240,232,0.05)";

  const iconName = status === "complete" ? "check" : status === "active" ? "arrow-right" : "clock";
  const iconColor =
    status === "complete" || status === "active" ? colors.gold : "rgba(245,240,232,0.2)";

  const textColor =
    status === "active"
      ? "rgba(245,240,232,0.9)"
      : status === "complete"
      ? "rgba(245,240,232,0.45)"
      : "rgba(245,240,232,0.2)";

  return (
    <View style={styles.timelineItem}>
      <View style={styles.timelineLeft}>
        <View
          style={[
            styles.timelineDot,
            {
              backgroundColor: dotColor,
              borderColor: status === "active" ? colors.goldBorder : "transparent",
              borderWidth: status === "active" ? 1 : 0,
            },
          ]}
        >
          <Feather name={iconName as any} size={10} color={iconColor} />
        </View>
        {!isLast && (
          <View
            style={[
              styles.timelineLine,
              {
                backgroundColor:
                  status === "complete"
                    ? "rgba(200,169,106,0.15)"
                    : "rgba(245,240,232,0.04)",
              },
            ]}
          />
        )}
      </View>
      <View style={styles.timelineContent}>
        <Text style={[styles.timelinePhase, { color: textColor }]}>{phase}</Text>
        <Text style={[styles.timelineDates, { color: colors.mutedForeground }]}>{dates}</Text>
      </View>
    </View>
  );
}

function ActivityRow({ item }: { item: (typeof RECENT_ACTIVITY)[0] }) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      onPressIn={() =>
        Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, friction: 10 }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 10 }).start()
      }
    >
      <Animated.View
        style={[
          styles.activityRow,
          { borderBottomColor: colors.creamFaint, transform: [{ scale }] },
        ]}
      >
        <View style={[styles.activityIcon, { backgroundColor: colors.goldDim }]}>
          <Feather name={item.icon as any} size={14} color={colors.gold} />
        </View>
        <View style={styles.activityText}>
          <Text style={[styles.activityTitle, { color: colors.cream }]}>{item.title}</Text>
          <Text style={[styles.activityTime, { color: colors.mutedForeground }]}>{item.time}</Text>
        </View>
        <Feather name="chevron-right" size={14} color="rgba(245,240,232,0.15)" />
      </Animated.View>
    </Pressable>
  );
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, isLoading: authLoading } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const displayName = user?.displayName ?? "Client";

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : 90;

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 1200));
    setRefreshing(false);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["rgba(200,169,106,0.05)", "transparent"]}
        style={[styles.headerGradient, { height: topPad + 120 }]}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topPad + 16, paddingBottom: bottomPad },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.gold}
          />
        }
      >
        <View style={styles.greeting}>
          <Text style={[styles.greetingEyebrow, { color: colors.goldSubtle }]}>
            CLIENT PORTAL
          </Text>
          {authLoading ? (
            <View style={{ gap: 8 }}>
              <SkeletonLoader width="60%" height={20} />
              <SkeletonLoader width="80%" height={30} />
            </View>
          ) : (
            <Text style={[styles.greetingName, { color: colors.cream }]}>
              {greeting},{"\n"}{displayName}
            </Text>
          )}
          <Text style={[styles.greetingStatus, { color: colors.mutedForeground }]}>
            Active engagement · Onboarding phase
          </Text>
        </View>

        <View style={styles.kpiGrid}>
          {KPI_CARDS.map((kpi) => (
            <View key={kpi.label} style={styles.kpiCol}>
              <KpiCard {...kpi} />
            </View>
          ))}
        </View>

        <View style={[styles.section, { borderTopColor: colors.creamFaint }]}>
          <Text style={[styles.sectionLabel, { color: colors.goldSubtle }]}>
            ENGAGEMENT TIMELINE
          </Text>
          <View style={styles.timeline}>
            {ENGAGEMENT_STAGES.map((stage, i) => (
              <TimelineItem
                key={stage.phase}
                {...stage}
                isLast={i === ENGAGEMENT_STAGES.length - 1}
              />
            ))}
          </View>
        </View>

        <View style={[styles.section, { borderTopColor: colors.creamFaint }]}>
          <Text style={[styles.sectionLabel, { color: colors.goldSubtle }]}>
            RECENT ACTIVITY
          </Text>
          <View style={[styles.activityList, { borderColor: colors.creamFaint }]}>
            {RECENT_ACTIVITY.map((item) => (
              <ActivityRow key={item.id} item={item} />
            ))}
          </View>
        </View>

        <View style={[styles.section, { borderTopColor: colors.creamFaint }]}>
          <Text style={[styles.sectionLabel, { color: colors.goldSubtle }]}>
            YOUR PROPERTIES
          </Text>
          {[
            { name: "Mayfair Residence", location: "London, W1", status: "Primary — Active" },
            { name: "Oxfordshire Estate", location: "Oxfordshire, UK", status: "Secondary — Seasonal" },
          ].map((prop) => (
            <Pressable key={prop.name}>
              <View style={[styles.propertyCard, { borderColor: colors.creamFaint }]}>
                <Text style={[styles.propertyName, { color: "rgba(245,240,232,0.75)" }]}>
                  {prop.name}
                </Text>
                <Text style={[styles.propertyLocation, { color: colors.goldSubtle }]}>
                  {prop.location}
                </Text>
                <Text style={[styles.propertyStatus, { color: colors.mutedForeground }]}>
                  {prop.status}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  greeting: { marginBottom: 28 },
  greetingEyebrow: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    letterSpacing: 3,
    marginBottom: 10,
  },
  greetingName: {
    fontSize: 28,
    fontFamily: "CormorantGaramond_400Regular",
    lineHeight: 36,
    marginBottom: 6,
  },
  greetingStatus: {
    fontSize: 12,
    fontFamily: "Inter_300Light",
    letterSpacing: 0.3,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  kpiCol: { width: "48.5%" },
  kpiCard: {
    borderWidth: 1,
    padding: 16,
  },
  kpiLabel: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  kpiValue: {
    fontSize: 22,
    fontFamily: "CormorantGaramond_400Regular",
    marginBottom: 4,
  },
  kpiSub: {
    fontSize: 10,
    fontFamily: "Inter_300Light",
  },
  section: {
    borderTopWidth: 1,
    paddingTop: 20,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    letterSpacing: 3,
    marginBottom: 16,
  },
  timeline: { gap: 0 },
  timelineItem: {
    flexDirection: "row",
    gap: 12,
  },
  timelineLeft: {
    alignItems: "center",
    width: 20,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  timelineLine: {
    width: 1,
    flex: 1,
    minHeight: 32,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 12,
    paddingTop: 2,
  },
  timelinePhase: {
    fontSize: 13,
    fontFamily: "Inter_300Light",
    marginBottom: 2,
  },
  timelineDates: {
    fontSize: 10,
    fontFamily: "Inter_300Light",
  },
  activityList: {
    borderWidth: 1,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
  },
  activityIcon: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  activityText: { flex: 1 },
  activityTitle: {
    fontSize: 13,
    fontFamily: "Inter_300Light",
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 10,
    fontFamily: "Inter_300Light",
  },
  propertyCard: {
    borderWidth: 1,
    padding: 16,
    marginBottom: 8,
  },
  propertyName: {
    fontSize: 14,
    fontFamily: "Inter_300Light",
    marginBottom: 4,
  },
  propertyLocation: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  propertyStatus: {
    fontSize: 10,
    fontFamily: "Inter_300Light",
  },
});
