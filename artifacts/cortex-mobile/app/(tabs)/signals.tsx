import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWorkspace } from "@/context/WorkspaceContext";
import { CORTEX_COLORS } from "@/constants/colors";
import { WORKSPACE_TABS } from "@/constants/tabs";

interface Signal {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  time: string;
  source: string;
}

const SEVERITY_COLORS = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#f59e0b",
  low: "#22c55e",
  info: "#38bdf8",
};

const DEMO_SIGNALS: Record<string, Signal[]> = {
  defense: [
    { id: "d1", title: "Brute-force attempt detected on SSH gateway", severity: "critical", time: "2m ago", source: "SIEM" },
    { id: "d2", title: "Unusual outbound traffic from DB cluster", severity: "high", time: "18m ago", source: "NDR" },
    { id: "d3", title: "Failed MFA attempt — admin account", severity: "medium", time: "1h ago", source: "IAM" },
    { id: "d4", title: "TLS certificate expiring in 7 days", severity: "low", time: "3h ago", source: "Cert Monitor" },
    { id: "d5", title: "New CVE published for OpenSSL 3.x", severity: "info", time: "6h ago", source: "VulnDB" },
  ],
  fleet: [
    { id: "f1", title: "MV Oceanus — engine temperature anomaly", severity: "critical", time: "5m ago", source: "IoT Sensor" },
    { id: "f2", title: "MV Atlas — deviation from planned route", severity: "high", time: "32m ago", source: "AIS" },
    { id: "f3", title: "Port clearance delayed — Singapore", severity: "medium", time: "2h ago", source: "Port Auth" },
    { id: "f4", title: "Fuel consumption above threshold — fleet avg", severity: "low", time: "4h ago", source: "Telematics" },
  ],
  properties: [
    { id: "p1", title: "New listing matches pipeline criteria — $4.2M industrial", severity: "high", time: "12m ago", source: "MLS Feed" },
    { id: "p2", title: "Appraisal report ready — 1200 Harbor Blvd", severity: "medium", time: "1h ago", source: "Valuation" },
    { id: "p3", title: "Zoning change approved — District 7", severity: "info", time: "5h ago", source: "Municipal" },
  ],
  operations: [
    { id: "o1", title: "API latency spike — payments service (p99 > 2s)", severity: "critical", time: "1m ago", source: "APM" },
    { id: "o2", title: "Deployment rollback triggered — auth-service v2.4.1", severity: "high", time: "22m ago", source: "CI/CD" },
    { id: "o3", title: "Cloud cost anomaly — compute +34% over baseline", severity: "medium", time: "3h ago", source: "FinOps" },
    { id: "o4", title: "Certificate rotation completed — 12 services", severity: "info", time: "6h ago", source: "SecOps" },
  ],
  advisory: [
    { id: "a1", title: "Strategy session request — Meridian Capital", severity: "high", time: "30m ago", source: "CRM" },
    { id: "a2", title: "Contract renewal due — Phoenix Advisory", severity: "medium", time: "2d", source: "Contracts" },
    { id: "a3", title: "Client NPS survey results available", severity: "info", time: "1d", source: "Analytics" },
  ],
  portfolio: [
    { id: "s1", title: "Board meeting scheduled — Q2 review", severity: "high", time: "1d", source: "Calendar" },
    { id: "s2", title: "Dividend payment processed — $2.4M", severity: "info", time: "2d", source: "Treasury" },
    { id: "s3", title: "Regulatory filing deadline approaching", severity: "medium", time: "5d", source: "Compliance" },
  ],
  founder: [
    { id: "st1", title: "Article draft review — 'AI in Maritime Logistics'", severity: "medium", time: "2h ago", source: "CMS" },
    { id: "st2", title: "Speaking invitation — Global Tech Summit 2026", severity: "high", time: "1d", source: "Events" },
    { id: "st3", title: "Venture update — Series A close pending", severity: "info", time: "3d", source: "Deal Room" },
  ],
};

function SeverityBadge({ severity }: { severity: Signal["severity"] }) {
  return (
    <View style={[styles.severityBadge, { backgroundColor: `${SEVERITY_COLORS[severity]}20`, borderColor: `${SEVERITY_COLORS[severity]}40` }]}>
      <View style={[styles.severityDot, { backgroundColor: SEVERITY_COLORS[severity] }]} />
      <Text style={[styles.severityText, { color: SEVERITY_COLORS[severity] }]}>
        {severity.toUpperCase()}
      </Text>
    </View>
  );
}

export default function SignalsScreen() {
  const insets = useSafeAreaInsets();
  const { config, activeWorkspace } = useWorkspace();
  const tabConfig = WORKSPACE_TABS[activeWorkspace];
  const title = tabConfig[1]?.label ?? "Signals";
  const signals = DEMO_SIGNALS[activeWorkspace] ?? [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: config.accentColor }]}>{title}</Text>
        <Text style={styles.headerCount}>{signals.length} active</Text>
      </View>
      <FlatList
        data={signals}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 120 }}
        renderItem={({ item }) => (
          <View style={styles.signalCard}>
            <View style={styles.signalHeader}>
              <SeverityBadge severity={item.severity} />
              <Text style={styles.signalTime}>{item.time}</Text>
            </View>
            <Text style={styles.signalTitle}>{item.title}</Text>
            <Text style={styles.signalSource}>Source: {item.source}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CORTEX_COLORS.bg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 24, fontWeight: "700" },
  headerCount: { fontSize: 13, color: CORTEX_COLORS.textMuted },
  signalCard: { marginHorizontal: 16, marginBottom: 8, padding: 16, borderRadius: 14, backgroundColor: CORTEX_COLORS.bgCard, borderWidth: 1, borderColor: CORTEX_COLORS.borderLight },
  signalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  signalTime: { fontSize: 11, color: CORTEX_COLORS.textMuted },
  signalTitle: { fontSize: 15, fontWeight: "600", color: CORTEX_COLORS.text, marginBottom: 6 },
  signalSource: { fontSize: 11, color: CORTEX_COLORS.textMuted },
  severityBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  severityDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  severityText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
});
