import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Database,
  Eye,
  EyeOff,
  Fingerprint,
  Globe,
  Info,
  Lock,
  Network,
  Play,
  RefreshCw,
  Settings,
  Shield,
  ShieldCheck,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { useCallback, useState } from 'react';

interface FederatedTenant {
  id: string;
  name: string;
  region: string;
  dataSize: string;
  roundsParticipated: number;
  lastGradientAt: string;
  privacyBudgetUsed: number;
  privacyBudgetTotal: number;
  status: 'active' | 'pending' | 'paused' | 'opted_out';
  contributionScore: number;
}

interface FederatedRound {
  roundId: number;
  startedAt: string;
  completedAt?: string;
  participantCount: number;
  aggregatedGradients: number;
  globalAccuracyDelta: number;
  status: 'running' | 'aggregating' | 'complete' | 'failed';
  privacyGuarantee: string;
}

interface ModelConfig {
  name: string;
  domain: string;
  architecture: string;
  localEpochs: number;
  batchSize: number;
  privacyMechanism: 'differential_privacy' | 'secure_aggregation' | 'both';
  epsilon: number;
  delta: number;
  clippingThreshold: number;
}

const TENANTS: FederatedTenant[] = [
  { id: 'tenant-alpha', name: 'Meridian Capital', region: 'us-east-1', dataSize: '2.4 GB', roundsParticipated: 18, lastGradientAt: '4m ago', privacyBudgetUsed: 2.1, privacyBudgetTotal: 10, status: 'active', contributionScore: 94 },
  { id: 'tenant-bravo', name: 'Arclight Defense', region: 'eu-west-1', dataSize: '1.1 GB', roundsParticipated: 15, lastGradientAt: '6m ago', privacyBudgetUsed: 1.8, privacyBudgetTotal: 10, status: 'active', contributionScore: 87 },
  { id: 'tenant-charlie', name: 'NovaTrust Holdings', region: 'ap-southeast-1', dataSize: '3.8 GB', roundsParticipated: 20, lastGradientAt: '2m ago', privacyBudgetUsed: 2.5, privacyBudgetTotal: 10, status: 'active', contributionScore: 98 },
  { id: 'tenant-delta', name: 'Crestview Asset Mgmt', region: 'us-west-2', dataSize: '0.9 GB', roundsParticipated: 8, lastGradientAt: '1h ago', privacyBudgetUsed: 0.9, privacyBudgetTotal: 10, status: 'paused', contributionScore: 62 },
  { id: 'tenant-echo', name: 'Hartfield Group', region: 'eu-central-1', dataSize: '4.2 GB', roundsParticipated: 0, lastGradientAt: '—', privacyBudgetUsed: 0, privacyBudgetTotal: 10, status: 'opted_out', contributionScore: 0 },
];

const ROUNDS: FederatedRound[] = [
  { roundId: 22, startedAt: '2026-04-26 14:32', completedAt: '2026-04-26 14:38', participantCount: 3, aggregatedGradients: 2847, globalAccuracyDelta: 0.34, status: 'complete', privacyGuarantee: 'ε=0.12, δ=1e-5' },
  { roundId: 21, startedAt: '2026-04-26 12:10', completedAt: '2026-04-26 12:17', participantCount: 3, aggregatedGradients: 2701, globalAccuracyDelta: 0.28, status: 'complete', privacyGuarantee: 'ε=0.11, δ=1e-5' },
  { roundId: 20, startedAt: '2026-04-26 09:45', completedAt: '2026-04-26 09:53', participantCount: 4, aggregatedGradients: 3102, globalAccuracyDelta: 0.41, status: 'complete', privacyGuarantee: 'ε=0.14, δ=1e-5' },
  { roundId: 23, startedAt: '2026-04-26 16:00', participantCount: 3, aggregatedGradients: 1241, globalAccuracyDelta: 0, status: 'running', privacyGuarantee: 'ε=0.12, δ=1e-5' },
];

const MODEL_CONFIG: ModelConfig = {
  name: 'ThreatAnomalyDetector v4',
  domain: 'aegis',
  architecture: 'Federated Transformer (4-layer)',
  localEpochs: 3,
  batchSize: 32,
  privacyMechanism: 'both',
  epsilon: 0.12,
  delta: 1e-5,
  clippingThreshold: 1.0,
};

const STATUS_COLORS: Record<FederatedTenant['status'], string> = {
  active: '#c9b787',
  pending: '#c9b787',
  paused: '#94a3b8',
  opted_out: '#f5f5f5',
};

export default function FederatedLearningPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'tenants' | 'rounds' | 'config'>('overview');
  const [showRawGradients, setShowRawGradients] = useState(false);
  const [isAggregating, setIsAggregating] = useState(false);

  const triggerRound = useCallback(async () => {
    setIsAggregating(true);
    await new Promise((r) => setTimeout(r, 3000));
    setIsAggregating(false);
  }, []);

  const activeCount = TENANTS.filter((t) => t.status === 'active').length;
  const currentRound = ROUNDS.find((r) => r.status === 'running');
  const totalGradients = ROUNDS.filter((r) => r.status === 'complete').reduce((s, r) => s + r.aggregatedGradients, 0);
  const avgAccuracyDelta = ROUNDS.filter((r) => r.status === 'complete' && r.globalAccuracyDelta > 0).reduce((s, r, _, a) => s + r.globalAccuracyDelta / a.length, 0);

  return (
    <div className="h-full overflow-auto bg-[#080510] text-[#f5f5f5]" style={{ fontFamily: 'ui-monospace, monospace' }}>
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[#f5f5f5]/10 border border-[#f5f5f5]/20">
              <Lock className="w-5 h-5 text-[#f5f5f5]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#f5f5f5]">Federated Learning</h1>
              <p className="text-xs text-[#f5f5f5]/60 mt-0.5">Privacy-preserving model training · Gradient-only aggregation · Raw data never leaves tenant boundary</p>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-[#c9b787]/5 border border-[#c9b787]/20 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-[#c9b787] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-[#c9b787] font-semibold">Zero data egress guarantee</p>
              <p className="text-[11px] text-[#c9b787]/60 mt-0.5">
                Cryptographic proof: only gradient updates (not raw training data) ever cross tenant boundaries.
                Differential privacy with ε={MODEL_CONFIG.epsilon} provides mathematically provable privacy guarantees.
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 bg-white/[0.03] rounded-lg w-fit">
          {(['overview', 'tenants', 'rounds', 'config'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded text-xs font-semibold capitalize transition-all ${
                activeTab === tab
                  ? 'bg-[#f5f5f5]/20 text-[#f5f5f5]'
                  : 'text-[#f5f5f5]/50 hover:text-[#f5f5f5]/80'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Active Tenants', value: `${activeCount}/${TENANTS.length}`, icon: Users, color: '#c9b787' },
                { label: 'Gradients Aggregated', value: totalGradients.toLocaleString(), icon: Network, color: '#c9b787' },
                { label: 'Avg Accuracy Gain/Round', value: `+${avgAccuracyDelta.toFixed(2)}%`, icon: TrendingUp, color: '#c9b787' },
                { label: 'Privacy Budget Remaining', value: '78%', icon: Shield, color: '#c9b787' },
              ].map((kpi) => (
                <div key={kpi.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <kpi.icon className="w-3.5 h-3.5" style={{ color: kpi.color }} />
                    <p className="text-[10px] text-[#f5f5f5]/50">{kpi.label}</p>
                  </div>
                  <p className="text-xl font-bold text-[#f5f5f5]">{kpi.value}</p>
                </div>
              ))}
            </div>

            {/* Architecture Diagram */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#f5f5f5]/60 mb-4">Aggregation Architecture</h3>
              <div className="flex items-center justify-around py-4 gap-4 overflow-x-auto">
                {TENANTS.filter((t) => t.status === 'active').map((tenant, i) => (
                  <div key={tenant.id} className="flex flex-col items-center gap-2 min-w-[80px]">
                    <div className="w-10 h-10 rounded-lg bg-[#c9b787]/10 border border-[#c9b787]/20 flex items-center justify-center">
                      <Database className="w-4 h-4 text-[#c9b787]" />
                    </div>
                    <p className="text-[9px] text-center text-[#f5f5f5]/70 leading-tight">{tenant.name.split(' ')[0]}</p>
                    <div className="flex flex-col items-center gap-1">
                      <EyeOff className="w-2.5 h-2.5 text-[#f5f5f5]/40" />
                      <p className="text-[8px] text-[#f5f5f5]/30">raw data stays</p>
                    </div>
                    {i < TENANTS.filter((t) => t.status === 'active').length - 1 && (
                      <div className="absolute" />
                    )}
                  </div>
                ))}
                <div className="flex flex-col items-center">
                  <ChevronRight className="w-4 h-4 text-[#c9b787]/40" />
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-[#f5f5f5]/10 border border-[#f5f5f5]/30 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-[#f5f5f5]" />
                  </div>
                  <p className="text-[9px] text-center text-[#f5f5f5]/70">Secure<br />Aggregator</p>
                  <p className="text-[8px] text-[#c9b787]/50">gradients only</p>
                </div>
                <div className="flex flex-col items-center">
                  <ChevronRight className="w-4 h-4 text-[#c9b787]/40" />
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-[#8a8a8a]/10 border border-[#8a8a8a]/20 flex items-center justify-center">
                    <Globe className="w-4 h-4 text-[#8a8a8a]" />
                  </div>
                  <p className="text-[9px] text-center text-[#f5f5f5]/70">Global<br />Model</p>
                  <p className="text-[8px] text-[#c9b787]/50">distributed</p>
                </div>
              </div>
              <div className="mt-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="grid grid-cols-3 gap-3 text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-[#c9b787]/60" />
                    <span className="text-[#f5f5f5]/60">Differential Privacy (ε={MODEL_CONFIG.epsilon})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Fingerprint className="w-3 h-3 text-[#c9b787]/60" />
                    <span className="text-[#f5f5f5]/60">Secure Multi-Party Aggregation</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-3 h-3 text-[#8a8a8a]/60" />
                    <span className="text-[#f5f5f5]/60">Gradient Clipping (threshold={MODEL_CONFIG.clippingThreshold})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Round Status */}
            {currentRound && (
              <div className="rounded-xl border border-[#c9b787]/20 bg-[#c9b787]/5 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#c9b787] animate-pulse" />
                    <h3 className="text-xs font-semibold text-[#c9b787]">Round #{currentRound.roundId} — In Progress</h3>
                  </div>
                  <span className="text-[10px] text-[#c9b787]/60">{currentRound.participantCount} tenants participating</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-[11px]">
                  <div><p className="text-[#c9b787]/50">Gradients collected</p><p className="text-[#c9b787] font-bold mt-0.5">{currentRound.aggregatedGradients.toLocaleString()}</p></div>
                  <div><p className="text-[#c9b787]/50">Privacy guarantee</p><p className="text-[#c9b787] font-bold mt-0.5">{currentRound.privacyGuarantee}</p></div>
                  <div><p className="text-[#c9b787]/50">Started at</p><p className="text-[#c9b787] font-bold mt-0.5">{currentRound.startedAt.split(' ')[1]}</p></div>
                </div>
              </div>
            )}

            <button
              onClick={triggerRound}
              disabled={isAggregating || !!currentRound}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                isAggregating || currentRound
                  ? 'bg-white/[0.04] text-[#f5f5f5]/30 cursor-not-allowed'
                  : 'bg-[#f5f5f5] hover:bg-[#f5f5f5] text-white'
              }`}
            >
              {isAggregating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              {isAggregating ? 'Aggregating Gradients...' : 'Trigger Aggregation Round'}
            </button>
          </div>
        )}

        {/* Tenants Tab */}
        {activeTab === 'tenants' && (
          <div className="space-y-3">
            {TENANTS.map((tenant) => (
              <div key={tenant.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center flex-shrink-0">
                      <Users className="w-3.5 h-3.5 text-[#f5f5f5]/60" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[#f5f5f5]">{tenant.name}</p>
                        <span
                          className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded"
                          style={{ background: `${STATUS_COLORS[tenant.status]}18`, color: STATUS_COLORS[tenant.status] }}
                        >
                          {tenant.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[10px] text-[#f5f5f5]/50">{tenant.region}</span>
                        <span className="text-[10px] text-[#f5f5f5]/50">Local dataset: {tenant.dataSize}</span>
                        <span className="text-[10px] text-[#f5f5f5]/50">Last gradient: {tenant.lastGradientAt}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold" style={{ color: tenant.contributionScore >= 80 ? '#c9b787' : tenant.contributionScore >= 50 ? '#c9b787' : '#94a3b8' }}>
                      {tenant.contributionScore}
                    </p>
                    <p className="text-[9px] text-[#f5f5f5]/40">contribution</p>
                  </div>
                </div>
                {tenant.status !== 'opted_out' && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-[#f5f5f5]/50">Privacy budget used</span>
                      <span className="text-[#f5f5f5]/70">{tenant.privacyBudgetUsed} / {tenant.privacyBudgetTotal} ε</span>
                    </div>
                    <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(tenant.privacyBudgetUsed / tenant.privacyBudgetTotal) * 100}%`,
                          background: tenant.privacyBudgetUsed / tenant.privacyBudgetTotal > 0.7 ? '#f5f5f5' : '#c9b787',
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-[#f5f5f5]/40">{tenant.roundsParticipated} rounds participated</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Rounds Tab */}
        {activeTab === 'rounds' && (
          <div className="space-y-3">
            {ROUNDS.sort((a, b) => b.roundId - a.roundId).map((round) => (
              <div
                key={round.roundId}
                className={`rounded-xl border p-4 ${
                  round.status === 'running'
                    ? 'border-[#c9b787]/30 bg-[#c9b787]/5'
                    : 'border-white/[0.06] bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {round.status === 'running' && <div className="w-1.5 h-1.5 rounded-full bg-[#c9b787] animate-pulse" />}
                    <span className="text-sm font-bold text-[#f5f5f5]">Round #{round.roundId}</span>
                    <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                      round.status === 'complete' ? 'bg-[#c9b787]/10 text-[#c9b787]' :
                      round.status === 'running' ? 'bg-[#c9b787]/10 text-[#c9b787]' :
                      'bg-[#f5f5f5]/10 text-[#f5f5f5]'
                    }`}>{round.status}</span>
                  </div>
                  {round.globalAccuracyDelta > 0 && (
                    <span className="text-[11px] text-[#c9b787] font-bold">+{round.globalAccuracyDelta.toFixed(2)}% accuracy</span>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-3 text-[10px]">
                  <div><p className="text-[#f5f5f5]/40">Participants</p><p className="text-[#f5f5f5] mt-0.5">{round.participantCount}</p></div>
                  <div><p className="text-[#f5f5f5]/40">Gradients</p><p className="text-[#f5f5f5] mt-0.5">{round.aggregatedGradients.toLocaleString()}</p></div>
                  <div><p className="text-[#f5f5f5]/40">Privacy</p><p className="text-[#f5f5f5] mt-0.5">{round.privacyGuarantee}</p></div>
                  <div><p className="text-[#f5f5f5]/40">Started</p><p className="text-[#f5f5f5] mt-0.5">{round.startedAt.split(' ')[1]}</p></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Config Tab */}
        {activeTab === 'config' && (
          <div className="space-y-5">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-4 h-4 text-[#f5f5f5]/60" />
                <h3 className="text-xs font-mono uppercase tracking-wider text-[#f5f5f5]/60">Model Configuration</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Model', value: MODEL_CONFIG.name },
                  { label: 'Domain', value: MODEL_CONFIG.domain },
                  { label: 'Architecture', value: MODEL_CONFIG.architecture },
                  { label: 'Local Epochs', value: String(MODEL_CONFIG.localEpochs) },
                  { label: 'Batch Size', value: String(MODEL_CONFIG.batchSize) },
                  { label: 'Privacy Mechanism', value: MODEL_CONFIG.privacyMechanism.replace('_', ' ') },
                  { label: 'Epsilon (ε)', value: String(MODEL_CONFIG.epsilon) },
                  { label: 'Delta (δ)', value: MODEL_CONFIG.delta.toExponential(0) },
                  { label: 'Gradient Clipping', value: String(MODEL_CONFIG.clippingThreshold) },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col gap-0.5">
                    <p className="text-[10px] text-[#f5f5f5]/40">{item.label}</p>
                    <p className="text-[12px] text-[#f5f5f5] font-mono">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-[#c9b787]/20 bg-[#c9b787]/5 p-4 flex items-start gap-2">
              <Info className="w-4 h-4 text-[#c9b787] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-[#c9b787] font-semibold">Configuration is read-only in demo mode</p>
                <p className="text-[11px] text-[#c9b787]/60 mt-0.5">
                  Privacy parameters (ε, δ, clipping threshold) require a signed governance review before changes take effect.
                  Contact your privacy officer to initiate a parameter update request.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
