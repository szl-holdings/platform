import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { AICopilot } from "@/components/AICopilot";
import { NotificationOverlay, usePushNotifications } from "@/components/PushNotificationManager";
import { useOfflineCache } from "@/hooks/useOfflineCache";
import * as SecureStore from "expo-secure-store";

interface LyteStatusSnapshot {
  gridStatus: string;
  energyAlert: string;
  cachedAt: number;
}

const ACCENT = "#f97316";
const BG = "#08080f";
const CARD = "rgba(25,25,35,0.95)";
const BORDER = "rgba(255,255,255,0.06)";

const QUICK_ACTIONS = [
  { id: "energy-brief", label: "Energy Brief", icon: "zap", color: "#f97316" },
  { id: "grid-status", label: "Grid Status", icon: "activity", color: "#10b981" },
  { id: "alerts", label: "Alerts", icon: "bell", color: "#ef4444" },
  { id: "forecast", label: "Forecast", icon: "trending-up", color: "#3b82f6" },
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
      SecureStore.getItemAsync("lyte_session_token").then(t => setAuthToken(t)).catch(() => {});
    }
  }, []);

  const [copilotVisible, setCopilotVisible] = useState(false);
  const [serverStatus, setServerStatus] = useState<"checking" | "healthy" | "error">("checking");
  const [refreshing, setRefreshing] = useState(false);
  const { cached: cachedStatus, save: saveStatus } = useOfflineCache<LyteStatusSnapshot>("lyte-status-snapshot");

  const { notifications, handleAction, dismissNotification } = usePushNotifications(ACCENT, getApiBase(), "lyte", authToken);

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/mcp/health`);
      const ok = res.ok;
      setServerStatus(ok ? "healthy" : "error");
      if (ok) {
        saveStatus({ gridStatus: "Operational", energyAlert: "None", cachedAt: Date.now() }).catch(() => {});
      }
    } catch { setServerStatus("error"); }
  }, [saveStatus]);

  useEffect(() => { checkHealth(); }, [checkHealth]);

  const onRefresh = async () => {
    setRefreshing(true);
    await checkHealth();
    setRefreshing(false);
  };

  const statusColor = serverStatus === "healthy" ? "#10b981" : serverStatus === "error" ? ACCENT : "#f59e0b";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>AI Command</Text>
          <Text style={styles.headerSub}>Lyte Energy Intelligence</Text>
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
        <TouchableOpacity
          onPress={() => setCopilotVisible(true)}
          style={styles.copilotCard}
          activeOpacity={0.85}
        >
          <View style={[styles.copilotInner]}>
            <View style={styles.copilotLeft}>
              <View style={[styles.copilotIcon, { backgroundColor: ACCENT + "20", borderColor: ACCENT + "40" }]}>
                <Feather name="cpu" size={22} color={ACCENT} />
              </View>
              <View>
                <Text style={styles.copilotTitle}>Lyte AI Copilot</Text>
                <Text style={styles.copilotDesc}>Energy analysis • Grid optimization • Forecasting</Text>
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
              onPress={() => setCopilotVisible(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.quickIcon, { backgroundColor: action.color + "15" }]}>
                <Feather name={action.icon as React.ComponentProps<typeof Feather>["name"]} size={18} color={action.color} />
              </View>
              <Text style={styles.quickLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>AI Status</Text>
        {[
          { label: "Energy Forecasting", status: "Active", color: "#10b981" },
          { label: "Grid Anomaly Detector", status: "Monitoring", color: "#10b981" },
          { label: "Demand Prediction", status: "Running", color: "#10b981" },
          { label: "Offline Cache", status: cachedStatus ? `Synced ${new Date(cachedStatus.cachedAt).toLocaleTimeString()}` : "Empty", color: cachedStatus ? "#10b981" : "#f59e0b" },
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
        agentName="Lyte"
        agentId="lyte"
        accentColor={ACCENT}
        welcomeMessage="Lyte Energy AI online. I'm monitoring the full grid in real-time. What would you like to analyze?"
        suggestions={[
          "Show peak demand forecast",
          "Identify grid anomalies",
          "Optimize energy distribution",
          "Generate executive brief",
        ]}
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
  copilotCard: { margin: 14, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: ACCENT + "30", backgroundColor: CARD },
  copilotInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  copilotLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  copilotIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  copilotTitle: { fontSize: 15, fontWeight: "700", color: "#fff", marginBottom: 2 },
  copilotDesc: { fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 15 },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, gap: 8 },
  quickCard: { width: "46%", borderRadius: 12, borderWidth: 1, padding: 14, gap: 10, backgroundColor: CARD },
  quickIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  quickLabel: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.7)" },
  statusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: BORDER },
  statusLabel: { fontSize: 12, color: "rgba(255,255,255,0.55)" },
  statusRight: { flexDirection: "row", alignItems: "center", gap: 5 },
  statusIndicator: { width: 5, height: 5, borderRadius: 3 },
  statusValue: { fontSize: 11, fontWeight: "600" },
});
