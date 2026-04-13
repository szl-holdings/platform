import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Platform,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { apiGet, graphqlRequest } from "@/lib/apiClient";

interface MitreDetection {
  techniqueId: string;
  detectionCount: number;
  incidentCount: number;
  coverageStatus: "detected" | "partial" | "not_covered";
  lastDetectedAt?: string;
}

async function fetchMitreDetections(): Promise<MitreDetection[]> {
  try {
    return await apiGet<MitreDetection[]>("/api/firestorm/mitre-detections");
  } catch (err) {
    console.warn("[MITRE] Failed to fetch detections:", err);
    return [];
  }
}

const TACTICS = [
  { id: "TA0001", name: "Initial Access", short: "Init", techniques: ["T1566.001", "T1190", "T1133", "T1078"] },
  { id: "TA0002", name: "Execution", short: "Exec", techniques: ["T1059.001", "T1059.003", "T1204", "T1053"] },
  { id: "TA0003", name: "Persistence", short: "Persist", techniques: ["T1547", "T1136", "T1505.003", "T1078"] },
  { id: "TA0004", name: "Privilege Esc.", short: "PrivEsc", techniques: ["T1548", "T1134", "T1055", "T1611"] },
  { id: "TA0005", name: "Defense Evasion", short: "Evasion", techniques: ["T1070", "T1036", "T1027", "T1562"] },
  { id: "TA0006", name: "Credential Access", short: "Creds", techniques: ["T1003.001", "T1110.001", "T1555"] },
  { id: "TA0007", name: "Discovery", short: "Discov", techniques: ["T1087", "T1082", "T1046", "T1083"] },
  { id: "TA0008", name: "Lateral Movement", short: "Lateral", techniques: ["T1021.002", "T1550", "T1570"] },
  { id: "TA0010", name: "Exfiltration", short: "Exfil", techniques: ["T1041", "T1048.001", "T1567.002"] },
  { id: "TA0040", name: "Impact", short: "Impact", techniques: ["T1486", "T1485", "T1490", "T1489"] },
];

const TECH_NAMES: Record<string, string> = {
  "T1566.001": "Spearphishing",
  "T1190": "Exploit Pub App",
  "T1133": "External Svc",
  "T1078": "Valid Accounts",
  "T1059.001": "PowerShell",
  "T1059.003": "Cmd Shell",
  "T1204": "User Execution",
  "T1053": "Sched. Task",
  "T1547": "Boot Autostart",
  "T1136": "Create Account",
  "T1505.003": "Web Shell",
  "T1548": "Abuse Elevation",
  "T1134": "Access Token",
  "T1055": "Proc. Injection",
  "T1611": "Container Esc.",
  "T1070": "Indicator Rem.",
  "T1036": "Masquerading",
  "T1027": "Obfuscated",
  "T1562": "Impair Defenses",
  "T1003.001": "LSASS Memory",
  "T1110.001": "Pwd Guessing",
  "T1555": "Cred Stores",
  "T1087": "Account Disc.",
  "T1082": "System Info",
  "T1046": "Net Scan",
  "T1083": "File Disc.",
  "T1021.002": "SMB Shares",
  "T1550": "Alt Auth",
  "T1570": "Lateral Tool",
  "T1041": "Exfil C2",
  "T1048.001": "Exfil DNS",
  "T1567.002": "Exfil Cloud",
  "T1486": "Ransomware",
  "T1485": "Data Destruct.",
  "T1490": "Inhibit Recovery",
  "T1489": "Service Stop",
};

function getHeatColor(count: number, max: number): string {
  if (count === 0) return "rgba(255,255,255,0.04)";
  const ratio = count / max;
  if (ratio >= 0.7) return "rgba(239,68,68,0.85)";
  if (ratio >= 0.4) return "rgba(249,115,22,0.65)";
  if (ratio >= 0.2) return "rgba(245,158,11,0.55)";
  return "rgba(245,158,11,0.25)";
}

function getHeatTextColor(count: number, max: number): string {
  if (count === 0) return "rgba(232,234,240,0.2)";
  return "#FFFFFF";
}

interface RelatedIncident {
  id: string;
  title: string;
  severity: string | null;
  status: string | null;
  detectedAt: string | null;
}

const SEVERITY_COLORS_MITRE: Record<string, string> = {
  critical: "#EF4444",
  high: "#F97316",
  medium: "#F59E0B",
  low: "#3B82F6",
};

const GQL_RELATED_INCIDENTS = `
  query RelatedIncidents($limit: Int) {
    firestormIncidents(limit: $limit) {
      id
      title
      severity
      status
      detectedAt
    }
  }
`;

async function fetchRelatedIncidents(techniqueId: string): Promise<RelatedIncident[]> {
  try {
    const data = await graphqlRequest<{ firestormIncidents: RelatedIncident[] }>(
      GQL_RELATED_INCIDENTS,
      { limit: 50 },
    );
    return (data.firestormIncidents ?? []).filter(
      (inc) => {
        const titleLower = (inc.title ?? "").toLowerCase();
        const techLower = techniqueId.toLowerCase();
        const techName = (TECH_NAMES[techniqueId] ?? "").toLowerCase();
        return titleLower.includes(techLower) || (techName && titleLower.includes(techName.split(" ")[0] ?? ""));
      },
    );
  } catch (err) {
    console.warn("[MITRE] Failed to load related incidents:", err);
    return [];
  }
}

export default function MitreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selectedTech, setSelectedTech] = useState<{ id: string; name: string; tactic: string; detection: MitreDetection | null } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { data: detections = [], isLoading, refetch } = useQuery<MitreDetection[]>({
    queryKey: ["aegis-mitre-detections"],
    queryFn: fetchMitreDetections,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const { data: relatedIncidents = [], isLoading: loadingRelated } = useQuery<RelatedIncident[]>({
    queryKey: ["aegis-mitre-related", selectedTech?.id],
    queryFn: () => fetchRelatedIncidents(selectedTech!.id),
    enabled: !!selectedTech,
  });

  const detMap = new Map<string, MitreDetection>();
  detections.forEach((d) => detMap.set(d.techniqueId, d));

  const maxCount = Math.max(...detections.map((d) => d.detectionCount ?? 0), 1);

  const totalTechs = TACTICS.reduce((s, t) => s + t.techniques.length, 0);
  const covered = TACTICS.reduce((s, t) => s + t.techniques.filter((id) => {
    const d = detMap.get(id);
    return d && d.coverageStatus !== "not_covered";
  }).length, 0);
  const coveragePct = Math.round((covered / totalTechs) * 100);

  const topInsets = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomInsets = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInsets + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "SpaceGrotesk_700Bold" }]}>MITRE ATT&CK</Text>
        <View style={[styles.coverageChip, { backgroundColor: colors.emeraldDim, borderColor: "rgba(16,185,129,0.25)" }]}>
          <Text style={[styles.coverageText, { color: colors.emerald }]}>{coveragePct}% Coverage</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.amber} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: bottomInsets + 100 }}
          showsVerticalScrollIndicator={false}
          horizontal={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          <View style={styles.statsRow}>
            {[
              { label: "Coverage", value: `${coveragePct}%`, color: colors.emerald },
              { label: "Covered", value: covered, color: colors.blue },
              { label: "Gaps", value: totalTechs - covered, color: colors.red },
            ].map((stat) => (
              <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.navyLight, borderColor: colors.border }]}>
                <Text style={[styles.statValue, { color: stat.color, fontFamily: "SpaceGrotesk_700Bold" }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{stat.label}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.heatmapLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
            DETECTION HEATMAP — TAP TO DRILL DOWN
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {TACTICS.map((tactic) => (
                <View key={tactic.id} style={{ width: 70 }}>
                  <Text style={[styles.tacticLabel, { color: colors.red, fontFamily: "Inter_500Medium" }]} numberOfLines={1}>
                    {tactic.short}
                  </Text>
                  {tactic.techniques.map((techId) => {
                    const det = detMap.get(techId);
                    const count = det?.detectionCount ?? 0;
                    const bg = getHeatColor(count, maxCount);
                    const tc = getHeatTextColor(count, maxCount);
                    return (
                      <TouchableOpacity
                        key={techId}
                        style={[styles.heatCell, { backgroundColor: bg }]}
                        onPress={() => setSelectedTech({ id: techId, name: TECH_NAMES[techId] ?? techId, tactic: tactic.name, detection: det ?? null })}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.heatTechName, { color: tc }]} numberOfLines={1}>
                          {TECH_NAMES[techId] ?? techId}
                        </Text>
                        <Text style={[styles.heatCount, { color: tc, opacity: count === 0 ? 0.3 : 1 }]}>{count}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={[styles.legend, { borderColor: colors.border }]}>
            {[
              { label: "High Volume", color: "rgba(239,68,68,0.85)" },
              { label: "Medium", color: "rgba(249,115,22,0.65)" },
              { label: "Low", color: "rgba(245,158,11,0.35)" },
              { label: "No Coverage", color: "rgba(255,255,255,0.04)" },
            ].map((l) => (
              <View key={l.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                <Text style={[styles.legendText, { color: colors.mutedForeground }]}>{l.label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      <Modal
        visible={!!selectedTech}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedTech(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedTech(null)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.modalContent, { backgroundColor: colors.navyLight, borderColor: colors.border }]}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTactic, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  {selectedTech?.tactic}
                </Text>
                <Text style={[styles.modalTechId, { color: colors.amber, fontFamily: "Inter_500Medium" }]}>
                  {selectedTech?.id}
                </Text>
                <Text style={[styles.modalTechName, { color: colors.foreground, fontFamily: "SpaceGrotesk_600SemiBold" }]}>
                  {selectedTech?.name}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedTech(null)} style={[styles.closeBtn, { backgroundColor: colors.border }]}>
                <Ionicons name="close" size={18} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalStats}>
              <View style={[styles.modalStat, { backgroundColor: colors.redDim }]}>
                <Text style={[styles.modalStatValue, { color: colors.red, fontFamily: "SpaceGrotesk_700Bold" }]}>
                  {selectedTech?.detection?.detectionCount ?? 0}
                </Text>
                <Text style={[styles.modalStatLabel, { color: colors.mutedForeground }]}>Detections</Text>
              </View>
              <View style={[styles.modalStat, { backgroundColor: colors.amberDim }]}>
                <Text style={[styles.modalStatValue, { color: colors.amber, fontFamily: "SpaceGrotesk_700Bold" }]}>
                  {selectedTech?.detection?.incidentCount ?? 0}
                </Text>
                <Text style={[styles.modalStatLabel, { color: colors.mutedForeground }]}>Incidents</Text>
              </View>
              <View style={[styles.modalStat, { backgroundColor: colors.blueDim }]}>
                <Text style={[styles.modalStatValue, { color: selectedTech?.detection?.coverageStatus === "detected" ? colors.emerald : colors.red, fontFamily: "SpaceGrotesk_700Bold" }]}>
                  {selectedTech?.detection?.coverageStatus === "detected" ? "Full" : selectedTech?.detection?.coverageStatus === "partial" ? "Part" : "None"}
                </Text>
                <Text style={[styles.modalStatLabel, { color: colors.mutedForeground }]}>Coverage</Text>
              </View>
            </View>

            {!selectedTech?.detection && (
              <View style={[styles.gapAlert, { backgroundColor: colors.redDim, borderColor: colors.redBorder }]}>
                <Ionicons name="warning" size={14} color={colors.red} />
                <Text style={[styles.gapText, { color: colors.red }]}>No active detection — coverage gap identified</Text>
              </View>
            )}

            {selectedTech?.detection?.lastDetectedAt && (
              <Text style={[styles.lastDetected, { color: colors.mutedForeground }]}>
                Last detected: {new Date(selectedTech.detection.lastDetectedAt).toLocaleString()}
              </Text>
            )}

            <View style={[styles.relatedHeader, { borderTopColor: colors.border }]}>
              <Text style={[styles.relatedTitle, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                RELATED INCIDENTS
              </Text>
              {loadingRelated && <ActivityIndicator size="small" color={colors.amber} />}
            </View>

            {!loadingRelated && relatedIncidents.length === 0 && (
              <Text style={[styles.noRelated, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                No linked incidents found for this technique
              </Text>
            )}

            {relatedIncidents.slice(0, 5).map((inc) => {
              const sevColor = SEVERITY_COLORS_MITRE[inc.severity ?? ""] ?? colors.mutedForeground;
              return (
                <TouchableOpacity
                  key={inc.id}
                  style={[styles.relatedRow, { backgroundColor: colors.navySurface, borderColor: colors.border }]}
                  onPress={() => {
                    setSelectedTech(null);
                    router.push(`/incident/${inc.id}`);
                  }}
                >
                  <View style={[styles.relatedSevDot, { backgroundColor: sevColor }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.relatedIncTitle, { color: colors.foreground, fontFamily: "Inter_500Medium" }]} numberOfLines={1}>
                      {inc.title}
                    </Text>
                    <Text style={[styles.relatedIncMeta, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      {inc.status ?? "—"} · {inc.detectedAt ? new Date(inc.detectedAt).toLocaleDateString() : "—"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
              );
            })}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22 },
  coverageChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  coverageText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statCard: { flex: 1, alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1 },
  statValue: { fontSize: 22 },
  statLabel: { fontSize: 10, marginTop: 2 },
  heatmapLabel: { fontSize: 9, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 },
  tacticLabel: { fontSize: 8, textAlign: "center", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4, paddingHorizontal: 2 },
  heatCell: {
    borderRadius: 4,
    padding: 4,
    marginBottom: 4,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  heatTechName: { fontSize: 7, textAlign: "center", lineHeight: 10 },
  heatCount: { fontSize: 11, fontWeight: "700", marginTop: 2, fontFamily: "SpaceGrotesk_600SemiBold" },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 16, paddingTop: 12, borderTopWidth: 1 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 12, height: 8, borderRadius: 3 },
  legendText: { fontSize: 10, fontFamily: "Inter_400Regular" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 24 },
  modalContent: { borderRadius: 16, borderWidth: 1, padding: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  modalTactic: { fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 },
  modalTechId: { fontSize: 12, marginBottom: 4 },
  modalTechName: { fontSize: 18 },
  closeBtn: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  modalStats: { flexDirection: "row", gap: 10, marginBottom: 16 },
  modalStat: { flex: 1, alignItems: "center", padding: 12, borderRadius: 10 },
  modalStatValue: { fontSize: 22 },
  modalStatLabel: { fontSize: 10, marginTop: 2, fontFamily: "Inter_400Regular" },
  gapAlert: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 8, borderWidth: 1, marginBottom: 8 },
  gapText: { fontSize: 11, flex: 1, fontFamily: "Inter_400Regular" },
  lastDetected: { fontSize: 11, marginTop: 4, fontFamily: "Inter_400Regular" },
  relatedHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16, paddingTop: 12, borderTopWidth: 1, marginBottom: 8 },
  relatedTitle: { fontSize: 9, letterSpacing: 2, textTransform: "uppercase" },
  noRelated: { fontSize: 11, textAlign: "center", paddingVertical: 8 },
  relatedRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 8, borderWidth: 1, marginBottom: 6 },
  relatedSevDot: { width: 8, height: 8, borderRadius: 4 },
  relatedIncTitle: { fontSize: 13, marginBottom: 2 },
  relatedIncMeta: { fontSize: 10 },
});
