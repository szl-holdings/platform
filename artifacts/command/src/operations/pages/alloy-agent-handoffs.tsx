import { api } from '@lyte/lib/api';
import { useStandardQuery } from '@szl-holdings/api-client-react';
import {
  Activity,
  ArrowRight,
  CheckCircle,
  ChevronRight,
  Clock,
  FileText,
  Network,
  RefreshCw,
  Shield,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';

const BG = { page: '#080c14', surface: '#0c1018', elevated: '#10141e' };
const BORDER = { subtle: 'rgba(255,255,255,0.04)', muted: 'rgba(255,255,255,0.07)' };
const TEXT = {
  primary: 'rgba(255,255,255,0.88)',
  secondary: 'rgba(255,255,255,0.55)',
  tertiary: 'rgba(255,255,255,0.28)',
  muted: 'rgba(255,255,255,0.14)',
};
const ACCENT = '#d4a054';

type HandoffStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'failed' | 'rejected';

interface AgentHandoff {
  id: string;
  fromAgent: string;
  toAgent: string;
  toAgentType: 'internal' | 'remote';
  subtask: string;
  context: string;
  status: HandoffStatus;
  initiatedAt: string;
  completedAt?: string;
  receiptId?: string;
  confidence?: number;
  pack: string;
  packColor: string;
  evidence?: string[];
  result?: string;
  failureReason?: string;
}

type LucideIcon = React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
const STATUS_CFG: Record<
  HandoffStatus,
  { color: string; bg: string; icon: LucideIcon; label: string }
> = {
  pending: { color: '#d4a054', bg: 'rgba(212,160,84,0.1)', icon: Clock, label: 'Pending' },
  accepted: { color: '#4a90b8', bg: 'rgba(74,144,184,0.1)', icon: CheckCircle, label: 'Accepted' },
  in_progress: {
    color: '#d4a054',
    bg: 'rgba(212,160,84,0.1)',
    icon: Activity,
    label: 'In Progress',
  },
  completed: {
    color: '#6b8f71',
    bg: 'rgba(107,143,113,0.1)',
    icon: CheckCircle,
    label: 'Completed',
  },
  failed: { color: '#c45a4a', bg: 'rgba(196,90,74,0.1)', icon: XCircle, label: 'Failed' },
  rejected: { color: '#c45a4a', bg: 'rgba(196,90,74,0.1)', icon: XCircle, label: 'Rejected' },
};

const HANDOFFS: AgentHandoff[] = [
  {
    id: 'A2A-0041',
    fromAgent: 'Counsel Orchestrator',
    toAgent: 'Vessels Route Optimizer',
    toAgentType: 'internal',
    subtask: 'Calculate alternate routes for 3 vessels affected by Pacific storm',
    context: 'Storm impact radius: 450nm · Fleet: Pacific cluster · SLA: 6h deadline',
    status: 'completed',
    initiatedAt: '2026-04-01 03:22:00Z',
    completedAt: '2026-04-01 03:24:18Z',
    receiptId: 'REC-A2A-0041',
    confidence: 0.92,
    pack: 'SEXTANT',
    packColor: '#38bdf8',
    evidence: [
      '3 vessels within storm radius',
      '2 viable alternate routes identified',
      'ETA delta: +14h average',
    ],
    result:
      'Routes calculated: Northern bypass (14h delay) and Southern deviation (18h delay). Recommended: Northern bypass. Fleet Ops approval gate inserted.',
  },
  {
    id: 'A2A-0040',
    fromAgent: 'Counsel Orchestrator',
    toAgent: 'Terra Valuation Agent',
    toAgentType: 'internal',
    subtask: 'Run DCF valuation on 2 assets flagged by ownership conflict detector',
    context:
      'Assets: TA-007, TA-012 · Conflict type: overlapping ownership claims · Priority: HIGH',
    status: 'completed',
    initiatedAt: '2026-04-01 01:04:00Z',
    completedAt: '2026-04-01 01:06:38Z',
    receiptId: 'REC-A2A-0040',
    confidence: 0.88,
    pack: 'DOMAINE',
    packColor: '#a07848',
    evidence: [
      'TA-007: NAV $14.2M, 3 conflicting owners',
      'TA-012: NAV $8.7M, 2 conflicting owners',
      'Resolution path: single-owner assignment',
    ],
    result:
      'Valuations complete. Conflict resolution recommendations issued. Finance approval required for ownership re-assignment.',
  },
  {
    id: 'A2A-0039',
    fromAgent: 'Counsel Orchestrator',
    toAgent: 'PARAGON Compliance Agent',
    toAgentType: 'internal',
    subtask: 'Verify security controls for Q1 compliance certification',
    context: 'Framework: NIST CSF · Scope: 47 controls · Deadline: Q1 close',
    status: 'in_progress',
    initiatedAt: '2026-04-01 03:00:00Z',
    pack: 'PARAGON',
    packColor: '#4f6ef7',
    confidence: 0.79,
    evidence: ['28/47 controls assessed so far', '3 medium gaps identified', '0 critical findings'],
  },
  {
    id: 'A2A-0038',
    fromAgent: 'Counsel Orchestrator',
    toAgent: 'PRISM Legal Research Agent',
    toAgentType: 'internal',
    subtask: 'Research jurisdiction-specific charter compliance requirements for Vessel MV-009',
    context: 'Vessel: MV-009 · Port: Port of Rotterdam · Cargo: Chemicals (Class 3)',
    status: 'pending',
    initiatedAt: '2026-04-01 03:30:00Z',
    pack: 'PRAXIS',
    packColor: '#d4a054',
  },
  {
    id: 'A2A-0037',
    fromAgent: 'Counsel Orchestrator',
    toAgent: 'ext:weather-forecast-api',
    toAgentType: 'remote',
    subtask: 'Fetch 72h weather forecast for Pacific shipping corridor (lat 30-45N, lon 140-165E)',
    context: 'Resolution: 6h intervals · Format: A2A structured · Auth: Bearer token',
    status: 'completed',
    initiatedAt: '2026-04-01 03:20:00Z',
    completedAt: '2026-04-01 03:20:04Z',
    receiptId: 'REC-A2A-0037',
    confidence: 0.97,
    pack: 'SEXTANT',
    packColor: '#38bdf8',
    evidence: [
      'Storm system detected 38.2N 151.4E',
      'Wind speed: 62 knots peak',
      'Forecast valid through 2026-04-04',
    ],
    result:
      '72h forecast delivered in A2A structured format. Storm advisory in effect for Pacific corridor.',
  },
  {
    id: 'A2A-0036',
    fromAgent: 'Counsel Orchestrator',
    toAgent: 'ext:credit-rating-service',
    toAgentType: 'remote',
    subtask: 'Fetch current credit rating for charter counterparty: Maritime Holdings Ltd',
    context: 'Entity: Maritime Holdings Ltd · Registry: Lloyds · Purpose: Contract due diligence',
    status: 'failed',
    initiatedAt: '2026-04-01 02:55:00Z',
    completedAt: '2026-04-01 02:56:12Z',
    pack: 'SEXTANT',
    packColor: '#38bdf8',
    failureReason: 'Remote agent returned error 429 — rate limit exceeded. Retry scheduled in 2h.',
  },
];

function StatusBadge({ status }: { status: HandoffStatus }) {
  const cfg = STATUS_CFG[status];
  const Icon = cfg.icon;
  return (
    <span
      className="flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-semibold font-mono"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}20` }}
    >
      <Icon className="w-2.5 h-2.5" /> {cfg.label}
    </span>
  );
}

function HandoffRow({ handoff }: { handoff: AgentHandoff }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-md overflow-hidden"
      style={{
        background: BG.surface,
        border: `1px solid ${handoff.status === 'failed' ? 'rgba(196,90,74,0.15)' : BORDER.subtle}`,
      }}
    >
      <button
        className="w-full flex items-start gap-3 p-3.5 text-left hover:bg-white/[0.015] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div
          className="w-1.5 shrink-0 mt-1.5 h-10 rounded-full"
          style={{ background: `${STATUS_CFG[handoff.status].color}50` }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest"
              style={{ color: handoff.packColor, background: `${handoff.packColor}14` }}
            >
              {handoff.pack}
            </span>
            <StatusBadge status={handoff.status} />
            <span
              className={`text-[7px] font-mono px-1.5 py-0.5 rounded`}
              style={{
                color: handoff.toAgentType === 'remote' ? '#c8953c' : '#4a90b8',
                background:
                  handoff.toAgentType === 'remote'
                    ? 'rgba(200,149,60,0.08)'
                    : 'rgba(74,144,184,0.08)',
              }}
            >
              {handoff.toAgentType === 'remote' ? 'REMOTE' : 'INTERNAL'}
            </span>
            <span className="text-[7px] font-mono" style={{ color: TEXT.muted }}>
              {handoff.id}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[9px] mb-0.5">
            <span className="font-mono" style={{ color: TEXT.tertiary }}>
              {handoff.fromAgent}
            </span>
            <ArrowRight className="w-2.5 h-2.5 shrink-0" style={{ color: TEXT.muted }} />
            <span className="font-mono" style={{ color: TEXT.secondary }}>
              {handoff.toAgent}
            </span>
          </div>
          <p className="text-[10px]" style={{ color: TEXT.primary }}>
            {handoff.subtask}
          </p>
          <div className="flex items-center gap-3 mt-1 text-[8px]" style={{ color: TEXT.muted }}>
            <span>Started: {handoff.initiatedAt.split('Z')[0]}</span>
            {handoff.completedAt && <span>· Completed: {handoff.completedAt.split('Z')[0]}</span>}
            {handoff.confidence && (
              <span>· {Math.round(handoff.confidence * 100)}% confidence</span>
            )}
            {handoff.receiptId && (
              <span className="flex items-center gap-0.5" style={{ color: '#6b8f71' }}>
                <Shield className="w-2 h-2" /> Receipt: {handoff.receiptId}
              </span>
            )}
          </div>
        </div>
        <ChevronRight
          className={`w-3.5 h-3.5 shrink-0 mt-1 transition-transform ${expanded ? 'rotate-90' : ''}`}
          style={{ color: TEXT.muted }}
        />
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3" style={{ borderTop: `1px solid ${BORDER.subtle}` }}>
          <div className="pt-3 text-[9px] space-y-1">
            <div
              className="text-[8px] uppercase tracking-widest mb-1.5"
              style={{ color: TEXT.muted }}
            >
              Context Passed
            </div>
            <div
              className="rounded p-2.5"
              style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}
            >
              <p style={{ color: TEXT.secondary }}>{handoff.context}</p>
            </div>
          </div>

          {handoff.evidence && (
            <div>
              <div
                className="text-[8px] uppercase tracking-widest mb-1.5"
                style={{ color: TEXT.muted }}
              >
                Evidence
              </div>
              <div className="space-y-1">
                {handoff.evidence.map((e, i) => (
                  <div key={i} className="flex items-center gap-2 text-[9px]">
                    <ArrowRight className="w-2.5 h-2.5 shrink-0" style={{ color: TEXT.muted }} />
                    <span style={{ color: TEXT.secondary }}>{e}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {handoff.result && (
            <div
              className="rounded p-2.5"
              style={{
                background: 'rgba(107,143,113,0.04)',
                border: '1px solid rgba(107,143,113,0.12)',
              }}
            >
              <div
                className="text-[8px] uppercase tracking-widest mb-1"
                style={{ color: '#6b8f71' }}
              >
                Result
              </div>
              <p className="text-[9px]" style={{ color: TEXT.secondary }}>
                {handoff.result}
              </p>
            </div>
          )}

          {handoff.failureReason && (
            <div
              className="rounded p-2.5"
              style={{
                background: 'rgba(196,90,74,0.04)',
                border: '1px solid rgba(196,90,74,0.12)',
              }}
            >
              <div
                className="text-[8px] uppercase tracking-widest mb-1"
                style={{ color: '#c45a4a' }}
              >
                Failure Reason
              </div>
              <p className="text-[9px]" style={{ color: '#c45a4a' }}>
                {handoff.failureReason}
              </p>
            </div>
          )}

          {handoff.receiptId && (
            <div
              className="rounded p-2.5 flex items-center justify-between"
              style={{
                background: 'rgba(107,143,113,0.04)',
                border: '1px solid rgba(107,143,113,0.12)',
              }}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-3 h-3" style={{ color: '#6b8f71' }} />
                <span className="text-[9px] font-mono" style={{ color: '#6b8f71' }}>
                  Delegation Receipt: {handoff.receiptId}
                </span>
              </div>
              <span className="text-[8px] font-mono" style={{ color: TEXT.muted }}>
                Signed · Immutable
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const VALID_HANDOFF_STATUSES: HandoffStatus[] = [
  'pending',
  'accepted',
  'in_progress',
  'completed',
  'failed',
  'rejected',
];

function toHandoffStatus(raw: unknown): HandoffStatus {
  const s = String(raw ?? 'pending');
  return VALID_HANDOFF_STATUSES.includes(s as HandoffStatus) ? (s as HandoffStatus) : 'pending';
}

function mapApiHandoff(h: Record<string, unknown>): AgentHandoff {
  const reqSchema = (h.requestSchema as Record<string, unknown>) ?? {};
  const respSchema = (h.responseSchema as Record<string, unknown>) ?? {};
  return {
    id: String(h.id ?? h.contractId ?? `A2A-${Date.now()}`),
    fromAgent: String(h.sourcePackId ?? 'Counsel Orchestrator'),
    toAgent: String(h.targetPackId ?? h.targetEndpoint ?? 'External Agent'),
    toAgentType: h.targetPackId ? 'internal' : 'remote',
    subtask: String(h.description ?? h.name ?? 'Delegated subtask'),
    context: String(reqSchema.description ?? JSON.stringify(h.inputParams ?? {}).slice(0, 120)),
    status: toHandoffStatus(h.status),
    initiatedAt: String(h.createdAt ?? new Date().toISOString()),
    confidence: typeof h.confidence === 'number' ? h.confidence : undefined,
    pack: String(h.sourcePackId ?? 'Counsel'),
    packColor: '#d4a054',
    evidence: typeof h.examples === 'string' ? [h.examples] : [],
    result: String(respSchema.description ?? '—'),
  };
}

function mapApiHandoffHistory(h: Record<string, unknown>): AgentHandoff {
  return {
    id: String(h.id ?? `A2A-HIS-${Date.now()}`),
    fromAgent: String(h.sourcePackId ?? 'Counsel Orchestrator'),
    toAgent: String(h.targetPackId ?? 'External Agent'),
    toAgentType: h.targetPackId ? 'internal' : 'remote',
    subtask: String(h.taskDescription ?? h.requestSummary ?? 'Delegated subtask'),
    context: String(h.contextSnapshot ?? '—'),
    status: toHandoffStatus(h.status),
    initiatedAt: String(h.initiatedAt ?? h.createdAt ?? new Date().toISOString()),
    completedAt: h.completedAt ? String(h.completedAt) : undefined,
    receiptId: h.receiptId ? String(h.receiptId) : undefined,
    confidence: typeof h.confidence === 'number' ? h.confidence : undefined,
    pack: String(h.sourcePackId ?? 'Counsel'),
    packColor: '#d4a054',
    evidence: Array.isArray(h.evidenceItems) ? (h.evidenceItems as string[]) : [],
    result: typeof h.result === 'string' ? h.result : undefined,
    failureReason: typeof h.failureReason === 'string' ? h.failureReason : undefined,
  };
}

export default function AlloyAgentHandoffsPage() {
  const [filter, setFilter] = useState<'all' | HandoffStatus>('all');

  const { data: contractsData, isLoading: contractsLoading } = useStandardQuery({
    queryKey: ['handoff-contracts'],
    queryFn: () => api.handoffs.contracts(),
    staleTime: 60_000,
  });

  const { data: historyData, isLoading: historyLoading } = useStandardQuery({
    queryKey: ['handoff-history'],
    queryFn: () => api.handoffs.history({ limit: 20 }),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const contractHandoffs: AgentHandoff[] = (contractsData?.contracts ?? []).map(mapApiHandoff);
  const historyHandoffs: AgentHandoff[] = (historyData?.handoffs ?? []).map(mapApiHandoffHistory);
  const apiHandoffs = [...historyHandoffs, ...contractHandoffs];
  const allHandoffs = apiHandoffs.length > 0 ? [...apiHandoffs, ...HANDOFFS] : HANDOFFS;

  const filtered = filter === 'all' ? allHandoffs : allHandoffs.filter((h) => h.status === filter);
  const counts = {
    pending: allHandoffs.filter((h) => h.status === 'pending').length,
    in_progress: allHandoffs.filter((h) => h.status === 'in_progress').length,
    completed: allHandoffs.filter((h) => h.status === 'completed').length,
    failed: allHandoffs.filter((h) => h.status === 'failed').length,
  };
  const isLoading = contractsLoading || historyLoading;

  return (
    <div className="p-4 md:p-5 space-y-5" style={{ background: BG.page, minHeight: '100vh' }}>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Network className="w-3.5 h-3.5" style={{ color: ACCENT }} />
          <span
            className="text-[9px] font-mono uppercase tracking-widest"
            style={{ color: ACCENT }}
          >
            Counsel · A2A Protocol
          </span>
        </div>
        <h1 className="text-lg font-bold tracking-tight" style={{ color: TEXT.primary }}>
          Agent Handoffs
        </h1>
        <p className="text-[11px] mt-0.5" style={{ color: TEXT.secondary }}>
          A2A-compatible delegation protocol for subtask handoffs to specialized agents. Each
          delegation is tracked with a structured receipt.
        </p>
      </div>

      <div
        className="rounded-md p-3 flex items-start gap-2"
        style={{ background: 'rgba(74,144,184,0.04)', border: '1px solid rgba(74,144,184,0.12)' }}
      >
        <Network className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#4a90b8' }} />
        <p className="text-[9px] leading-relaxed" style={{ color: TEXT.secondary }}>
          Counsel implements the A2A (Agent-to-Agent) delegation protocol. When the orchestrator
          delegates a subtask, it sends a structured handoff with full context, receives a
          delegation receipt, and tracks status until completion. Internal agents and remote APIs
          are treated uniformly.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {(
          [
            { key: 'pending', label: 'Pending', color: '#d4a054' },
            { key: 'in_progress', label: 'In Progress', color: ACCENT },
            { key: 'completed', label: 'Completed', color: '#6b8f71' },
            { key: 'failed', label: 'Failed', color: '#c45a4a' },
          ] as { key: HandoffStatus; label: string; color: string }[]
        ).map((m) => (
          <button
            key={m.key}
            onClick={() => setFilter(m.key)}
            className="rounded-md p-3 text-center transition-all hover:opacity-80"
            style={{
              background: filter === m.key ? `${m.color}10` : BG.surface,
              border: `1px solid ${filter === m.key ? `${m.color}30` : BORDER.subtle}`,
            }}
          >
            <div className="text-base font-bold font-mono" style={{ color: m.color }}>
              {counts[m.key as keyof typeof counts] ?? 0}
            </div>
            <div
              className="text-[8px] uppercase tracking-widest mt-0.5"
              style={{ color: filter === m.key ? m.color : TEXT.muted }}
            >
              {m.label}
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-0.5" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
        {(['all', 'pending', 'in_progress', 'completed', 'failed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-2 text-[9px] font-medium uppercase tracking-widest capitalize transition-colors"
            style={{
              color: filter === f ? TEXT.primary : TEXT.tertiary,
              borderBottom: filter === f ? `2px solid ${ACCENT}` : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
        <div
          className="ml-auto flex items-center px-3 text-[8px] gap-1.5"
          style={{ color: TEXT.muted }}
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Loading
            </>
          ) : apiHandoffs.length > 0 ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
              {apiHandoffs.length} live
            </>
          ) : (
            <>
              <RefreshCw className="w-2.5 h-2.5" /> Demo data
            </>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((h) => (
          <HandoffRow key={h.id} handoff={h} />
        ))}
        {filtered.length === 0 && (
          <div
            className="rounded-md py-12 flex flex-col items-center gap-3"
            style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
          >
            <Network className="w-6 h-6" style={{ color: TEXT.muted }} />
            <p className="text-[11px]" style={{ color: TEXT.tertiary }}>
              No handoffs in this state
            </p>
          </div>
        )}
      </div>

      <div
        className="rounded-md p-3.5"
        style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
      >
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-3.5 h-3.5" style={{ color: '#6b8f71' }} />
          <span className="text-[11px] font-semibold" style={{ color: TEXT.primary }}>
            A2A Delegation Receipt Schema
          </span>
        </div>
        <div
          className="rounded p-3 font-mono text-[8px] leading-relaxed"
          style={{ background: BG.elevated, color: '#6b8f71' }}
        >
          {`{
  "receipt_id":    "REC-A2A-{id}",
  "protocol":      "alloy-a2a-v1",
  "from_agent":    "alloy-orchestrator",
  "to_agent":      "{agent_id}",
  "agent_type":    "internal | remote",
  "subtask":       "{task_description}",
  "context":       { /* structured context payload */ },
  "initiated_at":  "{iso8601}",
  "completed_at":  "{iso8601} | null",
  "status":        "pending | accepted | in_progress | completed | failed",
  "evidence":      ["{evidence_item}", ...],
  "result":        "{structured_result} | null",
  "confidence":    0.0..1.0,
  "issued_by":     "alloy-covenant-engine",
  "receipt_class":  "delegation"
}`}
        </div>
      </div>
    </div>
  );
}
