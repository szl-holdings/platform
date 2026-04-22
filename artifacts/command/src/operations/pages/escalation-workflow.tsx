import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  ChevronRight,
  Clock,
  RefreshCw,
  User,
} from 'lucide-react';
import { useState } from 'react';

interface Escalation {
  id: number;
  title: string;
  description: string | null;
  signalId: number | null;
  alertId: number | null;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'escalated' | 'resolved' | 'closed';
  stage: number;
  maxStage: number;
  owner: string | null;
  assignedTo: string | null;
  escalationPath: Array<{ stage: number; owner: string; label: string }> | null;
  slaDeadlineAt: string | null;
  resolvedAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

interface EscalationsResponse {
  data: Escalation[];
  meta: { total: number; openCount: number; criticalCount: number };
}

const STATUS_CONFIG: Record<
  Escalation['status'],
  { label: string; color: string; bg: string; border: string }
> = {
  open: {
    label: 'OPEN',
    color: '#c45a4a',
    bg: 'rgba(196,90,74,0.1)',
    border: 'rgba(196,90,74,0.25)',
  },
  in_progress: {
    label: 'IN PROGRESS',
    color: '#d4a054',
    bg: 'rgba(212,160,84,0.1)',
    border: 'rgba(212,160,84,0.25)',
  },
  escalated: {
    label: 'ESCALATED',
    color: '#c8953c',
    bg: 'rgba(249,115,22,0.1)',
    border: 'rgba(249,115,22,0.25)',
  },
  resolved: {
    label: 'RESOLVED',
    color: '#6b8f71',
    bg: 'rgba(107,143,113,0.1)',
    border: 'rgba(107,143,113,0.2)',
  },
  closed: {
    label: 'CLOSED',
    color: '#6b7280',
    bg: 'rgba(107,114,128,0.1)',
    border: 'rgba(107,114,128,0.2)',
  },
};

const SEV_COLORS: Record<string, string> = {
  critical: '#c45a4a',
  high: '#c8953c',
  medium: '#d4a054',
  low: '#60a5fa',
};

function SlaTimer({ deadline, status }: { deadline: string | null; status: string }) {
  if (!deadline || ['resolved', 'closed'].includes(status)) return null;
  const now = Date.now();
  const dl = new Date(deadline).getTime();
  const diffMs = dl - now;
  const diffH = Math.floor(diffMs / 3600000);
  const diffM = Math.floor((diffMs % 3600000) / 60000);
  const isOverdue = diffMs < 0;
  const isWarning = !isOverdue && diffH < 4;
  const color = isOverdue ? '#c45a4a' : isWarning ? '#c8953c' : '#d4a054';

  return (
    <span
      className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded border"
      style={{ color, background: `${color}10`, borderColor: `${color}25` }}
    >
      <Clock className="w-2.5 h-2.5" />
      {isOverdue ? `${Math.abs(diffH)}h overdue` : `${diffH}h ${Math.abs(diffM)}m left`}
    </span>
  );
}

function StageProgress({
  stage,
  maxStage,
  path,
}: {
  stage: number;
  maxStage: number;
  path: Array<{ stage: number; owner: string; label: string }> | null;
}) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {Array.from({ length: maxStage }).map((_, i) => {
        const s = i + 1;
        const pathItem = path?.find((p) => p.stage === s);
        const isDone = s < stage;
        const isCurrent = s === stage;
        return (
          <div key={s} className="flex items-center gap-1">
            <div className="flex items-center gap-1.5">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold border"
                style={{
                  background: isDone
                    ? 'rgba(107,143,113,0.15)'
                    : isCurrent
                      ? 'rgba(212,160,84,0.15)'
                      : 'rgba(255,255,255,0.04)',
                  borderColor: isDone
                    ? 'rgba(107,143,113,0.4)'
                    : isCurrent
                      ? 'rgba(212,160,84,0.4)'
                      : 'rgba(255,255,255,0.1)',
                  color: isDone ? '#6b8f71' : isCurrent ? '#d4a054' : 'rgba(255,255,255,0.2)',
                }}
              >
                {isDone ? '✓' : s}
              </div>
              {pathItem && (
                <span
                  className="text-[9px] hidden sm:block"
                  style={{
                    color: isDone ? '#6b8f71' : isCurrent ? '#d4a054' : 'rgba(255,255,255,0.2)',
                  }}
                >
                  {pathItem.label}
                </span>
              )}
            </div>
            {s < maxStage && (
              <ChevronRight className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.1)' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function EscalationCard({ esc, onSelect }: { esc: Escalation; onSelect: () => void }) {
  const sc = STATUS_CONFIG[esc.status];
  const sevColor = SEV_COLORS[esc.severity];

  return (
    <div
      className="group rounded-xl border cursor-pointer transition-all hover:border-opacity-60 p-4"
      style={{ borderColor: sc.border, background: 'rgba(255,255,255,0.012)' }}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 flex flex-col gap-1.5 pt-0.5">
          <span
            className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border"
            style={{ color: sc.color, background: sc.bg, borderColor: sc.border }}
          >
            {sc.label}
          </span>
          <span
            className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
            style={{ color: sevColor, background: `${sevColor}12` }}
          >
            {esc.severity}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="text-sm font-semibold text-white">{esc.title}</p>
            <SlaTimer deadline={esc.slaDeadlineAt} status={esc.status} />
          </div>
          {esc.description && (
            <p
              className="text-[10px] mb-2 leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              {esc.description}
            </p>
          )}
          <StageProgress stage={esc.stage} maxStage={esc.maxStage} path={esc.escalationPath} />
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {esc.owner && (
              <span
                className="flex items-center gap-1 text-[10px]"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                <User className="w-2.5 h-2.5" /> {esc.owner}
              </span>
            )}
            {esc.assignedTo && esc.assignedTo !== esc.owner && (
              <span
                className="flex items-center gap-1 text-[10px]"
                style={{ color: 'rgba(255,255,255,0.25)' }}
              >
                <ArrowRight className="w-2.5 h-2.5" /> {esc.assignedTo}
              </span>
            )}
            <span className="text-[9px] ml-auto" style={{ color: 'rgba(255,255,255,0.2)' }}>
              {new Date(esc.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function EscalationDetail({ esc, onClose }: { esc: Escalation; onClose: () => void }) {
  const qc = useQueryClient();
  const sc = STATUS_CONFIG[esc.status];

  const updateMutation = useStandardMutation({
    mutationFn: (patch: Partial<Escalation>) =>
      apiFetch(`/lyte/escalations/${esc.id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['escalations'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/50" />
      <div
        className="w-full max-w-lg border-l flex flex-col h-full overflow-y-auto"
        style={{ background: '#0c1626', borderColor: 'rgba(255,255,255,0.08)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border"
                  style={{ color: sc.color, background: sc.bg, borderColor: sc.border }}
                >
                  {sc.label}
                </span>
                <span
                  className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                  style={{
                    color: SEV_COLORS[esc.severity],
                    background: `${SEV_COLORS[esc.severity]}12`,
                  }}
                >
                  {esc.severity}
                </span>
              </div>
              <h2 className="text-sm font-bold text-white">{esc.title}</h2>
              {esc.description && (
                <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {esc.description}
                </p>
              )}
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-white ml-4">
              ✕
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <div
              className="text-[10px] uppercase tracking-wider mb-2"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              Escalation Progress
            </div>
            <StageProgress stage={esc.stage} maxStage={esc.maxStage} path={esc.escalationPath} />
          </div>

          {esc.escalationPath && esc.escalationPath.length > 0 && (
            <div>
              <div
                className="text-[10px] uppercase tracking-wider mb-2"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                Escalation Path
              </div>
              <div className="space-y-2">
                {esc.escalationPath.map((p) => (
                  <div
                    key={p.stage}
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{
                      background:
                        p.stage === esc.stage ? 'rgba(212,160,84,0.08)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${p.stage === esc.stage ? 'rgba(212,160,84,0.2)' : 'rgba(255,255,255,0.06)'}`,
                    }}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border"
                      style={{
                        background:
                          p.stage < esc.stage
                            ? 'rgba(107,143,113,0.15)'
                            : p.stage === esc.stage
                              ? 'rgba(212,160,84,0.15)'
                              : 'rgba(255,255,255,0.04)',
                        borderColor:
                          p.stage < esc.stage
                            ? 'rgba(107,143,113,0.4)'
                            : p.stage === esc.stage
                              ? 'rgba(212,160,84,0.4)'
                              : 'rgba(255,255,255,0.1)',
                        color:
                          p.stage < esc.stage
                            ? '#6b8f71'
                            : p.stage === esc.stage
                              ? '#d4a054'
                              : 'rgba(255,255,255,0.2)',
                      }}
                    >
                      {p.stage < esc.stage ? '✓' : p.stage}
                    </div>
                    <div>
                      <div className="text-[11px] font-medium text-white">{p.label}</div>
                      <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {p.owner}
                      </div>
                    </div>
                    {p.stage === esc.stage && (
                      <span className="ml-auto text-[9px] font-bold" style={{ color: '#d4a054' }}>
                        CURRENT
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Owner', value: esc.owner ?? 'Unassigned' },
              { label: 'Assigned To', value: esc.assignedTo ?? '—' },
              { label: 'Stage', value: `${esc.stage} / ${esc.maxStage}` },
              {
                label: 'SLA Deadline',
                value: esc.slaDeadlineAt ? new Date(esc.slaDeadlineAt).toLocaleString() : 'None',
              },
            ].map((c) => (
              <div
                key={c.label}
                className="p-3 rounded-lg"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  className="text-[9px] uppercase tracking-wider mb-1"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                >
                  {c.label}
                </div>
                <div className="text-[11px] font-medium text-white">{c.value}</div>
              </div>
            ))}
          </div>

          {!['resolved', 'closed'].includes(esc.status) && (
            <div className="flex gap-2">
              {esc.status === 'open' && (
                <button
                  onClick={() => updateMutation.mutate({ status: 'in_progress', stage: esc.stage })}
                  className="flex-1 text-[11px] py-2 rounded-lg border font-medium"
                  style={{
                    color: '#d4a054',
                    borderColor: 'rgba(212,160,84,0.3)',
                    background: 'rgba(212,160,84,0.08)',
                  }}
                >
                  Begin Response
                </button>
              )}
              {esc.stage < esc.maxStage && (
                <button
                  onClick={() =>
                    updateMutation.mutate({ status: 'escalated', stage: esc.stage + 1 })
                  }
                  className="flex-1 text-[11px] py-2 rounded-lg border font-medium"
                  style={{
                    color: '#c8953c',
                    borderColor: 'rgba(249,115,22,0.3)',
                    background: 'rgba(249,115,22,0.08)',
                  }}
                >
                  Escalate Stage
                </button>
              )}
              <button
                onClick={() => updateMutation.mutate({ status: 'resolved' })}
                className="flex-1 text-[11px] py-2 rounded-lg border font-medium"
                style={{
                  color: '#6b8f71',
                  borderColor: 'rgba(107,143,113,0.3)',
                  background: 'rgba(107,143,113,0.08)',
                }}
              >
                Resolve
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EscalationWorkflow() {
  const [statusFilter, setStatusFilter] = useState('active');
  const [selected, setSelected] = useState<Escalation | null>(null);

  const params = new URLSearchParams({ limit: '100' });
  if (statusFilter !== 'all' && statusFilter !== 'active') params.set('status', statusFilter);

  const { data, isLoading, isError, refetch } = useStandardQuery({
    queryKey: ['escalations', statusFilter],
    queryFn: () => apiFetch<any>(`/lyte/escalations?${params}`),
    refetchInterval: 30000,
  });

  const rawData = Array.isArray(data) ? data : (data?.data ?? []);
  const escalations: Escalation[] =
    statusFilter === 'active'
      ? rawData.filter((e: Escalation) => ['open', 'in_progress', 'escalated'].includes(e.status))
      : rawData;

  const openCount = rawData.filter((e: Escalation) =>
    ['open', 'in_progress', 'escalated'].includes(e.status),
  ).length;
  const criticalCount = rawData.filter(
    (e: Escalation) =>
      e.severity === 'critical' && ['open', 'in_progress', 'escalated'].includes(e.status),
  ).length;
  const overdueCount = rawData.filter(
    (e: Escalation) =>
      e.slaDeadlineAt &&
      new Date(e.slaDeadlineAt) < new Date() &&
      !['resolved', 'closed'].includes(e.status),
  ).length;

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <AlertOctagon className="w-3.5 h-3.5" style={{ color: '#d4a054' }} />
            <span
              className="text-[10px] font-bold uppercase tracking-widest font-mono"
              style={{ color: '#d4a054' }}
            >
              Command · Escalation Workflow
            </span>
          </div>
          <h1 className="text-xl font-bold text-white">Escalation Workflow</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Active escalations with stage progression, SLA timers, and owner accountability.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg border"
          style={{ color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.1)' }}
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.015)' }}
      >
        <div className="flex items-stretch">
          {[
            {
              label: 'Active Escalations',
              value: openCount.toString(),
              color: openCount > 0 ? '#c45a4a' : 'rgba(255,255,255,0.3)',
              pulse: openCount > 0,
            },
            {
              label: 'Critical',
              value: criticalCount.toString(),
              color: criticalCount > 0 ? '#c45a4a' : 'rgba(255,255,255,0.3)',
            },
            {
              label: 'SLA Overdue',
              value: overdueCount.toString(),
              color: overdueCount > 0 ? '#c8953c' : 'rgba(255,255,255,0.3)',
            },
            { label: 'Total', value: rawData.length.toString(), color: 'rgba(255,255,255,0.4)' },
          ].map((c, i) => (
            <div
              key={c.label}
              className="flex-1 px-4 py-3 text-center"
              style={{ borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
            >
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <span className="text-lg font-bold font-mono" style={{ color: c.color }}>
                  {c.value}
                </span>
                {(c as any).pulse && (
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-[#c45a4a] shrink-0" />
                )}
              </div>
              <div
                className="text-[9px] font-medium uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                {c.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['active', 'all', 'open', 'in_progress', 'escalated', 'resolved', 'closed'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className="text-[10px] px-3 py-1.5 rounded-lg border font-medium capitalize"
            style={{
              background: statusFilter === s ? 'rgba(212,160,84,0.1)' : 'transparent',
              color: statusFilter === s ? '#d4a054' : 'rgba(255,255,255,0.35)',
              borderColor: statusFilter === s ? 'rgba(212,160,84,0.3)' : 'rgba(255,255,255,0.08)',
            }}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-5 h-5 border-2 border-[#d4a054] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {isError && (
        <div
          className="p-4 rounded-xl border flex items-center gap-3"
          style={{ borderColor: 'rgba(196,90,74,0.2)', background: 'rgba(196,90,74,0.06)' }}
        >
          <AlertTriangle className="w-4 h-4 text-[#c45a4a]" />
          <p className="text-sm text-[#c45a4a]">Failed to load escalations.</p>
        </div>
      )}

      {!isLoading && !isError && escalations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <CheckCircle className="w-8 h-8" style={{ color: 'rgba(107,143,113,0.3)' }} />
          <p className="text-sm text-slate-400">No escalations in this filter.</p>
          <p className="text-[11px] text-slate-500">
            Use the admin seeder to populate escalation data.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {escalations.map((esc) => (
          <EscalationCard key={esc.id} esc={esc} onSelect={() => setSelected(esc)} />
        ))}
      </div>

      {selected && <EscalationDetail esc={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
