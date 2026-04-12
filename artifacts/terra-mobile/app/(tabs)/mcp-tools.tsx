import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { AICopilot } from "@/components/AICopilot";
import { DocumentCapture } from "@/components/DocumentCapture";
import { NotificationOverlay, usePushNotifications } from "@/components/PushNotificationManager";
import { useOfflineCache } from "@/hooks/useOfflineCache";
import * as SecureStore from "expo-secure-store";
import { AUTH_TOKEN_KEY } from "@/context/AuthContext";

type DocEntry = { id: string; classification: string; processedAt: number };

const ACCENT = "#4d7c0f";
const BG = "#08080f";
const CARD = "rgba(25,25,35,0.95)";
const BORDER = "rgba(255,255,255,0.06)";

const QUICK_ACTIONS = [
  { id: "portfolio", label: "Portfolio Brief", icon: "home", color: "#4d7c0f" },
  { id: "leads", label: "Distress Leads", icon: "alert-circle", color: "#ef4444" },
  { id: "valuation", label: "AI Valuation", icon: "dollar-sign", color: "#10b981" },
  { id: "deed-scan", label: "Deed Scanner", icon: "file-text", color: "#f59e0b" },
];


function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

export default function AICommandScreen() {
  const insets = useSafeAreaInsets();
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== "web") {
      SecureStore.getItemAsync(AUTH_TOKEN_KEY).then(t => setAuthToken(t)).catch(() => {});
    }
  }, []);

  const [copilotVisible, setCopilotVisible] = useState(false);
  const [docScanVisible, setDocScanVisible] = useState(false);
  const [serverStatus, setServerStatus] = useState<"checking" | "healthy" | "error">("checking");
  const [refreshing, setRefreshing] = useState(false);
  const { cached: cachedDocs, save: saveDocs } = useOfflineCache<DocEntry[]>("terra-recent-docs");
  const [recentDocs, setRecentDocs] = useState<DocEntry[]>([]);

  const apiBase = getApiBase();
  const { notifications, handleAction, dismissNotification } = usePushNotifications(ACCENT, apiBase, "terra", authToken);

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/mcp/health`);
      setServerStatus(res.ok ? "healthy" : "error");
    } catch { setServerStatus("error"); }
  }, []);

  useEffect(() => { checkHealth(); }, [checkHealth]);

  useEffect(() => {
    if (cachedDocs && cachedDocs.length > 0 && recentDocs.length === 0) {
      setRecentDocs(cachedDocs.slice(0, 5));
    }
  }, [cachedDocs]);

  const onRefresh = async () => { setRefreshing(true); await checkHealth(); setRefreshing(false); };

  const statusColor = serverStatus === "healthy" ? "#10b981" : serverStatus === "error" ? "#ef4444" : "#f59e0b";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>AI Command</Text>
          <Text style={styles.headerSub}>Terra Real Estate Intelligence</Text>
        </View>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {serverStatus === "healthy" ? "Live" : serverStatus === "error" ? "Offline" : "..."}
          </Text>
        </View>
      </View>

      <NotificationOverlay
        accentColor={ACCENT}
        notifications={notifications}
        onAction={handleAction}
        onDismiss={dismissNotification}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
      >
        <TouchableOpacity onPress={() => setCopilotVisible(true)} style={styles.copilotCard} activeOpacity={0.85}>
          <View style={styles.copilotInner}>
            <View style={styles.copilotLeft}>
              <View style={[styles.copilotIcon, { backgroundColor: ACCENT + "30", borderColor: ACCENT + "50" }]}>
                <Feather name="cpu" size={22} color={ACCENT} />
              </View>
              <View>
                <Text style={styles.copilotTitle}>Terra AI Copilot</Text>
                <Text style={styles.copilotDesc}>Property analysis • Distress scoring • Deal sourcing</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.3)" />
          </View>
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map(action => (
            <TouchableOpacity
              key={action.id}
              style={[styles.quickCard, { borderColor: action.color + "25" }]}
              onPress={action.id === "deed-scan" ? () => setDocScanVisible(true) : () => setCopilotVisible(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.quickIcon, { backgroundColor: action.color + "20" }]}>
                <Feather name={action.icon as React.ComponentProps<typeof Feather>["name"]} size={18} color={action.color} />
              </View>
              <Text style={styles.quickLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Property Document Scanner</Text>
        <TouchableOpacity onPress={() => setDocScanVisible(true)} style={styles.docCard} activeOpacity={0.8}>
          <View style={styles.docLeft}>
            <Feather name="camera" size={18} color={ACCENT} />
            <View>
              <Text style={styles.docTitle}>Scan Property Documents</Text>
              <Text style={styles.docDesc}>Deeds, liens, and title documents — AI extracts all data</Text>
            </View>
          </View>
          <Feather name="arrow-right" size={16} color="rgba(255,255,255,0.3)" />
        </TouchableOpacity>

        {recentDocs.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Recent Documents</Text>
            {recentDocs.map(doc => (
              <View key={doc.id} style={styles.recentDoc}>
                <Feather name="file-text" size={14} color="rgba(255,255,255,0.3)" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.recentDocTitle}>{doc.classification}</Text>
                  <Text style={styles.recentDocTime}>{new Date(doc.processedAt).toLocaleTimeString()}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        <Text style={styles.sectionLabel}>AI Status</Text>
        {[
          { label: "Property Distress Scanner", status: "Active", color: "#10b981" },
          { label: "Market Intelligence", status: "Live Data", color: "#10b981" },
          { label: "Deal Pipeline AI", status: "Running", color: "#10b981" },
          { label: "Offline Cache", status: "Synced", color: "#10b981" },
        ].map(item => (
          <View key={item.label} style={styles.statusRow}>
            <Text style={styles.statusLabel}>{item.label}</Text>
            <View style={styles.statusRight}>
              <View style={[styles.statusIndicator, { backgroundColor: item.color }]} />
              <Text style={[styles.statusValue, { color: item.color }]}>{item.status}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <AICopilot
        visible={copilotVisible}
        onClose={() => setCopilotVisible(false)}
        agentName="Terra"
        agentId="terra"
        accentColor={ACCENT}
        welcomeMessage="Terra AI online. I'm monitoring 847 properties across your pipeline. What would you like to analyze?"
        suggestions={[
          "Show high-distress properties",
          "Analyze our top acquisition targets",
          "Run a valuation on 247 West 57th",
          "Summarize today's deal activity",
        ]}
      />

      <DocumentCapture
        visible={docScanVisible}
        onClose={() => setDocScanVisible(false)}
        onResult={(result) => {
          setDocScanVisible(false);
          const newEntry: DocEntry = { id: result.id, classification: result.classification, processedAt: result.processedAt };
          setRecentDocs(prev => {
            const updated = [newEntry, ...prev].slice(0, 5);
            saveDocs(updated).catch(() => {});
            return updated;
          });
        }}
        documentType="property"
        accentColor={ACCENT}
        title="Property Document Scanner"
        apiBase={apiBase}
        authToken={authToken}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: BORDER },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "700", letterSpacing: -0.3 },
  headerSub: { color: "rgba(255,255,255,0.35)", fontSize: 10, marginTop: 1 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: BORDER },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: "600" },
  sectionLabel: { fontSize: 9, fontWeight: "700", color: "rgba(255,255,255,0.25)", letterSpacing: 1.2, textTransform: "uppercase", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6 },
  copilotCard: { margin: 14, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: ACCENT + "40", backgroundColor: CARD },
  copilotInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  copilotLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  copilotIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  copilotTitle: { fontSize: 15, fontWeight: "700", color: "#fff", marginBottom: 2 },
  copilotDesc: { fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 15 },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, gap: 8 },
  quickCard: { width: "46%", borderRadius: 12, borderWidth: 1, padding: 14, gap: 10, backgroundColor: CARD },
  quickIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  quickLabel: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.7)" },
  docCard: { marginHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: ACCENT + "40", backgroundColor: CARD, flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14 },
  docLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  docTitle: { fontSize: 13, fontWeight: "600", color: "#fff" },
  docDesc: { fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 1 },
  recentDoc: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: BORDER },
  recentDocTitle: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.65)" },
  recentDocTime: { fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 },
  statusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: BORDER },
  statusLabel: { fontSize: 12, color: "rgba(255,255,255,0.55)" },
  statusRight: { flexDirection: "row", alignItems: "center", gap: 5 },
  statusIndicator: { width: 5, height: 5, borderRadius: 3 },
  statusValue: { fontSize: 11, fontWeight: "600" },
});
