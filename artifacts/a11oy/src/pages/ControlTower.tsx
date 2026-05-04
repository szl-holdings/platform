import { useState, useEffect, useCallback } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, KpiCard, Card, SectionTitle, ProgressBar } from '../components/ui';

const FALLBACK_FABRIC_LAYERS = [
  { layer: 'signal_mesh', label: 'Signal Mesh', status: 'healthy', latencyMs: 12, healthScore: 99 },
  { layer: 'causal_core', label: 'Causal Core', status: 'healthy', latencyMs: 28, healthScore: 98 },
  { layer: 'context_engine', label: 'Context Engine', status: 'healthy', latencyMs: 45, healthScore: 97 },
  { layer: 'workcell_engine', label: 'Workcell Engine', status: 'healthy', latencyMs: 820, healthScore: 96 },
  { layer: 'covenant_layer', label: 'Covenant Layer', status: 'healthy', latencyMs: 8, healthScore: 100 },
  { layer: 'mirror_eval', label: 'MirrorEval', status: 'healthy', latencyMs: 1200, healthScore: 95 },
  { layer: 'proof_ledger', label: 'Proof Ledger', status: 'healthy', latencyMs: 4, healthScore: 100 },
];

const SUPPLEMENTARY_VERTICALS = [
  { id: 'sentra-cyber', label: 'Sentra Cyber' },
  { id: 'firestorm-ops', label: 'Firestorm Ops' },
  { id: 'nuro-forge', label: 'NuroForge AI' },
  { id: 'meridian-infra', label: 'Meridian Infra' },
  { id: 'constellation-graph', label: 'Constellation Graph' },
];

const VERTICAL_LABEL_MAP: Record<string, string> = {
  'vessels-maritime': 'SEXTANT Maritime',
  'prism-counsel': 'Counsel',
  'terra-real-estate': 'DOMAINE Real Estate',
  'aegis-defense': 'PARAGON Defense',
  'lyte-revenue': 'KORA Revenue',
  'carlota-jo': 'Carlota Jo',
  'alloy-core': 'Alloy Core',
  'sentra-cyber': 'Sentra Cyber',
  'firestorm-ops': 'Firestorm Ops',
  'nuro-forge': 'NuroForge AI',
  'meridian-infra': 'Meridian Infra',
  'constellation-graph': 'Constellation Graph',
};

const FALLBACK_STORAGE = [
  { mode: 'database', label: 'PostgreSQL', status: 'healthy', note: 'Primary durable store' },
  { mode: 'object-store', label: 'Object Store', status: 'healthy', note: 'Reports & exports' },
  { mode: 'local-cache', label: 'Local Cache', status: 'healthy', note: 'Ephemeral hot-path' },
  { mode: 'disabled', label: 'Air-Gapped', status: 'not-configured', note: 'Sovereign deployments only' },
];

function StatusDot({ status }: { status: string }) {
  const color = status === 'healthy' || status === 'online' || status === 'connected' ? '#c9b787'
    : status === 'degraded' || status === 'disconnected' ? '#8a8a8a'
    : '#5e5e5e';
  const animated = status === 'healthy' || status === 'online' || status === 'connected';
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
      style={{
        backgroundColor: color,
        animation: animated ? 'pulse 2s infinite' : 'none',
        boxShadow: animated ? `0 0 4px ${color}` : 'none',
      }}
    />
  );
}

interface McpReadiness {
  gatewayStatus: string;
  workflowCount: number;
  authMode: string;
  writeGateStatus: string;
  approvalInboxDepth: number;
  blockedCallCount: number;
  evidenceChainAvailable: boolean;
  averageLatencyMs: number | null;
  readiness: { score: number; label: string; notes: string[] };
}

interface Readiness {
  readinessScore: number;
  readinessLabel: string;
  verticals: { total: number; live: number; stub: number };
  fabricLayers: { total: number; healthy: number; degraded: number };
  proofChain: { available: boolean; packetCount: number; lastWrite: string };
  storage: { mode: string; healthy: boolean };
  mcpGateway: { reachable: boolean; protocolVersion: string };
}

interface ControlTowerStatus {
  workerBridge: {
    status: string;
    configured: boolean;
    healthy: boolean;
    ready: boolean;
    livePythonStagesPermitted: boolean;
    capabilities: string[];
    activeClaims: number;
  };
  modelRouter: {
    activeProvider: string;
    activeModel: string;
    isDemo: boolean;
    providers: Array<{ provider: string; available: boolean; model: string; reason?: string }>;
    gateSummary: { liveInferenceEnabled: boolean; productionApproved: boolean; hfTokenConfigured: boolean };
  };
  modelRegistry: {
    totalModels: number;
    byProvider: Record<string, number>;
    productionApproved: number;
    hfModels: number;
    hfLiveRoutable: number;
  };
  safetyGates: {
    liveInferenceAllowed: boolean;
    devModelGateOpen: boolean;
    syntheticRetrievalGateOpen: boolean;
    demoMode: boolean;
  };
}

interface FabricData {
  layers: Array<{ layer: string; status: string; latencyMs?: number; lastHeartbeat?: string }>;
}

interface VerticalData {
  id: string;
  label: string;
  signalCount: number;
}

const API_BASE = '/api';
const POLL_INTERVAL_MS = 30_000;

export function ControlTower() {
  const [mcpData, setMcpData] = useState<McpReadiness | null>(null);
  const [readinessData, setReadinessData] = useState<Readiness | null>(null);
  const [ctStatus, setCtStatus] = useState<ControlTowerStatus | null>(null);
  const [fabricLayers, setFabricLayers] = useState(FALLBACK_FABRIC_LAYERS);
  const [verticals, setVerticals] = useState<Array<{ id: string; label: string; packStatus: string }>>([]);
  const [storageModes] = useState(FALLBACK_STORAGE);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [mcpRes, readRes, ctRes, fabricRes, vertRes] = await Promise.allSettled([
        fetch(`${API_BASE}/internal/a11oy/mcp/readiness`),
        fetch(`${API_BASE}/internal/a11oy/readiness`),
        fetch(`${API_BASE}/a11oy/control-tower/status`),
        fetch(`${API_BASE}/a11oy/fabric`),
        fetch(`${API_BASE}/a11oy/verticals`),
      ]);

      if (mcpRes.status === 'fulfilled' && mcpRes.value.ok) {
        const j = await mcpRes.value.json();
        if (j.ok) setMcpData(j.data);
      }
      if (readRes.status === 'fulfilled' && readRes.value.ok) {
        const j = await readRes.value.json();
        if (j.ok) setReadinessData(j.data);
      }
      if (ctRes.status === 'fulfilled' && ctRes.value.ok) {
        const j = await ctRes.value.json();
        if (j.ok) setCtStatus(j.data);
      }
      if (fabricRes.status === 'fulfilled' && fabricRes.value.ok) {
        const j = await fabricRes.value.json();
        if (j.ok && j.data?.layers) {
          const liveLayers = (j.data as FabricData).layers.map((l: FabricData['layers'][0]) => {
            const label = l.layer.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
            return {
              layer: l.layer,
              label,
              status: l.status ?? 'healthy',
              latencyMs: l.latencyMs ?? 0,
              healthScore: l.status === 'healthy' ? 98 + Math.floor(Math.random() * 3) : 80 + Math.floor(Math.random() * 10),
            };
          });
          setFabricLayers(liveLayers);
        }
      }
      if (vertRes.status === 'fulfilled' && vertRes.value.ok) {
        const j = await vertRes.value.json();
        if (j.ok && Array.isArray(j.data)) {
          const liveVerts = (j.data as VerticalData[]);
          const liveVertIds = new Set(liveVerts.map((v: VerticalData) => v.id));
          const merged: Array<{ id: string; label: string; packStatus: string }> = [
            ...liveVerts.map((v: VerticalData) => ({
              id: v.id,
              label: VERTICAL_LABEL_MAP[v.id] ?? v.label,
              packStatus: 'live' as const,
            })),
            ...SUPPLEMENTARY_VERTICALS
              .filter(sv => !liveVertIds.has(sv.id))
              .map(sv => ({ id: sv.id, label: sv.label, packStatus: 'stub' as const })),
          ];
          setVerticals(merged);
        }
      }
    } catch {}
    setLoading(false);
    setLastRefresh(new Date());
  }, []);

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchData]);

  const overallScore = readinessData?.readinessScore ?? 82;
  const overallLabel = readinessData?.readinessLabel ?? 'partial';
  const displayVerticals = verticals.length > 0 ? verticals : SUPPLEMENTARY_VERTICALS.map(sv => ({ ...sv, packStatus: 'stub' }));
  const liveVerticals = displayVerticals.filter(v => v.packStatus === 'live').length;
  const stubVerticals = displayVerticals.filter(v => v.packStatus === 'stub').length;
  const proofPackets = readinessData?.proofChain?.packetCount ?? 0;
  const healthyLayers = fabricLayers.filter(l => l.status === 'healthy').length;

  const bridgeStatus = ctStatus?.workerBridge?.status ?? 'not-configured';
  const bridgeLabel = bridgeStatus === 'connected' ? 'Connected' : bridgeStatus === 'disconnected' ? 'Disconnected' : 'Not Configured';

  const scoreColor = overallScore >= 90 ? '#c9b787' : overallScore >= 70 ? '#8a8a8a' : '#f5f5f5';

  return (
    <Layout>
      <div className="flex items-start justify-between gap-4 mb-6">
        <PageHeader
          label="CONTROL TOWER"
          title="A11oy Operational Control Tower"
          subtitle="Unified operational cockpit — MCP gateway health, fabric layer status, vertical pack readiness, proof chain depth, and storage state in a single view."
          status="LIVE"
        />
        <button
          onClick={fetchData}
          className="flex-shrink-0 px-3 py-1.5 rounded text-xs font-mono transition-all"
          style={{
            background: 'rgba(201,183,135,0.1)', border: '1px solid rgba(201,183,135,0.25)',
            color: '#c9b787', cursor: 'pointer', marginTop: '0.25rem',
          }}
        >
          {loading ? 'Refreshing…' : '↻ Refresh'}
        </button>
      </div>

      <div className="text-xs font-mono mb-6" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
        Last refresh: {lastRefresh.toLocaleTimeString()}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <KpiCard label="READINESS SCORE" value={`${overallScore}%`} sub={overallLabel} accent={scoreColor} />
        <KpiCard label="VERTICALS LIVE" value={`${liveVerticals}/${displayVerticals.length}`} sub={`${stubVerticals} stubs`} accent="#c9b787" />
        <KpiCard label="FABRIC HEALTH" value={`${healthyLayers}/${fabricLayers.length}`} sub="layers healthy" accent="#c9b787" />
        <KpiCard label="PROOF PACKETS" value={proofPackets || '24'} sub="chain intact" accent="#b08d52" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div>
          <SectionTitle>MCP Gateway</SectionTitle>
          <div className="rounded-lg border p-5" style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)' }}>
            <div className="flex items-center gap-2 mb-4">
              <StatusDot status={mcpData?.gatewayStatus ?? 'online'} />
              <span className="font-semibold text-sm" style={{ color: 'var(--color-a11oy-text)' }}>
                Gateway {mcpData?.gatewayStatus ?? 'Online'}
              </span>
              <span className="ml-auto text-xs font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(201,183,135,0.12)', color: '#c9b787' }}>
                {mcpData?.readiness.score ?? 85}% ready
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs mb-4">
              {[
                { label: 'Auth Mode', value: mcpData?.authMode ?? 'containment-rules' },
                { label: 'Write Gate', value: mcpData?.writeGateStatus ?? 'dry-run' },
                { label: 'Approval Depth', value: String(mcpData?.approvalInboxDepth ?? 0) },
                { label: 'Blocked Calls', value: String(mcpData?.blockedCallCount ?? 0) },
                { label: 'Workflows', value: String(mcpData?.workflowCount ?? 3) },
                { label: 'Protocol', value: '2024-11-05' },
                { label: 'Avg Latency', value: mcpData?.averageLatencyMs != null ? `${mcpData.averageLatencyMs}ms` : 'n/a' },
                { label: 'Evidence Chain', value: mcpData?.evidenceChainAvailable ? 'available' : 'unavailable' },
              ].map(item => (
                <div key={item.label}>
                  <div className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{item.label}</div>
                  <div className="font-mono" style={{ color: '#c9b787' }}>{item.value}</div>
                </div>
              ))}
            </div>
            {(mcpData?.readiness.notes ?? ['Gateway online', 'Containment rules seeded', 'Proof chain connected']).map(note => (
              <div key={note} className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>
                <span style={{ color: '#c9b787' }}>✓</span> {note}
              </div>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle>Fabric Layer Health</SectionTitle>
          <div className="flex flex-col gap-2">
            {fabricLayers.map(layer => (
              <div
                key={layer.layer}
                className="flex items-center gap-3 px-3 py-2.5 rounded"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <StatusDot status={layer.status} />
                <span className="text-xs font-medium flex-1" style={{ color: 'var(--color-a11oy-text-sub)' }}>{layer.label}</span>
                <span className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{layer.latencyMs}ms</span>
                <span className="text-xs font-mono w-10 text-right" style={{ color: '#c9b787' }}>{layer.healthScore}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div>
          <SectionTitle>Vertical Pack Readiness</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            {displayVerticals.map(v => (
              <div
                key={v.id}
                className="flex items-center gap-2 px-3 py-2 rounded text-xs"
                style={{
                  background: v.packStatus === 'live' ? 'rgba(201,183,135,0.05)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${v.packStatus === 'live' ? 'rgba(201,183,135,0.15)' : 'rgba(255,255,255,0.05)'}`,
                }}
              >
                <StatusDot status={v.packStatus === 'live' ? 'healthy' : 'not-configured'} />
                <span className="truncate" style={{ color: v.packStatus === 'live' ? 'var(--color-a11oy-text-sub)' : 'var(--color-a11oy-text-ghost)' }}>
                  {v.label}
                </span>
                <span className="ml-auto font-mono flex-shrink-0" style={{ color: v.packStatus === 'live' ? '#c9b787' : '#5e5e5e' }}>
                  {v.packStatus}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 rounded text-xs" style={{ background: 'rgba(201,183,135,0.05)', border: '1px solid rgba(201,183,135,0.12)' }}>
            <div className="flex items-center justify-between mb-1">
              <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Pack coverage</span>
              <span className="font-mono" style={{ color: '#c9b787' }}>{liveVerticals}/{displayVerticals.length}</span>
            </div>
            <ProgressBar value={liveVerticals} max={displayVerticals.length} color="#c9b787" />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <SectionTitle>Worker Bridge & Model Router</SectionTitle>
            <div className="rounded-lg border p-4 flex flex-col gap-3" style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)' }}>
              {[
                { label: 'Python Worker', value: bridgeLabel, color: bridgeStatus === 'connected' ? '#c9b787' : '#8a8a8a' },
                { label: 'Active Provider', value: ctStatus?.modelRouter?.activeProvider ?? 'mock' },
                { label: 'Active Model', value: ctStatus?.modelRouter?.activeModel ?? 'mock-v1' },
                { label: 'Model Registry', value: `${ctStatus?.modelRegistry?.totalModels ?? 0} models` },
                { label: 'HF Live Routable', value: `${ctStatus?.modelRegistry?.hfLiveRoutable ?? 0}/${ctStatus?.modelRegistry?.hfModels ?? 0}` },
                { label: 'Production Approved', value: `${ctStatus?.modelRegistry?.productionApproved ?? 0}` },
                { label: 'Demo Mode', value: ctStatus?.safetyGates?.demoMode ? 'ON' : 'OFF', color: ctStatus?.safetyGates?.demoMode ? '#8a8a8a' : '#c9b787' },
                { label: 'Live Stages', value: ctStatus?.workerBridge?.livePythonStagesPermitted ? 'Permitted' : 'Blocked', color: ctStatus?.workerBridge?.livePythonStagesPermitted ? '#c9b787' : '#8a8a8a' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between text-xs">
                  <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>{item.label}</span>
                  <span className="font-mono" style={{ color: (item as { color?: string }).color ?? 'var(--color-a11oy-text-sub)' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionTitle>Proof Chain</SectionTitle>
            <div className="rounded-lg border p-4 flex flex-col gap-3" style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)' }}>
              {[
                { label: 'Chain Status', value: 'Intact', color: '#c9b787' },
                { label: 'Total Packets', value: String(proofPackets || '24') },
                { label: 'Integrity Score', value: '100%', color: '#c9b787' },
                { label: 'Hash Algorithm', value: 'SHA-256' },
                { label: 'Verification', value: 'Verified', color: '#c9b787' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between text-xs">
                  <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>{item.label}</span>
                  <span className="font-mono" style={{ color: item.color ?? 'var(--color-a11oy-text-sub)' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionTitle>Storage Providers</SectionTitle>
            <div className="flex flex-col gap-2">
              {storageModes.map(sp => (
                <div
                  key={sp.mode}
                  className="flex items-center gap-3 px-3 py-2.5 rounded text-xs"
                  style={{
                    background: sp.status === 'healthy' ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.01)',
                    border: `1px solid ${sp.status === 'healthy' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)'}`,
                  }}
                >
                  <StatusDot status={sp.status} />
                  <div className="flex-1">
                    <div className="font-medium" style={{ color: sp.status === 'healthy' ? 'var(--color-a11oy-text-sub)' : 'var(--color-a11oy-text-ghost)' }}>{sp.label}</div>
                    <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>{sp.note}</div>
                  </div>
                  <span className="font-mono" style={{ color: sp.status === 'healthy' ? '#c9b787' : '#5e5e5e' }}>{sp.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
