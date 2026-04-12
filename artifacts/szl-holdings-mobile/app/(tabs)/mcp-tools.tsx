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
import * as Speech from "expo-speech";
import { AICopilot } from "@/components/AICopilot";
import { NotificationOverlay, usePushNotifications } from "@/components/PushNotificationManager";
import { useOfflineCache, useConnectivity } from "@/hooks/useOfflineCache";
import * as SecureStore from "expo-secure-store";
import { AUTH_TOKEN_KEY } from "@/context/AuthContext";

const ACCENT = "#c9a84c";
const BG = "#08080f";
const CARD = "rgba(25,25,35,0.95)";
const BORDER = "rgba(255,255,255,0.06)";

interface CachedBriefingData {
  text: string;
  generatedAt: number;
}

function VoiceBriefingModal({ visible, onClose, accentColor, apiBase, authToken }: {
  visible: boolean;
  onClose: () => void;
  accentColor: string;
  apiBase: string;
  authToken: string | null;
}) {
  const [phase, setPhase] = useState<"generating" | "streaming" | "done" | "error" | "offline-cached">("generating");
  const [briefingText, setBriefingText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const pulseAnim = useRef(new RNAnimated.Value(1)).current;
  const conversationId = useRef(`szl-briefing-${Date.now()}`);
  const { cached: cachedBriefing, save: saveBriefing, isOffline } = useOfflineCache<CachedBriefingData>("szl-voice-briefing");

  useEffect(() => {
    if (!visible) {
      setPhase("generating");
      setBriefingText("");
      setErrorMsg("");
      if (Platform.OS !== "web") Speech.stop();
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    const pulse = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
        RNAnimated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();

    let cancelled = false;
    conversationId.current = `szl-briefing-${Date.now()}`;

    async function fetchBriefing() {
      if (!apiBase || isOffline) {
        if (cachedBriefing?.text) {
          setBriefingText(cachedBriefing.text);
          setPhase("offline-cached");
        } else {
          setErrorMsg(isOffline ? "Device is offline — no cached briefing available" : "No API base configured");
          setPhase("error");
        }
        return;
      }
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "Accept": "text/event-stream",
        };
        if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
        const res = await fetch(`${apiBase}/api/alloy-chat/conversations/${conversationId.current}/messages`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            role: "user",
            content: "Generate an executive voice briefing for SZL Holdings. Summarize the portfolio, key operational highlights, cross-domain signals, and recommended actions in 3-4 concise paragraphs suitable for audio narration.",
            systemContext: "You are an executive AI briefing assistant for SZL Holdings. Provide crisp, executive-level portfolio intelligence.",
          }),
        });
        if (!res.ok || !res.body) throw new Error(`API ${res.status}`);
        setPhase("streaming");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let text = "";
        while (!cancelled) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (!raw || raw === "[DONE]") continue;
            try {
              const evt = JSON.parse(raw);
              if (evt.content) {
                text += evt.content;
                if (!cancelled) setBriefingText(text);
              }
            } catch {}
          }
        }
        if (!cancelled) {
          setPhase("done");
          if (text) {
            await saveBriefing({ text, generatedAt: Date.now() });
          }
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          if (Platform.OS !== "web" && text) {
            const narrationText = text.slice(0, 1200);
            Speech.speak(narrationText, {
              language: "en-US",
              pitch: 1.0,
              rate: 0.95,
              onDone: () => {},
              onError: () => {},
            });
          }
        }
      } catch (err) {
        if (!cancelled) {
          if (cachedBriefing?.text) {
            setBriefingText(cachedBriefing.text);
            setPhase("offline-cached");
          } else {
            setErrorMsg(err instanceof Error ? err.message : "Unknown error");
            setPhase("error");
          }
        }
      }
    }

    fetchBriefing();
    return () => {
      cancelled = true;
      pulse.stop();
      if (Platform.OS !== "web") Speech.stop();
    };
  }, [visible, apiBase, authToken]);

  const labels: Record<string, string> = {
    generating: "Connecting to executive intelligence...",
    streaming: "AI narrating portfolio briefing...",
    done: "Narration complete — tap to listen again",
    error: "Briefing unavailable",
    "offline-cached": "Showing cached briefing (offline)",
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={vbStyles.backdrop}>
        <View style={vbStyles.card}>
          <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={vbStyles.inner}>
            <View style={vbStyles.topRow}>
              <Text style={[vbStyles.title, { color: accentColor }]}>Executive Voice Briefing</Text>
              <TouchableOpacity onPress={onClose} hitSlop={8}>
                <Feather name="x" size={18} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            </View>
            <RNAnimated.View style={[vbStyles.micCircle, { borderColor: accentColor + "60", transform: [{ scale: (phase === "generating" || phase === "streaming") ? pulseAnim : 1 }] }]}>
              <Feather name={phase === "done" ? "check" : phase === "error" ? "alert-circle" : "volume-2"} size={32} color={phase === "error" ? "#ef4444" : accentColor} />
            </RNAnimated.View>
            <Text style={vbStyles.phaseLabel}>{labels[phase]}</Text>
            {(phase === "streaming" || phase === "done") && briefingText ? (
              <ScrollView style={vbStyles.transcript} showsVerticalScrollIndicator={false}>
                <Text style={vbStyles.transcriptText}>{briefingText}</Text>
              </ScrollView>
            ) : phase === "error" ? (
              <Text style={[vbStyles.statusText, { color: "#ef4444" }]}>{errorMsg}</Text>
            ) : (
              <Text style={vbStyles.statusText}>Connecting to SZL Holdings portfolio intelligence…</Text>
            )}
            <View style={{ flexDirection: "row", gap: 8 }}>
              {phase === "done" && briefingText && (
                <TouchableOpacity
                  onPress={() => {
                    if (Platform.OS !== "web") {
                      Speech.speak(briefingText.slice(0, 1200), { language: "en-US", pitch: 1.0, rate: 0.95 });
                    }
                  }}
                  style={[vbStyles.closeBtn, { backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: accentColor + "40" }]}
                >
                  <Text style={[vbStyles.closeBtnText, { color: accentColor }]}>Listen Again</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={[vbStyles.closeBtn, { backgroundColor: phase === "error" ? "#ef4444" : accentColor, flex: 1 }]}>
                <Text style={vbStyles.closeBtnText}>{phase === "done" ? "Close" : "Cancel"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const vbStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", alignItems: "center", justifyContent: "center", padding: 20 },
  card: { width: "100%", borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", maxHeight: "80%" },
  inner: { padding: 24, gap: 16, alignItems: "center" },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" },
  title: { fontSize: 16, fontWeight: "700" },
  micCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.05)" },
  phaseLabel: { fontSize: 14, color: "#fff", fontWeight: "600" },
  progressBar: { width: "100%", height: 3, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  transcript: { width: "100%", maxHeight: 200 },
  transcriptText: { fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 17, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  statusText: { fontSize: 12, color: "rgba(255,255,255,0.4)", textAlign: "center", lineHeight: 18 },
  closeBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, marginTop: 4 },
  closeBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
});


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
  const [briefingVisible, setBriefingVisible] = useState(false);
  const [serverStatus, setServerStatus] = useState<"checking" | "healthy" | "error">("checking");
  const [refreshing, setRefreshing] = useState(false);
  const isOnline = useConnectivity();

  const apiBase = getApiBase();
  const { notifications, handleAction, dismissNotification } = usePushNotifications(ACCENT, apiBase, "szl-holdings", authToken);

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/mcp/health`);
      setServerStatus(res.ok ? "healthy" : "error");
    } catch { setServerStatus("error"); }
  }, []);

  useEffect(() => { checkHealth(); }, [checkHealth]);

  const onRefresh = async () => { setRefreshing(true); await checkHealth(); setRefreshing(false); };

  const statusColor = serverStatus === "healthy" ? "#10b981" : serverStatus === "error" ? "#ef4444" : "#f59e0b";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>AI Command</Text>
          <Text style={styles.headerSub}>SZL Holdings Intelligence</Text>
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
              <View style={[styles.copilotIcon, { backgroundColor: ACCENT + "20", borderColor: ACCENT + "40" }]}>
                <Feather name="cpu" size={22} color={ACCENT} />
              </View>
              <View>
                <Text style={styles.copilotTitle}>SZL AI Copilot</Text>
                <Text style={styles.copilotDesc}>Portfolio intelligence • Cross-domain analysis • Decisions</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.3)" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setBriefingVisible(true)} style={styles.briefingCard} activeOpacity={0.85}>
          <View style={styles.briefingInner}>
            <View style={[styles.briefingIcon, { backgroundColor: ACCENT + "20" }]}>
              <Feather name="volume-2" size={20} color={ACCENT} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.briefingTitle}>Executive Voice Briefing</Text>
              <Text style={styles.briefingDesc}>AI generates & narrates your full portfolio summary on demand</Text>
            </View>
            <Feather name="play" size={16} color={ACCENT} />
          </View>
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>Portfolio Status</Text>
        {[
          { label: "Total AUM", status: "$2.847B", color: ACCENT },
          { label: "YTD Performance", status: "+14.2%", color: "#10b981" },
          { label: "Pending Approvals", status: "3 Items", color: "#f59e0b" },
          { label: "Critical Alerts", status: "2 Active", color: "#ef4444" },
          { label: "Network", status: isOnline ? "Online" : "Offline", color: isOnline ? "#10b981" : "#f59e0b" },
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
        agentName="SZL"
        agentId="szl"
        accentColor={ACCENT}
        welcomeMessage="SZL Holdings AI online. I have full visibility across all 6 operating companies. Total AUM $2.847B. What requires your attention today?"
        suggestions={[
          "Summarize today's portfolio performance",
          "What approvals need my attention?",
          "Show cross-domain risk signals",
          "Generate board briefing",
        ]}
      />

      <VoiceBriefingModal
        visible={briefingVisible}
        onClose={() => setBriefingVisible(false)}
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
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: BORDER },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: "600" },
  sectionLabel: { fontSize: 9, fontWeight: "700", color: "rgba(255,255,255,0.25)", letterSpacing: 1.2, textTransform: "uppercase", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6 },
  copilotCard: { margin: 14, marginBottom: 8, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: ACCENT + "30", backgroundColor: CARD },
  copilotInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  copilotLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  copilotIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  copilotTitle: { fontSize: 15, fontWeight: "700", color: "#fff", marginBottom: 2 },
  copilotDesc: { fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 15 },
  briefingCard: { marginHorizontal: 14, marginBottom: 8, borderRadius: 16, borderWidth: 1, borderColor: ACCENT + "40", backgroundColor: CARD },
  briefingInner: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16 },
  briefingIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  briefingTitle: { fontSize: 14, fontWeight: "700", color: "#fff", marginBottom: 2 },
  briefingDesc: { fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 15 },
  statusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: BORDER },
  statusLabel: { fontSize: 12, color: "rgba(255,255,255,0.55)" },
  statusRight: { flexDirection: "row", alignItems: "center", gap: 5 },
  statusIndicator: { width: 5, height: 5, borderRadius: 3 },
  statusValue: { fontSize: 11, fontWeight: "600" },
});
