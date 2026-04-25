import { useEmbeddingSearch } from '@szl-holdings/mobile-shared';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { giProductAccent, giColors, palette } from '@/lib/gi-bridge';

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
  const { search } = useEmbeddingSearch({ domain: 'consulting', limit: 5 });

  const accent = giProductAccent.carlota;
  const s = useMemo(() => makeStyles(colors, accent), [colors, accent]);

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
    serverStatus === 'healthy'
      ? giColors.accent.green
      : serverStatus === 'error'
        ? giColors.accent.red
        : giColors.accent.amber;

  const hasParams =
    selected?.inputSchema?.properties && Object.keys(selected.inputSchema.properties).length > 0;

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>MCP Tools</Text>
          <Text style={s.headerSub}>Model Context Protocol</Text>
        </View>
        <View style={s.statusBadge}>
          <View style={[s.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[s.statusText, { color: statusColor }]}>
            {serverStatus === 'healthy' ? 'Online' : serverStatus === 'error' ? 'Offline' : '...'}
          </Text>
        </View>
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />
        }
      >
        <Text style={s.sectionLabel}>Available Tools ({tools.length})</Text>
        {tools.map((tool) => (
          <TouchableOpacity
            key={tool.name}
            onPress={() => {
              setSelected(tool);
              setParams({});
              setResult(null);
            }}
            style={[
              s.toolRow,
              selected?.name === tool.name && {
                backgroundColor: `${accent}15`,
                borderLeftColor: accent,
              },
            ]}
            activeOpacity={0.7}
          >
            <View style={{ flex: 1 }}>
              <Text style={[s.toolName, selected?.name === tool.name && { color: accent }]}>
                {tool.name}
              </Text>
              <Text style={s.toolDesc} numberOfLines={2}>
                {tool.description}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
        {selected && (
          <View style={s.callSection}>
            <Text style={s.sectionLabel}>Call: {selected.name}</Text>
            {hasParams &&
              Object.entries(selected.inputSchema?.properties!).map(([key, schema]) => (
                <View key={key} style={{ marginBottom: 8 }}>
                  <Text style={s.paramLabel}>{schema.description ?? key}</Text>
                  <TextInput
                    value={params[key] ?? ''}
                    onChangeText={(val) => setParams((p) => ({ ...p, [key]: val }))}
                    placeholder={key}
                    placeholderTextColor={colors.mutedForeground}
                    style={s.inputField}
                  />
                </View>
              ))}
            <TouchableOpacity
              onPress={callTool}
              disabled={running}
              style={[s.callButton, { backgroundColor: accent }, running && { opacity: 0.6 }]}
              activeOpacity={0.8}
            >
              {running ? (
                <ActivityIndicator size="small" color={palette.onAccent} />
              ) : (
                <Text style={s.callButtonText}>Execute Tool</Text>
              )}
            </TouchableOpacity>
            {result && (
              <View
                style={[
                  s.resultCard,
                  result.isError ? s.resultError : s.resultSuccess,
                ]}
              >
                <Text
                  style={[s.resultStatus, { color: result.isError ? giColors.accent.red : giColors.accent.green }]}
                >
                  {result.isError ? 'Error' : 'Success'} · {result.elapsed}ms
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <Text style={s.resultContent}>{result.content}</Text>
                </ScrollView>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>, accent: string) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      color: colors.foreground,
      fontSize: 17,
      fontFamily: 'SpaceGrotesk_700Bold',
      letterSpacing: -0.3,
    },
    headerSub: { color: colors.mutedForeground, fontSize: 10, fontFamily: 'Inter_400Regular', marginTop: 1 },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statusDot: { width: 5, height: 5, borderRadius: 3 },
    statusText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
    sectionLabel: {
      fontSize: 9,
      fontFamily: 'Inter_700Bold',
      color: colors.mutedForeground,
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
      borderBottomColor: colors.border,
      borderLeftWidth: 2,
      borderLeftColor: 'transparent',
    },
    toolName: {
      fontSize: 12,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontWeight: '600',
      color: colors.foreground,
      marginBottom: 2,
    },
    toolDesc: {
      fontSize: 10,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      lineHeight: 14,
    },
    callSection: {
      margin: 12,
      borderRadius: 12,
      padding: 14,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    paramLabel: {
      fontSize: 9,
      fontFamily: 'Inter_500Medium',
      color: colors.mutedForeground,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 4,
    },
    inputField: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      fontSize: 12,
      fontFamily: 'Inter_400Regular',
      color: colors.foreground,
    },
    callButton: { borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 10 },
    callButtonText: {
      color: palette.onAccent,
      fontSize: 13,
      fontFamily: 'Inter_700Bold',
    },
    resultCard: {
      marginTop: 10,
      borderRadius: 8,
      overflow: 'hidden',
      borderWidth: 1,
      maxHeight: 200,
    },
    resultError: {
      backgroundColor: `${giColors.accent.red}0D`,
      borderColor: `${giColors.accent.red}33`,
    },
    resultSuccess: {
      backgroundColor: `${giColors.accent.green}0D`,
      borderColor: `${giColors.accent.green}33`,
    },
    resultStatus: { fontSize: 10, fontFamily: 'Inter_600SemiBold', padding: 8, paddingBottom: 4 },
    resultContent: {
      fontSize: 10,
      color: colors.mutedForeground,
      paddingHorizontal: 8,
      paddingBottom: 8,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
  });
}
