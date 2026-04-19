import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons, Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { apiGet, apiPut } from "@/lib/apiClient";

interface Finding {
  id: number;
  title: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  status: "open" | "confirmed" | "mitigated" | "accepted" | "false_positive";
  affectedAsset?: string;
  description?: string;
  recommendation?: string;
  cvssScore?: number;
  cveId?: string;
}

async function fetchFindings(): Promise<Finding[]> {
  return apiGet<Finding[]>("/api/aegis/findings");
}

async function updateFinding(id: number, data: Partial<Finding>): Promise<Finding> {
  return apiPut<Finding>(`/api/aegis/findings/${id}`, data);
}

const SEVERITY_COLORS: Record<Finding["severity"], string> = {
  critical: "#EF4444",
  high: "#F97316",
  medium: "#F59E0B",
  low: "#3B82F6",
  info: "#8B5CF6",
};

const STATUS_LABELS: Record<Finding["status"], string> = {
  open: "Open",
  confirmed: "Confirmed",
  mitigated: "Mitigated",
  accepted: "Accepted",
  false_positive: "False Positive",
};

const STATUS_COLORS: Record<Finding["status"], string> = {
  open: "#EF4444",
  confirmed: "#F59E0B",
  mitigated: "#10B981",
  accepted: "#3B82F6",
  false_positive: "#6B7280",
};

type SeverityFilter = "all" | Finding["severity"];
type StatusFilter = "all" | Finding["status"];

export default function FindingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [refreshing, setRefreshing] = useState(false);

  const { data: findings = [], refetch, isLoading } = useQuery<Finding[]>({
    queryKey: ["aegis-findings"],
    queryFn: fetchFindings,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Finding> }) => updateFinding(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aegis-findings"] }),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const filtered = findings.filter((f) => {
    const matchSearch = !search ||
      f.title?.toLowerCase().includes(search.toLowerCase()) ||
      f.affectedAsset?.toLowerCase().includes(search.toLowerCase());
    const matchSev = severityFilter === "all" || f.severity === severityFilter;
    const matchStatus = statusFilter === "all" || f.status === statusFilter;
    return matchSearch && matchSev && matchStatus;
  });

  const critCount = findings.filter((f) => f.severity === "critical").length;
  const openCount = findings.filter((f) => f.status === "open").length;

  const topInsets = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomInsets = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  const severities: SeverityFilter[] = ["all", "critical", "high", "medium", "low"];
  const statuses: StatusFilter[] = ["all", "open", "confirmed", "mitigated", "accepted"];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInsets + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "SpaceGrotesk_700Bold" }]}>Findings</Text>
        <View style={styles.headerStats}>
          {critCount > 0 && (
            <View style={[styles.statChip, { backgroundColor: colors.redDim, borderColor: colors.redBorder }]}>
              <Text style={[styles.statText, { color: colors.red }]}>{critCount} Critical</Text>
            </View>
          )}
          <View style={[styles.statChip, { backgroundColor: colors.amberDim, borderColor: colors.amberBorder }]}>
            <Text style={[styles.statText, { color: colors.amber }]}>{openCount} Open</Text>
          </View>
        </View>
      </View>

      <View style={[styles.searchBar, { backgroundColor: colors.navyLight, borderColor: colors.border }]}>
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
          placeholder="Search findings, assets..."
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterRow}>
        {severities.map((sev) => {
          const active = severityFilter === sev;
          const sevColor = sev === "all" ? colors.amber : SEVERITY_COLORS[sev];
          return (
            <TouchableOpacity
              key={sev}
              style={[styles.filterChip, { backgroundColor: active ? `${sevColor}20` : colors.navyLight, borderColor: active ? `${sevColor}50` : colors.border }]}
              onPress={() => setSeverityFilter(sev)}
            >
              <Text style={[styles.filterText, { color: active ? sevColor : colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                {sev.charAt(0).toUpperCase() + sev.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.filterRow}>
        {statuses.map((st) => {
          const active = statusFilter === st;
          const stColor = st === "all" ? colors.amber : STATUS_COLORS[st];
          return (
            <TouchableOpacity
              key={st}
              style={[styles.filterChip, { backgroundColor: active ? `${stColor}18` : colors.navyLight, borderColor: active ? `${stColor}40` : colors.border }]}
              onPress={() => setStatusFilter(st)}
            >
              <Text style={[styles.filterText, { color: active ? stColor : colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                {st === "all" ? "All" : STATUS_LABELS[st]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.amber} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: bottomInsets + 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.amber} />}
          ListEmptyComponent={
            <View style={[styles.empty, { borderColor: colors.border }]}>
              <Feather name="check-circle" size={32} color={colors.emerald} />
              <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>No findings found</Text>
            </View>
          }
          renderItem={({ item: finding }) => {
            const sevColor = SEVERITY_COLORS[finding.severity] ?? colors.mutedForeground;
            const stColor = STATUS_COLORS[finding.status] ?? colors.mutedForeground;
            const isCrit = finding.severity === "critical" && finding.status === "open";

            return (
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.findingCard, { backgroundColor: colors.navyLight, borderColor: isCrit ? colors.redBorder : colors.border }]}
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push(`/finding/${ finding.id }` as any);
                }}
              >
                <View style={[styles.sevBar, { backgroundColor: sevColor }]} />
                <View style={{ flex: 1, paddingLeft: 12, paddingVertical: 12 }}>
                  <View style={styles.cardTop}>
                    <View style={[styles.sevBadge, { backgroundColor: `${sevColor}18` }]}>
                      <Text style={[styles.sevBadgeText, { color: sevColor }]}>{finding.severity?.toUpperCase()}</Text>
                    </View>
                    <View style={[styles.stBadge, { backgroundColor: `${stColor}18` }]}>
                      <Text style={[styles.stBadgeText, { color: stColor }]}>{STATUS_LABELS[finding.status] ?? finding.status}</Text>
                    </View>
                    {finding.cveId && (
                      <View style={[styles.cveBadge, { backgroundColor: colors.accent }]}>
                        <Text style={[styles.cveText, { color: colors.amber }]}>{finding.cveId}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.findingTitle, { color: colors.foreground, fontFamily: "Inter_500Medium" }]} numberOfLines={2}>
                    {finding.title}
                  </Text>
                  {finding.affectedAsset && (
                    <View style={styles.assetRow}>
                      <Feather name="server" size={10} color={colors.mutedForeground} />
                      <Text style={[styles.assetText, { color: colors.mutedForeground }]}>{finding.affectedAsset}</Text>
                    </View>
                  )}
                  {finding.cvssScore != null && (
                    <Text style={[styles.cvssText, { color: finding.cvssScore >= 9 ? colors.red : finding.cvssScore >= 7 ? "#F97316" : colors.mutedForeground }]}>
                      CVSS {Number(finding.cvssScore).toFixed(1)}
                    </Text>
                  )}
                </View>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} style={{ alignSelf: "center", marginRight: 12 }} />
              </TouchableOpacity>
            );
          }}
        />
      )}
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
  headerStats: { flexDirection: "row", gap: 8, alignItems: "center" },
  statChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  statText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 10, margin: 16, marginBottom: 0, padding: 12, borderRadius: 10, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 14 },
  filterRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingTop: 10, flexWrap: "wrap" },
  filterChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 11 },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  findingCard: { flexDirection: "row", borderRadius: 12, borderWidth: 1, marginBottom: 8, overflow: "hidden" },
  sevBar: { width: 3, minHeight: 64 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 5 },
  sevBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  sevBadgeText: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5 },
  stBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  stBadgeText: { fontSize: 9, fontWeight: "600" },
  cveBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  cveText: { fontSize: 9, fontFamily: "Inter_500Medium" },
  findingTitle: { fontSize: 13, lineHeight: 19 },
  assetRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  assetText: { fontSize: 10, fontFamily: "Inter_400Regular" },
  cvssText: { fontSize: 10, marginTop: 4, fontFamily: "Inter_500Medium" },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 48, borderRadius: 12, borderWidth: 1, borderStyle: "dashed", gap: 8 },
  emptyTitle: { fontSize: 14 },
});
