import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
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
type EventKind = "confirmed" | "predicted" | "maintenance" | "travel" | "seasonal" | "review";

type CalEvent = {
  id: string;
  date: string;
  title: string;
  kind: EventKind;
  location?: string;
  duration?: string;
  notes: string;
};

const kindConfig: Record<EventKind, { label: string; color: string; icon: FeatherName }> = {
  confirmed: { label: "Confirmed", color: "rgba(200,169,106,1)", icon: "star" },
  predicted: { label: "Predicted", color: "rgba(139,92,246,0.85)", icon: "circle" },
  maintenance: { label: "Maintenance", color: "rgba(245,158,11,0.85)", icon: "tool" },
  travel: { label: "Travel", color: "rgba(6,182,212,0.85)", icon: "navigation" },
  seasonal: { label: "Seasonal", color: "rgba(16,185,129,0.8)", icon: "home" },
  review: { label: "Review", color: "rgba(200,169,106,1)", icon: "users" },
};

const events: CalEvent[] = [
  {
    id: "e1",
    date: "2026-04-07",
    title: "Q2 Review Session",
    kind: "review",
    location: "London, Mayfair",
    duration: "2 hours",
    notes: "Quarterly engagement review with Rosa. Focus: Q2 priorities and summer transition plan.",
  },
  {
    id: "e2",
    date: "2026-04-14",
    title: "Oxfordshire opening inspection",
    kind: "predicted",
    location: "Oxfordshire Estate",
    duration: "Half day",
    notes: "Anticipated based on 2-year pattern. Anticipation Engine flagged — not yet confirmed.",
  },
  {
    id: "e3",
    date: "2026-04-21",
    title: "Oxfordshire Property Walkthrough",
    kind: "confirmed",
    location: "Oxfordshire",
    duration: "Full day",
    notes: "On-site visit confirmed. Rosa + property team. Vendor reviews included.",
  },
  {
    id: "e4",
    date: "2026-05-04",
    title: "Seasonal transition: Oxfordshire opens",
    kind: "seasonal",
    location: "Oxfordshire Estate",
    notes: "Historical pattern: estate opens first week of May. Staff transition and seasonal prep.",
  },
  {
    id: "e5",
    date: "2026-06-08",
    title: "New York travel",
    kind: "travel",
    location: "New York — The Carlyle",
    duration: "5–7 days",
    notes: "Historical June pattern. Predicted. Suite pre-hold recommended.",
  },
  {
    id: "e6",
    date: "2026-07-06",
    title: "Q3 Review Session",
    kind: "review",
    location: "London, Mayfair",
    duration: "2 hours",
    notes: "Quarterly review — predicted based on prior patterns.",
  },
  {
    id: "e7",
    date: "2026-09-08",
    title: "Heating service — Mayfair",
    kind: "maintenance",
    location: "Mayfair Residence",
    notes: "Annual boiler + heating service. Book early — 4–6 week lead time.",
  },
  {
    id: "e8",
    date: "2026-09-28",
    title: "Seasonal transition: Oxfordshire closes",
    kind: "seasonal",
    location: "Oxfordshire Estate",
    notes: "Historical pattern: estate closes late September. Winterisation, caretaker handover.",
  },
  {
    id: "e9",
    date: "2026-10-05",
    title: "Q4 Review Session",
    kind: "review",
    location: "London, Mayfair",
    duration: "2 hours",
    notes: "Quarterly review — predicted.",
  },
  {
    id: "e10",
    date: "2026-11-15",
    title: "Monaco travel — predicted",
    kind: "travel",
    location: "Monaco",
    duration: "4–5 days",
    notes: "Historical November pattern observed in 2024 and 2025.",
  },
  {
    id: "e11",
    date: "2026-12-14",
    title: "Festive staffing uplift",
    kind: "seasonal",
    location: "Oxfordshire Estate",
    notes: "Family gathering. Elevated staffing, additional catering. 2-week window before Christmas.",
  },
  {
    id: "e12",
    date: "2026-12-20",
    title: "Festive period — Oxfordshire",
    kind: "seasonal",
    location: "Oxfordshire Estate",
    notes: "Annual: client and family at Oxfordshire for Christmas and New Year.",
  },
];

function formatDate(ds: string): string {
  const d = new Date(ds + "T12:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function formatMonth(ds: string): string {
  const d = new Date(ds + "T12:00:00");
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function groupByMonth(evs: CalEvent[]): { month: string; events: CalEvent[] }[] {
  const map = new Map<string, CalEvent[]>();
  for (const ev of evs) {
    const key = formatMonth(ev.date);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(ev);
  }
  return Array.from(map.entries()).map(([month, evts]) => ({ month, events: evts }));
}

function EventCard({
  event,
  onPress,
  selected,
}: {
  event: CalEvent;
  onPress: (e: CalEvent) => void;
  selected: boolean;
}) {
  const colors = useColors();
  const cfg = kindConfig[event.kind];

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress(event);
      }}
    >
      <View
        style={[
          styles.eventCard,
          {
            borderColor: selected ? cfg.color + "60" : "rgba(244,237,224,0.07)",
            backgroundColor: selected
              ? cfg.color.replace("1)", "0.06)").replace("0.85)", "0.06)").replace("0.8)", "0.06)")
              : "rgba(14,12,9,0.5)",
          },
        ]}
      >
        <View style={styles.eventLeft}>
          <View
            style={[
              styles.kindDot,
              { backgroundColor: cfg.color },
            ]}
          />
          <View style={styles.eventMeta}>
            <View style={styles.eventMetaTop}>
              <Text style={[styles.kindLabel, { color: cfg.color }]}>
                {cfg.label.toUpperCase()}
              </Text>
              {event.kind === "predicted" && (
                <Text style={[styles.predictedTag, { color: "rgba(139,92,246,0.6)" }]}>
                  · PREDICTED
                </Text>
              )}
            </View>
            <Text style={[styles.eventTitle, { color: colors.cream }]} numberOfLines={2}>
              {event.title}
            </Text>
            <View style={styles.eventDateRow}>
              <Feather name="calendar" size={10} color={colors.mutedForeground} />
              <Text style={[styles.eventDate, { color: colors.mutedForeground }]}>
                {formatDate(event.date)}
              </Text>
              {event.location && (
                <>
                  <Text style={{ color: "rgba(244,237,224,0.12)", fontSize: 10 }}>·</Text>
                  <Feather name="map-pin" size={10} color={colors.mutedForeground} />
                  <Text
                    style={[styles.eventDate, { color: colors.mutedForeground }]}
                    numberOfLines={1}
                  >
                    {event.location}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>
        <Feather name="chevron-right" size={13} color="rgba(244,237,224,0.15)" />
      </View>
    </Pressable>
  );
}

function EventDetail({ event, onClose }: { event: CalEvent; onClose: () => void }) {
  const colors = useColors();
  const cfg = kindConfig[event.kind];

  return (
    <View
      style={[
        styles.detailPanel,
        {
          borderColor: colors.goldBorder,
          backgroundColor: "rgba(14,12,9,0.95)",
        },
      ]}
    >
      <View style={styles.detailHeader}>
        <View style={styles.detailHeaderLeft}>
          <Feather name={cfg.icon} size={13} color={cfg.color} />
          <Text style={[styles.detailKind, { color: cfg.color }]}>{cfg.label}</Text>
          {event.kind === "predicted" && (
            <Text style={{ fontSize: 8, color: "rgba(139,92,246,0.6)", fontFamily: "Inter_500Medium", letterSpacing: 1 }}>PREDICTED</Text>
          )}
        </View>
        <Pressable onPress={onClose} hitSlop={8}>
          <Feather name="x" size={15} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <Text style={[styles.detailTitle, { color: colors.cream }]}>{event.title}</Text>

      <View style={styles.detailMetaRow}>
        <Feather name="calendar" size={11} color={colors.mutedForeground} />
        <Text style={[styles.detailMetaText, { color: colors.creamDim }]}>
          {formatDate(event.date)}
        </Text>
      </View>
      {event.location && (
        <View style={styles.detailMetaRow}>
          <Feather name="map-pin" size={11} color={colors.mutedForeground} />
          <Text style={[styles.detailMetaText, { color: colors.creamDim }]}>{event.location}</Text>
        </View>
      )}
      {event.duration && (
        <View style={styles.detailMetaRow}>
          <Feather name="clock" size={11} color={colors.mutedForeground} />
          <Text style={[styles.detailMetaText, { color: colors.creamDim }]}>{event.duration}</Text>
        </View>
      )}

      <View style={[styles.detailNotes, { borderColor: "rgba(244,237,224,0.07)" }]}>
        <Text style={[styles.detailNotesText, { color: colors.creamDim }]}>{event.notes}</Text>
      </View>
    </View>
  );
}

const FILTER_OPTIONS: { id: EventKind | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "confirmed", label: "Confirmed" },
  { id: "predicted", label: "Predicted" },
  { id: "travel", label: "Travel" },
  { id: "maintenance", label: "Maintenance" },
  { id: "seasonal", label: "Seasonal" },
];

export default function RhythmScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<CalEvent | null>(null);
  const [filter, setFilter] = useState<EventKind | "all">("all");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : 90;

  const _now = new Date();
  const today = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, "0")}-${String(_now.getDate()).padStart(2, "0")}`;

  const upcoming = events
    .filter((e) => e.date >= today && (filter === "all" || e.kind === filter))
    .sort((a, b) => a.date.localeCompare(b.date));

  const grouped = groupByMonth(upcoming);

  const handleSelect = (ev: CalEvent) => {
    setSelected((prev) => (prev?.id === ev.id ? null : ev));
  };

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
          HOUSEHOLD RHYTHM
        </Text>
        <Text style={[styles.title, { color: colors.cream }]}>
          The year{"\n"}ahead
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Confirmed bookings and predicted events — seasonal transitions, travel, maintenance, and reviews.
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={styles.filterRowContent}
        >
          {FILTER_OPTIONS.map((f) => {
            const cfg = f.id !== "all" ? kindConfig[f.id as EventKind] : null;
            const isActive = filter === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  setFilter(f.id);
                  setSelected(null);
                }}
              >
                <View
                  style={[
                    styles.filterChip,
                    {
                      borderColor: isActive
                        ? cfg?.color ?? colors.gold
                        : "rgba(244,237,224,0.08)",
                      backgroundColor: isActive
                        ? (cfg?.color ?? colors.gold) + "12"
                        : "transparent",
                    },
                  ]}
                >
                  {cfg && (
                    <View
                      style={[
                        styles.filterDot,
                        { backgroundColor: cfg.color },
                      ]}
                    />
                  )}
                  <Text
                    style={[
                      styles.filterLabel,
                      {
                        color: isActive
                          ? cfg?.color ?? colors.gold
                          : colors.mutedForeground,
                      },
                    ]}
                  >
                    {f.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {selected && (
          <EventDetail event={selected} onClose={() => setSelected(null)} />
        )}

        {grouped.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="calendar" size={24} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No upcoming events for this filter.
            </Text>
          </View>
        ) : (
          grouped.map(({ month, events: monthEvents }) => (
            <View key={month} style={styles.monthGroup}>
              <Text style={[styles.monthLabel, { color: colors.goldSubtle }]}>
                {month.toUpperCase()}
              </Text>
              {monthEvents.map((ev) => (
                <EventCard
                  key={ev.id}
                  event={ev}
                  onPress={handleSelect}
                  selected={selected?.id === ev.id}
                />
              ))}
            </View>
          ))
        )}

        <View style={styles.legend}>
          <Text style={[styles.legendTitle, { color: colors.mutedForeground }]}>
            LEGEND
          </Text>
          <View style={styles.legendItems}>
            {(Object.entries(kindConfig) as [EventKind, typeof kindConfig[EventKind]][]).map(
              ([kind, cfg]) => (
                <View key={kind} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: cfg.color }]} />
                  <Text style={[styles.legendLabel, { color: colors.mutedForeground }]}>
                    {cfg.label}
                  </Text>
                </View>
              )
            )}
          </View>
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
  filterDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  filterLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.5,
  },
  detailPanel: {
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailKind: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  detailTitle: {
    fontSize: 18,
    fontFamily: "CormorantGaramond_400Regular",
    lineHeight: 24,
    marginBottom: 12,
  },
  detailMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  detailMetaText: {
    fontSize: 11,
    fontFamily: "Inter_300Light",
  },
  detailNotes: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 8,
  },
  detailNotesText: {
    fontSize: 11,
    fontFamily: "Inter_300Light",
    lineHeight: 17,
  },
  monthGroup: {
    marginBottom: 24,
  },
  monthLabel: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    letterSpacing: 3,
    marginBottom: 10,
  },
  eventCard: {
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 6,
  },
  eventLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  kindDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  eventMeta: { flex: 1 },
  eventMetaTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 3,
  },
  kindLabel: {
    fontSize: 8,
    fontFamily: "Inter_500Medium",
    letterSpacing: 1.2,
  },
  predictedTag: {
    fontSize: 8,
    fontFamily: "Inter_500Medium",
    letterSpacing: 1,
  },
  eventTitle: {
    fontSize: 13,
    fontFamily: "Inter_300Light",
    lineHeight: 18,
    marginBottom: 5,
  },
  eventDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  eventDate: {
    fontSize: 10,
    fontFamily: "Inter_300Light",
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
  },
  legend: {
    marginTop: 8,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(244,237,224,0.07)",
  },
  legendTitle: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    letterSpacing: 3,
    marginBottom: 10,
  },
  legendItems: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 10,
    fontFamily: "Inter_300Light",
  },
});
