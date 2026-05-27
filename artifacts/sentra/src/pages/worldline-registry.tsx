import {
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Eye,
  GitBranch,
  GitMerge,
  Globe,
  Layers,
  Lock,
  Network,
  RefreshCw,
  Send,
  Server,
  Shield,
  X,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

type TwinState = 'stable' | 'degraded' | 'awaiting_approval' | 'offline';

interface WorldlineTwin {
  id: string;
  name: string;
  domain: string;
  type: 'endpoint' | 'network' | 'cloud' | 'ot' | 'identity' | 'app';
  state: TwinState;
  driftScore: number;
  lastSync: string;
  proofState: 'verified' | 'pending' | 'unverified';
  incidents: number;
  evidence: string[];
  divergedAt: string;
}

interface Worldline {
  id: string;
  label: string;
  description: string;
  status: 'active' | 'simulation' | 'archived';
  divergencePoint: string;
  divergedAt: string;
  severity: 'critical' | 'high' | 'medium' | 'none';
  mergeStatus: 'ready' | 'blocked' | 'in_review' | 'merged';
  twins: WorldlineTwin[];
  branchReason: string;
}

const SEVERITY_CONFIG: Record<Worldline['severity'], { color: string; label: string }> = {
  critical: { color: '#f5f5f5', label: 'Critical' },
  high: { color: '#c9b787', label: 'High' },
  medium: { color: '#d4a054', label: 'Medium' },
  none: { color: '#c9b787', label: 'None' },
};

const MERGE_CONFIG: Record<
  Worldline['mergeStatus'],
  { color: string; label: string; bg: string; border: string }
> = {
  ready: {
    color: '#c9b787',
    label: 'Ready to Merge',
    bg: 'rgba(201,183,135,0.08)',
    border: 'rgba(201,183,135,0.2)',
  },
  blocked: {
    color: '#f5f5f5',
    label: 'Merge Blocked',
    bg: 'rgba(245,245,245,0.08)',
    border: 'rgba(245,245,245,0.2)',
  },
  in_review: {
    color: '#8b7ac8',
    label: 'In Review',
    bg: 'rgba(139,122,200,0.08)',
    border: 'rgba(139,122,200,0.2)',
  },
  merged: {
    color: '#6b7280',
    label: 'Merged',
    bg: 'rgba(107,114,128,0.08)',
    border: 'rgba(107,114,128,0.2)',
  },
};

const STATE_CONFIG: Record<
  TwinState,
  { color: string; label: string; bg: string; border: string }
> = {
  stable: {
    color: '#c9b787',
    label: 'Stable',
    bg: 'rgba(201,183,135,0.08)',
    border: 'rgba(201,183,135,0.2)',
  },
  degraded: {
    color: '#c9b787',
    label: 'Degraded',
    bg: 'rgba(201,183,135,0.08)',
    border: 'rgba(201,183,135,0.2)',
  },
  awaiting_approval: {
    color: '#8b7ac8',
    label: 'Awaiting Approval',
    bg: 'rgba(139,122,200,0.08)',
    border: 'rgba(139,122,200,0.2)',
  },
  offline: {
    color: '#f5f5f5',
    label: 'Offline',
    bg: 'rgba(245,245,245,0.08)',
    border: 'rgba(245,245,245,0.2)',
  },
};

const TYPE_ICON: Record<string, typeof Server> = {
  endpoint: Server,
  network: Network,
  cloud: Globe,
  ot: Zap,
  identity: Shield,
  app: Layers,
};

const WORLDLINES: Worldline[] = [
  {
    id: 'WL-ALPHA',
    label: 'WL-ALPHA',
    description: 'Primary canonical baseline — all proofs verified, zero active incidents',
    status: 'active',
    divergencePoint: 'N/A — primary baseline',
    divergedAt: 'Mar 1, 2026',
    severity: 'none',
    mergeStatus: 'merged',
    branchReason: 'Primary worldline — all domains originate here',
    twins: [
      {
        id: 'tw-001',
        name: 'PROD-DC-CLUSTER',
        domain: 'Endpoint',
        type: 'endpoint',
        state: 'stable',
        driftScore: 2,
        lastSync: '12s ago',
        proofState: 'verified',
        incidents: 0,
        evidence: ['Config snapshot v4.2', 'Baseline hash match', 'Last audit: 6h ago'],
        divergedAt: '',
      },
      {
        id: 'tw-005',
        name: 'IDENTITY-FABRIC-AD',
        domain: 'Identity',
        type: 'identity',
        state: 'stable',
        driftScore: 6,
        lastSync: '45s ago',
        proofState: 'verified',
        incidents: 0,
        evidence: ['Group policy snapshot', 'Privileged accounts: 12', 'MFA coverage: 98.4%'],
        divergedAt: '',
      },
      {
        id: 'tw-007',
        name: 'DB-CLUSTER-PG',
        domain: 'Database',
        type: 'endpoint',
        state: 'stable',
        driftScore: 1,
        lastSync: '18s ago',
        proofState: 'verified',
        incidents: 0,
        evidence: ['Schema hash verified', 'Replication lag: 0ms', 'Encryption: AES-256'],
        divergedAt: '',
      },
      {
        id: 'tw-008',
        name: 'PERIMETER-FW-CLUSTER',
        domain: 'Network',
        type: 'network',
        state: 'stable',
        driftScore: 3,
        lastSync: '22s ago',
        proofState: 'verified',
        incidents: 0,
        evidence: ['Ruleset v71 active', 'GeoIP blocks active', 'Zero policy gaps'],
        divergedAt: '',
      },
    ],
  },
  {
    id: 'WL-BETA',
    label: 'WL-BETA',
    description:
      'Active incident branch — IAM role chaining detected in AWS VPC, K8s app tier drifted',
    status: 'active',
    divergencePoint: 'AWS-VPC-PROD IAM drift · Apr 14, 2026 at 14:08',
    divergedAt: 'Apr 14, 2026',
    severity: 'critical',
    mergeStatus: 'blocked',
    branchReason:
      'IAM role chaining to cross-account admin detected — branched for controlled investigation without affecting canonical baseline',
    twins: [
      {
        id: 'tw-003',
        name: 'AWS-VPC-PROD',
        domain: 'Cloud',
        type: 'cloud',
        state: 'degraded',
        driftScore: 31,
        lastSync: '4m ago',
        proofState: 'pending',
        incidents: 2,
        evidence: ['IAM drift detected', '3 SGs misconfigured', 'Pending operator review'],
        divergedAt: 'Apr 14, 14:08',
      },
      {
        id: 'tw-006',
        name: 'APP-TIER-K8S',
        domain: 'Application',
        type: 'app',
        state: 'degraded',
        driftScore: 24,
        lastSync: '7m ago',
        proofState: 'unverified',
        incidents: 3,
        evidence: ['Pod drift: 6 containers', 'CVE-2024-3890 exposed', 'Security context missing'],
        divergedAt: 'Apr 14, 14:28',
      },
    ],
  },
  {
    id: 'WL-GAMMA',
    label: 'WL-GAMMA',
    description: 'OT/ICS approval branch — PLC firmware delta isolated for CISO review',
    status: 'active',
    divergencePoint: 'OT-SCADA-CONTROL firmware delta · Apr 16, 2026 at 14:21',
    divergedAt: 'Apr 16, 2026',
    severity: 'high',
    mergeStatus: 'in_review',
    branchReason:
      'PLC ladder logic modification attempt detected — isolated to prevent OT/ICS contamination of primary posture baseline',
    twins: [
      {
        id: 'tw-004',
        name: 'OT-SCADA-CONTROL',
        domain: 'OT/ICS',
        type: 'ot',
        state: 'awaiting_approval',
        driftScore: 18,
        lastSync: '11m ago',
        proofState: 'pending',
        incidents: 1,
        evidence: ['PLC firmware delta', 'Protocol anomaly flagged', 'Awaiting CISO sign-off'],
        divergedAt: 'Apr 16, 14:21',
      },
    ],
  },
  {
    id: 'WL-SIM-APT29',
    label: 'WL-SIM-APT29',
    description: 'Simulation: APT-29 lateral movement scenario — Q2 red team exercise',
    status: 'simulation',
    divergencePoint: 'Simulated identity compromise · Apr 10, 2026',
    divergedAt: 'Apr 10, 2026',
    severity: 'medium',
    mergeStatus: 'merged',
    branchReason:
      'Scenario forge: APT-29 lateral movement via compromised service account, credential harvesting across 3 domain controllers',
    twins: [
      {
        id: 'tw-sim-001',
        name: 'SIM-IDENTITY-DC01',
        domain: 'Identity',
        type: 'identity',
        state: 'stable',
        driftScore: 0,
        lastSync: '2d ago',
        proofState: 'verified',
        incidents: 0,
        evidence: ['Scenario complete', 'Red team report filed', 'Mitigations applied to WL-ALPHA'],
        divergedAt: '',
      },
    ],
  },
];

function DriftBadge({ score }: { score: number }) {
  const color =
    score === 0 ? '#6b7280' : score <= 5 ? '#c9b787' : score <= 15 ? '#c9b787' : '#f5f5f5';
  return (
    <span
      className="text-[8px] font-bold font-mono px-1.5 py-0.5 rounded"
      style={{ color, background: `${color}15`, border: `1px solid ${color}25` }}
    >
      Δ{score}%
    </span>
  );
}

function MergeBadge({ status }: { status: Worldline['mergeStatus'] }) {
  const cfg = MERGE_CONFIG[status];
  return (
    <span
      className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border font-mono"
      style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
    >
      {cfg.label}
    </span>
  );
}

type MergeStep = 'confirm' | 'submitting' | 'submitted';

function RemergeModal({ worldline, onClose }: { worldline: Worldline; onClose: () => void }) {
  const [step, setStep] = useState<MergeStep>('confirm');
  const [justification, setJustification] = useState('');

  const handleSubmit = () => {
    if (!justification.trim()) return;
    setStep('submitting');
    setTimeout(() => setStep('submitted'), 1400);
  };

  const sev = SEVERITY_CONFIG[worldline.severity];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border overflow-hidden"
        style={{ background: '#0c1420', borderColor: 'rgba(139,122,200,0.25)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="p-4 border-b flex items-center gap-2"
          style={{ borderColor: 'rgba(255,255,255,0.07)' }}
        >
          <GitMerge className="w-4 h-4" style={{ color: '#8b7ac8' }} />
          <span
            className="text-[11px] font-bold uppercase tracking-widest font-mono"
            style={{ color: '#8b7ac8' }}
          >
            Initiate Re-merge
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
                background: 'rgba(201,183,135,0.1)',
                border: '1px solid rgba(201,183,135,0.25)',
              }}
            >
              <CheckCircle className="w-5 h-5" style={{ color: '#c9b787' }} />
            </div>
            <div className="text-sm font-bold text-white">Re-merge Request Submitted</div>
            <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Approval flow for{' '}
              <span className="font-mono" style={{ color: '#8b7ac8' }}>
                {worldline.label}
              </span>{' '}
              initiated. Reviewers will be notified and can approve in the Policy Approvals queue.
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
              className="rounded-xl border p-3 space-y-1.5"
              style={{
                borderColor: 'rgba(139,122,200,0.12)',
                background: 'rgba(139,122,200,0.04)',
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-bold font-mono" style={{ color: '#8b7ac8' }}>
                  {worldline.label}
                </span>
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                  style={{ color: sev.color, background: `${sev.color}15` }}
                >
                  {sev.label}
                </span>
              </div>
              <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {worldline.description}
              </div>
              <div className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Divergence: {worldline.divergencePoint}
              </div>
            </div>

            <div
              className="rounded-xl border p-3 space-y-1.5"
              style={{
                borderColor: 'rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.01)',
              }}
            >
              <div
                className="text-[9px] font-bold uppercase tracking-widest mb-1"
                style={{ color: 'rgba(255,255,255,0.25)' }}
              >
                Causal Chain
              </div>
              <div className="text-[9px] italic" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {worldline.branchReason}
              </div>
              <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                Affected twins: {worldline.twins.length} · Branched: {worldline.divergedAt}
              </div>
            </div>

            <div>
              <div
                className="text-[9px] font-bold uppercase tracking-widest mb-1.5"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                Remediation Justification <span style={{ color: '#f5f5f5' }}>*</span>
              </div>
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Describe the remediation steps completed and why this worldline is safe to merge back to WL-ALPHA…"
                rows={4}
                className="w-full rounded-lg border p-3 text-[11px] resize-none outline-none focus:ring-1"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderColor: 'rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.8)',
                  caretColor: '#8b7ac8',
                }}
              />
            </div>

            <div
              className="rounded-lg border p-3"
              style={{ borderColor: 'rgba(201,183,135,0.15)', background: 'rgba(201,183,135,0.04)' }}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" style={{ color: '#c9b787' }} />
                <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Re-merging requires approval from a minimum of{' '}
                  <strong className="text-white">2 reviewers</strong>. All affected twin proofs will
                  be regenerated and reconciled to WL-ALPHA on approval.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
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
                  color: '#8b7ac8',
                  borderColor: 'rgba(139,122,200,0.35)',
                  background: 'rgba(139,122,200,0.1)',
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

export default function AegisWorldlineRegistry() {
  const [selected, setSelected] = useState<Worldline | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'simulation'>('all');
  const [mergeTarget, setMergeTarget] = useState<Worldline | null>(null);

  const visible = WORLDLINES.filter((wl) => filter === 'all' || wl.status === filter);
  const activeCount = WORLDLINES.filter((wl) => wl.status === 'active').length;
  const blockedCount = WORLDLINES.filter((wl) => wl.mergeStatus === 'blocked').length;
  const inReviewCount = WORLDLINES.filter((wl) => wl.mergeStatus === 'in_review').length;
  const simCount = WORLDLINES.filter((wl) => wl.status === 'simulation').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GitBranch className="w-3.5 h-3.5" style={{ color: '#8b7ac8' }} />
            <span
              className="text-[10px] font-bold uppercase tracking-widest font-mono"
              style={{ color: '#8b7ac8' }}
            >
              Sentra · ATLAS Spatial Runtime
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Worldline Registry</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Causal branch navigation — posture worldlines, divergence points, and re-merge approval
            flows.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'active', 'simulation'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
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
          { label: 'Active Worldlines', value: activeCount, color: '#8b7ac8' },
          {
            label: 'Merge Blocked',
            value: blockedCount,
            color: blockedCount > 0 ? '#f5f5f5' : '#c9b787',
            pulse: blockedCount > 0,
          },
          {
            label: 'In Review',
            value: inReviewCount,
            color: inReviewCount > 0 ? '#c9b787' : '#c9b787',
            pulse: inReviewCount > 0,
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

      <div className="space-y-4">
        {visible.map((wl) => {
          const isSelected = selected?.id === wl.id;
          const sev = SEVERITY_CONFIG[wl.severity];
          const allStable = wl.twins.every((t) => t.state === 'stable');
          const lineColor = wl.id === 'WL-ALPHA' ? '#c9b787' : sev.color;
          const canMerge =
            wl.id !== 'WL-ALPHA' && wl.status !== 'archived' && wl.mergeStatus !== 'merged';

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
                      <MergeBadge status={wl.mergeStatus} />
                      {wl.severity !== 'none' && (
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                          style={{ color: sev.color, background: `${sev.color}15` }}
                        >
                          {sev.label}
                        </span>
                      )}
                      <span
                        className="ml-auto text-[9px] font-mono"
                        style={{ color: 'rgba(255,255,255,0.25)' }}
                      >
                        Branched: {wl.divergedAt}
                      </span>
                    </div>
                    <div className="text-[11px] text-white mb-0.5">{wl.description}</div>
                    {wl.id !== 'WL-ALPHA' && (
                      <div
                        className="text-[9px] font-mono"
                        style={{ color: 'rgba(255,255,255,0.3)' }}
                      >
                        Divergence point: {wl.divergencePoint}
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
                        style={{ color: allStable ? '#c9b787' : lineColor }}
                      >
                        {allStable ? 'All stable' : 'Needs attention'}
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
                      className="text-[9px] font-bold uppercase tracking-widest"
                      style={{ color: 'rgba(255,255,255,0.25)' }}
                    >
                      Causal Chain
                    </div>
                    <div
                      className="rounded-xl border p-3"
                      style={{
                        borderColor: 'rgba(255,255,255,0.06)',
                        background: 'rgba(255,255,255,0.01)',
                      }}
                    >
                      <div
                        className="text-[10px] italic mb-1"
                        style={{ color: 'rgba(255,255,255,0.5)' }}
                      >
                        {wl.branchReason}
                      </div>
                      {wl.id !== 'WL-ALPHA' && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: '#c9b787' }} />
                          <span
                            className="text-[9px] font-mono"
                            style={{ color: 'rgba(255,255,255,0.35)' }}
                          >
                            WL-ALPHA baseline
                          </span>
                          <div
                            className="flex-1 h-px"
                            style={{ background: 'rgba(255,255,255,0.1)' }}
                          />
                          <div className="w-2 h-2 rounded-full" style={{ background: lineColor }} />
                          <span className="text-[9px] font-mono" style={{ color: lineColor }}>
                            {wl.label} branch · {wl.divergedAt}
                          </span>
                        </div>
                      )}
                    </div>

                    <div
                      className="text-[9px] font-bold uppercase tracking-widest mt-3"
                      style={{ color: 'rgba(255,255,255,0.25)' }}
                    >
                      Affected Twins
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {wl.twins.map((tw) => {
                        const s = STATE_CONFIG[tw.state];
                        const TIcon = TYPE_ICON[tw.type] ?? Server;
                        return (
                          <div
                            key={tw.id}
                            className="rounded-xl border p-3"
                            style={{ borderColor: `${s.color}20`, background: s.bg }}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div className="p-1 rounded" style={{ background: `${s.color}15` }}>
                                <TIcon className="w-3 h-3" style={{ color: s.color }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div
                                  className="text-[9px]"
                                  style={{ color: 'rgba(255,255,255,0.35)' }}
                                >
                                  {tw.domain}
                                </div>
                                <div className="text-[10px] font-semibold text-white truncate">
                                  {tw.name}
                                </div>
                              </div>
                              <DriftBadge score={tw.driftScore} />
                            </div>
                            <div className="space-y-1">
                              {tw.evidence.slice(0, 2).map((e, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-1.5 text-[9px]"
                                  style={{ color: 'rgba(255,255,255,0.4)' }}
                                >
                                  <CheckCircle
                                    className="w-2 h-2 shrink-0"
                                    style={{
                                      color: tw.proofState === 'verified' ? '#c9b787' : '#c9b787',
                                    }}
                                  />
                                  {e}
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center justify-between mt-2">
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
                              <span
                                className="text-[8px] font-mono"
                                style={{ color: 'rgba(255,255,255,0.25)' }}
                              >
                                {tw.lastSync}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      {canMerge && (
                        <button
                          className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg border transition-colors hover:bg-white/5"
                          style={{
                            color: '#c9b787',
                            borderColor: 'rgba(201,183,135,0.25)',
                            background: 'rgba(201,183,135,0.06)',
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
                      <a
                        href="/command/strategy/worldline-registry"
                        className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg border transition-colors hover:bg-white/5"
                        style={{
                          color: '#8b7ac8',
                          borderColor: 'rgba(139,122,200,0.25)',
                          background: 'rgba(139,122,200,0.06)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Eye className="w-3 h-3" />
                        Open in Command →
                      </a>
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
