import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useCallback } from "react";
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LYTE_COLORS } from "@/constants/colors";

interface EvidenceItem {
  source: string;
  type: string;
  weight: number;
  detail: string;
}

interface Receipt {
  id: string;
  priority: string;
  severity: string;
  rank: number;
  finalScore: number;
  pack: string;
  packColor: string;
  summary: string;
  actionability: number;
  ownerConfidence: number;
  evidenceStrength: number;
  evidence: EvidenceItem[];
  confidence: string;
  confidenceReason: string;
}

const RECEIPTS: Receipt[] = [
  {
    id: "RCP-001",
    priority: "Authorize fuel surcharge — 3 vessels blocked",
    severity: "critical",
    rank: 1,
    finalScore: 96,
    pack: "Vessels",
    packColor: "#38bdf8",
    summary: "Ranked #1: owner clear, action unambiguous, SLA breach in 4h with $2.1M exposure. 3 correlated signals and historical delay pattern confirmed.",
    actionability: 95,
    ownerConfidence: 90,
    evidenceStrength: 88,
    evidence: [
      { source: "Vessels Fleet Signal", type: "signal", weight: 0.35, detail: "3 vessels outside SLA — surcharge pending 22h" },
      { source: "Finance Queue Monitor", type: "signal", weight: 0.25, detail: "VP approval queue age: 22h, avg resolution 6h" },
      { source: "Historical Pattern", type: "historical", weight: 0.25, detail: "Same chain stalled 4x in 6 months — escalate to CFO" },
      { source: "SLA Engine", type: "external", weight: 0.15, detail: "94% probability of breach within 4h" },
    ],
    confidence: "high",
    confidenceReason: "Owner identified, action clear, time pressure confirmed",
  },
  {
    id: "RCP-002",
    priority: "Approve Q2 pricing revision — board deadline",
    severity: "critical",
    rank: 2,
    finalScore: 89,
    pack: "PRISM",
    packColor: "#d4a054",
    summary: "Ranked #2: owner identified (CEO), action clear, but 17h window gives more runway than vessel SLA breach. Pricing window model and board calendar confirmed.",
    actionability: 90,
    ownerConfidence: 85,
    evidenceStrength: 82,
    evidence: [
      { source: "PRISM Approval Queue", type: "signal", weight: 0.30, detail: "Q2 pricing 31h in queue — CEO calendar blocked" },
      { source: "Revenue Model", type: "pattern", weight: 0.25, detail: "Pricing window closes at midnight — 17h from now" },
      { source: "Historical Pattern", type: "historical", weight: 0.25, detail: "Calendar conflicts resolved via EA escalation previously" },
      { source: "Board Calendar", type: "external", weight: 0.20, detail: "Board distribution deadline confirmed: T+48h" },
    ],
    confidence: "high",
    confidenceReason: "Owner confirmed, deadline modeled, resolution path known",
  },
  {
    id: "RCP-003",
    priority: "Resolve AR ownership conflict — payments withheld",
    severity: "high",
    rank: 3,
    finalScore: 78,
    pack: "PRISM",
    packColor: "#d4a054",
    summary: "Ranked #3: resolution is straightforward (single assignment) but requires COO involvement and has no hard deadline. Ownership contested reduces actionability slightly.",
    actionability: 75,
    ownerConfidence: 60,
    evidenceStrength: 80,
    evidence: [
      { source: "Finance Reconciliation Engine", type: "signal", weight: 0.40, detail: "Duplicate ownership claim — 2 leads on same AR account" },
      { source: "Payments Queue", type: "signal", weight: 0.30, detail: "$650K withheld pending resolution — 18h hold" },
      { source: "Org Chart Engine", type: "pattern", weight: 0.30, detail: "3 contested accounts created by restructuring 6w ago" },
    ],
    confidence: "medium",
    confidenceReason: "Gap identified but resolution requires COO confirmation — contested ownership reduces confidence",
  },
];

const SEV_COLORS: Record<string, string> = {
  critical: LYTE_COLORS.critical,
  high: LYTE_COLORS.high,
  medium: LYTE_COLORS.medium,
  low: LYTE_COLORS.low,
};

const EVIDENCE_COLORS: Record<string, string> = {
  signal: "#38bdf8",
  pattern: "#8b7ac8",
  historical: LYTE_COLORS.medium,
  external: LYTE_COLORS.neonGreen,
};

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={barStyles.row}>
      <Text style={barStyles.label}>{label}</Text>
      <View style={barStyles.track}>
        <View style={[barStyles.fill, { width: `${value}%` as `${number}%`, backgroundColor: color }]} />
      </View>
      <Text style={[barStyles.value, { color }]}>{value}</Text>
    </View>
  );
}

const barStyles = StyleSheet.create({
  row: { marginBottom: 8 },
  label: { fontSize: 9, fontFamily: "Inter_400Regular", color: LYTE_COLORS.textMuted, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  track: { height: 4, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden", marginBottom: 2 },
  fill: { height: "100%", borderRadius: 2 },
  value: { fontSize: 9, fontFamily: "Inter_500Medium" },
});

function ReceiptCard({ receipt }: { receipt: Receipt }) {
  const [expanded, setExpanded] = useState(false);
  const sevColor = SEV_COLORS[receipt.severity] ?? LYTE_COLORS.medium;
  const confColor = receipt.confidence === "high" ? LYTE_COLORS.neonGreen : receipt.confidence === "medium" ? LYTE_COLORS.high : LYTE_COLORS.critical;

  return (
    <Pressable onPress={() => { Haptics.selectionAsync(); setExpanded(e => !e); }}>
      <View style={[styles.card, { borderColor: expanded ? `${sevColor}30` : LYTE_COLORS.border }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.rankBox, { backgroundColor: `${sevColor}12` }]}>
            <Text style={[styles.rankText, { color: sevColor }]}>#{receipt.rank}</Text>
          </View>
          <View style={styles.cardMain}>
            <View style={styles.cardMeta}>
              <View style={[styles.packBadge, { backgroundColor: `${receipt.packColor}18` }]}>
                <Text style={[styles.packText, { color: receipt.packColor }]}>{receipt.pack}</Text>
              </View>
              <View style={[styles.sevBadge, { backgroundColor: `${sevColor}12` }]}>
                <Text style={[styles.sevText, { color: sevColor }]}>{receipt.severity}</Text>
              </View>
              <Text style={styles.idText}>{receipt.id}</Text>
            </View>
            <Text style={styles.priorityText} numberOfLines={expanded ? undefined : 2}>{receipt.priority}</Text>
          </View>
          <View style={styles.cardRight}>
            <Text style={[styles.scoreText, { color: LYTE_COLORS.medium }]}>{receipt.finalScore}</Text>
            <Text style={styles.scoreMax}>/100</Text>
            <View style={[styles.confDot, { backgroundColor: confColor }]} />
            <Feather name={expanded ? "chevron-up" : "chevron-down"} size={12} color={LYTE_COLORS.textTertiary} />
          </View>
        </View>

        {expanded && (
          <View style={styles.cardDetail}>
            <Text style={styles.summaryText}>{receipt.summary}</Text>

            <View style={styles.scoreSection}>
              <Text style={styles.sectionLabel}>Scoring Factors</Text>
              <ScoreBar label="Actionability" value={receipt.actionability} color={LYTE_COLORS.medium} />
              <ScoreBar label="Owner Confidence" value={receipt.ownerConfidence} color="#8b7ac8" />
              <ScoreBar label="Evidence Strength" value={receipt.evidenceStrength} color="#38bdf8" />
            </View>

            <View style={styles.evidenceSection}>
              <Text style={styles.sectionLabel}>Evidence Used</Text>
              {receipt.evidence.map((ev, i) => (
                <View key={i} style={styles.evidenceItem}>
                  <View style={[styles.evDot, { backgroundColor: EVIDENCE_COLORS[ev.type] ?? "#fff" }]} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <Text style={styles.evSource}>{ev.source}</Text>
                      <View style={[styles.evTypeBadge, { backgroundColor: `${EVIDENCE_COLORS[ev.type] ?? "#fff"}14` }]}>
                        <Text style={[styles.evType, { color: EVIDENCE_COLORS[ev.type] ?? LYTE_COLORS.textMuted }]}>{ev.type}</Text>
                      </View>
                    </View>
                    <Text style={styles.evDetail}>{ev.detail}</Text>
                  </View>
                  <Text style={styles.evWeight}>{Math.round(ev.weight * 100)}%</Text>
                </View>
              ))}
            </View>

            <View style={styles.confSection}>
              <View style={[styles.confDot, { backgroundColor: confColor }]} />
              <Text style={[styles.confText, { color: confColor }]}>{receipt.confidence} confidence</Text>
              <Text style={styles.confReason}> — {receipt.confidenceReason}</Text>
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function ReceiptsScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : 90;

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 800));
    setRefreshing(false);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: LYTE_COLORS.background }]}>
      <LinearGradient
        colors={["rgba(139,122,200,0.06)", "transparent"]}
        style={[styles.headerGradient, { height: topPad + 120 }]}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: bottomPad, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b7ac8" />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>DECISION RECEIPTS</Text>
            <Text style={styles.headerTitle}>Why This Ranked</Text>
            <Text style={styles.headerSub}>Evidence, weights, and alternatives for every priority</Text>
          </View>
        </View>

        <View style={styles.explainer}>
          <Feather name="file-text" size={14} color={LYTE_COLORS.textTertiary} />
          <Text style={styles.explainerText}>
            Every ranked priority has a receipt. Receipts show scoring factors, evidence sources and weights, and the alternatives that were rejected.
          </Text>
        </View>

        <View style={styles.cardList}>
          {RECEIPTS.map(r => (
            <ReceiptCard key={r.id} receipt={r} />
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
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 },
  eyebrow: { fontSize: 9, fontFamily: "Inter_500Medium", letterSpacing: 3, color: "#8b7ac8", marginBottom: 4 },
  headerTitle: { fontSize: 26, fontFamily: "Inter_600SemiBold", color: LYTE_COLORS.textPrimary, marginBottom: 2 },
  headerSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: LYTE_COLORS.textSecondary },
  explainer: { backgroundColor: LYTE_COLORS.surfaceElevated, borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: LYTE_COLORS.border, flexDirection: "row", gap: 10, alignItems: "flex-start" },
  explainerText: { flex: 1, fontSize: 10, fontFamily: "Inter_400Regular", color: LYTE_COLORS.textTertiary, lineHeight: 16 },
  cardList: { gap: 10 },
  card: { borderRadius: 12, borderWidth: 1, backgroundColor: LYTE_COLORS.surface, overflow: "hidden" },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", padding: 14, gap: 10 },
  rankBox: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  rankText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  cardMain: { flex: 1, gap: 6 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  packBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  packText: { fontSize: 8, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5, textTransform: "uppercase" },
  sevBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  sevText: { fontSize: 8, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 },
  idText: { fontSize: 8, fontFamily: "Inter_400Regular", color: LYTE_COLORS.textMuted },
  priorityText: { fontSize: 12, fontFamily: "Inter_500Medium", color: LYTE_COLORS.textPrimary, lineHeight: 17 },
  cardRight: { alignItems: "flex-end", gap: 3 },
  scoreText: { fontSize: 16, fontFamily: "Inter_700Bold", fontVariant: ["tabular-nums"] },
  scoreMax: { fontSize: 8, fontFamily: "Inter_400Regular", color: LYTE_COLORS.textMuted },
  confDot: { width: 6, height: 6, borderRadius: 3 },
  cardDetail: { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: LYTE_COLORS.border, paddingTop: 12, gap: 16 },
  summaryText: { fontSize: 11, fontFamily: "Inter_400Regular", color: LYTE_COLORS.textSecondary, lineHeight: 17 },
  scoreSection: { backgroundColor: LYTE_COLORS.surfaceElevated, borderRadius: 10, padding: 12 },
  sectionLabel: { fontSize: 8, fontFamily: "Inter_500Medium", color: LYTE_COLORS.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  evidenceSection: { gap: 8 },
  evidenceItem: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: LYTE_COLORS.surfaceElevated, borderRadius: 8, padding: 10 },
  evDot: { width: 6, height: 6, borderRadius: 3, marginTop: 4, flexShrink: 0 },
  evSource: { fontSize: 10, fontFamily: "Inter_500Medium", color: LYTE_COLORS.textPrimary },
  evTypeBadge: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  evType: { fontSize: 8, fontFamily: "Inter_400Regular", textTransform: "capitalize" },
  evDetail: { fontSize: 9, fontFamily: "Inter_400Regular", color: LYTE_COLORS.textSecondary, lineHeight: 14 },
  evWeight: { fontSize: 9, fontFamily: "Inter_500Medium", color: LYTE_COLORS.textMuted, flexShrink: 0 },
  confSection: { flexDirection: "row", alignItems: "center", gap: 6 },
  confText: { fontSize: 10, fontFamily: "Inter_500Medium", textTransform: "capitalize" },
  confReason: { fontSize: 10, fontFamily: "Inter_400Regular", color: LYTE_COLORS.textSecondary, flex: 1 },
});
