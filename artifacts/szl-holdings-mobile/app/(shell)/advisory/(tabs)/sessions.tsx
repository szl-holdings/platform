import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { formatDate as formatSharedDate } from "@szl-holdings/mobile-shared/utils";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSyncEngine } from "@szl-holdings/mobile-shared";
import { useColors } from "@/hooks/useColors";

const API_URL = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

const TIME_SLOTS = [
  "9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM",
];

const SERVICES = [
  { id: "residence-operations", title: "Residence Operations" },
  { id: "property-coordination", title: "Property Coordination" },
  { id: "household-systems", title: "Household Systems" },
  { id: "vendor-management", title: "Vendor Management" },
  { id: "lifestyle-admin", title: "Lifestyle & Admin" },
  { id: "special-projects", title: "Special Projects" },
];

function getNextBusinessDays(): string[] {
  const days: string[] = [];
  const d = new Date();
  d.setDate(d.getDate() + 3);
  while (days.length < 14) {
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      days.push(d.toISOString().split("T")[0]);
    }
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function formatDate(dateStr: string): { day: string; date: string; month: string } {
  const d = new Date(dateStr + "T12:00:00");
  return {
    day: formatSharedDate(d, {
      locale: "en-GB",
      intlOptions: { weekday: "short" },
    }).toUpperCase(),
    date: formatSharedDate(d, {
      locale: "en-GB",
      intlOptions: { day: "numeric" },
    }),
    month: formatSharedDate(d, {
      locale: "en-GB",
      intlOptions: { month: "short" },
    }).toUpperCase(),
  };
}

type SessionItem = {
  id: number;
  title: string;
  date: string;
  time: string;
  location?: string;
  status: string;
};

const UPCOMING_SESSIONS: SessionItem[] = [
  {
    id: 1,
    title: "Q2 Review Session",
    date: "Apr 7, 2026",
    time: "10:00 AM",
    location: "London",
    status: "Confirmed",
  },
  {
    id: 2,
    title: "Oxfordshire Property Walkthrough",
    date: "Apr 21, 2026",
    time: "2:00 PM",
    location: "Oxfordshire",
    status: "Pending confirmation",
  },
];

export default function SessionsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const apiBase = process.env.EXPO_PUBLIC_DOMAIN
    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
    : "/api";

  const syncEngine = useSyncEngine();

  const { data: sessions = UPCOMING_SESSIONS } = useQuery<SessionItem[]>({
    queryKey: ["carlota-sessions"],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/carlota-jo/booking/reservations`);
      if (!res.ok) return UPCOMING_SESSIONS;
      const json = await res.json();
      const rows: SessionItem[] = json.data ?? [];
      return rows.length > 0 ? rows : UPCOMING_SESSIONS;
    },
    initialData: UPCOMING_SESSIONS,
    staleTime: 30_000,
  });

  const bookSession = useMutation({
    mutationFn: async ({ service, date, time }: { service: string; date: string; time: string }) => {
      const url = `${apiBase}/carlota-jo/booking/reservations`;
      const idempotencyKey = `carlota-booking-${service}-${date}-${time}`;

      if (!syncEngine.isOnline) {
        await syncEngine.enqueue({
          domain: "carlota-jo",
          method: "POST",
          url,
          body: { service, date, time, clientName: "Client" },
          idempotencyKey,
        });
        return { queued: true };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Idempotency-Key": idempotencyKey },
        body: JSON.stringify({ service, date, time, clientName: "Client" }),
      });
      if (!res.ok) throw new Error("Booking failed");
      return res.json();
    },
    onMutate: async ({ service, date, time }) => {
      await qc.cancelQueries({ queryKey: ["carlota-sessions"] });
      const prev = qc.getQueryData<SessionItem[]>(["carlota-sessions"]);
      const optimistic: SessionItem = {
        id: Date.now(),
        title: service.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        date,
        time,
        status: "Pending confirmation",
      };
      qc.setQueryData<SessionItem[]>(["carlota-sessions"], (old) => [
        ...(old ?? []),
        optimistic,
      ]);
      return { prev };
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Session Requested",
        `Your consultation request has been submitted.\n\nRosa will confirm within 24 hours.`,
        [{ text: "Done", onPress: () => {
          setSelectedDate("");
          setSelectedTime("");
          setSelectedService("");
        }}]
      );
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev !== undefined) {
        qc.setQueryData<SessionItem[]>(["carlota-sessions"], ctx.prev);
      }
      Alert.alert("Error", "Unable to submit. Please try again.");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["carlota-sessions"] }),
  });

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : 90;

  const days = getNextBusinessDays();

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setRefreshing(false);
  }, []);

  const handleBookSession = () => {
    if (!selectedDate || !selectedTime || !selectedService) {
      Alert.alert("Incomplete", "Please select a service, date, and time.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    bookSession.mutate({ service: selectedService, date: selectedDate, time: selectedTime });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["rgba(200,169,106,0.05)", "transparent"]}
        style={[styles.headerGradient, { height: topPad + 80 }]}
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
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
        <Text style={[styles.eyebrow, { color: colors.goldSubtle }]}>
          SESSION BOOKING
        </Text>
        <Text style={[styles.title, { color: colors.cream }]}>
          Schedule a{"\n"}Consultation
        </Text>

        {sessions.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.goldSubtle }]}>
              UPCOMING
            </Text>
            {sessions.map((session) => (
              <Pressable key={session.id}>
                <View
                  style={[styles.sessionCard, { borderColor: colors.goldBorder }]}
                >
                  <View style={styles.sessionHeader}>
                    <Text style={[styles.sessionTitle, { color: colors.cream }]}>
                      {session.title}
                    </Text>
                    <View
                      style={[
                        styles.sessionBadge,
                        {
                          backgroundColor:
                            session.status === "Confirmed"
                              ? "rgba(200,169,106,0.12)"
                              : "transparent",
                          borderColor:
                            session.status === "Confirmed"
                              ? colors.goldBorder
                              : "rgba(245,240,232,0.08)",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.sessionBadgeText,
                          {
                            color:
                              session.status === "Confirmed"
                                ? colors.gold
                                : colors.mutedForeground,
                          },
                        ]}
                      >
                        {session.status}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.sessionMeta}>
                    <Feather name="calendar" size={11} color={colors.goldSubtle} />
                    <Text style={[styles.sessionMetaText, { color: colors.creamDim }]}>
                      {session.date}
                    </Text>
                    <Feather name="clock" size={11} color={colors.goldSubtle} style={{ marginLeft: 12 }} />
                    <Text style={[styles.sessionMetaText, { color: colors.creamDim }]}>
                      {session.time}
                    </Text>
                    <Feather name="map-pin" size={11} color={colors.goldSubtle} style={{ marginLeft: 12 }} />
                    <Text style={[styles.sessionMetaText, { color: colors.creamDim }]}>
                      {session.location}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        <View style={[styles.section, { borderTopColor: colors.creamFaint }]}>
          <Text style={[styles.sectionLabel, { color: colors.goldSubtle }]}>
            SERVICE AREA
          </Text>
          <View style={styles.serviceGrid}>
            {SERVICES.map((svc) => (
              <Pressable
                key={svc.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedService(svc.id);
                }}
              >
                <View
                  style={[
                    styles.serviceChip,
                    {
                      borderColor:
                        selectedService === svc.id
                          ? colors.gold
                          : colors.creamFaint,
                      backgroundColor:
                        selectedService === svc.id
                          ? colors.goldDim
                          : "transparent",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.serviceChipText,
                      {
                        color:
                          selectedService === svc.id
                            ? colors.gold
                            : colors.creamDim,
                      },
                    ]}
                  >
                    {svc.title}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.section, { borderTopColor: colors.creamFaint }]}>
          <Text style={[styles.sectionLabel, { color: colors.goldSubtle }]}>
            PREFERRED DATE
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.dateRow}>
              {days.map((d) => {
                const { day, date, month } = formatDate(d);
                const isSelected = selectedDate === d;
                return (
                  <Pressable
                    key={d}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedDate(d);
                    }}
                  >
                    <View
                      style={[
                        styles.dateCell,
                        {
                          borderColor: isSelected ? colors.gold : colors.creamFaint,
                          backgroundColor: isSelected ? colors.goldDim : "transparent",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dateCellDay,
                          { color: isSelected ? colors.gold : colors.mutedForeground },
                        ]}
                      >
                        {day}
                      </Text>
                      <Text
                        style={[
                          styles.dateCellNum,
                          { color: isSelected ? colors.cream : colors.creamDim },
                        ]}
                      >
                        {date}
                      </Text>
                      <Text
                        style={[
                          styles.dateCellMonth,
                          { color: isSelected ? colors.gold : colors.mutedForeground },
                        ]}
                      >
                        {month}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        <View style={[styles.section, { borderTopColor: colors.creamFaint }]}>
          <Text style={[styles.sectionLabel, { color: colors.goldSubtle }]}>
            PREFERRED TIME (ET)
          </Text>
          <View style={styles.timeGrid}>
            {TIME_SLOTS.map((t) => (
              <Pressable
                key={t}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedTime(t);
                }}
              >
                <View
                  style={[
                    styles.timeChip,
                    {
                      borderColor:
                        selectedTime === t ? colors.gold : colors.creamFaint,
                      backgroundColor:
                        selectedTime === t ? colors.goldDim : "transparent",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.timeChipText,
                      {
                        color: selectedTime === t ? colors.gold : colors.creamDim,
                      },
                    ]}
                  >
                    {t}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable
          onPress={handleBookSession}
          disabled={bookSession.isPending || !selectedDate || !selectedTime || !selectedService}
          style={({ pressed }) => [
            styles.submitBtn,
            {
              backgroundColor:
                selectedDate && selectedTime && selectedService
                  ? colors.gold
                  : "rgba(200,169,106,0.2)",
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          {bookSession.isPending ? (
            <ActivityIndicator color={colors.inkDeep} size="small" />
          ) : (
            <Text
              style={[
                styles.submitBtnText,
                {
                  color:
                    selectedDate && selectedTime && selectedService
                      ? colors.inkDeep
                      : colors.goldSubtle,
                },
              ]}
            >
              REQUEST SESSION
            </Text>
          )}
        </Pressable>

        <View style={styles.disclaimer}>
          <Feather name="shield" size={11} color={colors.mutedForeground} />
          <Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>
            Rosa will confirm within 24 hours. All sessions are handled with complete confidentiality.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { position: "absolute", top: 0, left: 0, right: 0 },
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
    marginBottom: 28,
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
    marginBottom: 14,
  },
  sessionCard: {
    borderWidth: 1,
    padding: 16,
    marginBottom: 8,
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  sessionTitle: {
    fontSize: 14,
    fontFamily: "Inter_300Light",
    flex: 1,
    marginRight: 12,
  },
  sessionBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sessionBadgeText: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    letterSpacing: 1,
  },
  sessionMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  sessionMetaText: {
    fontSize: 11,
    fontFamily: "Inter_300Light",
  },
  serviceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  serviceChip: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  serviceChipText: {
    fontSize: 11,
    fontFamily: "Inter_300Light",
    letterSpacing: 0.3,
  },
  dateRow: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 4,
  },
  dateCell: {
    borderWidth: 1,
    width: 56,
    paddingVertical: 10,
    alignItems: "center",
    gap: 2,
  },
  dateCellDay: {
    fontSize: 8,
    fontFamily: "Inter_500Medium",
    letterSpacing: 1,
  },
  dateCellNum: {
    fontSize: 18,
    fontFamily: "CormorantGaramond_400Regular",
  },
  dateCellMonth: {
    fontSize: 8,
    fontFamily: "Inter_500Medium",
    letterSpacing: 1,
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  timeChip: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  timeChipText: {
    fontSize: 12,
    fontFamily: "Inter_300Light",
  },
  submitBtn: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  submitBtnText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 3,
  },
  disclaimer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 11,
    fontFamily: "Inter_300Light",
    flex: 1,
    lineHeight: 16,
  },
});
