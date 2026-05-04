import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  FileCheck,
  Filter,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  ShieldOff,
  XCircle,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

type PassportState = 'draft' | 'proposed' | 'approved' | 'active' | 'deprecated' | 'revoked';
type QuantTier = 'fp32' | 'fp16' | 'bf16' | 'int8' | 'int4' | 'gguf-q4' | 'gguf-q5' | 'gguf-q8' | 'hosted';
type AutonomyTier = 'read_only' | 'advisory' | 'supervised' | 'autonomous';
type RouteClass = 'classification' | 'triage' | 'reasoning' | 'planning' | 'tool_calling' | 'vision_understanding' | 'background_batch' | 'extraction' | 'summarization';

interface PassportEntry {
  id: string;
  displayName: string;
  provider: string;
  providerModelId: string;
  quantTier: QuantTier;
  lanes: RouteClass[];
  state: PassportState;
  costPer1kTokensUsd: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  evalPassRate: number;
  autonomyTier: AutonomyTier;
  signatureDigest: string;
  provenanceHash: string;
  downgradeTo: Array<{ passportId: string; displayName: string; reason: string }>;
  allowedDomains: string[];
  piiHandling: 'blocked' | 'redacted' | 'allowed';
  contextWindow: number;
  updatedAt: string;
}

const DEMO_PASSPORTS: PassportEntry[] = [
  {
    id: 'mpf_4a7b9c2d1e3f',
    displayName: 'GPT-4o — Standard Hosted',
    provider: 'openai',
    providerModelId: 'gpt-4o',
    quantTier: 'hosted',
    lanes: ['reasoning', 'planning', 'tool_calling', 'extraction', 'summarization'],
    state: 'active',
    costPer1kTokensUsd: 0.005,
    p50LatencyMs: 800,
    p95LatencyMs: 2500,
    evalPassRate: 0.92,
    autonomyTier: 'supervised',
    signatureDigest: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
    provenanceHash: 'sha256:9f8e7d6c5b4a39281706050403020100ff',
    downgradeTo: [{ passportId: 'mpf_8e1f2a3b4c5d', displayName: 'GPT-4o Mini — Economy', reason: 'budget_exceeded' }],
    allowedDomains: ['*'],
    piiHandling: 'redacted',
    contextWindow: 128000,
    updatedAt: '2026-05-01T10:00:00Z',
  },
  {
    id: 'mpf_8e1f2a3b4c5d',
    displayName: 'GPT-4o Mini — Economy',
    provider: 'openai',
    providerModelId: 'gpt-4o-mini',
    quantTier: 'hosted',
    lanes: ['classification', 'triage', 'extraction', 'summarization', 'background_batch'],
    state: 'active',
    costPer1kTokensUsd: 0.00015,
    p50LatencyMs: 300,
    p95LatencyMs: 1000,
    evalPassRate: 0.85,
    autonomyTier: 'advisory',
    signatureDigest: 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7',
    provenanceHash: 'sha256:ae1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b',
    downgradeTo: [{ passportId: 'mpf_1a2b3c4d5e6f', displayName: 'Qwen3-0.6B — Local Fallback', reason: 'cost_exceeded' }],
    allowedDomains: ['*'],
    piiHandling: 'redacted',
    contextWindow: 128000,
    updatedAt: '2026-05-01T10:00:00Z',
  },
  {
    id: 'mpf_c3d4e5f6a7b8',
    displayName: 'Claude Sonnet 4.6 — Standard',
    provider: 'anthropic',
    providerModelId: 'claude-sonnet-4-6',
    quantTier: 'hosted',
    lanes: ['reasoning', 'planning', 'extraction', 'summarization'],
    state: 'active',
    costPer1kTokensUsd: 0.003,
    p50LatencyMs: 1000,
    p95LatencyMs: 3000,
    evalPassRate: 0.94,
    autonomyTier: 'supervised',
    signatureDigest: 'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8',
    provenanceHash: 'sha256:cd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a',
    downgradeTo: [{ passportId: 'mpf_8e1f2a3b4c5d', displayName: 'GPT-4o Mini — Economy', reason: 'provider_fallback' }],
    allowedDomains: ['*'],
    piiHandling: 'redacted',
    contextWindow: 200000,
    updatedAt: '2026-05-01T10:00:00Z',
  },
  {
    id: 'mpf_d4e5f6a7b8c9',
    displayName: 'Qwen3-8B — HuggingFace Hosted',
    provider: 'huggingface',
    providerModelId: 'Qwen/Qwen3-8B',
    quantTier: 'hosted',
    lanes: ['triage', 'classification', 'extraction', 'summarization'],
    state: 'active',
    costPer1kTokensUsd: 0.0002,
    p50LatencyMs: 500,
    p95LatencyMs: 1500,
    evalPassRate: 0.80,
    autonomyTier: 'advisory',
    signatureDigest: 'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9',
    provenanceHash: 'sha256:de5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b',
    downgradeTo: [{ passportId: 'mpf_1a2b3c4d5e6f', displayName: 'Qwen3-0.6B — Local Fallback', reason: 'cost_exceeded' }],
    allowedDomains: ['*'],
    piiHandling: 'redacted',
    contextWindow: 32768,
    updatedAt: '2026-05-01T10:00:00Z',
  },
  {
    id: 'mpf_1a2b3c4d5e6f',
    displayName: 'Qwen3-0.6B — Local Fallback',
    provider: 'huggingface',
    providerModelId: 'Qwen/Qwen3-0.6B',
    quantTier: 'hosted',
    lanes: ['classification', 'background_batch'],
    state: 'active',
    costPer1kTokensUsd: 0.00005,
    p50LatencyMs: 150,
    p95LatencyMs: 500,
    evalPassRate: 0.72,
    autonomyTier: 'read_only',
    signatureDigest: 'e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
    provenanceHash: 'sha256:ef7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c',
    downgradeTo: [],
    allowedDomains: ['*'],
    piiHandling: 'redacted',
    contextWindow: 32768,
    updatedAt: '2026-05-01T10:00:00Z',
  },
  {
    id: 'mpf_2b3c4d5e6f7a',
    displayName: 'Gemini 3.1 Pro Preview — Vision',
    provider: 'gemini',
    providerModelId: 'gemini-3.1-pro-preview',
    quantTier: 'hosted',
    lanes: ['vision_understanding', 'reasoning'],
    state: 'proposed',
    costPer1kTokensUsd: 0.00125,
    p50LatencyMs: 1200,
    p95LatencyMs: 4000,
    evalPassRate: 0.88,
    autonomyTier: 'supervised',
    signatureDigest: 'f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1',
    provenanceHash: 'sha256:fa8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d',
    downgradeTo: [],
    allowedDomains: ['vision', 'research'],
    piiHandling: 'redacted',
    contextWindow: 1000000,
    updatedAt: '2026-05-03T14:30:00Z',
  },
];

const STATE_CONFIG: Record<PassportState, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  draft: { label: 'DRAFT', color: 'text-muted-foreground border-muted-foreground/30 bg-muted-foreground/10', icon: Clock },
  proposed: { label: 'PROPOSED', color: 'text-praxis-amber border-praxis-amber/30 bg-praxis-amber/10', icon: AlertTriangle },
  approved: { label: 'APPROVED', color: 'text-praxis-teal border-praxis-teal/30 bg-praxis-teal/10', icon: CheckCircle },
  active: { label: 'ACTIVE', color: 'text-praxis-green border-praxis-green/30 bg-praxis-green/10', icon: ShieldCheck },
  deprecated: { label: 'DEPRECATED', color: 'text-orange-400 border-orange-400/30 bg-orange-400/10', icon: ShieldOff },
  revoked: { label: 'REVOKED', color: 'text-praxis-red border-red-500/30 bg-red-500/10', icon: XCircle },
};

const AUTONOMY_COLORS: Record<AutonomyTier, string> = {
  read_only: 'text-muted-foreground',
  advisory: 'text-praxis-teal',
  supervised: 'text-praxis-amber',
  autonomous: 'text-praxis-red',
};

function StateChip({ state }: { state: PassportState }) {
  const cfg = STATE_CONFIG[state];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border ${cfg.color}`}>
      <Icon className="w-2.5 h-2.5" />
      {cfg.label}
    </span>
  );
}

function CostBadge({ usd }: { usd: number }) {
  const fmt = usd === 0 ? 'FREE' : usd < 0.001 ? `$${(usd * 1000).toFixed(3)}/M` : `$${usd.toFixed(4)}/K`;
  return <span className="text-[10px] font-mono text-muted-foreground">{fmt}</span>;
}

function EvalBar({ rate }: { rate: number }) {
  const pct = Math.round(rate * 100);
  const color = pct >= 90 ? 'bg-praxis-green' : pct >= 80 ? 'bg-praxis-teal' : pct >= 70 ? 'bg-praxis-amber' : 'bg-praxis-red';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-mono text-muted-foreground">{pct}%</span>
    </div>
  );
}

function LaneChip({ lane }: { lane: RouteClass }) {
  const colors: Record<RouteClass, string> = {
    reasoning: 'bg-praxis-green/10 text-praxis-green border-praxis-green/20',
    planning: 'bg-praxis-teal/10 text-praxis-teal border-praxis-teal/20',
    tool_calling: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    classification: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    triage: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    extraction: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    summarization: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    vision_understanding: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    background_batch: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  };
  return (
    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${colors[lane]}`}>
      {lane.replace('_', '·')}
    </span>
  );
}

function VerifyButton({ passport }: { passport: PassportEntry }) {
  const [status, setStatus] = useState<'idle' | 'verifying' | 'ok' | 'fail'>('idle');

  async function handleVerify() {
    setStatus('verifying');
    await new Promise((r) => setTimeout(r, 800));
    setStatus(passport.state === 'active' ? 'ok' : 'fail');
    setTimeout(() => setStatus('idle'), 3000);
  }

  return (
    <button
      onClick={handleVerify}
      disabled={status === 'verifying'}
      className="inline-flex items-center gap-1.5 text-[11px] font-mono px-3 py-1.5 rounded border border-praxis-teal/40 text-praxis-teal hover:bg-praxis-teal/10 disabled:opacity-50 transition-colors"
    >
      {status === 'verifying' && <RefreshCw className="w-3 h-3 animate-spin" />}
      {status === 'ok' && <CheckCircle className="w-3 h-3 text-praxis-green" />}
      {status === 'fail' && <XCircle className="w-3 h-3 text-praxis-red" />}
      {status === 'idle' && <Shield className="w-3 h-3" />}
      {status === 'idle' ? 'Verify' : status === 'verifying' ? 'Verifying…' : status === 'ok' ? 'Valid' : 'Invalid'}
    </button>
  );
}

function PassportDrawer({
  passport,
  onClose,
}: {
  passport: PassportEntry;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-y-0 right-0 w-[480px] bg-gi-bg-base border-l border-gi-border-subtle z-40 flex flex-col shadow-2xl">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gi-border-subtle">
        <div>
          <div className="text-sm font-semibold text-gi-text-primary">{passport.displayName}</div>
          <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{passport.id}</div>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-gi-text-primary transition-colors">
          <XCircle className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
        <div className="flex items-center gap-3 flex-wrap">
          <StateChip state={passport.state} />
          <span className={`text-[10px] font-mono ${AUTONOMY_COLORS[passport.autonomyTier]}`}>
            {passport.autonomyTier.replace('_', ' ').toUpperCase()}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground border border-gi-border-subtle px-2 py-0.5 rounded">
            {passport.quantTier}
          </span>
        </div>

        <Section title="Identity">
          <Row label="Provider" value={passport.provider} />
          <Row label="Model ID" value={passport.providerModelId} mono />
          <Row label="Context Window" value={`${(passport.contextWindow / 1000).toFixed(0)}K tokens`} />
        </Section>

        <Section title="Capability Surface">
          <div className="flex flex-wrap gap-1 mt-1">
            {passport.lanes.map((l) => <LaneChip key={l} lane={l} />)}
          </div>
        </Section>

        <Section title="Cost / Latency / Accuracy">
          <Row label="Cost" value={`$${passport.costPer1kTokensUsd.toFixed(5)} per 1K tokens`} />
          <Row label="P50 Latency" value={`${passport.p50LatencyMs}ms`} />
          <Row label="P95 Latency" value={`${passport.p95LatencyMs}ms`} />
          <div className="flex items-center justify-between py-0.5">
            <span className="text-[11px] text-muted-foreground">Eval Pass Rate</span>
            <EvalBar rate={passport.evalPassRate} />
          </div>
        </Section>

        <Section title="Policy Envelope">
          <Row label="Autonomy Tier" value={passport.autonomyTier.replace('_', ' ')} />
          <Row label="PII Handling" value={passport.piiHandling} />
          <Row label="Domains" value={passport.allowedDomains.join(', ')} />
        </Section>

        <Section title="Signatures & Provenance">
          <Row label="Signature Digest" value={passport.signatureDigest.slice(0, 16) + '…'} mono />
          <Row label="Provenance Hash" value={passport.provenanceHash.slice(0, 24) + '…'} mono />
        </Section>

        {passport.downgradeTo.length > 0 && (
          <Section title="Downgrade Ladder">
            {passport.downgradeTo.map((d) => (
              <div key={d.passportId} className="flex items-start gap-2 py-1">
                <ChevronRight className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-[11px] text-gi-text-primary">{d.displayName}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">{d.reason}</div>
                </div>
              </div>
            ))}
          </Section>
        )}

        <div className="pt-2">
          <VerifyButton passport={passport} />
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2 pb-1 border-b border-gi-border-subtle">
        {title}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className={`text-[11px] text-gi-text-primary ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

function PassportRow({
  passport,
  isSelected,
  onClick,
}: {
  passport: PassportEntry;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <tr
      className={`border-b border-gi-border-subtle cursor-pointer transition-colors ${isSelected ? 'bg-praxis-teal/5' : 'hover:bg-gi-bg-elevated'}`}
      onClick={onClick}
    >
      <td className="px-4 py-3">
        <div className="text-[12px] font-medium text-gi-text-primary">{passport.displayName}</div>
        <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{passport.id}</div>
      </td>
      <td className="px-4 py-3">
        <div className="text-[11px] text-gi-text-primary">{passport.provider}</div>
        <div className="text-[10px] text-muted-foreground font-mono">{passport.quantTier}</div>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-0.5">
          {passport.lanes.slice(0, 3).map((l) => <LaneChip key={l} lane={l} />)}
          {passport.lanes.length > 3 && (
            <span className="text-[9px] font-mono text-muted-foreground">+{passport.lanes.length - 3}</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <StateChip state={passport.state} />
      </td>
      <td className="px-4 py-3">
        <EvalBar rate={passport.evalPassRate} />
      </td>
      <td className="px-4 py-3">
        <CostBadge usd={passport.costPer1kTokensUsd} />
      </td>
      <td className="px-4 py-3">
        <VerifyButton passport={passport} />
      </td>
    </tr>
  );
}

export default function PassportRegistry() {
  const [selectedPassport, setSelectedPassport] = useState<PassportEntry | null>(null);
  const [laneFilter, setLaneFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllowlistOnly, setShowAllowlistOnly] = useState(false);

  const filtered = DEMO_PASSPORTS.filter((p) => {
    if (laneFilter && !p.lanes.includes(laneFilter as RouteClass)) return false;
    if (stateFilter && p.state !== stateFilter) return false;
    if (showAllowlistOnly && p.state !== 'active') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!p.displayName.toLowerCase().includes(q) &&
          !p.provider.toLowerCase().includes(q) &&
          !p.providerModelId.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const stateCounts = DEMO_PASSPORTS.reduce((acc, p) => {
    acc[p.state] = (acc[p.state] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const avgEval = DEMO_PASSPORTS.filter((p) => p.state === 'active')
    .reduce((s, p) => s + p.evalPassRate, 0) / DEMO_PASSPORTS.filter((p) => p.state === 'active').length;

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-5 pb-4 border-b border-gi-border-subtle flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-praxis-teal" />
              <h2 className="text-lg font-semibold text-gi-text-primary tracking-tight">
                Passport Registry
              </h2>
            </div>
            <p className="text-[12px] text-muted-foreground mt-1">
              Signed model identity and governance artifacts — one passport per model × quant tier × policy envelope × tenant scope.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAllowlistOnly(!showAllowlistOnly)}
              className={`text-[11px] font-mono px-3 py-1.5 rounded border transition-colors ${showAllowlistOnly ? 'border-praxis-green/50 bg-praxis-green/10 text-praxis-green' : 'border-gi-border-subtle text-muted-foreground hover:text-gi-text-primary'}`}
            >
              {showAllowlistOnly ? '● ' : '○ '}Active Only
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-3">
          {(['active', 'proposed', 'deprecated', 'revoked'] as PassportState[]).map((s) => {
            const cfg = STATE_CONFIG[s];
            const Icon = cfg.icon;
            return (
              <div key={s} className="rounded border border-gi-border-subtle bg-gi-bg-elevated px-3 py-2">
                <div className={`text-[10px] font-mono ${cfg.color.split(' ')[0]} flex items-center gap-1`}>
                  <Icon className="w-2.5 h-2.5" />
                  {cfg.label}
                </div>
                <div className="text-xl font-bold text-gi-text-primary mt-1">{stateCounts[s] ?? 0}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-6 py-3 border-b border-gi-border-subtle flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-2 flex-1">
          <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <input
            className="flex-1 text-[12px] bg-transparent outline-none text-gi-text-primary placeholder:text-muted-foreground"
            placeholder="Search passports…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-3 h-3 text-muted-foreground" />
          <select
            className="text-[11px] font-mono bg-gi-bg-elevated border border-gi-border-subtle rounded px-2 py-1 text-gi-text-primary outline-none"
            value={laneFilter}
            onChange={(e) => setLaneFilter(e.target.value)}
          >
            <option value="">All Lanes</option>
            {(['reasoning', 'planning', 'tool_calling', 'classification', 'triage', 'extraction', 'summarization', 'vision_understanding', 'background_batch'] as RouteClass[]).map((l) => (
              <option key={l} value={l}>{l.replace('_', ' ')}</option>
            ))}
          </select>
          <select
            className="text-[11px] font-mono bg-gi-bg-elevated border border-gi-border-subtle rounded px-2 py-1 text-gi-text-primary outline-none"
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
          >
            <option value="">All States</option>
            {(['draft', 'proposed', 'approved', 'active', 'deprecated', 'revoked'] as PassportState[]).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto relative">
        <table className="w-full">
          <thead className="sticky top-0 bg-gi-bg-base border-b border-gi-border-subtle z-10">
            <tr>
              {['Passport', 'Provider · Tier', 'Lanes', 'State', 'Eval', 'Cost', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <PassportRow
                key={p.id}
                passport={p}
                isSelected={selectedPassport?.id === p.id}
                onClick={() => setSelectedPassport(selectedPassport?.id === p.id ? null : p)}
              />
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-[12px] text-muted-foreground">
                  No passports match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-3 border-t border-gi-border-subtle flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
          <span>{filtered.length} passport{filtered.length !== 1 ? 's' : ''}</span>
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-praxis-teal" />
            Avg eval: {Math.round(avgEval * 100)}%
          </span>
        </div>
        <div className="text-[10px] font-mono text-muted-foreground">
          Model Passport Format v1.0 · Ed25519 · SHA-256
        </div>
      </div>

      {selectedPassport && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-30"
            onClick={() => setSelectedPassport(null)}
          />
          <PassportDrawer
            passport={selectedPassport}
            onClose={() => setSelectedPassport(null)}
          />
        </>
      )}
    </div>
  );
}
