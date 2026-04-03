import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, RelativePathString } from "expo-router";
import Svg, { Path, Circle } from "react-native-svg";
import { useColors } from "@/hooks/useColors";

const VENTURES = [
  {
    id: "aegis",
    name: "Aegis",
    subtitle: "Defense & Intelligence Command",
    accentColor: "#6366f1",
    status: "live",
    kpi: "$25M+ ARR",
    market: "$266B TAM",
    metrics: [
      { label: "Simulations", value: "31,200+" },
      { label: "ATT&CK Coverage", value: "200+" },
      { label: "Enterprise Clients", value: "3" },
    ],
    trend: [62, 68, 71, 73, 75, 78, 80],
    strategicNotes: "Flagship enterprise security platform. FedRAMP certification targeted Q3 2026. Federal sector expansion underway.",
  },
  {
    id: "vessels",
    name: "Vessels",
    subtitle: "Maritime Intelligence",
    accentColor: "#3b82f6",
    status: "live",
    kpi: "$8.2M ARR",
    market: "$15.4B TAM",
    metrics: [
      { label: "Vessels Monitored", value: "52,000+" },
      { label: "Shipping Lanes", value: "340+" },
      { label: "Dark Vessel Detections", value: "34d lead" },
    ],
    trend: [50, 55, 58, 63, 68, 72, 75],
    strategicNotes: "Maritime domain awareness for commodity traders and compliance teams. Climate routing overlay coming Q3 2026.",
  },
  {
    id: "terra",
    name: "Terra",
    subtitle: "Real Estate Intelligence",
    accentColor: "#4d7c0f",
    status: "live",
    kpi: "$3.1M ARR",
    market: "$29B TAM",
    metrics: [
      { label: "Enterprise Clients", value: "34" },
      { label: "Assets Under Analysis", value: "$4.2B+" },
      { label: "Market", value: "$29B" },
    ],
    trend: [30, 38, 44, 52, 58, 63, 70],
    strategicNotes: "NYC beachhead for distress property intelligence. Expanding to national coverage. API launch Q4 2026.",
  },
  {
    id: "lyte",
    name: "Lyte",
    subtitle: "Business Observability",
    accentColor: "#f59e0b",
    status: "live",
    kpi: "$4.2M ARR",
    market: "$1.8T TAM",
    metrics: [
      { label: "Signal Detection", value: "< 4 min" },
      { label: "Signals/Day", value: "2.4M+" },
      { label: "Playbooks", value: "120+" },
    ],
    trend: [40, 48, 52, 58, 62, 67, 72],
    strategicNotes: "Core observability layer for the SZL ecosystem. AI-native anomaly forecast launching Q2 2026.",
  },
  {
    id: "alloy",
    name: "Alloy",
    subtitle: "Execution Fabric",
    accentColor: "#8b5cf6",
    status: "live",
    kpi: "$5.1M ARR (embedded)",
    market: "$14.8B TAM",
    metrics: [
      { label: "Automations/Day", value: "48K+" },
      { label: "Avg Latency", value: "< 200ms" },
      { label: "Prediction Models", value: "12,400+" },
    ],
    trend: [45, 52, 58, 64, 70, 74, 79],
    strategicNotes: "The backbone of the SZL platform stack. Scenario Model Library public launch Q2 2026.",
  },
  {
    id: "carlota-jo",
    name: "Carlota Jo",
    subtitle: "Private Advisory",
    accentColor: "#f472b6",
    status: "beta",
    kpi: "Private Alpha",
    market: "$8.4B TAM",
    metrics: [
      { label: "Retention Rate", value: "100%" },
      { label: "Active Clients", value: "8" },
      { label: "Avg Response SLA", value: "< 2h" },
    ],
    trend: [60, 65, 68, 72, 76, 80, 85],
    strategicNotes: "White-glove lifestyle management for UHNW principals. Family office partnership program expanding Q2 2026.",
  },
];

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const H = 28;
  const W = 56;
  const step = W / (data.length - 1);

  const points = data.map((v, i) => ({
    x: i * step,
    y: H - ((v - min) / range) * H,
  }));

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");

  return (
    <View style={{ width: W, height: H }}>
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Path d={path} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="2.5" fill={color} />
      </Svg>
    </View>
  );
}

function VentureCard({ venture, onPress }: { venture: typeof VENTURES[0]; onPress: () => void }) {
  const colors = useColors();
  const isLive = venture.status === "live";

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.ventureCard,
            {
              backgroundColor: colors.card,
              borderColor: pressed ? `${venture.accentColor}30` : colors.borderSubtle,
              opacity: pressed ? 0.92 : 1,
            },
          ]}
        >
          <View style={styles.cardTop}>
            <View style={styles.cardLeft}>
              <View style={styles.nameRow}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: isLive ? "#10b981" : "#f59e0b",
                    },
                  ]}
                />
                <Text style={[styles.ventureName, { color: colors.cream }]}>
                  {venture.name}
                </Text>
              </View>
              <Text style={[styles.ventureSubtitle, { color: colors.mutedForeground }]}>
                {venture.subtitle}
              </Text>
            </View>
            <View style={styles.cardRight}>
              <Sparkline data={venture.trend} color={venture.accentColor} />
            </View>
          </View>

          <View style={styles.metricsRow}>
            {venture.metrics.slice(0, 3).map((m) => (
              <View key={m.label} style={styles.metricItem}>
                <Text style={[styles.metricValue, { color: venture.accentColor }]}>
                  {m.value}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>
                  {m.label}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.cardFooter}>
            <Text style={[styles.kpiText, { color: colors.gold }]}>{venture.kpi}</Text>
            <View style={styles.cardArrow}>
              <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
            </View>
          </View>
        </View>
      )}
    </Pressable>
  );
}

export default function PortfolioScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : 90;

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 800));
    setRefreshing(false);
  }, []);

  const totalArr = "$35M+";
  const liveCount = VENTURES.filter((v) => v.status === "live").length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["rgba(201,168,76,0.05)", "transparent"]}
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
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: colors.goldSubtle }]}>
            PORTFOLIO
          </Text>
          <Text style={[styles.title, { color: colors.cream }]}>
            Venture Overview
          </Text>
          <View style={styles.headerStats}>
            <View style={styles.headerStat}>
              <Text style={[styles.statValue, { color: colors.gold }]}>{totalArr}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Portfolio ARR</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.borderSubtle }]} />
            <View style={styles.headerStat}>
              <Text style={[styles.statValue, { color: "#10b981" }]}>{liveCount}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Platforms Live</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.borderSubtle }]} />
            <View style={styles.headerStat}>
              <Text style={[styles.statValue, { color: colors.cream }]}>$2.4B+</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Total TAM</Text>
            </View>
          </View>
        </View>

        <View style={{ gap: 12 }}>
          {VENTURES.map((v) => (
            <VentureCard
              key={v.id}
              venture={v}
              onPress={() => router.push(`/portfolio/${v.id}` as RelativePathString)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { position: "absolute", top: 0, left: 0, right: 0 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  header: { marginBottom: 20 },
  eyebrow: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    letterSpacing: 3,
    marginBottom: 6,
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_300Light",
    marginBottom: 16,
  },
  headerStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerStat: { alignItems: "center" },
  statValue: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 9,
    fontFamily: "Inter_300Light",
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  ventureCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  cardLeft: { flex: 1, gap: 4 },
  cardRight: { paddingTop: 2 },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  ventureName: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  ventureSubtitle: {
    fontSize: 11,
    fontFamily: "Inter_300Light",
    letterSpacing: 0.3,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 0,
  },
  metricItem: {
    flex: 1,
    gap: 2,
  },
  metricValue: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  metricLabel: {
    fontSize: 9,
    fontFamily: "Inter_300Light",
    letterSpacing: 0.3,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  kpiText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  cardArrow: {
    opacity: 0.5,
  },
});
