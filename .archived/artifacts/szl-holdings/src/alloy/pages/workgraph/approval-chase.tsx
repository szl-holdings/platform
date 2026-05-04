import { useState } from 'react';
import { CheckSquare, AlertTriangle, Clock, CheckCircle, ArrowRight, Shield, Zap, User, TrendingUp } from 'lucide-react';
import { RISK_CONFIG, formatRelativeWG } from '@/alloy/data/workgraph';

const ACCENT = '#4B8BDB';

const DEMO_APPROVALS = [
  {
    id: 'ap001',
    title: 'Acme Corp Renewal — CFO Approval',
    project: 'Q2 Revenue Operations',
    requestedBy: 'James Park',
    requiredApprover: 'Marcus Webb (CFO)',
    amount: '$2,400,000',
    daysPending: 4,
    slaTarget: 2,
    riskLevel: 'high' as const,
    status: 'overdue' as const,
    escalationDraft: 'Marcus — the Acme Corp renewal ($2.4M ARR) has been pending your approval for 4 days against a 2-day SLA. This is the largest renewal in Q2 and James Park is waiting on your sign-off before Acme Corp can counter-sign. Please review the deal memo and approve at your earliest convenience.',
    evidenceRefs: ['email-001', 'sheet-003', 'doc-002'],
    skillUsed: 'Approval Chase',
    mirrorEvalScore: 93,
    proofReady: true,
  },
  {
    id: 'ap002',
    title: 'CloudOps SLA Penalty — Finance Director Approval',
    project: 'Private Advisory Vendor Controls',
    requestedBy: 'Sophie Laurent',
    requiredApprover: 'Finance Director (TBD)',
    amount: '$45,000',
    daysPending: 6,
    slaTarget: 5,
    riskLevel: 'high' as const,
    status: 'overdue' as const,
    escalationDraft: 'Finance Director — the CloudOps SLA penalty payment of $45,000 requires your approval. The payment is now Day 6 against a 5-day SLA. The CloudOps contract specifies a 30-day resolution window before interest accrues. Approval required immediately to avoid further exposure.',
    evidenceRefs: ['task-002', 'email-003'],
    skillUsed: 'Vendor SLA Escalation',
    mirrorEvalScore: 89,
    proofReady: false,
  },
  {
    id: 'ap003',
    title: 'Vertex Corp MSA Renewal — Legal Review',
    project: 'Legal Matter Deadline Audit',
    requestedBy: 'Ana Torres',
    requiredApprover: 'Ana Torres (General Counsel)',
    amount: '$890,000',
    daysPending: 11,
    slaTarget: 7,
    riskLevel: 'critical' as const,
    status: 'overdue' as const,
    escalationDraft: 'Ana — the Vertex Corp MSA renewal ($890K ARR) has been in legal review for 11 days against a 7-day SLA. The MSA expires in 14 days. The jurisdiction clause dispute needs to be resolved and the contract returned to Vertex Corp by end of week or we risk a lapse in coverage.',
    evidenceRefs: ['task-003', 'doc-003'],
    skillUsed: 'Legal Deadline Proof Review',
    mirrorEvalScore: 90,
    proofReady: false,
  },
  {
    id: 'ap004',
    title: '412 Fulton St CapEx — Board Sign-off',
    project: 'Property CapEx Review',
    requestedBy: 'Kenji Watanabe',
    requiredApprover: 'Board Approval Required',
    amount: '$12,400,000',
    daysPending: 3,
    slaTarget: 7,
    riskLevel: 'medium' as const,
    status: 'on_track' as const,
    escalationDraft: 'Board — the 412 Fulton St CapEx proposal (IRR: 14.2%) requires board approval before the LOI can be issued. Environmental clearance is pending (ETA: 5 days). Recommend scheduling board approval for next board session to avoid LOI timing pressure.',
    evidenceRefs: ['doc-004', 'sheet-004'],
    skillUsed: 'Approval Chase',
    mirrorEvalScore: 84,
    proofReady: false,
  },
  {
    id: 'ap005',
    title: 'Invoice Discrepancy — CloudOps INV-2026-Q2-047',
    project: 'Private Advisory Vendor Controls',
    requestedBy: 'Finance Team',
    requiredApprover: 'Marcus Webb (CFO)',
    amount: '$3,400 discrepancy',
    daysPending: 0,
    slaTarget: 3,
    riskLevel: 'low' as const,
    status: 'resolved' as const,
    escalationDraft: '',
    evidenceRefs: ['email-004', 'sheet-005'],
    skillUsed: 'Invoice Discrepancy Review',
    mirrorEvalScore: 88,
    proofReady: true,
  },
];

const STATUS_COLORS: Record<string, string> = {
  overdue: '#ef4444',
  on_track: '#10b981',
  resolved: '#4B8BDB',
  pending: '#f59e0b',
};

function ApprovalCard({ ap }: { ap: typeof DEMO_APPROVALS[0] }) {
  const [expanded, setExpanded] = useState(false);
  const [chasing, setChasing] = useState(false);
  const [chased, setChased] = useState(false);
  const risk = RISK_CONFIG[ap.riskLevel];
  const sc = STATUS_COLORS[ap.status] ?? '#6b7280';
  const latencyPct = Math.min(100, (ap.daysPending / ap.slaTarget) * 100);
  const latencyColor = latencyPct >= 100 ? '#ef4444' : latencyPct >= 80 ? '#f59e0b' : '#10b981';

  function chase() {
    setChasing(true);
    setTimeout(() => { setChasing(false); setChased(true); }, 2000);
  }

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: `${risk.color}20`, background: 'rgba(12,18,30,0.95)' }}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="text-xs font-bold text-white mb-0.5">{ap.title}</div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[8px] px-1.5 py-0.5 rounded capitalize font-medium"
                style={{ color: sc, background: `${sc}12` }}>
                {ap.status.replace('_', ' ')}
              </span>
              <span className="text-[8px] px-1.5 py-0.5 rounded font-medium"
                style={{ color: risk.color, background: risk.bg }}>
                {risk.label} risk
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-sm font-bold" style={{ color: ap.status === 'overdue' ? '#ef4444' : 'rgba(255,255,255,0.7)' }}>
              {ap.amount}
            </div>
            <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>at stake</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="p-2 rounded" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="text-[8px] uppercase tracking-wider mb-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>Requested by</div>
            <div className="text-[10px] text-white">{ap.requestedBy}</div>
          </div>
          <div className="p-2 rounded" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="text-[8px] uppercase tracking-wider mb-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>Required approver</div>
            <div className="text-[10px] text-white">{ap.requiredApprover}</div>
          </div>
        </div>

        {ap.status !== 'resolved' && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-[9px] mb-1">
              <span style={{ color: 'rgba(255,255,255,0.35)' }}>Decision latency vs. SLA</span>
              <span className="font-mono" style={{ color: latencyColor }}>
                Day {ap.daysPending} / {ap.slaTarget}-day SLA
              </span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, latencyPct)}%`, background: latencyColor }} />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button onClick={() => setExpanded(x => !x)}
            className="text-[9px] px-2.5 py-1 rounded border transition-all"
            style={{ color: ACCENT, borderColor: 'rgba(75,139,219,0.2)', background: 'rgba(75,139,219,0.06)' }}>
            {expanded ? 'Collapse' : 'View escalation draft'}
          </button>
          {ap.status !== 'resolved' && !chased && (
            <button onClick={chase} disabled={chasing}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ml-auto"
              style={{
                background: chasing ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.12)',
                color: '#f59e0b',
                border: '1px solid rgba(245,158,11,0.25)',
              }}>
              {chasing ? <><Clock className="w-3 h-3" /> Chasing…</> : <><ArrowRight className="w-3 h-3" /> Chase (demo)</>}
            </button>
          )}
          {chased && (
            <div className="ml-auto flex items-center gap-1 text-[10px]" style={{ color: '#10b981' }}>
              <CheckCircle className="w-3 h-3" /> Chase sent — Proof Packet created
            </div>
          )}
          {ap.proofReady && (
            <span className="ml-auto text-[9px] px-2 py-0.5 rounded" style={{ color: '#10b981', background: 'rgba(16,185,129,0.08)' }}>
              Proof ready
            </span>
          )}
        </div>
      </div>

      {expanded && ap.escalationDraft && (
        <div className="border-t px-4 pb-4 pt-3 space-y-3" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <div>
            <div className="text-[8px] uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Escalation Draft — MirrorEval {ap.mirrorEvalScore}%
            </div>
            <div className="text-[10px] p-3 rounded leading-relaxed"
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.65)' }}>
              {ap.escalationDraft}
            </div>
          </div>
          <div>
            <div className="text-[8px] uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Evidence References ({ap.evidenceRefs.length})
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {ap.evidenceRefs.map(ref => (
                <span key={ref} className="text-[9px] px-1.5 py-0.5 rounded font-mono"
                  style={{ color: 'rgba(75,139,219,0.8)', background: 'rgba(75,139,219,0.08)', border: '1px solid rgba(75,139,219,0.15)' }}>
                  {ref}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded text-[10px]"
            style={{ background: 'rgba(75,139,219,0.05)', border: '1px solid rgba(75,139,219,0.1)' }}>
            <Shield className="w-3 h-3 shrink-0" style={{ color: 'rgba(75,139,219,0.6)' }} />
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>
              Skill: {ap.skillUsed}. Owner review required before send. Proof Packet created on send.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ApprovalChase() {
  const overdue = DEMO_APPROVALS.filter(a => a.status === 'overdue').length;
  const totalValue = '$3.3M';

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CheckSquare className="w-3.5 h-3.5" style={{ color: ACCENT }} />
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: ACCENT }}>
              Alloy WorkGraph · Approval Chase
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Approval Chase</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Stuck approvals detected, escalation drafts ready, evidence linked. Every chase is logged to the Proof Chain.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border"
          style={{ color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.08)' }}>
          <Zap className="w-2.5 h-2.5" /> Demo Mode
        </div>
      </div>

      {overdue > 0 && (
        <div className="p-3 rounded-xl border flex items-center gap-3"
          style={{ borderColor: 'rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.06)' }}>
          <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: '#ef4444' }} />
          <div className="flex-1">
            <div className="text-xs font-semibold" style={{ color: '#ef4444' }}>
              {overdue} approvals overdue — {totalValue} at risk
            </div>
            <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Average decision latency: 7.3 days vs. 2-day target. Escalation recommended.
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Approvals', value: DEMO_APPROVALS.length, color: ACCENT },
          { label: 'Overdue', value: overdue, color: '#ef4444' },
          { label: 'Revenue at Risk', value: totalValue, color: '#f59e0b' },
          { label: 'Proof Ready', value: DEMO_APPROVALS.filter(a => a.proofReady).length, color: '#10b981' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border p-3" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(12,18,30,0.95)' }}>
            <div className="text-[9px] uppercase tracking-widest font-mono mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.label}</div>
            <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {DEMO_APPROVALS.map(ap => (
          <ApprovalCard key={ap.id} ap={ap} />
        ))}
      </div>

      <div className="p-3 rounded-xl border" style={{ borderColor: 'rgba(75,139,219,0.15)', background: 'rgba(75,139,219,0.04)' }}>
        <div className="flex items-start gap-2">
          <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'rgba(75,139,219,0.6)' }} />
          <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
            <strong className="text-white">Approval Chase governance:</strong> Escalation drafts are generated by the Approval Chase skill and require human review before sending. Every chase is logged with evidence references. Proof Packets are created on send. Decision latency is tracked against declared SLAs.
          </div>
        </div>
      </div>
    </div>
  );
}
