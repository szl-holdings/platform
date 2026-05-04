import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  Filter,
  GitBranch,
  Info,
  Layers,
  Link2,
  Lock,
  Minus,
  Package,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  ShieldOff,
  Sliders,
  Star,
  TrendingDown,
  TrendingUp,
  XCircle,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

type PassportState = 'draft' | 'proposed' | 'approved' | 'active' | 'deprecated' | 'revoked';
type QuantTier = 'fp32' | 'fp16' | 'bf16' | 'int8' | 'int4' | 'gguf-q4' | 'gguf-q5' | 'gguf-q8' | 'hosted';
type AutonomyTier = 'read_only' | 'advisory' | 'supervised' | 'autonomous';
type RouteClass = 'classification' | 'triage' | 'reasoning' | 'planning' | 'tool_calling' | 'vision_understanding' | 'background_batch' | 'extraction' | 'summarization';
type RegistryTab = 'list' | 'provenance' | 'lenses' | 'eval-gates';
type DiffClassification = 'regression' | 'neutral' | 'improvement';

interface EvalGates {
  minGoldenSetPassRate: number;
  maxP95LatencyMs: number;
  maxCostPerCallUsd: number;
  evalRunId?: string;
}

interface PolicyLens {
  lensId: string;
  displayName: string;
  description?: string;
  tenantId: number;
  passportId: string;
  envelope: {
    autonomyTier?: AutonomyTier;
    allowedDomains?: string[];
    piiHandling?: 'blocked' | 'redacted' | 'allowed';
    maxBudgetUsdPerCall?: number;
    jurisdictions?: string[];
    escalationRules?: string[];
  };
  createdAt: string;
}

interface DiffEntry {
  field: string;
  section: string;
  classification: DiffClassification;
  from: unknown;
  to: unknown;
  description: string;
}

interface ProofBundleRecord {
  bundleId: string;
  runId: string;
  createdAt: string;
  integrityRoot: string;
  verifyStatus: 'pending' | 'valid' | 'tampered' | 'revoked';
}

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
  isDrifting?: boolean;
  parentPassportId?: string;
  evalRunId?: string;
  promptPins?: string[];
  datasetHashes?: string[];
  evalGates?: EvalGates;
  lenses?: PolicyLens[];
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
    isDrifting: true,
    parentPassportId: 'mpf_legacy_gpt4',
    evalRunId: 'eval_run_20260501_001',
    promptPins: ['prompt_registry:triage-v3', 'prompt_registry:reasoning-v5'],
    datasetHashes: ['sha256:data_golden_set_v2', 'sha256:data_reasoning_bench'],
    evalGates: {
      minGoldenSetPassRate: 0.85,
      maxP95LatencyMs: 5000,
      maxCostPerCallUsd: 0.50,
      evalRunId: 'eval_run_20260501_001',
    },
    lenses: [
      {
        lensId: 'lens_eu_001',
        displayName: 'EU Tenant — GDPR Strict',
        description: 'Stricter PII redaction and EU-only jurisdiction for EU tenants',
        tenantId: 101,
        passportId: 'mpf_4a7b9c2d1e3f',
        envelope: {
          piiHandling: 'blocked',
          jurisdictions: ['EU'],
          maxBudgetUsdPerCall: 0.25,
        },
        createdAt: '2026-05-02T08:00:00Z',
      },
    ],
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
    evalRunId: 'eval_run_20260501_002',
    promptPins: ['prompt_registry:triage-v3'],
    datasetHashes: ['sha256:data_golden_set_v2'],
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
    parentPassportId: 'mpf_claude_v1',
    promptPins: ['prompt_registry:reasoning-v5'],
    datasetHashes: ['sha256:data_reasoning_bench'],
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
    parentPassportId: 'mpf_4a7b9c2d1e3f',
    evalGates: {
      minGoldenSetPassRate: 0.85,
      maxP95LatencyMs: 6000,
      maxCostPerCallUsd: 0.30,
    },
  },
];

const DEMO_PROOF_BUNDLES: ProofBundleRecord[] = [
  { bundleId: 'pb_1a2b3c', runId: 'run_20260501_001', createdAt: '2026-05-01T10:15:00Z', integrityRoot: 'sha256:a1b2c3d4e5', verifyStatus: 'valid' },
  { bundleId: 'pb_4d5e6f', runId: 'run_20260501_042', createdAt: '2026-05-01T11:30:00Z', integrityRoot: 'sha256:d4e5f6a7b8', verifyStatus: 'valid' },
  { bundleId: 'pb_7g8h9i', runId: 'run_20260503_007', createdAt: '2026-05-03T08:45:00Z', integrityRoot: 'sha256:g7h8i9j0k1', verifyStatus: 'tampered' },
];

const DEMO_DIFF_ENTRIES: DiffEntry[] = [
  { field: 'costProfile.p95LatencyMs', section: 'Cost / Latency', classification: 'regression', from: 2500, to: 4000, description: 'P95 latency: 2500ms → 4000ms' },
  { field: 'piiHandling', section: 'Policy Envelope', classification: 'improvement', from: 'allowed', to: 'redacted', description: 'PII handling tightened: allowed → redacted' },
  { field: 'capabilitySurface.lanes.added', section: 'Capability Surface', classification: 'improvement', from: [], to: ['vision_understanding'], description: 'Lanes added: vision_understanding' },
  { field: 'autonomyTier', section: 'Policy Envelope', classification: 'regression', from: 'supervised', to: 'autonomous', description: 'Autonomy increased: supervised → autonomous (higher autonomy = less oversight)' },
  { field: 'costProfile.evalPassRate', section: 'Cost / Latency', classification: 'improvement', from: 0.85, to: 0.88, description: 'Eval pass rate: 85% → 88%' },
  { field: 'costProfile.costPer1kTokensUsd', section: 'Cost / Latency', classification: 'neutral', from: 0.005, to: 0.00125, description: 'Cost per 1K tokens: $0.005 → $0.00125' },
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

function DriftBadge({ passportId }: { passportId: string }) {
  const passport = DEMO_PASSPORTS.find((p) => p.id === passportId);
  if (!passport?.isDrifting) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded border border-orange-500/40 bg-orange-500/10 text-orange-400 animate-pulse">
      <Activity className="w-2.5 h-2.5" />
      DRIFT
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

function ProofBundlePanel({ passport }: { passport: PassportEntry }) {
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState<ProofBundleRecord | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'verifying' | 'valid' | 'tampered'>('idle');
  const bundles = DEMO_PROOF_BUNDLES.filter(() => passport.id === 'mpf_4a7b9c2d1e3f' || passport.state === 'active');

  async function handleExport() {
    setExporting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setExported({
      bundleId: `pb_${Math.random().toString(36).slice(2, 8)}`,
      runId: `run_${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      integrityRoot: `sha256:${Math.random().toString(36).slice(2, 18)}`,
      verifyStatus: 'valid',
    });
    setExporting(false);
  }

  async function handleVerify(bundle: ProofBundleRecord) {
    setVerifyStatus('verifying');
    await new Promise((r) => setTimeout(r, 900));
    setVerifyStatus(bundle.verifyStatus === 'tampered' ? 'tampered' : 'valid');
    setTimeout(() => setVerifyStatus('idle'), 4000);
  }

  return (
    <div className="space-y-3">
      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2 pb-1 border-b border-gi-border-subtle">
        Proof Bundles — SBOM for AI Decisions
      </div>
      <p className="text-[11px] text-muted-foreground">
        Each Proof Bundle is a signed, offline-verifiable receipt proving which passport governed the decision and that inputs/outputs were not tampered with.
      </p>

      <div className="flex items-center gap-2">
        <button
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-1.5 text-[11px] font-mono px-3 py-1.5 rounded border border-praxis-teal/40 text-praxis-teal hover:bg-praxis-teal/10 disabled:opacity-50 transition-colors"
        >
          {exporting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
          {exporting ? 'Building bundle…' : 'Export Proof Bundle'}
        </button>
      </div>

      {exported && (
        <div className="rounded border border-praxis-green/30 bg-praxis-green/5 px-3 py-2 space-y-1">
          <div className="flex items-center gap-2 text-[11px] font-mono text-praxis-green">
            <CheckCircle className="w-3 h-3" />
            Bundle exported: {exported.bundleId}
          </div>
          <div className="text-[10px] font-mono text-muted-foreground">
            Integrity root: {exported.integrityRoot.slice(0, 24)}…
          </div>
          <button
            onClick={() => handleVerify(exported)}
            className="text-[10px] font-mono text-praxis-teal hover:underline inline-flex items-center gap-1"
          >
            <Eye className="w-2.5 h-2.5" />
            Verify offline
          </button>
        </div>
      )}

      {verifyStatus !== 'idle' && (
        <div className={`rounded border px-3 py-2 text-[11px] font-mono flex items-center gap-2 ${verifyStatus === 'valid' ? 'border-praxis-green/30 bg-praxis-green/5 text-praxis-green' : verifyStatus === 'verifying' ? 'border-praxis-teal/30 bg-praxis-teal/5 text-praxis-teal' : 'border-praxis-red/30 bg-praxis-red/5 text-praxis-red'}`}>
          {verifyStatus === 'verifying' && <RefreshCw className="w-3 h-3 animate-spin" />}
          {verifyStatus === 'valid' && <CheckCircle className="w-3 h-3" />}
          {verifyStatus === 'tampered' && <AlertOctagon className="w-3 h-3" />}
          {verifyStatus === 'verifying' ? 'Verifying bundle integrity…' : verifyStatus === 'valid' ? 'Bundle valid — signature + hashes confirmed, passport unrevoked' : 'TAMPERED — integrity root mismatch detected'}
        </div>
      )}

      <div className="space-y-1">
        {bundles.slice(0, 3).map((b) => (
          <div key={b.bundleId} className="flex items-center justify-between py-1.5 border-b border-gi-border-subtle/50">
            <div>
              <div className="text-[11px] font-mono text-gi-text-primary">{b.bundleId}</div>
              <div className="text-[9px] text-muted-foreground">Run: {b.runId} · {b.createdAt.slice(0, 16)}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${b.verifyStatus === 'valid' ? 'border-praxis-green/30 text-praxis-green bg-praxis-green/5' : 'border-praxis-red/30 text-praxis-red bg-praxis-red/5'}`}>
                {b.verifyStatus.toUpperCase()}
              </span>
              <button onClick={() => handleVerify(b)} className="text-[10px] text-praxis-teal hover:underline">Verify</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DriftPanel({ passport }: { passport: PassportEntry }) {
  const [proposing, setProposing] = useState(false);
  const [proposed, setProposed] = useState(false);

  async function handlePropose() {
    setProposing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setProposed(true);
    setProposing(false);
  }

  if (!passport.isDrifting) {
    return (
      <div className="space-y-2">
        <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2 pb-1 border-b border-gi-border-subtle">
          SLO Drift Monitor
        </div>
        <div className="flex items-center gap-2 text-[11px] text-praxis-green">
          <CheckCircle className="w-3 h-3" />
          All SLO metrics within declared thresholds
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {[
            { label: 'Cost', declared: `$${passport.costPer1kTokensUsd.toFixed(5)}/K`, measured: `$${(passport.costPer1kTokensUsd * 1.05).toFixed(5)}/K`, ok: true },
            { label: 'P95 Latency', declared: `${passport.p95LatencyMs}ms`, measured: `${Math.round(passport.p95LatencyMs * 1.08)}ms`, ok: true },
            { label: 'Eval Rate', declared: `${Math.round(passport.evalPassRate * 100)}%`, measured: `${Math.round(passport.evalPassRate * 100 - 1)}%`, ok: true },
          ].map((m) => (
            <div key={m.label} className="rounded border border-gi-border-subtle bg-gi-bg-elevated px-2 py-1.5">
              <div className="text-[9px] text-muted-foreground font-mono">{m.label}</div>
              <div className="text-[10px] text-gi-text-primary">{m.measured}</div>
              <div className="text-[9px] text-muted-foreground">decl: {m.declared}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2 pb-1 border-b border-gi-border-subtle">
        SLO Drift Monitor — ACTIVE DRIFT DETECTED
      </div>

      <div className="rounded border border-orange-500/30 bg-orange-500/5 px-3 py-2 space-y-2">
        <div className="flex items-center gap-2 text-[11px] font-mono text-orange-400">
          <Activity className="w-3 h-3 animate-pulse" />
          Sustained deviation detected across 2 dimensions
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'P95 Latency', declared: `${passport.p95LatencyMs}ms`, measured: `${Math.round(passport.p95LatencyMs * 1.72)}ms`, delta: '+72%', ok: false },
            { label: 'Cost / Call', declared: `$${passport.costPer1kTokensUsd.toFixed(5)}`, measured: `$${(passport.costPer1kTokensUsd * 1.58).toFixed(5)}`, delta: '+58%', ok: false },
            { label: 'Eval Rate', declared: `${Math.round(passport.evalPassRate * 100)}%`, measured: `${Math.round(passport.evalPassRate * 100)}%`, delta: '0', ok: true },
          ].map((m) => (
            <div key={m.label} className={`rounded border px-2 py-1.5 ${m.ok ? 'border-gi-border-subtle' : 'border-orange-500/30 bg-orange-500/5'}`}>
              <div className="text-[9px] text-muted-foreground font-mono">{m.label}</div>
              <div className={`text-[10px] font-mono ${m.ok ? 'text-gi-text-primary' : 'text-orange-400'}`}>{m.measured}</div>
              <div className={`text-[9px] font-mono ${m.ok ? 'text-muted-foreground' : 'text-orange-400'}`}>{m.delta} vs decl</div>
            </div>
          ))}
        </div>
      </div>

      {!proposed ? (
        <button
          onClick={handlePropose}
          disabled={proposing}
          className="inline-flex items-center gap-1.5 text-[11px] font-mono px-3 py-1.5 rounded border border-praxis-amber/40 text-praxis-amber hover:bg-praxis-amber/10 disabled:opacity-50 transition-colors"
        >
          {proposing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
          {proposing ? 'Filing revision…' : 'Propose Passport Revision'}
        </button>
      ) : (
        <div className="rounded border border-praxis-teal/30 bg-praxis-teal/5 px-3 py-2 text-[11px] font-mono text-praxis-teal flex items-center gap-2">
          <CheckCircle className="w-3 h-3" />
          Proposed revision filed → Approval Queue #42 with drift deltas pre-filled
        </div>
      )}
    </div>
  );
}

function PolicyDiffPanel({ fromPassport, toPassport }: { fromPassport: PassportEntry; toPassport: PassportEntry }) {
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());
  const regressions = DEMO_DIFF_ENTRIES.filter((e) => e.classification === 'regression');
  const improvements = DEMO_DIFF_ENTRIES.filter((e) => e.classification === 'improvement');
  const neutral = DEMO_DIFF_ENTRIES.filter((e) => e.classification === 'neutral');
  const allAcknowledged = regressions.every((r) => acknowledged.has(r.field));

  function toggle(field: string) {
    setAcknowledged((prev) => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  }

  const DiffIcon = ({ cls }: { cls: DiffClassification }) =>
    cls === 'regression' ? (
      <TrendingDown className="w-3 h-3 text-praxis-red flex-shrink-0" />
    ) : cls === 'improvement' ? (
      <TrendingUp className="w-3 h-3 text-praxis-green flex-shrink-0" />
    ) : (
      <Minus className="w-3 h-3 text-muted-foreground flex-shrink-0" />
    );

  return (
    <div className="space-y-3">
      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider pb-1 border-b border-gi-border-subtle">
        Policy-Aware Diff: {fromPassport.displayName} → {toPassport.displayName}
      </div>

      <div className="flex items-center gap-4 text-[11px] font-mono">
        <span className="text-praxis-red">{regressions.length} regression{regressions.length !== 1 ? 's' : ''}</span>
        <span className="text-praxis-green">{improvements.length} improvement{improvements.length !== 1 ? 's' : ''}</span>
        <span className="text-muted-foreground">{neutral.length} neutral</span>
      </div>

      {regressions.length > 0 && (
        <div className="space-y-1">
          <div className="text-[9px] font-mono text-praxis-red uppercase tracking-wider">Regressions — acknowledgement required</div>
          {regressions.map((e) => (
            <label key={e.field} className="flex items-start gap-2 py-1.5 px-2 rounded border border-praxis-red/20 bg-praxis-red/5 cursor-pointer hover:bg-praxis-red/10 transition-colors">
              <input
                type="checkbox"
                checked={acknowledged.has(e.field)}
                onChange={() => toggle(e.field)}
                className="mt-0.5 accent-red-500 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <DiffIcon cls="regression" />
                  <span className="text-[10px] font-mono text-gi-text-primary truncate">{e.description}</span>
                </div>
                <div className="text-[9px] text-muted-foreground mt-0.5">{e.section} · {e.field}</div>
              </div>
            </label>
          ))}
        </div>
      )}

      {improvements.length > 0 && (
        <div className="space-y-1">
          <div className="text-[9px] font-mono text-praxis-green uppercase tracking-wider">Improvements</div>
          {improvements.map((e) => (
            <div key={e.field} className="flex items-start gap-2 py-1.5 px-2 rounded border border-praxis-green/20 bg-praxis-green/5">
              <DiffIcon cls="improvement" />
              <div>
                <div className="text-[10px] font-mono text-gi-text-primary">{e.description}</div>
                <div className="text-[9px] text-muted-foreground">{e.section}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {neutral.length > 0 && (
        <div className="space-y-1">
          <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Neutral</div>
          {neutral.map((e) => (
            <div key={e.field} className="flex items-start gap-2 py-1.5 px-2 rounded border border-gi-border-subtle">
              <DiffIcon cls="neutral" />
              <div className="text-[10px] font-mono text-muted-foreground">{e.description}</div>
            </div>
          ))}
        </div>
      )}

      <div className={`rounded border px-3 py-2 text-[11px] font-mono flex items-center gap-2 ${allAcknowledged ? 'border-praxis-green/30 bg-praxis-green/5 text-praxis-green' : 'border-praxis-amber/30 bg-praxis-amber/5 text-praxis-amber'}`}>
        {allAcknowledged ? (
          <><CheckCircle className="w-3 h-3" /> All regressions acknowledged — approval enabled</>
        ) : (
          <><AlertTriangle className="w-3 h-3" /> Acknowledge {regressions.length - acknowledged.size} regression(s) to enable approval</>
        )}
      </div>
    </div>
  );
}

function EvalGatesPanel({ passport }: { passport: PassportEntry }) {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{ passed: boolean; details: string[] } | null>(null);
  const gates = passport.evalGates;

  async function handleCheck() {
    setChecking(true);
    await new Promise((r) => setTimeout(r, 1400));
    const passed = passport.state === 'active' || passport.evalGates?.evalRunId != null;
    setResult({
      passed,
      details: passed
        ? [
            `Golden-set pass rate 91.3% ≥ ${Math.round((gates?.minGoldenSetPassRate ?? 0.85) * 100)}% ✓`,
            `P95 latency 2847ms ≤ ${gates?.maxP95LatencyMs ?? 5000}ms ✓`,
            `Cost per call $0.011 ≤ $${gates?.maxCostPerCallUsd ?? 0.50} ✓`,
          ]
        : [
            `Golden-set pass rate 78.2% < ${Math.round((gates?.minGoldenSetPassRate ?? 0.85) * 100)}% required ✗`,
            `P95 latency 2847ms ≤ ${gates?.maxP95LatencyMs ?? 5000}ms ✓`,
            `Cost per call $0.011 ≤ $${gates?.maxCostPerCallUsd ?? 0.50} ✓`,
          ],
    });
    setChecking(false);
  }

  if (!gates) {
    return (
      <div className="space-y-2">
        <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2 pb-1 border-b border-gi-border-subtle">
          Self-Attesting Eval Gates
        </div>
        <div className="text-[11px] text-muted-foreground flex items-center gap-2">
          <Info className="w-3 h-3" />
          No eval gates declared for this passport. Default platform thresholds apply.
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Min Pass Rate', value: '70%' },
            { label: 'Max P95 Latency', value: '10,000ms' },
            { label: 'Max Cost / Call', value: '$1.00' },
          ].map((g) => (
            <div key={g.label} className="rounded border border-gi-border-subtle bg-gi-bg-elevated px-2 py-1.5">
              <div className="text-[9px] text-muted-foreground font-mono">{g.label}</div>
              <div className="text-[11px] font-mono text-gi-text-primary">{g.value}</div>
              <div className="text-[9px] text-muted-foreground">default</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2 pb-1 border-b border-gi-border-subtle">
        Self-Attesting Eval Gates
      </div>
      <p className="text-[11px] text-muted-foreground">
        This passport cannot transition <span className="font-mono">draft → active</span> until all declared thresholds are cleared by a recorded eval run.
      </p>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded border border-gi-border-subtle bg-gi-bg-elevated px-2 py-1.5">
          <div className="text-[9px] text-muted-foreground font-mono">Min Pass Rate</div>
          <div className="text-[11px] font-mono text-gi-text-primary">{Math.round(gates.minGoldenSetPassRate * 100)}%</div>
        </div>
        <div className="rounded border border-gi-border-subtle bg-gi-bg-elevated px-2 py-1.5">
          <div className="text-[9px] text-muted-foreground font-mono">Max P95 Latency</div>
          <div className="text-[11px] font-mono text-gi-text-primary">{gates.maxP95LatencyMs.toLocaleString()}ms</div>
        </div>
        <div className="rounded border border-gi-border-subtle bg-gi-bg-elevated px-2 py-1.5">
          <div className="text-[9px] text-muted-foreground font-mono">Max Cost / Call</div>
          <div className="text-[11px] font-mono text-gi-text-primary">${gates.maxCostPerCallUsd}</div>
        </div>
      </div>

      {gates.evalRunId ? (
        <div className="rounded border border-praxis-green/30 bg-praxis-green/5 px-3 py-2 text-[11px] font-mono text-praxis-green flex items-center gap-2">
          <ShieldCheck className="w-3 h-3" />
          Passing run pinned: {gates.evalRunId}
        </div>
      ) : (
        <div className="rounded border border-praxis-amber/30 bg-praxis-amber/5 px-3 py-2 text-[11px] font-mono text-praxis-amber flex items-center gap-2">
          <AlertTriangle className="w-3 h-3" />
          No passing eval run pinned — activation blocked
        </div>
      )}

      <button
        onClick={handleCheck}
        disabled={checking}
        className="inline-flex items-center gap-1.5 text-[11px] font-mono px-3 py-1.5 rounded border border-praxis-teal/40 text-praxis-teal hover:bg-praxis-teal/10 disabled:opacity-50 transition-colors"
      >
        {checking ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Star className="w-3 h-3" />}
        {checking ? 'Running eval gates…' : 'Run Eval Gate Check'}
      </button>

      {result && (
        <div className={`rounded border px-3 py-2 space-y-1 ${result.passed ? 'border-praxis-green/30 bg-praxis-green/5' : 'border-praxis-red/30 bg-praxis-red/5'}`}>
          <div className={`text-[11px] font-mono flex items-center gap-2 ${result.passed ? 'text-praxis-green' : 'text-praxis-red'}`}>
            {result.passed ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            {result.passed ? 'All gates passed — activation unlocked' : 'Gate check failed — activation blocked'}
          </div>
          {result.details.map((d, i) => (
            <div key={i} className="text-[10px] font-mono text-muted-foreground pl-5">{d}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function LensesPanel({ passport }: { passport: PassportEntry }) {
  const [showAdd, setShowAdd] = useState(false);
  const [lenses, setLenses] = useState<PolicyLens[]>(passport.lenses ?? []);
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    setAdding(true);
    await new Promise((r) => setTimeout(r, 800));
    const newLens: PolicyLens = {
      lensId: `lens_${Math.random().toString(36).slice(2, 8)}`,
      displayName: 'New Policy Lens',
      tenantId: 999,
      passportId: passport.id,
      envelope: { piiHandling: 'blocked', maxBudgetUsdPerCall: 0.10 },
      createdAt: new Date().toISOString(),
    };
    setLenses((prev) => [...prev, newLens]);
    setAdding(false);
    setShowAdd(false);
  }

  function handleRemove(lensId: string) {
    setLenses((prev) => prev.filter((l) => l.lensId !== lensId));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider pb-1 border-b border-gi-border-subtle flex-1">
          Tenant Policy Lenses
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="ml-3 text-[10px] font-mono text-praxis-teal hover:bg-praxis-teal/10 px-2 py-0.5 rounded border border-praxis-teal/30 transition-colors flex items-center gap-1"
        >
          <Plus className="w-2.5 h-2.5" />
          Attach Lens
        </button>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Zero-fork overlays applied at request time without creating a new passport. Lenses may only <strong>tighten</strong> the base envelope — loosening is blocked.
      </p>

      {showAdd && (
        <div className="rounded border border-praxis-teal/30 bg-praxis-teal/5 px-3 py-3 space-y-3">
          <div className="text-[10px] font-mono text-praxis-teal">New Policy Lens</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'PII Handling', value: 'blocked ← redacted (tighten)' },
              { label: 'Max Budget', value: '$0.10 ← $0.50 (tighten)' },
              { label: 'Jurisdiction', value: 'EU only ← * (restrict)' },
              { label: 'Autonomy Tier', value: 'read_only ← supervised (tighten)' },
            ].map((f) => (
              <div key={f.label} className="text-[10px] font-mono">
                <span className="text-muted-foreground">{f.label}:</span>{' '}
                <span className="text-gi-text-primary">{f.value}</span>
              </div>
            ))}
          </div>
          <button
            onClick={handleAdd}
            disabled={adding}
            className="inline-flex items-center gap-1.5 text-[11px] font-mono px-3 py-1.5 rounded border border-praxis-teal/40 text-praxis-teal hover:bg-praxis-teal/10 disabled:opacity-50 transition-colors"
          >
            {adding ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Lock className="w-3 h-3" />}
            {adding ? 'Attaching…' : 'Attach & Audit-Log'}
          </button>
        </div>
      )}

      {lenses.length === 0 ? (
        <div className="text-[11px] text-muted-foreground">No lenses attached. Base passport envelope applies globally.</div>
      ) : (
        <div className="space-y-2">
          {lenses.map((lens) => (
            <div key={lens.lensId} className="rounded border border-gi-border-subtle bg-gi-bg-elevated px-3 py-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-semibold text-gi-text-primary">{lens.displayName}</div>
                <button
                  onClick={() => handleRemove(lens.lensId)}
                  className="text-muted-foreground hover:text-praxis-red transition-colors"
                >
                  <XCircle className="w-3 h-3" />
                </button>
              </div>
              <div className="text-[9px] font-mono text-muted-foreground">{lens.lensId} · Tenant {lens.tenantId}</div>
              <div className="flex flex-wrap gap-1.5">
                {lens.envelope.piiHandling && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-praxis-amber/30 text-praxis-amber bg-praxis-amber/5">
                    PII: {lens.envelope.piiHandling}
                  </span>
                )}
                {lens.envelope.maxBudgetUsdPerCall != null && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-gi-border-subtle text-muted-foreground">
                    max ${lens.envelope.maxBudgetUsdPerCall}/call
                  </span>
                )}
                {lens.envelope.jurisdictions?.map((j) => (
                  <span key={j} className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-blue-500/30 text-blue-400 bg-blue-500/5">{j}</span>
                ))}
                {lens.envelope.autonomyTier && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-praxis-teal/30 text-praxis-teal bg-praxis-teal/5">
                    {lens.envelope.autonomyTier}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type GraphNodeType = 'passport' | 'eval' | 'prompt' | 'dataset';

interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  sub?: string;
  x: number;
  y: number;
}

interface GraphEdge {
  from: string;
  to: string;
  label?: string;
}

function ProvenanceGraph({ passports }: { passports: PassportEntry[] }) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const nodes: GraphNode[] = [
    { id: 'mpf_legacy_gpt4', type: 'passport', label: 'GPT-4o v0', sub: 'Deprecated', x: 80, y: 60 },
    { id: 'mpf_4a7b9c2d1e3f', type: 'passport', label: 'GPT-4o v1', sub: 'Active · Drifting', x: 280, y: 60 },
    { id: 'mpf_8e1f2a3b4c5d', type: 'passport', label: 'GPT-4o Mini', sub: 'Active', x: 480, y: 120 },
    { id: 'mpf_2b3c4d5e6f7a', type: 'passport', label: 'Gemini Vision', sub: 'Proposed', x: 280, y: 200 },
    { id: 'mpf_claude_v1', type: 'passport', label: 'Claude v1', sub: 'Deprecated', x: 80, y: 200 },
    { id: 'mpf_c3d4e5f6a7b8', type: 'passport', label: 'Claude 4.6', sub: 'Active', x: 280, y: 310 },
    { id: 'eval_run_20260501_001', type: 'eval', label: 'Eval Run', sub: 'Golden-set v2 · 91.3%', x: 480, y: 20 },
    { id: 'prompt_registry:triage-v3', type: 'prompt', label: 'Triage Prompt v3', sub: 'Pinned', x: 520, y: 200 },
    { id: 'prompt_registry:reasoning-v5', type: 'prompt', label: 'Reasoning v5', sub: 'Pinned', x: 520, y: 280 },
    { id: 'sha256:data_golden_set_v2', type: 'dataset', label: 'Golden Set v2', sub: 'SHA-256 anchored', x: 480, y: 360 },
  ];

  const edges: GraphEdge[] = [
    { from: 'mpf_legacy_gpt4', to: 'mpf_4a7b9c2d1e3f', label: 'fork' },
    { from: 'mpf_4a7b9c2d1e3f', to: 'mpf_2b3c4d5e6f7a', label: 'fork' },
    { from: 'mpf_claude_v1', to: 'mpf_c3d4e5f6a7b8', label: 'fork' },
    { from: 'mpf_4a7b9c2d1e3f', to: 'eval_run_20260501_001', label: 'eval' },
    { from: 'mpf_4a7b9c2d1e3f', to: 'prompt_registry:triage-v3', label: 'pin' },
    { from: 'mpf_4a7b9c2d1e3f', to: 'prompt_registry:reasoning-v5', label: 'pin' },
    { from: 'mpf_c3d4e5f6a7b8', to: 'prompt_registry:reasoning-v5', label: 'pin' },
    { from: 'mpf_4a7b9c2d1e3f', to: 'sha256:data_golden_set_v2', label: 'data' },
    { from: 'mpf_4a7b9c2d1e3f', to: 'mpf_8e1f2a3b4c5d', label: 'downgrade' },
  ];

  const nodeColors: Record<GraphNodeType, string> = {
    passport: 'border-praxis-teal/50 bg-praxis-teal/10 text-praxis-teal',
    eval: 'border-praxis-green/50 bg-praxis-green/10 text-praxis-green',
    prompt: 'border-purple-500/50 bg-purple-500/10 text-purple-400',
    dataset: 'border-praxis-amber/50 bg-praxis-amber/10 text-praxis-amber',
  };

  const nodeIcons: Record<GraphNodeType, React.ComponentType<{ className?: string }>> = {
    passport: FileCheck,
    eval: Star,
    prompt: Package,
    dataset: Layers,
  };

  const W = 620;
  const H = 420;

  return (
    <div className="space-y-3 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          Provenance Graph — Navigable Passport Lineage
        </div>
        <div className="flex items-center gap-3">
          {([['passport', 'Passport'], ['eval', 'Eval Run'], ['prompt', 'Prompt Pin'], ['dataset', 'Dataset']] as [GraphNodeType, string][]).map(([t, label]) => {
            const Icon = nodeIcons[t];
            return (
              <div key={t} className="flex items-center gap-1 text-[9px] font-mono text-muted-foreground">
                <Icon className={`w-2.5 h-2.5 ${t === 'passport' ? 'text-praxis-teal' : t === 'eval' ? 'text-praxis-green' : t === 'prompt' ? 'text-purple-400' : 'text-praxis-amber'}`} />
                {label}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 rounded border border-gi-border-subtle bg-gi-bg-elevated overflow-hidden relative" style={{ minHeight: 420 }}>
        <svg width={W} height={H} className="absolute inset-0">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" className="fill-current text-gi-border-subtle" fill="#334155" />
            </marker>
          </defs>
          {edges.map((edge, i) => {
            const from = nodes.find((n) => n.id === edge.from);
            const to = nodes.find((n) => n.id === edge.to);
            if (!from || !to) return null;
            const fx = from.x + 60;
            const fy = from.y + 18;
            const tx = to.x;
            const ty = to.y + 18;
            const mx = (fx + tx) / 2;
            const my = (fy + ty) / 2;
            return (
              <g key={i}>
                <path
                  d={`M ${fx} ${fy} Q ${mx} ${fy} ${tx} ${ty}`}
                  fill="none"
                  stroke="#334155"
                  strokeWidth="1"
                  strokeDasharray={edge.label === 'downgrade' ? '4 2' : undefined}
                  markerEnd="url(#arrow)"
                />
                <text x={mx} y={my - 4} textAnchor="middle" fontSize="7" fill="#64748b" fontFamily="monospace">
                  {edge.label}
                </text>
              </g>
            );
          })}
        </svg>

        {nodes.map((node) => {
          const Icon = nodeIcons[node.type];
          const passport = node.type === 'passport' ? passports.find((p) => p.id === node.id) : null;
          return (
            <button
              key={node.id}
              onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
              className={`absolute rounded border text-left transition-all hover:scale-105 ${nodeColors[node.type]} ${selectedNode === node.id ? 'ring-2 ring-praxis-teal shadow-lg' : ''}`}
              style={{ left: node.x, top: node.y, width: 120, padding: '4px 8px' }}
            >
              <div className="flex items-center gap-1">
                <Icon className="w-2.5 h-2.5 flex-shrink-0" />
                <span className="text-[9px] font-mono font-semibold truncate">{node.label}</span>
              </div>
              <div className="text-[8px] font-mono text-muted-foreground truncate mt-0.5">{node.sub}</div>
              {passport?.isDrifting && (
                <span className="text-[8px] font-mono text-orange-400">⚡ drifting</span>
              )}
            </button>
          );
        })}
      </div>

      {selectedNode && (
        <div className="rounded border border-gi-border-subtle bg-gi-bg-elevated px-3 py-2">
          <div className="text-[10px] font-mono text-muted-foreground">{selectedNode}</div>
          <div className="text-[11px] text-gi-text-primary mt-0.5">
            {nodes.find((n) => n.id === selectedNode)?.label}
          </div>
          <button className="text-[10px] font-mono text-praxis-teal hover:underline mt-1 inline-flex items-center gap-1">
            <ExternalLink className="w-2.5 h-2.5" />
            Open detail
          </button>
        </div>
      )}
    </div>
  );
}

function PassportDrawer({
  passport,
  onClose,
  allPassports,
}: {
  passport: PassportEntry;
  onClose: () => void;
  allPassports: PassportEntry[];
}) {
  const [activeSection, setActiveSection] = useState<'overview' | 'proof' | 'drift' | 'lenses' | 'eval-gates' | 'diff'>('overview');
  const parentPassport = allPassports.find((p) => p.id === passport.parentPassportId);

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'proof', label: 'Proof Bundles' },
    { id: 'drift', label: 'Drift' + (passport.isDrifting ? ' ⚡' : '') },
    { id: 'lenses', label: 'Lenses' + (passport.lenses?.length ? ` (${passport.lenses.length})` : '') },
    { id: 'eval-gates', label: 'Eval Gates' },
    ...(parentPassport ? [{ id: 'diff', label: 'Policy Diff' }] : []),
  ] as const;

  return (
    <div className="fixed inset-y-0 right-0 w-[520px] bg-gi-bg-base border-l border-gi-border-subtle z-40 flex flex-col shadow-2xl">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gi-border-subtle flex-shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gi-text-primary">{passport.displayName}</span>
            <DriftBadge passportId={passport.id} />
          </div>
          <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{passport.id}</div>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-gi-text-primary transition-colors">
          <XCircle className="w-4 h-4" />
        </button>
      </div>

      <div className="flex border-b border-gi-border-subtle flex-shrink-0 overflow-x-auto">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id as typeof activeSection)}
            className={`px-3 py-2 text-[10px] font-mono whitespace-nowrap border-b-2 transition-colors ${activeSection === s.id ? 'border-praxis-teal text-praxis-teal' : 'border-transparent text-muted-foreground hover:text-gi-text-primary'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {activeSection === 'overview' && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 flex-wrap">
              <StateChip state={passport.state} />
              <span className={`text-[10px] font-mono ${AUTONOMY_COLORS[passport.autonomyTier]}`}>
                {passport.autonomyTier.replace('_', ' ').toUpperCase()}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground border border-gi-border-subtle px-2 py-0.5 rounded">
                {passport.quantTier}
              </span>
              <DriftBadge passportId={passport.id} />
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
              {passport.evalRunId && <Row label="Eval Run ID" value={passport.evalRunId} mono />}
              {passport.parentPassportId && <Row label="Parent Passport" value={passport.parentPassportId} mono />}
              {(passport.promptPins?.length ?? 0) > 0 && (
                <div className="flex items-start justify-between py-0.5">
                  <span className="text-[11px] text-muted-foreground">Prompt Pins</span>
                  <div className="text-right space-y-0.5">
                    {passport.promptPins!.map((p) => <div key={p} className="text-[10px] font-mono text-gi-text-primary">{p}</div>)}
                  </div>
                </div>
              )}
              {(passport.datasetHashes?.length ?? 0) > 0 && (
                <div className="flex items-start justify-between py-0.5">
                  <span className="text-[11px] text-muted-foreground">Dataset Hashes</span>
                  <div className="text-right space-y-0.5">
                    {passport.datasetHashes!.map((h) => <div key={h} className="text-[10px] font-mono text-gi-text-primary">{h.slice(0, 20)}…</div>)}
                  </div>
                </div>
              )}
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
        )}

        {activeSection === 'proof' && <ProofBundlePanel passport={passport} />}
        {activeSection === 'drift' && <DriftPanel passport={passport} />}
        {activeSection === 'lenses' && <LensesPanel passport={passport} />}
        {activeSection === 'eval-gates' && <EvalGatesPanel passport={passport} />}
        {activeSection === 'diff' && parentPassport && (
          <PolicyDiffPanel fromPassport={parentPassport} toPassport={passport} />
        )}
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
        <div className="flex items-center gap-2">
          <div>
            <div className="text-[12px] font-medium text-gi-text-primary">{passport.displayName}</div>
            <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{passport.id}</div>
          </div>
          <DriftBadge passportId={passport.id} />
        </div>
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
        <div className="flex items-center gap-1.5">
          <VerifyButton passport={passport} />
          {(passport.lenses?.length ?? 0) > 0 && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-purple-500/30 text-purple-400 bg-purple-500/5">
              {passport.lenses!.length}L
            </span>
          )}
          {passport.evalGates && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-praxis-teal/30 text-praxis-teal bg-praxis-teal/5" title="Eval gates declared">
              <Star className="w-2 h-2 inline" />
            </span>
          )}
        </div>
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
  const [activeTab, setActiveTab] = useState<RegistryTab>('list');

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

  const driftingCount = DEMO_PASSPORTS.filter((p) => p.isDrifting).length;

  const tabs: Array<{ id: RegistryTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'list', label: 'Registry', icon: FileCheck },
    { id: 'provenance', label: 'Provenance Graph', icon: GitBranch },
    { id: 'lenses', label: 'Policy Lenses', icon: Sliders },
    { id: 'eval-gates', label: 'Eval Gates', icon: Star },
  ];

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
              {driftingCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded border border-orange-500/40 bg-orange-500/10 text-orange-400 animate-pulse">
                  <Activity className="w-2 h-2" />
                  {driftingCount} DRIFTING
                </span>
              )}
            </div>
            <p className="text-[12px] text-muted-foreground mt-1">
              Signed model identity and governance artifacts — self-policing contracts with proof bundles, drift detection, and tenant policy lenses.
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

        <div className="mt-4 grid grid-cols-5 gap-3">
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
          <div className="rounded border border-orange-500/30 bg-orange-500/5 px-3 py-2">
            <div className="text-[10px] font-mono text-orange-400 flex items-center gap-1">
              <Activity className="w-2.5 h-2.5" />
              DRIFTING
            </div>
            <div className="text-xl font-bold text-orange-400 mt-1">{driftingCount}</div>
          </div>
        </div>
      </div>

      <div className="flex border-b border-gi-border-subtle flex-shrink-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-[11px] font-mono flex items-center gap-1.5 border-b-2 transition-colors ${activeTab === tab.id ? 'border-praxis-teal text-praxis-teal' : 'border-transparent text-muted-foreground hover:text-gi-text-primary'}`}
            >
              <Icon className="w-3 h-3" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'list' && (
        <>
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
        </>
      )}

      {activeTab === 'provenance' && (
        <div className="flex-1 overflow-auto px-6 py-4">
          <ProvenanceGraph passports={DEMO_PASSPORTS} />
        </div>
      )}

      {activeTab === 'lenses' && (
        <div className="flex-1 overflow-auto px-6 py-4">
          <div className="space-y-4">
            <div>
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-3">
                All Policy Lenses — Across Active Passports
              </div>
              <p className="text-[12px] text-muted-foreground mb-4">
                Zero-fork tenant overlays applied at request time. Lenses may only tighten the base passport envelope.
                Merge semantics: autonomy ↓ only, PII ↓ only, domains = intersection, budget = min, jurisdictions = intersection, escalation rules = union.
              </p>
            </div>
            {DEMO_PASSPORTS.filter((p) => (p.lenses?.length ?? 0) > 0).map((passport) => (
              <div key={passport.id} className="rounded border border-gi-border-subtle bg-gi-bg-elevated p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-3.5 h-3.5 text-praxis-teal" />
                  <span className="text-[12px] font-medium text-gi-text-primary">{passport.displayName}</span>
                  <StateChip state={passport.state} />
                </div>
                {passport.lenses!.map((lens) => (
                  <div key={lens.lensId} className="ml-4 rounded border border-purple-500/20 bg-purple-500/5 px-3 py-2 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-purple-400">{lens.displayName}</span>
                      <span className="text-[9px] font-mono text-muted-foreground">Tenant {lens.tenantId}</span>
                    </div>
                    <div className="text-[9px] font-mono text-muted-foreground">{lens.lensId}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {lens.envelope.piiHandling && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-praxis-amber/30 text-praxis-amber bg-praxis-amber/5">
                          PII: {lens.envelope.piiHandling}
                        </span>
                      )}
                      {lens.envelope.maxBudgetUsdPerCall != null && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-gi-border-subtle text-muted-foreground">
                          max ${lens.envelope.maxBudgetUsdPerCall}/call
                        </span>
                      )}
                      {lens.envelope.jurisdictions?.map((j) => (
                        <span key={j} className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-blue-500/30 text-blue-400">{j}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
            {DEMO_PASSPORTS.filter((p) => (p.lenses?.length ?? 0) > 0).length === 0 && (
              <div className="text-[12px] text-muted-foreground">No lenses attached to any passport yet.</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'eval-gates' && (
        <div className="flex-1 overflow-auto px-6 py-4">
          <div className="space-y-4">
            <div>
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-3">
                Self-Attesting Eval Gates — All Passports
              </div>
              <p className="text-[12px] text-muted-foreground mb-4">
                Passports that declare eval gates cannot transition <code className="font-mono text-xs bg-gi-bg-elevated px-1 rounded">draft → active</code> until a passing eval run is pinned in their provenance. The gate checks golden-set pass rate, P95 latency, and cost per call.
              </p>
            </div>
            {DEMO_PASSPORTS.map((passport) => (
              <div key={passport.id} className="rounded border border-gi-border-subtle bg-gi-bg-elevated p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-3.5 h-3.5 text-praxis-teal" />
                    <span className="text-[12px] font-medium text-gi-text-primary">{passport.displayName}</span>
                    <StateChip state={passport.state} />
                  </div>
                  {passport.evalGates ? (
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-praxis-teal/30 text-praxis-teal bg-praxis-teal/5">
                      GATES DECLARED
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-gi-border-subtle text-muted-foreground">
                      PLATFORM DEFAULTS
                    </span>
                  )}
                </div>
                {passport.evalGates ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-[10px] font-mono">
                        <span className="text-muted-foreground">Min Pass Rate: </span>
                        <span className="text-gi-text-primary">{Math.round(passport.evalGates.minGoldenSetPassRate * 100)}%</span>
                      </div>
                      <div className="text-[10px] font-mono">
                        <span className="text-muted-foreground">Max P95: </span>
                        <span className="text-gi-text-primary">{passport.evalGates.maxP95LatencyMs.toLocaleString()}ms</span>
                      </div>
                      <div className="text-[10px] font-mono">
                        <span className="text-muted-foreground">Max Cost: </span>
                        <span className="text-gi-text-primary">${passport.evalGates.maxCostPerCallUsd}/call</span>
                      </div>
                    </div>
                    {passport.evalGates.evalRunId ? (
                      <div className="flex items-center gap-2 text-[10px] font-mono text-praxis-green">
                        <CheckCircle className="w-3 h-3" />
                        Passing run pinned: {passport.evalGates.evalRunId}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-[10px] font-mono text-praxis-amber">
                        <AlertTriangle className="w-3 h-3" />
                        No passing eval run pinned — <code>draft → active</code> blocked
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[10px] font-mono text-muted-foreground">
                    Platform defaults: pass rate ≥ 70%, P95 ≤ 10,000ms, cost ≤ $1.00/call
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-6 py-3 border-t border-gi-border-subtle flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
          <span>{filtered.length} passport{filtered.length !== 1 ? 's' : ''}</span>
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-praxis-teal" />
            Avg eval: {Math.round(avgEval * 100)}%
          </span>
          <span className="flex items-center gap-1">
            <Link2 className="w-3 h-3 text-purple-400" />
            {DEMO_PASSPORTS.reduce((s, p) => s + (p.lenses?.length ?? 0), 0)} lenses active
          </span>
        </div>
        <div className="text-[10px] font-mono text-muted-foreground">
          MPF v1.0 · Ed25519 · SHA-256 · Proof Bundles · Drift Detection · Policy Lenses · Eval Gates
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
            allPassports={DEMO_PASSPORTS}
          />
        </>
      )}
    </div>
  );
}
