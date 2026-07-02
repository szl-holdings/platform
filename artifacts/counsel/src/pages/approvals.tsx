import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { toast } from '@szl-holdings/shared-ui/ui/sonner';
import { cn } from '@szl-holdings/shared-ui/utils';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  FileText,
  GitBranch,
  Hash,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';

type Decision = 'pending' | 'approved' | 'rejected';

interface ProofEnvelope {
  id: string;
  matterId: string;
  recommendation: string;
  rationale: string;
  policyRefs: string[];
  evidenceRefs: string[];
  modelVersion: string;
  proofHash: string;
  confidence: number;
  riskIfApproved: string;
  riskIfRejected: string;
  proposedBy: string;
  proposedAt: string;
}

const proofs: ProofEnvelope[] = [
  {
    id: 'pe-2041',
    matterId: 'matter-001',
    recommendation: 'Reassign Draft Regulatory Report from Morrison & Vance → Sterling & Ross',
    rationale:
      'Morrison & Vance is 18 days overdue on the upstream Discovery Response and 32% below SLA on the current quarter. Sterling & Ross has 92% on-time and demonstrated capacity in identical jurisdictional filings (Q3 2025).',
    policyRefs: ['Engagement Policy §4.2', 'Reassignment Threshold §6.1'],
    evidenceRefs: ['firm-001 performance log', 'matter-001 dependency graph', 'obl-002 status'],
    modelVersion: 'counsel-os 0.6.2',
    proofHash: '0x8d1e4b9a...c290',
    confidence: 0.94,
    riskIfApproved: 'Single reassignment; ~$20K transition cost; preserves filing deadline.',
    riskIfRejected: '98% probability final filing slips ≥ 7 days; $4.1M exposure crystallises.',
    proposedBy: 'Counsel OS Engine',
    proposedAt: '2h ago',
  },
  {
    id: 'pe-2042',
    matterId: 'matter-001',
    recommendation: 'Trigger formal performance review of Morrison & Vance under MEL §4.2',
    rationale:
      'Three overdue deliverables this quarter, response time 36h vs. 8h SLA. Pattern matches escalation playbook EP-09.',
    policyRefs: ['Master Engagement Letter §4.2', 'Escalation Playbook EP-09'],
    evidenceRefs: ['firm-001 performance log', 'alert-003'],
    modelVersion: 'counsel-os 0.6.2',
    proofHash: '0x4f02ab17...11de',
    confidence: 0.88,
    riskIfApproved: 'Formal record initiated; firm relationship strain; auditable.',
    riskIfRejected: 'Pattern continues uncorrected; future SLA enforcement weakened.',
    proposedBy: 'Counsel OS Engine',
    proposedAt: '8h ago',
  },
  {
    id: 'pe-2043',
    matterId: 'matter-002',
    recommendation: 'Increase reserve estimate for Hargreave IP Settlement from $1.2M → $1.4M',
    rationale:
      "Counterparty's revised offer (received 26h ago) raises modeled probable exposure by 17% based on 3 comparable settlements.",
    policyRefs: ['Reserve Policy §3.4'],
    evidenceRefs: ['counterparty offer 2026-04-18', 'comparable matters CM-118, CM-204, CM-227'],
    modelVersion: 'counsel-os 0.6.2',
    proofHash: '0xb20c91fe...77a4',
    confidence: 0.69,
    riskIfApproved: 'Quarterly finance restatement; conservative posture.',
    riskIfRejected: 'Risk of under-reserving at quarter close; auditor inquiry probable.',
    proposedBy: 'Counsel OS Engine',
    proposedAt: '1d ago',
  },
  {
    id: 'pe-2044',
    matterId: 'matter-004',
    recommendation: 'Auto-draft EU clarification memo from prior 2025 framework',
    rationale:
      'Pending clarification on cross-border transfer mechanism is structurally identical to memo M-2025-08; reuse with regional substitutions.',
    policyRefs: ['Document Reuse Policy §2.1'],
    evidenceRefs: ['memo M-2025-08', 'obl-006 dependency'],
    modelVersion: 'counsel-os 0.6.2',
    proofHash: '0xe9a715c8...4031',
    confidence: 0.82,
    riskIfApproved: 'Saves ~6 paralegal hours; requires partner review before send.',
    riskIfRejected: 'Manual drafting risks 2-day slip on Data Map deliverable.',
    proposedBy: 'Counsel OS Engine',
    proposedAt: '1d ago',
  },
];

interface ApiMatter {
  id: string;
  name: string;
}

export default function Approvals() {
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [active, setActive] = useState<string | null>(proofs[0]?.id ?? null);

  const { data: mattersData, isLoading: mattersLoading, isError: mattersError } = useQuery<{ matters: ApiMatter[] }>({
    queryKey: ['counsel-matters-approvals'],
    queryFn: () => apiFetch<{ matters: ApiMatter[] }>('/counsel/matters'),
  });

  const matterById = useMemo(
    () => Object.fromEntries((mattersData?.matters ?? []).map((m) => [m.id, m])),
    [mattersData],
  );

  const pending = proofs.filter((p) => (decisions[p.id] ?? 'pending') === 'pending');
  const approved = proofs.filter((p) => decisions[p.id] === 'approved');
  const rejected = proofs.filter((p) => decisions[p.id] === 'rejected');

  const decide = (id: string, decision: Decision) => {
    setDecisions((prev) => ({ ...prev, [id]: decision }));
    toast.success(`${id} ${decision === 'approved' ? 'approved' : 'rejected'}`, {
      description: 'Proof envelope sealed and recorded to provenance ledger.',
    });
  };

  const activeProof = proofs.find((p) => p.id === active);
  const activeDecision = activeProof ? (decisions[activeProof.id] ?? 'pending') : 'pending';

  return (
    <div className="p-6 space-y-6">
      <header>
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle2 className="w-4 h-4 text-violet-400" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-violet-400/60">
            Operations · Approvals
          </span>
        </div>
        <h1 className="text-2xl font-bold text-violet-100">Approval Inbox</h1>
        <p className="text-violet-400/60 text-sm">
          Counsel OS escalation recommendations packaged as Proof Envelopes — review evidence, then
          approve or reject.
        </p>
      </header>

      {mattersLoading && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-500/5 border border-violet-500/15">
          <div className="w-4 h-4 border-2 border-violet-500/40 border-t-violet-400 rounded-full animate-spin shrink-0" />
          <span className="text-xs text-violet-400/70 font-mono">Loading matter context…</span>
        </div>
      )}

      {mattersError && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs text-amber-300/80">Matter names unavailable — matter IDs shown below.</span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-violet-500/5 border border-violet-500/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-violet-300/70">
              Pending
            </span>
          </div>
          <div className="text-3xl font-bold text-violet-50">{pending.length}</div>
        </div>
        <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-300/80">
              Approved
            </span>
          </div>
          <div className="text-3xl font-bold text-emerald-50">{approved.length}</div>
        </div>
        <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-3.5 h-3.5 text-red-400" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-red-300/80">
              Rejected
            </span>
          </div>
          <div className="text-3xl font-bold text-red-50">{rejected.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-widest text-violet-400/60 mb-1 px-1">
            Inbox · {proofs.length}
          </div>
          {proofs.map((p) => {
            const decision = decisions[p.id] ?? 'pending';
            const isActive = p.id === active;
            return (
              <button
                key={p.id}
                onClick={() => setActive(p.id)}
                className={cn(
                  'w-full text-left p-3 rounded-lg border transition-colors',
                  isActive
                    ? 'bg-violet-500/10 border-violet-500/30'
                    : 'bg-[#0a0614] border-violet-500/10 hover:border-violet-500/20',
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono text-violet-400/70">{p.id}</span>
                  {decision === 'pending' ? (
                    <span className="px-1.5 py-0.5 rounded bg-violet-500/10 border border-violet-500/20 text-[9px] font-mono text-violet-300">
                      PENDING
                    </span>
                  ) : decision === 'approved' ? (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-mono text-emerald-300">
                      APPROVED
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-[9px] font-mono text-red-300">
                      REJECTED
                    </span>
                  )}
                </div>
                <div className="text-xs font-semibold text-violet-100 leading-snug line-clamp-2">
                  {p.recommendation}
                </div>
                <div className="text-[10px] text-violet-400/60 mt-1.5 flex items-center gap-2">
                  <span>{matterById[p.matterId]?.name ?? p.matterId}</span>
                  <span>·</span>
                  <span>{p.proposedAt}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-3">
          {activeProof ? (
            <div className="bg-[#0a0614] border border-violet-500/15 rounded-xl p-5 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-violet-300" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-violet-400/60">
                      Proof Envelope · {activeProof.id}
                    </div>
                    <div className="text-[11px] text-violet-300/70">
                      {matterById[activeProof.matterId]?.name ?? activeProof.matterId}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] font-mono uppercase tracking-widest text-violet-400/50">
                    Confidence
                  </div>
                  <div
                    className={cn(
                      'text-2xl font-bold tabular-nums',
                      activeProof.confidence >= 0.9
                        ? 'text-emerald-300'
                        : activeProof.confidence >= 0.7
                          ? 'text-violet-200'
                          : 'text-amber-300',
                    )}
                  >
                    {(activeProof.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-violet-400/60 mb-1">
                  Recommendation
                </div>
                <div className="text-sm font-semibold text-violet-50 leading-snug">
                  {activeProof.recommendation}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-violet-400/60 mb-1">
                  Rationale
                </div>
                <p className="text-xs text-violet-200/80 leading-relaxed">
                  {activeProof.rationale}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                  <div className="text-[9px] font-mono uppercase tracking-widest text-emerald-300/80 mb-1">
                    If Approved
                  </div>
                  <p className="text-[11px] text-violet-100/80 leading-relaxed">
                    {activeProof.riskIfApproved}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/15">
                  <div className="text-[9px] font-mono uppercase tracking-widest text-red-300/80 mb-1">
                    If Rejected
                  </div>
                  <p className="text-[11px] text-violet-100/80 leading-relaxed">
                    {activeProof.riskIfRejected}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-violet-400/60 mb-1.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3" /> Policy References
                  </div>
                  <ul className="space-y-1">
                    {activeProof.policyRefs.map((r) => (
                      <li key={r} className="text-[11px] text-violet-200/80 font-mono">
                        · {r}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-violet-400/60 mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3 h-3" /> Evidence
                  </div>
                  <ul className="space-y-1">
                    {activeProof.evidenceRefs.map((r) => (
                      <li key={r} className="text-[11px] text-violet-200/80 font-mono">
                        · {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[10px] font-mono text-violet-400/60 pt-3 border-t border-violet-500/10">
                <span className="flex items-center gap-1">
                  <GitBranch className="w-3 h-3" /> {activeProof.modelVersion}
                </span>
                <span className="flex items-center gap-1">
                  <Hash className="w-3 h-3" /> {activeProof.proofHash}
                </span>
                <span className="flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" /> {activeProof.proposedBy}
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => decide(activeProof.id, 'approved')}
                  disabled={activeDecision !== 'pending'}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors',
                    'bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/25',
                    'disabled:opacity-40 disabled:cursor-not-allowed',
                  )}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => decide(activeProof.id, 'rejected')}
                  disabled={activeDecision !== 'pending'}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors',
                    'bg-red-500/10 border border-red-500/25 text-red-200 hover:bg-red-500/20',
                    'disabled:opacity-40 disabled:cursor-not-allowed',
                  )}
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </div>
            </div>
          ) : (
            <div className="text-violet-400/60 text-sm">Select a proof envelope to review.</div>
          )}
        </div>
      </div>
    </div>
  );
}
