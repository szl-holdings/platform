import { useState, useEffect, useCallback } from 'react';

const GOLD = '#c9b787';
const BG = '#0a0a0a';
const CARD_BG = 'rgba(255,255,255,0.03)';
const BORDER = 'rgba(255,255,255,0.08)';
const TEXT = '#f5f5f5';
const TEXT_DIM = '#8a8a8a';
const GREEN = '#22c55e';
const RED = '#ef4444';
const ORANGE = '#f97316';
const BLUE = '#60a5fa';

const BASE_URL = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');
function api(path: string) {
  return `${BASE_URL}/api${path}`;
}

interface ModuleStatus {
  status: string;
  [k: string]: unknown;
}
interface HealthData {
  status: string;
  checkedAt: string;
  modules: Record<string, ModuleStatus>;
}
interface Worker {
  workerId: string;
  name: string;
  rolloutGroup: string;
  configChecksum: string;
  status: string;
  isDraining: boolean;
  capabilities: string[];
  requestsHandled: number;
  errorsCount: number;
  avgLatencyMs?: number;
  registeredAt: string;
}
interface RuntimeEvent {
  eventId: string;
  eventType: string;
  requestId?: string;
  payload: Record<string, unknown>;
  occurredAt: string;
}
interface RouteDecision {
  routeDecisionId: string;
  requestId: string;
  selectedModel: string;
  selectedProvider: string;
  scoringMode: string;
  compositeScore?: number;
  isFallback: boolean;
  estimatedLatencyMs?: number;
  estimatedCostUsd?: number;
  decidedAt: string;
}
interface ProofChain {
  proofChainId: string;
  requestId: string;
  model?: string;
  provider?: string;
  auditHash: string;
  executionSucceeded: boolean;
  confidenceScore?: number;
  latencyMs?: number;
  completedPhases: string[];
  createdAt: string;
}
interface MemoryStats {
  totalEntries: number;
  tenantEntries: number;
  avgContextReuseScore: number;
  hitRate: number;
}

function Badge({ children, color = GOLD }: { children: string; color?: string }) {
  return (
    <span style={{
      display: 'inline-block', padding: '1px 8px', borderRadius: 4, fontSize: 10,
      fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
      background: `${color}22`, color, border: `1px solid ${color}44`,
    }}>
      {children}
    </span>
  );
}
function StatusDot({ status }: { status: string }) {
  const color = status === 'operational' || status === 'active' || status === 'completed' ? GREEN
    : status === 'degraded' || status === 'draining' || status === 'warning' ? ORANGE
    : status === 'offline' || status === 'failed' ? RED : TEXT_DIM;
  return (
    <span style={{
      display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
      background: color, marginRight: 6, flexShrink: 0,
      boxShadow: `0 0 4px ${color}88`,
    }} />
  );
}
function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: TEXT_DIM }}>
          {title}
        </span>
        {action}
      </div>
      {children}
    </div>
  );
}
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: TEXT_DIM, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${BORDER}` }}>
      {children}
    </div>
  );
}
function KeyVal({ label, value, mono = false }: { label: string; value: string | number | undefined; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: `1px solid ${BORDER}` }}>
      <span style={{ fontSize: 11, color: TEXT_DIM }}>{label}</span>
      <span style={{ fontSize: 11, color: TEXT, fontFamily: mono ? 'monospace' : undefined }}>{value ?? '—'}</span>
    </div>
  );
}
function LiveTag() {
  return (
    <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: GREEN, border: `1px solid ${GREEN}44`, borderRadius: 3, padding: '1px 5px' }}>
      LIVE
    </span>
  );
}
function DemoTag() {
  return (
    <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: ORANGE, border: `1px solid ${ORANGE}44`, borderRadius: 3, padding: '1px 5px' }}>
      DEMO
    </span>
  );
}

async function fetchApi<T>(path: string, opts?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(api(path), { headers: { 'Content-Type': 'application/json' }, ...opts });
    if (!res.ok) return null;
    const json = await res.json() as { data?: T };
    return json.data ?? null;
  } catch {
    return null;
  }
}

const MODULE_ICONS: Record<string, string> = {
  cortexRouter: '⟁', memoryFabric: '◈', phaseEngine: '◉', slaPlanner: '◎',
  workerRegistry: '⬡', guidedOutputGuard: '⬓', proofChain: '⛓', eventPlane: '⟳',
};
const MODULE_LABELS: Record<string, string> = {
  cortexRouter: 'Cortex Router', memoryFabric: 'Memory Fabric', phaseEngine: 'Phase Engine',
  slaPlanner: 'SLA Planner', workerRegistry: 'Worker Registry', guidedOutputGuard: 'Guided Output Guard',
  proofChain: 'Proof Chain', eventPlane: 'Event Plane',
};
const PHASES = ['INGEST', 'NORMALIZE', 'RETRIEVE', 'PLAN', 'REASON', 'APPROVE', 'EXECUTE', 'VERIFY', 'AUDIT', 'DELIVER'] as const;

function reltime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return '<1m ago';
  if (m < 60) return `${m}m ago`;
  return `${Math.round(m / 60)}h ago`;
}
function EventTypeTag({ type }: { type: string }) {
  const color = type.startsWith('guard') || type.startsWith('sla') || type.startsWith('phase.fail') ? ORANGE
    : type.startsWith('proof') || type.startsWith('worker.reg') ? GREEN
    : type.startsWith('memory') ? BLUE
    : type.startsWith('route') ? GOLD : TEXT_DIM;
  return <Badge color={color}>{type.replace('.', ' ')}</Badge>;
}

function RouterTestDrive({ onDecision }: { onDecision: (d: RouteDecision) => void }) {
  const [scoringMode, setScoringMode] = useState('balanced');
  const [domain, setDomain] = useState('maritime');
  const [loading, setLoading] = useState(false);

  const fire = async () => {
    setLoading(true);
    const result = await fetchApi<RouteDecision>('/a11oy/cognitive/route', {
      method: 'POST',
      body: JSON.stringify({ scoringMode, domain }),
    });
    if (result) onDecision(result);
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, padding: 12, background: 'rgba(0,0,0,0.2)', borderRadius: 6 }}>
      <select value={scoringMode} onChange={(e) => setScoringMode(e.target.value)} style={{ background: '#1a1a1a', color: TEXT, border: `1px solid ${BORDER}`, borderRadius: 4, padding: '4px 8px', fontSize: 11 }}>
        {['balanced', 'latency', 'cost', 'confidence', 'sla'].map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
      <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="domain" style={{ background: '#1a1a1a', color: TEXT, border: `1px solid ${BORDER}`, borderRadius: 4, padding: '4px 8px', fontSize: 11, width: 100 }} />
      <button onClick={fire} disabled={loading} style={{ padding: '4px 12px', background: loading ? 'transparent' : GOLD, border: `1px solid ${GOLD}`, borderRadius: 4, color: loading ? GOLD : '#0a0a0a', fontSize: 11, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? '…' : 'Fire Route'}
      </button>
    </div>
  );
}

function MemoryLookupForm() {
  const [key, setKey] = useState('');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const lookup = async () => {
    if (!key) return;
    setLoading(true);
    const r = await fetchApi<Record<string, unknown>>('/a11oy/cognitive/memory/lookup', {
      method: 'POST',
      body: JSON.stringify({ memoryKey: key }),
    });
    setResult(r ?? { hit: false, error: 'request failed' });
    setLoading(false);
  };

  return (
    <div style={{ marginBottom: 16, padding: 12, background: 'rgba(0,0,0,0.2)', borderRadius: 6 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="memoryKey" style={{ flex: 1, background: '#1a1a1a', color: TEXT, border: `1px solid ${BORDER}`, borderRadius: 4, padding: '4px 8px', fontSize: 11 }} />
        <button onClick={lookup} disabled={loading} style={{ padding: '4px 12px', background: loading ? 'transparent' : BLUE, border: `1px solid ${BLUE}`, borderRadius: 4, color: loading ? BLUE : '#0a0a0a', fontSize: 11, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? '…' : 'Lookup'}
        </button>
      </div>
      {result && (
        <div style={{ fontSize: 11, fontFamily: 'monospace', color: (result as { hit?: boolean }).hit ? GREEN : TEXT_DIM }}>
          {JSON.stringify(result, null, 2)}
        </div>
      )}
    </div>
  );
}

export function RuntimeCommandCenter() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [events, setEvents] = useState<RuntimeEvent[]>([]);
  const [routeDecisions, setRouteDecisions] = useState<RouteDecision[]>([]);
  const [proofChains, setProofChains] = useState<ProofChain[]>([]);
  const [memStats, setMemStats] = useState<MemoryStats | null>(null);
  const [guardEvents, setGuardEvents] = useState<RuntimeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'router' | 'memory' | 'phases' | 'workers' | 'proofs' | 'events' | 'guard'>('overview');
  const [executing, setExecuting] = useState(false);
  const [execResult, setExecResult] = useState<Record<string, unknown> | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [h, w, e, rd, pc, ms, ge] = await Promise.all([
      fetchApi<HealthData>('/a11oy/cognitive/health'),
      fetchApi<Worker[]>('/a11oy/cognitive/workers'),
      fetchApi<RuntimeEvent[]>('/a11oy/cognitive/events'),
      fetchApi<RouteDecision[]>('/a11oy/cognitive/route-decisions?limit=20'),
      fetchApi<ProofChain[]>('/a11oy/cognitive/proof-chains'),
      fetchApi<MemoryStats>('/a11oy/cognitive/memory/stats'),
      fetchApi<RuntimeEvent[]>('/a11oy/cognitive/events?eventType=guard.rejected&limit=20'),
    ]);
    if (h) setHealth(h);
    if (w) setWorkers(w);
    if (e) setEvents(e);
    if (ms) setMemStats(ms);
    if (ge) setGuardEvents(ge);
    if (rd && rd.length > 0) setRouteDecisions(rd);
    if (pc) setProofChains(pc);

    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleExecute = async () => {
    setExecuting(true);
    setExecResult(null);
    const result = await fetchApi<Record<string, unknown>>('/a11oy/cognitive/execute', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'Analyze latest vessel compliance signals and surface top 3 remediation priorities.', domain: 'vessels-maritime' }),
    });
    setExecResult(result ?? { error: 'Request failed — CSRF protection is active. Use from UI only.' });
    setExecuting(false);
    // Refresh data after execution to pick up new proof chain + events
    setTimeout(refresh, 500);
  };

  const addRouteDecision = (d: RouteDecision) => {
    setRouteDecisions((prev) => [d, ...prev].slice(0, 20));
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'router', label: 'Cortex Router' },
    { id: 'memory', label: 'Memory Fabric' },
    { id: 'phases', label: 'Phase Engine' },
    { id: 'workers', label: 'Worker Registry' },
    { id: 'proofs', label: 'Proof Chain' },
    { id: 'events', label: 'Event Plane' },
    { id: 'guard', label: 'Guard' },
  ] as const;

  const modules = health?.modules ?? {};
  const overallStatus = health?.status ?? (loading ? 'loading' : 'operational');

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: "'Inter', system-ui, sans-serif", padding: '32px 24px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: GOLD, letterSpacing: '-0.02em' }}>
              A11oy — Runtime Command Center
            </h1>
            <LiveTag />
          </div>
          <p style={{ margin: 0, fontSize: 12, color: TEXT_DIM }}>
            Cognitive runtime backbone · Cortex Router · Memory Fabric · Phase Engine · Worker Registry · Proof Chain
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: overallStatus === 'operational' ? '#22c55e18' : '#f9731618', border: `1px solid ${overallStatus === 'operational' ? '#22c55e44' : '#f9731644'}`, borderRadius: 6 }}>
            <StatusDot status={overallStatus} />
            <span style={{ fontSize: 11, fontWeight: 600, color: overallStatus === 'operational' ? GREEN : ORANGE }}>
              {overallStatus === 'operational' ? 'ALL SYSTEMS OPERATIONAL' : overallStatus.toUpperCase()}
            </span>
          </div>
          <button
            onClick={refresh}
            style={{ padding: '6px 12px', background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 6, color: TEXT_DIM, fontSize: 11, cursor: 'pointer' }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, overflowX: 'auto', borderBottom: `1px solid ${BORDER}`, paddingBottom: 0 }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '8px 14px', background: 'transparent', border: 'none',
              borderBottom: activeTab === t.id ? `2px solid ${GOLD}` : '2px solid transparent',
              color: activeTab === t.id ? GOLD : TEXT_DIM, fontSize: 11, fontWeight: 600,
              cursor: 'pointer', letterSpacing: '0.04em', whiteSpace: 'nowrap', marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 24 }}>
            {Object.entries(MODULE_LABELS).map(([key, label]) => {
              const mod = modules[key] as ModuleStatus | undefined;
              const status = mod?.status ?? (loading ? 'loading' : 'operational');
              return (
                <div key={key} style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 16, color: GOLD }}>{MODULE_ICONS[key]}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: TEXT }}>{label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <StatusDot status={status} />
                    <span style={{ fontSize: 10, color: status === 'operational' ? GREEN : TEXT_DIM }}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </div>
                  {mod && Object.entries(mod).filter(([k]) => k !== 'status' && k !== 'description').slice(0, 2).map(([k, v]) => (
                    <div key={k} style={{ marginTop: 4, fontSize: 10, color: TEXT_DIM }}>
                      {k}: <span style={{ color: TEXT }}>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          <Card title="Live Execution — Test Drive" action={<LiveTag />}>
            <p style={{ margin: '0 0 12px', fontSize: 12, color: TEXT_DIM }}>
              Fires a full 10-phase cognitive execution through the Cortex Router, Phase Engine, and Proof Chain. Result is stored and appears in the Proof Chain tab.
            </p>
            <button
              onClick={handleExecute}
              disabled={executing}
              style={{
                padding: '8px 20px', background: executing ? 'transparent' : GOLD, border: `1px solid ${GOLD}`,
                borderRadius: 6, color: executing ? GOLD : '#0a0a0a', fontSize: 12, fontWeight: 700, cursor: executing ? 'not-allowed' : 'pointer',
              }}
            >
              {executing ? 'Executing…' : 'Run Cognitive Execution'}
            </button>
            {execResult && (
              <div style={{ marginTop: 16, background: 'rgba(0,0,0,0.3)', border: `1px solid ${BORDER}`, borderRadius: 6, padding: 14, fontSize: 11, fontFamily: 'monospace', color: TEXT, maxHeight: 260, overflowY: 'auto' }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{JSON.stringify(execResult, null, 2)}</pre>
              </div>
            )}
          </Card>
        </>
      )}

      {/* CORTEX ROUTER TAB */}
      {activeTab === 'router' && (
        <Card title="Cortex Router — Live Route Decisions" action={<LiveTag />}>
          <RouterTestDrive onDecision={addRouteDecision} />
          {routeDecisions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: TEXT_DIM, fontSize: 12 }}>
              No route decisions yet — fire one above or run a cognitive execution.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {routeDecisions.map((rd, i) => (
                <div key={rd.routeDecisionId || i} style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${BORDER}`, borderRadius: 6, padding: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: GOLD }}>{rd.selectedModel}</span>
                      <span style={{ fontSize: 10, color: TEXT_DIM }}>via {rd.selectedProvider}</span>
                      <Badge>{rd.scoringMode}</Badge>
                      {rd.isFallback && <Badge color={ORANGE}>fallback</Badge>}
                    </div>
                    <span style={{ fontSize: 10, color: TEXT_DIM }}>{reltime(rd.decidedAt)}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 9, color: TEXT_DIM, marginBottom: 2 }}>COMPOSITE SCORE</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: (rd.compositeScore ?? 0) > 0.5 ? GREEN : ORANGE }}>
                        {rd.compositeScore !== undefined ? rd.compositeScore.toFixed(3) : '—'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, color: TEXT_DIM, marginBottom: 2 }}>EST. LATENCY</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{rd.estimatedLatencyMs ? `${rd.estimatedLatencyMs}ms` : '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, color: TEXT_DIM, marginBottom: 2 }}>REQUEST ID</div>
                      <div style={{ fontSize: 10, fontFamily: 'monospace', color: TEXT_DIM }}>{rd.requestId || '—'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 12, padding: 10, background: '#c9b78708', border: `1px solid #c9b78733`, borderRadius: 6, fontSize: 11, color: GOLD }}>
            ℹ Multi-criteria scoring: latency (0.7 weight in latency mode), cost (0.15), confidence (0.15). Hard SLA filters exclude candidates that exceed maxLatencyMs / maxCostUsd / minConfidence before scoring.
          </div>
        </Card>
      )}

      {/* MEMORY FABRIC TAB */}
      {activeTab === 'memory' && (
        <Card title="Memory Fabric — Context Reuse" action={<LiveTag />}>
          {memStats && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Tenant Entries', value: String(memStats.tenantEntries), color: GOLD },
                { label: 'Total Entries', value: String(memStats.totalEntries), color: TEXT_DIM },
                { label: 'Avg Reuse Score', value: memStats.avgContextReuseScore.toFixed(2), color: GREEN },
                { label: 'Hit Rate', value: `${(memStats.hitRate * 100).toFixed(1)}%`, color: BLUE },
              ].map((s) => (
                <div key={s.label} style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${BORDER}`, borderRadius: 6, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: TEXT_DIM }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
          <SectionTitle>Live Memory Events</SectionTitle>
          {events.filter((e) => e.eventType.startsWith('memory.')).slice(0, 12).length === 0 ? (
            <div style={{ color: TEXT_DIM, fontSize: 11, padding: 12 }}>No memory events yet — run an execution or perform a lookup below.</div>
          ) : (
            events.filter((e) => e.eventType.startsWith('memory.')).slice(0, 12).map((e) => (
              <div key={e.eventId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${BORDER}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <EventTypeTag type={e.eventType} />
                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: TEXT }}>{String(e.payload.memoryKey ?? '')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {e.payload.contextReuseScore !== undefined && (
                    <span style={{ fontSize: 11, color: (e.payload.contextReuseScore as number) > 0.7 ? GREEN : ORANGE }}>
                      reuse: {(e.payload.contextReuseScore as number).toFixed(2)}
                    </span>
                  )}
                  <span style={{ fontSize: 10, color: TEXT_DIM }}>{reltime(e.occurredAt)}</span>
                </div>
              </div>
            ))
          )}
          <div style={{ marginTop: 16 }}>
            <SectionTitle>Key Lookup</SectionTitle>
            <MemoryLookupForm />
          </div>
          <div style={{ marginTop: 8, padding: 12, background: '#f9731608', border: `1px solid #f9731633`, borderRadius: 6, fontSize: 11, color: ORANGE }}>
            ⚠ Tenant isolation is enforced hard. Cross-tenant access throws <code style={{ fontFamily: 'monospace' }}>TENANT_ISOLATION_BREACH</code> immediately. Workspace-scoped entries (written with workspaceId) are only visible from the same workspace.
          </div>
        </Card>
      )}

      {/* PHASE ENGINE TAB */}
      {activeTab === 'phases' && (
        <Card title="Phase Engine — 10-Phase Execution Waterfall" action={<LiveTag />}>
          <div style={{ marginBottom: 12, fontSize: 11, color: TEXT_DIM }}>
            INGEST → NORMALIZE → RETRIEVE → PLAN → REASON → APPROVE → EXECUTE → VERIFY → AUDIT → DELIVER
          </div>
          {proofChains.length === 0 ? (
            <div style={{ color: TEXT_DIM, fontSize: 12, padding: 24, textAlign: 'center' }}>
              No phase runs yet — run a cognitive execution from the Overview tab.
            </div>
          ) : (
            proofChains.slice(0, 5).map((pc) => (
              <div key={pc.proofChainId} style={{ marginBottom: 16, background: 'rgba(0,0,0,0.3)', border: `1px solid ${BORDER}`, borderRadius: 6, padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: TEXT }}>{pc.requestId}</span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {pc.latencyMs && <span style={{ fontSize: 10, color: TEXT_DIM }}>{pc.latencyMs}ms total</span>}
                    <Badge color={pc.executionSucceeded ? GREEN : RED}>{pc.executionSucceeded ? 'success' : 'failed'}</Badge>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {PHASES.map((ph) => {
                    const done = pc.completedPhases.includes(ph);
                    return (
                      <div key={ph} style={{
                        padding: '3px 8px', borderRadius: 4, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
                        background: done ? `${GREEN}18` : `${RED}18`,
                        border: `1px solid ${done ? GREEN : RED}44`,
                        color: done ? GREEN : RED,
                      }}>
                        {ph}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </Card>
      )}

      {/* WORKERS TAB */}
      {activeTab === 'workers' && (
        <Card title="Worker Registry" action={<LiveTag />}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Active', value: workers.filter((w) => w.status === 'active').length, color: GREEN },
              { label: 'Draining', value: workers.filter((w) => w.isDraining).length, color: ORANGE },
              { label: 'Rollout Groups', value: new Set(workers.map((w) => w.rolloutGroup)).size, color: GOLD },
            ].map((s) => (
              <div key={s.label} style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${BORDER}`, borderRadius: 6, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: 10, color: TEXT_DIM }}>{s.label}</div>
              </div>
            ))}
          </div>
          {workers.length === 0 ? (
            <div style={{ color: TEXT_DIM, fontSize: 12, padding: 16, textAlign: 'center' }}>No workers registered yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {workers.map((w) => (
                <div key={w.workerId} style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${BORDER}`, borderRadius: 6, padding: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <StatusDot status={w.status} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: TEXT }}>{w.name}</span>
                      <Badge color={w.rolloutGroup === 'blue' ? BLUE : w.rolloutGroup === 'green' ? GREEN : GOLD}>
                        {w.rolloutGroup}
                      </Badge>
                      {w.isDraining && <Badge color={ORANGE}>draining</Badge>}
                    </div>
                    <span style={{ fontSize: 10, color: TEXT_DIM }}>{reltime(w.registeredAt)}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    <KeyVal label="Checksum" value={w.configChecksum.slice(-10)} mono />
                    <KeyVal label="Requests" value={w.requestsHandled} />
                    <KeyVal label="Errors" value={w.errorsCount} />
                    <KeyVal label="Avg Latency" value={w.avgLatencyMs ? `${w.avgLatencyMs}ms` : '—'} />
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {w.capabilities.map((c) => <Badge key={c} color={TEXT_DIM}>{c}</Badge>)}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 16, padding: 12, background: '#60a5fa08', border: `1px solid #60a5fa33`, borderRadius: 6, fontSize: 11, color: BLUE }}>
            ℹ Checksum conflict detection is tenant-scoped: incompatible checksums within the same tenant + rollout group are rejected. Different tenants and different rollout groups may run different versions simultaneously.
          </div>
        </Card>
      )}

      {/* PROOF CHAINS TAB */}
      {activeTab === 'proofs' && (
        <Card title="Proof Chain — Immutable Lineage" action={<LiveTag />}>
          <div style={{ marginBottom: 12, fontSize: 11, color: TEXT_DIM }}>
            One proof chain is created per cognitive request — even on failure. Audit hash is SHA-256 of full lineage. Stored in memory.
          </div>
          {proofChains.length === 0 ? (
            <div style={{ color: TEXT_DIM, fontSize: 12, padding: 24, textAlign: 'center' }}>
              No proof chains yet — run a cognitive execution from the Overview tab.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {proofChains.map((pc) => (
                <div key={pc.proofChainId} style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${BORDER}`, borderRadius: 6, padding: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Badge color={pc.executionSucceeded ? GREEN : RED}>{pc.executionSucceeded ? 'success' : 'failed'}</Badge>
                      <span style={{ fontSize: 11, fontFamily: 'monospace', color: TEXT_DIM }}>{pc.requestId}</span>
                    </div>
                    <span style={{ fontSize: 10, color: TEXT_DIM }}>{reltime(pc.createdAt)}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 8 }}>
                    <KeyVal label="Model" value={pc.model} />
                    <KeyVal label="Confidence" value={pc.confidenceScore ? `${(pc.confidenceScore * 100).toFixed(1)}%` : '—'} />
                    <KeyVal label="Latency" value={pc.latencyMs ? `${pc.latencyMs}ms` : '—'} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 9, color: TEXT_DIM }}>AUDIT HASH</span>
                    <span style={{ fontSize: 10, fontFamily: 'monospace', color: GOLD }}>{pc.auditHash.slice(0, 16)}…</span>
                    <span style={{ fontSize: 9, color: GREEN }}>✓ SHA-256</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {pc.completedPhases.slice(0, 6).map((ph) => <Badge key={ph} color={GREEN}>{ph}</Badge>)}
                    {pc.completedPhases.length > 6 && <span style={{ fontSize: 10, color: TEXT_DIM }}>+{pc.completedPhases.length - 6} more</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* EVENTS TAB */}
      {activeTab === 'events' && (
        <Card title="Event Plane — Runtime Event Stream" action={<LiveTag />}>
          {events.length === 0 ? (
            <div style={{ color: TEXT_DIM, fontSize: 12, padding: 24, textAlign: 'center' }}>No events yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {events.map((e) => (
                <div key={e.eventId} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '8px 0', borderBottom: `1px solid ${BORDER}` }}>
                  <span style={{ fontSize: 10, color: TEXT_DIM, minWidth: 55, textAlign: 'right', flexShrink: 0, marginTop: 2 }}>{reltime(e.occurredAt)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <EventTypeTag type={e.eventType} />
                      {e.requestId && <span style={{ fontSize: 10, fontFamily: 'monospace', color: TEXT_DIM }}>{e.requestId}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: TEXT_DIM, fontFamily: 'monospace' }}>
                      {Object.entries(e.payload).slice(0, 3).map(([k, v]) => `${k}: ${typeof v === 'number' ? v.toFixed(3) : String(v)}`).join('  ·  ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 16, padding: 12, background: '#c9b78708', border: `1px solid #c9b78733`, borderRadius: 6, fontSize: 11, color: GOLD }}>
            ℹ Event Plane (emit / subscribe / replay) is designed to be swapped for Azure Service Bus, NATS, Kafka, or Redis Streams without touching callers.
          </div>
        </Card>
      )}

      {/* GUARD TAB */}
      {activeTab === 'guard' && (
        <Card title="Guided Output Guard — Limit Violations" action={<LiveTag />}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'JSON Schema max', value: '256 KB' },
              { label: 'Nesting depth max', value: '64 levels' },
              { label: 'Regex max', value: '32 KB' },
              { label: 'Grammar max', value: '64 KB' },
              { label: 'Whitespace pattern max', value: '1 KB' },
            ].map((l) => (
              <KeyVal key={l.label} label={l.label} value={l.value} />
            ))}
          </div>
          <SectionTitle>Live Guard Rejections</SectionTitle>
          {guardEvents.length === 0 ? (
            <div style={{ color: TEXT_DIM, fontSize: 11, padding: 12 }}>No guard rejections yet.</div>
          ) : (
            guardEvents.map((e) => (
              <div key={e.eventId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${BORDER}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Badge color={RED}>guard rejected</Badge>
                  <span style={{ fontSize: 10, color: TEXT_DIM, fontFamily: 'monospace' }}>
                    {JSON.stringify(e.payload).slice(0, 60)}
                  </span>
                </div>
                <span style={{ fontSize: 10, color: TEXT_DIM }}>{reltime(e.occurredAt)}</span>
              </div>
            ))
          )}
          <div style={{ marginTop: 16, padding: 12, background: '#ef444408', border: `1px solid #ef444433`, borderRadius: 6, fontSize: 11, color: RED }}>
            ⚠ All rejections are logged with redacted snippets only. Raw schema content is never stored.
          </div>
        </Card>
      )}
    </div>
  );
}
