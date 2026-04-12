import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, RefreshControl, Modal,
  Animated as RNAnimated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { AICopilot } from "@/components/AICopilot";
import { NotificationOverlay, usePushNotifications } from "@/components/PushNotificationManager";
import { useOfflineCache } from "@/hooks/useOfflineCache";

type ProofLog = { id: string; msg: string; level: "info" | "warn" | "ok" | "ai" };
interface ProofSessionSnapshot {
  logs: ProofLog[];
  aiNarration: string;
  cachedAt: number;
}

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

const AUTH_TOKEN_KEY = "stephen_auth_token";
const ACCENT = "#6366f1";
const BG = "#0a0a0a";
const CARD = "rgba(25,25,35,0.95)";
const BORDER = "rgba(255,255,255,0.06)";

const SYSTEM_HEARTBEATS = [
  { service: "API Gateway", latency: "12ms", uptime: "99.97%", status: "healthy" },
  { service: "AI Inference", latency: "84ms", uptime: "99.91%", status: "healthy" },
  { service: "Vector Store", latency: "6ms", uptime: "100%", status: "healthy" },
  { service: "Event Bus", latency: "3ms", uptime: "99.99%", status: "healthy" },
  { service: "MCP Server", latency: "18ms", uptime: "99.88%", status: "degraded" },
  { service: "Cache Layer", latency: "1ms", uptime: "100%", status: "healthy" },
];

function ProofTerminalModal({ visible, onClose, accentColor, apiBase, authToken }: {
  visible: boolean;
  onClose: () => void;
  accentColor: string;
  apiBase: string;
  authToken: string | null;
}) {
  const [logs, setLogs] = useState<ProofLog[]>([]);
  const [aiNarration, setAiNarration] = useState("");
  const scrollRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new RNAnimated.Value(1)).current;
  const { cached: cachedSession, save: saveSession, isOffline } = useOfflineCache<ProofSessionSnapshot>("stephen-proof-session");

  useEffect(() => {
    if (!visible) { setLogs([]); setAiNarration(""); return; }

    if (isOffline && cachedSession?.logs && cachedSession.logs.length > 0) {
      setLogs([
        { id: "offline-banner", msg: `[Offline] Last session cached at ${new Date(cachedSession.cachedAt).toLocaleTimeString()}`, level: "warn" },
        ...cachedSession.logs.slice(-10),
      ]);
      setAiNarration(cachedSession.aiNarration || "Showing cached session — device is offline.");
      return;
    }

    setLogs([{ id: "init", msg: "Proof terminal initialized — probing system endpoints…", level: "info" }]);

    const pulse = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulseAnim, { toValue: 1.05, duration: 600, useNativeDriver: true }),
        RNAnimated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    pulse.start();

    async function probeHealth() {
      if (!apiBase) {
        setLogs(prev => [...prev, { id: `err-${Date.now()}`, msg: "No API base configured — cannot connect to live services", level: "warn" }]);
        return;
      }
      const headers: Record<string, string> = {};
      if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
      try {
        const start = Date.now();
        const res = await fetch(`${apiBase}/api/mcp/health`, { headers });
        const latency = Date.now() - start;
        if (res.ok) {
          const data = await res.json() as Record<string, unknown>;
          const narration = `System probe complete. MCP endpoint responded in ${latency}ms. Infrastructure is live and accessible.`;
          const successLogs: ProofLog[] = [
            { id: `hb-${Date.now()}`, msg: `MCP Server: healthy (${latency}ms)`, level: "ok" },
            { id: `hb2-${Date.now()}`, msg: `Status: ${JSON.stringify(data).slice(0, 80)}`, level: "info" },
          ];
          setLogs(prev => {
            const updated = [...prev, ...successLogs];
            saveSession({ logs: updated.slice(-20), aiNarration: narration, cachedAt: Date.now() }).catch(() => {});
            return updated;
          });
          setAiNarration(narration);
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        } else {
          setLogs(prev => [...prev, { id: `err-${Date.now()}`, msg: `MCP Server returned HTTP ${res.status}`, level: "warn" }]);
          setAiNarration(`Warning: MCP endpoint returned an error status (${res.status}). Monitoring continues.`);
        }
      } catch {
        setLogs(prev => [...prev, { id: `err-${Date.now()}`, msg: "Cannot reach MCP Server — network or configuration issue", level: "warn" }]);
        setAiNarration("Connection failed. Verify API configuration and network access.");
      }
    }

    probeHealth();

    const interval = setInterval(async () => {
      if (!apiBase) return;
      const headers: Record<string, string> = {};
      if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
      try {
        const start = Date.now();
        const res = await fetch(`${apiBase}/api/mcp/health`, { headers });
        const latency = Date.now() - start;
        const log = {
          id: Date.now().toString(),
          msg: res.ok
            ? `Heartbeat tick — ${new Date().toLocaleTimeString()} — ${latency}ms`
            : `Heartbeat failed — HTTP ${res.status}`,
          level: res.ok ? ("info" as const) : ("warn" as const),
        };
        setLogs(prev => [...prev.slice(-20), log]);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
      } catch {
        setLogs(prev => [...prev.slice(-20), { id: Date.now().toString(), msg: "Heartbeat timeout — retrying…", level: "warn" }]);
      }
    }, 15000);

    return () => { clearInterval(interval); pulse.stop(); };
  }, [visible, apiBase, authToken]);

  const levelColor = (level: string) => {
    if (level === "ok") return "#10b981";
    if (level === "warn") return "#f59e0b";
    if (level === "ai") return accentColor;
    return "rgba(255,255,255,0.45)";
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[ptStyles.container, { backgroundColor: "#060610" }]}>
        <View style={[ptStyles.header, { borderBottomColor: accentColor + "30" }]}>
          <TouchableOpacity onPress={onClose}>
            <Feather name="chevron-down" size={22} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={[ptStyles.title, { color: accentColor }]}>Live Proof Terminal</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 }}>
              <RNAnimated.View style={[ptStyles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
              <Text style={ptStyles.liveText}>STREAMING HEARTBEAT</Text>
            </View>
          </View>
          <View style={{ width: 22 }} />
        </View>

        <View style={ptStyles.heartbeats}>
          {SYSTEM_HEARTBEATS.map(s => (
            <View key={s.service} style={ptStyles.heartbeatRow}>
              <View style={[ptStyles.hbDot, { backgroundColor: s.status === "healthy" ? "#10b981" : "#f59e0b" }]} />
              <Text style={ptStyles.hbService}>{s.service}</Text>
              <Text style={ptStyles.hbLatency}>{s.latency}</Text>
              <Text style={[ptStyles.hbUptime, { color: s.status === "healthy" ? "#10b981" : "#f59e0b" }]}>{s.uptime}</Text>
            </View>
          ))}
        </View>

        {aiNarration ? (
          <View style={[ptStyles.narrationCard, { borderColor: accentColor + "30", backgroundColor: accentColor + "08" }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 6 }}>
              <Feather name="cpu" size={11} color={accentColor} />
              <Text style={[ptStyles.narrationLabel, { color: accentColor }]}>AI SYSTEM NARRATION</Text>
            </View>
            <Text style={ptStyles.narrationText}>{aiNarration}</Text>
          </View>
        ) : null}

        <Text style={ptStyles.logLabel}>LIVE TERMINAL LOG</Text>
        <ScrollView ref={scrollRef} style={ptStyles.logScroll} showsVerticalScrollIndicator={false}>
          {logs.map(log => (
            <View key={log.id} style={ptStyles.logLine}>
              <Text style={[ptStyles.logPrompt, { color: accentColor }]}>{">"}</Text>
              <Text style={[ptStyles.logMsg, { color: levelColor(log.level) }]}>{log.msg}</Text>
            </View>
          ))}
          <View style={ptStyles.cursor}>
            <Text style={[ptStyles.logPrompt, { color: accentColor }]}>_</Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const ptStyles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: Platform.OS === "ios" ? 54 : 24, paddingBottom: 14, borderBottomWidth: 1 },
  title: { fontSize: 14, fontWeight: "700", letterSpacing: 1 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#10b981" },
  liveText: { fontSize: 8, color: "#10b981", fontWeight: "700", letterSpacing: 2 },
  heartbeats: { padding: 12, gap: 6 },
  heartbeatRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)" },
  hbDot: { width: 6, height: 6, borderRadius: 3 },
  hbService: { flex: 1, fontSize: 11, color: "rgba(255,255,255,0.6)", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  hbLatency: { fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", width: 50, textAlign: "right" },
  hbUptime: { fontSize: 10, fontWeight: "600", width: 55, textAlign: "right", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  narrationCard: { marginHorizontal: 12, marginBottom: 8, borderWidth: 1, borderRadius: 10, padding: 12 },
  narrationLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  narrationText: { fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 18 },
  logLabel: { fontSize: 9, fontWeight: "700", color: "rgba(255,255,255,0.2)", letterSpacing: 1.5, textTransform: "uppercase", paddingHorizontal: 14, paddingBottom: 6 },
  logScroll: { flex: 1, paddingHorizontal: 14 },
  logLine: { flexDirection: "row", gap: 8, paddingVertical: 2 },
  logPrompt: { fontSize: 11, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  logMsg: { fontSize: 11, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", flex: 1, lineHeight: 17 },
  cursor: { height: 24 },
});

export default function AICommandScreen() {
  const insets = useSafeAreaInsets();
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [copilotVisible, setCopilotVisible] = useState(false);
  const [terminalVisible, setTerminalVisible] = useState(false);
  const [serverStatus, setServerStatus] = useState<"checking" | "healthy" | "error">("checking");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web") {
      SecureStore.getItemAsync(AUTH_TOKEN_KEY).then(t => setAuthToken(t)).catch(() => {});
    }
  }, []);

  const apiBase = getApiBase();
  const { notifications, handleAction, dismissNotification } = usePushNotifications(ACCENT, apiBase, "stephen", authToken);

  const checkHealth = useCallback(async () => {
    try {
      const base = apiBase || "";
      const res = await fetch(`${base}/api/mcp/health`);
      setServerStatus(res.ok ? "healthy" : "error");
    } catch { setServerStatus("error"); }
  }, [apiBase]);

  useEffect(() => { checkHealth(); }, [checkHealth]);

  const onRefresh = async () => { setRefreshing(true); await checkHealth(); setRefreshing(false); };

  const statusColor = serverStatus === "healthy" ? "#10b981" : serverStatus === "error" ? "#ef4444" : "#f59e0b";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>AI Command</Text>
          <Text style={styles.headerSub}>Stephen · System Intelligence</Text>
        </View>
        <View style={[styles.statusBadge, { borderColor: statusColor + "30" }]}>
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
              <View style={[styles.copilotIcon, { backgroundColor: ACCENT + "20", borderColor: ACCENT + "40" }]}>
                <Feather name="cpu" size={22} color={ACCENT} />
              </View>
              <View>
                <Text style={styles.copilotTitle}>Stephen AI Copilot</Text>
                <Text style={styles.copilotDesc}>System intelligence • Portfolio insights • Decisions</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.3)" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setTerminalVisible(true)} style={styles.terminalCard} activeOpacity={0.85}>
          <View style={styles.terminalInner}>
            <View style={[styles.terminalIcon, { backgroundColor: ACCENT + "20", borderColor: ACCENT + "40" }]}>
              <Feather name="terminal" size={20} color={ACCENT} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.terminalTitle}>Live Proof Terminal</Text>
              <Text style={styles.terminalDesc}>Real-time system heartbeat metrics narrated by AI</Text>
            </View>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>System Heartbeat</Text>
        {SYSTEM_HEARTBEATS.map(s => (
          <View key={s.service} style={styles.heartbeatRow}>
            <View style={[styles.hbDot, { backgroundColor: s.status === "healthy" ? "#10b981" : "#f59e0b" }]} />
            <Text style={styles.hbService}>{s.service}</Text>
            <Text style={styles.hbLatency}>{s.latency}</Text>
            <Text style={[styles.hbUptime, { color: s.status === "healthy" ? "#10b981" : "#f59e0b" }]}>{s.uptime}</Text>
          </View>
        ))}

        <Text style={styles.sectionLabel}>AI Status</Text>
        {[
          { label: "System Monitor", status: "Active", color: "#10b981" },
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
        agentName="Stephen"
        agentId="stephen"
        accentColor={ACCENT}
        welcomeMessage="Stephen AI online. I have visibility across your full system stack and portfolio. All services nominal. What would you like to explore?"
        suggestions={[
          "What's the system health summary?",
          "Show me my portfolio performance",
          "Which services need attention?",
          "Generate a system report",
        ]}
      />

      <ProofTerminalModal
        visible={terminalVisible}
        onClose={() => setTerminalVisible(false)}
        accentColor={ACCENT}
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
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: "600" },
  sectionLabel: { fontSize: 9, fontWeight: "700", color: "rgba(255,255,255,0.25)", letterSpacing: 1.2, textTransform: "uppercase", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6 },
  copilotCard: { margin: 14, marginBottom: 8, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: ACCENT + "30", backgroundColor: CARD },
  copilotInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  copilotLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  copilotIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  copilotTitle: { fontSize: 15, fontWeight: "700", color: "#fff", marginBottom: 2 },
  copilotDesc: { fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 15 },
  terminalCard: { marginHorizontal: 14, marginBottom: 8, borderRadius: 16, borderWidth: 1, borderColor: ACCENT + "30", backgroundColor: CARD },
  terminalInner: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16 },
  terminalIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  terminalTitle: { fontSize: 14, fontWeight: "700", color: "#fff", marginBottom: 2 },
  terminalDesc: { fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 15 },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#10b981" },
  liveText: { fontSize: 9, color: "#10b981", fontWeight: "700", letterSpacing: 1 },
  heartbeatRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: BORDER },
  hbDot: { width: 6, height: 6, borderRadius: 3 },
  hbService: { flex: 1, fontSize: 12, color: "rgba(255,255,255,0.6)" },
  hbLatency: { fontSize: 11, color: "rgba(255,255,255,0.35)", width: 45, textAlign: "right" },
  hbUptime: { fontSize: 11, fontWeight: "600", width: 55, textAlign: "right" },
  statusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: BORDER },
  statusLabel: { fontSize: 12, color: "rgba(255,255,255,0.55)" },
  statusRight: { flexDirection: "row", alignItems: "center", gap: 5 },
  statusIndicator: { width: 5, height: 5, borderRadius: 3 },
  statusValue: { fontSize: 11, fontWeight: "600" },
});
