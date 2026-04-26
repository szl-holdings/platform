import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Database,
  Lock,
  RefreshCw,
  Shield,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { OpsLayout } from '../components/ops-layout';

const ACCENT = '#8b5cf6';
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

interface SIStats {
  totalCalls: number;
  schemaAdherenceRate: number;
  refusalCount: number;
  refusalRate: number;
  policyBlockCount: number;
  policyBlockRate: number;
  avgConfidence: number | null;
  byDomain: Record<string, { total: number; refusals: number; avgConfidence: number }>;
  recentOutputs: Array<{
    runId: string;
    domain: string;
    schemaName: string;
    model: string;
    verdict: string;
    isRefusal: boolean;
    outputSummary: string;
    recordedAt: string;
  }>;
  openRefusalIncidents: number;
  generatedAt: string;
}

interface RefusalIncident {
  incidentId: string;
  runId: string;
  domain: string;
  schemaName: string;
  model: string;
  provider: string;
  reason: string;
  riskTier: string;
  status: string;
  escalatedTo: string | null;
  recordedAt: string;
}

interface ProofChainEntry {
  entryId: string;
  runId: string;
  domain: string;
  schemaName: string;
  model: string;
  provider: string;
  promptHash: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  confidence: number | null;
  governanceVerdict: string;
  covenantFailures: string[];
  isRefusal: boolean;
  refusalReason: string | null;
  outputSummary: string;
  recordedAt: string;
}

interface SIResponse {
  stats: SIStats;
  recentProofChainEntries: ProofChainEntry[];
  refusalIncidents: RefusalIncident[];
  pipeline: Record<string, unknown>;
}

function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  variant = 'default',
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.FC<{ size?: number; className?: string }>;
  color: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}) {
  const bgMap = {
    default: 'bg-[#0f1117]',
    success: 'bg-[#0f1a12]',
    warning: 'bg-[#1a150a]',
    danger: 'bg-[#1a0d0d]',
  };
  return (
    <div className={`${bgMap[variant]} border border-white/8 rounded-xl p-5 flex flex-col gap-3`}>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18`, color }}>
          <Icon size={16} />
        </div>
        <span className="text-xs text-white/50 font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div>
        <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
        {sub && <div className="text-xs text-white/40 mt-1">{sub}</div>}
      </div>
    </div>
  );
}

function VerdictBadge({ verdict, isRefusal }: { verdict: string; isRefusal: boolean }) {
  if (isRefusal) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-500/15 text-orange-400 border border-orange-500/20">
        <AlertTriangle size={10} /> REFUSAL
      </span>
    );
  }
  if (verdict === 'allowed') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 size={10} /> ALLOWED
      </span>
    );
  }
  if (verdict === 'blocked') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/20">
        <Lock size={10} /> BLOCKED
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white/50 border border-white/10">
      {verdict}
    </span>
  );
}

function RiskBadge({ tier }: { tier: string }) {
  const map: Record<string, string> = {
    critical: 'bg-red-500/15 text-red-400 border-red-500/20',
    high: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
    medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
    low: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${map[tier] ?? 'bg-white/10 text-white/50 border-white/10'}`}>
      {tier.toUpperCase()}
    </span>
  );
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 text-white/30 text-sm">
      <Activity size={28} className="mx-auto mb-3 opacity-30" />
      {message}
    </div>
  );
}

export function StructuredIntelligencePage() {
  const [data, setData] = useState<SIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'proof-chain' | 'refusals'>('overview');
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const resp = await apiFetch<SIResponse>(`${BASE}/api/ai/structured-intelligence`);
      setData(resp);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load structured intelligence data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(() => load(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const stats = data?.stats;

  return (
    <OpsLayout title="Structured Intelligence">
      <div className="min-h-screen bg-[#080a0f] text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${ACCENT}18`, border: `1px solid ${ACCENT}30` }}
                >
                  <Shield size={20} style={{ color: ACCENT }} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Structured Intelligence</h1>
                  <p className="text-sm text-white/40 mt-0.5">
                    Schema-guaranteed AI · Proof Chain · Covenant Policy
                  </p>
                </div>
              </div>
              {stats && (
                <p className="text-xs text-white/30 mt-2">
                  Updated {timeAgo(stats.generatedAt)} · {stats.totalCalls} total governed calls
                </p>
              )}
            </div>
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all text-sm"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          {/* Pipeline capability banner */}
          <div
            className="flex items-center gap-6 px-5 py-3 rounded-xl mb-8 border text-xs flex-wrap"
            style={{ background: `${ACCENT}08`, borderColor: `${ACCENT}20` }}
          >
            <span className="text-white/40 font-medium uppercase tracking-wider">Pipeline</span>
            {[
              { label: 'Zod-Native Schema Validation', icon: Shield },
              { label: 'Provenance Envelopes', icon: Database },
              { label: 'Covenant Policy', icon: Lock },
              { label: 'Proof Chain Recording', icon: Activity },
              { label: 'Refusal Detection', icon: AlertTriangle },
            ].map(({ label, icon: Icon }) => (
              <div key={label} className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 size={11} />
                <span>{label}</span>
              </div>
            ))}
          </div>

          {loading && (
            <div className="flex items-center justify-center h-48 text-white/40">
              <RefreshCw size={20} className="animate-spin mr-3" />
              Loading structured intelligence data…
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-16">
              <div className="text-orange-400 text-sm mb-2">
                <AlertTriangle size={18} className="inline mr-2" />
                {error}
              </div>
              <p className="text-white/30 text-xs mt-2">
                No governed calls recorded yet. Calls to /ai/triage, /ai/extract, and /ai/plan are automatically recorded once executed.
              </p>
            </div>
          )}

          {!loading && stats && (
            <>
              {/* KPI Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <MetricCard
                  label="Schema Adherence"
                  value={`${stats.schemaAdherenceRate.toFixed(1)}%`}
                  sub="Zod-validated outputs"
                  icon={CheckCircle2}
                  color="#22c55e"
                  variant={stats.schemaAdherenceRate >= 99 ? 'success' : stats.schemaAdherenceRate >= 90 ? 'default' : 'warning'}
                />
                <MetricCard
                  label="Refusal Rate"
                  value={stats.refusalCount === 0 ? '0' : `${(stats.refusalRate * 100).toFixed(1)}%`}
                  sub={`${stats.refusalCount} incidents · ${stats.openRefusalIncidents} open`}
                  icon={AlertTriangle}
                  color="#f59e0b"
                  variant={stats.refusalCount === 0 ? 'success' : 'warning'}
                />
                <MetricCard
                  label="Policy Block Rate"
                  value={stats.policyBlockCount === 0 ? '0' : `${(stats.policyBlockRate * 100).toFixed(1)}%`}
                  sub={`${stats.policyBlockCount} blocked by covenant`}
                  icon={Lock}
                  color="#8b5cf6"
                  variant={stats.policyBlockCount === 0 ? 'success' : 'warning'}
                />
                <MetricCard
                  label="Avg Confidence"
                  value={stats.avgConfidence !== null ? `${(stats.avgConfidence * 100).toFixed(0)}%` : '—'}
                  sub="Across schema-validated outputs"
                  icon={Zap}
                  color="#4d8fcc"
                />
              </div>

              {/* Tab Bar */}
              <div className="flex gap-1 border-b border-white/8 mb-6">
                {(['overview', 'proof-chain', 'refusals'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all ${
                      activeTab === tab
                        ? 'text-white border-b-2 -mb-px'
                        : 'text-white/40 hover:text-white/70'
                    }`}
                    style={activeTab === tab ? { borderColor: ACCENT, color: ACCENT } : {}}
                  >
                    {tab === 'overview' && 'Overview'}
                    {tab === 'proof-chain' && `Proof Chain (${data?.recentProofChainEntries?.length ?? 0})`}
                    {tab === 'refusals' && `Refusal Incidents (${data?.refusalIncidents?.length ?? 0})`}
                  </button>
                ))}
              </div>

              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Recent Governed Outputs */}
                  <div>
                    <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
                      Recent Governed Outputs
                    </h3>
                    {stats.recentOutputs.length === 0 ? (
                      <EmptyState message="No governed calls recorded yet. Make a call to /ai/triage, /ai/extract, or /ai/plan to see live data." />
                    ) : (
                      <div className="space-y-2">
                        {stats.recentOutputs.map((output) => (
                          <div
                            key={output.runId}
                            className="bg-[#0f1117] border border-white/8 rounded-xl px-5 py-4 flex items-center gap-4"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-white">{output.schemaName}</span>
                                <span className="text-white/30">·</span>
                                <span className="text-xs text-white/40">{output.domain}</span>
                              </div>
                              <p className="text-xs text-white/50 truncate">{output.outputSummary}</p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <VerdictBadge verdict={output.verdict} isRefusal={output.isRefusal} />
                              <span className="text-xs text-white/30 flex items-center gap-1">
                                <Clock size={11} />
                                {timeAgo(output.recordedAt)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Domain Breakdown */}
                  {Object.keys(stats.byDomain).length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
                        Domain Breakdown
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.entries(stats.byDomain).map(([domain, domainStats]) => (
                          <div key={domain} className="bg-[#0f1117] border border-white/8 rounded-xl p-4">
                            <div className="text-sm font-semibold text-white mb-1 capitalize">{domain}</div>
                            <div className="text-xs text-white/40">{domainStats.total} calls</div>
                            {domainStats.refusals > 0 && (
                              <div className="text-xs text-orange-400 mt-1">{domainStats.refusals} refusals</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Proof Chain Tab */}
              {activeTab === 'proof-chain' && (
                <div>
                  {(!data?.recentProofChainEntries || data.recentProofChainEntries.length === 0) ? (
                    <EmptyState message="No proof chain entries yet. Governed calls are automatically recorded here." />
                  ) : (
                    <div className="space-y-2">
                      {data.recentProofChainEntries.map((entry) => {
                        const isExpanded = expandedEntry === entry.entryId;
                        return (
                          <div key={entry.entryId} className="bg-[#0f1117] border border-white/8 rounded-xl overflow-hidden">
                            <button
                              className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-white/3 transition-colors"
                              onClick={() => setExpandedEntry(isExpanded ? null : entry.entryId)}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium text-white">{entry.schemaName}</span>
                                  <span className="text-white/30">·</span>
                                  <span className="text-xs text-white/40 font-mono">{entry.promptHash}</span>
                                </div>
                                <p className="text-xs text-white/50 truncate">{entry.outputSummary}</p>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <VerdictBadge verdict={entry.governanceVerdict} isRefusal={entry.isRefusal} />
                                {entry.confidence !== null && (
                                  <span className="text-xs text-white/40">{(entry.confidence * 100).toFixed(0)}%</span>
                                )}
                                <span className="text-xs text-white/30">{timeAgo(entry.recordedAt)}</span>
                                {isExpanded ? <ChevronUp size={14} className="text-white/30" /> : <ChevronDown size={14} className="text-white/30" />}
                              </div>
                            </button>
                            {isExpanded && (
                              <div className="border-t border-white/8 px-5 py-4 bg-[#0a0c10]">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                  <div>
                                    <div className="text-white/40 mb-1">Run ID</div>
                                    <div className="text-white/70 font-mono text-xs break-all">{entry.runId}</div>
                                  </div>
                                  <div>
                                    <div className="text-white/40 mb-1">Model</div>
                                    <div className="text-white/70">{entry.model}</div>
                                  </div>
                                  <div>
                                    <div className="text-white/40 mb-1">Tokens</div>
                                    <div className="text-white/70">{entry.promptTokens}p / {entry.completionTokens}c</div>
                                  </div>
                                  <div>
                                    <div className="text-white/40 mb-1">Latency</div>
                                    <div className="text-white/70">{entry.latencyMs}ms</div>
                                  </div>
                                  {entry.covenantFailures.length > 0 && (
                                    <div className="col-span-2 md:col-span-4">
                                      <div className="text-white/40 mb-1">Covenant Failures</div>
                                      <div className="text-red-400">{entry.covenantFailures.join(', ')}</div>
                                    </div>
                                  )}
                                  {entry.refusalReason && (
                                    <div className="col-span-2 md:col-span-4">
                                      <div className="text-white/40 mb-1">Refusal Reason</div>
                                      <div className="text-orange-400">{entry.refusalReason}</div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Refusal Incidents Tab */}
              {activeTab === 'refusals' && (
                <div>
                  {(!data?.refusalIncidents || data.refusalIncidents.length === 0) ? (
                    <EmptyState message="No refusal incidents recorded. This is the expected state — zero refusals means 100% schema adherence." />
                  ) : (
                    <div className="space-y-3">
                      {data.refusalIncidents.map((incident) => (
                        <div key={incident.incidentId} className="bg-[#1a100a] border border-orange-500/20 rounded-xl px-5 py-4">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <AlertTriangle size={14} className="text-orange-400 shrink-0" />
                                <span className="text-sm font-semibold text-white">
                                  {incident.schemaName} Refusal — {incident.domain}
                                </span>
                              </div>
                              <p className="text-xs text-orange-300/70 leading-relaxed">{incident.reason}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              <RiskBadge tier={incident.riskTier} />
                              <span className="text-xs text-white/30">{timeAgo(incident.recordedAt)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-white/40">
                            <span>Model: {incident.model}</span>
                            <span>·</span>
                            <span>Status: <span className={incident.status === 'open' ? 'text-orange-400' : 'text-emerald-400'}>{incident.status}</span></span>
                            {incident.escalatedTo && (
                              <>
                                <span>·</span>
                                <span>Escalated to: <span className="text-purple-400">{incident.escalatedTo}</span></span>
                              </>
                            )}
                          </div>
                          <div className="mt-2 text-xs text-white/25 font-mono">
                            ID: {incident.incidentId}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </OpsLayout>
  );
}

export default StructuredIntelligencePage;
