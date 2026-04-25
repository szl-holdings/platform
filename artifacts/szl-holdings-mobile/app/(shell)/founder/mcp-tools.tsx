import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { giColors, palette } from '@/lib/gi-bridge';

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
  { name: 'get_capabilities', description: 'List all MCP capabilities and connected servers' },
  { name: 'get_status', description: 'Check system and integration health status' },
  { name: 'list_agents', description: 'List all registered AI agents and their states' },
  {
    name: 'run_search',
    description: 'Semantic search across all indexed data',
    inputSchema: { properties: { query: { type: 'string', description: 'Search query' } } },
  },
  { name: 'fetch_context', description: 'Retrieve live context from data sources' },
  {
    name: 'trigger_action',
    description: 'Execute a named action or workflow',
    inputSchema: { properties: { action: { type: 'string', description: 'Action name' } } },
  },
];

const ACCENT = giColors.accent.violet;

export default function McpToolsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useColors();
  const [tools, _setTools] = useState<McpTool[]>(BUILT_IN_TOOLS);
  const [selected, setSelected] = useState<McpTool | null>(null);
  const [params, setParams] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<McpResult | null>(null);
  const [serverStatus, setServerStatus] = useState<'checking' | 'healthy' | 'error'>('checking');
  const [refreshing, setRefreshing] = useState(false);

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/mcp/health');
      setServerStatus(res.ok ? 'healthy' : 'error');
    } catch {
      setServerStatus('error');
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

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
      const res = await fetch('/api/mcp/tools/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: selected.name, arguments: params }),
      });
      const data = await res.json().catch(() => ({ content: 'No response' }));
      const content =
        typeof data.content === 'string'
          ? data.content
          : JSON.stringify(data.content ?? data, null, 2);
      setResult({ tool: selected.name, content, isError: !res.ok, elapsed: Date.now() - start });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Network error';
      setResult({ tool: selected.name, content: msg, isError: true, elapsed: Date.now() - start });
    }
    setRunning(false);
  };

  const statusColor =
    serverStatus === 'healthy' ? palette.success : serverStatus === 'error' ? palette.critical : palette.high;
  const hasParams =
    selected?.inputSchema?.properties && Object.keys(selected.inputSchema.properties).length > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>MCP Tools</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Model Context Protocol · Stephen
          </Text>
        </View>
        <View style={[styles.statusBadge, { borderColor: `${statusColor}30` }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {serverStatus === 'healthy' ? 'Online' : serverStatus === 'error' ? 'Offline' : '...'}
          </Text>
        </View>
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />
        }
      >
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          Available Tools ({tools.length})
        </Text>
        {tools.map((tool) => (
          <TouchableOpacity
            key={tool.name}
            onPress={() => {
              setSelected(tool);
              setParams({});
              setResult(null);
            }}
            style={[
              styles.toolRow,
              { borderBottomColor: colors.border },
              selected?.name === tool.name && {
                backgroundColor: `${ACCENT}15`,
                borderLeftColor: ACCENT,
              },
            ]}
            activeOpacity={0.7}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.toolName,
                  { color: colors.cardForeground },
                  selected?.name === tool.name && { color: ACCENT },
                ]}
              >
                {tool.name}
              </Text>
              <Text style={[styles.toolDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                {tool.description}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
        {selected && (
          <View
            style={[
              styles.callSection,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.callTitle, { color: ACCENT }]}>{selected.name}</Text>
            {hasParams &&
              Object.entries(selected.inputSchema?.properties!).map(([key, schema]) => (
                <View key={key} style={{ marginBottom: 8 }}>
                  <Text style={[styles.paramLabel, { color: colors.mutedForeground }]}>
                    {schema.description ?? key}
                  </Text>
                  <TextInput
                    value={params[key] ?? ''}
                    onChangeText={(val) => setParams((p) => ({ ...p, [key]: val }))}
                    placeholder={key}
                    placeholderTextColor={colors.mutedForeground}
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.input,
                        borderColor: colors.borderSubtle,
                        color: colors.foreground,
                      },
                    ]}
                  />
                </View>
              ))}
            <TouchableOpacity
              onPress={callTool}
              disabled={running}
              style={[styles.callButton, { backgroundColor: ACCENT }, running && { opacity: 0.6 }]}
              activeOpacity={0.8}
            >
              {running ? (
                <ActivityIndicator size="small" color={palette.onAccent} />
              ) : (
                <Text style={styles.callButtonText}>Execute Tool</Text>
              )}
            </TouchableOpacity>
            {result && (
              <View
                style={[
                  styles.resultCard,
                  result.isError ? styles.resultError : styles.resultSuccess,
                ]}
              >
                <Text
                  style={[
                    styles.resultStatus,
                    { color: result.isError ? palette.critical : palette.success },
                  ]}
                >
                  {result.isError ? 'Error' : 'Success'} · {result.elapsed}ms
                </Text>
                <Text style={[styles.resultContent, { color: colors.mutedForeground }]}>
                  {result.content}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: { paddingRight: 6 },
  backText: { color: giColors.accent.violet, fontSize: 13, fontWeight: '600' },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  headerSub: { fontSize: 10, marginTop: 1 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '600' },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderLeftWidth: 2,
    borderLeftColor: 'transparent',
  },
  toolName: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 2,
  },
  toolDesc: { fontSize: 10, lineHeight: 14 },
  callSection: {
    margin: 12,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  callTitle: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 10,
  },
  paramLabel: {
    fontSize: 9,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
  },
  callButton: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  callButtonText: { color: palette.onAccent, fontSize: 13, fontWeight: '700' },
  resultCard: { marginTop: 10, borderRadius: 8, borderWidth: 1 },
  resultError: { backgroundColor: `${palette.critical}0d`, borderColor: `${palette.critical}33` },
  resultSuccess: { backgroundColor: `${palette.success}0d`, borderColor: `${palette.success}33` },
  resultStatus: { fontSize: 10, fontWeight: '600', padding: 8, paddingBottom: 4 },
  resultContent: {
    fontSize: 10,
    padding: 8,
    paddingTop: 0,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
