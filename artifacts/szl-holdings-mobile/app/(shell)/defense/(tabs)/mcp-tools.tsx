import { useEmbeddingSearch } from '@szl-holdings/mobile-shared';
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
import { palette } from '@/lib/gi-bridge';

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
    description: 'Semantic search across indexed data',
    inputSchema: { properties: { query: { type: 'string', description: 'Search query' } } },
  },
  { name: 'fetch_context', description: 'Retrieve live context from data sources' },
  {
    name: 'trigger_action',
    description: 'Execute a named action or workflow',
    inputSchema: { properties: { action: { type: 'string', description: 'Action name' } } },
  },
];

const ACCENT = palette.critical;

function ToolRow({
  tool,
  selected,
  onPress,
  borderColor,
  nameColor,
  descColor,
  dotColor,
}: {
  tool: McpTool;
  selected: boolean;
  onPress: () => void;
  borderColor: string;
  nameColor: string;
  descColor: string;
  dotColor: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.toolRow,
        { borderBottomColor: borderColor },
        selected && { backgroundColor: `${ACCENT}10`, borderLeftColor: `${ACCENT}` },
      ]}
      activeOpacity={0.7}
    >
      <View style={[styles.toolDot, { backgroundColor: dotColor }]} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.toolName, { color: selected ? ACCENT : nameColor }]}>{tool.name}</Text>
        <Text style={[styles.toolDesc, { color: descColor }]} numberOfLines={2}>
          {tool.description}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function McpToolsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const [tools, setTools] = useState<McpTool[]>(BUILT_IN_TOOLS);
  const [selected, setSelected] = useState<McpTool | null>(null);
  const [params, setParams] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<McpResult | null>(null);
  const [serverStatus, setServerStatus] = useState<'checking' | 'healthy' | 'error'>('checking');
  const [refreshing, setRefreshing] = useState(false);
  const { search } = useEmbeddingSearch({ domain: 'security', limit: 5 });

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/mcp/health');
      setServerStatus(res.ok ? 'healthy' : 'error');
      if (res.ok) {
        const listRes = await fetch('/api/mcp/tools/list');
        if (listRes.ok) {
          const data = await listRes.json();
          if (data?.tools?.length) setTools([...BUILT_IN_TOOLS, ...data.tools]);
        }
      }
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

    if (selected.name === 'run_search') {
      const query = params.query?.trim() ?? '';
      if (!query) {
        setResult({
          tool: 'run_search',
          content: 'Please provide a search query.',
          isError: true,
          elapsed: 0,
        });
        setRunning(false);
        return;
      }
      try {
        const results = await search(query);
        const content =
          results.length > 0
            ? results
                .map(
                  (r, i) =>
                    `[${i + 1}]${r.source ? ` (${r.source})` : ''}\n${r.content}\nScore: ${(r.score * 100).toFixed(1)}%`,
                )
                .join('\n\n---\n\n')
            : 'No results found.';
        setResult({ tool: 'run_search', content, isError: false, elapsed: Date.now() - start });
      } catch (err) {
        setResult({
          tool: 'run_search',
          content: err instanceof Error ? err.message : 'Search failed',
          isError: true,
          elapsed: Date.now() - start,
        });
      }
      setRunning(false);
      return;
    }

    try {
      const base = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';
      const res = await fetch(`${base}/api/mcp/tools/call`, {
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
    } catch (err) {
      setResult({
        tool: selected.name,
        content: err instanceof Error ? err.message : 'Network error',
        isError: true,
        elapsed: Date.now() - start,
      });
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
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>MCP Tools</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Model Context Protocol · PARAGON
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: colors.muted, borderColor: colors.border },
          ]}
        >
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
          <ToolRow
            key={tool.name}
            tool={tool}
            selected={selected?.name === tool.name}
            onPress={() => {
              setSelected(tool);
              setParams({});
              setResult(null);
            }}
            borderColor={colors.border}
            nameColor={colors.cardForeground}
            descColor={colors.mutedForeground}
            dotColor={colors.borderSubtle}
          />
        ))}

        {selected && (
          <View
            style={[
              styles.callSection,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              Call: {selected.name}
            </Text>

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
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <Text style={[styles.resultContent, { color: colors.mutedForeground }]}>
                    {result.content}
                  </Text>
                </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  headerSub: { fontSize: 10, marginTop: 1 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
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
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderLeftWidth: 2,
    borderLeftColor: 'transparent',
  },
  toolDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    flexShrink: 0,
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
  paramLabel: {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
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
  resultCard: {
    marginTop: 10,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    maxHeight: 200,
  },
  resultError: { backgroundColor: `${palette.critical}0d`, borderColor: `${palette.critical}33` },
  resultSuccess: { backgroundColor: `${palette.success}0d`, borderColor: `${palette.success}33` },
  resultStatus: { fontSize: 10, fontWeight: '600', padding: 8, paddingBottom: 4 },
  resultContent: {
    fontSize: 10,
    paddingHorizontal: 8,
    paddingBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
