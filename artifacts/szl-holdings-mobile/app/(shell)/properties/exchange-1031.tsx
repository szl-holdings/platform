import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? "https://" + process.env.EXPO_PUBLIC_DOMAIN + "/api"
  : "/api";

const ACCENT = "#10b981";

interface ExchangeDeadline {
  label: string;
  date: string;
  daysRemaining: number;
  status: "on-track" | "warning" | "critical" | "passed";
}

interface ReplacementCandidate {
  id: string;
  address: string;
  listPrice: number;
  capRate: number;
  status: "identified" | "under-loi" | "in-diligence" | "closed";
}

interface Exchange1031 {
  id: string;
  name: string;
  relinquishedProperty: string;
  salePrice: number;
  bootAmount: number;
  deferredGain: number;
  qualifiedIntermediary: string;
  exchangeDate: string;
  deadlines: ExchangeDeadline[];
  replacementCandidates: ReplacementCandidate[];
}

const STATUS_COLORS: Record<ReplacementCandidate["status"], string> = {
  identified: "#60a5fa",
  "under-loi": "#fbbf24",
  "in-diligence": ACCENT,
  closed: "#34d399",
};

const DEADLINE_COLORS: Record<ExchangeDeadline["status"], string> = {
  "on-track": "#34d399",
  warning: "#fbbf24",
  critical: "#ef4444",
  passed: "rgba(255,255,255,0.25)",
};

const fmt = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;

const EXCHANGES: Exchange1031[] = [
  {
    id: "ex-1",
    name: "Dallas Industrial Sale",
    relinquishedProperty: "Northpark Distribution · Dallas, TX",
    salePrice: 11_400_000,
    bootAmount: 0,
    deferredGain: 4_200_000,
    qualifiedIntermediary: "First Exchange Corp",
    exchangeDate: "Mar 15, 2026",
    deadlines: [
      { label: "45-Day ID Deadline", date: "Apr 29, 2026", daysRemaining: 12, status: "warning" },
      { label: "180-Day Close Deadline", date: "Sep 11, 2026", daysRemaining: 147, status: "on-track" },
    ],
    replacementCandidates: [
      { id: "r1", address: "4200 Commerce Dr, Phoenix, AZ", listPrice: 8_900_000, capRate: 6.8, status: "in-diligence" },
      { id: "r2", address: "1550 Industrial Pkwy, Denver, CO", listPrice: 5_600_000, capRate: 7.1, status: "under-loi" },
      { id: "r3", address: "7800 Port Blvd, Tampa, FL", listPrice: 12_200_000, capRate: 6.2, status: "identified" },
    ],
  },
];

export default function Exchange1031Screen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  useQuery({
    queryKey: ["terra-1031-exchange"],
    queryFn: async () => {
      try {
        const res = await fetch(API_BASE + "/terra/1031-exchange");
        if (!res.ok) return null;
        return res.json();
      } catch { return null; }
    },
    retry: 1,
  });

  const exchange = EXCHANGES[0];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["rgba(16,185,129,0.07)", "transparent"]}
        style={[styles.headerGradient, { height: topPad + 100 }]}
      />

      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={18} color={colors.cream} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: ACCENT + "cc" }]}>TERRA · TAX</Text>
          <Text style={[styles.title, { color: colors.cream }]}>1031 Exchange</Text>
        </View>
        <View style={[styles.urgentBadge, { backgroundColor: "#fbbf24" + "15", borderColor: "#fbbf24" + "40" }]}>
          <Feather name="clock" size={11} color="#fbbf24" />
          <Text style={[styles.urgentText, { color: "#fbbf24" }]}>12d left</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.exchangeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.exchangeName, { color: colors.cream }]}>{exchange.name}</Text>
          <Text style={[styles.exchangeProp, { color: colors.mutedForeground }]}>{exchange.relinquishedProperty}</Text>
          <View style={styles.exchangeMetrics}>
            {[
              { label: "Sale Price", value: fmt(exchange.salePrice), color: colors.cream },
              { label: "Deferred Gain", value: fmt(exchange.deferredGain), color: ACCENT },
              { label: "Boot", value: exchange.bootAmount === 0 ? "None" : fmt(exchange.bootAmount), color: exchange.bootAmount === 0 ? "#34d399" : "#ef4444" },
            ].map((m, i) => (
              <View key={i} style={styles.exchMet}>
                <Text style={[styles.exchMetVal, { color: m.color }]}>{m.value}</Text>
                <Text style={[styles.exchMetLbl, { color: colors.mutedForeground }]}>{m.label}</Text>
              </View>
            ))}
          </View>
          <View style={[styles.qiRow, { borderTopColor: colors.border }]}>
            <Feather name="shield" size={11} color={colors.mutedForeground} />
            <Text style={[styles.qiText, { color: colors.mutedForeground }]}>QI: {exchange.qualifiedIntermediary} · Exchange: {exchange.exchangeDate}</Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>IRS DEADLINES</Text>

        {exchange.deadlines.map((d, i) => {
          const col = DEADLINE_COLORS[d.status];
          return (
            <View key={i} style={[styles.deadlineCard, { backgroundColor: colors.surface, borderColor: col + "30", borderLeftColor: col, borderLeftWidth: 3 }]}>
              <View style={styles.deadlineTop}>
                <Text style={[styles.deadlineLabel, { color: colors.cream }]}>{d.label}</Text>
                <View style={[styles.daysBadge, { backgroundColor: col + "15" }]}>
                  <Text style={[styles.daysText, { color: col }]}>{d.daysRemaining}d</Text>
                </View>
              </View>
              <Text style={[styles.deadlineDate, { color: colors.mutedForeground }]}>{d.date}</Text>
            </View>
          );
        })}

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>REPLACEMENT PROPERTIES</Text>

        {exchange.replacementCandidates.map(cand => {
          const col = STATUS_COLORS[cand.status];
          return (
            <View key={cand.id} style={[styles.candCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.candStatusDot, { backgroundColor: col }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.candAddress, { color: colors.cream }]}>{cand.address}</Text>
                <Text style={[styles.candMeta, { color: colors.mutedForeground }]}>{fmt(cand.listPrice)} · {cand.capRate}% cap</Text>
              </View>
              <View style={[styles.candStatus, { backgroundColor: col + "15", borderColor: col + "30" }]}>
                <Text style={[styles.candStatusText, { color: col }]}>{cand.status}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { position: "absolute", top: 0, left: 0, right: 0 },
  header: { paddingHorizontal: 16, paddingBottom: 12, flexDirection: "row", alignItems: "flex-start", gap: 10 },
  backBtn: { padding: 4, marginTop: 14 },
  eyebrow: { fontSize: 9, fontFamily: "Inter_500Medium", letterSpacing: 3, marginBottom: 3 },
  title: { fontSize: 20, fontFamily: "Inter_600SemiBold", letterSpacing: -0.3 },
  urgentBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, borderWidth: 1, marginTop: 14 },
  urgentText: { fontSize: 10, fontFamily: "Inter_500Medium" },
  exchangeCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 20 },
  exchangeName: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
  exchangeProp: { fontSize: 11, fontFamily: "Inter_300Light", marginBottom: 12 },
  exchangeMetrics: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  exchMet: { flex: 1, alignItems: "center" },
  exchMetVal: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  exchMetLbl: { fontSize: 9, fontFamily: "Inter_300Light", letterSpacing: 0.5 },
  qiRow: { flexDirection: "row", alignItems: "center", gap: 6, borderTopWidth: 1, paddingTop: 10 },
  qiText: { fontSize: 10, fontFamily: "Inter_300Light" },
  sectionLabel: { fontSize: 9, fontFamily: "Inter_500Medium", letterSpacing: 2, marginBottom: 10, marginTop: 4 },
  deadlineCard: { borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 8 },
  deadlineTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  deadlineLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  daysBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  daysText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  deadlineDate: { fontSize: 10, fontFamily: "Inter_300Light" },
  candCard: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 8 },
  candStatusDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  candAddress: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 2 },
  candMeta: { fontSize: 10, fontFamily: "Inter_300Light" },
  candStatus: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  candStatusText: { fontSize: 9, fontFamily: "Inter_500Medium" },
});
