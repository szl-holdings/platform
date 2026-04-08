import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { apiGet } from "@/lib/apiClient";

interface Incident {
  id: number;
  title: string;
  severity: string;
  status: string;
  assignedAnalyst?: string;
  description?: string;
  createdAt?: string;
}

const MOCK_INCIDENTS: Incident[] = [
  { id: 1001, title: "APT29 Lateral Movement — Finance Subnet", severity: "critical", status: "open", assignedAnalyst: "J. Chen", description: "Nation-state actor TTPs detected via UEBA correlation. C2 traffic confirmed on WKST-0041 and WKST-0044.", createdAt: "2025-04-04T09:00:00Z" },
  { id: 1002, title: "Ransomware Deployment — Sacsayhuamán", severity: "critical", status: "contained", assignedAnalyst: "L. Kim", description: "LockBit 3.0 across 12 endpoints. 40% file encryption. Backup under review.", createdAt: "2025-04-02T02:14:00Z" },
  { id: 1003, title: "Privilege Escalation via CVE-2024-21447", severity: "high", status: "mitigated", assignedAnalyst: "M. Walsh", description: "Print spooler exploit escalated to SYSTEM. Patched and isolated.", createdAt: "2025-04-01T11:00:00Z" },
];

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#f59e0b",
  low: "#3b82f6",
};

const STATUS_COLORS: Record<string, string> = {
  open: "#ef4444",
  investigating: "#f59e0b",
  contained: "#3b82f6",
  mitigated: "#10b981",
  closed: "#6b7280",
};

function generateMobileBrief(incident: Incident) {
  const isCritical = incident.severity === "critical";
  return {
    situation: [
      incident.description ?? "No description available.",
      `Status: ${incident.status.toUpperCase()} · Severity: ${incident.severity.toUpperCase()}`,
      `Lead: ${incident.assignedAnalyst ?? "Unassigned"}`,
    ],
    assumptions: [
      isCritical ? "Adversary may have had earlier access than first detection indicates." : "Threat scope appears limited to identified systems.",
      "Backup integrity not yet confirmed — recovery timelines provisional.",
      "All persistence mechanisms may not yet be identified.",
    ],
    unknowns: [
      "Full scope of data accessed during incident window.",
      "Whether additional systems outside telemetry were affected.",
      isCritical ? "Adversary attribution confidence is moderate — alternatives not eliminated." : "Whether this is isolated or part of a broader campaign.",
    ],
    actions: [
      "Authorize emergency containment spend — IR retainer activation recommended.",
      isCritical ? "Legal review required — possible GDPR/state breach notification obligations." : "Legal review recommended for notification obligations.",
      "Commission third-party forensic investigation before public communications.",
      "Review detection control gaps identified during response.",
    ],
  };
}

export default function BoardBriefTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [briefGenerated, setBriefGenerated] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);

  const { data: liveIncidents, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["board-brief-incidents"],
    queryFn: () => apiGet<Incident[]>("/api/firestorm/incidents"),
  });

  const incidents: Incident[] = Array.isArray(liveIncidents) && liveIncidents.length > 0 ? liveIncidents.slice(0, 8) : MOCK_INCIDENTS;
  const selectedIncident = incidents.find(i => i.id === selectedId) ?? null;
  const brief = briefGenerated === selectedId && selectedIncident ? generateMobileBrief(selectedIncident) : null;

  const handleGenerate = () => {
    if (!selectedIncident) return;
    setGenerating(true);
    setTimeout(() => {
      setBriefGenerated(selectedId);
      setGenerating(false);
    }, 900);
  };

  const s = styles(colors);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Ionicons name="document-text" size={16} color={colors.cyan} />
        <Text style={s.headerTitle}>Board Brief Generator</Text>
        <View style={s.restrictedBadge}>
          <Text style={s.restrictedText}>RESTRICTED</Text>
        </View>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.cyan} />}
      >
        {/* Incident selector */}
        <Text style={s.sectionLabel}>Select Incident for Brief</Text>
        {isLoading ? (
          <ActivityIndicator color={colors.cyan} style={{ marginVertical: 24 }} />
        ) : (
          <View style={s.incidentList}>
            {incidents.filter(i => ["open", "investigating", "contained", "critical"].includes(i.status) || i.severity === "critical").slice(0, 8).map(inc => (
              <TouchableOpacity
                key={inc.id}
                onPress={() => { setSelectedId(inc.id); setBriefGenerated(null); }}
                style={[s.incidentCard, selectedId === inc.id && s.incidentCardSelected]}
                activeOpacity={0.7}
              >
                <View style={[s.severityDot, { backgroundColor: SEVERITY_COLORS[inc.severity] ?? "#6b7280" }]} />
                <View style={s.incidentInfo}>
                  <Text style={s.incidentTitle} numberOfLines={2}>{inc.title}</Text>
                  <View style={s.incidentMeta}>
                    <Text style={[s.metaStatus, { color: STATUS_COLORS[inc.status] ?? "#6b7280" }]}>{inc.status.toUpperCase()}</Text>
                    <Text style={s.metaDivider}>·</Text>
                    <Text style={s.metaId}>#{inc.id}</Text>
                  </View>
                </View>
                <Ionicons name={selectedId === inc.id ? "checkmark-circle" : "chevron-forward"} size={16} color={selectedId === inc.id ? colors.cyan : "rgba(255,255,255,0.2)"} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Generate button */}
        {selectedIncident && !brief && (
          <TouchableOpacity
            onPress={handleGenerate}
            style={s.generateButton}
            disabled={generating}
            activeOpacity={0.8}
          >
            {generating ? (
              <ActivityIndicator color={colors.cyan} size="small" />
            ) : (
              <Ionicons name="document-text-outline" size={16} color={colors.cyan} />
            )}
            <Text style={s.generateButtonText}>{generating ? "Generating…" : "Generate Board Brief"}</Text>
          </TouchableOpacity>
        )}

        {/* Brief output */}
        {brief && selectedIncident && (
          <View style={s.briefContainer}>
            <View style={s.briefHeader}>
              <Text style={s.briefHeaderLabel}>EXECUTIVE BOARD BRIEF — RESTRICTED</Text>
              <Text style={s.briefTitle}>{selectedIncident.title}</Text>
              <Text style={s.briefMeta}>#{selectedIncident.id} · {new Date().toLocaleDateString()}</Text>
            </View>

            {([
              { id: "situation", label: "Situation Summary", icon: "information-circle-outline" as const, items: brief.situation },
              { id: "assumptions", label: "Key Assumptions", icon: "alert-circle-outline" as const, items: brief.assumptions },
              { id: "unknowns", label: "Gaps & Unknowns", icon: "help-circle-outline" as const, items: brief.unknowns },
              { id: "actions", label: "Recommended Actions", icon: "checkmark-circle-outline" as const, items: brief.actions },
            ] as const).map(section => (
              <View key={section.id} style={s.briefSection}>
                <View style={s.briefSectionHeader}>
                  <Ionicons name={section.icon} size={14} color="rgba(255,255,255,0.4)" />
                  <Text style={s.briefSectionTitle}>{section.label}</Text>
                </View>
                {section.items.map((item, i) => (
                  <View key={i} style={s.briefItem}>
                    <View style={s.briefDot} />
                    <Text style={s.briefItemText}>{item}</Text>
                  </View>
                ))}
              </View>
            ))}

            <TouchableOpacity
              onPress={() => { setBriefGenerated(null); }}
              style={s.regenerateButton}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh-outline" size={14} color="rgba(255,255,255,0.5)" />
              <Text style={s.regenerateText}>Select Different Incident</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: insets.bottom + 80 }} />
      </ScrollView>
    </View>
  );
}

function styles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.navy },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(255,255,255,0.05)",
    },
    headerTitle: { fontSize: 14, fontWeight: "700", color: "#e2e8f0", flex: 1 },
    restrictedBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: "rgba(6,182,212,0.3)", backgroundColor: "rgba(6,182,212,0.05)" },
    restrictedText: { fontSize: 8, fontFamily: "JetBrainsMono_400Regular", color: "rgba(6,182,212,0.7)", letterSpacing: 0.8 },
    scroll: { flex: 1 },
    scrollContent: { padding: 16 },
    sectionLabel: { fontSize: 10, fontFamily: "JetBrainsMono_400Regular", color: "rgba(255,255,255,0.3)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 },
    incidentList: { gap: 8 },
    incidentCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 12,
      borderRadius: 12,
      backgroundColor: "rgba(255,255,255,0.02)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.05)",
    },
    incidentCardSelected: {
      borderColor: "rgba(6,182,212,0.3)",
      backgroundColor: "rgba(6,182,212,0.05)",
    },
    severityDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
    incidentInfo: { flex: 1 },
    incidentTitle: { fontSize: 12, fontWeight: "600", color: "#e2e8f0", marginBottom: 3 },
    incidentMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
    metaStatus: { fontSize: 9, fontFamily: "JetBrainsMono_400Regular" },
    metaDivider: { fontSize: 9, color: "rgba(255,255,255,0.2)" },
    metaId: { fontSize: 9, fontFamily: "JetBrainsMono_400Regular", color: "rgba(255,255,255,0.25)" },
    generateButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 16,
      padding: 14,
      borderRadius: 12,
      backgroundColor: "rgba(6,182,212,0.08)",
      borderWidth: 1,
      borderColor: "rgba(6,182,212,0.2)",
    },
    generateButtonText: { fontSize: 13, fontWeight: "600", color: "rgba(6,182,212,0.9)" },
    briefContainer: { marginTop: 16, gap: 12 },
    briefHeader: {
      padding: 14,
      borderRadius: 12,
      backgroundColor: "rgba(255,255,255,0.015)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.05)",
    },
    briefHeaderLabel: { fontSize: 8, fontFamily: "JetBrainsMono_400Regular", color: "rgba(255,255,255,0.2)", letterSpacing: 0.8, marginBottom: 6 },
    briefTitle: { fontSize: 14, fontWeight: "700", color: "#e2e8f0", marginBottom: 3 },
    briefMeta: { fontSize: 10, color: "rgba(255,255,255,0.3)" },
    briefSection: {
      padding: 14,
      borderRadius: 12,
      backgroundColor: "rgba(255,255,255,0.02)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.05)",
      gap: 8,
    },
    briefSectionHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
    briefSectionTitle: { fontSize: 11, fontWeight: "700", color: "#e2e8f0" },
    briefItem: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
    briefDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.2)", marginTop: 6 },
    briefItemText: { fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 17, flex: 1 },
    regenerateButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      padding: 12,
      borderRadius: 10,
      backgroundColor: "rgba(255,255,255,0.04)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.08)",
    },
    regenerateText: { fontSize: 11, color: "rgba(255,255,255,0.4)" },
  });
}
