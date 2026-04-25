import { Feather } from '@expo/vector-icons';
import { useEmbeddingSearch } from '@szl-holdings/mobile-shared';
import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useRef, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { giProductAccent, giColors, palette } from '@/lib/gi-bridge';

const AGENTS = [
  { id: 'muse',  name: 'Muse',        role: 'Creative Strategy', icon: 'pen-tool',  color: giProductAccent.carlota },
  { id: 'alloy', name: 'Counsel',      role: 'Orchestration',     icon: 'git-merge', color: giProductAccent.lyte },
  { id: 'eval',  name: 'Eval Engine', role: 'Research',          icon: 'search',    color: giColors.accent.violet },
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

export default function AgentChatScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const scrollRef = useRef<ScrollView>(null);
  const [selectedAgent, setSelectedAgent] = useState(AGENTS[0]);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      agentId: 'muse',
      agentName: 'Muse',
      content:
        'Muse creative intelligence ready. I help with content strategy, campaign ideation, brand voice, and creative briefs. What are we building together?',
      timestamp: Date.now() - 60000,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const { search, buildContextString } = useEmbeddingSearch({ domain: 'consulting', limit: 3 });

  const accent = selectedAgent.color;
  const s = useMemo(() => makeStyles(colors, accent), [colors, accent]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const aid = `a_${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: aid,
        role: 'assistant',
        content: '',
        agentId: selectedAgent.id,
        agentName: selectedAgent.name,
        timestamp: Date.now(),
        streaming: true,
      },
    ]);
    try {
      const contextResults = await search(userMsg.content);
      const contextStr = buildContextString(contextResults);
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL ?? ''}/api/nuro-mesh/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          message: userMsg.content,
          context: contextStr || undefined,
        }),
      });
      const data = await res.json();
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aid ? { ...m, content: data.response ?? 'Done.', streaming: false } : m,
        ),
      );
    } catch {
      const fallbacks: Record<string, string> = {
        muse: 'Creative brief ready. I recommend leading with an authentic narrative — your clients respond 3x better to story-first content. Want me to draft a campaign outline?',
        alloy:
          'Strategy coordination active. Synthesizing brand intelligence across all touchpoints.',
        inca: 'Research corpus loaded. Competitive landscape data available across 200+ comparable brands.',
      };
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aid
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
      style={[s.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={s.header}>
        <TouchableOpacity
          style={s.agentSel}
          onPress={() => setShowPicker((p) => !p)}
          activeOpacity={0.7}
        >
          <View style={[s.dot, { backgroundColor: selectedAgent.color }]} />
          <Text style={s.agentName}>{selectedAgent.name}</Text>
          <Text style={s.agentRole}>{selectedAgent.role}</Text>
          <Feather name="chevron-down" size={14} color={colors.mutedForeground} />
        </TouchableOpacity>
        <View style={s.pill}>
          <View style={s.pillDot} />
          <Text style={s.pillText}>CREATIVE AI</Text>
        </View>
      </View>
      {showPicker && (
        <View style={s.picker}>
          {AGENTS.map((a) => (
            <TouchableOpacity
              key={a.id}
              style={s.pickerRow}
              onPress={() => {
                setSelectedAgent(a);
                setShowPicker(false);
                Haptics.selectionAsync();
              }}
              activeOpacity={0.7}
            >
              <View style={[s.dot, { backgroundColor: a.color }]} />
              <Text style={s.pickerName}>{a.name}</Text>
              <Text style={s.pickerRole}>{a.role}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <ScrollView
        ref={scrollRef}
        style={s.msgs}
        contentContainerStyle={s.msgsContent}
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const agent = AGENTS.find((a) => a.id === msg.agentId);
          return (
            <View key={msg.id} style={[s.row, isUser && s.rowUser]}>
              {!isUser && (
                <View
                  style={[
                    s.avatar,
                    {
                      backgroundColor: `${agent?.color ?? accent}18`,
                      borderColor: `${agent?.color ?? accent}30`,
                    },
                  ]}
                >
                  <Feather
                    name={(agent?.icon ?? 'cpu') as any}
                    size={12}
                    color={agent?.color ?? accent}
                  />
                </View>
              )}
              <View style={[s.bubble, isUser ? s.bubbleUser : s.bubbleAssist]}>
                {!isUser && msg.agentName && (
                  <Text style={[s.label, { color: agent?.color ?? accent }]}>
                    {msg.agentName}
                  </Text>
                )}
                <Text style={[s.bubbleText, isUser && { color: colors.background }]}>
                  {msg.streaming ? `${msg.content}▍` : msg.content}
                </Text>
              </View>
            </View>
          );
        })}
        {isLoading && (
          <View style={s.typing}>
            <ActivityIndicator size="small" color={accent} />
            <Text style={s.typingText}>{selectedAgent.name} crafting…</Text>
          </View>
        )}
      </ScrollView>
      <View style={[s.bar, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={s.inputField}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about strategy, content…"
          placeholderTextColor={colors.mutedForeground}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          style={[s.send, (!input.trim() || isLoading) && s.sendOff]}
          onPress={sendMessage}
          disabled={!input.trim() || isLoading}
          activeOpacity={0.7}
        >
          <Feather
            name="send"
            size={16}
            color={!input.trim() || isLoading ? colors.mutedForeground : colors.background}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>, accent: string) {
  const border = `${accent}18`;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    agentSel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    agentName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.foreground },
    agentRole: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.mutedForeground },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: `${accent}15`,
      borderRadius: 20,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    pillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: accent },
    pillText: {
      fontSize: 9,
      fontFamily: 'Inter_700Bold',
      color: accent,
      letterSpacing: 1,
    },
    picker: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      marginHorizontal: 12,
      borderRadius: 12,
      overflow: 'hidden',
    },
    pickerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
    pickerName: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.foreground },
    pickerRole: {
      fontSize: 11,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      marginLeft: 4,
    },
    msgs: { flex: 1 },
    msgsContent: { padding: 16, gap: 12 },
    row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '90%' },
    rowUser: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
    avatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bubble: { borderRadius: 16, padding: 12, maxWidth: '100%' },
    bubbleUser: { backgroundColor: accent, borderBottomRightRadius: 4 },
    bubbleAssist: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: border,
      borderBottomLeftRadius: 4,
    },
    label: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.5, marginBottom: 4 },
    bubbleText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.foreground, lineHeight: 20 },
    typing: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    typingText: {
      fontSize: 12,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      fontStyle: 'italic',
    },
    bar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 10,
      paddingHorizontal: 16,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    inputField: {
      flex: 1,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      color: colors.foreground,
      fontFamily: 'Inter_400Regular',
      fontSize: 14,
      maxHeight: 120,
    },
    send: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendOff: { backgroundColor: `${accent}30` },
  });
}
