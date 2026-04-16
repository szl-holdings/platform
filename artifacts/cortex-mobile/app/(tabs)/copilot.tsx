import React, { useState, useRef } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWorkspace } from "@/context/WorkspaceContext";
import { CORTEX_COLORS } from "@/constants/colors";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const WELCOME_MESSAGES: Record<string, string> = {
  defense: "I'm Sentinel, your SOC intelligence analyst. Ask about threats, incidents, or compliance posture.",
  fleet: "I'm Helmsman, your maritime operations copilot. Ask about fleet status, routes, or maintenance schedules.",
  properties: "I'm Terrain, your real estate intelligence assistant. Ask about properties, market trends, or deal analysis.",
  operations: "I'm Lyte Ops, your business observability copilot. Ask about service health, deployments, or cost optimization.",
  advisory: "I'm Muse, your advisory practice assistant. Ask about clients, sessions, or engagement strategy.",
  portfolio: "I'm Navigator, your executive command copilot. Ask about portfolio performance, compliance, or board prep.",
  founder: "I'm Stephen AI, your personal assistant. Ask about articles, ventures, or upcoming events.",
};

export default function CopilotScreen() {
  const insets = useSafeAreaInsets();
  const { config, activeWorkspace } = useWorkspace();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const welcomeMessage = WELCOME_MESSAGES[activeWorkspace] ?? "How can I help?";

  const getResponse = (workspace: string, query: string): string => {
    const q = query.toLowerCase();
    const responses: Record<string, string[]> = {
      defense: [
        "Current threat posture: 2 active P1 incidents under containment. SOC team engaged on APT29 lateral movement — containment at 87%. SIEM showing 94% reduction in false positives post-tuning.",
        "Compliance status: SOC 2 Type II audit in progress, 91% controls passed. 3 remediation items open with target closure by end of quarter.",
        "No active critical incidents. Last 24h: 14 alerts triaged, 12 auto-resolved. Threat hunting queue: 3 campaigns active.",
      ],
      fleet: [
        "Fleet status: 23 vessels active, 2 in port, 1 undergoing scheduled maintenance. AIS coverage nominal across all monitored routes.",
        "Route optimization analysis complete. Current fuel efficiency is 4.2% above benchmark. No adverse weather in primary shipping lanes.",
        "Dark fleet activity detected: 2 vessels showing AIS gap exceeding 8h in the Black Sea corridor. Behavioral analysis flagged for review.",
      ],
      properties: [
        "Portfolio overview: 847 active listings, 12 pending closings this month. Miami Beach micro-market showing 8.3% YoY appreciation above model forecast.",
        "Market signals: Cap rate compression continuing in Class A multifamily. 3 distress opportunities flagged in NYC portfolio scan.",
        "Deal pipeline: 4 assets in due diligence, 2 LOIs outstanding. Projected Q2 deployment: $42M.",
      ],
      operations: [
        "System health: 99.97% uptime across all services. API gateway latency at 48ms P99. No active incidents.",
        "Cost anomaly detected: GPU cluster spend up 34% week-over-week. Usage spike traced to model evaluation jobs. Reviewing optimization options.",
        "Deployment summary: 8 releases today, all green. Rollback rate: 0%. Next scheduled maintenance window: Sunday 02:00 UTC.",
      ],
      advisory: [
        "Client overview: 18 active engagements. 3 deliverables due this week. Q2 pipeline: $2.8M in qualified opportunities.",
        "Upcoming sessions: 4 client calls scheduled today. Preparation materials for Meridian Capital briefing are ready for review.",
        "Engagement health: 2 accounts flagged for check-in — response time trending above SLA. Recommend outreach this week.",
      ],
      portfolio: [
        "Portfolio performance: +22% YTD across all holdings. Top performer: Vessels Maritime (+34%). Aegis Security on track for Series B milestones.",
        "Board prep: Next meeting in 11 days. Deck 80% complete. 3 action items from last session still open.",
        "Fund activity: $3.2M deployed this quarter. 2 new term sheets under review. Liquidity position: strong.",
      ],
      founder: [
        "Personal command overview: 3 priority articles in draft, 2 venture meetings this week, 4 investor updates due end of month.",
        "Content performance: Last article reached 12,400 views. LinkedIn engagement up 18% this quarter.",
        "Venture pipeline: 2 new deals in screening, 1 in final due diligence. Advisory board expansion discussion pending.",
      ],
    };
    const pool = responses[workspace] ?? responses.portfolio;
    const idx = Math.abs(q.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % pool.length;
    return pool[idx];
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: input.trim(), timestamp: new Date() };
    const assistantMsg: Message = {
      id: `a-${Date.now()}`,
      role: "assistant",
      content: getResponse(activeWorkspace, input.trim()),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput("");
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <View style={[styles.copilotAvatar, { backgroundColor: `${config.accentColor}20` }]}>
          <Text style={styles.copilotAvatarIcon}>{config.copilotIcon}</Text>
        </View>
        <View>
          <Text style={[styles.headerName, { color: config.accentColor }]}>{config.copilotName}</Text>
          <Text style={styles.headerSub}>{config.label} Copilot</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, flexGrow: 1 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>{config.copilotIcon}</Text>
            <Text style={styles.emptyTitle}>{config.copilotName}</Text>
            <Text style={styles.emptyText}>{welcomeMessage}</Text>
            <View style={styles.suggestedContainer}>
              {[`What needs attention in ${config.shortLabel}?`, "Summarize today's activity", "Any critical alerts?"].map((q, i) => (
                <Pressable key={i} style={[styles.suggestedChip, { borderColor: `${config.accentColor}30` }]} onPress={() => { setInput(q); }}>
                  <Text style={styles.suggestedText}>{q}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.messageBubble, item.role === "user" ? styles.userBubble : [styles.assistantBubble, { borderColor: `${config.accentColor}20` }]]}>
            {item.role === "assistant" && <Text style={[styles.bubbleRole, { color: config.accentColor }]}>{config.copilotName}</Text>}
            <Text style={styles.bubbleText}>{item.content}</Text>
          </View>
        )}
      />

      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder={`Ask ${config.copilotName}...`}
          placeholderTextColor={CORTEX_COLORS.textMuted}
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        <Pressable style={[styles.sendButton, { backgroundColor: input.trim() ? config.accentColor : `${config.accentColor}30` }]} onPress={handleSend}>
          <Text style={styles.sendIcon}>↑</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CORTEX_COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: CORTEX_COLORS.borderLight },
  copilotAvatar: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  copilotAvatarIcon: { fontSize: 20 },
  headerName: { fontSize: 17, fontWeight: "700" },
  headerSub: { fontSize: 12, color: CORTEX_COLORS.textMuted },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 24, fontWeight: "700", color: CORTEX_COLORS.text, marginBottom: 8 },
  emptyText: { fontSize: 14, color: CORTEX_COLORS.textSecondary, textAlign: "center", lineHeight: 20 },
  suggestedContainer: { marginTop: 24, gap: 8, width: "100%" },
  suggestedChip: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, backgroundColor: CORTEX_COLORS.bgCard },
  suggestedText: { fontSize: 14, color: CORTEX_COLORS.text },
  messageBubble: { maxWidth: "85%", padding: 14, borderRadius: 16, marginBottom: 8 },
  userBubble: { alignSelf: "flex-end", backgroundColor: "#1a2332" },
  assistantBubble: { alignSelf: "flex-start", backgroundColor: CORTEX_COLORS.bgCard, borderWidth: 1 },
  bubbleRole: { fontSize: 11, fontWeight: "700", marginBottom: 4, letterSpacing: 0.5 },
  bubbleText: { fontSize: 14, color: CORTEX_COLORS.text, lineHeight: 20 },
  inputContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 8, gap: 8, borderTopWidth: 1, borderTopColor: CORTEX_COLORS.borderLight, backgroundColor: CORTEX_COLORS.bgElevated },
  input: { flex: 1, height: 44, borderRadius: 22, paddingHorizontal: 16, backgroundColor: CORTEX_COLORS.bgCard, color: CORTEX_COLORS.text, fontSize: 15, borderWidth: 1, borderColor: CORTEX_COLORS.borderLight },
  sendButton: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  sendIcon: { fontSize: 18, fontWeight: "700", color: "#080B12" },
});
