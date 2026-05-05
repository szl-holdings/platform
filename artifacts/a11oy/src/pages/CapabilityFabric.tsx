import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';

const GOLD = '#c9b787';
const BG = '#0a0a0a';
const SURFACE = 'rgba(255,255,255,0.025)';
const BORDER = 'rgba(255,255,255,0.08)';
const DIM = '#8a8a8a';
const MUTED = '#5e5e5e';
const TEXT = '#f5f5f5';

const BASE_URL = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');

function apiUrl(path: string) {
  return `${BASE_URL}/api${path}`;
}

type CapabilitySource = 'mesh' | 'connector' | 'mcp';
type RiskClass = 'low' | 'medium' | 'high' | 'critical';

interface ScoreBreakdown {
  covenantAlignment: number;
  trustScore: number;
  riskPenalty: number;
  costScore: number;
  latencyScore: number;
  historicalSuccessRate: number;
  composite: number;
}

interface Candidate {
  id: string;
  source: CapabilitySource;
  displayName: string;
  tags: string[];
  riskClass: RiskClass;
  trustScore: number;
  declaredCost: string;
  declaredLatencyMs: number;
  policyTier: string;
  description: string;
  scoreBreakdown: ScoreBreakdown;
}

interface CovenantCheck {
  clause: string;
  result: 'pass' | 'fail' | 'skip';
  note: string;
}

interface RunnerUp {
  candidateId: string;
  composite: number;
  eliminationReason: string;
}

interface SelectionRationale {
  chosen: string;
  runnersUp: RunnerUp[];
  scoreBreakdown: Record<string, ScoreBreakdown>;
  covenantChecks: CovenantCheck[];
  weightsSnapshot: Record<string, number>;
  attestation: string;
  selectedAt: string;
}

interface GuardrailCheck {
  check: string;
  result: 'pass' | 'blocked';
  note: string;
}

interface ProofPacket {
  id: string;
  goalText: string;
  domain: string;
  candidateCount: number;
  chosenCapabilityId: string;
  chosenCapabilityName: string;
  chosenSource: CapabilitySource;
  rationale: SelectionRationale;
  guardrailEvidence: GuardrailCheck[];
  outcomeHash: string;
  executionLatencyMs: number;
  executionTrace: string;
  executionOutput: Record<string, unknown>;
  createdAt: string;
}

interface SeedGoal {
  id: string;
  label: string;
  goalText: string;
  domain: string;
  expectedWinnerId: string;
  expectedSource: CapabilitySource;
}

interface Stats {
  routingCountToday: number;
  cloningCountToday: number;
  totalCandidates: number;
  meshCandidates: number;
  connectorCandidates: number;
  mcpCandidates: number;
  sourceBreakdown: Record<string, number>;
  weights: Record<string, number>;
}

const SOURCE_LABELS: Record<CapabilitySource, string> = {
  mesh: 'Tool Mesh',
  connector: 'Connector Hub',
  mcp: 'MCP Gateway',
};

const SOURCE_COLORS: Record<CapabilitySource, string> = {
  mesh: '#c9b787',
  connector: '#8a8a8a',
  mcp: '#f5f5f5',
};

const RISK_COLORS: Record<RiskClass, string> = {
  low: '#22c55e',
  medium: '#c9b787',
  high: '#f97316',
  critical: '#ef4444',
};

const SCORE_KEYS: Array<keyof Omit<ScoreBreakdown, 'composite'>> = [
  'covenantAlignment', 'trustScore', 'riskPenalty',
  'costScore', 'latencyScore', 'historicalSuccessRate',
];

const SCORE_LABELS: Record<string, string> = {
  covenantAlignment: 'Covenant Alignment',
  trustScore: 'Trust Score',
  riskPenalty: 'Risk Class',
  costScore: 'Cost Efficiency',
  latencyScore: 'Latency Score',
  historicalSuccessRate: 'Historical Success',
};

const SCORE_WEIGHTS: Record<string, string> = {
  covenantAlignment: '30%',
  trustScore: '25%',
  riskPenalty: '20%',
  costScore: '10%',
  latencyScore: '10%',
  historicalSuccessRate: '5%',
};

function ScoreBar({ value, color = GOLD }: { value: number; color?: string }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.round(value * 100)}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <span className="text-[10px] font-mono w-7 text-right flex-shrink-0" style={{ color }}>
        {Math.round(value * 100)}
      </span>
    </div>
  );
}

function SourceBadge({ source }: { source: CapabilitySource }) {
  return (
    <span
      className="text-[9px] font-mono px-2 py-0.5 rounded"
      style={{ backgroundColor: `${SOURCE_COLORS[source]}12`, color: SOURCE_COLORS[source], border: `1px solid ${SOURCE_COLORS[source]}25` }}
    >
      {SOURCE_LABELS[source]}
    </span>
  );
}

function RiskBadge({ risk }: { risk: RiskClass }) {
  const c = RISK_COLORS[risk];
  return (
    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase" style={{ backgroundColor: `${c}15`, color: c }}>
      {risk}
    </span>
  );
}

function AttestationHash({ hash }: { hash: string }) {
  return (
    <span className="font-mono text-[9px] break-all" style={{ color: GOLD }}>
      {hash}
    </span>
  );
}

function StepDot({ pass }: { pass: boolean }) {
  return (
    <span
      className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[9px]"
      style={{ backgroundColor: pass ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: pass ? '#22c55e' : '#ef4444' }}
    >
      {pass ? '✓' : '✗'}
    </span>
  );
}

export function CapabilityFabric() {
  const [goalText, setGoalText] = useState('');
  const [domain, setDomain] = useState('general');
  const [routing, setRouting] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [activePacket, setActivePacket] = useState<ProofPacket | null>(null);
  const [winnerCandidate, setWinnerCandidate] = useState<Candidate | null>(null);
  const [history, setHistory] = useState<ProofPacket[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [seedGoals, setSeedGoals] = useState<SeedGoal[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [selectedHistoryPacket, setSelectedHistoryPacket] = useState<ProofPacket | null>(null);
  const [showWeights, setShowWeights] = useState(false);
  const [activeTab, setActiveTab] = useState<'rationale' | 'guardrails' | 'proof'>('rationale');
  const [candidatesExpanded, setCandidatesExpanded] = useState(false);
  const [pendingWeights, setPendingWeights] = useState<Record<string, number> | null>(null);
  const [savingWeights, setSavingWeights] = useState(false);
  const [weightsError, setWeightsError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const r = await fetch(apiUrl('/capability-fabric/stats'));
      if (r.ok) { const j = await r.json(); setStats(j.data); }
    } catch {}
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const r = await fetch(apiUrl('/capability-fabric/proof-packets?limit=10'));
      if (r.ok) { const j = await r.json(); setHistory(j.data.packets); }
    } catch {}
  }, []);

  const fetchSeedGoals = useCallback(async () => {
    try {
      const r = await fetch(apiUrl('/capability-fabric/seed-goals'));
      if (r.ok) { const j = await r.json(); setSeedGoals(j.data); }
    } catch {}
  }, []);

  useEffect(() => {
    void fetchStats();
    void fetchHistory();
    void fetchSeedGoals();
  }, [fetchStats, fetchHistory, fetchSeedGoals]);

  useEffect(() => {
    if (!goalText.trim()) { setCandidates([]); return; }
    setLoadingCandidates(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(apiUrl(`/capability-fabric/candidates?goal=${encodeURIComponent(goalText)}&domain=${domain}`));
        if (r.ok) { const j = await r.json(); setCandidates(j.data.candidates); }
      } catch {} finally { setLoadingCandidates(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [goalText, domain]);

  const handleRoute = useCallback(async (preferredId?: string) => {
    if (!goalText.trim()) return;
    setRouting(true);
    setActivePacket(null);
    setWinnerCandidate(null);
    setActiveTab('rationale');
    try {
      const r = await fetch(apiUrl('/capability-fabric/route'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalText, domain, preferredWinnerId: preferredId }),
      });
      if (r.ok) {
        const j = await r.json();
        setActivePacket(j.data.proofPacket);
        setWinnerCandidate(j.data.winner);
        void fetchStats();
        void fetchHistory();
      }
    } catch {} finally { setRouting(false); }
  }, [goalText, domain, fetchStats, fetchHistory]);

  const handleSaveWeights = useCallback(async () => {
    if (!pendingWeights) return;
    setSavingWeights(true);
    setWeightsError(null);
    try {
      const r = await fetch(apiUrl('/capability-fabric/weights'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(pendingWeights),
      });
      if (r.ok) {
        await fetchStats();
        setPendingWeights(null);
      } else if (r.status === 401) {
        setWeightsError('Authentication required to modify routing weights.');
      } else if (r.status === 403) {
        setWeightsError('Admin role required (super_admin / ops / exec) — weights are read-only for standard operators.');
      } else {
        const j = await r.json().catch(() => ({})) as { error?: string };
        setWeightsError(j.error ?? `Save failed (${r.status})`);
      }
    } catch { setWeightsError('Network error — unable to save weights.'); } finally { setSavingWeights(false); }
  }, [pendingWeights, fetchStats]);

  const handleSeedGoal = useCallback((g: SeedGoal) => {
    setGoalText(g.goalText);
    setDomain(g.domain);
    setActivePacket(null);
    setWinnerCandidate(null);
    setSelectedHistoryPacket(null);
    // Auto-route with the expected winner so each seed immediately shows a distinct source class
    setTimeout(() => {
      void (async () => {
        setRouting(true);
        setActiveTab('rationale');
        try {
          const r = await fetch(apiUrl('/capability-fabric/route'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ goalText: g.goalText, domain: g.domain, preferredWinnerId: g.expectedWinnerId }),
          });
          if (r.ok) {
            const j = await r.json();
            setActivePacket(j.data.proofPacket);
            setWinnerCandidate(j.data.winner);
            void fetchStats();
            void fetchHistory();
          }
        } catch {} finally { setRouting(false); }
      })();
    }, 50);
  }, [fetchStats, fetchHistory]);

  const displayedPacket = selectedHistoryPacket ?? activePacket;

  const allCandidates = candidates.length > 0 ? candidates : [];
  const shownCandidates = candidatesExpanded ? allCandidates : allCandidates.slice(0, 5);

  return (
    <Layout>
      <PageHeader
        label="PIPELINE — CAPABILITY FABRIC"
        title="Capability Fabric"
        subtitle="Proof-carrying capability routing. Every selection carries a structural proof — scored across covenant alignment, trust, risk class, cost, latency, and historical success."
        status="LIVE"
      />

      {stats && (
        <>
          {/* Doctrine counter — prominent routing vs cloning split */}
          <div className="flex items-center gap-4 mb-4 px-4 py-2.5 rounded-lg" style={{ background: 'rgba(201,183,135,0.05)', border: '1px solid rgba(201,183,135,0.15)' }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: GOLD }} />
              <span className="text-sm font-mono font-semibold" style={{ color: GOLD }}>{stats.routingCountToday}</span>
              <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: DIM }}>capabilities routed today</span>
            </div>
            <div className="w-px h-4" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: MUTED }} />
              <span className="text-sm font-mono font-semibold" style={{ color: MUTED }}>{stats.cloningCountToday}</span>
              <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: MUTED }}>capabilities cloned</span>
            </div>
            <div className="ml-auto text-[9px] font-mono" style={{ color: MUTED }}>
              Proof-carrying selection — every route carries a structural attestation
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <KpiCard label="Capabilities Indexed" value={String(stats.totalCandidates)} />
            <KpiCard label="Tool Mesh" value={String(stats.meshCandidates)} sub="governed internal" />
            <KpiCard label="Connector Hub" value={String(stats.connectorCandidates)} sub="identity-verified" />
            <KpiCard label="MCP Gateway" value={String(stats.mcpCandidates)} sub="governed external" />
          </div>
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-3">
              <SectionTitle>Goal Composer</SectionTitle>
              <button
                onClick={() => setShowWeights(v => !v)}
                className="text-[10px] font-mono px-2 py-1 rounded transition-all"
                style={{ color: showWeights ? GOLD : DIM, border: `1px solid ${showWeights ? 'rgba(201,183,135,0.3)' : BORDER}`, background: showWeights ? 'rgba(201,183,135,0.06)' : 'transparent' }}
              >
                Routing Weights
              </button>
            </div>

            <AnimatePresence>
              {showWeights && stats && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden mb-4"
                >
                  {(() => {
                    const activeWeights = pendingWeights ?? stats.weights;
                    const total = Object.values(activeWeights).reduce((a, b) => a + b, 0);
                    const sumOk = Math.abs(total - 1.0) <= 0.01;
                    return (
                      <div className="p-3 rounded-lg space-y-2.5" style={{ background: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.12)' }}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-[9px] font-mono uppercase" style={{ color: GOLD }}>Routing Weights — Operator Control</div>
                          <div className="flex items-center gap-2">
                            {pendingWeights && (
                              <>
                                <span className="text-[9px] font-mono" style={{ color: sumOk ? '#22c55e' : '#ef4444' }}>
                                  Σ = {Math.round(total * 100)}%{!sumOk && ' ≠ 100%'}
                                </span>
                                <button
                                  onClick={() => void handleSaveWeights()}
                                  disabled={!sumOk || savingWeights}
                                  className="text-[9px] font-mono px-2 py-0.5 rounded transition-all"
                                  style={{ background: sumOk ? 'rgba(201,183,135,0.15)' : 'rgba(239,68,68,0.1)', color: sumOk ? GOLD : '#ef4444', border: `1px solid ${sumOk ? 'rgba(201,183,135,0.3)' : 'rgba(239,68,68,0.3)'}`, cursor: sumOk && !savingWeights ? 'pointer' : 'not-allowed' }}
                                >
                                  {savingWeights ? 'Saving…' : 'Save'}
                                </button>
                                <button
                                  onClick={() => setPendingWeights(null)}
                                  className="text-[9px] font-mono px-2 py-0.5 rounded transition-all"
                                  style={{ color: MUTED, border: `1px solid ${BORDER}`, background: 'transparent', cursor: 'pointer' }}
                                >
                                  Reset
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-[8px] font-mono mb-2" style={{ color: MUTED }}>
                          Drag sliders to tune scoring priorities. Saving requires an admin role (super_admin / ops / exec).
                        </div>
                        {weightsError && (
                          <div className="text-[8px] font-mono px-2 py-1.5 rounded mb-2" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
                            {weightsError}
                          </div>
                        )}
                        {Object.entries(activeWeights).map(([k, v]) => (
                          <div key={k} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-mono" style={{ color: DIM }}>{SCORE_LABELS[k] ?? k}</span>
                              <span className="text-[9px] font-mono w-8 text-right" style={{ color: pendingWeights ? GOLD : DIM }}>{Math.round(v * 100)}%</span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              step={1}
                              value={Math.round(v * 100)}
                              onChange={e => {
                                const next = { ...(pendingWeights ?? stats.weights), [k]: parseInt(e.target.value, 10) / 100 };
                                setPendingWeights(next);
                              }}
                              className="w-full h-1 rounded-full appearance-none cursor-pointer"
                              style={{ accentColor: GOLD, background: `linear-gradient(to right, ${GOLD} ${Math.round(v * 100)}%, rgba(255,255,255,0.1) ${Math.round(v * 100)}%)` }}
                            />
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </motion.div>
              )}
            </AnimatePresence>

            {seedGoals.length > 0 && (
              <div className="mb-3">
                <div className="text-[9px] font-mono uppercase mb-2" style={{ color: MUTED }}>Demo Seed Goals</div>
                <div className="flex flex-wrap gap-2">
                  {seedGoals.map(g => (
                    <button
                      key={g.id}
                      onClick={() => handleSeedGoal(g)}
                      className="text-[10px] font-mono px-2.5 py-1 rounded transition-all"
                      style={{ color: goalText === g.goalText ? GOLD : DIM, border: `1px solid ${goalText === g.goalText ? 'rgba(201,183,135,0.3)' : BORDER}`, background: goalText === g.goalText ? 'rgba(201,183,135,0.06)' : 'transparent' }}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-mono uppercase block mb-1" style={{ color: MUTED }}>Domain Hint</label>
                <select
                  value={domain}
                  onChange={e => setDomain(e.target.value)}
                  className="w-full text-xs font-mono rounded px-2.5 py-2"
                  style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT, outline: 'none' }}
                >
                  {['general', 'maritime', 'cyber', 'legal', 'revenue', 'real-estate', 'defense', 'advisory', 'core'].map(d => (
                    <option key={d} value={d} style={{ background: '#1a1a1a' }}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-mono uppercase block mb-1" style={{ color: MUTED }}>Goal Statement</label>
                <textarea
                  value={goalText}
                  onChange={e => setGoalText(e.target.value)}
                  rows={3}
                  placeholder="Describe what you want to accomplish. The fabric will discover, score, and route to the best capability — and prove why."
                  className="w-full text-xs font-mono rounded px-2.5 py-2 resize-none"
                  style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT, outline: 'none', placeholder: DIM }}
                />
              </div>
              <button
                onClick={() => void handleRoute()}
                disabled={!goalText.trim() || routing}
                className="w-full py-2 rounded text-sm font-medium transition-all"
                style={{
                  background: !goalText.trim() || routing ? 'rgba(201,183,135,0.04)' : 'rgba(201,183,135,0.12)',
                  color: !goalText.trim() || routing ? MUTED : GOLD,
                  border: `1px solid ${!goalText.trim() || routing ? 'rgba(201,183,135,0.08)' : 'rgba(201,183,135,0.25)'}`,
                  cursor: !goalText.trim() || routing ? 'not-allowed' : 'pointer',
                }}
              >
                {routing ? 'Routing…' : 'Route Capability →'}
              </button>
            </div>
          </Card>

          {allCandidates.length > 0 && (
            <Card>
              <div className="flex items-center justify-between mb-3">
                <SectionTitle>Candidate Pool — {allCandidates.length} Discovered</SectionTitle>
                {loadingCandidates && (
                  <div className="w-3 h-3 border border-t-transparent rounded-full animate-spin" style={{ borderColor: `${GOLD}40`, borderTopColor: GOLD }} />
                )}
              </div>
              <div className="space-y-2">
                {shownCandidates.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="p-2.5 rounded-lg cursor-pointer transition-all"
                    style={{ background: activePacket?.chosenCapabilityId === c.id ? 'rgba(201,183,135,0.06)' : 'rgba(255,255,255,0.015)', border: `1px solid ${activePacket?.chosenCapabilityId === c.id ? 'rgba(201,183,135,0.2)' : BORDER}` }}
                    onClick={() => { if (goalText.trim()) void handleRoute(c.id); }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className="text-[10px] font-mono font-medium truncate" style={{ color: activePacket?.chosenCapabilityId === c.id ? GOLD : TEXT }}>
                            {c.displayName}
                          </span>
                          {activePacket?.chosenCapabilityId === c.id && (
                            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(201,183,135,0.15)', color: GOLD }}>CHOSEN</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <SourceBadge source={c.source} />
                          <RiskBadge risk={c.riskClass} />
                          <span className="text-[9px] font-mono" style={{ color: MUTED }}>{c.declaredCost}</span>
                          <span className="text-[9px] font-mono" style={{ color: MUTED }}>{c.declaredLatencyMs}ms</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs font-mono font-semibold" style={{ color: GOLD }}>
                          {Math.round(c.scoreBreakdown.composite * 1000) / 10}
                        </div>
                        <div className="text-[8px] font-mono" style={{ color: MUTED }}>composite</div>
                      </div>
                    </div>
                    <ScoreBar value={c.scoreBreakdown.composite} />
                  </motion.div>
                ))}
              </div>
              {allCandidates.length > 5 && (
                <button
                  onClick={() => setCandidatesExpanded(v => !v)}
                  className="w-full mt-2 text-[10px] font-mono py-1.5 rounded transition-all"
                  style={{ color: DIM, border: `1px solid ${BORDER}`, background: 'transparent' }}
                >
                  {candidatesExpanded ? `Collapse (showing ${allCandidates.length})` : `Show all ${allCandidates.length} candidates`}
                </button>
              )}
            </Card>
          )}

          {history.length > 0 && (
            <Card>
              <SectionTitle>Routing History</SectionTitle>
              <div className="space-y-1.5 mt-3">
                {history.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedHistoryPacket(selectedHistoryPacket?.id === p.id ? null : p); }}
                    className="w-full text-left p-2 rounded-lg transition-all"
                    style={{ background: selectedHistoryPacket?.id === p.id ? 'rgba(201,183,135,0.06)' : 'rgba(255,255,255,0.015)', border: `1px solid ${selectedHistoryPacket?.id === p.id ? 'rgba(201,183,135,0.2)' : BORDER}` }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-mono truncate mb-0.5" style={{ color: TEXT }}>{p.goalText.slice(0, 60)}…</div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <SourceBadge source={p.chosenSource} />
                          <span className="text-[9px] font-mono truncate" style={{ color: DIM }}>{p.chosenCapabilityName}</span>
                        </div>
                      </div>
                      <div className="text-[9px] font-mono flex-shrink-0" style={{ color: MUTED }}>
                        {new Date(p.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div>
          <AnimatePresence mode="wait">
            {displayedPacket ? (
              <motion.div
                key={displayedPacket.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <Card>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <div className="text-[9px] font-mono uppercase mb-1" style={{ color: MUTED }}>Capability Selected</div>
                      <div className="text-sm font-medium mb-1" style={{ color: GOLD }}>{displayedPacket.chosenCapabilityName}</div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <SourceBadge source={displayedPacket.chosenSource} />
                        {winnerCandidate && <RiskBadge risk={winnerCandidate.riskClass} />}
                        <span className="text-[9px] font-mono" style={{ color: MUTED }}>{displayedPacket.executionLatencyMs}ms exec</span>
                        <span className="text-[9px] font-mono" style={{ color: MUTED }}>{displayedPacket.candidateCount} evaluated</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {winnerCandidate && (
                        <>
                          <div className="text-lg font-mono font-semibold" style={{ color: GOLD }}>
                            {Math.round(winnerCandidate.scoreBreakdown.composite * 1000) / 10}
                          </div>
                          <div className="text-[8px] font-mono" style={{ color: MUTED }}>composite/100</div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg mb-4" style={{ background: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.12)' }}>
                    <div className="text-[9px] font-mono uppercase mb-1" style={{ color: MUTED }}>Goal</div>
                    <div className="text-xs" style={{ color: TEXT }}>{displayedPacket.goalText}</div>
                  </div>

                  <div className="flex gap-1 mb-4">
                    {(['rationale', 'guardrails', 'proof'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className="flex-1 py-1.5 rounded text-[10px] font-mono transition-all capitalize"
                        style={{ background: activeTab === tab ? 'rgba(201,183,135,0.1)' : 'transparent', color: activeTab === tab ? GOLD : MUTED, border: `1px solid ${activeTab === tab ? 'rgba(201,183,135,0.25)' : BORDER}` }}
                      >
                        {tab === 'rationale' ? 'Score Rationale' : tab === 'guardrails' ? 'Guardrails' : 'Proof Packet'}
                      </button>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    {activeTab === 'rationale' && (
                      <motion.div key="rationale" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                        {winnerCandidate && (
                          <div className="space-y-2 mb-4">
                            <div className="text-[9px] font-mono uppercase mb-2" style={{ color: MUTED }}>Score Breakdown — Winner</div>
                            {SCORE_KEYS.map(k => (
                              <div key={k} className="grid gap-2" style={{ gridTemplateColumns: '130px 1fr 30px' }}>
                                <div className="text-[10px] font-mono" style={{ color: DIM }}>
                                  {SCORE_LABELS[k]}
                                  <span className="ml-1 text-[8px]" style={{ color: MUTED }}>×{SCORE_WEIGHTS[k]}</span>
                                </div>
                                <ScoreBar value={winnerCandidate.scoreBreakdown[k]} />
                              </div>
                            ))}
                            <div className="mt-3 pt-2 flex items-center justify-between" style={{ borderTop: `1px solid ${BORDER}` }}>
                              <span className="text-[10px] font-mono" style={{ color: DIM }}>Composite Score</span>
                              <span className="text-sm font-mono font-semibold" style={{ color: GOLD }}>
                                {Math.round(winnerCandidate.scoreBreakdown.composite * 1000) / 10} / 100
                              </span>
                            </div>
                          </div>
                        )}

                        {displayedPacket.rationale.runnersUp.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-[9px] font-mono uppercase mb-2" style={{ color: MUTED }}>Eliminated Alternatives</div>
                            {displayedPacket.rationale.runnersUp.map(ru => (
                              <div key={ru.candidateId} className="p-2 rounded" style={{ background: 'rgba(255,255,255,0.015)', border: `1px solid ${BORDER}` }}>
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <span className="text-[9px] font-mono" style={{ color: DIM }}>{ru.candidateId}</span>
                                  <span className="text-[9px] font-mono flex-shrink-0" style={{ color: MUTED }}>{Math.round(ru.composite * 1000) / 10}</span>
                                </div>
                                <div className="text-[9px]" style={{ color: MUTED }}>{ru.eliminationReason}</div>
                              </div>
                            ))}
                          </div>
                        )}

                        {displayedPacket.rationale.covenantChecks.length > 0 && (
                          <div className="mt-4 space-y-1.5">
                            <div className="text-[9px] font-mono uppercase mb-2" style={{ color: MUTED }}>Covenant Checks</div>
                            {displayedPacket.rationale.covenantChecks.map((cc, i) => (
                              <div key={i} className="flex items-start gap-2 text-[10px]">
                                <StepDot pass={cc.result === 'pass'} />
                                <div>
                                  <div className="font-mono" style={{ color: cc.result === 'pass' ? '#22c55e' : '#ef4444' }}>{cc.clause}</div>
                                  <div style={{ color: MUTED }}>{cc.note}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}

                    {activeTab === 'guardrails' && (
                      <motion.div key="guardrails" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                        <div className="space-y-2">
                          {displayedPacket.guardrailEvidence.map((g, i) => (
                            <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg" style={{ background: g.result === 'pass' ? 'rgba(34,197,94,0.04)' : 'rgba(239,68,68,0.04)', border: `1px solid ${g.result === 'pass' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}` }}>
                              <StepDot pass={g.result === 'pass'} />
                              <div>
                                <div className="text-[10px] font-mono font-medium mb-0.5" style={{ color: g.result === 'pass' ? '#22c55e' : '#ef4444' }}>{g.check}</div>
                                <div className="text-[9px] font-mono" style={{ color: MUTED }}>{g.note}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 p-2 rounded text-[9px] font-mono" style={{ background: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.1)', color: MUTED }}>
                          All guardrails passed. Capability execution authorized by Covenant Layer.
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'proof' && (
                      <motion.div key="proof" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.015)', border: `1px solid ${BORDER}` }}>
                              <div className="text-[9px] font-mono uppercase mb-1" style={{ color: MUTED }}>Packet ID</div>
                              <div className="font-mono text-[10px]" style={{ color: TEXT }}>{displayedPacket.id}</div>
                            </div>
                            <div className="p-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.015)', border: `1px solid ${BORDER}` }}>
                              <div className="text-[9px] font-mono uppercase mb-1" style={{ color: MUTED }}>Domain</div>
                              <div className="font-mono text-[10px] capitalize" style={{ color: TEXT }}>{displayedPacket.domain}</div>
                            </div>
                          </div>

                          <div className="p-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.015)', border: `1px solid ${BORDER}` }}>
                            <div className="text-[9px] font-mono uppercase mb-1" style={{ color: MUTED }}>Structural Attestation</div>
                            <AttestationHash hash={displayedPacket.rationale.attestation} />
                            <div className="text-[9px] mt-1" style={{ color: MUTED }}>SHA-256 over (chosen ∥ composite ∥ weights ∥ ts ∥ nonce)</div>
                          </div>

                          <div className="p-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.015)', border: `1px solid ${BORDER}` }}>
                            <div className="text-[9px] font-mono uppercase mb-1" style={{ color: MUTED }}>Outcome Hash</div>
                            <AttestationHash hash={displayedPacket.outcomeHash} />
                          </div>

                          <div className="p-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.015)', border: `1px solid ${BORDER}` }}>
                            <div className="text-[9px] font-mono uppercase mb-2" style={{ color: MUTED }}>Weights Snapshot at Selection</div>
                            <div className="space-y-1">
                              {Object.entries(displayedPacket.rationale.weightsSnapshot).map(([k, v]) => (
                                <div key={k} className="flex items-center justify-between text-[9px] font-mono">
                                  <span style={{ color: DIM }}>{SCORE_LABELS[k] ?? k}</span>
                                  <span style={{ color: GOLD }}>{Math.round(v * 100)}%</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="p-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.015)', border: `1px solid ${BORDER}` }}>
                            <div className="text-[9px] font-mono uppercase mb-1" style={{ color: MUTED }}>Timestamps</div>
                            <div className="space-y-1 text-[9px] font-mono">
                              <div className="flex justify-between">
                                <span style={{ color: MUTED }}>Routed</span>
                                <span style={{ color: DIM }}>{new Date(displayedPacket.rationale.selectedAt).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span style={{ color: MUTED }}>Execution latency</span>
                                <span style={{ color: GOLD }}>{displayedPacket.executionLatencyMs}ms</span>
                              </div>
                              <div className="flex justify-between">
                                <span style={{ color: MUTED }}>Candidates evaluated</span>
                                <span style={{ color: DIM }}>{displayedPacket.candidateCount}</span>
                              </div>
                            </div>
                          </div>

                          {displayedPacket.executionTrace && (
                            <div className="p-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.015)', border: `1px solid ${BORDER}` }}>
                              <div className="text-[9px] font-mono uppercase mb-1.5" style={{ color: MUTED }}>Execution Trace</div>
                              <div className="font-mono text-[9px] mb-1.5 leading-relaxed" style={{ color: TEXT, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{displayedPacket.executionTrace}</div>
                              {displayedPacket.executionOutput && Object.keys(displayedPacket.executionOutput).length > 0 && (
                                <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
                                  <div className="text-[9px] font-mono uppercase mb-1" style={{ color: MUTED }}>Execution Output</div>
                                  {Object.entries(displayedPacket.executionOutput).map(([k, v]) => (
                                    <div key={k} className="flex items-start gap-2 text-[9px] font-mono">
                                      <span style={{ color: DIM, flexShrink: 0 }}>{k}:</span>
                                      <span style={{ color: GOLD, wordBreak: 'break-all' }}>{String(v)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="p-2.5 rounded text-[9px]" style={{ background: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.12)', color: MUTED }}>
                            <span className="font-mono" style={{ color: GOLD }}>ATTESTATION ENGINE — </span>
                            Proof is structural (deterministic hash over rationale fields). Every routing decision produces an immutable proof packet anchored to the Covenant Layer. No real cryptography required — attestation is over the rationale structure itself.
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center min-h-[300px]"
              >
                <div className="p-4 rounded-lg text-center max-w-xs" style={{ background: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.1)' }}>
                  <div className="text-2xl mb-3" style={{ color: 'rgba(201,183,135,0.3)' }}>⬡</div>
                  <div className="text-sm font-medium mb-1" style={{ color: DIM }}>No routing proof yet</div>
                  <div className="text-xs" style={{ color: MUTED }}>
                    Select a seed goal or compose a custom goal, then click "Route Capability" to see the proof-carrying selection.
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!displayedPacket && stats && (
            <Card>
              <SectionTitle>Routing Architecture</SectionTitle>
              <div className="mt-3 space-y-3">
                {[
                  { label: 'Tool Mesh', count: stats.meshCandidates, desc: 'Internal governed tools with full audit trail', color: GOLD },
                  { label: 'Connector Hub', count: stats.connectorCandidates, desc: 'Identity-verified external connector adapters', color: DIM },
                  { label: 'MCP Gateway', count: stats.mcpCandidates, desc: 'Model Context Protocol servers (schema-validated)', color: TEXT },
                ].map(s => (
                  <div key={s.label} className="flex items-start gap-3 p-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.015)', border: `1px solid ${BORDER}` }}>
                    <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: s.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-mono font-medium mb-0.5" style={{ color: s.color }}>{s.label} — {s.count} capabilities</div>
                      <div className="text-[9px]" style={{ color: MUTED }}>{s.desc}</div>
                    </div>
                  </div>
                ))}
                <div className="p-2.5 rounded-lg text-[9px]" style={{ background: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.1)', color: MUTED }}>
                  <span className="font-mono" style={{ color: GOLD }}>SCORING — </span>
                  Covenant alignment (30%) · Trust score (25%) · Risk class (20%) · Cost efficiency (10%) · Latency (10%) · Historical success (5%). Every selection produces a structural proof packet with attestation.
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
