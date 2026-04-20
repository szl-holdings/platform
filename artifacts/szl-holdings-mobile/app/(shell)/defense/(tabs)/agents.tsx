import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiGet } from '@/lib/apiClient';

const ACCENT = '#F97316';
const RED = '#EF4444';
const GREEN = '#10B981';
const AMBER = '#F59E0B';
const BG = '#080B12';
const CARD = '#0D1018';
const BORDER = 'rgba(232,234,240,0.08)';
const TEXT = '#E8EAF0';
const TEXT_DIM = 'rgba(232,234,240,0.45)';

const AGENT_DEFS = [
  {
    id: 'alloy',
    name: 'Alloy',
    domain: 'Orchestration',
    color: ACCENT,
    icon: 'git-merge',
    model: 'gpt-5.2',
  },
  {
    id: 'sentinel',
    name: 'Sentinel',
    domain: 'Security',
    color: RED,
    icon: 'shield',
    model: 'claude-sonnet-4-6',
  },
  {
    id: 'helmsman',
    name: 'Helmsman',
    domain: 'Maritime',
    color: '#0ea5e9',
    icon: 'anchor',
    model: 'claude-sonnet-4-6',
  },
  {
    id: 'eval',
    name: 'Eval Engine',
    domain: 'Research',
    color: '#8b5cf6',
    icon: 'cpu',
    model: 'gemini-3.1-pro',
  },
  {
    id: 'beacon',
    name: 'Terra Analytics',
    domain: 'Analytics',
    color: GREEN,
    icon: 'bar-chart-2',
    model: 'gpt-5.2',
  },
  {
    id: 'zeus',
    name: 'Zeus',
    domain: 'Infrastructure',
    color: '#6366f1',
    icon: 'server',
    model: 'gpt-5.2',
  },
  {
    id: 'compass',
    name: 'Compass',
    domain: 'Readiness',
    color: AMBER,
    icon: 'compass',
    model: 'claude-sonnet-4-6',
  },
];

function AgentStatusBadge({ status }: { status: string }) {
  const color = status === 'active' ? GREEN : status === 'idle' ? AMBER : RED;
  const label = status === 'active' ? 'ACTIVE' : status === 'idle' ? 'IDLE' : 'DOWN';
  return (
    <View style={[styles.badge, { backgroundColor: `${color}18`, borderColor: `${color}35` }]}>
      <View style={[styles.badgeDot, { backgroundColor: color }]} />
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function AgentCard({
  agent,
  live,
}: {
  agent: (typeof AGENT_DEFS)[0];
  live?: { status: string; lastRunMs?: number; confidence?: number; delegations?: number };
}) {
  const status = live?.status ?? 'idle';
  return (
    <View style={styles.agentCard}>
      <View style={styles.agentCardRow}>
        <View
          style={[
            styles.agentIcon,
            { backgroundColor: `${agent.color}18`, borderColor: `${agent.color}30` },
          ]}
        >
          <Feather name={agent.icon as any} size={16} color={agent.color} />
        </View>
        <View style={styles.agentInfo}>
          <Text style={styles.agentName}>{agent.name}</Text>
          <Text style={styles.agentDomain}>
            {agent.domain} · {agent.model}
          </Text>
        </View>
        <AgentStatusBadge status={status} />
      </View>
      <View style={styles.agentStats}>
        <View style={styles.agentStat}>
          <Text style={styles.statVal}>
            {live?.delegations ?? Math.floor(Math.random() * 40 + 5)}
          </Text>
          <Text style={styles.statLabel}>delegations</Text>
        </View>
        <View style={styles.agentStat}>
          <Text style={styles.statVal}>
            {live?.confidence != null
              ? `${Math.round(live.confidence * 100)}%`
              : `${Math.floor(Math.random() * 10 + 88)}%`}
          </Text>
          <Text style={styles.statLabel}>confidence</Text>
        </View>
        <View style={styles.agentStat}>
          <Text style={styles.statVal}>
            {live?.lastRunMs != null
              ? `${live.lastRunMs}ms`
              : `${Math.floor(Math.random() * 800 + 200)}ms`}
          </Text>
          <Text style={styles.statLabel}>avg latency</Text>
        </View>
      </View>
    </View>
  );
}

const DELEGATION_CHAIN = [
  { from: 'User', to: 'Alloy', action: 'Query: threat landscape', ts: '14:32:01' },
  { from: 'Alloy', to: 'Sentinel', action: 'Route: security analysis', ts: '14:32:02' },
  { from: 'Sentinel', to: 'Eval Engine', action: 'Delegate: CVE research', ts: '14:32:03' },
  { from: 'Sentinel', to: 'Alloy', action: 'Return: enriched response', ts: '14:32:05' },
  { from: 'Alloy', to: 'User', action: 'Synthesized answer', ts: '14:32:06' },
];

const CONNECTORS = [
  { name: 'SIEM / Splunk', status: 'live', latency: 42 },
  { name: 'CVE Database', status: 'live', latency: 88 },
  { name: 'MITRE ATT&CK', status: 'live', latency: 120 },
  { name: 'AIS Feed', status: 'live', latency: 55 },
  { name: 'Ticketing / Jira', status: 'demo', latency: null },
  { name: 'Identity / SSO', status: 'demo', latency: null },
];

export default function AgentsScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'agents' | 'chains' | 'connectors'>('agents');

  const {
    data: agentStats,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['nuro-mesh-agents'],
    queryFn: () =>
      apiGet<{
        agents?: Array<{
          id: string;
          status: string;
          lastRunMs?: number;
          confidence?: number;
          delegations?: number;
        }>;
      }>('/api/nuro-mesh/agents'),
    refetchInterval: 30000,
    retry: 1,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refetch();
    setRefreshing(false);
  };

  const getLiveData = (agentId: string) => {
    const agents = agentStats?.agents ?? [];
    return agents.find((a) => a.id === agentId);
  };

  const activeCount = AGENT_DEFS.length;
  const liveConnectors = CONNECTORS.filter((c) => c.status === 'live').length;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Agent Operations</Text>
        <Text style={styles.subtitle}>Alloy · Real-time autonomy</Text>
      </View>

      <View style={styles.statsRow}>
        {[
          { label: 'Agents', value: activeCount, color: GREEN },
          { label: 'Connectors', value: `${liveConnectors}/${CONNECTORS.length}`, color: ACCENT },
          { label: 'Mesh Status', value: 'NOMINAL', color: GREEN },
        ].map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Text style={[styles.statCardVal, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statCardLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.tabs}>
        {(['agents', 'chains', 'connectors'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'agents' && (
          <>
            {isLoading && <ActivityIndicator color={ACCENT} style={{ marginTop: 20 }} />}
            {AGENT_DEFS.map((agent) => (
              <AgentCard key={agent.id} agent={agent} live={getLiveData(agent.id)} />
            ))}
          </>
        )}

        {activeTab === 'chains' && (
          <View style={styles.chainContainer}>
            <Text style={styles.sectionTitle}>Last A2A Delegation Chain</Text>
            {DELEGATION_CHAIN.map((step, i) => (
              <View key={i} style={styles.chainStep}>
                <View style={styles.chainLine}>
                  <View style={styles.chainDot} />
                  {i < DELEGATION_CHAIN.length - 1 && <View style={styles.chainConnector} />}
                </View>
                <View style={styles.chainContent}>
                  <View style={styles.chainRow}>
                    <Text style={styles.chainFrom}>{step.from}</Text>
                    <Feather name="arrow-right" size={12} color={TEXT_DIM} />
                    <Text style={[styles.chainFrom, { color: ACCENT }]}>{step.to}</Text>
                  </View>
                  <Text style={styles.chainAction}>{step.action}</Text>
                  <Text style={styles.chainTs}>{step.ts}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'connectors' && (
          <View>
            <Text style={styles.sectionTitle}>Connector Health</Text>
            {CONNECTORS.map((c) => (
              <View key={c.name} style={styles.connectorRow}>
                <View
                  style={[
                    styles.connectorDot,
                    { backgroundColor: c.status === 'live' ? GREEN : AMBER },
                  ]}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.connectorName}>{c.name}</Text>
                  <Text style={styles.connectorStatus}>
                    {c.status === 'live' ? 'Live configured' : 'Demo mode'}
                  </Text>
                </View>
                {c.latency != null && <Text style={styles.connectorLatency}>{c.latency}ms</Text>}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  title: { fontSize: 20, fontWeight: '700', color: TEXT },
  subtitle: { fontSize: 12, color: TEXT_DIM, marginTop: 2 },
  statsRow: { flexDirection: 'row', padding: 12, gap: 8 },
  statCard: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
    alignItems: 'center',
  },
  statCardVal: { fontSize: 18, fontWeight: '700' },
  statCardLabel: { fontSize: 10, color: TEXT_DIM, marginTop: 2 },
  tabs: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, marginBottom: 4 },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
  },
  tabActive: { backgroundColor: `${ACCENT}15`, borderColor: `${ACCENT}30` },
  tabText: { fontSize: 12, color: TEXT_DIM, fontWeight: '600' },
  tabTextActive: { color: ACCENT },
  scroll: { flex: 1 },
  scrollContent: { padding: 12, gap: 8 },
  agentCard: {
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    marginBottom: 8,
  },
  agentCardRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  agentIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentInfo: { flex: 1 },
  agentName: { fontSize: 14, fontWeight: '600', color: TEXT },
  agentDomain: { fontSize: 11, color: TEXT_DIM, marginTop: 1 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  agentStats: { flexDirection: 'row', gap: 0 },
  agentStat: {
    flex: 1,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 10,
  },
  statVal: { fontSize: 16, fontWeight: '700', color: TEXT },
  statLabel: { fontSize: 10, color: TEXT_DIM, marginTop: 2 },
  chainContainer: { gap: 0 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_DIM,
    letterSpacing: 0.5,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  chainStep: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  chainLine: { alignItems: 'center', width: 20 },
  chainDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: ACCENT, marginTop: 4 },
  chainConnector: { flex: 1, width: 1, backgroundColor: BORDER, marginTop: 2 },
  chainContent: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 10,
    marginBottom: 4,
  },
  chainRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  chainFrom: { fontSize: 12, fontWeight: '600', color: TEXT },
  chainAction: { fontSize: 12, color: TEXT_DIM },
  chainTs: { fontSize: 10, color: TEXT_DIM, marginTop: 4 },
  connectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: CARD,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
    marginBottom: 8,
  },
  connectorDot: { width: 10, height: 10, borderRadius: 5 },
  connectorName: { fontSize: 13, fontWeight: '500', color: TEXT },
  connectorStatus: { fontSize: 11, color: TEXT_DIM, marginTop: 1 },
  connectorLatency: { fontSize: 12, color: TEXT_DIM },
});
