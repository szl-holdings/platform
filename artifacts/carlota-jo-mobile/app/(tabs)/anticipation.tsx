import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

type FeatherName = React.ComponentProps<typeof Feather>["name"];
type Urgency = "immediate" | "this-week" | "this-month" | "seasonal";

type Suggestion = {
  id: string;
  title: string;
  category: string;
  urgency: Urgency;
  icon: FeatherName;
  summary: string;
  action: string;
  dismissed?: boolean;
  acted?: boolean;
};

const urgencyConfig: Record<Urgency, { label: string; color: string }> = {
  immediate: { label: "Act now", color: "rgba(239,68,68,0.9)" },
  "this-week": { label: "This week", color: "rgba(200,169,106,1)" },
  "this-month": { label: "This month", color: "rgba(6,182,212,0.85)" },
  seasonal: { label: "Seasonal prep", color: "rgba(139,92,246,0.85)" },
};

const suggestions: Suggestion[] = [
  {
    id: "s1",
    title: "Schedule Oxfordshire opening inspection",
    category: "Residence Operations",
    urgency: "this-week",
    icon: "home",
    summary:
      "Based on a 2-year pattern, Oxfordshire opens in early May. An inspection should be scheduled now — typically 3–4 weeks ahead of opening.",
    action: "Schedule inspection for week of Apr 14–18. Confirm caretaker availability.",
  },
  {
    id: "s2",
    title: "Review and extend summer vendor contracts",
    category: "Vendor Management",
    urgency: "this-week",
    icon: "package",
    summary:
      "Seasonal vendors at Oxfordshire require annual renewal. Last year delays led to a 3-week service gap for pool maintenance.",
    action: "Reach out to grounds, pool, and cleaning vendors this week.",
  },
  {
    id: "s3",
    title: "Pre-book New York travel support — likely June",
    category: "Travel & Lifestyle",
    urgency: "this-month",
    icon: "map-pin",
    summary:
      "Client visits New York in June or July each year. The Carlyle books 8–10 weeks ahead. Early hold recommended.",
    action: "Confirm June travel intent. Pre-block preferred dates at The Carlyle.",
  },
  {
    id: "s4",
    title: "Mayfair summer staffing — confirm cover",
    category: "Household Systems",
    urgency: "this-month",
    icon: "users",
    summary:
      "Mrs. Chambers takes 6 weeks leave in July–August. No 2026 cover arrangement confirmed. Last year arranged at short notice.",
    action: "Confirm leave dates. Identify and brief preferred cover by end of April.",
  },
  {
    id: "s5",
    title: "Annual heating service — both properties",
    category: "Maintenance",
    urgency: "seasonal",
    icon: "thermometer",
    summary:
      "Heritage Heating has a 4–6 week lead time in September. Early booking (May–June) secures preferred autumn dates.",
    action: "Contact Heritage Heating in May to pre-book September service slots.",
  },
  {
    id: "s6",
    title: "Q3 Review Session — schedule now",
    category: "Engagement Cadence",
    urgency: "this-month",
    icon: "calendar",
    summary:
      "Quarterly review is due early July. Client prefers London, morning, and is typically abroad in late June.",
    action: "Propose July 6 or 7, 9:00 AM, Mayfair. Confirm by end of April.",
  },
];

function SuggestionCard({
  suggestion,
  onDismiss,
  onAct,
}: {
  suggestion: Suggestion;
  onDismiss: (id: string) => void;
  onAct: (id: string) => void;
}) {
  const colors = useColors();
  const scale = React.useRef(new Animated.Value(1)).current;
  const ucfg = urgencyConfig[suggestion.urgency];
  const [expanded, setExpanded] = useState(false);

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, friction: 10 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 10 }).start();

  if (suggestion.dismissed) return null;

  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View
        style={[
          styles.card,
          {
            borderColor: colors.goldBorder,
            opacity: suggestion.acted ? 0.5 : 1,
            transform: [{ scale }],
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View
              style={[
                styles.urgencyBadge,
                { borderColor: ucfg.color + "50" },
              ]}
            >
              <Text style={[styles.urgencyLabel, { color: ucfg.color }]}>
                {ucfg.label.toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.categoryText, { color: colors.mutedForeground }]}>
              {suggestion.category}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              onDismiss(suggestion.id);
            }}
            hitSlop={8}
          >
            <Feather name="x" size={14} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <View style={styles.cardBody}>
          <View
            style={[
              styles.iconBox,
              { backgroundColor: "rgba(200,169,106,0.07)" },
            ]}
          >
            <Feather
              name={suggestion.icon}
              size={15}
              color={ucfg.color}
            />
          </View>
          <View style={styles.cardText}>
            <Text style={[styles.cardTitle, { color: colors.cream }]}>
              {suggestion.title}
            </Text>
            <Text
              style={[styles.cardSummary, { color: colors.creamDim }]}
              numberOfLines={expanded ? undefined : 3}
            >
              {suggestion.summary}
            </Text>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setExpanded(!expanded);
              }}
              style={{ marginTop: 6, flexDirection: "row", alignItems: "center", gap: 4 }}
              hitSlop={6}
            >
              <Feather
                name={expanded ? "chevron-up" : "chevron-down"}
                size={11}
                color="rgba(196,170,126,0.45)"
              />
              <Text style={{ fontSize: 10, color: "rgba(196,170,126,0.45)", fontFamily: "Inter_400Regular", letterSpacing: 1 }}>
                {expanded ? "HIDE REASONING" : "VIEW REASONING"}
              </Text>
            </Pressable>
            {expanded && (
              <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: "rgba(244,237,224,0.06)" }}>
                <Text style={{ fontSize: 9, letterSpacing: 1.5, color: "rgba(196,170,126,0.4)", fontFamily: "Inter_500Medium", marginBottom: 4 }}>GENOME SIGNAL</Text>
                <Text style={{ fontSize: 11, color: "rgba(196,170,126,0.65)", fontFamily: "Inter_400Regular", lineHeight: 16 }}>
                  {suggestion.category} · Observed pattern · {suggestion.urgency.replace("-", " ")} window
                </Text>
              </View>
            )}
          </View>
        </View>

        <View
          style={[
            styles.cardFooter,
            { borderTopColor: "rgba(244,237,224,0.06)" },
          ]}
        >
          <Text
            style={[styles.actionText, { color: colors.mutedForeground }]}
            numberOfLines={2}
          >
            {suggestion.action}
          </Text>
          <Pressable
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onAct(suggestion.id);
            }}
            style={({ pressed }) => [
              styles.actBtn,
              {
                backgroundColor: suggestion.acted
                  ? "rgba(16,185,129,0.1)"
                  : "rgba(200,169,106,0.08)",
                borderColor: suggestion.acted
                  ? "rgba(16,185,129,0.2)"
                  : colors.goldBorder,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Feather
              name={suggestion.acted ? "check-circle" : "check"}
              size={11}
              color={
                suggestion.acted
                  ? "rgba(16,185,129,0.75)"
                  : colors.gold
              }
            />
            <Text
              style={[
                styles.actBtnText,
                {
                  color: suggestion.acted
                    ? "rgba(16,185,129,0.75)"
                    : colors.gold,
                },
              ]}
            >
              {suggestion.acted ? "NOTED" : "ACTIONED"}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </Pressable>
  );
}

type FilterType = Urgency | "all";

export default function AnticipationScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Suggestion[]>(suggestions);
  const [filter, setFilter] = useState<FilterType>("all");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : 90;

  const dismiss = (id: string) =>
    setItems((prev) => prev.map((s) => (s.id === id ? { ...s, dismissed: true } : s)));
  const act = (id: string) =>
    setItems((prev) => prev.map((s) => (s.id === id ? { ...s, acted: true } : s)));

  const active = items.filter((s) => !s.dismissed);
  const filtered =
    filter === "all" ? active : active.filter((s) => s.urgency === filter);

  const counts: Record<FilterType, number> = {
    all: active.length,
    immediate: active.filter((s) => s.urgency === "immediate").length,
    "this-week": active.filter((s) => s.urgency === "this-week").length,
    "this-month": active.filter((s) => s.urgency === "this-month").length,
    seasonal: active.filter((s) => s.urgency === "seasonal").length,
  };

  const filters: { id: FilterType; label: string }[] = [
    { id: "all", label: "All" },
    { id: "this-week", label: "This week" },
    { id: "this-month", label: "This month" },
    { id: "seasonal", label: "Seasonal" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["rgba(200,169,106,0.05)", "transparent"]}
        style={[styles.gradient, { height: topPad + 90 }]}
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad + 16, paddingBottom: bottomPad },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.eyebrow, { color: colors.goldSubtle }]}>
          ANTICIPATION ENGINE
        </Text>
        <Text style={[styles.title, { color: colors.cream }]}>
          What Rosa{"\n"}sees coming
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Pattern-based predictions of what the client will need before they ask.
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={styles.filterRowContent}
        >
          {filters.map((f) => (
            <Pressable
              key={f.id}
              onPress={() => {
                Haptics.selectionAsync();
                setFilter(f.id);
              }}
            >
              <View
                style={[
                  styles.filterChip,
                  {
                    borderColor:
                      filter === f.id
                        ? colors.gold
                        : "rgba(244,237,224,0.08)",
                    backgroundColor:
                      filter === f.id
                        ? "rgba(200,169,106,0.08)"
                        : "transparent",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterLabel,
                    {
                      color:
                        filter === f.id
                          ? colors.gold
                          : colors.mutedForeground,
                    },
                  ]}
                >
                  {f.label}
                </Text>
                <View
                  style={[
                    styles.filterCount,
                    { backgroundColor: "rgba(255,255,255,0.04)" },
                  ]}
                >
                  <Text
                    style={[styles.filterCountText, { color: colors.mutedForeground }]}
                  >
                    {counts[f.id]}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.cards}>
          {filtered.map((s) => (
            <SuggestionCard
              key={s.id}
              suggestion={s}
              onDismiss={dismiss}
              onAct={act}
            />
          ))}
          {filtered.length === 0 && (
            <View style={styles.emptyState}>
              <Feather
                name="check-circle"
                size={24}
                color={colors.mutedForeground}
              />
              <Text
                style={[styles.emptyText, { color: colors.mutedForeground }]}
              >
                No active suggestions for this filter. Anticipation Engine is
                monitoring.
              </Text>
            </View>
          )}
        </View>

        <View
          style={[
            styles.footer,
            {
              borderColor: colors.goldBorder,
              backgroundColor: "rgba(200,169,106,0.05)",
            },
          ]}
        >
          <Feather
            name="zap"
            size={11}
            color="rgba(200,169,106,0.4)"
            style={{ marginBottom: 4 }}
          />
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            Suggestions are derived from Preference Genome signals, seasonal
            patterns, and lifecycle triggers. Rosa reviews before action is
            taken.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { position: "absolute", top: 0, left: 0, right: 0 },
  content: { paddingHorizontal: 20 },
  eyebrow: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    letterSpacing: 3,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontFamily: "CormorantGaramond_400Regular",
    lineHeight: 36,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "Inter_300Light",
    lineHeight: 18,
    marginBottom: 24,
  },
  filterRow: { marginBottom: 20 },
  filterRowContent: { gap: 8, paddingRight: 20 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  filterLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.5,
  },
  filterCount: {
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  filterCountText: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
  },
  cards: { gap: 12 },
  card: {
    borderWidth: 1,
    backgroundColor: "rgba(14,12,9,0.6)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  urgencyBadge: {
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  urgencyLabel: {
    fontSize: 8,
    fontFamily: "Inter_500Medium",
    letterSpacing: 1,
  },
  categoryText: {
    fontSize: 9,
    fontFamily: "Inter_300Light",
    letterSpacing: 0.5,
  },
  cardBody: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  iconBox: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  cardText: { flex: 1 },
  cardTitle: {
    fontSize: 14,
    fontFamily: "CormorantGaramond_400Regular",
    lineHeight: 19,
    marginBottom: 6,
  },
  cardSummary: {
    fontSize: 11,
    fontFamily: "Inter_300Light",
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  actionText: {
    flex: 1,
    fontSize: 10,
    fontFamily: "Inter_300Light",
    lineHeight: 14,
    fontStyle: "italic",
  },
  actBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actBtnText: {
    fontSize: 8,
    fontFamily: "Inter_500Medium",
    letterSpacing: 1.5,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 12,
    fontFamily: "Inter_300Light",
    textAlign: "center",
    maxWidth: 240,
    lineHeight: 18,
  },
  footer: {
    borderWidth: 1,
    padding: 16,
    marginTop: 24,
    alignItems: "flex-start",
  },
  footerText: {
    fontSize: 11,
    fontFamily: "Inter_300Light",
    lineHeight: 16,
  },
});
