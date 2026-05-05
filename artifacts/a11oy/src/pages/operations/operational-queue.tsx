import { api, type CommandAction, type CommandIncident, type CommandSignal } from '../../lib/operations/api';
import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { Button } from '@szl-holdings/shared-ui/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@szl-holdings/shared-ui/ui/select';
import { toast } from '@szl-holdings/shared-ui/ui/sonner';
import { cn } from '@szl-holdings/shared-ui/utils';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckSquare,
  ChevronRight,
  Clock,
  Eye,
  Filter,
  Radio,
  RefreshCw,
  User,
  X,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

type EntityType = 'signal' | 'incident' | 'action';
type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';
type SortDir = 'asc' | 'desc';
type SortBy = 'severity' | 'createdAt';

interface QueueItem {
  id: string;
  entityId: number;
  entityType: EntityType;
  title: string;
  severity: SeverityLevel;
  status: string;
  priority?: string;
  assignee?: string | null;
  source?: string;
  createdAt: string;
  updatedAt?: string;
  rationale?: string | null;
  nextAction?: string | null;
  escalationPaths?: EscalationEntry[];
  auditHistory?: AuditEntry[];
}

interface EscalationEntry {
  targetRole: string;
  reason?: string | null;
  escalatedAt: string;
}

interface AuditEntry {
  state?: string;
  action?: string;
  changedAt?: string;
  escalatedAt?: string;
  rationale?: string | null;
  reason?: string | null;
}

// ── Severity helpers ──────────────────────────────────────────────────────────

const SEVERITY_RANK: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  info: 0,
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
  high: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
  medium: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  low: 'text-sky-400 border-sky-500/30 bg-sky-500/10',
  info: 'text-slate-400 border-slate-500/30 bg-slate-500/10',
};

const ENTITY_COLORS: Record<EntityType, string> = {
  signal: 'text-[#d4a054]',
  incident: 'text-rose-400',
  action: 'text-[#8b7ac8]',
};

const ENTITY_ICONS: Record<EntityType, typeof Radio> = {
  signal: Radio,
  incident: AlertTriangle,
  action: CheckSquare,
};

// ── Adapters: REST → QueueItem ────────────────────────────────────────────────

function signalToQueueItem(s: CommandSignal): QueueItem {
  const meta = (s.metadata ?? {}) as Record<string, unknown>;
  const sev = (
    ['critical', 'high', 'medium', 'low', 'info'].includes(s.severity) ? s.severity : 'medium'
  ) as SeverityLevel;
  const escalations = Array.isArray(meta.escalations)
    ? (meta.escalations as EscalationEntry[])
    : [];
  const auditHistory = Array.isArray(meta.auditHistory) ? (meta.auditHistory as AuditEntry[]) : [];
  return {
    id: `signal-${s.id}`,
    entityId: s.id,
    entityType: 'signal',
    title: s.title,
    severity: sev,
    status: s.status,
    assignee: typeof meta.assignee === 'string' ? meta.assignee : null,
    source: s.source,
    createdAt: s.createdAt,
    rationale: typeof meta.rationale === 'string' ? meta.rationale : null,
    nextAction: typeof meta.nextAction === 'string' ? meta.nextAction : null,
    escalationPaths: escalations,
    auditHistory,
  };
}

function incidentToQueueItem(i: CommandIncident): QueueItem {
  const meta = (i.metadata ?? {}) as Record<string, unknown>;
  const sev = (
    ['critical', 'high', 'medium', 'low'].includes(i.severity) ? i.severity : 'high'
  ) as SeverityLevel;
  const escalations = Array.isArray(meta.escalations)
    ? (meta.escalations as EscalationEntry[])
    : [];
  const auditHistory = Array.isArray(meta.auditHistory) ? (meta.auditHistory as AuditEntry[]) : [];
  return {
    id: `incident-${i.id}`,
    entityId: i.id,
    entityType: 'incident',
    title: i.title,
    severity: sev,
    status: i.status,
    assignee: i.assignee ?? null,
    createdAt: i.createdAt,
    updatedAt: i.updatedAt,
    escalationPaths: escalations,
    auditHistory,
  };
}

function actionToQueueItem(a: CommandAction): QueueItem {
  const history = Array.isArray(a.stateHistory) ? (a.stateHistory as AuditEntry[]) : [];
  const escalations = history
    .filter((h) => h.state === 'escalated')
    .map((h) => ({
      targetRole: ((h as Record<string, unknown>).targetRole as string) ?? 'unspecified',
      reason: h.reason ?? null,
      escalatedAt: h.changedAt ?? new Date().toISOString(),
    }));
  const sev: SeverityLevel =
    a.priority === 'urgent'
      ? 'critical'
      : a.priority === 'high'
        ? 'high'
        : a.priority === 'medium'
          ? 'medium'
          : 'low';
  return {
    id: `action-${a.id}`,
    entityId: a.id,
    entityType: 'action',
    title: a.title,
    severity: sev,
    status: a.state,
    priority: a.priority,
    assignee: a.assignedTo ?? a.owner ?? null,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
    escalationPaths: escalations,
    auditHistory: history,
  };
}

// ── Detail Pane ───────────────────────────────────────────────────────────────

function DetailPane({ item, onClose }: { item: QueueItem; onClose: () => void }) {
  const Icon = ENTITY_ICONS[item.entityType];
  const qc = useQueryClient();

  const assignSignalMut = useStandardMutation({
    mutationFn: (assignee: string) => api.signals.assign(item.entityId, assignee),
    onSuccess: () => {
      toast.success('Signal assigned');
      qc.invalidateQueries({ queryKey: ['lyte-queue'] });
    },
    onError: () => toast.error('Failed to assign signal'),
  });

  const escalateSignalMut = useStandardMutation({
    mutationFn: () => api.signals.escalate(item.entityId, undefined, 'Escalated from queue'),
    onSuccess: () => {
      toast.success('Signal escalated');
      qc.invalidateQueries({ queryKey: ['lyte-queue'] });
    },
    onError: () => toast.error('Failed to escalate signal'),
  });

  const assignIncidentMut = useStandardMutation({
    mutationFn: (assignee: string) => api.incidents.update(item.entityId, { assignee }),
    onSuccess: () => {
      toast.success('Incident assigned');
      qc.invalidateQueries({ queryKey: ['lyte-queue'] });
    },
    onError: () => toast.error('Failed to assign incident'),
  });

  const escalateIncidentMut = useStandardMutation({
    mutationFn: () => api.incidents.update(item.entityId, { status: 'investigating' }),
    onSuccess: () => {
      toast.success('Incident escalated to investigating');
      qc.invalidateQueries({ queryKey: ['lyte-queue'] });
    },
    onError: () => toast.error('Failed to escalate incident'),
  });

  const assignActionMut = useStandardMutation({
    mutationFn: (assignedTo: string) => api.actions.update(item.entityId, { assignedTo }),
    onSuccess: () => {
      toast.success('Action assigned');
      qc.invalidateQueries({ queryKey: ['lyte-queue'] });
    },
    onError: () => toast.error('Failed to assign action'),
  });

  const escalateActionMut = useStandardMutation({
    mutationFn: () => api.actions.update(item.entityId, { state: 'escalated' }),
    onSuccess: () => {
      toast.success('Action escalated');
      qc.invalidateQueries({ queryKey: ['lyte-queue'] });
    },
    onError: () => toast.error('Failed to escalate action'),
  });

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-[#0d1117] border-l border-white/[0.07] z-50 flex flex-col shadow-2xl">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
        <div className="flex items-center gap-2">
          <Icon className={cn('w-4 h-4', ENTITY_COLORS[item.entityType])} />
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            {item.entityType}
          </span>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 leading-snug">{item.title}</h2>
          <div className="flex items-center gap-2 mt-2">
            <Badge
              className={cn(
                'text-[10px] border px-1.5 py-0.5',
                SEVERITY_COLORS[item.severity] ?? SEVERITY_COLORS.medium,
              )}
            >
              {item.severity}
            </Badge>
            <Badge
              variant="outline"
              className="text-[10px] border-white/10 text-slate-400 px-1.5 py-0.5"
            >
              {item.status}
            </Badge>
          </div>
        </div>

        {item.rationale && (
          <div>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">
              Triage Rationale
            </p>
            <p className="text-xs text-slate-300">{item.rationale}</p>
          </div>
        )}

        {item.nextAction && (
          <div>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">
              Recommended Next Action
            </p>
            <p className="text-xs text-slate-300">{item.nextAction}</p>
          </div>
        )}

        <div>
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">
            Ownership
          </p>
          <div className="flex items-center gap-2">
            <User className="w-3 h-3 text-slate-500" />
            <span className="text-xs text-slate-300">{item.assignee ?? 'Unassigned'}</span>
          </div>
          {item.entityType === 'signal' && (
            <Button
              size="sm"
              variant="outline"
              className="mt-2 h-6 text-[10px] border-white/10 text-slate-400"
              onClick={() => assignSignalMut.mutate('ops-lead')}
              disabled={assignSignalMut.isPending}
            >
              Assign to ops-lead
            </Button>
          )}
          {item.entityType === 'incident' && (
            <Button
              size="sm"
              variant="outline"
              className="mt-2 h-6 text-[10px] border-white/10 text-slate-400"
              onClick={() => assignIncidentMut.mutate('ops-lead')}
              disabled={assignIncidentMut.isPending}
            >
              Assign to ops-lead
            </Button>
          )}
          {item.entityType === 'action' && (
            <Button
              size="sm"
              variant="outline"
              className="mt-2 h-6 text-[10px] border-white/10 text-slate-400"
              onClick={() => assignActionMut.mutate('ops-lead')}
              disabled={assignActionMut.isPending}
            >
              Assign to ops-lead
            </Button>
          )}
        </div>

        {item.escalationPaths && item.escalationPaths.length > 0 && (
          <div>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-2">
              Escalation Path
            </p>
            <div className="space-y-1.5">
              {item.escalationPaths.map((e, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-white/[0.03] rounded p-2">
                  <div className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-400 text-[9px] flex items-center justify-center font-bold mt-0.5 shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-slate-300">{e.targetRole}</p>
                    {e.reason && <p className="text-[10px] text-slate-500 mt-0.5">{e.reason}</p>}
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      {new Date(e.escalatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {item.auditHistory && item.auditHistory.length > 0 && (
          <div>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-2">
              Audit Timeline
            </p>
            <div className="space-y-1.5">
              {item.auditHistory.map((h, idx) => {
                const ts = h.changedAt ?? h.escalatedAt ?? '';
                return (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-600 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-[11px] text-slate-300">
                        {h.state ? `State → ${h.state}` : (h.action ?? 'Updated')}
                      </p>
                      {(h.rationale ?? h.reason) && (
                        <p className="text-[10px] text-slate-500">{h.rationale ?? h.reason}</p>
                      )}
                      {ts && (
                        <p className="text-[10px] text-slate-600">
                          {new Date(ts).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="pt-2 space-y-2">
          {item.entityType === 'signal' && (
            <Button
              size="sm"
              variant="outline"
              className="w-full h-7 text-[11px] border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
              onClick={() => escalateSignalMut.mutate()}
              disabled={escalateSignalMut.isPending}
            >
              Escalate Signal
            </Button>
          )}
          {item.entityType === 'incident' &&
            item.status !== 'investigating' &&
            item.status !== 'resolved' &&
            item.status !== 'closed' && (
              <Button
                size="sm"
                variant="outline"
                className="w-full h-7 text-[11px] border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                onClick={() => escalateIncidentMut.mutate()}
                disabled={escalateIncidentMut.isPending}
              >
                Escalate to Investigating
              </Button>
            )}
          {item.entityType === 'action' &&
            item.status !== 'escalated' &&
            item.status !== 'resolved' &&
            item.status !== 'dismissed' && (
              <Button
                size="sm"
                variant="outline"
                className="w-full h-7 text-[11px] border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                onClick={() => escalateActionMut.mutate()}
                disabled={escalateActionMut.isPending}
              >
                Escalate Action
              </Button>
            )}
        </div>

        <div className="text-[10px] text-slate-600">
          <Clock className="w-3 h-3 inline mr-1" />
          Created {new Date(item.createdAt).toLocaleString()}
          {item.updatedAt && <span> · Updated {new Date(item.updatedAt).toLocaleString()}</span>}
        </div>
      </div>
    </div>
  );
}

// ── Queue Row ─────────────────────────────────────────────────────────────────

function QueueRow({
  item,
  onSelect,
  selected,
}: {
  item: QueueItem;
  onSelect: (item: QueueItem) => void;
  selected: boolean;
}) {
  const Icon = ENTITY_ICONS[item.entityType];
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 border-b border-white/[0.05] cursor-pointer transition-colors hover:bg-white/[0.03]',
        selected && 'bg-white/[0.05] border-l-2 border-l-[#d4a054]',
      )}
      onClick={() => onSelect(item)}
    >
      <div className={cn('shrink-0', ENTITY_COLORS[item.entityType])}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-200 truncate">{item.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-slate-500">{item.source ?? item.entityType}</span>
          {item.assignee && (
            <>
              <span className="text-[10px] text-slate-600">·</span>
              <User className="w-2.5 h-2.5 text-slate-600" />
              <span className="text-[10px] text-slate-500">{item.assignee}</span>
            </>
          )}
          {item.escalationPaths && item.escalationPaths.length > 0 && (
            <>
              <span className="text-[10px] text-slate-600">·</span>
              <Zap className="w-2.5 h-2.5 text-rose-400" />
              <span className="text-[10px] text-rose-400">escalated</span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge
          className={cn(
            'text-[9px] border px-1 py-0',
            SEVERITY_COLORS[item.severity] ?? SEVERITY_COLORS.medium,
          )}
        >
          {item.severity}
        </Badge>
        <Badge variant="outline" className="text-[9px] border-white/10 text-slate-500 px-1 py-0">
          {item.status}
        </Badge>
        <ChevronRight className="w-3 h-3 text-slate-600" />
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function OperationalQueue() {
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('severity');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selected, setSelected] = useState<QueueItem | null>(null);
  const qc = useQueryClient();

  const { data: signals = [], isLoading: sigLoading } = useStandardQuery({
    queryKey: ['lyte-queue', 'signals'],
    queryFn: () => api.signals.list(),
    refetchInterval: 30_000,
  });

  const { data: incidents = [], isLoading: incLoading } = useStandardQuery({
    queryKey: ['lyte-queue', 'incidents'],
    queryFn: () => api.incidents.list(),
    refetchInterval: 30_000,
  });

  const { data: actions = [], isLoading: actLoading } = useStandardQuery({
    queryKey: ['lyte-queue', 'actions'],
    queryFn: () => api.actions.list(),
    refetchInterval: 30_000,
  });

  const isLoading = sigLoading || incLoading || actLoading;

  const allItems: QueueItem[] = [
    ...signals.map(signalToQueueItem),
    ...incidents.map(incidentToQueueItem),
    ...actions.map(actionToQueueItem),
  ];

  const filtered = allItems
    .filter((item) => entityFilter === 'all' || item.entityType === entityFilter)
    .filter((item) => severityFilter === 'all' || item.severity === severityFilter)
    .sort((a, b) => {
      if (sortBy === 'severity') {
        const ar = SEVERITY_RANK[a.severity] ?? 0;
        const br = SEVERITY_RANK[b.severity] ?? 0;
        if (ar !== br) return sortDir === 'desc' ? br - ar : ar - br;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      const at = new Date(a.createdAt).getTime();
      const bt = new Date(b.createdAt).getTime();
      return sortDir === 'desc' ? bt - at : at - bt;
    });

  const counts = {
    total: allItems.length,
    critical: allItems.filter((i) => i.severity === 'critical').length,
    high: allItems.filter((i) => i.severity === 'high').length,
    escalated: allItems.filter((i) => (i.escalationPaths?.length ?? 0) > 0).length,
    unassigned: allItems.filter((i) => !i.assignee).length,
  };

  return (
    <div className="flex h-full">
      <div className={cn('flex-1 flex flex-col min-h-0', selected && 'mr-[420px]')}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/[0.07]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-semibold text-slate-100">Operational Queue</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Unified view of signals, incidents, and actions — sorted by priority
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1.5 text-slate-400 hover:text-slate-200"
              onClick={() => qc.invalidateQueries({ queryKey: ['lyte-queue'] })}
            >
              <RefreshCw className="w-3 h-3" />
              <span className="text-[11px]">Refresh</span>
            </Button>
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-5 gap-2">
            {[
              { label: 'Total Items', value: counts.total, color: 'text-slate-300' },
              { label: 'Critical', value: counts.critical, color: 'text-rose-400' },
              { label: 'High', value: counts.high, color: 'text-orange-400' },
              { label: 'Escalated', value: counts.escalated, color: 'text-rose-400' },
              { label: 'Unassigned', value: counts.unassigned, color: 'text-amber-400' },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="bg-white/[0.03] rounded-lg px-3 py-2 border border-white/[0.06]"
              >
                <p className={cn('text-lg font-semibold leading-none', kpi.color)}>{kpi.value}</p>
                <p className="text-[10px] text-slate-500 mt-1">{kpi.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-white/[0.05]">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="h-7 w-32 text-[11px] bg-white/[0.03] border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="signal">Signals</SelectItem>
              <SelectItem value="incident">Incidents</SelectItem>
              <SelectItem value="action">Actions</SelectItem>
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="h-7 w-32 text-[11px] bg-white/[0.03] border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <div className="ml-auto flex items-center gap-2">
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
              <SelectTrigger className="h-7 w-28 text-[11px] bg-white/[0.03] border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="severity">By Severity</SelectItem>
                <SelectItem value="createdAt">By Date</SelectItem>
              </SelectContent>
            </Select>
            <button
              className="h-7 w-7 flex items-center justify-center rounded border border-white/10 text-slate-400 hover:text-slate-200 bg-white/[0.03] transition-colors"
              onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
              title={sortDir === 'desc' ? 'Descending' : 'Ascending'}
            >
              {sortDir === 'desc' ? (
                <ArrowDown className="w-3 h-3" />
              ) : (
                <ArrowUp className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>

        {/* Queue List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div
                className="w-5 h-5 border-2 rounded-full animate-spin"
                style={{ borderColor: 'rgba(212,160,84,0.2)', borderTopColor: '#d4a054' }}
              />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <Eye className="w-5 h-5 text-slate-600" />
              <p className="text-xs text-slate-500">No items match the current filter</p>
            </div>
          ) : (
            filtered.map((item) => (
              <QueueRow
                key={item.id}
                item={item}
                onSelect={(i) => setSelected(selected?.id === i.id ? null : i)}
                selected={selected?.id === item.id}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-2 border-t border-white/[0.07] flex items-center justify-between">
          <p className="text-[10px] text-slate-600">
            {filtered.length} of {allItems.length} items
          </p>
          <p className="text-[10px] text-slate-600">Auto-refreshes every 30s</p>
        </div>
      </div>

      {selected && <DetailPane item={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
