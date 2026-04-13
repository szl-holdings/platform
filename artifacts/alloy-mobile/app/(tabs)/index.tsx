import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useColors } from "@/hooks/useColors";
import { useVoiceCommand } from "@/hooks/useVoiceCommand";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { fetch as expoFetch } from "expo/fetch";
import { useAuth } from "@/context/AuthContext";
import * as SecureStore from "expo-secure-store";
import { AUTH_TOKEN_KEY } from "@/context/AuthContext";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  streaming?: boolean;
}

const CHAT_HISTORY_KEY = "alloy_chat_history";
const MAX_PERSISTED_MESSAGES = 50;
const OFFLINE_QUEUE_KEY = "alloy_chat_offline_queue";

interface QueuedMessage {
  text: string;
  queuedAt: string;
}

async function loadOfflineQueue(): Promise<QueuedMessage[]> {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as QueuedMessage[];
  } catch {
    return [];
  }
}

async function enqueueOfflineMessage(text: string): Promise<void> {
  try {
    const existing = await loadOfflineQueue();
    existing.push({ text, queuedAt: new Date().toISOString() });
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(existing));
  } catch {
    // Persist failed; message cannot be recovered offline
  }
}

async function clearOfflineQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
  } catch {
    // Ignore
  }
}

async function loadChatHistory(): Promise<Message[]> {
  try {
    const raw = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<Omit<Message, "timestamp"> & { timestamp: string }>;
    return parsed.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }));
  } catch {
    return [];
  }
}

async function saveChatHistory(messages: Message[]): Promise<void> {
  try {
    const toSave = messages.filter((m) => !m.streaming).slice(-MAX_PERSISTED_MESSAGES);
    await AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(toSave));
  } catch {
    // Silently fail — chat works without persistence
  }
}

const SUGGESTIONS = [
  "What agents are currently running?",
  "Show me pending approvals",
  "Summarize today's workflow activity",
  "What's the status of my last run?",
];

async function getToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    return typeof window !== "undefined" ? window.localStorage.getItem(AUTH_TOKEN_KEY) : null;
  }
  return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
}

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<import("react-native").TextInput>(null);

  const welcomeMessage: Message = {
    id: "welcome",
    role: "assistant",
    content: `Hello${user?.displayName ? `, ${user.displayName}` : ""}! I'm Alloy, your AI intelligence assistant. I can help you monitor agents, manage workflows, approve decisions, and analyze data. What would you like to do?`,
    timestamp: new Date(),
  };

  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const { isOffline } = useOfflineSync({ namespace: "alloy-chat" });

  useEffect(() => {
    loadChatHistory().then((history) => {
      if (history.length > 0) {
        setMessages(history);
      }
      setHistoryLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (historyLoaded && messages.length > 1) {
      saveChatHistory(messages);
    }
  }, [messages, historyLoaded]);

  const sendMessageRef = useRef<(text: string) => Promise<void>>(async () => { /* placeholder */ });
  const prevOfflineRef = useRef(isOffline);

  const { state: voiceState, transcript, isNative: voiceIsNative, startListening } = useVoiceCommand({
    appName: "Alloy",
    onResult: ({ transcript: t }) => {
      setInputText(t);
    },
    onError: (err) => {
      if (err === "__native_keyboard_voice__") {
        inputRef.current?.focus();
      }
    },
  });

  useEffect(() => {
    if (transcript) setInputText(transcript);
  }, [transcript]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isSending) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    const history = [...messages, userMsg];
    setMessages(history);
    setInputText("");
    setIsSending(true);
    setStreamingContent("");

    try {
      const token = await getToken();
      const apiBase = getApiBase();

      const res = await expoFetch(`${apiBase}/api/alloy/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          agentId: "alloy",
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Chat failed: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let lineBuffer = "";
      let done = false;

      while (!done) {
        const result = await reader.read();
        done = result.done;

        if (result.value) {
          lineBuffer += decoder.decode(result.value, { stream: !result.done });
        }

        const lines = lineBuffer.split("\n");
        lineBuffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          const data = trimmed.slice(6).trim();
          if (data === "[DONE]") {
            done = true;
            break;
          }
          try {
            const parsed = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
            const delta = parsed.choices?.[0]?.delta?.content ?? "";
            if (delta) {
              accumulated += delta;
              setStreamingContent(accumulated);
            }
          } catch {
            // Skip unparseable SSE frames (keep-alive pings, etc.)
          }
        }
      }

      if (lineBuffer.trim().startsWith("data: ")) {
        const data = lineBuffer.trim().slice(6).trim();
        if (data && data !== "[DONE]") {
          try {
            const parsed = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
            const delta = parsed.choices?.[0]?.delta?.content ?? "";
            if (delta) accumulated += delta;
          } catch {
            // Ignore incomplete final frame
          }
        }
      }

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: accumulated || "I understand. How can I help further?",
        timestamp: new Date(),
      };

      setMessages([...history, assistantMsg]);
      setStreamingContent("");
    } catch {
      let errContent: string;
      if (isOffline) {
        await enqueueOfflineMessage(text.trim());
        errContent = "You\u2019re offline. Your message has been saved and will be sent automatically when connection is restored.";
      } else {
        errContent = "I encountered an issue. Please try again.";
      }
      const errMsg: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: errContent,
        timestamp: new Date(),
      };
      setMessages([...history, errMsg]);
      setStreamingContent("");
    } finally {
      setIsSending(false);
    }
  }, [messages, isSending, isOffline]);

  useEffect(() => { sendMessageRef.current = sendMessage; }, [sendMessage]);

  useEffect(() => {
    const wasOffline = prevOfflineRef.current;
    prevOfflineRef.current = isOffline;

    if (wasOffline && !isOffline && historyLoaded) {
      loadOfflineQueue().then(async (queue) => {
        if (queue.length === 0) return;
        await clearOfflineQueue();
        for (const item of queue) {
          await sendMessageRef.current(item.text);
        }
      }).catch(() => null);
    }
  }, [isOffline, historyLoaded]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const allMessages: Message[] = streamingContent
    ? [...messages, { id: "streaming", role: "assistant" as const, content: streamingContent, timestamp: new Date(), streaming: true }]
    : messages;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["rgba(139,92,246,0.07)", "transparent"]}
        style={[styles.headerGradient, { height: topPad + 100 }]}
      />

      <View style={[styles.header, { paddingTop: topPad + 12, paddingHorizontal: 20 }]}>
        <View>
          <Text style={[styles.eyebrow, { color: "rgba(139,92,246,0.6)" }]}>ALLOY</Text>
          <Text style={[styles.title, { color: colors.cream }]}>Intelligence Chat</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: "rgba(16,185,129,0.12)", borderColor: "rgba(16,185,129,0.25)" }]}>
          <View style={[styles.dot, { backgroundColor: "#10b981" }]} />
          <Text style={[styles.statusText, { color: "#10b981" }]}>Live</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={0}>
        <FlatList
          ref={flatListRef}
          data={[...allMessages].reverse()}
          inverted
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: 16 }]}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          scrollEnabled={!!allMessages.length}
          renderItem={({ item }) => (
            <MessageBubble message={item} colors={colors} />
          )}
          ListFooterComponent={
            messages.length <= 1 && !isSending ? (
              <View style={styles.suggestions}>
                {SUGGESTIONS.map((s, i) => (
                  <Pressable
                    key={i}
                    style={[styles.suggestion, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => sendMessage(s)}
                  >
                    <Text style={[styles.suggestionText, { color: colors.creamDim }]}>{s}</Text>
                    <Feather name="arrow-right" size={12} color={colors.violet} />
                  </Pressable>
                ))}
              </View>
            ) : null
          }
        />

        <View style={[styles.inputBar, { paddingBottom: bottomPad + 8, backgroundColor: colors.background, borderTopColor: colors.borderSubtle }]}>
          {isOffline && (
            <View style={[styles.offlineBanner, { backgroundColor: "rgba(245,158,11,0.1)", borderColor: "rgba(245,158,11,0.2)" }]}>
              <Feather name="wifi-off" size={12} color={colors.amber} />
              <Text style={[styles.offlineText, { color: colors.amber }]}>Offline — messages queued</Text>
            </View>
          )}
          <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Pressable
              style={[styles.voiceBtn, voiceState === "listening" ? { backgroundColor: "rgba(139,92,246,0.15)" } : {}]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                startListening();
              }}
            >
              <Feather name="mic" size={18} color={voiceState === "listening" ? colors.violet : colors.mutedForeground} />
            </Pressable>
            <TextInput
              ref={inputRef}
              style={[styles.input, { color: colors.cream, fontFamily: "Inter_400Regular" }]}
              placeholder={voiceIsNative ? "Tap mic or type…" : "Ask Alloy anything…"}
              placeholderTextColor={colors.mutedForeground}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={2000}
              returnKeyType="send"
              onSubmitEditing={() => sendMessage(inputText)}
              blurOnSubmit={false}
            />
            <Pressable
              style={[styles.sendBtn, { backgroundColor: inputText.trim() && !isSending ? colors.violet : "rgba(139,92,246,0.2)" }]}
              onPress={() => sendMessage(inputText)}
              disabled={!inputText.trim() || isSending}
            >
              {isSending ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="send" size={15} color="#fff" />}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

type ColorsType = ReturnType<typeof import("@/hooks/useColors").useColors>;

interface ContentPart {
  type: "text" | "code" | "image";
  content: string;
  language?: string;
}

const IMAGE_URL_RE = /!\[([^\]]*)\]\((https?:\/\/[^)]+)\)|(https?:\/\/\S+\.(?:png|jpg|jpeg|gif|webp))(?:\s|$)/gi;

function parseMessageContent(raw: string): ContentPart[] {
  const parts: ContentPart[] = [];
  const codeBlockRe = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRe.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      const textSlice = raw.slice(lastIndex, match.index);
      parseTextWithImages(textSlice, parts);
    }
    parts.push({ type: "code", language: match[1] || undefined, content: match[2].trim() });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < raw.length) {
    parseTextWithImages(raw.slice(lastIndex), parts);
  }

  return parts.length > 0 ? parts : [{ type: "text", content: raw }];
}

function parseTextWithImages(text: string, parts: ContentPart[]): void {
  IMAGE_URL_RE.lastIndex = 0;
  let imgMatch: RegExpExecArray | null;
  let textStart = 0;

  while ((imgMatch = IMAGE_URL_RE.exec(text)) !== null) {
    if (imgMatch.index > textStart) {
      const t = text.slice(textStart, imgMatch.index).trim();
      if (t) parts.push({ type: "text", content: t });
    }
    const url = imgMatch[2] ?? imgMatch[3];
    if (url) parts.push({ type: "image", content: url });
    textStart = imgMatch.index + imgMatch[0].length;
  }

  if (textStart < text.length) {
    const t = text.slice(textStart).trim();
    if (t) parts.push({ type: "text", content: t });
  }
}

function MessageBubble({ message, colors }: { message: Message; colors: ColorsType }) {
  const isUser = message.role === "user";
  const parts = parseMessageContent(message.content);

  return (
    <View style={[styles.bubbleWrap, isUser ? styles.bubbleWrapUser : styles.bubbleWrapAssist]}>
      {!isUser && (
        <View style={[styles.avatar, { backgroundColor: "rgba(139,92,246,0.15)", borderColor: "rgba(139,92,246,0.3)" }]}>
          <Feather name="zap" size={12} color="#8b5cf6" />
        </View>
      )}
      <View style={[
        styles.bubble,
        isUser
          ? { backgroundColor: "rgba(139,92,246,0.15)", borderColor: "rgba(139,92,246,0.25)" }
          : { backgroundColor: colors.card, borderColor: colors.borderSubtle },
        message.streaming ? { opacity: 0.85 } : {},
      ]}>
        {parts.map((part, idx) =>
          part.type === "code" ? (
            <View key={idx} style={[styles.codeBlock, { backgroundColor: colors.background, borderColor: colors.borderSubtle }]}>
              {part.language ? (
                <Text style={[styles.codeLabel, { color: colors.violet }]}>{part.language}</Text>
              ) : null}
              <Text selectable style={[styles.codeText, { color: colors.creamDim }]}>{part.content}</Text>
            </View>
          ) : part.type === "image" ? (
            <Image
              key={idx}
              source={{ uri: part.content }}
              style={styles.messageImage}
              contentFit="contain"
              transition={200}
            />
          ) : (
            <Text key={idx} style={[styles.bubbleText, { color: isUser ? colors.cream : colors.creamDim }]}>
              {part.content}
            </Text>
          )
        )}
        {message.streaming && <View style={[styles.cursor, { backgroundColor: colors.violet }]} />}
        <Text style={[styles.timestamp, { color: colors.mutedForeground }]}>
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { position: "absolute", top: 0, left: 0, right: 0 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingBottom: 12 },
  eyebrow: { fontSize: 9, fontFamily: "Inter_500Medium", letterSpacing: 3, marginBottom: 4 },
  title: { fontSize: 22, fontFamily: "Inter_300Light" },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 12, borderWidth: 1, marginTop: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontFamily: "Inter_500Medium" },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16 },
  bubbleWrap: { marginBottom: 12, flexDirection: "row", alignItems: "flex-end", gap: 8 },
  bubbleWrapUser: { flexDirection: "row-reverse" },
  bubbleWrapAssist: {},
  avatar: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  bubble: { maxWidth: "80%", padding: 12, borderRadius: 12, borderWidth: 1 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  codeBlock: { borderRadius: 8, borderWidth: 1, padding: 10, marginVertical: 4 },
  codeLabel: { fontSize: 10, fontFamily: "Inter_500Medium", letterSpacing: 1, marginBottom: 4, textTransform: "uppercase" },
  codeText: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 18 },
  messageImage: { width: "100%", height: 180, borderRadius: 8, marginVertical: 6 },
  cursor: { width: 2, height: 14, borderRadius: 1, marginTop: 4 },
  timestamp: { fontSize: 10, marginTop: 4 },
  suggestions: { gap: 8, marginBottom: 16 },
  suggestion: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  suggestionText: { fontSize: 13, flex: 1 },
  inputBar: { paddingTop: 8, paddingHorizontal: 16, borderTopWidth: 1 },
  offlineBanner: { flexDirection: "row", alignItems: "center", gap: 6, padding: 8, borderRadius: 8, borderWidth: 1, marginBottom: 8 },
  offlineText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  inputRow: { flexDirection: "row", alignItems: "flex-end", borderRadius: 12, borderWidth: 1, paddingHorizontal: 4, paddingVertical: 4, gap: 4 },
  voiceBtn: { padding: 10, borderRadius: 8 },
  input: { flex: 1, fontSize: 14, lineHeight: 20, maxHeight: 100, paddingVertical: 8, paddingHorizontal: 4 },
  sendBtn: { padding: 10, borderRadius: 8, alignItems: "center", justifyContent: "center" },
});
