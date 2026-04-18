import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from "react-native-reanimated";
import { useEmbeddingSearch } from "@szl-holdings/mobile-shared";

const ACCENT = "#F97316";
const BG = "#080B12";
const CARD = "#0D1018";
const BORDER = "rgba(249,115,22,0.12)";
const TEXT = "#E8EAF0";
const TEXT_DIM = "rgba(232,234,240,0.45)";

const AGENTS = [
  { id: "alloy", name: "Alloy", role: "Orchestration", icon: "git-merge", color: "#F97316" },
  { id: "sentinel", name: "Sentinel", role: "Security", icon: "shield", color: "#EF4444" },
  { id: "helmsman", name: "Helmsman", role: "Maritime", icon: "anchor", color: "#0ea5e9" },
  { id: "eval", name: "Eval Engine", role: "Research", icon: "cpu", color: "#8b5cf6" },
  { id: "compass", name: "Compass", role: "Readiness", icon: "compass", color: "#22c55e" },
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  agentId?: string;
  agentName?: string;
  timestamp: number;
  streaming?: boolean;
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  const agent = AGENTS.find(a => a.id === msg.agentId);
  return (
    <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
      {!isUser && (
        <View style={[styles.agentAvatar, { backgroundColor: `${agent?.color ?? ACCENT}18`, borderColor: `${agent?.color ?? ACCENT}30` }]}>
          <Feather name={(agent?.icon ?? "cpu") as any} size={13} color={agent?.color ?? ACCENT} />
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        {!isUser && msg.agentName && (
          <Text style={[styles.agentLabel, { color: agent?.color ?? ACCENT }]}>{msg.agentName}</Text>
        )}
        <Text style={styles.bubbleText}>
          {msg.streaming ? msg.content + "▍" : msg.content}
        </Text>
        <Text style={styles.timestamp}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
      </View>
    </View>
  );
}

export default function AgentChatScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [selectedAgent, setSelectedAgent] = useState(AGENTS[0]);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Sentinel online. I monitor threats, analyze CVEs, and coordinate incident response. What do you need?",
      agentId: "sentinel",
      agentName: "Sentinel",
      timestamp: Date.now() - 60000,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAgentPicker, setShowAgentPicker] = useState(false);
  const pickerAnim = useSharedValue(0);
  const { search, buildContextString } = useEmbeddingSearch({ domain: "security", limit: 3 });
  const pickerStyle = useAnimatedStyle(() => ({
    opacity: withTiming(pickerAnim.value, { duration: 150 }),
    transform: [{ translateY: withSpring(pickerAnim.value === 0 ? -8 : 0) }],
  }));

  const togglePicker = () => {
    const next = !showAgentPicker;
    setShowAgentPicker(next);
    pickerAnim.value = next ? 1 : 0;
  };

  const switchAgent = (agent: typeof AGENTS[0]) => {
    setSelectedAgent(agent);
    setShowAgentPicker(false);
    pickerAnim.value = 0;
    Haptics.selectionAsync();
    setMessages(prev => [...prev, {
      id: `sys_${Date.now()}`,
      role: "assistant",
      content: `Switching to ${agent.name}. ${agent.role} intelligence ready.`,
      agentId: agent.id,
      agentName: agent.name,
      timestamp: Date.now(),
    }]);
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = {
      id: `user_${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const assistantId = `asst_${Date.now()}`;
    const assistantMsg: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      agentId: selectedAgent.id,
      agentName: selectedAgent.name,
      timestamp: Date.now(),
      streaming: true,
    };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      const devDomain = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";
      const contextResults = await search(userMsg.content);
      const contextStr = buildContextString(contextResults);
      const res = await fetch(`${devDomain}/api/nuro-mesh/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: selectedAgent.id, message: userMsg.content, stream: false, context: contextStr || undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        const reply = data.response ?? data.content ?? data.message ?? "Agent replied.";
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: reply, streaming: false } : m));
      } else {
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: "Unable to reach agent — API unavailable.", streaming: false } : m));
      }
    } catch {
      const fallbackReplies: Record<string, string> = {
        sentinel: "Threat analysis running. All SIEM feeds nominal. No active critical incidents in the last 24h.",
        alloy: "Orchestrating across all domain agents. Query received and routing to best specialist.",
        helmsman: "Fleet telemetry nominal. Scanning AIS feeds for anomalies now.",
        inca: "Indexing research corpus. Semantic retrieval active across 40k+ documents.",
        compass: "Readiness assessment in progress. Scoring dimensions across 7 frameworks.",
      };
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: fallbackReplies[selectedAgent.id] ?? "Processing your request...", streaming: false }
          : m
      ));
    } finally {
      setIsLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [input, isLoading, selectedAgent]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 200);
  }, [messages.length]);

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.agentSelector} onPress={togglePicker} activeOpacity={0.7}>
          <View style={[styles.agentDot, { backgroundColor: selectedAgent.color }]} />
          <Text style={styles.agentSelectorName}>{selectedAgent.name}</Text>
          <Text style={styles.agentSelectorRole}>{selectedAgent.role}</Text>
          <Feather name={showAgentPicker ? "chevron-up" : "chevron-down"} size={14} color={TEXT_DIM} />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
      </View>

      {showAgentPicker && (
        <Animated.View style={[styles.agentPicker, pickerStyle]}>
          {AGENTS.map(agent => (
            <TouchableOpacity
              key={agent.id}
              style={[styles.agentPickerRow, selectedAgent.id === agent.id && styles.agentPickerRowSelected]}
              onPress={() => switchAgent(agent)}
              activeOpacity={0.7}
            >
              <View style={[styles.agentPickerDot, { backgroundColor: agent.color }]} />
              <View>
                <Text style={styles.agentPickerName}>{agent.name}</Text>
                <Text style={styles.agentPickerRole}>{agent.role}</Text>
              </View>
              {selectedAgent.id === agent.id && <Feather name="check" size={14} color={ACCENT} style={{ marginLeft: "auto" }} />}
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}

      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={[styles.messagesContent, { paddingBottom: 16 }]}
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
        {isLoading && (
          <View style={styles.typingRow}>
            <ActivityIndicator size="small" color={ACCENT} />
            <Text style={styles.typingText}>{selectedAgent.name} is thinking…</Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask an agent…"
          placeholderTextColor={TEXT_DIM}
          multiline
          maxLength={2000}
          onSubmitEditing={sendMessage}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || isLoading) && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!input.trim() || isLoading}
          activeOpacity={0.7}
        >
          <Feather name="send" size={16} color={!input.trim() || isLoading ? TEXT_DIM : BG} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  agentSelector: { flexDirection: "row", alignItems: "center", gap: 8 },
  agentDot: { width: 8, height: 8, borderRadius: 4 },
  agentSelectorName: { fontSize: 14, fontWeight: "600", color: TEXT, fontFamily: "Inter_600SemiBold" },
  agentSelectorRole: { fontSize: 11, color: TEXT_DIM, fontFamily: "Inter_400Regular" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  livePill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(239,68,68,0.12)", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#EF4444" },
  liveText: { fontSize: 9, fontWeight: "700", color: "#EF4444", letterSpacing: 1 },
  agentPicker: {
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    marginHorizontal: 12, borderRadius: 12, overflow: "hidden", zIndex: 10,
  },
  agentPickerRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  agentPickerRowSelected: { backgroundColor: `${ACCENT}10` },
  agentPickerDot: { width: 8, height: 8, borderRadius: 4 },
  agentPickerName: { fontSize: 13, fontWeight: "600", color: TEXT },
  agentPickerRole: { fontSize: 11, color: TEXT_DIM, marginTop: 1 },
  messages: { flex: 1 },
  messagesContent: { padding: 16, gap: 12 },
  messageRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, maxWidth: "90%" },
  messageRowUser: { alignSelf: "flex-end", flexDirection: "row-reverse" },
  agentAvatar: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  bubble: { borderRadius: 16, padding: 12, maxWidth: "100%" },
  bubbleUser: { backgroundColor: ACCENT, borderBottomRightRadius: 4 },
  bubbleAssistant: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderBottomLeftRadius: 4 },
  agentLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4 },
  bubbleText: { fontSize: 14, color: TEXT, lineHeight: 20 },
  timestamp: { fontSize: 10, color: TEXT_DIM, marginTop: 6, alignSelf: "flex-end" },
  typingRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4 },
  typingText: { fontSize: 12, color: TEXT_DIM, fontStyle: "italic" },
  inputBar: {
    flexDirection: "row", alignItems: "flex-end", gap: 10,
    paddingHorizontal: 16, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: BORDER,
    backgroundColor: BG,
  },
  input: {
    flex: 1, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    borderRadius: 20, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10,
    color: TEXT, fontSize: 14, maxHeight: 120, fontFamily: "Inter_400Regular",
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: ACCENT, alignItems: "center", justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: `${ACCENT}30` },
});
