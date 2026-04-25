import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { DataStateBadge } from '@szl-holdings/shared-ui/data-state-badge';
import { useQueryClient } from '@tanstack/react-query';
import {
  Brain,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Filter,
  Radio,
  RefreshCw,
  Shield,
  User,
  XCircle,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

interface Decision {
  id: number;
  title: string;
  summary: string | null;
  verdict: string | null;
  confidence: number | null;
  approvalStatus: 'propose_only' | 'approval_required' | 'approved_execute' | 'blocked_by_policy';
  evidence: Array<{ source: string; snippet: string; confidence: number }> | null;
  agentId: string | null;
  agentName: string | null;
  modelUsed: string | null;
  workflowRunId: number | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

const DEMO_DECISIONS: Decision[] = [
  {
    id: 1,
    title: 'Approve contract renewal for Acme Corp ($2.4M annual)',
    summary:
      'Based on account health metrics, payment history, and engagement data, recommend renewing at current tier with 8% increase.',
    verdict: 'Recommend renewal at $2.4M with standard SLA terms. Risk level: LOW.',
    confidence: 94,
    approvalStatus: 'approval_required',
    evidence: [
      {
        source: 'CRM System',
        snippet: 'Acme Corp: 98% on-time payment over 36 months. NPS: 72. Account health: A+',
        confidence: 0.97,
      },
      {
        source: 'Usage Analytics',
        snippet: 'Product usage up 34% YoY. Feature adoption rate: 89%. No churn signals.',
        confidence: 0.93,
      },
      {
        source: 'Comparable Deals',
        snippet: '5 similar renewals at 6-10% increase. Market rate supports 8% lift.',
        confidence: 0.88,
      },
    ],
    agentId: 'contract-agent',
    agentName: 'Contract Intelligence',
    modelUsed: 'claude-sonnet-4-6',
    workflowRunId: 101,
    reviewedBy: null,
    reviewedAt: null,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 2,
    title: 'Escalate CloudOps vendor risk to CISO',
    summary:
      'Vendor risk assessment reveals elevated exposure. Recommending escalation for executive review.',
    verdict: 'Escalate to CISO with full risk dossier. SLA: 48h.',
    confidence: 81,
    approvalStatus: 'propose_only',
    evidence: [
      {
        source: 'Security Questionnaire',
        snippet:
          'CloudOps SOC 2 Type II: Pending. Last audit: 14 months ago. Gap: access controls.',
        confidence: 0.78,
      },
      {
        source: 'Threat Intelligence',
        snippet: '3 CVEs associated with CloudOps stack (CVSS avg: 6.8). Patch cadence: subpar.',
        confidence: 0.82,
      },
    ],
    agentId: 'risk-agent',
    agentName: 'Risk Assessment Agent',
    modelUsed: 'gpt-5.2',
    workflowRunId: 102,
    reviewedBy: null,
    reviewedAt: null,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 3,
    title: 'Approve invoice payment — AWS Q2 services $48,200',
    summary: 'Standard quarterly cloud services invoice within approved budget envelope.',
    verdict: 'Approve for payment processing. Under budget authority.',
    confidence: 98,
    approvalStatus: 'approved_execute',
    evidence: [
      {
        source: 'Budget System',
        snippet: 'Q2 cloud budget: $180K. YTD spend: $127K. This invoice: within envelope.',
        confidence: 0.99,
      },
      {
        source: 'PO Verification',
        snippet: 'PO-2026-Q2-AWS matches invoice line items. All services actively used.',
        confidence: 0.97,
      },
    ],
    agentId: 'finance-agent',
    agentName: 'Finance Processing Agent',
    modelUsed: 'gpt-5.2',
    workflowRunId: 103,
    reviewedBy: 'Sarah Chen',
    reviewedAt: new Date(Date.now() - 1800000).toISOString(),
    createdAt: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: 4,
    title: 'Block automated data export to third-party analytics',
    summary: 'Attempted action violates data residency policy. Export blocked by governance rule.',
    verdict: 'BLOCKED: Data export to non-approved jurisdiction violates Policy DG-2024-07.',
    confidence: 99,
    approvalStatus: 'blocked_by_policy',
    evidence: [
      {
        source: 'Policy Engine',
        snippet:
          'Rule DG-2024-07: Customer PII must not leave EU-WEST-1 zone. Target: us-east-2. Violation.',
        confidence: 0.99,
      },
    ],
    agentId: 'governance-agent',
    agentName: 'Governance Sentinel',
    modelUsed: 'claude-sonnet-4-6',
    workflowRunId: 104,
    reviewedBy: null,
    reviewedAt: null,
    createdAt: new Date(Date.now() - 600000).toISOString(),
  },
];

const APPROVAL_STATUS_CONFIG: Record<
  string,
  { color: string; bg: string; border: string; label: string; icon: React.ReactNode }
> = {
  propose_only: {
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.2)',
    label: 'Propose Only',
    icon: <Zap className="w-3 h-3" />,
  },
  approval_required: {
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.08)',
    border: 'rgba(139,92,246,0.2)',
    label: 'Approval Required',
    icon: <Clock className="w-3 h-3" />,
  },
  approved_execute: {
    color: '#10b981',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.2)',
    label: 'Approved & Execute',
    icon: <CheckCircle className="w-3 h-3" />,
  },
  blocked_by_policy: {
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.2)',
    label: 'Blocked by Policy',
    icon: <Shield className="w-3 h-3" />,
  },
};

function formatRelative(ts: string | null) {
  if (!ts) return '—';
  const ms = Date.now() - new Date(ts).getTime();
  if (ms < 60000) return 'just now';
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
  return `${Math.floor(ms / 86400000)}d ago`;
}

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 90 ? '#10b981' : value >= 70 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="text-[10px] font-mono shrink-0" style={{ color }}>
        {value}%
      </span>
    </div>
  );
}

function DecisionCard({
  decision,
  onApprove,
  onReject,
}: {
  decision: Decision;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg =
    APPROVAL_STATUS_CONFIG[decision.approvalStatus] ?? APPROVAL_STATUS_CONFIG.propose_only;
  const confidence = decision.confidence ?? 75;

  return (
    <div
      className="rounded-xl border overflow-hidden transition-all"
      style={{ borderColor: cfg.border, background: 'rgba(12,18,30,0.95)' }}
    >
      <div className="p-4 cursor-pointer" onClick={() => setExpanded((e) => !e)}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span
                className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border"
                style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
              >
                {cfg.icon} {cfg.label}
              </span>
              {decision.agentName && (
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded font-mono"
                  style={{
                    color: 'rgba(75,139,219,0.6)',
                    background: 'rgba(75,139,219,0.06)',
                    border: '1px solid rgba(75,139,219,0.1)',
                  }}
                >
                  {decision.agentName}
                </span>
              )}
              {decision.modelUsed && (
                <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  {decision.modelUsed}
                </span>
              )}
            </div>
            <div className="text-sm font-semibold text-white">{decision.title}</div>
            {decision.summary && (
              <div
                className="text-[10px] mt-1 line-clamp-2"
                style={{ color: 'rgba(255,255,255,0.45)' }}
              >
                {decision.summary}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
              {formatRelative(decision.createdAt)}
            </span>
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-[9px] uppercase tracking-widest"
            style={{ color: 'rgba(255,255,255,0.25)' }}
          >
            Confidence
          </span>
          <div className="flex-1">
            <ConfidenceBar value={confidence} />
          </div>
        </div>
      </div>

      {expanded && (
        <div
          className="border-t px-4 pb-4 pt-3 space-y-3"
          style={{ borderColor: 'rgba(255,255,255,0.05)' }}
        >
          {decision.verdict && (
            <div
              className="rounded-lg p-3"
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <div
                className="text-[9px] uppercase tracking-widest mb-1.5"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                Verdict
              </div>
              <div className="text-[11px] text-white leading-relaxed">{decision.verdict}</div>
            </div>
          )}

          {decision.evidence && decision.evidence.length > 0 && (
            <div>
              <div
                className="text-[9px] uppercase tracking-widest mb-2"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                Supporting Evidence
              </div>
              <div className="space-y-1.5">
                {decision.evidence.map((ev, i) => (
                  <div
                    key={i}
                    className="rounded-lg p-2.5"
                    style={{
                      background: 'rgba(0,0,0,0.2)',
                      border: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-[9px] font-medium"
                        style={{ color: 'rgba(75,139,219,0.7)' }}
                      >
                        {ev.source}
                      </span>
                      <span
                        className="text-[9px] font-mono"
                        style={{ color: 'rgba(255,255,255,0.3)' }}
                      >
                        {Math.round(ev.confidence * 100)}% conf
                      </span>
                    </div>
                    <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {ev.snippet}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {decision.workflowRunId && (
              <div
                className="rounded-lg p-2.5"
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <div
                  className="text-[9px] uppercase tracking-widest mb-1"
                  style={{ color: 'rgba(255,255,255,0.25)' }}
                >
                  Workflow Run
                </div>
                <div className="text-[10px] font-mono text-white">#{decision.workflowRunId}</div>
              </div>
            )}
            {decision.reviewedBy && (
              <div
                className="rounded-lg p-2.5"
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <div
                  className="text-[9px] uppercase tracking-widest mb-1"
                  style={{ color: 'rgba(255,255,255,0.25)' }}
                >
                  Reviewed By
                </div>
                <div className="text-[10px] text-white flex items-center gap-1">
                  <User className="w-2.5 h-2.5" />
                  {decision.reviewedBy}
                </div>
              </div>
            )}
          </div>

          {decision.approvalStatus === 'approval_required' && !decision.reviewedBy && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onApprove(decision.id);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all hover:opacity-80"
                style={{
                  borderColor: 'rgba(16,185,129,0.3)',
                  background: 'rgba(16,185,129,0.1)',
                  color: '#10b981',
                }}
              >
                <CheckCircle className="w-3 h-3" /> Approve & Execute
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReject(decision.id);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all hover:opacity-80"
                style={{
                  borderColor: 'rgba(239,68,68,0.3)',
                  background: 'rgba(239,68,68,0.1)',
                  color: '#ef4444',
                }}
              >
                <XCircle className="w-3 h-3" /> Reject
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DecisionObjects() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const qc = useQueryClient();

  const {
    data: apiDecisions,
    isLoading,
    isError,
  } = useStandardQuery({
    queryKey: ['alloyDecisions', statusFilter],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({ limit: '30' });
        if (statusFilter !== 'all') params.set('status', statusFilter);
        const r = await apiFetch<{ data: Decision[] } | Decision[]>(`/alloy/decisions?${params}`);
        if (r && 'data' in r) return r.data;
        return r as Decision[];
      } catch {
        return null;
      }
    },
    refetchInterval: 30000,
    retry: 1,
  });

  const approveDecision = useStandardMutation({
    mutationFn: async (id: number) => {
      try {
        return await apiFetch(`/alloy/decisions/${id}/approve`, { method: 'POST' });
      } catch {
        return null;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alloyDecisions'] }),
  });

  const rejectDecision = useStandardMutation({
    mutationFn: async (id: number) => {
      try {
        return await apiFetch(`/alloy/decisions/${id}/reject`, { method: 'POST' });
      } catch {
        return null;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alloyDecisions'] }),
  });

  const isDemo = isError || (!isLoading && (!apiDecisions || apiDecisions.length === 0));
  const decisions = isDemo ? DEMO_DECISIONS : (apiDecisions ?? []);

  const filtered =
    statusFilter === 'all' ? decisions : decisions.filter((d) => d.approvalStatus === statusFilter);

  const counts = {
    all: decisions.length,
    propose_only: decisions.filter((d) => d.approvalStatus === 'propose_only').length,
    approval_required: decisions.filter((d) => d.approvalStatus === 'approval_required').length,
    approved_execute: decisions.filter((d) => d.approvalStatus === 'approved_execute').length,
    blocked_by_policy: decisions.filter((d) => d.approvalStatus === 'blocked_by_policy').length,
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-3.5 h-3.5" style={{ color: '#4B8BDB' }} />
            <span
              className="text-[10px] font-bold uppercase tracking-widest font-mono"
              style={{ color: '#4B8BDB' }}
            >
              Counsel · Decision Objects
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Decision Objects</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Every consequential agent output — verdict, evidence, confidence, and approval chain.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDemo && <DataStateBadge state="demo" />}
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ['alloyDecisions'] })}
            className="flex items-center gap-1.5 text-[11px] border px-3 py-1.5 rounded-lg transition-colors hover:bg-white/5 shrink-0"
            style={{ color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      {isDemo && (
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-medium"
          style={{
            background: 'rgba(75,139,219,0.04)',
            border: '1px solid rgba(75,139,219,0.1)',
            color: 'rgba(75,139,219,0.6)',
          }}
        >
          <Radio className="w-3 h-3 shrink-0 animate-pulse" />
          Demo Environment — Showing illustrative decision objects. Connect the Counsel API for live
          data.
        </div>
      )}

      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.015)' }}
      >
        <div className="flex items-stretch">
          {Object.entries(APPROVAL_STATUS_CONFIG).map(([key, cfg], i) => (
            <div
              key={key}
              className="flex-1 px-3 py-3 text-center"
              style={{ borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
            >
              <div className="text-lg font-bold font-mono mb-0.5" style={{ color: cfg.color }}>
                {counts[key as keyof typeof counts] ?? 0}
              </div>
              <div
                className="text-[8px] font-medium uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                {cfg.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div
          className="flex items-center gap-1 text-[10px]"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          <Filter className="w-3 h-3" /> Filter:
        </div>
        {[
          { key: 'all', label: 'All' },
          ...Object.entries(APPROVAL_STATUS_CONFIG).map(([key, cfg]) => ({
            key,
            label: cfg.label,
          })),
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className="text-[10px] px-2.5 py-1 rounded-lg border capitalize transition-all"
            style={{
              background:
                statusFilter === f.key ? 'rgba(75,139,219,0.08)' : 'rgba(255,255,255,0.02)',
              borderColor:
                statusFilter === f.key ? 'rgba(75,139,219,0.3)' : 'rgba(255,255,255,0.06)',
              color: statusFilter === f.key ? '#4B8BDB' : 'rgba(255,255,255,0.35)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-xl border border-white/5 animate-pulse" />
          ))}
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((d) => (
          <DecisionCard
            key={d.id}
            decision={d}
            onApprove={(id) => approveDecision.mutate(id)}
            onReject={(id) => rejectDecision.mutate(id)}
          />
        ))}
        {!isLoading && filtered.length === 0 && (
          <div
            className="rounded-xl border p-12 text-center"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <Brain className="w-8 h-8 mx-auto mb-3" style={{ color: 'rgba(75,139,219,0.3)' }} />
            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
              No decision objects found
            </p>
            <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Decisions are created automatically when agents complete consequential actions
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
