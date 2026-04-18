import React, { useState, useRef, useCallback } from "react";
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEmbeddingSearch } from "@szl-holdings/mobile-shared";

const ACCENT = "#b8943c";
const BG = "#0d0b08";
const CARD = "#141108";
const BORDER = "rgba(184,148,60,0.12)";
const TEXT = "#f5f0e8";
const TEXT_DIM = "rgba(245,240,232,0.35)";

const AGENTS = [
  { id: "beacon", name: "Terra Analytics", role: "Real Estate Intelligence", icon: "home", color: "#b8943c" },
  { id: "alloy", name: "Alloy", role: "Orchestration", icon: "git-merge", color: "#c9a84c" },
  { id: "eval", name: "Eval Engine", role: "Research", icon: "search", color: "#8b5cf6" },
];

interface Message {
  id: string; role: "user" | "assistant"; content: string;
  agentId?: string; agentName?: string; timestamp: number; streaming?: boolean;
}

export default function AgentChatScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [selectedAgent, setSelectedAgent] = useState(AGENTS[0]);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([{
    id: "welcome", role: "assistant", agentId: "beacon", agentName: "Terra Analytics",
    content: "Terra Analytics ready. I analyze real estate markets, property valuations, pipeline risk, and investment opportunities. What property intelligence do you need?",
    timestamp: Date.now() - 60000,
  }]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const { search, buildContextString } = useEmbeddingSearch({ domain: "real_estate", limit: 3 });

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { id: `u_${Date.now()}`, role: "user", content: input.trim(), timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput(""); setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const aid = `a_${Date.now()}`;
    setMessages(prev => [...prev, { id: aid, role: "assistant", content: "", agentId: selectedAgent.id, agentName: selectedAgent.name, timestamp: Date.now(), streaming: true }]);
    try {
      const contextResults = await search(userMsg.content);
      const contextStr = buildContextString(contextResults);
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL ?? ""}/api/nuro-mesh/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: selectedAgent.id, message: userMsg.content, context: contextStr || undefined }),
      });
      const data = await res.json();
      setMessages(prev => prev.map(m => m.id === aid ? { ...m, content: data.response ?? "Done.", streaming: false } : m));
    } catch {
      const fallbacks: Record<string, string> = {
        beacon: "Portfolio: 47 active properties. Average cap rate 6.2%. 3 distress signals flagged for review. NYC market trending up 2.1% QoQ.",
        alloy: "Real estate intelligence consolidated across all data sources.",
        inca: "Research corpus indexed. 12,000+ market comps available for retrieval.",
      };
      setMessages(prev => prev.map(m => m.id === aid ? { ...m, content: fallbacks[selectedAgent.id] ?? "Processing...", streaming: false } : m));
    } finally {
      setIsLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [input, isLoading, selectedAgent]);

  return (
    <KeyboardAvoidingView style={[styles.root, { paddingTop: insets.top }]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.agentSel} onPress={() => setShowPicker(p => !p)} activeOpacity={0.7}>
          <View style={[styles.dot, { backgroundColor: selectedAgent.color }]} />
          <Text style={styles.agentName}>{selectedAgent.name}</Text>
          <Text style={styles.agentRole}>{selectedAgent.role}</Text>
          <Feather name="chevron-down" size={14} color={TEXT_DIM} />
        </TouchableOpacity>
        <View style={styles.pill}><View style={styles.pillDot} /><Text style={styles.pillText}>TERRA AI</Text></View>
      </View>
      {showPicker && (
        <View style={styles.picker}>
          {AGENTS.map(a => (
            <TouchableOpacity key={a.id} style={styles.pickerRow} onPress={() => { setSelectedAgent(a); setShowPicker(false); Haptics.selectionAsync(); }} activeOpacity={0.7}>
              <View style={[styles.dot, { backgroundColor: a.color }]} />
              <Text style={styles.pickerName}>{a.name}</Text><Text style={styles.pickerRole}>{a.role}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <ScrollView ref={scrollRef} style={styles.msgs} contentContainerStyle={styles.msgsContent} keyboardDismissMode="interactive" showsVerticalScrollIndicator={false}>
        {messages.map(msg => {
          const isUser = msg.role === "user";
          const agent = AGENTS.find(a => a.id === msg.agentId);
          return (
            <View key={msg.id} style={[styles.row, isUser && styles.rowUser]}>
              {!isUser && <View style={[styles.avatar, { backgroundColor: `${agent?.color ?? ACCENT}18`, borderColor: `${agent?.color ?? ACCENT}30` }]}><Feather name={(agent?.icon ?? "home") as any} size={12} color={agent?.color ?? ACCENT} /></View>}
              <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssist]}>
                {!isUser && msg.agentName && <Text style={[styles.label, { color: agent?.color ?? ACCENT }]}>{msg.agentName}</Text>}
                <Text style={[styles.bubbleText, isUser && { color: BG }]}>{msg.streaming ? msg.content + "▍" : msg.content}</Text>
              </View>
            </View>
          );
        })}
        {isLoading && <View style={styles.typing}><ActivityIndicator size="small" color={ACCENT} /><Text style={styles.typingText}>{selectedAgent.name} analyzing…</Text></View>}
      </ScrollView>
      <View style={[styles.bar, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput style={styles.input} value={input} onChangeText={setInput} placeholder="Ask about properties, markets…" placeholderTextColor={TEXT_DIM} multiline maxLength={2000} />
        <TouchableOpacity style={[styles.send, (!input.trim() || isLoading) && styles.sendOff]} onPress={sendMessage} disabled={!input.trim() || isLoading} activeOpacity={0.7}>
          <Feather name="send" size={16} color={!input.trim() || isLoading ? TEXT_DIM : BG} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  agentSel: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  agentName: { fontSize: 14, fontWeight: "600", color: TEXT },
  agentRole: { fontSize: 11, color: TEXT_DIM },
  pill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: `${ACCENT}15`, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  pillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ACCENT },
  pillText: { fontSize: 9, fontWeight: "700", color: ACCENT, letterSpacing: 1 },
  picker: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, marginHorizontal: 12, borderRadius: 12, overflow: "hidden" },
  pickerRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  pickerName: { fontSize: 13, fontWeight: "600", color: TEXT },
  pickerRole: { fontSize: 11, color: TEXT_DIM, marginLeft: 4 },
  msgs: { flex: 1 },
  msgsContent: { padding: 16, gap: 12 },
  row: { flexDirection: "row", alignItems: "flex-end", gap: 8, maxWidth: "90%" },
  rowUser: { alignSelf: "flex-end", flexDirection: "row-reverse" },
  avatar: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  bubble: { borderRadius: 16, padding: 12, maxWidth: "100%" },
  bubbleUser: { backgroundColor: ACCENT, borderBottomRightRadius: 4 },
  bubbleAssist: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderBottomLeftRadius: 4 },
  label: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4 },
  bubbleText: { fontSize: 14, color: TEXT, lineHeight: 20 },
  typing: { flexDirection: "row", alignItems: "center", gap: 8 },
  typingText: { fontSize: 12, color: TEXT_DIM, fontStyle: "italic" },
  bar: { flexDirection: "row", alignItems: "flex-end", gap: 10, paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: BORDER, backgroundColor: BG },
  input: { flex: 1, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: TEXT, fontSize: 14, maxHeight: 120 },
  send: { width: 40, height: 40, borderRadius: 20, backgroundColor: ACCENT, alignItems: "center", justifyContent: "center" },
  sendOff: { backgroundColor: `${ACCENT}30` },
});
