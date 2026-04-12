import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from "react-native";

export interface CopilotConfig {
  accentColor: string;
  agentId: string;
  placeholder: string;
  systemContext: string;
  apiBaseUrl: string;
  authToken?: string;
  welcomeMessage?: string;
  suggestions?: string[];
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  toolName?: string;
  toolStatus?: "running" | "done" | "error";
  toolOutput?: string;
  pendingApproval?: { id: string; actionType: string; description: string };
  timestamp: Date;
}

interface SseChunk {
  type?: string;
  content?: string;
  done?: boolean;
  error?: string;
  tool?: string;
  toolArgs?: Record<string, unknown>;
  toolResult?: string;
  pendingApproval?: boolean;
  approvalId?: string;
  actionType?: string;
  description?: string;
}

async function streamChat(
  apiBaseUrl: string,
  conversationId: string,
  content: string,
  systemContext: string,
  agentId: string,
  authToken: string | undefined,
  onChunk: (chunk: SseChunk) => void,
  signal: AbortSignal,
): Promise<void> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "text/event-stream",
  };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

  const resp = await fetch(`${apiBaseUrl}/alloy-chat/conversations/${conversationId}/messages`, {
    method: "POST",
    headers,
    body: JSON.stringify({ content, systemContext, agentId, provider: "auto" }),
    signal,
  });

  if (!resp.ok) {
    throw new Error(`Chat API error: ${resp.status}`);
  }

  const reader = resp.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const raw = line.slice(6).trim();
        if (raw === "[DONE]") return;
        try {
          const parsed = JSON.parse(raw) as SseChunk;
          onChunk(parsed);
        } catch {}
      }
    }
  }
}

async function invokeMcpTool(
  apiBaseUrl: string,
  toolName: string,
  args: Record<string, unknown>,
  authToken?: string,
): Promise<{ success: boolean; output: unknown; pendingApproval?: boolean; approvalId?: string }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

  const resp = await fetch(`${apiBaseUrl}/mcp/tools/call`, {
    method: "POST",
    headers,
    body: JSON.stringify({ toolName, arguments: args }),
    signal: AbortSignal.timeout(20000),
  });
  if (!resp.ok) return { success: false, output: `Tool error: ${resp.status}` };
  const data = await resp.json() as { output?: unknown; pendingApproval?: boolean; approvalId?: string };
  return { success: true, output: data.output ?? data, pendingApproval: data.pendingApproval, approvalId: data.approvalId };
}

async function approveAction(
  apiBaseUrl: string,
  approvalId: string,
  authToken?: string,
): Promise<boolean> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
  try {
    const resp = await fetch(`${apiBaseUrl}/approvals/${approvalId}/approve`, {
      method: "POST",
      headers,
      body: JSON.stringify({ approved: true }),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

async function rejectAction(
  apiBaseUrl: string,
  approvalId: string,
  authToken?: string,
): Promise<boolean> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
  try {
    const resp = await fetch(`${apiBaseUrl}/approvals/${approvalId}/reject`, {
      method: "POST",
      headers,
      body: JSON.stringify({ approved: false }),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

export function AICopilot({ config }: { config: CopilotConfig }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const abortRef = useRef<AbortController | null>(null);
  const conversationId = useRef(`conv-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return;
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setStreaming(true);
    scrollToBottom();

    abortRef.current = new AbortController();

    const assistantId = `a-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    }]);

    try {
      await streamChat(
        config.apiBaseUrl,
        conversationId.current,
        text.trim(),
        config.systemContext,
        config.agentId,
        config.authToken,
        (chunk: SseChunk) => {
          if (chunk.error) {
            setMessages(prev => prev.map(m =>
              m.id === assistantId ? { ...m, content: `Error: ${chunk.error}` } : m
            ));
            return;
          }
          if (chunk.tool) {
            const toolId = `tool-${Date.now()}`;
            const toolArgs = chunk.toolArgs ?? {};
            setMessages(prev => [...prev, {
              id: toolId,
              role: "tool",
              content: "",
              toolName: chunk.tool,
              toolStatus: "running",
              timestamp: new Date(),
            }]);
            invokeMcpTool(config.apiBaseUrl, chunk.tool!, toolArgs, config.authToken)
              .then(result => {
                setMessages(prev => prev.map(m =>
                  m.id === toolId ? {
                    ...m,
                    toolStatus: result.success ? "done" : "error",
                    toolOutput: typeof result.output === "string" ? result.output : JSON.stringify(result.output),
                    pendingApproval: result.pendingApproval ? {
                      id: result.approvalId!,
                      actionType: "tool_action",
                      description: `Approve execution of ${chunk.tool}`,
                    } : undefined,
                  } : m
                ));
              })
              .catch(() => {
                setMessages(prev => prev.map(m =>
                  m.id === toolId ? { ...m, toolStatus: "error" } : m
                ));
              });
          }
          if (chunk.content) {
            setMessages(prev => prev.map(m =>
              m.id === assistantId ? { ...m, content: m.content + chunk.content } : m
            ));
            scrollToBottom();
          }
          if (chunk.done) {
            setStreaming(false);
          }
        },
        abortRef.current.signal,
      );
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setMessages(prev => prev.map(m =>
          m.id === assistantId && m.content === ""
            ? { ...m, content: "Connection failed. Please check your network and try again." }
            : m
        ));
      }
    } finally {
      setStreaming(false);
    }
  }, [streaming, config, scrollToBottom]);

  const handleApprove = useCallback(async (toolMsgId: string, approvalId: string) => {
    setMessages(prev => prev.map(m =>
      m.id === toolMsgId ? { ...m, toolOutput: "Approving…" } : m
    ));
    const ok = await approveAction(config.apiBaseUrl, approvalId, config.authToken);
    setMessages(prev => prev.map(m =>
      m.id === toolMsgId ? {
        ...m,
        pendingApproval: undefined,
        toolStatus: ok ? "done" : "error",
        toolOutput: ok ? "Approved — action executed." : "Approval failed — please retry.",
      } : m
    ));
  }, [config]);

  const handleReject = useCallback(async (toolMsgId: string, approvalId: string) => {
    setMessages(prev => prev.map(m =>
      m.id === toolMsgId ? { ...m, toolOutput: "Rejecting…" } : m
    ));
    await rejectAction(config.apiBaseUrl, approvalId, config.authToken);
    setMessages(prev => prev.map(m =>
      m.id === toolMsgId ? {
        ...m,
        pendingApproval: undefined,
        toolStatus: "error",
        toolOutput: "Rejected — action was not executed.",
      } : m
    ));
  }, [config]);

  const handleDismiss = useCallback((toolMsgId: string) => {
    setMessages(prev => prev.map(m =>
      m.id === toolMsgId ? { ...m, pendingApproval: undefined, toolOutput: "Dismissed." } : m
    ));
  }, []);

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  const accent = config.accentColor;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={scrollToBottom}
      >
        {messages.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: accent }]}>AI Copilot Ready</Text>
            <Text style={styles.emptySubtitle}>
              {config.welcomeMessage ?? "Connected to backend AI engine with streaming support"}
            </Text>
            {config.suggestions && config.suggestions.length > 0 && (
              <View style={styles.suggestionsGrid}>
                {config.suggestions.map((s, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.suggestionChip, { borderColor: accent + "40" }]}
                    onPress={() => sendMessage(s)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.suggestionText, { color: accent }]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
        {messages.map(msg => (
          <View key={msg.id}>
            {msg.role === "tool" && (
              <View style={styles.toolBadgeWrap}>
                <View style={styles.toolBadge}>
                  <View style={[styles.toolDot, {
                    backgroundColor: msg.toolStatus === "done" ? "#22c55e" : msg.toolStatus === "error" ? "#ef4444" : accent,
                  }]} />
                  <Text style={[styles.toolName, { color: msg.toolStatus === "done" ? "#22c55e" : msg.toolStatus === "error" ? "#ef4444" : accent }]}>
                    {msg.toolName} {msg.toolStatus === "running" ? "…" : msg.toolStatus === "done" ? "✓" : "✗"}
                  </Text>
                </View>
                {msg.toolOutput && !msg.pendingApproval && (
                  <Text style={[styles.toolOutput, {
                    color: msg.toolStatus === "done" ? "#22c55e" : msg.toolStatus === "error" ? "#ef4444" : "rgba(255,255,255,0.5)",
                  }]}>{msg.toolOutput}</Text>
                )}
              </View>
            )}
            {msg.role !== "tool" && (
              <View style={[
                styles.bubble,
                msg.role === "user" ? [styles.userBubble, { borderColor: accent + "40", backgroundColor: accent + "15" }] : styles.assistantBubble,
              ]}>
                {msg.role === "assistant" && (
                  <Text style={[styles.roleLabel, { color: accent }]}>AI COPILOT</Text>
                )}
                <Text style={styles.bubbleText}>
                  {msg.content || (streaming ? "…" : "")}
                </Text>
              </View>
            )}
            {msg.pendingApproval && (
              <View style={[styles.approvalCard, { borderColor: accent + "50" }]}>
                <Text style={[styles.approvalTitle, { color: accent }]}>Action Pending Approval</Text>
                <Text style={styles.approvalDesc}>{msg.pendingApproval.description}</Text>
                {msg.toolOutput ? (
                  <Text style={styles.approvalFeedback}>{msg.toolOutput}</Text>
                ) : (
                  <View style={styles.approvalButtons}>
                    <TouchableOpacity
                      style={[styles.approveBtn, { borderColor: accent, backgroundColor: accent + "20" }]}
                      onPress={() => handleApprove(msg.id, msg.pendingApproval!.id)}
                    >
                      <Text style={[styles.approveBtnText, { color: accent }]}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.rejectBtn]}
                      onPress={() => handleReject(msg.id, msg.pendingApproval!.id)}
                    >
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dismissBtn}
                      onPress={() => handleDismiss(msg.id)}
                    >
                      <Text style={styles.dismissBtnText}>Dismiss</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        ))}
        {streaming && (
          <ActivityIndicator size="small" color={accent} style={{ marginVertical: 8 }} />
        )}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, { borderColor: streaming ? accent + "40" : "rgba(255,255,255,0.1)" }]}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => sendMessage(input)}
          placeholder={config.placeholder}
          placeholderTextColor="rgba(255,255,255,0.3)"
          multiline
          returnKeyType="send"
          editable={!streaming}
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: streaming ? "rgba(255,255,255,0.05)" : accent + "25", borderColor: streaming ? "rgba(255,255,255,0.05)" : accent + "50" }]}
          onPress={() => sendMessage(input)}
          disabled={!input.trim() || streaming}
        >
          {streaming
            ? <ActivityIndicator size="small" color={accent} />
            : <Text style={[styles.sendIcon, { color: accent }]}>↑</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  messages: { flex: 1 },
  messagesContent: { padding: 16, gap: 8, paddingBottom: 16 },
  emptyState: { alignItems: "center", paddingTop: 40, gap: 8, paddingHorizontal: 16 },
  emptyTitle: { fontSize: 15, fontWeight: "600" },
  emptySubtitle: { fontSize: 12, color: "rgba(255,255,255,0.4)", textAlign: "center", maxWidth: 280 },
  suggestionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12, justifyContent: "center", maxWidth: 320 },
  suggestionChip: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: "rgba(255,255,255,0.04)" },
  suggestionText: { fontSize: 12, fontWeight: "500" },
  bubble: { borderRadius: 12, padding: 12, marginBottom: 4, borderWidth: 1 },
  userBubble: { alignSelf: "flex-end", maxWidth: "80%" },
  assistantBubble: { alignSelf: "flex-start", maxWidth: "90%", backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" },
  roleLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 1, marginBottom: 4 },
  bubbleText: { color: "rgba(255,255,255,0.85)", fontSize: 13, lineHeight: 20 },
  toolBadgeWrap: { alignItems: "center", marginBottom: 4 },
  toolBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 4, paddingHorizontal: 8 },
  toolDot: { width: 6, height: 6, borderRadius: 3 },
  toolName: { fontSize: 10, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", letterSpacing: 0.5 },
  toolOutput: { fontSize: 11, textAlign: "center", paddingHorizontal: 12, paddingBottom: 4 },
  approvalCard: { borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 4, backgroundColor: "rgba(255,255,255,0.03)" },
  approvalTitle: { fontSize: 10, fontWeight: "700", letterSpacing: 0.8, marginBottom: 4 },
  approvalDesc: { fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 10 },
  approvalButtons: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  approvalFeedback: { fontSize: 12, color: "rgba(255,255,255,0.5)", fontStyle: "italic" },
  approveBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  approveBtnText: { fontSize: 12, fontWeight: "600" },
  rejectBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: "#ef4444", backgroundColor: "rgba(239,68,68,0.1)" },
  rejectBtnText: { fontSize: 12, fontWeight: "600", color: "#ef4444" },
  dismissBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  dismissBtnText: { fontSize: 12, color: "rgba(255,255,255,0.4)" },
  inputRow: { flexDirection: "row", gap: 8, padding: 12, paddingBottom: Platform.OS === "ios" ? 20 : 12 },
  input: { flex: 1, borderRadius: 10, borderWidth: 1, backgroundColor: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.9)", fontSize: 13, paddingHorizontal: 14, paddingVertical: 10, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  sendIcon: { fontSize: 20, fontWeight: "600" },
});
