import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet,
  ActivityIndicator, Platform, RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

interface McpTool {
  name: string;
  description: string;
  inputSchema?: { properties?: Record<string, { type: string; description?: string }> };
}

interface McpResult {
  tool: string;
  content: string;
  isError?: boolean;
  elapsed: number;
}

const BUILT_IN_TOOLS: McpTool[] = [
  { name: "get_capabilities", description: "List all MCP capabilities and connected servers" },
  { name: "get_status", description: "Check system and integration health status" },
  { name: "list_agents", description: "List all registered AI agents and their states" },
  { name: "run_search", description: "Semantic search across all indexed data", inputSchema: { properties: { query: { type: "string", description: "Search query" } } } },
  { name: "fetch_context", description: "Retrieve live context from data sources" },
  { name: "trigger_action", description: "Execute a named action or workflow", inputSchema: { properties: { action: { type: "string", description: "Action name" } } } },
];

const ACCENT = "#6366f1";
const BG = "#0a0a0a";
const BORDER = "rgba(255,255,255,0.06)";
const TEXT = "#e8e8f0";
const TEXT_DIM = "rgba(255,255,255,0.45)";

export default function ToolsScreen() {
  const insets = useSafeAreaInsets();
  const [tools] = useState<McpTool[]>(BUILT_IN_TOOLS);
  const [selected, setSelected] = useState<McpTool | null>(null);
  const [params, setParams] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<McpResult | null>(null);
  const [serverStatus, setServerStatus] = useState<"checking" | "healthy" | "error">("checking");
  const [refreshing, setRefreshing] = useState(false);

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/mcp/health");
      setServerStatus(res.ok ? "healthy" : "error");
    } catch {
      setServerStatus("error");
    }
  }, []);

  useEffect(() => { checkHealth(); }, [checkHealth]);

  const onRefresh = async () => {
    setRefreshing(true);
    await checkHealth();
    setRefreshing(false);
  };

  const callTool = async () => {
    if (!selected) return;
    setRunning(true);
    setResult(null);
    const start = Date.now();
    try {
      const res = await fetch("/api/mcp/tools/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: selected.name, arguments: params }),
      });
      const data = await res.json().catch(() => ({ content: "No response" }));
      const content = typeof data.content === "string" ? data.content : JSON.stringify(data.content ?? data, null, 2);
      setResult({ tool: selected.name, content, isError: !res.ok, elapsed: Date.now() - start });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      setResult({ tool: selected.name, content: msg, isError: true, elapsed: Date.now() - start });
    }
    setRunning(false);
  };

  const statusColor = serverStatus === "healthy" ? "#10b981" : serverStatus === "error" ? "#ef4444" : "#f59e0b";
  const hasParams = selected?.inputSchema?.properties && Object.keys(selected.inputSchema.properties).length > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={["rgba(99,102,241,0.08)", "transparent"]}
        style={styles.headerGradient}
        pointerEvents="none"
      />
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Tools</Text>
          <Text style={styles.headerSub}>Model Context Protocol · Stephen</Text>
        </View>
        <View style={[styles.statusBadge, { borderColor: statusColor + "30" }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {serverStatus === "checking" ? "Checking" : serverStatus === "healthy" ? "Online" : "Offline"}
          </Text>
        </View>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
      >
        <Text style={styles.sectionLabel}>Available Tools</Text>
        {tools.map((tool) => {
          const isSelected = selected?.name === tool.name;
          return (
            <TouchableOpacity
              key={tool.name}
              style={[styles.toolRow, isSelected && { borderLeftColor: ACCENT }]}
              onPress={() => {
                if (isSelected) { setSelected(null); setResult(null); setParams({}); }
                else { setSelected(tool); setResult(null); setParams({}); }
              }}
              activeOpacity={0.75}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.toolName}>{tool.name}</Text>
                <Text style={styles.toolDesc}>{tool.description}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
        {selected && (
          <View style={styles.callSection}>
            <Text style={styles.callTitle}>{`> ${selected.name}`}</Text>
            {hasParams && Object.entries(selected.inputSchema!.properties!).map(([key, schema]) => (
              <View key={key} style={{ marginBottom: 10 }}>
                <Text style={styles.paramLabel}>{key}</Text>
                <TextInput
                  value={params[key] ?? ""}
                  onChangeText={(v) => setParams((p) => ({ ...p, [key]: v }))}
                  placeholder={schema.description ?? key}
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  style={styles.input}
                />
              </View>
            ))}
            <TouchableOpacity onPress={callTool} disabled={running} style={[styles.callButton, running && { opacity: 0.6 }]} activeOpacity={0.8}>
              {running ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.callButtonText}>Execute Tool</Text>}
            </TouchableOpacity>
            {result && (
              <View style={[styles.resultCard, result.isError ? styles.resultError : styles.resultSuccess]}>
                <Text style={[styles.resultStatus, { color: result.isError ? "#ef4444" : "#10b981" }]}>
                  {result.isError ? "Error" : "Success"} · {result.elapsed}ms
                </Text>
                <Text style={styles.resultContent}>{result.content}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  headerGradient: { ...StyleSheet.absoluteFillObject, height: 200 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: BORDER },
  headerTitle: { fontSize: 28, fontWeight: "700", color: TEXT, fontFamily: Platform.OS === "ios" ? "System" : "Inter_700Bold" },
  headerSub: { color: TEXT_DIM, fontSize: 10, marginTop: 2 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: "600" },
  scroll: { flex: 1 },
  sectionLabel: { fontSize: 9, fontWeight: "700", color: TEXT_DIM, letterSpacing: 1.2, textTransform: "uppercase", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 6 },
  toolRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BORDER, borderLeftWidth: 2, borderLeftColor: "transparent" },
  toolName: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.75)", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", marginBottom: 2 },
  toolDesc: { fontSize: 10, color: TEXT_DIM, lineHeight: 14 },
  callSection: { margin: 12, borderRadius: 12, padding: 14, backgroundColor: "rgba(25,25,35,0.95)", borderWidth: 1, borderColor: BORDER },
  callTitle: { fontSize: 12, fontWeight: "700", color: ACCENT, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", marginBottom: 10 },
  paramLabel: { fontSize: 9, color: TEXT_DIM, textTransform: "uppercase", marginBottom: 4 },
  input: { backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 12, color: "rgba(255,255,255,0.7)" },
  callButton: { backgroundColor: ACCENT, borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 10 },
  callButtonText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  resultCard: { marginTop: 10, borderRadius: 8, borderWidth: 1 },
  resultError: { backgroundColor: "rgba(239,68,68,0.05)", borderColor: "rgba(239,68,68,0.2)" },
  resultSuccess: { backgroundColor: "rgba(16,185,129,0.05)", borderColor: "rgba(16,185,129,0.2)" },
  resultStatus: { fontSize: 10, fontWeight: "600", padding: 8, paddingBottom: 4 },
  resultContent: { fontSize: 10, color: "rgba(255,255,255,0.6)", padding: 8, paddingTop: 0, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
});
