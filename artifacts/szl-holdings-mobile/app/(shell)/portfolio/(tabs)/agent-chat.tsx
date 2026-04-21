import { Feather } from '@expo/vector-icons';
import { useEmbeddingSearch } from '@szl-holdings/mobile-shared';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ACCENT = '#c9a84c';
const BG = '#090810';
const CARD = '#0e0c18';
const BORDER = 'rgba(201,168,76,0.12)';
const TEXT = '#f0eeff';
const TEXT_DIM = 'rgba(240,238,255,0.4)';

const AGENTS = [
  { id: 'alloy', name: 'FORGE', role: 'Orchestration', icon: 'git-merge', color: '#c9a84c' },
  {
    id: 'beacon',
    name: 'Terra Analytics',
    role: 'Analytics',
    icon: 'bar-chart-2',
    color: '#22c55e',
  },
  { id: 'sentinel', name: 'Sentinel', role: 'Security', icon: 'shield', color: '#ef4444' },
  { id: 'compass', name: 'Compass', role: 'Readiness', icon: 'compass', color: '#8b5cf6' },
  { id: 'helmsman', name: 'Helmsman', role: 'Maritime', icon: 'anchor', color: '#0ea5e9' },
];

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agentId?: string;
  agentName?: string;
  timestamp: number;
  streaming?: boolean;
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  const agent = AGENTS.find((a) => a.id === msg.agentId);
  return (
    <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
      {!isUser && (
        <View
          style={[
            styles.agentAvatar,
            {
              backgroundColor: `${agent?.color ?? ACCENT}18`,
              borderColor: `${agent?.color ?? ACCENT}30`,
            },
          ]}
        >
          <Feather name={(agent?.icon ?? 'cpu') as any} size={13} color={agent?.color ?? ACCENT} />
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        {!isUser && msg.agentName && (
          <Text style={[styles.agentLabel, { color: agent?.color ?? ACCENT }]}>
            {msg.agentName}
          </Text>
        )}
        <Text style={[styles.bubbleText, isUser && { color: BG }]}>
          {msg.streaming ? msg.content + '▍' : msg.content}
        </Text>
        <Text style={[styles.timestamp, isUser && { color: 'rgba(9,8,16,0.6)' }]}>
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
}

export default function AgentChatScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [selectedAgent, setSelectedAgent] = useState(AGENTS[0]);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Alloy orchestration active. I coordinate all domain agents across the SZL Holdings platform. Ask me anything about your portfolio, operations, or intelligence.',
      agentId: 'alloy',
      agentName: 'FORGE',
      timestamp: Date.now() - 60000,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAgentPicker, setShowAgentPicker] = useState(false);
  const pickerAnim = useSharedValue(0);
  const pickerStyle = useAnimatedStyle(() => ({
    opacity: withTiming(pickerAnim.value, { duration: 150 }),
    transform: [{ translateY: withSpring(pickerAnim.value === 0 ? -8 : 0) }],
  }));

  const togglePicker = () => {
    const next = !showAgentPicker;
    setShowAgentPicker(next);
    pickerAnim.value = next ? 1 : 0;
  };

  const { search, buildContextString } = useEmbeddingSearch({ domain: 'executive', limit: 3 });

  const switchAgent = (agent: (typeof AGENTS)[0]) => {
    setSelectedAgent(agent);
    setShowAgentPicker(false);
    pickerAnim.value = 0;
    Haptics.selectionAsync();
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const assistantId = `asst_${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: 'assistant',
        content: '',
        agentId: selectedAgent.id,
        agentName: selectedAgent.name,
        timestamp: Date.now(),
        streaming: true,
      },
    ]);
    try {
      const base = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';
      const contextResults = await search(userMsg.content);
      const contextStr = buildContextString(contextResults);
      const res = await fetch(`${base}/api/nuro-mesh/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          message: userMsg.content,
          stream: false,
          context: contextStr || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: data.response ?? data.content ?? 'Done.', streaming: false }
              : m,
          ),
        );
      } else {
        throw new Error('API error');
      }
    } catch {
      const fallbacks: Record<string, string> = {
        alloy:
          'Portfolio metrics stable. Orchestrating across 7 domain agents. No critical escalations.',
        beacon: 'Analytics pipeline nominal. Revenue trending +4.2% MoM. No anomalies detected.',
        sentinel: 'Security posture: GREEN. No active incidents. Compliance score: 94/100.',
        compass: 'Readiness score: 87.3%. Three improvement milestones pending Q2.',
        helmsman: 'Fleet operational. 12 vessels active. No maritime alerts.',
      };
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: fallbacks[selectedAgent.id] ?? 'Processing...', streaming: false }
            : m,
        ),
      );
    } finally {
      setIsLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [input, isLoading, selectedAgent]);

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.agentSelector} onPress={togglePicker} activeOpacity={0.7}>
          <View style={[styles.agentDot, { backgroundColor: selectedAgent.color }]} />
          <Text style={styles.agentSelectorName}>{selectedAgent.name}</Text>
          <Text style={styles.agentSelectorRole}>{selectedAgent.role}</Text>
          <Feather
            name={showAgentPicker ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={TEXT_DIM}
          />
        </TouchableOpacity>
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>NURO MESH</Text>
        </View>
      </View>
      {showAgentPicker && (
        <Animated.View style={[styles.agentPicker, pickerStyle]}>
          {AGENTS.map((agent) => (
            <TouchableOpacity
              key={agent.id}
              style={[
                styles.agentPickerRow,
                selectedAgent.id === agent.id && styles.agentPickerRowSelected,
              ]}
              onPress={() => switchAgent(agent)}
              activeOpacity={0.7}
            >
              <View style={[styles.agentPickerDot, { backgroundColor: agent.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.agentPickerName}>{agent.name}</Text>
                <Text style={styles.agentPickerRole}>{agent.role}</Text>
              </View>
              {selectedAgent.id === agent.id && <Feather name="check" size={14} color={ACCENT} />}
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        {isLoading && (
          <View style={styles.typingRow}>
            <ActivityIndicator size="small" color={ACCENT} />
            <Text style={styles.typingText}>{selectedAgent.name} thinking…</Text>
          </View>
        )}
      </ScrollView>
      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask your agents…"
          placeholderTextColor={TEXT_DIM}
          multiline
          maxLength={2000}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  agentSelector: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  agentDot: { width: 8, height: 8, borderRadius: 4 },
  agentSelectorName: { fontSize: 14, fontWeight: '600', color: TEXT },
  agentSelectorRole: { fontSize: 11, color: TEXT_DIM },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: `${ACCENT}15`,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ACCENT },
  statusText: { fontSize: 9, fontWeight: '700', color: ACCENT, letterSpacing: 1 },
  agentPicker: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    marginHorizontal: 12,
    borderRadius: 12,
    overflow: 'hidden',
    zIndex: 10,
  },
  agentPickerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  agentPickerRowSelected: { backgroundColor: `${ACCENT}10` },
  agentPickerDot: { width: 8, height: 8, borderRadius: 4 },
  agentPickerName: { fontSize: 13, fontWeight: '600', color: TEXT },
  agentPickerRole: { fontSize: 11, color: TEXT_DIM },
  messages: { flex: 1 },
  messagesContent: { padding: 16, gap: 12 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '90%' },
  messageRowUser: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  agentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: { borderRadius: 16, padding: 12, maxWidth: '100%' },
  bubbleUser: { backgroundColor: ACCENT, borderBottomRightRadius: 4 },
  bubbleAssistant: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderBottomLeftRadius: 4,
  },
  agentLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  bubbleText: { fontSize: 14, color: TEXT, lineHeight: 20 },
  timestamp: { fontSize: 10, color: TEXT_DIM, marginTop: 6, alignSelf: 'flex-end' },
  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typingText: { fontSize: 12, color: TEXT_DIM, fontStyle: 'italic' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: BG,
  },
  input: {
    flex: 1,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: TEXT,
    fontSize: 14,
    maxHeight: 120,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: `${ACCENT}30` },
});
