import { cn } from '@szl-holdings/shared-ui/utils';
import { FileText, Filter, GitBranch, Hash, Lock, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';

type ProvenanceKind = 'recommendation' | 'policy' | 'approval' | 'rejection' | 'drift';
type VerificationStatus = 'verified' | 'pending' | 'failed';

interface ProvenanceEntry {
  id: string;
  kind: ProvenanceKind;
  action: string;
  matter: string;
  actor: string;
  time: string;
  modelVersion: string;
  proofHash: string;
  policyRefs: string[];
  evidenceCount: number;
  status: VerificationStatus;
}

const entries: ProvenanceEntry[] = [
  {
    id: 'pv-9012',
    kind: 'approval',
    action: 'Approved: Reassign Draft Regulatory Report → Sterling & Ross',
    matter: 'Meridian Compliance v.3',
    actor: 'Lead Counsel (Admin)',
    time: '2h ago',
    modelVersion: 'counsel-os 0.6.2',
    proofHash: '0x8d1e4b9a...c290',
    policyRefs: ['Engagement Policy §4.2', 'Reassignment Threshold §6.1'],
    evidenceCount: 3,
    status: 'verified',
  },
  {
    id: 'pv-9011',
    kind: 'recommendation',
    action: 'Recommendation: Trigger formal performance review of Morrison & Vance',
    matter: 'Morrison & Vance — firm-wide',
    actor: 'Counsel OS Engine',
    time: '8h ago',
    modelVersion: 'counsel-os 0.6.2',
    proofHash: '0x4f02ab17...11de',
    policyRefs: ['Master Engagement Letter §4.2', 'Escalation Playbook EP-09'],
    evidenceCount: 2,
    status: 'verified',
  },
  {
    id: 'pv-9010',
    kind: 'policy',
    action: 'Policy decision: Privilege auto-classification applied to 12 documents',
    matter: 'Hargreave IP Settlement',
    actor: 'Policy Engine',
    time: '12h ago',
    modelVersion: 'counsel-os 0.6.2',
    proofHash: '0x71ee23c5...90fa',
    policyRefs: ['Privilege Classification Policy §1.3'],
    evidenceCount: 12,
    status: 'verified',
  },
  {
    id: 'pv-9009',
    kind: 'rejection',
    action: 'Rejected: Auto-extend Discovery deadline by 14 days',
    matter: 'Meridian Compliance v.3',
    actor: 'Lead Counsel (Admin)',
    time: '18h ago',
    modelVersion: 'counsel-os 0.6.1',
    proofHash: '0xa011fc83...62b7',
    policyRefs: ['Deadline Extension Policy §2.2'],
    evidenceCount: 4,
    status: 'verified',
  },
  {
    id: 'pv-9008',
    kind: 'drift',
    action: 'Drift detected: Privilege log baseline divergence > threshold',
    matter: 'Hargreave IP Settlement',
    actor: 'System Engine',
    time: '1d ago',
    modelVersion: 'counsel-os 0.6.2',
    proofHash: '0xc4e92d10...8845',
    policyRefs: ['Drift Monitoring Policy §5.1'],
    evidenceCount: 1,
    status: 'verified',
  },
  {
    id: 'pv-9007',
    kind: 'recommendation',
    action: 'Recommendation: Increase Hargreave reserve estimate $1.2M → $1.4M',
    matter: 'Hargreave IP Settlement',
    actor: 'Counsel OS Engine',
    time: '1d ago',
    modelVersion: 'counsel-os 0.6.2',
    proofHash: '0xb20c91fe...77a4',
    policyRefs: ['Reserve Policy §3.4'],
    evidenceCount: 3,
    status: 'pending',
  },
  {
    id: 'pv-9006',
    kind: 'policy',
    action: 'Policy decision: Document Reuse Policy applied to EU clarification memo',
    matter: 'Global Data Privacy Audit',
    actor: 'Policy Engine',
    time: '2d ago',
    modelVersion: 'counsel-os 0.6.2',
    proofHash: '0xe9a715c8...4031',
    policyRefs: ['Document Reuse Policy §2.1'],
    evidenceCount: 2,
    status: 'verified',
  },
];

const kindStyle: Record<
  ProvenanceKind,
  { bg: string; border: string; text: string; label: string; icon: typeof Lock }
> = {
  recommendation: {
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/25',
    text: 'text-violet-300',
    label: 'Recommendation',
    icon: GitBranch,
  },
  policy: {
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/25',
    text: 'text-sky-300',
    label: 'Policy',
    icon: ShieldCheck,
  },
  approval: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/25',
    text: 'text-emerald-300',
    label: 'Approval',
    icon: Lock,
  },
  rejection: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/25',
    text: 'text-red-300',
    label: 'Rejection',
    icon: FileText,
  },
  drift: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/25',
    text: 'text-amber-300',
    label: 'Drift',
    icon: GitBranch,
  },
};

const statusStyle: Record<
  VerificationStatus,
  { bg: string; border: string; text: string; label: string }
> = {
  verified: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/25',
    text: 'text-emerald-300',
    label: 'VERIFIED',
  },
  pending: {
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/25',
    text: 'text-violet-300',
    label: 'PENDING',
  },
  failed: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/25',
    text: 'text-red-300',
    label: 'FAILED',
  },
};

const FILTERS: ('all' | ProvenanceKind)[] = [
  'all',
  'recommendation',
  'approval',
  'rejection',
  'policy',
  'drift',
];

export default function TrustProvenance() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');

  const visible = useMemo(
    () => (filter === 'all' ? entries : entries.filter((e) => e.kind === filter)),
    [filter],
  );

  const verified = entries.filter((e) => e.status === 'verified').length;
  const integrity = Math.round((verified / entries.length) * 100);

  return (
    <div className="p-6 space-y-6">
      <header>
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-violet-400" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-violet-400/60">
            Operations · Trust & Provenance
          </span>
        </div>
        <h1 className="text-2xl font-bold text-violet-100">Audit Trail</h1>
        <p className="text-violet-400/60 text-sm">
          Evidence-backed log of every AI recommendation, policy decision, and human override across
          Counsel.
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-violet-500/5 border border-violet-500/10 rounded-xl p-4">
          <div className="text-[10px] font-mono uppercase tracking-widest text-violet-300/70 mb-2">
            Entries (24h)
          </div>
          <div className="text-3xl font-bold text-violet-50">{entries.length}</div>
        </div>
        <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4">
          <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-300/80 mb-2">
            Verified
          </div>
          <div className="text-3xl font-bold text-emerald-50">{verified}</div>
        </div>
        <div className="bg-violet-500/5 border border-violet-500/10 rounded-xl p-4">
          <div className="text-[10px] font-mono uppercase tracking-widest text-violet-300/70 mb-2">
            Integrity
          </div>
          <div className="text-3xl font-bold text-violet-50">{integrity}%</div>
        </div>
        <div className="bg-violet-500/5 border border-violet-500/10 rounded-xl p-4">
          <div className="text-[10px] font-mono uppercase tracking-widest text-violet-300/70 mb-2">
            Model
          </div>
          <div className="text-base font-bold text-violet-50 font-mono">counsel-os 0.6.2</div>
          <div className="text-[10px] text-violet-400/60 mt-1">
            Signed by Counsel Trust Authority
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-violet-400/60" />
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-[11px] font-mono uppercase tracking-wider border transition-colors',
              filter === f
                ? 'bg-violet-500/20 border-violet-500/40 text-violet-100'
                : 'bg-violet-500/5 border-violet-500/10 text-violet-300/70 hover:border-violet-500/25',
            )}
          >
            {f === 'all' ? 'All' : kindStyle[f as ProvenanceKind].label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {visible.map((e) => {
          const k = kindStyle[e.kind];
          const s = statusStyle[e.status];
          const Icon = k.icon;
          return (
            <div key={e.id} className="bg-[#0a0614] border border-violet-500/10 rounded-xl p-4">
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border',
                    k.bg,
                    k.border,
                  )}
                >
                  <Icon className={cn('w-5 h-5', k.text)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border',
                        k.bg,
                        k.border,
                        k.text,
                      )}
                    >
                      {k.label}
                    </span>
                    <span className="text-[10px] font-mono text-violet-400/60">{e.id}</span>
                    <span className="text-[10px] font-mono text-violet-400/40">·</span>
                    <span className="text-[10px] font-mono text-violet-400/60">{e.time}</span>
                  </div>
                  <div className="text-sm font-semibold text-violet-50 leading-snug">
                    {e.action}
                  </div>
                  <div className="text-[11px] text-violet-300/60 mt-0.5">
                    Matter: {e.matter} · Actor:{' '}
                    <span className="text-violet-200/80">{e.actor}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-x-4 gap-y-1 flex-wrap text-[10px] font-mono text-violet-400/60">
                    <span className="flex items-center gap-1.5">
                      <GitBranch className="w-3 h-3" /> {e.modelVersion}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Hash className="w-3 h-3" /> {e.proofHash}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3 h-3" /> {e.evidenceCount} evidence refs
                    </span>
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3 h-3" /> {e.policyRefs.length} policy refs
                    </span>
                  </div>
                </div>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider shrink-0 border',
                    s.bg,
                    s.border,
                    s.text,
                  )}
                >
                  {s.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
