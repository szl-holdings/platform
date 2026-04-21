import { useStandardQuery } from '@szl-holdings/api-client-react';

import {
  Activity,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Clock,
  Copy,
  Eye,
  GitBranch,
  GitMerge,
  Globe,
  Layers,
  Lock,
  Network,
  RefreshCw,
  Send,
  Shield,
  X,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';

type TwinState = 'stable' | 'degraded' | 'awaiting_approval' | 'offline';
type Domain = 'aegis' | 'terra' | 'vessels' | 'alloy' | 'prism' | 'lyte';

interface WorldlineTwin {
  id: string;
  name: string;
  domain: Domain;
  state: TwinState;
  driftScore: number;
  lastSync: string;
  proofState: 'verified' | 'pending' | 'unverified';
  pendingActions: number;
  summary: string;
}

interface Worldline {
  id: string;
  label: string;
  description: string;
  status: 'active' | 'simulation' | 'archived';
  twins: WorldlineTwin[];
  createdAt: string;
  originDomain: Domain;
  branchReason?: string;
}

const DOMAIN_CONFIG: Record<
  Domain,
  { label: string; color: string; icon: typeof Globe; appPath: string }
> = {
  aegis: { label: 'Aegis — Defense', color: '#ef4444', icon: Shield, appPath: '/aegis' },
  terra: { label: 'Terra — Real Estate', color: '#10b981', icon: Globe, appPath: '/terra' },
  vessels: { label: 'Vessels — Maritime', color: '#06b6d4', icon: Network, appPath: '/vessels' },
  alloy: { label: 'FORGE — Execution', color: '#4B8BDB', icon: Zap, appPath: '/command' },
  prism: { label: 'Prism — Counsel', color: '#f59e0b', icon: Globe, appPath: '/command' },
  lyte: { label: 'Lyte — AIOps', color: '#d4a054', icon: Activity, appPath: '/command' },
};

const STATE_CONFIG: Record<
  TwinState,
  { color: string; label: string; bg: string; border: string }
> = {
  stable: {
    color: '#10b981',
    label: 'Stable',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.2)',
  },
  degraded: {
    color: '#f59e0b',
    label: 'Degraded',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.2)',
  },
  awaiting_approval: {
    color: '#8b7ac8',
    label: 'Awaiting Approval',
    bg: 'rgba(139,122,200,0.08)',
    border: 'rgba(139,122,200,0.2)',
  },
  offline: {
    color: '#ef4444',
    label: 'Offline',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.2)',
  },
};

const DEMO_WORLDLINES: Worldline[] = [
  {
    id: 'WL-ALPHA',
    label: 'WL-ALPHA',
    description: 'Primary canonical worldline — approved baseline state for all domains',
    status: 'active',
    originDomain: 'alloy',
    createdAt: 'Mar 1, 2026',
    twins: [
      {
        id: 'tw-terra-001',
        name: 'Terra Property Fabric',
        domain: 'terra',
        state: 'stable',
        driftScore: 4,
        lastSync: '45s ago',
        proofState: 'verified',
        pendingActions: 0,
        summary: 'All property twins synced, portfolio valuation current',
      },
      {
        id: 'tw-vessels-001',
        name: 'Vessels Fleet Twin',
        domain: 'vessels',
        state: 'stable',
        driftScore: 7,
        lastSync: '2m ago',
        proofState: 'verified',
        pendingActions: 0,
        summary: '14 vessels tracked, AIS data nominal',
      },
      {
        id: 'tw-alloy-001',
        name: 'Alloy Execution Fabric',
        domain: 'alloy',
        state: 'stable',
        driftScore: 2,
        lastSync: '30s ago',
        proofState: 'verified',
        pendingActions: 0,
        summary: '247 workflows active, proof chain intact',
      },
      {
        id: 'tw-prism-001',
        name: 'Prism Counsel Twin',
        domain: 'prism',
        state: 'stable',
        driftScore: 3,
        lastSync: '1m ago',
        proofState: 'verified',
        pendingActions: 0,
        summary: 'Legal entity registry current, 2 NDAs in flight',
      },
    ],
  },
  {
    id: 'WL-BETA',
    label: 'WL-BETA',
    description: 'Active incident branch — security posture drift under investigation',
    status: 'active',
    originDomain: 'aegis',
    createdAt: 'Apr 14, 2026',
    branchReason: 'IAM drift detected in AWS VPC — branched for controlled investigation',
    twins: [
      {
        id: 'tw-aeg-001',
        name: 'Aegis Posture Twin',
        domain: 'aegis',
        state: 'degraded',
        driftScore: 28,
        lastSync: '3m ago',
        proofState: 'pending',
        pendingActions: 3,
        summary: '3 active incidents in AWS VPC, K8s app tier drifted',
      },
      {
        id: 'tw-lyte-001',
        name: 'Lyte AIOps Twin',
        domain: 'lyte',
        state: 'degraded',
        driftScore: 21,
        lastSync: '6m ago',
        proofState: 'pending',
        pendingActions: 4,
        summary: '4 SLO breaches active, 1 requires human escalation',
      },
    ],
  },
  {
    id: 'WL-GAMMA',
    label: 'WL-GAMMA',
    description: 'OT/ICS approval branch — pending CISO sign-off before reconciliation',
    status: 'active',
    originDomain: 'aegis',
    createdAt: 'Apr 16, 2026',
    branchReason: 'PLC firmware delta detected — isolated for controlled CISO review',
    twins: [
      {
        id: 'tw-aeg-002',
        name: 'Aegis OT/ICS Twin',
        domain: 'aegis',
        state: 'awaiting_approval',
        driftScore: 18,
        lastSync: '11m ago',
        proofState: 'pending',
        pendingActions: 1,
        summary: 'PLC firmware delta awaiting CISO approval',
      },
    ],
  },
  {
    id: 'WL-DELTA',
    label: 'WL-DELTA',
    description: 'Cargo manifest variance branch — awaiting port authority confirmation',
    status: 'active',
    originDomain: 'vessels',
    createdAt: 'Apr 17, 2026',
    branchReason: 'Cargo manifest variance on VES-MV-047 — branched pending port authority review',
    twins: [
      {
        id: 'tw-vessels-002',
        name: 'Vessels Cargo Twin',
        domain: 'vessels',
        state: 'awaiting_approval',
        driftScore: 12,
        lastSync: '8m ago',
        proofState: 'pending',
        pendingActions: 2,
        summary: 'Cargo manifest variance on VES-MV-047',
      },
    ],
  },
  {
    id: 'WL-SIM-001',
    label: 'WL-SIM-001',
    description: 'Valuation stress simulation — Terra reroute scenario for Q3 stress test',
    status: 'simulation',
    originDomain: 'terra',
    createdAt: 'Apr 10, 2026',
    branchReason: 'Scenario forge: +150bps rate shock applied to Williamsburg submarket',
    twins: [
      {
        id: 'tw-terra-sim-001',
        name: 'Terra Stress Scenario',
        domain: 'terra',
        state: 'stable',
        driftScore: 0,
        lastSync: '2d ago',
        proofState: 'verified',
        pendingActions: 0,
        summary: 'Scenario result: 12% cap rate expansion, 2 properties enter distress',
      },
    ],
  },
];

function WorldlineStatusBadge({ status }: { status: Worldline['status'] }) {
  const cfg = {
    active: {
      color: '#10b981',
      label: 'Active',
      bg: 'rgba(16,185,129,0.08)',
      border: 'rgba(16,185,129,0.2)',
    },
    simulation: {
      color: '#8b7ac8',
      label: 'Simulation',
      bg: 'rgba(139,122,200,0.08)',
      border: 'rgba(139,122,200,0.2)',
    },
    archived: {
      color: '#6b7280',
      label: 'Archived',
      bg: 'rgba(107,114,128,0.08)',
      border: 'rgba(107,114,128,0.2)',
    },
  }[status];
  return (
    <span
      className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border font-mono"
      style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
    >
      {cfg.label}
    </span>
  );
}

function DriftBadge({ score }: { score: number }) {
  const color =
    score === 0 ? '#6b7280' : score <= 5 ? '#10b981' : score <= 15 ? '#f59e0b' : '#ef4444';
  return (
    <span
      className="text-[8px] font-bold font-mono px-1 py-0.5 rounded"
      style={{ color, background: `${color}15`, border: `1px solid ${color}25` }}
    >
      Δ{score}%
    </span>
  );
}

interface ApiScenarioBranch {
  id: string;
  branchName: string;
  branchDescription?: string | null;
  status: string;
  twinId?: string | null;
  entityId?: string | null;
  twinCategory?: string | null;
  parameters?: Record<string, unknown> | null;
  createdAt?: string | null;
}

function useBranches() {
  return useStandardQuery<{ branches: ApiScenarioBranch[]; count: number }>({
    queryKey: ['atlas-worldline-branches'],
    queryFn: () =>
      fetch('/api/atlas/spatial/branches?limit=50')
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then((r) => r.data ?? r),
    staleTime: 30000,
    retry: 1,
  });
}

type MergeStep = 'idle' | 'confirm' | 'submitting' | 'submitted';

function RemergeModal({ worldline, onClose }: { worldline: Worldline; onClose: () => void }) {
  const [step, setStep] = useState<MergeStep>('confirm');
  const [justification, setJustification] = useState('');

  const handleSubmit = () => {
    if (!justification.trim()) return;
    setStep('submitting');
    setTimeout(() => setStep('submitted'), 1400);
  };

  const lineColor = '#8b7ac8';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border flex flex-col gap-0 overflow-hidden"
        style={{ background: '#0c1420', borderColor: 'rgba(139,122,200,0.25)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="p-4 border-b flex items-center gap-2"
          style={{ borderColor: 'rgba(255,255,255,0.07)' }}
        >
          <GitMerge className="w-4 h-4" style={{ color: lineColor }} />
          <span
            className="text-[11px] font-bold uppercase tracking-widest font-mono"
            style={{ color: lineColor }}
          >
            Re-merge Approval
          </span>
          <button
            onClick={onClose}
            className="ml-auto p-1 rounded hover:bg-white/5 transition-colors"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {step === 'submitted' ? (
          <div className="p-6 flex flex-col items-center gap-3 text-center">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.25)',
              }}
            >
              <CheckCircle className="w-5 h-5" style={{ color: '#10b981' }} />
            </div>
            <div className="text-sm font-bold text-white">Re-merge Request Submitted</div>
            <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              The approval flow for{' '}
              <span className="font-mono" style={{ color: lineColor }}>
                {worldline.label}
              </span>{' '}
              has been initiated. Reviewers will be notified and can approve in the Policy Approvals
              queue.
            </div>
            <button
              onClick={onClose}
              className="mt-2 text-[10px] px-4 py-2 rounded-lg border hover:bg-white/5 transition-colors"
              style={{ color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.1)' }}
            >
              Close
            </button>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <div
              className="rounded-xl border p-3 space-y-1"
              style={{
                borderColor: 'rgba(139,122,200,0.12)',
                background: 'rgba(139,122,200,0.04)',
              }}
            >
              <div
                className="text-[9px] font-bold uppercase tracking-widest font-mono mb-1"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                Target Worldline
              </div>
              <div className="text-[12px] font-bold font-mono" style={{ color: lineColor }}>
                {worldline.label}
              </div>
              <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {worldline.description}
              </div>
              {worldline.branchReason && (
                <div className="text-[9px] italic" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Branch reason: {worldline.branchReason}
                </div>
              )}
            </div>

            <div>
              <div
                className="text-[9px] font-bold uppercase tracking-widest mb-1.5"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                Re-merge Justification <span style={{ color: '#ef4444' }}>*</span>
              </div>
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Describe the remediation steps taken and why this worldline is ready to merge back to WL-ALPHA baseline…"
                rows={4}
                className="w-full rounded-lg border p-3 text-[11px] resize-none outline-none focus:ring-1"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderColor: 'rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.8)',
                  caretColor: lineColor,
                }}
              />
            </div>

            <div
              className="rounded-lg border p-3"
              style={{ borderColor: 'rgba(245,158,11,0.15)', background: 'rgba(245,158,11,0.04)' }}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" style={{ color: '#f59e0b' }} />
                <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Re-merging requires approval from a minimum of{' '}
                  <strong className="text-white">2 reviewers</strong>. All affected twins will be
                  reconciled back to the WL-ALPHA baseline and their proofs regenerated.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={onClose}
                className="flex-1 text-[10px] px-3 py-2 rounded-lg border hover:bg-white/5 transition-colors"
                style={{ color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.08)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!justification.trim() || step === 'submitting'}
                className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-bold px-3 py-2 rounded-lg border transition-colors disabled:opacity-40"
                style={{
                  color: lineColor,
                  borderColor: `${lineColor}40`,
                  background: `${lineColor}10`,
                }}
              >
                {step === 'submitting' ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" /> Submitting…
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3" /> Submit for Approval
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function WorldlineRegistryPage() {
  const [selected, setSelected] = useState<Worldline | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'simulation'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mergeTarget, setMergeTarget] = useState<Worldline | null>(null);
  const { data: branchData, isLoading: loadingBranches } = useBranches();

  const apiBranches: ApiScenarioBranch[] = branchData?.branches ?? [];

  const visible = DEMO_WORLDLINES.filter((wl) => filter === 'all' || wl.status === filter);

  const totalTwins = DEMO_WORLDLINES.reduce((s, wl) => s + wl.twins.length, 0);
  const degradedCount = DEMO_WORLDLINES.reduce(
    (s, wl) =>
      s + wl.twins.filter((t) => t.state === 'degraded' || t.state === 'awaiting_approval').length,
    0,
  );
  const simCount = DEMO_WORLDLINES.filter((wl) => wl.status === 'simulation').length;

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GitBranch className="w-3.5 h-3.5" style={{ color: '#8b7ac8' }} />
            <span
              className="text-[10px] font-bold uppercase tracking-widest font-mono"
              style={{ color: '#8b7ac8' }}
            >
              Command · ATLAS
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Worldline Registry</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Causal branch navigation — all active, simulation, and archived worldlines across
            domains.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {['all', 'active', 'simulation'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as typeof filter)}
              className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all"
              style={
                filter === f
                  ? {
                      color: '#8b7ac8',
                      background: 'rgba(139,122,200,0.1)',
                      borderColor: 'rgba(139,122,200,0.3)',
                    }
                  : {
                      color: 'rgba(255,255,255,0.35)',
                      background: 'transparent',
                      borderColor: 'rgba(255,255,255,0.07)',
                    }
              }
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Worldlines', value: DEMO_WORLDLINES.length, color: '#8b7ac8' },
          { label: 'Tracked Twins', value: totalTwins, color: '#06b6d4' },
          {
            label: 'Need Attention',
            value: degradedCount,
            color: degradedCount > 0 ? '#f59e0b' : '#10b981',
            pulse: degradedCount > 0,
          },
          { label: 'Simulations', value: simCount, color: '#8b7ac8' },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-xl border p-4"
            style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.015)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className="text-[9px] font-medium uppercase tracking-widest"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                {c.label}
              </div>
              {c.pulse && (
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: c.color }}
                />
              )}
            </div>
            <div className="text-2xl font-bold font-mono" style={{ color: c.color }}>
              {c.value}
            </div>
          </div>
        ))}
      </div>

      {apiBranches.length > 0 && (
        <div
          className="rounded-xl border p-4"
          style={{ borderColor: 'rgba(139,122,200,0.12)', background: 'rgba(139,122,200,0.02)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-3 h-3" style={{ color: '#8b7ac8' }} />
            <span
              className="text-[10px] font-bold uppercase tracking-widest font-mono"
              style={{ color: '#8b7ac8' }}
            >
              Live Scenario Branches from API
            </span>
            <span
              className="ml-auto text-[9px] font-mono"
              style={{ color: 'rgba(255,255,255,0.25)' }}
            >
              {apiBranches.length} branch{apiBranches.length !== 1 ? 'es' : ''}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {apiBranches.slice(0, 6).map((br) => (
              <div
                key={br.id}
                className="rounded-lg border p-3"
                style={{
                  borderColor: 'rgba(139,122,200,0.15)',
                  background: 'rgba(139,122,200,0.03)',
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-white truncate">{br.branchName}</span>
                  <span
                    className="text-[8px] font-mono px-1.5 py-0.5 rounded"
                    style={{
                      color: br.status === 'active' ? '#10b981' : '#8b7ac8',
                      background:
                        br.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(139,122,200,0.1)',
                    }}
                  >
                    {br.status}
                  </span>
                </div>
                {br.branchDescription && (
                  <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {br.branchDescription}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2">
                  {br.twinCategory && (
                    <span
                      className="text-[8px] font-mono"
                      style={{ color: 'rgba(255,255,255,0.25)' }}
                    >
                      {br.twinCategory}
                    </span>
                  )}
                  <button
                    onClick={() => copyId(br.id)}
                    className="ml-auto flex items-center gap-1 text-[8px] px-1.5 py-0.5 rounded hover:bg-white/5 transition-colors"
                    style={{ color: 'rgba(255,255,255,0.3)' }}
                  >
                    <Copy className="w-2 h-2" />
                    {copiedId === br.id ? 'Copied!' : br.id.slice(0, 12) + '…'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loadingBranches && !branchData && (
        <div
          className="rounded-xl border p-4 flex items-center gap-3"
          style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.01)' }}
        >
          <RefreshCw
            className="w-3.5 h-3.5 animate-spin"
            style={{ color: 'rgba(139,122,200,0.5)' }}
          />
          <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Loading live branch data from API…
          </span>
        </div>
      )}

      <div className="space-y-4">
        {visible.map((wl) => {
          const isSelected = selected?.id === wl.id;
          const allStable = wl.twins.every((t) => t.state === 'stable');
          const hasUrgent = wl.twins.some((t) => t.state === 'degraded');
          const hasPending = wl.twins.some((t) => t.state === 'awaiting_approval');
          const lineColor = allStable
            ? '#10b981'
            : hasUrgent
              ? '#f59e0b'
              : hasPending
                ? '#8b7ac8'
                : '#6b7280';
          const origCfg = DOMAIN_CONFIG[wl.originDomain];
          const OrigIcon = origCfg.icon;

          return (
            <div
              key={wl.id}
              className="rounded-xl border overflow-hidden cursor-pointer transition-all hover:border-white/15"
              style={{
                borderColor: isSelected ? `${lineColor}30` : 'rgba(255,255,255,0.07)',
                background: isSelected ? `${lineColor}04` : 'rgba(255,255,255,0.01)',
              }}
              onClick={() => setSelected(isSelected ? null : wl)}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="p-2 rounded-lg shrink-0"
                    style={{ background: `${lineColor}12`, border: `1px solid ${lineColor}25` }}
                  >
                    <GitBranch className="w-3.5 h-3.5" style={{ color: lineColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span
                        className="text-[12px] font-bold font-mono"
                        style={{ color: lineColor }}
                      >
                        {wl.label}
                      </span>
                      <WorldlineStatusBadge status={wl.status} />
                      <div
                        className="flex items-center gap-1 text-[9px]"
                        style={{ color: 'rgba(255,255,255,0.3)' }}
                      >
                        <OrigIcon className="w-2.5 h-2.5" style={{ color: origCfg.color }} />
                        <span>{origCfg.label}</span>
                      </div>
                      <span
                        className="ml-auto text-[9px] font-mono"
                        style={{ color: 'rgba(255,255,255,0.25)' }}
                      >
                        Created {wl.createdAt}
                      </span>
                    </div>
                    <div className="text-[11px] text-white mb-1">{wl.description}</div>
                    {wl.branchReason && (
                      <div
                        className="text-[10px] italic"
                        style={{ color: 'rgba(255,255,255,0.3)' }}
                      >
                        Branch reason: {wl.branchReason}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <div className="text-right">
                      <div
                        className="text-[9px] font-mono"
                        style={{ color: 'rgba(255,255,255,0.3)' }}
                      >
                        {wl.twins.length} twin{wl.twins.length !== 1 ? 's' : ''}
                      </div>
                      <div
                        className="text-[9px]"
                        style={{ color: allStable ? '#10b981' : lineColor }}
                      >
                        {allStable ? 'All stable' : hasUrgent ? 'Degraded' : 'Pending'}
                      </div>
                    </div>
                    <ChevronRight
                      className="w-3.5 h-3.5 transition-transform"
                      style={{
                        color: 'rgba(255,255,255,0.25)',
                        transform: isSelected ? 'rotate(90deg)' : undefined,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-3 flex gap-1 flex-wrap">
                  {wl.twins.map((tw) => {
                    const s = STATE_CONFIG[tw.state];
                    const d = DOMAIN_CONFIG[tw.domain];
                    return (
                      <span
                        key={tw.id}
                        className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded border font-mono"
                        style={{ color: s.color, background: s.bg, borderColor: s.border }}
                      >
                        {tw.state !== 'stable' && (
                          <span
                            className="w-1 h-1 rounded-full animate-pulse"
                            style={{ background: s.color }}
                          />
                        )}
                        {tw.name}
                      </span>
                    );
                  })}
                </div>

                {isSelected && (
                  <div
                    className="mt-4 pt-4 border-t space-y-3"
                    style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                  >
                    <div
                      className="text-[9px] font-bold uppercase tracking-widest mb-2"
                      style={{ color: 'rgba(255,255,255,0.25)' }}
                    >
                      Twin Detail
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {wl.twins.map((tw) => {
                        const s = STATE_CONFIG[tw.state];
                        const d = DOMAIN_CONFIG[tw.domain];
                        const DIcon = d.icon;
                        return (
                          <div
                            key={tw.id}
                            className="rounded-xl border p-3"
                            style={{ borderColor: `${s.color}20`, background: s.bg }}
                          >
                            <div className="flex items-start gap-2 mb-2">
                              <div className="p-1 rounded" style={{ background: `${d.color}15` }}>
                                <DIcon className="w-3 h-3" style={{ color: d.color }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div
                                  className="text-[9px] font-bold mb-0.5"
                                  style={{ color: d.color }}
                                >
                                  {d.label}
                                </div>
                                <div className="text-[10px] font-semibold text-white truncate">
                                  {tw.name}
                                </div>
                              </div>
                              <DriftBadge score={tw.driftScore} />
                            </div>
                            <div
                              className="text-[9px] mb-2"
                              style={{ color: 'rgba(255,255,255,0.45)' }}
                            >
                              {tw.summary}
                            </div>
                            <div className="flex items-center justify-between">
                              <span
                                className="text-[8px] px-1.5 py-0.5 rounded border"
                                style={{
                                  color: s.color,
                                  background: `${s.color}15`,
                                  borderColor: `${s.color}30`,
                                }}
                              >
                                {tw.state !== 'stable' && (
                                  <span
                                    className="inline-block w-1 h-1 rounded-full animate-pulse mr-1 align-middle"
                                    style={{ background: s.color }}
                                  />
                                )}
                                {s.label}
                              </span>
                              <div className="flex items-center gap-1">
                                <span
                                  className="text-[8px] font-mono"
                                  style={{
                                    color:
                                      tw.proofState === 'verified'
                                        ? '#10b981'
                                        : tw.proofState === 'pending'
                                          ? '#f59e0b'
                                          : '#ef4444',
                                  }}
                                >
                                  {tw.proofState === 'verified' ? (
                                    <CheckCircle className="w-2.5 h-2.5 inline" />
                                  ) : tw.proofState === 'pending' ? (
                                    <Clock className="w-2.5 h-2.5 inline" />
                                  ) : (
                                    <AlertTriangle className="w-2.5 h-2.5 inline" />
                                  )}{' '}
                                  {tw.proofState}
                                </span>
                                <span
                                  className="text-[8px] font-mono"
                                  style={{ color: 'rgba(255,255,255,0.25)' }}
                                >
                                  {tw.lastSync}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <a
                        href={`${DOMAIN_CONFIG[wl.originDomain].appPath}/atlas-runtime`}
                        className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg border transition-colors hover:bg-white/5"
                        style={{
                          color: lineColor,
                          borderColor: `${lineColor}30`,
                          background: `${lineColor}06`,
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Eye className="w-3 h-3" />
                        Open Domain Runtime →
                      </a>
                      {wl.id !== 'WL-ALPHA' && wl.status !== 'archived' && (
                        <button
                          className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg border transition-colors hover:bg-white/5"
                          style={{
                            color: '#10b981',
                            borderColor: 'rgba(16,185,129,0.25)',
                            background: 'rgba(16,185,129,0.06)',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setMergeTarget(wl);
                          }}
                        >
                          <GitMerge className="w-3 h-3" />
                          Re-merge to WL-ALPHA
                        </button>
                      )}
                      <button
                        className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg border transition-colors hover:bg-white/5 ml-auto"
                        style={{
                          color: 'rgba(255,255,255,0.4)',
                          borderColor: 'rgba(255,255,255,0.07)',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          copyId(wl.id);
                        }}
                      >
                        <Copy className="w-3 h-3" />
                        {copiedId === wl.id ? 'Copied!' : `Copy ${wl.id}`}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {visible.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Lock className="w-8 h-8" style={{ color: 'rgba(255,255,255,0.1)' }} />
          <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
            No worldlines match the current filter.
          </div>
        </div>
      )}

      {mergeTarget && <RemergeModal worldline={mergeTarget} onClose={() => setMergeTarget(null)} />}
    </div>
  );
}

export default WorldlineRegistryPage;
